const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const {getAuthUrl, getAccessToken, refreshAccessToken} = require('./googleOauth');
const {getSubscriptionVideos} = require('./youtubeSubscriptions');

/**
 * HTTP function to get OAuth authorization URL
 */
exports.getAuthUrl = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    try {
      const authUrl = getAuthUrl();
      res.json({
        success: true,
        authUrl: authUrl,
        message: 'Visit this URL to authorize the application',
      });
    } catch (error) {
      console.error('Error getting auth URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authorization URL',
      });
    }
  });
});

/**
 * HTTP function to exchange authorization code for access token
 */
exports.exchangeToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed. Use POST.',
        });
      }

      const {code} = req.body;
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code is required',
        });
      }

      const tokens = await getAccessToken(code);
      res.json({
        success: true,
        tokens: tokens,
        message: 'Tokens retrieved successfully',
      });
    } catch (error) {
      console.error('Error exchanging token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to exchange authorization code for tokens',
      });
    }
  });
});

/**
 * HTTP function to refresh access token
 */
exports.refreshToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed. Use POST.',
        });
      }

      const {refreshToken} = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const tokens = await refreshAccessToken(refreshToken);
      res.json({
        success: true,
        tokens: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh access token',
      });
    }
  });
});

/**
 * Main HTTP function to get videos from user's YouTube subscriptions
 */
exports.getSubscriptionVideos = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed. Use POST.',
        });
      }

      // Extract access token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization header with Bearer token is required',
        });
      }

      const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Extract options from request body
      const {
        maxResults = 25,
        publishedAfter,
        excludeList = [],
      } = req.body;

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

      const options = {
        maxResults,
        publishedAfter,
        excludeList,
      };

      const videos = await getSubscriptionVideos(accessToken, options);

      res.json({
        success: true,
        data: {
          videos: videos,
          count: videos.length,
          requestedCount: maxResults,
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
      });
    }
  });
});
