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

function UploadTile({
  id, label, sublabel, accept, file, onFile, icon, optional
}: {
  id: string, label: string, sublabel: string, accept: string,
  file: File | null, onFile: (f: File | null) => void,
  icon: React.ReactNode, optional?: boolean
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
      className={`drop-zone relative cursor-pointer rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center min-h-[170px] ${
        file
          ? 'has-file'
          : drag
            ? 'drag-over'
            : 'border-white/10 bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/[0.04] hover:shadow-[0_0_28px_rgba(59,130,246,0.1)]'
      }`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handle(f) }} />

      {optional && !file && (
        <span className="absolute top-2.5 right-3 text-xs text-white/25 font-medium">optional</span>
      )}

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${file ? 'bg-blue-500/20' : 'bg-white/5'}`}>
        <span className={file ? 'text-blue-400' : 'text-white/35'}>{icon}</span>
      </div>

      <p className={`font-semibold text-sm mb-1 ${file ? 'text-blue-300' : 'text-white/75'}`}>{label}</p>
      <p className="text-xs text-white/30 mb-2">{sublabel}</p>

      {file ? (
        <div className="flex items-center gap-1.5">
          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/20 text-blue-300 max-w-[180px] truncate">
            ✓ {file.name}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); if (ref.current) ref.current.value = '' }}
            className="text-white/25 hover:text-white/55 text-xs leading-none"
            title="Remove"
          >✕</button>
        </div>
      ) : (
        <span className="text-xs text-white/20">Click or drag & drop</span>
      )}
    </div>
  )
}

function Badge({ text, color }: { text: string, color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
}

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

  const milestoneColor = (m: string) => {
    const t = m.toLowerCase()
    if (t.startsWith('je'))  return 'bg-purple-500/20 text-purple-300'
    if (t.startsWith('wpr')) return 'bg-blue-500/20 text-blue-300'
    if (t.startsWith('pse')) return 'bg-teal-500/20 text-teal-300'
    if (t.startsWith('sa'))  return 'bg-amber-500/20 text-amber-300'
    if (t.startsWith('wbl')) return 'bg-green-500/20 text-green-300'
    return 'bg-white/10 text-white/55'
  }

  const step = students ? 'results' : 'upload'

  return (
    <main
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(59,130,246,0.18), transparent) #070d24' }}
    >
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Pre-ETS Check Parser</span>
          </div>

          {/* Step pills */}
          <nav className="flex items-center gap-1 ml-4">
            <button
              onClick={step === 'results' ? reset : undefined}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === 'upload'
                  ? 'bg-white text-gray-900 shadow-[0_0_16px_rgba(255,255,255,0.15)]'
                  : 'text-white/45 hover:text-white/70'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Upload
            </button>
            <button
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === 'results'
                  ? 'bg-white text-gray-900 shadow-[0_0_16px_rgba(255,255,255,0.15)]'
                  : 'text-white/25 cursor-default'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Results
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-7">

        {/* ── Hero ── */}
        {!students && (
          <div className="text-center pb-2 fade-in">
            <h1 className="font-display text-5xl text-white leading-[1.12] tracking-tight">
              Extract Student Payment Data
            </h1>
            <p className="font-display text-5xl text-blue-400 leading-[1.12] mt-1">
              from Check PDFs
            </p>
            <p className="text-white/35 mt-5 text-sm leading-relaxed">
              Upload a payment check PDF to extract student rows — then optionally attach your<br/>
              existing tracking spreadsheet to append data directly to the right month tab.
            </p>
          </div>
        )}

        {/* ── Upload ── */}
        {!students && (
          <div className="space-y-4 fade-in">
            <div className="grid grid-cols-2 gap-4">
              <UploadTile
                id="pdf" label="Check PDF" sublabel="The payment check to parse"
                accept=".pdf" file={pdfFile} onFile={setPdfFile}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                }
              />
              <UploadTile
                id="xlsx" label="Tracking spreadsheet" sublabel="Append to existing file"
                accept=".xlsx,.xls" file={xlsxFile} onFile={setXlsxFile} optional
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                  </svg>
                }
              />
            </div>

            {!xlsxFile && (
              <p className="text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                💡 No spreadsheet uploaded — a fresh one will be created with the correct month tab.
              </p>
            )}

            <button
              onClick={parse}
              disabled={!pdfFile || loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl transition-all hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]"
            >
              {loading ? (
                <>
                  <svg className="spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Reading check…
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

        {/* ── Error ── */}
        {error && (
          <div className="fade-in bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400/60 hover:text-red-300 text-xs underline">dismiss</button>
          </div>
        )}

        {/* ── Results ── */}
        {students && (
          <div className="fade-in space-y-4">
            {/* Hero on results */}
            <div className="pb-1">
              <p className="text-xs font-semibold text-blue-400/70 uppercase tracking-widest mb-1">Extracted</p>
              <h2 className="font-display text-4xl text-white">Student Rows</h2>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Check #', value: checkNum || '—' },
                { label: 'Month',   value: month || '—' },
                { label: 'Students', value: String(students.length) },
              ].map(({ label, value }) => (
                <div key={label} className="card-dark rounded-2xl px-4 py-3">
                  <p className="text-xs text-white/35 font-medium mb-0.5">{label}</p>
                  <p className="text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Student table */}
            <div className="card-dark rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-sm font-semibold text-white/80">Extracted rows</p>
                <p className="text-sm text-white/40">
                  Total: <span className="font-semibold text-white">${totalAmount.toLocaleString()}</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      {['Last name', 'First name', 'Customer ID', 'Milestone', 'Amount', 'Notes'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-white/35 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {students.map((s, i) => (
                      <tr key={i} className="hover:bg-white/[0.025] transition-colors">
                        <td className="px-3 py-2.5 font-medium text-white/90">{s.lastName}</td>
                        <td className="px-3 py-2.5 text-white/70">{s.firstName}</td>
                        <td className="px-3 py-2.5 text-white/45 font-mono">{s.customerId}</td>
                        <td className="px-3 py-2.5"><Badge text={s.milestone} color={milestoneColor(s.milestone)} /></td>
                        <td className="px-3 py-2.5 font-semibold text-white/90">${s.amount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-white/35">{s.notes ?? ''}</td>
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
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-2xl transition-all hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download spreadsheet
              </button>
              <button
                onClick={reset}
                className="px-5 py-3.5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80 font-medium text-sm rounded-2xl transition-all hover:shadow-[0_0_18px_rgba(255,255,255,0.06)]"
              >
                Parse another
              </button>
            </div>

            <p className="text-xs text-white/25 text-center">
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
