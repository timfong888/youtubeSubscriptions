const {google} = require('googleapis');

/**
 * Get videos from user's YouTube subscriptions
 * @param {string} accessToken - OAuth access token
 * @param {Object} options - Query options
 * @param {number} options.maxResults - Number of videos to return (default: 25)
 * @param {string} options.publishedBefore - Latest date filter (ISO 8601 format)
 * @param {Array<string>} options.excludeList - List of video IDs to exclude
 * @return {Promise<Array>} Array of video objects
 */
async function getSubscriptionVideos(accessToken, options = {}) {
  try {
    const {
      maxResults = 25,
      publishedBefore,
      excludeList = [],
    } = options;

    // Create authenticated client directly with access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({access_token: accessToken});
    const youtube = google.youtube({version: 'v3', auth});

    // First, get user's subscriptions
    const subscriptionsResponse = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: 50, // Get up to 50 subscriptions
    });

    if (!subscriptionsResponse.data.items || subscriptionsResponse.data.items.length === 0) {
      return [];
    }

    // Extract channel IDs from subscriptions
    const channelIds = subscriptionsResponse.data.items.map(
      (subscription) => subscription.snippet.resourceId.channelId
    );

    // Get recent videos from subscribed channels
    const allVideos = [];
    
    // Process channels in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize);
      
      const searchPromises = batch.map(async (channelId) => {
        try {
          const searchParams = {
            part: 'snippet',
            channelId: channelId,
            type: 'video',
            order: 'date',
            maxResults: Math.min(maxResults, 10), // Limit per channel
          };

          if (publishedBefore) {
            searchParams.publishedBefore = publishedBefore;
          }

          const searchResponse = await youtube.search.list(searchParams);
          return searchResponse.data.items || [];
        } catch (error) {
          console.error(`Error fetching videos for channel ${channelId}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(searchPromises);
      batchResults.forEach((videos) => {
        allVideos.push(...videos);
      });
    }

    // Filter out excluded videos
    const filteredVideos = allVideos.filter(
      (video) => !excludeList.includes(video.id.videoId)
    );

    // Get detailed video information including duration
    const videoIds = filteredVideos.map((video) => video.id.videoId);
    
    if (videoIds.length === 0) {
      return [];
    }

    // Get video details in batches (API allows up to 50 IDs per request)
    const detailedVideos = [];
    const detailBatchSize = 50;
    
    for (let i = 0; i < videoIds.length; i += detailBatchSize) {
      const batch = videoIds.slice(i, i + detailBatchSize);
      
      try {
        const videosResponse = await youtube.videos.list({
          part: 'snippet,contentDetails',
          id: batch.join(','),
        });

        if (videosResponse.data.items) {
          detailedVideos.push(...videosResponse.data.items);
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
      }
    }

    // Format the response
    const formattedVideos = detailedVideos.map((video) => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnaillUrl: video.snippet.thumbnails?.high?.url || 
                   video.snippet.thumbnails?.medium?.url || 
                   video.snippet.thumbnails?.default?.url,
      duration: video.contentDetails.duration,
      channelName: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      language: video.snippet.defaultLanguage || 
               video.snippet.defaultAudioLanguage || 'unknown',
    }));

    // Sort by published date (descending - most recent first)
    formattedVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Return only the requested number of videos
    return formattedVideos.slice(0, maxResults);

  } catch (error) {
    console.error('Error getting subscription videos:', error);
    throw new Error(`Failed to get subscription videos: ${error.message}`);
  }
}

module.exports = {
  getSubscriptionVideos,
};
