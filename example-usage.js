/**
 * Example usage of the YouTube Subscriptions API
 * This file demonstrates how to use the API with existing googleOauth service
 */

const axios = require('axios');

// Replace with your Firebase project URLs
const YOUTUBE_API_URL = 'http://localhost:5001/YOUR_PROJECT_ID/us-central1';
const OAUTH_SERVICE_URL = 'https://YOUR_OAUTH_SERVICE_URL'; // Your existing googleOauth service

/**
 * Step 1: Direct user to existing OAuth service for authentication
 * @param {string} userId - User ID to authenticate
 */
async function initiateOAuthFlow(userId) {
  const authUrl = `${OAUTH_SERVICE_URL}/auth/google?userId=${userId}`;
  console.log('Direct user to OAuth service:', authUrl);
  console.log('User will complete OAuth flow and tokens will be stored in Firestore');
  return authUrl;
}

/**
 * Step 2: Get subscription videos using userId (tokens managed automatically)
 * @param {string} userId - User ID (same as used in OAuth service)
 * @param {Object} options - Query options
 */
async function getSubscriptionVideos(userId, options = {}) {
  try {
    const response = await axios.post(`${YOUTUBE_API_URL}/getSubscriptionVideos`, {
      userId: userId,
      maxResults: options.maxResults || 10,
      publishedAfter: options.publishedAfter,
      excludeList: options.excludeList || []
    }, {
      headers: {
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
 * Example workflow integrating with existing googleOauth service
 */
async function exampleWorkflow() {
  console.log('=== YouTube Subscriptions API Example (with googleOauth integration) ===\n');

  const userId = 'testUser123'; // Replace with actual user ID

  // Step 1: Direct user to OAuth service for authentication
  console.log('Step 1: Initiating OAuth flow via existing googleOauth service...');
  const authUrl = await initiateOAuthFlow(userId);

  console.log('\nStep 2: User visits OAuth URL and completes authentication');
  console.log('Tokens are automatically stored in Firestore by googleOauth service\n');

  console.log('Step 3: Once user is authenticated, get subscription videos...');

  // Example usage (uncomment after user completes OAuth):
  /*
  try {
    const videos = await getSubscriptionVideos(userId, {
      maxResults: 5,
      publishedAfter: '2023-01-01T00:00:00Z'
    });
    console.log('Success! Retrieved videos for user:', userId);
  } catch (error) {
    if (error.response?.data?.authRequired) {
      console.log('User needs to authenticate first via:', authUrl);
    } else {
      console.error('Error:', error.response?.data || error.message);
    }
  }
  */
}

// Run the example
if (require.main === module) {
  exampleWorkflow();
}

module.exports = {
  initiateOAuthFlow,
  getSubscriptionVideos
};
