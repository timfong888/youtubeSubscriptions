# YouTube Subscriptions API

A Firebase Functions API for retrieving videos from a user's YouTube subscriptions using the YouTube Data API v3.

## Features

- OAuth 2.0 authentication with Google/YouTube
- Retrieve videos from user's subscribed channels
- Sort videos by upload date (most recent first)
- Filter by date and exclude specific videos
- Configurable number of results
- Comprehensive error handling

## API Endpoints

### 1. Get OAuth Authorization URL
**GET** `/getAuthUrl`

Returns the Google OAuth authorization URL for users to grant access.

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "message": "Visit this URL to authorize the application"
}
```

### 2. Exchange Authorization Code for Tokens
**POST** `/exchangeToken`

Exchange the authorization code received from OAuth callback for access tokens.

**Request Body:**
```json
{
  "code": "authorization_code_from_callback"
}
```

**Response:**
```json
{
  "success": true,
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "scope": "...",
    "token_type": "Bearer",
    "expiry_date": 1234567890
  },
  "message": "Tokens retrieved successfully"
}
```

### 3. Refresh Access Token
**POST** `/refreshToken`

Refresh an expired access token using the refresh token.

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### 4. Get Subscription Videos (Main API)
**POST** `/getSubscriptionVideos`

Retrieve videos from the user's YouTube subscriptions.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "maxResults": 25,
  "publishedAfter": "2023-01-01T00:00:00Z",
  "excludeList": ["videoId1", "videoId2"]
}
```

**Parameters:**
- `maxResults` (optional): Number of videos to return (1-100, default: 25)
- `publishedAfter` (optional): ISO 8601 date string to filter videos published after this date
- `excludeList` (optional): Array of video IDs to exclude from results

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "videoId": "dQw4w9WgXcQ",
        "title": "Video Title",
        "description": "Video description...",
        "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        "duration": "PT3M33S",
        "channelName": "Channel Name",
        "publishedAt": "2023-01-15T10:30:00Z",
        "language": "en"
      }
    ],
    "count": 25,
    "requestedCount": 25
  },
  "message": "Videos retrieved successfully"
}
```

## Setup and Configuration

### Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed (`npm install -g firebase-tools`)
3. **Google Cloud Project** with YouTube Data API v3 enabled
4. **OAuth 2.0 credentials** from Google Cloud Console

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs (e.g., `http://localhost:3000/oauth/callback`)
5. Note down the Client ID and Client Secret

## Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/timfong888/youtubeSubscriptions.git
cd youtubeSubscriptions

# Install dependencies
npm install
cd functions
npm install
cd ..
```

### 2. Configure Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init

# Set your Firebase project ID in .firebaserc
# Edit .firebaserc and replace "your-firebase-project-id" with your actual project ID
```

### 3. Set Environment Variables

```bash
# Set Google OAuth credentials as Firebase environment variables
firebase functions:config:set google.client_id="your_client_id"
firebase functions:config:set google.client_secret="your_client_secret"
firebase functions:config:set google.redirect_uri="your_redirect_uri"
```

### 4. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:getSubscriptionVideos
```

### 5. Local Development

```bash
# Download environment config for local development
firebase functions:config:get > functions/.runtimeconfig.json

# Start local emulator
firebase emulators:start --only functions

# Functions will be available at:
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/FUNCTION_NAME
```

## Testing

### 1. Test OAuth Flow

```bash
# Get authorization URL
curl -X GET http://localhost:5001/YOUR_PROJECT_ID/us-central1/getAuthUrl

# Visit the returned URL, authorize, and get the code from callback
# Exchange code for tokens
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/exchangeToken \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_AUTHORIZATION_CODE"}'
```

### 2. Test Main API

```bash
# Get subscription videos
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/getSubscriptionVideos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 10,
    "publishedAfter": "2023-01-01T00:00:00Z",
    "excludeList": []
  }'
```

## Error Handling

The API includes comprehensive error handling for:
- Invalid or expired access tokens (401)
- API quota exceeded (429)
- Invalid request parameters (400)
- Internal server errors (500)

## Security Notes

- Never commit OAuth credentials to version control
- Use Firebase environment variables for sensitive configuration
- Implement proper CORS policies for production
- Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**: Check that OAuth credentials are properly set in Firebase config
2. **"Quota exceeded" error**: YouTube API has daily quotas; check usage in Google Cloud Console
3. **"Token expired" error**: Use the refresh token endpoint to get a new access token
4. **CORS errors**: Ensure proper CORS configuration for your frontend domain

### Logs

```bash
# View function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only getSubscriptionVideos
```

## License

MIT License
