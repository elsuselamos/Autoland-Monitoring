/**
 * PDF Text Extractor using pdf2json library
 * Extracts text content from PDF files for parsing by autoland-pdf-parser
 * This is a free alternative to Google Cloud Document AI
 */

import PDFParser from 'pdf2json'

export interface PdfExtractionResult {
  success: boolean
  text: string
  metadata: {
    pages: number
    info?: any
  } | null
  error: string | null
}

/**
 * Extract text from PDF buffer using pdf2json
 *
 * @param pdfBuffer - PDF file content as Buffer
 * @returns Promise<PdfExtractionResult> - Extraction result with text or error
 */
export async function extractTextWithPdfParse(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
  return new Promise((resolve) => {
    // Validate input
    if (!Buffer.isBuffer(pdfBuffer)) {
      resolve({
        success: false,
        text: '',
        metadata: null,
        error: 'Input must be a Buffer'
      })
      return
    }

    if (pdfBuffer.length === 0) {
      resolve({
        success: false,
        text: '',
        metadata: null,
        error: 'PDF buffer is empty'
      })
      return
    }

    // Create PDF parser instance
    const pdfParser = new PDFParser()

    // Error handler
    pdfParser.on('pdfParser_dataError', (errData: any) => {
      resolve({
        success: false,
        text: '',
        metadata: null,
        error: `PDF parsing failed: ${errData.parserError || 'Unknown error'}`
      })
    })

    // Success handler
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        // Extract text from all pages
        let fullText = ''

        if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
          pdfData.Pages.forEach((page: any) => {
            if (page.Texts && Array.isArray(page.Texts)) {
              page.Texts.forEach((text: any) => {
                if (text.R && Array.isArray(text.R)) {
                  text.R.forEach((r: any) => {
                    if (r.T) {
                      fullText += decodeURIComponent(r.T) + ' '
                    }
                  })
                }
              })
              fullText += '\n'
            }
          })
        }

        // Clean up the extracted text
        fullText = fullText
          // Fix spacing issues around dashes (VN- A546 -> VN-A546)
          .replace(/-\s+/g, '-')
          // Fix spacing issues around slashes (A/ C -> A/C, / FLT -> /FLT)
          .replace(/\s+\/\s*/g, '/')
          .replace(/\/\s+/g, '/')
          // Normalize multiple spaces to single space
          .replace(/\s{2,}/g, ' ')
          // Fix newlines
          .replace(/\n\s+/g, '\n')
          .trim()

        // Validate extracted text
        if (fullText.length === 0) {
          resolve({
            success: false,
            text: '',
            metadata: null,
            error: 'No text could be extracted from PDF (possibly image-based/scanned PDF)'
          })
          return
        }

        // Return successful extraction
        resolve({
          success: true,
          text: fullText,
          metadata: {
            pages: pdfData.Pages?.length || 0
          },
          error: null
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        resolve({
          success: false,
          text: '',
          metadata: null,
          error: `PDF processing failed: ${errorMessage}`
        })
      }
    })

    // Parse the PDF buffer
    try {
      pdfParser.parseBuffer(pdfBuffer)
    } catch (error) {
      resolve({
        success: false,
        text: '',
        metadata: null,
        error: `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  })
}

/**
 * Extract text from PDF file path
 * Helper function that reads file and extracts text
 *
 * @param filePath - Absolute path to PDF file
 * @returns Promise<PdfExtractionResult> - Extraction result with text or error
 */
export async function extractTextFromPdfFile(filePath: string): Promise<PdfExtractionResult> {
  try {
    const fs = await import('fs/promises')
    const pdfBuffer = await fs.readFile(filePath)
    return extractTextWithPdfParse(pdfBuffer)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      text: '',
      metadata: null,
      error: `Failed to read PDF file: ${errorMessage}`
    }
  }
}

/**
 * Check if PDF extraction result is viable for parsing
 * A viable result should have minimum text content and no critical errors
 *
 * @param result - PdfExtractionResult to validate
 * @param minTextLength - Minimum text length (default: 100 characters)
 * @returns boolean - True if result is viable for parsing
 */
export function isExtractionViable(
  result: PdfExtractionResult,
  minTextLength: number = 100
): boolean {
  if (!result.success || result.error !== null) {
    return false
  }

  const textLength = result.text.trim().length
  return textLength >= minTextLength
}
