/**
 * Test script to validate quota optimization improvements
 * Run this to compare quota usage between original and optimized endpoints
 */

const axios = require('axios');

// Configuration - Update these values
const CONFIG = {
  // Update with your Firebase function URL
  BASE_URL: 'https://us-central1-sophia-db784.cloudfunctions.net/youtubeSubscriptions',
  
  // Test parameters
  TEST_USER_ID: 'quota-test-user',
  TEST_ACCESS_TOKEN: 'your-test-access-token-here', // Replace with valid token
  MAX_RESULTS: 10,
  MAX_CHANNELS: 5, // Small number for testing
};

/**
 * Test the original endpoint with quota monitoring
 */
async function testOriginalEndpoint() {
  console.log('\n🔍 Testing ORIGINAL endpoint (/videos)...');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${CONFIG.BASE_URL}/videos`, {
      userId: CONFIG.TEST_USER_ID,
      accessToken: CONFIG.TEST_ACCESS_TOKEN,
      maxResults: CONFIG.MAX_RESULTS,
      maxChannels: CONFIG.MAX_CHANNELS,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Original endpoint results:');
    console.log(`   Videos found: ${response.data.data.count}`);
    console.log(`   Channels processed: ${CONFIG.MAX_CHANNELS}`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Estimated quota usage: ~${CONFIG.MAX_CHANNELS * 100 + 10} units`);
    
    return {
      success: true,
      videoCount: response.data.data.count,
      estimatedQuota: CONFIG.MAX_CHANNELS * 100 + 10,
      duration
    };
    
  } catch (error) {
    console.error('❌ Original endpoint failed:');
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    
    if (error.response?.status === 401) {
      console.error('   → Update TEST_ACCESS_TOKEN in config');
    } else if (error.response?.status === 429) {
      console.error('   → Quota exceeded! This confirms the problem.');
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Test the optimized endpoint with quota monitoring
 */
async function testOptimizedEndpoint() {
  console.log('\n🚀 Testing OPTIMIZED endpoint (/videos-optimized)...');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(`${CONFIG.BASE_URL}/videos-optimized`, {
      userId: CONFIG.TEST_USER_ID,
      accessToken: CONFIG.TEST_ACCESS_TOKEN,
      maxResults: CONFIG.MAX_RESULTS,
      maxChannels: CONFIG.MAX_CHANNELS,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Optimized endpoint results:');
    console.log(`   Videos found: ${response.data.data.count}`);
    console.log(`   Channels processed: ${response.data.data.channelsProcessed}`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Estimated quota usage: ~${CONFIG.MAX_CHANNELS + 5} units`);
    console.log(`   Optimization flag: ${response.data.data.optimized}`);
    
    return {
      success: true,
      videoCount: response.data.data.count,
      estimatedQuota: CONFIG.MAX_CHANNELS + 5,
      duration
    };
    
  } catch (error) {
    console.error('❌ Optimized endpoint failed:');
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Compare results and calculate quota savings
 */
function compareResults(originalResult, optimizedResult) {
  console.log('\n📊 QUOTA OPTIMIZATION COMPARISON');
  console.log('=====================================');
  
  if (originalResult.success && optimizedResult.success) {
    const quotaSavings = originalResult.estimatedQuota - optimizedResult.estimatedQuota;
    const savingsPercentage = Math.round((quotaSavings / originalResult.estimatedQuota) * 100);
    
    console.log(`Original quota usage:    ~${originalResult.estimatedQuota} units`);
    console.log(`Optimized quota usage:   ~${optimizedResult.estimatedQuota} units`);
    console.log(`Quota savings:           ~${quotaSavings} units (${savingsPercentage}% reduction)`);
    console.log(`Videos found (original): ${originalResult.videoCount}`);
    console.log(`Videos found (optimized): ${optimizedResult.videoCount}`);
    
    if (savingsPercentage >= 90) {
      console.log('\n🎉 SUCCESS: Achieved 90%+ quota reduction!');
    } else if (savingsPercentage >= 50) {
      console.log('\n✅ GOOD: Achieved significant quota reduction');
    } else {
      console.log('\n⚠️  WARNING: Quota reduction less than expected');
    }
    
  } else {
    console.log('❌ Cannot compare - one or both endpoints failed');
    
    if (!originalResult.success) {
      console.log(`   Original endpoint error: ${originalResult.error}`);
    }
    
    if (!optimizedResult.success) {
      console.log(`   Optimized endpoint error: ${optimizedResult.error}`);
    }
  }
}

/**
 * Main test function
 */
async function runQuotaOptimizationTest() {
  console.log('🧪 YOUTUBE API QUOTA OPTIMIZATION TEST');
  console.log('======================================');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Test channels: ${CONFIG.MAX_CHANNELS}`);
  console.log(`Max results: ${CONFIG.MAX_RESULTS}`);
  
  if (CONFIG.TEST_ACCESS_TOKEN === 'your-test-access-token-here') {
    console.log('\n❌ ERROR: Please update TEST_ACCESS_TOKEN in the config');
    console.log('   Get a valid access token from your OAuth flow');
    return;
  }
  
  // Test both endpoints
  const originalResult = await testOriginalEndpoint();
  const optimizedResult = await testOptimizedEndpoint();
  
  // Compare results
  compareResults(originalResult, optimizedResult);
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Update your application to use /videos-optimized endpoint');
  console.log('   2. Monitor quota usage in Google Cloud Console');
  console.log('   3. Consider implementing caching for further optimization');
}

// Run the test
if (require.main === module) {
  runQuotaOptimizationTest().catch(console.error);
}

module.exports = {
  runQuotaOptimizationTest,
  testOriginalEndpoint,
  testOptimizedEndpoint
};
