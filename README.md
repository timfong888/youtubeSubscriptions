# YouTube Subscriptions API

A Firebase Functions API for retrieving videos from a user's YouTube subscriptions using the YouTube Data API v3.

**🔗 Integrates with existing [googleOauth](https://github.com/timfong888/googleOauth) service for authentication**

## Features

- **Seamless OAuth Integration** - Uses existing googleOauth service for token management
- Retrieve videos from user's subscribed channels
- Sort videos by upload date (most recent first)
- Filter by date and exclude specific videos
- Configurable number of results
- Automatic token refresh via OAuth service
- Comprehensive error handling

## API Endpoints

### Prerequisites: OAuth Authentication

**⚠️ Important:** Users must first authenticate via the [googleOauth service](https://github.com/timfong888/googleOauth) before using this API.

1. **User Authentication Flow:**
   - Direct users to your googleOauth service: `GET /auth/google?userId=USER_ID`
   - Users complete OAuth flow and tokens are stored in Firestore
   - Use the same `userId` in this API

### Main API Endpoint: Get Subscription Videos
**POST** `/getSubscriptionVideos`

Retrieve videos from the user's YouTube subscriptions.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user123",
  "maxResults": 25,
  "publishedAfter": "2023-01-01T00:00:00Z",
  "excludeList": ["videoId1", "videoId2"]
}
```

**Parameters:**
- `userId` (required): User ID that matches the one used in googleOauth service
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
    "requestedCount": 25,
    "userId": "user123"
  },
  "message": "Videos retrieved successfully"
}
```

## Setup and Configuration

### Prerequisites

1. **Node.js 18+** installed
2. **Firebase CLI** installed (`npm install -g firebase-tools`)
3. **Existing [googleOauth service](https://github.com/timfong888/googleOauth) deployed and configured**
4. **Same Firebase project** as your googleOauth service (for shared Firestore access)
5. **YouTube Data API v3 enabled** in your Google Cloud Project

### Integration Requirements

This service integrates with your existing googleOauth service by:
- **Reading tokens from the same Firestore collection** (`users/{userId}/googleTokens`)
- **Calling your OAuth refresh endpoint** when tokens expire
- **Using the same user validation** system

**⚠️ Important:** Ensure both services use the same Firebase project for shared Firestore access.

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

For **2nd Generation Functions**, set environment variables in your `.env` file:

```bash
# Create .env file in functions directory
cd functions
echo 'OAUTH_SERVICE_URL=https://YOUR_OAUTH_SERVICE_URL/auth/google/refresh' > .env

# Example:
# echo 'OAUTH_SERVICE_URL=https://us-central1-your-project.cloudfunctions.net/googleOauth/auth/google/refresh' > .env
```

**Alternative: Set via Firebase CLI (for production)**
```bash
firebase functions:secrets:set OAUTH_SERVICE_URL
# Enter your OAuth service URL when prompted
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
# Ensure .env file exists in functions directory with your OAuth service URL
cd functions
echo 'OAUTH_SERVICE_URL=https://YOUR_OAUTH_SERVICE_URL/auth/google/refresh' > .env
cd ..

# Start local emulator
firebase emulators:start --only functions

# Functions will be available at:
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/getSubscriptionVideos
```

## Testing

### 1. Authenticate User via googleOauth Service

First, ensure a user is authenticated via your existing googleOauth service:

```bash
# Direct user to OAuth service (replace with your actual service URL)
curl "https://YOUR_OAUTH_SERVICE_URL/auth/google?userId=testUser123"

# User completes OAuth flow, tokens are stored in Firestore
```

### 2. Test YouTube Subscriptions API

```bash
# Get subscription videos using the authenticated userId
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/getSubscriptionVideos \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testUser123",
    "maxResults": 10,
    "publishedAfter": "2023-01-01T00:00:00Z",
    "excludeList": []
  }'
```

### 3. Test Error Scenarios

```bash
# Test with non-existent user
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/getSubscriptionVideos \
  -H "Content-Type: application/json" \
  -d '{"userId": "nonexistentUser", "maxResults": 5}'

# Test without userId
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/getSubscriptionVideos \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 5}'
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
