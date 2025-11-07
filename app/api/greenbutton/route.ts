// Opening the door with a cheerful comment so teammates know this endpoint is welcoming
import { NextResponse } from 'next/server' // Pulling in the Next.js helper that makes JSON responses effortless
import { parseGreenButtonWorkbook } from '@/lib/greenbutton/parser' // Reusing the parser we just built so data stays consistent everywhere

// Sharing the GET handler as an async function because file reads take a moment of patience
export async function GET() {
  try {
    const data = await parseGreenButtonWorkbook() // Parsing the workbook so the admin view receives fresh insights
    return NextResponse.json({ success: true, data }) // Sending back a success flag plus the goodies for the UI to enjoy
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse Green Button data' // Carrying the detailed message forward for the UI
    console.error('Green Button parse failed', error) // Logging the hiccup so troubleshooting has breadcrumbs

    const isExpected = /No Green Button files|Unable to parse any Green Button files|Unable to read Green Button workbook/.test(message)
    const status = isExpected ? 200 : 500 // Treating missing-file scenarios as normal so the UI can show instructions without a network failure

    return NextResponse.json({ success: false, error: message }, { status }) // Returning a gentle error message so the UI can react gracefully
  }
}


