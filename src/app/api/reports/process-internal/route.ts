import { NextResponse } from "next/server"
import { google } from "googleapis"
import { Storage } from "@google-cloud/storage"
import { DocumentProcessorServiceClient } from "@google-cloud/documentai"
import { db } from "@/lib/db"
import { parseAutolandReport } from "@/lib/parsers/autoland-pdf-parser"

/**
 * Internal API endpoint for processing Autoland Report PDF
 * POST /api/reports/process-internal
 * 
 * This endpoint is designed to be called from Cloud Functions or other internal services.
 * It uses Service Account authentication instead of OAuth2.
 * 
 * Body: { messageId: string, attachmentId: string }
 * 
 * Security: This endpoint should only be accessible from within the same VPC or
 * should validate the request comes from a trusted source (e.g., check headers).
 */

export async function POST(request: Request) {
  try {
    // Optional: Validate request comes from trusted source
    // For Cloud Functions, you can check headers or use VPC
    const userAgent = request.headers.get("user-agent") || ""
    const forwardedFor = request.headers.get("x-forwarded-for") || ""
    
    // Basic validation - in production, add more robust checks
    // For example, check if request comes from Cloud Function service account
    
    const body = await request.json()
    const { messageId, attachmentId } = body

    if (!messageId || !attachmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "messageId and attachmentId are required",
        },
        { status: 400 }
      )
    }

    // Step 1: Initialize Gmail API using Service Account
    let gmail: any

    if (process.env.GCP_KEY_FILE && process.env.GCP_PROJECT_ID) {
      const gmailAuth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
        keyFile: process.env.GCP_KEY_FILE,
        projectId: process.env.GCP_PROJECT_ID,
      })
      
      if (process.env.GMAIL_USER) {
        const authClient = await gmailAuth.getClient() as any
        authClient.subject = process.env.GMAIL_USER
        gmail = google.gmail({ version: "v1", auth: authClient })
      } else {
        gmail = google.gmail({ version: "v1", auth: gmailAuth })
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Service Account not configured",
          message: "GCP_KEY_FILE and GCP_PROJECT_ID must be set for internal API",
        },
        { status: 401 }
      )
    }

    // Step 2: Get message details for metadata
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    })

    const emailSubject = message.data.payload?.headers?.find((h: any) => h.name === "Subject")?.value || ""
    const emailSender = message.data.payload?.headers?.find((h: any) => h.name === "From")?.value || ""
    const emailDate = message.data.payload?.headers?.find((h: any) => h.name === "Date")?.value || ""

    // Step 3: Download PDF attachment
    console.log(`Downloading attachment ${attachmentId} from message ${messageId}`)
    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: messageId,
      id: attachmentId,
    })

    const pdfData = Buffer.from(attachment.data.data!, "base64")
    console.log(`PDF downloaded: ${pdfData.length} bytes`)

    // Step 4: Upload to Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    })

    const bucketName = process.env.GCP_STORAGE_BUCKET || "autoland-reports-test"
    
    // Extract filename from email subject or use timestamp
    const pdfFilename = emailSubject.match(/([A-Z0-9_-]+\.pdf)/i)?.[1] || 
                       `autoland-${Date.now()}.pdf`
    
    // Organize by date: YYYY/MM/DD/filename.pdf
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const fileName = `${year}/${month}/${day}/${pdfFilename}`

    const bucket = storage.bucket(bucketName)
    const file = bucket.file(fileName)

    await file.save(pdfData, {
      metadata: {
        contentType: "application/pdf",
      },
    })

    console.log(`PDF uploaded to: gs://${bucketName}/${fileName}`)

    // Step 5: Extract text using Document AI
    const documentAI = new DocumentProcessorServiceClient({
      keyFilename: process.env.GCP_KEY_FILE,
    })

    const processorName = process.env.DOCUMENT_AI_PROCESSOR_ID
    if (!processorName) {
      return NextResponse.json(
        {
          success: false,
          error: "Document AI Processor not configured",
          message: "DOCUMENT_AI_PROCESSOR_ID must be set",
        },
        { status: 500 }
      )
    }

    const [result] = await documentAI.processDocument({
      name: processorName,
      rawDocument: {
        content: pdfData,
        mimeType: "application/pdf",
      },
    })

    const extractedText = result.document.text || ""
    console.log(`Extracted text length: ${extractedText.length} characters`)

    // Step 6: Parse extracted text
    const parseResult = parseAutolandReport(extractedText)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse PDF data",
          message: "Parser errors",
          details: {
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            extractedTextPreview: extractedText.substring(0, 500),
          },
        },
        { status: 400 }
      )
    }

    const parsedData = parseResult.data!

    // Step 7: Check for duplicate reports
    const existingReport = await db.query(
      "SELECT id FROM autoland_reports WHERE report_number = $1",
      [parsedData.report_number]
    )

    if (existingReport.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Report already exists",
          message: `Report with number ${parsedData.report_number} already exists in database`,
          data: {
            existingId: existingReport.rows[0].id,
          },
        },
        { status: 409 }
      )
    }

    // Step 8: Insert into database
    const insertResult = await db.query(
      `INSERT INTO autoland_reports (
        report_number, aircraft_reg, flight_number, airport, runway,
        captain, first_officer, date_utc, time_utc, wind_velocity,
        td_point, tracking, qnh, alignment, speed_control,
        temperature, landing, aircraft_dropout, visibility_rvr,
        other, result, reasons, captain_signature,
        pdf_storage_path, pdf_storage_bucket, pdf_filename,
        email_subject, email_sender, email_date, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW()
      ) RETURNING id`,
      [
        parsedData.report_number,
        parsedData.aircraft_reg,
        parsedData.flight_number,
        parsedData.airport,
        parsedData.runway,
        parsedData.captain,
        parsedData.first_officer,
        parsedData.date_utc,
        parsedData.time_utc,
        parsedData.wind_velocity,
        parsedData.td_point,
        parsedData.tracking,
        parsedData.qnh,
        parsedData.alignment,
        parsedData.speed_control,
        parsedData.temperature,
        parsedData.landing,
        parsedData.aircraft_dropout,
        parsedData.visibility_rvr,
        parsedData.other,
        parsedData.result,
        parsedData.reasons,
        parsedData.captain_signature,
        fileName, // pdf_storage_path (without gs:// prefix)
        bucketName, // pdf_storage_bucket
        pdfFilename, // pdf_filename
        emailSubject,
        emailSender,
        emailDate,
      ]
    )

    const reportId = insertResult.rows[0].id

    // Step 9: Update autoland_to_go table
    if (parsedData.aircraft_reg) {
      await db.query("SELECT calculate_autoland_to_go($1)", [parsedData.aircraft_reg])
    }

    console.log(`Report saved successfully with ID: ${reportId}`)

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        reportNumber: parsedData.report_number,
        aircraftReg: parsedData.aircraft_reg,
        flightNumber: parsedData.flight_number,
        pdfStoragePath: fileName,
        pdfStorageBucket: bucketName,
        message: "Report processed and saved successfully",
      },
    })

  } catch (error: any) {
    console.error("Error processing report:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process report",
        message: error.message || "Unknown error",
        details: error.details || {},
      },
      { status: 500 }
    )
  }
}


