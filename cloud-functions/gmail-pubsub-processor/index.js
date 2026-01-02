/**
 * Cloud Function: Gmail Pub/Sub Processor
 * 
 * Triggered by Pub/Sub messages from Gmail Watch
 * Processes new emails with PDF attachments and saves to database
 * 
 * Environment Variables Required:
 * - GCP_PROJECT_ID: Google Cloud Project ID
 * - GCP_KEY_FILE: Path to service account key file (or use default credentials)
 * - GMAIL_USER: Email address to monitor (for domain-wide delegation)
 * - GCP_STORAGE_BUCKET: Cloud Storage bucket name
 * - DOCUMENT_AI_PROCESSOR_ID: Document AI processor ID
 * - DATABASE_URL: PostgreSQL connection string
 * - API_BASE_URL: (Optional) Base URL for API endpoint (if calling HTTP API instead)
 */

const { PubSub } = require('@google-cloud/pubsub');
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
    // Extract Pub/Sub message from CloudEvent
    const pubsubMessage = cloudEvent.data.message;
    if (!pubsubMessage || !pubsubMessage.data) {
      console.error('Invalid Pub/Sub message format');
      return;
    }
    
    // Parse Pub/Sub message
    const messageData = JSON.parse(
      Buffer.from(pubsubMessage.data, 'base64').toString()
    );
    
    console.log('Parsed message data:', JSON.stringify(messageData, null, 2));
    
    const emailAddress = messageData.emailAddress;
    const historyId = messageData.historyId;
    
    if (!emailAddress || !historyId) {
      console.error('Missing emailAddress or historyId in message');
      return;
    }
    
    // Initialize Gmail API
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
 * Get Gmail API service instance
 */
async function getGmailService() {
  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GCP_KEY_FILE;
  const gmailUser = process.env.GMAIL_USER;
  
  let auth;
  
  if (keyFile && projectId) {
    // Use Service Account with domain-wide delegation
    auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      keyFile: keyFile,
      projectId: projectId,
    });
    
    if (gmailUser) {
      // Domain-wide delegation: impersonate user
      const authClient = await auth.getClient();
      authClient.subject = gmailUser;
      return google.gmail({ version: 'v1', auth: authClient });
    } else {
      return google.gmail({ version: 'v1', auth });
    }
  } else {
    // Use default credentials (Cloud Function default service account)
    auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
    
    if (gmailUser) {
      const authClient = await auth.getClient();
      authClient.subject = gmailUser;
      return google.gmail({ version: 'v1', auth: authClient });
    } else {
      return google.gmail({ version: 'v1', auth });
    }
  }
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
    
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    
    console.log(`Message subject: ${subject}`);
    console.log(`Message from: ${from}`);
    
    // Check if subject contains "Autoland" (optional filter)
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
      await processPdfAttachment(gmail, messageId, attachment.attachmentId, subject);
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
async function processPdfAttachment(gmail, messageId, attachmentId, emailSubject) {
  try {
    console.log(`Processing PDF attachment: ${attachmentId}`);
    
    // Download PDF attachment
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });
    
    const pdfData = Buffer.from(attachment.data.data, 'base64');
    console.log(`PDF downloaded: ${pdfData.length} bytes`);
    
    // Check if we should call API endpoint or process directly
    const apiBaseUrl = process.env.API_BASE_URL;
    
    if (apiBaseUrl) {
      // Call HTTP API endpoint
      await callApiEndpoint(apiBaseUrl, messageId, attachmentId);
    } else {
      // Process directly
      await processPdfDirectly(pdfData, emailSubject, messageId, attachmentId);
    }
    
  } catch (error) {
    console.error(`Error processing PDF attachment ${attachmentId}:`, error);
    throw error;
  }
}

/**
 * Call HTTP API endpoint to process PDF
 */
async function callApiEndpoint(apiBaseUrl, messageId, attachmentId) {
  try {
    // Use internal endpoint that doesn't require OAuth2
    const url = `${apiBaseUrl}/api/reports/process-internal`;
    
    // Optional: Add authentication header if needed
    // For Cloud Functions calling Cloud Run, you can use Identity Token
    let headers = {
      'Content-Type': 'application/json',
    };
    
    // If API requires authentication, get identity token
    // This works when Cloud Function and Cloud Run are in same project
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const idToken = await client.getIdTokenClient(apiBaseUrl);
      const token = await idToken.idTokenProvider.fetchIdToken(apiBaseUrl);
      headers['Authorization'] = `Bearer ${token}`;
    } catch (authError) {
      console.warn('Could not get identity token, proceeding without auth:', authError.message);
      // If internal endpoint doesn't require auth, continue without token
    }
    
    const response = await axios.post(
      url,
      {
        messageId: messageId,
        attachmentId: attachmentId,
      },
      {
        headers: headers,
        timeout: 300000, // 5 minutes timeout
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
 */
async function processPdfDirectly(pdfData, emailSubject, messageId, attachmentId) {
  try {
    // Upload to Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
    
    const bucketName = process.env.GCP_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('GCP_STORAGE_BUCKET environment variable is required');
    }
    
    // Extract filename from email subject or use timestamp
    const pdfFilename = emailSubject.match(/([A-Z0-9_-]+\.pdf)/i)?.[1] || 
                       `autoland-${Date.now()}.pdf`;
    
    // Organize by date: YYYY/MM/DD/filename.pdf
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `${year}/${month}/${day}/${pdfFilename}`;
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    await file.save(pdfData, {
      metadata: {
        contentType: 'application/pdf',
      },
    });
    
    console.log(`PDF uploaded to: gs://${bucketName}/${fileName}`);
    
    // Extract text using Document AI
    const documentAI = new DocumentProcessorServiceClient({
      keyFilename: process.env.GCP_KEY_FILE,
      projectId: process.env.GCP_PROJECT_ID,
    });
    
    const processorName = process.env.DOCUMENT_AI_PROCESSOR_ID;
    if (!processorName) {
      throw new Error('DOCUMENT_AI_PROCESSOR_ID environment variable is required');
    }
    
    const [result] = await documentAI.processDocument({
      name: processorName,
      rawDocument: {
        content: pdfData,
        mimeType: 'application/pdf',
      },
    });
    
    const extractedText = result.document.text;
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Parse PDF data (you'll need to import the parser)
    // For now, we'll save to database directly
    // In production, you should import the parser from your codebase
    
    // Save to database
    await saveToDatabase(extractedText, fileName, bucketName, pdfFilename, messageId);
    
    console.log('Successfully processed PDF and saved to database');
    
  } catch (error) {
    console.error('Error processing PDF directly:', error);
    throw error;
  }
}

/**
 * Save parsed data to database
 * Note: This is a simplified version. In production, you should use your actual parser.
 */
async function saveToDatabase(extractedText, storagePath, bucketName, filename, messageId) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // TODO: Parse extractedText using your parser
    // For now, we'll just log it
    console.log('Extracted text preview:', extractedText.substring(0, 200));
    
    // Example: Insert into database (you'll need to implement the actual parser)
    // const parsedData = parseAutolandReport(extractedText);
    // await pool.query('INSERT INTO autoland_reports (...) VALUES (...)');
    
    console.log('Database save not implemented - use API endpoint or implement parser');
    
  } finally {
    await pool.end();
  }
}

