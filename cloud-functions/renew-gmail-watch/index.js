/**
 * Cloud Function to automatically renew Gmail Watch
 * Triggered by Cloud Scheduler every 6 days
 *
 * Environment Variables (set in Cloud Function):
 *   - GCP_PROJECT_ID: autoland-monitoring
 *   - PUBSUB_TOPIC: gmail-notifications
 *   - OAUTH_REFRESH_TOKEN: <refresh_token từ lần đầu setup>
 *   - GOOGLE_CLIENT_ID: <OAuth2 Client ID>
 *   - GOOGLE_CLIENT_SECRET: <OAuth2 Client Secret>
 *
 * Usage:
 *   1. Deploy Cloud Function theo hướng dẫn trong README.md
 *   2. Tạo Cloud Scheduler job để trigger function này mỗi 6 ngày
 *   3. Function sẽ tự động renew Gmail Watch trước khi hết hạn
 *
 * Author: Vietjet AMO ICT Department
 * Created: 2025-01-08
 */

const { google } = require('googleapis');

/**
 * Main Cloud Function handler
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 */
exports.renewGmailWatch = async (req, res) => {
  try {
    // Validate environment variables
    const projectId = process.env.GCP_PROJECT_ID;
    const topicName = process.env.PUBSUB_TOPIC || 'gmail-notifications';
    const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }

    if (!refreshToken) {
      throw new Error('OAUTH_REFRESH_TOKEN environment variable is required. Please run setup-gmail-watch.js to get refresh token.');
    }

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required');
    }

    console.log('Starting Gmail Watch renewal...');
    console.log('Project:', projectId);
    console.log('Topic:', topicName);

    // Create OAuth2 client with refresh token
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Refresh access token using refresh token
    console.log('Refreshing access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    console.log('Access token refreshed successfully');

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const topicPath = `projects/${projectId}/topics/${topicName}`;

    // Setup Gmail watch
    console.log('Setting up Gmail Watch for topic:', topicPath);
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: topicPath,
      },
    });

    const expirationDate = new Date(parseInt(response.data.expiration));
    const daysUntilExpiration = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));

    console.log('✅ Gmail Watch renewed successfully!');
    console.log('History ID:', response.data.historyId);
    console.log('Expiration:', expirationDate.toISOString());
    console.log('Days until expiration:', daysUntilExpiration);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Gmail Watch renewed successfully',
      data: {
        historyId: response.data.historyId,
        expiration: expirationDate.toISOString(),
        daysUntilExpiration: daysUntilExpiration,
        topic: topicPath,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error renewing Gmail Watch:', error);

    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    // Return error response
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Helper function to manually test the function
 * Can be used for local testing
 */
async function testRenewGmailWatch() {
  // Load environment variables from .env file if testing locally
  require('dotenv').config();

  const mockReq = {};
  const mockRes = {
    status: (code) => ({
      json: (data) => console.log(`Response (${code}):`, JSON.stringify(data, null, 2))
    })
  };

  await exports.renewGmailWatch(mockReq, mockRes);
}

// Export for testing
if (require.main === module) {
  testRenewGmailWatch().catch(console.error);
}
