import * as XLSX from 'xlsx'
import { ParsedStudent } from './ai'

const MONTH_ORDER = [
  'September','October','November','December',
  'January','February','March','April','May','June','July','August'
]

const HEADERS = ['Check', 'Last Name', 'First Name', 'Customer ID', 'Milestone', 'Amount', 'Notes']

/**
 * Takes the existing workbook bytes + new students,
 * appends rows to the correct month sheet, returns updated bytes.
 */
export function appendToWorkbook(
  existingBytes: ArrayBuffer,
  students: ParsedStudent[]
): ArrayBuffer {
  const wb = XLSX.read(existingBytes, { type: 'array' })

  // Group students by month
  const byMonth: Record<string, ParsedStudent[]> = {}
  for (const s of students) {
    const m = s.month || 'Unknown'
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(s)
  }

  for (const [month, rows] of Object.entries(byMonth)) {
    let ws = wb.Sheets[month]

    if (!ws) {
      // Create the sheet if it doesn't exist yet
      ws = XLSX.utils.aoa_to_sheet([HEADERS])
      // Insert in calendar order
      const insertAfter = findInsertPosition(wb.SheetNames, month)
      XLSX.utils.book_append_sheet(wb, ws, month)
      // Move to right position
      const names = wb.SheetNames
      names.splice(names.indexOf(month), 1)
      names.splice(insertAfter, 0, month)
    }

    // Find last used row
    const existing = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
    // Ensure header row exists
    if (existing.length === 0 || !existing[0].includes('Check')) {
      XLSX.utils.sheet_add_aoa(ws, [HEADERS], { origin: 'A1' })
    }
    const nextRow = (ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.r + 2 : 2)

    const newRows = rows.map(s => [
      s.checkNumber,
      s.lastName,
      s.firstName,
      s.customerId,
      s.milestone,
      s.amount,
      s.notes ?? '',
    ])

    XLSX.utils.sheet_add_aoa(ws, newRows, { origin: { r: nextRow - 1, c: 0 } })
    wb.Sheets[month] = ws
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

/**
 * Build a fresh workbook from scratch if no existing file uploaded.
 */
export function createFreshWorkbook(students: ParsedStudent[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()

  // Totals sheet placeholder
  const totalsWs = XLSX.utils.aoa_to_sheet([['', 'Month', 'Total']])
  XLSX.utils.book_append_sheet(wb, totalsWs, 'Totals')

  const byMonth: Record<string, ParsedStudent[]> = {}
  for (const s of students) {
    const m = s.month || 'Unknown'
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(s)
  }

  for (const month of MONTH_ORDER) {
    if (!byMonth[month]) continue
    const rows = byMonth[month].map(s => [
      s.checkNumber, s.lastName, s.firstName,
      s.customerId, s.milestone, s.amount, s.notes ?? ''
    ])
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, month)
  }

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

function findInsertPosition(sheetNames: string[], targetMonth: string): number {
  const targetIdx = MONTH_ORDER.indexOf(targetMonth)
  if (targetIdx === -1) return sheetNames.length

  for (let i = sheetNames.length - 1; i >= 0; i--) {
    const idx = MONTH_ORDER.indexOf(sheetNames[i])
    if (idx !== -1 && idx < targetIdx) return i + 1
  }
  return 1 // after Totals
}
