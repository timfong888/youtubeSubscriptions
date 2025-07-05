const {google} = require('googleapis');
const functions = require('firebase-functions');

/**
 * Google OAuth configuration
 * These should be set as Firebase environment variables
 */
const oauth2Client = new google.auth.OAuth2(
  functions.config().google?.client_id,
  functions.config().google?.client_secret,
  functions.config().google?.redirect_uri || 'http://localhost:3000/oauth/callback'
);

/**
 * Generate OAuth URL for user authorization
 * @return {string} Authorization URL
 */
function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth callback
 * @return {Promise<Object>} Token information
 */
async function getAccessToken(code) {
  try {
    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to get access token');
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @return {Promise<Object>} New token information
 */
async function refreshAccessToken(refreshToken) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    const {credentials} = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Get authenticated OAuth2 client
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token (optional)
 * @return {Object} Authenticated OAuth2 client
 */
function getAuthenticatedClient(accessToken, refreshToken = null) {
  const client = new google.auth.OAuth2(
    functions.config().google?.client_id,
    functions.config().google?.client_secret,
    functions.config().google?.redirect_uri
  );
  
  const credentials = {access_token: accessToken};
  if (refreshToken) {
    credentials.refresh_token = refreshToken;
  }
  
  client.setCredentials(credentials);
  return client;
}

module.exports = {
  getAuthUrl,
  getAccessToken,
  refreshAccessToken,
  getAuthenticatedClient,
};
