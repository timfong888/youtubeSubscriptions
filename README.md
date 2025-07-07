# YouTube Subscriptions API

Firebase Functions API for retrieving videos from YouTube subscriptions with 99% quota optimization.

**🔗 Integrates with [googleOauth](https://github.com/timfong888/googleOauth) service**

## Features

- **99% Quota Reduction** - Activities API vs Search API (50 vs 5,000 units)
- **OAuth Integration** - Uses existing googleOauth service
- **Smart Limits** - Configurable channels/results with quota protection
- **Real-time Monitoring** - Comprehensive quota usage logging
- **Zero Breaking Changes** - Drop-in optimization

## 🚀 Quick Deploy

```bash
firebase deploy --only functions:youtubeSubscriptions
```

## API Endpoints

**Health Check:** `GET /`

**Get Videos:** `POST /videos` (Activities API - 99% quota optimized)

### Prerequisites
Authenticate via [googleOauth service](https://github.com/timfong888/googleOauth):
`GET /auth/google?userId=USER_ID`

### Request Format
```json
POST /videos
{
  "userId": "user123",
  "accessToken": "ya29...",
  "maxResults": 25,
  "maxChannels": 15,
  "publishedBefore": "2023-01-01T00:00:00Z",
  "excludeList": ["videoId1", "videoId2"]
}
```

**Parameters:**
- `userId`, `accessToken` (required)
- `maxResults` (default: 25), `maxChannels` (default: 15, max: 50)
- `publishedBefore`, `excludeList` (optional)

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

| Implementation | API | Quota/Channel | 50 Channels |
|----------------|-----|---------------|-------------|
| **Before** | search.list | 100 units | 5,000 units |
| **After** | activities.list | 1 unit | 50 units |

**Result: 99% quota savings (200+ requests vs 2 requests per day)**

## 📱 FlutterFlow Integration

**Endpoint:** `https://us-central1-sophia-db784.cloudfunctions.net/youtubeSubscriptions/videos`

**Request Body:**
```json
{
  "userId": "[USER_ID]",
  "accessToken": "[FROM_OAUTH_INTERCEPTOR]",
  "maxResults": 25,
  "maxChannels": 15,
  "publishedBefore": "2023-01-01T00:00:00Z",
  "excludeList": []
}
```

**Setup:** POST API call, handle errors: 401 (auth), 429 (quota), 500 (error)

**Date Format:** `publishedBefore` uses ISO 8601: `yyyy-MM-ddTHH:mm:ssZ`

## Setup

**Prerequisites:**
- Node.js 18+, Firebase CLI
- [googleOauth service](https://github.com/timfong888/googleOauth) deployed
- YouTube Data API v3 enabled

**Installation:**
```bash
git clone https://github.com/timfong888/youtubeSubscriptions.git
cd youtubeSubscriptions
npm install && cd functions && npm install && cd ..
firebase login
firebase deploy --only functions:youtubeSubscriptions
```

## Testing

**Test quota optimization:**
```bash
node test-quota-optimization.js
```

**Expected:** ~50 quota units vs ~5,000 units (99% reduction)

## Local Development

```bash
firebase emulators:start --only functions
```

## Error Handling

- 401: Invalid/expired access token
- 429: API quota exceeded
- 400: Invalid parameters
- 500: Internal server error

## License

MIT
