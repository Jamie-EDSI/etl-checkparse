'use client'

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'

interface Student {
  checkNumber: string
  lastName: string
  firstName: string
  customerId: string
  milestone: string
  amount: number
  month: string
  notes?: string
}

// ── Upload Tile ───────────────────────────────────────────────────────
function UploadTile({
  id, label, sublabel, accept, file, onFile, icon, accent, optional
}: {
  id: string, label: string, sublabel: string, accept: string,
  file: File | null, onFile: (f: File | null) => void,
  icon: React.ReactNode, accent: string, optional?: boolean
}) {
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const handle = useCallback((f: File) => onFile(f), [onFile])

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]; if (f) handle(f)
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`drop-zone relative cursor-pointer rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center min-h-[160px] ${
        file ? 'has-file' : drag ? 'drag-over border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handle(f) }} />

      {optional && !file && (
        <span className="absolute top-2.5 right-3 text-xs text-gray-400 font-medium">optional</span>
      )}

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${file ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <span className={file ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
      </div>

      <p className={`font-semibold text-sm mb-1 ${file ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
      <p className="text-xs text-gray-400 mb-2">{sublabel}</p>

      {file ? (
        <div className="flex items-center gap-1.5">
          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${accent} max-w-[180px] truncate`}>
            ✓ {file.name}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); if (ref.current) ref.current.value = '' }}
            className="text-gray-400 hover:text-gray-600 text-xs leading-none"
            title="Remove"
          >✕</button>
        </div>
      ) : (
        <span className="text-xs text-gray-400">Click or drag & drop</span>
      )}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────
function Badge({ text, color }: { text: string, color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
}

// ── Main ──────────────────────────────────────────────────────────────
export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[] | null>(null)
  const [xlsxBase64, setXlsxBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('')

  const parse = async () => {
    if (!pdfFile) return
    setLoading(true); setError(null); setStudents(null); setXlsxBase64(null)

    try {
      const fd = new FormData()
      fd.append('pdf', pdfFile)
      if (xlsxFile) fd.append('xlsx', xlsxFile)

      const res = await fetch('/api/parse-check', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.error) { setError(data.error); setLoading(false); return }

      setStudents(data.students)
      setXlsxBase64(data.xlsxBase64)
      setMonth(data.students?.[0]?.month ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
    setLoading(false)
  }

  const download = () => {
    if (!xlsxBase64) return
    const bytes = Uint8Array.from(atob(xlsxBase64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = xlsxFile ? xlsxFile.name : 'Pre-ETS_Check_Details.xlsx'
    a.click()
  }

  const reset = () => {
    setPdfFile(null); setXlsxFile(null); setStudents(null)
    setXlsxBase64(null); setError(null); setMonth('')
  }

  const totalAmount = students?.reduce((s, r) => s + r.amount, 0) ?? 0
  const checkNum = students?.[0]?.checkNumber ?? ''

  // Milestone color
  const milestoneColor = (m: string) => {
    const t = m.toLowerCase()
    if (t.startsWith('je')) return 'bg-purple-100 text-purple-700'
    if (t.startsWith('wpr')) return 'bg-blue-100 text-blue-700'
    if (t.startsWith('pse')) return 'bg-teal-100 text-teal-700'
    if (t.startsWith('sa')) return 'bg-amber-100 text-amber-700'
    if (t.startsWith('wbl')) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-none">Pre-ETS Check Parser</h1>
            <p className="text-xs text-gray-400 mt-0.5">Extract student payment data from check PDFs</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            Powered by Claude
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Upload section */}
        {!students && (
          <div className="space-y-4 fade-in">
            <p className="text-sm text-gray-500">Upload a check PDF to extract student rows — then optionally attach your existing tracking spreadsheet to append the new data directly into the right month tab.</p>

            <div className="grid grid-cols-2 gap-4">
              <UploadTile
                id="pdf" label="Check PDF" sublabel="The payment check to parse"
                accept=".pdf" file={pdfFile} onFile={setPdfFile}
                accent="bg-blue-100 text-blue-700"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                }
              />
              <UploadTile
                id="xlsx" label="Tracking spreadsheet" sublabel="Append to existing file"
                accept=".xlsx,.xls" file={xlsxFile} onFile={setXlsxFile}
                accent="bg-green-100 text-green-700" optional
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                  </svg>
                }
              />
            </div>

            {!xlsxFile && (
              <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                💡 No spreadsheet uploaded — a fresh one will be created with the correct month tab.
              </p>
            )}

            <button
              onClick={parse}
              disabled={!pdfFile || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {loading ? (
                <>
                  <svg className="spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Reading check with AI…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Parse check
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fade-in bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-600 text-xs underline">dismiss</button>
          </div>
        )}

        {/* Results */}
        {students && (
          <div className="fade-in space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Check #', value: checkNum || '—' },
                { label: 'Month', value: month || '—' },
                { label: 'Students', value: String(students.length) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                  <p className="text-lg font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Student table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Extracted rows</p>
                <p className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-gray-900">${totalAmount.toLocaleString()}</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Last name', 'First name', 'Customer ID', 'Milestone', 'Amount', 'Notes'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{s.lastName}</td>
                        <td className="px-3 py-2.5 text-gray-700">{s.firstName}</td>
                        <td className="px-3 py-2.5 text-gray-500 font-mono">{s.customerId}</td>
                        <td className="px-3 py-2.5"><Badge text={s.milestone} color={milestoneColor(s.milestone)} /></td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800">${s.amount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-gray-400">{s.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={download}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download updated spreadsheet
              </button>
              <button
                onClick={reset}
                className="px-5 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium text-sm rounded-xl transition-colors"
              >
                Parse another check
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {xlsxFile
                ? `Rows appended to the "${month}" tab of ${xlsxFile.name}`
                : `Fresh spreadsheet created with a "${month}" tab`}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
