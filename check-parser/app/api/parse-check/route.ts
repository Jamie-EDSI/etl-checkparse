import { NextRequest, NextResponse } from 'next/server'
import { parseCheckPDF } from '@/lib/ai'
import { appendToWorkbook, createFreshWorkbook } from '@/lib/excel'

export const maxDuration = 60 // allow up to 60s for large PDFs

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const pdfFile = formData.get('pdf') as File | null
    const existingXlsx = formData.get('xlsx') as File | null

    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF uploaded' }, { status: 400 })
    }

    // Convert PDF to base64
    const pdfBytes = await pdfFile.arrayBuffer()
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    // Parse with AI
    const result = await parseCheckPDF(pdfBase64)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Build or update the Excel workbook
    let xlsxBytes: ArrayBuffer
    if (existingXlsx) {
      const existingBytes = await existingXlsx.arrayBuffer()
      xlsxBytes = appendToWorkbook(existingBytes, result.students)
    } else {
      xlsxBytes = createFreshWorkbook(result.students)
    }

    // Return both the parsed data (for preview) and the xlsx file
    return NextResponse.json({
      students: result.students,
      xlsxBase64: Buffer.from(xlsxBytes).toString('base64'),
    })
  } catch (err) {
    console.error('Parse error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
