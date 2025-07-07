const {google} = require('googleapis');

/**
 * Get videos from user's YouTube subscriptions using Activities API (quota optimized)
 * Uses activities.list (1 quota unit) instead of search.list (100 quota units) per channel
 * @param {string} accessToken - OAuth access token
 * @param {Object} options - Query options
 * @param {number} options.maxResults - Number of videos to return (default: 25)
 * @param {number} options.maxChannels - Maximum number of channels to process (default: 15, max: 50)
 * @param {string} options.publishedBefore - Latest date filter (ISO 8601 format)
 * @param {Array<string>} options.excludeList - List of video IDs to exclude
 * @return {Promise<Array>} Array of video objects
 */
async function getSubscriptionVideos(accessToken, options = {}) {
  try {
    const {
      maxResults = 25,
      maxChannels = 15, // Emergency quota protection: limit channels processed
      publishedBefore,
      excludeList = [],
    } = options;

    // Validate maxChannels to prevent quota abuse
    const channelLimit = Math.min(Math.max(maxChannels, 1), 50);

    // Create authenticated client directly with access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({access_token: accessToken});
    const youtube = google.youtube({version: 'v3', auth});

    // First, get user's subscriptions
    const subscriptionsResponse = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      maxResults: Math.min(channelLimit * 2, 50), // Get more than needed to allow selection
    });

    if (!subscriptionsResponse.data.items || subscriptionsResponse.data.items.length === 0) {
      return [];
    }

    // Extract channel IDs from subscriptions and limit to prevent quota abuse
    const allChannelIds = subscriptionsResponse.data.items.map(
      (subscription) => subscription.snippet.resourceId.channelId
    );

    // QUOTA PROTECTION: Limit channels processed to prevent quota exhaustion
    const channelIds = allChannelIds.slice(0, channelLimit);

    console.log(`Processing ${channelIds.length} channels out of ${allChannelIds.length} subscriptions (quota protection)`);

    // Track quota usage for monitoring
    let quotaUsed = 1; // subscriptions.list = 1 quota unit

    // Get recent videos from subscribed channels
    const allVideos = [];
    
    // Process channels in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < channelIds.length; i += batchSize) {
      const batch = channelIds.slice(i, i + batchSize);
      
      const activityPromises = batch.map(async (channelId) => {
        try {
          const activityParams = {
            part: 'snippet,contentDetails',
            channelId: channelId,
            maxResults: Math.min(maxResults, 10), // Limit per channel
          };

          if (publishedBefore) {
            activityParams.publishedBefore = publishedBefore;
          }

          // Use activities.list instead of search.list (1 quota unit vs 100!)
          const activitiesResponse = await youtube.activities.list(activityParams);
          quotaUsed += 1; // activities.list = 1 quota unit (vs 100 for search.list!)

          // Filter for upload activities only and convert to search-like format
          const uploadActivities = (activitiesResponse.data.items || []).filter(
            activity => activity.snippet.type === 'upload'
          );

          // Convert activities format to match expected video format
          return uploadActivities.map(activity => ({
            id: { videoId: activity.contentDetails.upload.videoId },
            snippet: {
              title: activity.snippet.title,
              description: activity.snippet.description,
              channelTitle: activity.snippet.channelTitle,
              publishedAt: activity.snippet.publishedAt,
              thumbnails: activity.snippet.thumbnails,
            }
          }));
        } catch (error) {
          console.error(`Error fetching activities for channel ${channelId}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(activityPromises);
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

        quotaUsed += 1; // videos.list = 1 quota unit per call

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
      thumbnailUrl: video.snippet.thumbnails?.high?.url || 
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

    // Log quota usage for monitoring
    console.log(`OPTIMIZED quota usage: ${quotaUsed} units (channels: ${channelIds.length}, videos: ${formattedVideos.length})`);
    console.log(`Using Activities API - saved ~${(channelIds.length * 99)} quota units vs Search API!`);

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
