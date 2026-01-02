/**
 * Hybrid PDF Parser with Fallback System
 *
 * Strategy:
 * 1. Try pdf2json (FREE) first
 * 2. Parse with regex parser
 * 3. If parsing fails → Fallback to Document AI (PAID)
 * 4. Parse again with regex parser
 * 5. Track metrics for cost analysis
 */

import { DocumentProcessorServiceClient } from "@google-cloud/documentai"
import { extractTextWithPdfParse, isExtractionViable } from "./pdf-text-extractor"
import { parseAutolandReport, ParseResult } from "./autoland-pdf-parser"

export interface HybridParseResult {
  success: boolean
  data: any | null
  method: 'pdf2json' | 'document-ai'
  parsingAttempts: {
    first: {
      method: 'pdf2json'
      extractionSuccess: boolean
      parsingSuccess: boolean
    }
    fallback: {
      method: 'document-ai'
      extractionSuccess: boolean
      parsingSuccess: boolean
      used: boolean
    }
  }
  metrics: {
    freeAttempt: boolean
    paidFallback: boolean
    costSaved: number // USD
    actualCost: number // USD
  }
  errors: string[]
  warnings: string[]
}

/**
 * Extract text using Document AI (Paid Fallback)
 */
async function extractWithDocumentAI(pdfBuffer: Buffer): Promise<{ success: boolean; text: string; error: string | null }> {
  try {
    const processorName = process.env.DOCUMENT_AI_PROCESSOR_ID
    if (!processorName) {
      return {
        success: false,
        text: '',
        error: 'DOCUMENT_AI_PROCESSOR_ID not configured'
      }
    }

    const documentAI = new DocumentProcessorServiceClient({
      keyFilename: process.env.GCP_KEY_FILE,
    })

    const [result] = await documentAI.processDocument({
      name: processorName,
      rawDocument: {
        content: pdfBuffer,
        mimeType: 'application/pdf',
      },
    })

    const extractedText = result.document?.text || ''

    if (!extractedText) {
      return {
        success: false,
        text: '',
        error: 'Document AI returned empty text'
      }
    }

    return {
      success: true,
      text: extractedText,
      error: null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      text: '',
      error: `Document AI extraction failed: ${errorMessage}`
    }
  }
}

/**
 * Hybrid PDF parser with fallback from pdf2json to Document AI
 *
 * @param pdfBuffer - PDF file content as Buffer
 * @returns Promise<HybridParseResult> - Parsed data with metrics
 */
export async function parsePDFWithFallback(pdfBuffer: Buffer): Promise<HybridParseResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Cost constants (USD)
  const DOCUMENT_AI_COST_PER_PDF = 0.015 // Approximate cost

  // Attempt 1: pdf2json (FREE)
  const freeExtraction = await extractTextWithPdfParse(pdfBuffer)

  let firstParsingResult: ParseResult | null = null

  if (freeExtraction.success && isExtractionViable(freeExtraction)) {
    firstParsingResult = parseAutolandReport(freeExtraction.text)

    if (firstParsingResult.success && firstParsingResult.data) {
      // SUCCESS with FREE method!
      return {
        success: true,
        data: firstParsingResult.data,
        method: 'pdf2json',
        parsingAttempts: {
          first: {
            method: 'pdf2json',
            extractionSuccess: true,
            parsingSuccess: true
          },
          fallback: {
            method: 'document-ai',
            extractionSuccess: false,
            parsingSuccess: false,
            used: false
          }
        },
        metrics: {
          freeAttempt: true,
          paidFallback: false,
          costSaved: DOCUMENT_AI_COST_PER_PDF,
          actualCost: 0
        },
        errors: [],
        warnings: firstParsingResult.warnings
      }
    }

    // Parsing failed with free extraction
    errors.push(...(firstParsingResult.errors || []))
    warnings.push(...(firstParsingResult.warnings || []))
    warnings.push('Free extraction (pdf2json) succeeded but parsing failed - falling back to Document AI')
  } else {
    // Free extraction failed
    errors.push(freeExtraction.error || 'Free extraction failed')
  }

  // Attempt 2: Document AI (PAID FALLBACK)
  const paidExtraction = await extractWithDocumentAI(pdfBuffer)

  if (!paidExtraction.success || !paidExtraction.text) {
    errors.push(paidExtraction.error || 'Document AI extraction failed')

    return {
      success: false,
      data: null,
      method: 'document-ai',
      parsingAttempts: {
        first: {
          method: 'pdf2json',
          extractionSuccess: freeExtraction.success,
          parsingSuccess: false
        },
        fallback: {
          method: 'document-ai',
          extractionSuccess: false,
          parsingSuccess: false,
          used: true
        }
      },
      metrics: {
        freeAttempt: true,
        paidFallback: true,
        costSaved: 0,
        actualCost: DOCUMENT_AI_COST_PER_PDF
      },
      errors,
      warnings
    }
  }

  // Parse with Document AI extracted text
  const fallbackParsingResult = parseAutolandReport(paidExtraction.text)

  if (!fallbackParsingResult.success || !fallbackParsingResult.data) {
    errors.push(...(fallbackParsingResult.errors || []))
    warnings.push(...(fallbackParsingResult.warnings || []))

    return {
      success: false,
      data: null,
      method: 'document-ai',
      parsingAttempts: {
        first: {
          method: 'pdf2json',
          extractionSuccess: freeExtraction.success,
          parsingSuccess: false
        },
        fallback: {
          method: 'document-ai',
          extractionSuccess: true,
          parsingSuccess: false,
          used: true
        }
      },
      metrics: {
        freeAttempt: true,
        paidFallback: true,
        costSaved: 0,
        actualCost: DOCUMENT_AI_COST_PER_PDF
      },
      errors,
      warnings
    }
  }

  // SUCCESS with PAID fallback
  return {
    success: true,
    data: fallbackParsingResult.data,
    method: 'document-ai',
    parsingAttempts: {
      first: {
        method: 'pdf2json',
        extractionSuccess: freeExtraction.success,
        parsingSuccess: false
      },
      fallback: {
        method: 'document-ai',
        extractionSuccess: true,
        parsingSuccess: true,
        used: true
      }
    },
    metrics: {
      freeAttempt: true,
      paidFallback: true,
      costSaved: 0,
      actualCost: DOCUMENT_AI_COST_PER_PDF
    },
    errors: [],
    warnings: fallbackParsingResult.warnings
  }
}

/**
 * Calculate cost savings from hybrid parsing
 */
export interface CostSavingsMetrics {
  totalPdfsProcessed: number
  freeSuccessCount: number
  paidFallbackCount: number
  freeSuccessRate: number // Percentage
  costWithoutHybrid: number // USD - if all used Document AI
  actualCost: number // USD - with hybrid
  savings: number // USD
  savingsPercentage: number
}

/**
 * Aggregate metrics from multiple parsing results
 */
export function calculateCostSavings(results: HybridParseResult[]): CostSavingsMetrics {
  const total = results.length
  const freeSuccess = results.filter(r => r.method === 'pdf2json').length
  const paidFallback = results.filter(r => r.method === 'document-ai').length

  const DOCUMENT_AI_COST_PER_PDF = 0.015

  const costWithoutHybrid = total * DOCUMENT_AI_COST_PER_PDF
  const actualCost = paidFallback * DOCUMENT_AI_COST_PER_PDF
  const savings = costWithoutHybrid - actualCost

  return {
    totalPdfsProcessed: total,
    freeSuccessCount: freeSuccess,
    paidFallbackCount: paidFallback,
    freeSuccessRate: total > 0 ? (freeSuccess / total) * 100 : 0,
    costWithoutHybrid,
    actualCost,
    savings,
    savingsPercentage: costWithoutHybrid > 0 ? (savings / costWithoutHybrid) * 100 : 0
  }
}
