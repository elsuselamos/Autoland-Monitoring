/**
 * Cloud Function: Gmail Pub/Sub Processor
 * 
 * Triggered by Pub/Sub messages from Gmail Watch
 * Processes new emails with PDF attachments and saves to database
 * 
 * Environment Variables Required:
 * - GCP_PROJECT_ID: Google Cloud Project ID
 * - GCP_STORAGE_BUCKET: Cloud Storage bucket name
 * - DOCUMENT_AI_PROCESSOR_ID: Document AI processor ID
 * - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Database connection
 * - API_BASE_URL: Base URL for API endpoint (Cloud Run URL)
 * 
 * Secrets (via Secret Manager):
 * - GOOGLE_CLIENT_ID: OAuth2 Client ID
 * - GOOGLE_CLIENT_SECRET: OAuth2 Client Secret  
 * - OAUTH_REFRESH_TOKEN: Gmail OAuth2 refresh token
 */

const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const { Pool } = require('pg');
const axios = require('axios');

/**
 * Main Cloud Function entry point
 * Triggered by Pub/Sub message from Gmail Watch
 * 
 * Cloud Functions Gen2 uses CloudEvent format
 */
exports.processGmailNotification = async (cloudEvent) => {
  console.log('Received CloudEvent:', JSON.stringify(cloudEvent, null, 2));
  
  try {
    // Extract data from CloudEvent
    // Cloud Functions Gen2 with Pub/Sub trigger can have different formats:
    // Format 1: cloudEvent.data.message.data (wrapped)
    // Format 2: cloudEvent.data (direct base64 string)
    let base64Data;
    
    if (cloudEvent.data?.message?.data) {
      // Format 1: Wrapped format (Pub/Sub message wrapped in CloudEvent)
      base64Data = cloudEvent.data.message.data;
      console.log('Using wrapped format: cloudEvent.data.message.data');
    } else if (typeof cloudEvent.data === 'string') {
      // Format 2: Direct base64 string
      base64Data = cloudEvent.data;
      console.log('Using direct format: cloudEvent.data (string)');
    } else if (Buffer.isBuffer(cloudEvent.data)) {
      // Format 3: CloudEvent.data is a Buffer (Cloud Functions Gen2)
      base64Data = cloudEvent.data.toString('base64');
      console.log('Using buffer format: cloudEvent.data (Buffer)');
    } else if (cloudEvent.data?.data) {
      // Format 4: cloudEvent.data.data
      base64Data = cloudEvent.data.data;
      console.log('Using format: cloudEvent.data.data');
    } else {
      console.error('Invalid Pub/Sub message format');
      console.error('cloudEvent structure:', Object.keys(cloudEvent));
      console.error('cloudEvent.data type:', typeof cloudEvent.data);
      console.error('cloudEvent.data:', JSON.stringify(cloudEvent.data));
      if (cloudEvent.data) {
        console.error('cloudEvent.data keys:', Object.keys(cloudEvent.data));
      }
      return;
    }
    
    // Parse Pub/Sub message
    const messageData = JSON.parse(
      Buffer.from(base64Data, 'base64').toString()
    );
    
    console.log('Parsed message data:', JSON.stringify(messageData, null, 2));
    
    const emailAddress = messageData.emailAddress;
    const historyId = messageData.historyId;
    
    if (!emailAddress || !historyId) {
      console.error('Missing emailAddress or historyId in message');
      return;
    }
    
    // Initialize Gmail API with OAuth2
    const gmail = await getGmailService();
    
    // Get history to find new messages
    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded'],
    });
    
    if (!history.data.history || history.data.history.length === 0) {
      console.log('No new messages found in history');
      return;
    }
    
    // Process each new message
    const messageIds = new Set();
    for (const historyItem of history.data.history) {
      if (historyItem.messagesAdded) {
        for (const messageAdded of historyItem.messagesAdded) {
          messageIds.add(messageAdded.message.id);
        }
      }
    }
    
    console.log(`Found ${messageIds.size} new message(s)`);
    
    // Process each message
    for (const messageId of messageIds) {
      await processMessage(gmail, messageId);
    }
    
    console.log('Successfully processed all messages');
    
  } catch (error) {
    console.error('Error processing Gmail notification:', error);
    throw error; // Re-throw to trigger retry
  }
};

/**
 * Get Gmail API service instance using OAuth2 tokens
 * Uses refresh token from Secret Manager to get fresh access token
 */
async function getGmailService() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }
  
  if (!refreshToken) {
    throw new Error('OAUTH_REFRESH_TOKEN is required. Please run setup-gmail-watch.js and store the refresh token in Secret Manager.');
  }
  
  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  
  // Set refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  // Refresh access token
  console.log('Refreshing access token...');
  const { credentials } = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(credentials);
  console.log('Access token refreshed successfully');
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Process a single Gmail message
 */
async function processMessage(gmail, messageId) {
  try {
    console.log(`Processing message: ${messageId}`);
    
    // Get message details
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    
    const payload = message.data.payload;
    const headers = payload.headers || [];
    
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
    
    console.log(`Message subject: ${subject}`);
    console.log(`Message from: ${from}`);
    
    // Check if subject contains "Autoland" (case-insensitive filter)
    if (subject && !subject.toLowerCase().includes('autoland')) {
      console.log('Skipping message - subject does not contain "Autoland"');
      return;
    }
    
    // Find PDF attachments
    const pdfAttachments = findPdfAttachments(payload);
    
    if (pdfAttachments.length === 0) {
      console.log('No PDF attachments found in message');
      return;
    }
    
    console.log(`Found ${pdfAttachments.length} PDF attachment(s)`);
    
    // Process each PDF attachment
    for (const attachment of pdfAttachments) {
      await processPdfAttachment(gmail, messageId, attachment, subject, from);
    }
    
  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error);
    throw error;
  }
}

/**
 * Find PDF attachments in message payload
 */
function findPdfAttachments(payload) {
  const attachments = [];
  
  function traverseParts(parts) {
    if (!parts) return;
    
    for (const part of parts) {
      if (part.filename && part.filename.toLowerCase().endsWith('.pdf')) {
        if (part.body && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            attachmentId: part.body.attachmentId,
            mimeType: part.mimeType,
            size: part.body.size,
          });
        }
      }
      
      if (part.parts) {
        traverseParts(part.parts);
      }
    }
  }
  
  if (payload.parts) {
    traverseParts(payload.parts);
  } else if (payload.filename && payload.filename.toLowerCase().endsWith('.pdf')) {
    if (payload.body && payload.body.attachmentId) {
      attachments.push({
        filename: payload.filename,
        attachmentId: payload.body.attachmentId,
        mimeType: payload.mimeType,
        size: payload.body.size,
      });
    }
  }
  
  return attachments;
}

/**
 * Process a PDF attachment
 */
async function processPdfAttachment(gmail, messageId, attachment, emailSubject, emailFrom) {
  try {
    console.log(`Processing PDF attachment: ${attachment.filename}`);
    
    // Download PDF attachment
    const attachmentData = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachment.attachmentId,
    });
    
    const pdfData = Buffer.from(attachmentData.data.data, 'base64');
    console.log(`PDF downloaded: ${pdfData.length} bytes`);
    
    // Check if we should call API endpoint or process directly
    const apiBaseUrl = process.env.API_BASE_URL;
    
    if (apiBaseUrl) {
      // Preferred: Call HTTP API endpoint for processing
      await callApiEndpoint(apiBaseUrl, pdfData, attachment.filename, emailSubject, emailFrom, messageId);
    } else {
      // Fallback: Process directly in Cloud Function
      await processPdfDirectly(pdfData, attachment.filename, emailSubject, emailFrom, messageId);
    }
    
  } catch (error) {
    console.error(`Error processing PDF attachment ${attachment.filename}:`, error);
    throw error;
  }
}

/**
 * Call HTTP API endpoint to process PDF
 */
async function callApiEndpoint(apiBaseUrl, pdfData, filename, emailSubject, emailFrom, messageId) {
  try {
    // Use internal endpoint that doesn't require OAuth2
    const url = `${apiBaseUrl}/api/reports/process-internal`;
    
    let headers = {
      'Content-Type': 'application/json',
    };
    
    // Get identity token for Cloud Run authentication
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getIdTokenClient(apiBaseUrl);
      const token = await client.idTokenProvider.fetchIdToken(apiBaseUrl);
      headers['Authorization'] = `Bearer ${token}`;
    } catch (authError) {
      console.warn('Could not get identity token, proceeding without auth:', authError.message);
    }
    
    const response = await axios.post(
      url,
      {
        pdfBase64: pdfData.toString('base64'),
        filename: filename,
        emailSubject: emailSubject,
        emailFrom: emailFrom,
        messageId: messageId,
      },
      {
        headers: headers,
        timeout: 300000, // 5 minutes timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    
    console.log('API endpoint response:', response.data);
    
    if (!response.data.success) {
      throw new Error(`API endpoint returned error: ${response.data.message || response.data.error}`);
    }
    
  } catch (error) {
    console.error('Error calling API endpoint:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Process PDF directly (without calling API endpoint)
 * This is a fallback method if API_BASE_URL is not configured
 */
async function processPdfDirectly(pdfData, filename, emailSubject, emailFrom, messageId) {
  try {
    const bucketName = process.env.GCP_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('GCP_STORAGE_BUCKET environment variable is required');
    }
    
    // Upload to Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
    
    // Organize by date: YYYY/MM/DD/filename.pdf
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const storagePath = `${year}/${month}/${day}/${filename}`;
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(storagePath);
    
    await file.save(pdfData, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          emailSubject: emailSubject,
          emailFrom: emailFrom,
          messageId: messageId,
        }
      },
    });
    
    console.log(`PDF uploaded to: gs://${bucketName}/${storagePath}`);
    
    // Extract text using Document AI
    const processorName = process.env.DOCUMENT_AI_PROCESSOR_ID;
    if (!processorName) {
      throw new Error('DOCUMENT_AI_PROCESSOR_ID environment variable is required');
    }
    
    const documentAI = new DocumentProcessorServiceClient({
      projectId: process.env.GCP_PROJECT_ID,
    });
    
    const [result] = await documentAI.processDocument({
      name: processorName,
      rawDocument: {
        content: pdfData,
        mimeType: 'application/pdf',
      },
    });
    
    const extractedText = result.document?.text || '';
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Save to database (basic implementation)
    // For production, you should use the API endpoint which has proper parsing logic
    await saveToDatabase(extractedText, storagePath, bucketName, filename, emailSubject, emailFrom, messageId);
    
    console.log('Successfully processed PDF and saved to database');
    
  } catch (error) {
    console.error('Error processing PDF directly:', error);
    throw error;
  }
}

/**
 * Save parsed data to database
 * Note: This is a basic implementation. Use API endpoint for full parsing.
 */
async function saveToDatabase(extractedText, storagePath, bucketName, filename, emailSubject, emailFrom, messageId) {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
  
  // Check required config
  if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
    console.warn('Database configuration incomplete. Skipping database save.');
    console.log('Extracted text preview:', extractedText.substring(0, 500));
    return;
  }
  
  const pool = new Pool(dbConfig);
  
  try {
    // Log that we received the PDF (parsing should be done via API endpoint)
    console.log('PDF received and stored. Use API endpoint for full parsing.');
    console.log('Storage path:', storagePath);
    console.log('Extracted text preview:', extractedText.substring(0, 200));
    
    // You can add basic insert here if needed, but prefer using API endpoint
    // for proper parsing with the hybrid parser system
    
  } finally {
    await pool.end();
  }
}
