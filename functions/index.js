// index.js - Stable v1 functions (compatible with existing infrastructure)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors')({origin: true});
const {getSubscriptionVideos} = require('./youtubeSubscriptions');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Add middleware for parsing JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Helper function to get user tokens from Firestore
 * Integrates with the existing googleOauth service token storage
 */
async function getUserTokens(userId) {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const tokens = userData.googleTokens;

    if (!tokens || !tokens.accessToken) {
      throw new Error('No OAuth tokens found for user');
    }

    return tokens;
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw error;
  }
}

/**
 * Helper function to check if token needs refresh and call OAuth service if needed
 */
async function ensureValidToken(userId, tokens) {
  try {
    // Check if token is expired (with 5-minute buffer)
    const now = new Date();
    const expiryDate = new Date(tokens.expiryDate);
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (expiryDate.getTime() - now.getTime() > bufferTime) {
      // Token is still valid
      return tokens.accessToken;
    }

    // Token needs refresh - call the existing OAuth service
    // For 2nd gen functions, use environment variables
    const oauthServiceUrl = process.env.OAUTH_SERVICE_URL ||
                           'https://us-central1-sophia-db784.cloudfunctions.net/googleOauth/auth/google/refresh';

    const fetch = (await import('node-fetch')).default;
    const refreshResponse = await fetch(oauthServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: tokens.expiryDate,
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token via OAuth service');
    }

    const refreshData = await refreshResponse.json();
    return refreshData.accessToken;

  } catch (error) {
    console.error('Error ensuring valid token:', error);
    throw new Error('Token validation/refresh failed. User may need to re-authenticate.');
  }
}

// Health check endpoint
app.get('/', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      message: 'YouTube Subscriptions API is running',
      timestamp: new Date().toISOString(),
      service: 'youtubeSubscriptions',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Service health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Main endpoint for getting subscription videos
app.post('/videos', async (req, res) => {
  try {
    console.log('YouTube subscriptions request received:', {
      body: req.body,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });

    // Extract userId from request body (required for OAuth integration)
    const {
      userId,
      maxResults = 25,
      publishedAfter,
      excludeList = [],
    } = req.body;

    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required (must match user in googleOauth service)',
      });
    }

    // Validate maxResults
    if (maxResults < 1 || maxResults > 100) {
      return res.status(400).json({
        success: false,
        error: 'maxResults must be between 1 and 100',
      });
    }

    // Validate publishedAfter format if provided
    if (publishedAfter) {
      const date = new Date(publishedAfter);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'publishedAfter must be a valid ISO 8601 date string',
        });
      }
    }

    // Validate excludeList
    if (!Array.isArray(excludeList)) {
      return res.status(400).json({
        success: false,
        error: 'excludeList must be an array of video IDs',
      });
    }

    // Get user tokens from Firestore (same storage as googleOauth service)
    const tokens = await getUserTokens(userId);

    // Ensure token is valid, refresh if needed via OAuth service
    const validAccessToken = await ensureValidToken(userId, tokens);

    const options = {
      maxResults,
      publishedAfter,
      excludeList,
    };

    const videos = await getSubscriptionVideos(validAccessToken, options);

    console.log('YouTube subscriptions request completed:', {
      userId: userId,
      videoCount: videos.length,
      requestedCount: maxResults,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        videos: videos,
        count: videos.length,
        requestedCount: maxResults,
        userId: userId,
      },
      message: 'Videos retrieved successfully',
    });

  } catch (error) {
    console.error('Error getting subscription videos:', error);

    // Handle specific error types
    if (error.message.includes('User not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please ensure user exists in googleOauth service.',
      });
    }

    if (error.message.includes('No OAuth tokens found')) {
      return res.status(401).json({
        success: false,
        error: 'No OAuth tokens found. User needs to authenticate via googleOauth service first.',
        authRequired: true,
      });
    }

    if (error.message.includes('Token validation/refresh failed')) {
      return res.status(401).json({
        success: false,
        error: 'Token expired and refresh failed. User needs to re-authenticate.',
        authRequired: true,
      });
    }

    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired access token',
        authRequired: true,
      });
    }

    if (error.message.includes('quota')) {
      return res.status(429).json({
        success: false,
        error: 'YouTube API quota exceeded',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription videos',
      details: error.message,
      userId: req.body?.userId,
      timestamp: new Date().toISOString()
    });
  }
});

// Export the Express app as a 1st generation Firebase Function (stable)
exports.youtubeSubscriptions = functions.https.onRequest(app);
