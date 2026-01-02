/**
 * Parser for Autoland Report PDF extracted text
 * Parses extracted text from Document AI and extracts structured data
 */

export interface ParsedAutolandReport {
  // Report Identification
  report_number: string
  aircraft_reg: string
  flight_number: string
  
  // General Information
  airport: string
  runway: string
  captain: string | null
  first_officer: string | null
  date_utc: Date
  time_utc: string
  datetime_utc: Date
  
  // Data Section
  wind_velocity: string | null
  td_point: string | null
  tracking: string | null
  qnh: number | null
  alignment: string | null
  speed_control: string | null
  temperature: number | null
  landing: string | null
  aircraft_dropout: string | null
  visibility_rvr: string | null  // Can be number (as string) or "CAVOK"
  other: string | null
  
  // Result
  result: 'SUCCESSFUL' | 'UNSUCCESSFUL'
  reasons: string | null
  captain_signature: string | null
}

export interface ParseResult {
  success: boolean
  data: ParsedAutolandReport | null
  errors: string[]
  warnings: string[]
}

/**
 * Parse extracted text from Autoland Report PDF
 */
export function parseAutolandReport(extractedText: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Normalize text: remove extra whitespace, normalize line breaks
  const text = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  try {
    // Extract report_number (format: VN-A525-VJ442-23122025 or similar)
    const reportNumberMatch = text.match(/N[°\s]*[:]?\s*([A-Z]{2}-[A-Z]\d{3}-[A-Z]{2,3}\d{1,4}-?\d{0,8})/i)
    const report_number = reportNumberMatch?.[1] || extractFromPattern(text, /(VN-A\d{3,4}-[A-Z]{2,3}\d{1,4}-?\d{0,8})/i)
    
    // Extract aircraft_reg (format: VN-A525)
    const aircraftRegMatch = text.match(/A\/C\s*REG[:\s]*([A-Z]{2}-[A-Z]\d{3,4})/i) || 
                             text.match(/(VN-A\d{3,4})/i)
    const aircraft_reg = aircraftRegMatch?.[1] || extractFromPattern(text, /(VN-A\d{3,4})/i)
    
    // Extract flight_number (format: VJ442)
    const flightNumberMatch = text.match(/FLT\s*N[°\s]*[:]?\s*([A-Z]{2,3}\d{1,4})/i) ||
                              text.match(/(VJ\d{3,4}|VN\d{3,4})/i)
    const flight_number = flightNumberMatch?.[1] || extractFromPattern(text, /(VJ\d{3,4}|VN\d{3,4})/i)
    
    // Extract airport and runway
    // Format 1: AIRPORT/RWY label with value "HGH/06" on next line
    // Format 2: AIRPORT/RWY: HGH/06 on same line
    // Format 3: AIRPORT: HGH and RWY: 06 separately
    
    let airport: string | null = null
    let runway: string | null = null
    
    // Try format: AIRPORT/RWY with value on next line (most common)
    // Pattern: AIRPORT/RWY\nHGH/06
    const airportRunwayNextLineMatch = text.match(/AIRPORT[\/\s]*RWY[:\s]*\n\s*([A-Z]{3})\/([0-9]{1,2}[LRC]?)/i)
    
    if (airportRunwayNextLineMatch && airportRunwayNextLineMatch[1] && airportRunwayNextLineMatch[2]) {
      airport = airportRunwayNextLineMatch[1]
      runway = airportRunwayNextLineMatch[2]
    } else {
      // Try format: AIRPORT/RWY: HGH/06 on same line
      const airportRunwaySameLineMatch = text.match(/AIRPORT[\/\s]*RWY[:\s]*([A-Z]{3})\/([0-9]{1,2}[LRC]?)/i)
      
      if (airportRunwaySameLineMatch && airportRunwaySameLineMatch[1] && airportRunwaySameLineMatch[2]) {
        airport = airportRunwaySameLineMatch[1]
        runway = airportRunwaySameLineMatch[2]
      } else {
        // Try separate AIRPORT and RWY
        const airportMatch = text.match(/AIRPORT[:\s]*([A-Z]{3})/i)
        airport = airportMatch?.[1] || null
        
        const runwayMatch = text.match(/RWY[:\s]*([0-9]{1,2}[LRC]?)/i)
        runway = runwayMatch?.[1] || null
        
        // If still not found, try to extract from common airport codes
        if (!airport) {
          airport = extractFromPattern(text, /\b([A-Z]{3})\b/, ['HAN', 'SGN', 'DAD', 'HPH', 'CXR', 'VCA', 'PQC', 'VDO', 'HGH', 'NRT', 'ICN', 'BKK', 'SIN'])
        }
      }
    }
    
    // Extract captain
    const captainMatch = text.match(/CAPT[:\s]*([A-Za-z\s]+?)(?:\n|F\/O|$)/i)
    const captain = captainMatch?.[1]?.trim() || null
    
    // Extract first_officer
    const firstOfficerMatch = text.match(/F\/O[:\s]*([A-Za-z\s]+?)(?:\n|DATE|$)/i)
    const first_officer = firstOfficerMatch?.[1]?.trim() || null
    
    // Extract date_utc (format: 23 Dec 2025 or 23/12/2025)
    const dateMatch = text.match(/DATE\(Z\)[:\s]*(\d{1,2}[\s\/-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\/-]\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                      text.match(/(\d{1,2}[\s\/-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\/-]\d{4})/i)
    const dateStr = dateMatch?.[1]
    const date_utc = dateStr ? parseDate(dateStr) : new Date()
    
    // Extract time_utc (format: 04:02 or 04:02:00)
    const timeMatch = text.match(/TIME\(Z\)[:\s]*(\d{1,2}:\d{2}(?::\d{2})?)/i) ||
                    text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)
    const time_utc = timeMatch?.[1] || '00:00'
    
    // Combine date and time for datetime_utc
    const datetime_utc = combineDateTime(date_utc, time_utc)
    
    // Extract DATA section fields
    // W/V can be on the same line or next line: "W/V\n100/4" or "W/V 100/4"
    // Try multiline match first (most common case)
    const windVelocityMatch = text.match(/W\/V[:\s]*\n\s*([0-9]{3}\/[0-9]{1,2})/i) || 
                              text.match(/W\/V[:\s]+([0-9]{3}\/[0-9]{1,2})/i) ||
                              text.match(/W\/V[:\s]*([0-9]{3}\/[0-9]{1,2})/i)
    const wind_velocity = windVelocityMatch?.[1] || null
    
    // T/D POINT can be "ok", "good", or a number (like "-4")
    // Can be on same line or next line
    const tdPointMatch = text.match(/T\/D\s*POINT[:\s]*\n?\s*([^\n]+?)(?:\n|ALIGNMENT|QNH|$)/i) ||
                         text.match(/T\/D\s*POINT[:\s]+([^\n]+?)(?:\n|ALIGNMENT|QNH|$)/i)
    let td_point: string | null = null
    if (tdPointMatch) {
      const value = tdPointMatch[1].trim().toLowerCase()
      if (value === 'ok' || value === 'okay' || value === 'good') {
        td_point = 'ok'
      } else if (value.match(/^-?\d+$/)) {
        // It's a number, keep as is
        td_point = value
      } else {
        td_point = value
      }
    }
    
    // TRACKING can be "ok", "good", etc.
    // Can be on same line or next line
    // Try multiline match first (most common case)
    const trackingMatch = text.match(/TRACKING[:\s]*\n\s*([^\n]+?)(?:\n|SPEED|A\/C|VIS|$)/i) ||
                          text.match(/TRACKING[:\s]+([^\n]+?)(?:\n|SPEED|A\/C|VIS|$)/i) ||
                          text.match(/TRACKING[:\s]*([^\n]+?)(?:\n|SPEED|A\/C|VIS|$)/i)
    let tracking: string | null = null
    if (trackingMatch) {
      const value = trackingMatch[1].trim().toLowerCase()
      if (value === 'ok' || value === 'okay' || value === 'good') {
        tracking = 'ok'
      } else {
        tracking = value
      }
    }
    
    // QNH can be on same line or next line
    // Try multiline match first (most common case)
    const qnhMatch = text.match(/QNH[:\s]*\n\s*(\d{3,4})(?:\n|ALIGNMENT|TEMP|$)/i) ||
                     text.match(/QNH[:\s]+(\d{3,4})(?:\n|ALIGNMENT|TEMP|$)/i) ||
                     text.match(/QNH[:\s]*(\d{3,4})(?:\n|ALIGNMENT|TEMP|$)/i)
    const qnh = qnhMatch?.[1] ? parseInt(qnhMatch[1], 10) : null
    
    // ALIGNMENT can be "ok", "good", etc.
    // Can be on same line or next line
    // Try multiline match first (most common case)
    const alignmentMatch = text.match(/ALIGNMENT[:\s]*\n\s*([^\n]+?)(?:\n|TEMP|SPEED|QNH|$)/i) ||
                          text.match(/ALIGNMENT[:\s]+([^\n]+?)(?:\n|TEMP|SPEED|QNH|$)/i) ||
                          text.match(/ALIGNMENT[:\s]*([^\n]+?)(?:\n|TEMP|SPEED|QNH|$)/i)
    let alignment: string | null = null
    if (alignmentMatch) {
      const value = alignmentMatch[1].trim().toLowerCase()
      if (value === 'ok' || value === 'okay' || value === 'good') {
        alignment = 'ok'
      } else {
        alignment = value
      }
    }
    
    // SPEED CONTROL can be "ok", "good", etc.
    // Can be on same line or next line
    // Try multiline match first (most common case)
    const speedControlMatch = text.match(/SPEED\s*CONTROL[:\s]*\n\s*([^\n]+?)(?:\n|A\/C|VIS|TRACKING|$)/i) ||
                              text.match(/SPEED\s*CONTROL[:\s]+([^\n]+?)(?:\n|A\/C|VIS|TRACKING|$)/i) ||
                              text.match(/SPEED\s*CONTROL[:\s]*([^\n]+?)(?:\n|A\/C|VIS|TRACKING|$)/i)
    let speed_control: string | null = null
    if (speedControlMatch) {
      const value = speedControlMatch[1].trim().toLowerCase()
      if (value === 'ok' || value === 'okay' || value === 'good') {
        speed_control = 'ok'
      } else {
        speed_control = value
      }
    }
    
    // TEMP can be on same line or next line, and value might be on the line after
    // Format: "TEMP\nLANDING\n4\ngood" - TEMP and LANDING are on separate lines, 
    // then their values are on the next lines
    // "4" is the TEMP value (after LANDING label, before "good")
    const tempMatch = text.match(/TEMP[:\s]*\n\s*LANDING[:\s]*\n\s*(\d{1,2})(?:\n|good|ok|$)/i) ||
                     text.match(/TEMP[:\s]*\n\s*(\d{1,2})(?:\n|LANDING|$)/i) ||
                     text.match(/TEMP[:\s]+(\d{1,2})(?:\n|LANDING|$)/i) ||
                     text.match(/TEMP[:\s]*(\d{1,2})(?:\n|LANDING|$)/i)
    const temperature = tempMatch?.[1] ? parseInt(tempMatch[1], 10) : null
    
    // LANDING can be "ok", "good", etc.
    // Format: "TEMP\nLANDING\n4\ngood" - LANDING value is "good" (after "4", which is TEMP value)
    // Try multiline match first (most common case)
    // Match: TEMP\nLANDING\n\d+\n(good|ok|...)\n (value after TEMP value, which is after LANDING label)
    const landingMatch = text.match(/TEMP[:\s]*\n\s*LANDING[:\s]*\n\s*\d{1,2}[:\s]*\n\s*([^\n]+?)(?:\n|A\/C|VIS|$)/i) ||
                         text.match(/LANDING[:\s]*\n\s*([^\n]+?)(?:\n|A\/C|VIS|TEMP|$)/i) ||
                         text.match(/LANDING[:\s]+([^\n]+?)(?:\n|A\/C|VIS|TEMP|$)/i) ||
                         text.match(/LANDING[:\s]*([^\n]+?)(?:\n|A\/C|VIS|TEMP|$)/i)
    let landing: string | null = null
    if (landingMatch) {
      const value = landingMatch[1].trim().toLowerCase()
      // Skip if value is a number (that's TEMP value, not LANDING)
      if (value.match(/^\d+$/)) {
        // This is TEMP value, try to get the next value
        const nextMatch = text.match(/TEMP[:\s]*\n\s*LANDING[:\s]*\n\s*\d{1,2}[:\s]*\n\s*([^\n]+?)(?:\n|A\/C|VIS|$)/i)
        if (nextMatch) {
          const nextValue = nextMatch[1].trim().toLowerCase()
          if (nextValue === 'ok' || nextValue === 'okay' || nextValue === 'good') {
            landing = 'ok'
          } else {
            landing = nextValue
          }
        }
      } else if (value === 'ok' || value === 'okay' || value === 'good') {
        landing = 'ok'
      } else {
        landing = value
      }
    }
    
    // A/C DROPOUT can be "ok", "good", etc.
    // Can be on same line or next line
    // Try multiline match first (most common case)
    const aircraftDropoutMatch = text.match(/A\/C\s*DROPOUT[:\s]*\n\s*([^\n]+?)(?:\n|VIS|OTHER|$)/i) ||
                                  text.match(/A\/C\s*DROPOUT[:\s]+([^\n]+?)(?:\n|VIS|OTHER|$)/i) ||
                                  text.match(/A\/C\s*DROPOUT[:\s]*([^\n]+?)(?:\n|VIS|OTHER|$)/i)
    let aircraft_dropout: string | null = null
    if (aircraftDropoutMatch) {
      const value = aircraftDropoutMatch[1].trim().toLowerCase()
      if (value === 'ok' || value === 'okay' || value === 'good') {
        aircraft_dropout = 'ok'
      } else {
        aircraft_dropout = value
      }
    }
    
    // VIS/RVR can be a number or "CAVOK"
    // Can be on same line or next line
    // Try multiline match first (most common case)
    const visibilityMatch = text.match(/VIS\/RVR[:\s]*\n\s*([^\n]+?)(?:\n|TRACKING|OTHER|RESULT|$)/i) ||
                            text.match(/VIS\/RVR[:\s]+([^\n]+?)(?:\n|TRACKING|OTHER|RESULT|$)/i) ||
                            text.match(/VIS\/RVR[:\s]*([^\n]+?)(?:\n|TRACKING|OTHER|RESULT|$)/i)
    let visibility_rvr: string | null = null  // Changed to string to store "CAVOK"
    if (visibilityMatch) {
      const value = visibilityMatch[1].trim()
      if (value.toUpperCase() === 'CAVOK') {
        // CAVOK means visibility is very good, store as string
        visibility_rvr = 'CAVOK'
      } else {
        const numMatch = value.match(/(\d{1,4})/)
        if (numMatch) {
          visibility_rvr = numMatch[1]  // Store as string, not number
        }
      }
    }
    
    const otherMatch = text.match(/OTHER[:\s]*(.+?)(?:\n|RESULT|$)/i)
    const other = otherMatch?.[1]?.trim() || null
    
    // Extract RESULT section
    const resultMatch = text.match(/RESULT[:\s]*(SUCCESSFUL|UNSUCCESSFUL)/i)
    const result = (resultMatch?.[1]?.toUpperCase() || 'SUCCESSFUL') as 'SUCCESSFUL' | 'UNSUCCESSFUL'
    
    // Extract reasons (if UNSUCCESSFUL)
    const reasonsMatch = text.match(/REASONS\s*FOR\s*UNSUCCESSFUL\s*AUTOLAND[:\s]*(.+?)(?:\n|CAPT|$)/i)
    const reasons = reasonsMatch?.[1]?.trim() || null
    
    // Extract captain signature
    const signatureMatch = text.match(/CAPT['']S\s*SIGNATURE[:\s]*([A-Za-z\s]+?)(?:\n|$)/i)
    const captain_signature = signatureMatch?.[1]?.trim() || captain || null
    
    // Validate required fields
    if (!report_number) errors.push('Missing report_number')
    if (!aircraft_reg) errors.push('Missing aircraft_reg')
    if (!flight_number) errors.push('Missing flight_number')
    if (!airport) errors.push('Missing airport')
    if (!runway) errors.push('Missing runway')
    
    if (errors.length > 0) {
      return {
        success: false,
        data: null,
        errors,
        warnings,
      }
    }
    
    const parsed: ParsedAutolandReport = {
      report_number: report_number!,
      aircraft_reg: aircraft_reg!,
      flight_number: flight_number!,
      airport: airport!,
      runway: runway!,
      captain,
      first_officer,
      date_utc,
      time_utc,
      datetime_utc,
      wind_velocity,
      td_point,
      tracking,
      qnh,
      alignment,
      speed_control,
      temperature,
      landing,
      aircraft_dropout,
      visibility_rvr,
      other,
      result,
      reasons,
      captain_signature,
    }
    
    return {
      success: true,
      data: parsed,
      errors: [],
      warnings,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
    }
  }
}

/**
 * Helper function to extract value from text using pattern
 */
function extractFromPattern(text: string, pattern: RegExp, validValues?: string[]): string | null {
  const match = text.match(pattern)
  if (!match) return null
  
  const value = match[1]
  if (validValues && !validValues.includes(value)) return null
  
  return value
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  // Try different date formats
  // Format: "23 Dec 2025"
  const format1 = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i)
  if (format1) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }
    const day = parseInt(format1[1], 10)
    const month = months[format1[2].toLowerCase()]
    const year = parseInt(format1[3], 10)
    return new Date(year, month, day)
  }
  
  // Format: "23/12/2025" or "23-12-2025"
  const format2 = dateStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/)
  if (format2) {
    const day = parseInt(format2[1], 10)
    const month = parseInt(format2[2], 10) - 1
    const year = parseInt(format2[3], 10)
    return new Date(year, month, day)
  }
  
  // Try native Date parsing
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) return parsed
  
  return new Date()
}

/**
 * Combine date and time into datetime
 */
function combineDateTime(date: Date, time: string): Date {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  const datetime = new Date(date)
  datetime.setHours(hours || 0, minutes || 0, seconds || 0, 0)
  return datetime
}

