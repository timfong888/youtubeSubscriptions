# YouTube Subscriptions API

A Firebase Functions API for retrieving videos from a user's YouTube subscriptions using the YouTube Data API v3.

**🔗 Integrates with existing [googleOauth](https://github.com/timfong888/googleOauth) service for authentication**

## Features

- **Seamless OAuth Integration** - Uses existing googleOauth service for token management
- **Quota Optimized** - 99% quota reduction with optimized endpoint
- Retrieve videos from user's subscribed channels
- Sort videos by upload date (most recent first)
- Filter by date and exclude specific videos
- Configurable number of results and channels
- Automatic token refresh via OAuth service
- Comprehensive error handling
- Quota usage monitoring and logging

## API Endpoints

### Prerequisites: OAuth Authentication

**⚠️ Important:** Users must first authenticate via the [googleOauth service](https://github.com/timfong888/googleOauth) before using this API.

1. **User Authentication Flow:**
   - Direct users to your googleOauth service: `GET /auth/google?userId=USER_ID`
   - Users complete OAuth flow and tokens are stored in Firestore
   - Use the same `userId` in this API

### Main API Endpoints

**Health Check:**
**GET** `/` - Service health check

**Get Subscription Videos:**
**POST** `/videos`

🚀 **OPTIMIZED: Now uses Activities API with 99% quota reduction!**
Retrieve videos from the user's YouTube subscriptions using efficient Activities API instead of expensive Search API.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user123",
  "maxResults": 25,
  "maxChannels": 15,
  "publishedBefore": "2023-01-01T00:00:00Z",
  "excludeList": ["videoId1", "videoId2"]
}
```

**Parameters:**
- `userId` (required): User ID that matches the one used in googleOauth service
- `maxResults` (optional): Number of videos to return (1-100, default: 25)
- `publishedBefore` (optional): ISO 8601 date string to filter videos published before this date
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

## 🚀 Quota Optimization

### The Problem
The original implementation consumed quota rapidly:
- **5,000+ quota units per request** for users with 50 subscriptions
- Daily quota of 10,000 units exhausted in just 2 requests!

### The Solution
**Main `/videos` endpoint now optimized with 99% quota reduction:**

| Implementation | API Used | Quota per Channel | 50 Channels Total |
|----------------|----------|-------------------|-------------------|
| **Before** | search.list | 100 units | 5,000 units |
| **After** | activities.list | 1 unit | 50 units |

**Result: 99% quota savings!**

### Usage
- **All requests**: Use `/videos` endpoint (now optimized)
- **Safety**: Set `maxChannels: 15` (default) to prevent quota exhaustion
- **Heavy usage**: Increase `maxChannels` up to 50 as needed

## 📱 FlutterFlow Integration

### API Endpoint Configuration

**Create API Call** in FlutterFlow pointing to:
`https://us-central1-sophia-db784.cloudfunctions.net/youtubeSubscriptions/videos`

### Request Body Setup

```json
{
  "userId": "[USER_ID]",
  "accessToken": "[FROM_OAUTH_INTERCEPTOR]",
  "maxResults": 25,
  "publishedBefore": "2023-01-01T00:00:00Z",
  "excludeList": []
}
```

### 📅 Date Formatting for `publishedBefore`

The `publishedBefore` parameter **must** be in YouTube Data API v3 compatible format (RFC 3339/ISO 8601).

#### **Required Custom Format:** `yyyy-MM-ddTHH:mm:ssZ`

#### **FlutterFlow Implementation Options:**

**1. Current Time:**
- Set from Variable → Global Properties → Current Time
- Choose "Custom Format"
- Enter: `yyyy-MM-ddTHH:mm:ssZ`
- Results in: `2023-01-01T00:00:00Z`

**2. Relative Dates (e.g., 30 days ago):**
```dart
// Custom function to calculate past date
dateTimeFormat('yyyy-MM-ddTHH:mm:ssZ',
  DateTime.now().subtract(Duration(days: 30)))
```

**3. User-Selected Dates:**
```dart
// From DateTime picker widget
dateTimeFormat('yyyy-MM-ddTHH:mm:ssZ', selectedDate)
```

#### **Format Examples:**
- `2023-01-01T00:00:00Z` - January 1st, 2023 at midnight UTC
- `2023-12-31T23:59:59Z` - December 31st, 2023 at 11:59:59 PM UTC
- `2023-06-15T14:30:00Z` - June 15th, 2023 at 2:30 PM UTC

#### **⚠️ Important Notes:**
- **Always use UTC timezone** (Z suffix)
- **Include the 'T' separator** between date and time
- **Use 24-hour format** for hours (HH)
- **Zero-pad** all numeric values (MM, dd, HH, mm, ss)

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

## 🚀 Critical Deployment Guide

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project with YouTube Data API v3 enabled

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

### 2. Configure Firebase Project

```bash
# Login to Firebase
firebase login

# Create .firebaserc file (not in git - create locally)
echo '{
  "projects": {
    "default": "your-project-id"
  }
}' > .firebaserc

# Replace "your-project-id" with your actual Firebase project ID
```

### 3. Update Dependencies (If Needed)

```bash
cd functions
# Update to latest firebase-functions if prompted
npm install --save firebase-functions@latest
cd ..
```

### 4. Deploy Function

```bash
# Deploy the function
firebase deploy --only functions:youtubeSubscriptions

# Function will be available at:
# https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/youtubeSubscriptions
```

### 5. Verify Deployment

```bash
# Test health check
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/youtubeSubscriptions/

# Expected response:
# {"status":"OK","message":"YouTube Subscriptions API is running",...}
```

## 🎯 Critical API Usage

### Live Endpoint
```
https://us-central1-sophia-db784.cloudfunctions.net/youtubeSubscriptions/videos
```

### Required Request Format
```json
{
  "userId": "user123",
  "accessToken": "ya29.a0AfH6SMC...",
  "maxResults": 25,
  "publishedBefore": "2023-01-01T00:00:00Z",
  "excludeList": ["videoId1", "videoId2"]
}
```

### Response Format
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
    "count": 1,
    "requestedCount": 25,
    "userId": "user123"
  },
  "message": "Videos retrieved successfully"
}
```

### 5. Local Development (2nd Generation)

```bash
# Ensure .env file exists in functions directory
cd functions
echo 'OAUTH_SERVICE_URL=https://us-central1-sophia-db784.cloudfunctions.net/googleOauth/auth/google/refresh' > .env
cd ..

# Start local emulator
firebase emulators:start --only functions

# Function endpoints will be available at:
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/videos
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
# Health check
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/

# Get subscription videos (requires valid accessToken)
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/videos \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testUser123",
    "accessToken": "ya29.a0AfH6SMC...",
    "maxResults": 10,
    "publishedBefore": "2023-01-01T00:00:00Z",
    "excludeList": []
  }'
```

**Note:** The `publishedBefore` date must be in format `yyyy-MM-ddTHH:mm:ssZ` (RFC 3339/ISO 8601)

### 3. Test Error Scenarios

```bash
# Test without accessToken
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/videos \
  -H "Content-Type: application/json" \
  -d '{"userId": "testUser123", "maxResults": 5}'

# Test without userId
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/videos \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "token", "maxResults": 5}'

# Test with invalid date format
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/youtubeSubscriptions/videos \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testUser123",
    "accessToken": "ya29.a0AfH6SMC...",
    "publishedBefore": "2023-01-01",
    "maxResults": 5
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
