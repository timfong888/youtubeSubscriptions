/**
 * Example usage of the YouTube Subscriptions API
 * This file demonstrates how to use the API endpoints
 */

const axios = require('axios');

// Replace with your Firebase project URL
const BASE_URL = 'http://localhost:5001/YOUR_PROJECT_ID/us-central1';

/**
 * Step 1: Get OAuth authorization URL
 */
async function getAuthorizationUrl() {
  try {
    const response = await axios.get(`${BASE_URL}/getAuthUrl`);
    console.log('Authorization URL:', response.data.authUrl);
    console.log('Visit this URL to authorize the application');
    return response.data.authUrl;
  } catch (error) {
    console.error('Error getting auth URL:', error.response?.data || error.message);
  }
}

/**
 * Step 2: Exchange authorization code for tokens
 * @param {string} authCode - Authorization code from OAuth callback
 */
async function exchangeAuthCode(authCode) {
  try {
    const response = await axios.post(`${BASE_URL}/exchangeToken`, {
      code: authCode
    });
    
    console.log('Tokens received:', response.data.tokens);
    return response.data.tokens;
  } catch (error) {
    console.error('Error exchanging auth code:', error.response?.data || error.message);
  }
}

/**
 * Step 3: Get subscription videos
 * @param {string} accessToken - OAuth access token
 * @param {Object} options - Query options
 */
async function getSubscriptionVideos(accessToken, options = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/getSubscriptionVideos`, {
      maxResults: options.maxResults || 10,
      publishedAfter: options.publishedAfter,
      excludeList: options.excludeList || []
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Found ${response.data.data.count} videos:`);
    response.data.data.videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} by ${video.channelName}`);
      console.log(`   Published: ${video.publishedAt}`);
      console.log(`   Duration: ${video.duration}`);
      console.log(`   URL: https://youtube.com/watch?v=${video.videoId}`);
      console.log('');
    });
    
    return response.data.data.videos;
  } catch (error) {
    console.error('Error getting videos:', error.response?.data || error.message);
  }
}

/**
 * Example workflow
 */
async function exampleWorkflow() {
  console.log('=== YouTube Subscriptions API Example ===\n');
  
  // Step 1: Get authorization URL
  console.log('Step 1: Getting authorization URL...');
  const authUrl = await getAuthorizationUrl();
  
  if (!authUrl) {
    console.log('Failed to get authorization URL');
    return;
  }
  
  console.log('\nStep 2: Visit the URL above and authorize the application');
  console.log('After authorization, you will get a code in the callback URL');
  console.log('Use that code in the next step\n');
  
  // In a real application, you would:
  // 1. Redirect user to authUrl
  // 2. Handle the callback to get the authorization code
  // 3. Exchange the code for tokens
  // 4. Use the access token to make API calls
  
  // Example with dummy values (replace with real values):
  /*
  const authCode = 'YOUR_AUTH_CODE_FROM_CALLBACK';
  const tokens = await exchangeAuthCode(authCode);
  
  if (tokens && tokens.access_token) {
    console.log('Step 3: Getting subscription videos...');
    await getSubscriptionVideos(tokens.access_token, {
      maxResults: 5,
      publishedAfter: '2023-01-01T00:00:00Z'
    });
  }
  */
}

// Run the example
if (require.main === module) {
  exampleWorkflow();
}

module.exports = {
  getAuthorizationUrl,
  exchangeAuthCode,
  getSubscriptionVideos
};
