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

// Simplified implementation - accessToken provided directly from FlutterFlow

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

    // Extract parameters from request body
    const {
      userId,
      accessToken,
      maxResults = 25,
      publishedAfter,
      excludeList = [],
    } = req.body;

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
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

    // Use the accessToken provided directly from FlutterFlow
    const validAccessToken = accessToken;

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
