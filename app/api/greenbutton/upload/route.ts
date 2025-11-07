// Welcoming uploads with a quick note so future readers know this route handles new Green Button files
import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const GREENBUTTON_DIR = path.join(process.cwd(), 'greenbutton') // Pointing to the shared storage so every upload lands in one tidy place

const sanitizeFileName = (name: string) => {
  const { name: base, ext } = path.parse(name) // Splitting the original name so we can clean it safely
  const safeBase = base.replace(/[^a-zA-Z0-9-_]/g, '_') || 'greenbutton' // Replacing odd characters with underscores while keeping things readable
  const safeExt = ext && ['.xml', '.xlsx', '.xlsm', '.xls'].includes(ext.toLowerCase()) ? ext : '.xml' // Allowing only known extensions to slip through
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-') // Stamping the upload time so files never collide
  return `${timestamp}-${safeBase}${safeExt}` // Returning a friendly unique name ready for disk storage
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData() // Extracting the form payload so we can locate the file field
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Please attach a Green Button XML or XLSX file.' }, { status: 400 }) // Coaching the user to include a valid file when the field is empty
    }

    const arrayBuffer = await file.arrayBuffer() // Gently converting the file into an array buffer for Node consumption
    const buffer = Buffer.from(arrayBuffer) // Turning the buffer into a Node-ready structure for writing

    await fs.mkdir(GREENBUTTON_DIR, { recursive: true }) // Ensuring the destination folder exists before we write
    const safeName = sanitizeFileName(file.name || 'greenbutton.xml') // Creating a tidy filename that plays nicely with the OS
    const targetPath = path.join(GREENBUTTON_DIR, safeName) // Building the final destination path for the upload

    await fs.writeFile(targetPath, buffer) // Saving the upload so the parser can reach it later

    return NextResponse.json({ success: true, fileName: safeName }) // Celebrating success by telling the UI which file we kept
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error' // Capturing the root cause so we can share it back kindly
    console.error('Green Button upload failed', error) // Leaving a breadcrumb in the logs for easier debugging later
    return NextResponse.json({ success: false, error: `Upload failed: ${message}` }, { status: 500 }) // Letting the client know the upload hit a snag
  }
}


