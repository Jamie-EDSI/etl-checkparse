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

// ── Icons ─────────────────────────────────────────────────────────────
const IconDoc = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
)
const IconSheet = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/>
  </svg>
)
const IconBolt = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
)
const IconDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
)

// ── Sidebar ───────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', emoji: '◈', label: 'Dashboard' },
  { id: 'parse',     emoji: '📋', label: 'Parse Check' },
  { id: 'history',   emoji: '◷', label: 'History' },
]

function Sidebar({ active }: { active: string }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#111111] border-r border-[#1f1f1f] flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <span className="text-[#00d4ff] text-xl leading-none select-none">✦</span>
          <span className="text-white font-bold text-sm tracking-tight">Pre-ETS</span>
        </div>
        <p className="text-[#3a3a3a] text-xs mt-1">Check Parser</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, emoji, label }) => {
          const isActive = active === id
          return (
            <div
              key={id}
              className={`relative flex items-center gap-3 mx-3 px-3 py-2 rounded-lg text-sm cursor-default select-none transition-all ${
                isActive
                  ? 'bg-[#00d4ff]/[0.09] text-[#00d4ff]'
                  : 'text-[#555] hover:text-[#888] hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#00d4ff]" />
              )}
              <span className="text-base leading-none w-4 text-center">{emoji}</span>
              <span className="font-medium">{label}</span>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1f1f1f]">
        <p className="text-[#333] text-xs">Powered by Claude</p>
      </div>
    </aside>
  )
}

// ── Upload Tile ───────────────────────────────────────────────────────
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
      className={`drop-zone relative cursor-pointer rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center min-h-[160px] ${
        file
          ? 'has-file'
          : drag
            ? 'drag-over'
            : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#00d4ff]/40 hover:shadow-[0_0_22px_rgba(0,212,255,0.08)]'
      }`}
    >
      <input
        ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handle(f) }}
      />

      {optional && !file && (
        <span className="absolute top-2.5 right-3 text-xs text-[#444] font-medium">optional</span>
      )}

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${file ? 'bg-[#00d4ff]/10' : 'bg-[#222]'}`}>
        <span className={file ? 'text-[#00d4ff]' : 'text-[#555]'}>{icon}</span>
      </div>

      <p className={`font-semibold text-sm mb-1 ${file ? 'text-[#00d4ff]' : 'text-[#e5e5e5]'}`}>{label}</p>
      <p className="text-xs text-[#555] mb-2">{sublabel}</p>

      {file ? (
        <div className="flex items-center gap-1.5">
          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-[#00d4ff]/10 text-[#00d4ff] max-w-[180px] truncate">
            ✓ {file.name}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); if (ref.current) ref.current.value = '' }}
            className="text-[#444] hover:text-[#777] text-xs leading-none"
            title="Remove"
          >✕</button>
        </div>
      ) : (
        <span className="text-xs text-[#3a3a3a]">Click or drag & drop</span>
      )}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────
function Badge({ text, color }: { text: string, color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
}

// ── Section label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-3">{children}</p>
  )
}

// ── Main ──────────────────────────────────────────────────────────────
export default function Home() {
  const [pdfFile, setPdfFile]   = useState<File | null>(null)
  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [loading, setLoading]   = useState(false)
  const [students, setStudents] = useState<Student[] | null>(null)
  const [xlsxBase64, setXlsxBase64] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [month, setMonth]       = useState<string>('')

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
  const checkNum    = students?.[0]?.checkNumber ?? ''

  const milestoneColor = (m: string) => {
    const t = m.toLowerCase()
    if (t.startsWith('je'))  return 'bg-purple-500/15 text-purple-300'
    if (t.startsWith('wpr')) return 'bg-blue-500/15 text-blue-300'
    if (t.startsWith('pse')) return 'bg-teal-500/15 text-teal-300'
    if (t.startsWith('sa'))  return 'bg-amber-500/15 text-amber-300'
    if (t.startsWith('wbl')) return 'bg-emerald-500/15 text-emerald-300'
    return 'bg-[#222] text-[#777]'
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar active={students ? 'parse' : 'parse'} />

      {/* ── Main content ── */}
      <main className="ml-[220px] flex-1 min-h-screen bg-[#0f0f0f]">
        <div className="max-w-[800px] mx-auto px-8 py-10">

          {/* ── Upload view ── */}
          {!students && (
            <div className="fade-in space-y-7">

              {/* Page title */}
              <div>
                <span className="text-[#00d4ff] text-2xl leading-none select-none">✦</span>
                <h1 className="text-3xl font-bold text-white mt-3 mb-1">Parse Check</h1>
                <p className="text-[#666] text-sm leading-relaxed">
                  Upload a payment check PDF to extract student rows — then optionally attach your
                  existing tracking spreadsheet to append data directly to the right month tab.
                </p>
              </div>

              {/* Upload tiles */}
              <div>
                <SectionLabel>Upload files</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <UploadTile
                    id="pdf" label="Check PDF" sublabel="The payment check to parse"
                    accept=".pdf" file={pdfFile} onFile={setPdfFile}
                    icon={<IconDoc />}
                  />
                  <UploadTile
                    id="xlsx" label="Tracking spreadsheet" sublabel="Append to existing file"
                    accept=".xlsx,.xls" file={xlsxFile} onFile={setXlsxFile} optional
                    icon={<IconSheet />}
                  />
                </div>

                {!xlsxFile && (
                  <p className="text-xs text-[#555] border border-[#1f1f1f] bg-[#141414] rounded-lg px-3 py-2.5 mt-3">
                    💡 No spreadsheet uploaded — a fresh one will be created with the correct month tab.
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={parse}
                disabled={!pdfFile || loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#00d4ff] hover:bg-[#00bfe8] disabled:opacity-25 disabled:cursor-not-allowed text-black font-bold text-sm rounded-lg transition-all hover:shadow-[0_0_28px_rgba(0,212,255,0.35)]"
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
                    <IconBolt />
                    Parse check
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Error banner ── */}
          {error && (
            <div className="fade-in mt-4 border-l-4 border-red-500 bg-[#1a1a1a] px-4 py-3 rounded-r-lg text-sm text-[#e5e5e5]">
              <span className="text-red-400 font-semibold">Error:</span> {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-[#555] hover:text-[#888] text-xs underline"
              >dismiss</button>
            </div>
          )}

          {/* ── Results view ── */}
          {students && (
            <div className="fade-in space-y-6">

              {/* Page title */}
              <div>
                <span className="text-[#00d4ff] text-2xl leading-none select-none">✦</span>
                <h1 className="text-3xl font-bold text-white mt-3 mb-1">Results</h1>
                <p className="text-[#666] text-sm">
                  Extracted {students.length} student row{students.length !== 1 ? 's' : ''} from the check PDF.
                </p>
              </div>

              {/* Summary cards */}
              <div>
                <SectionLabel>Summary</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Check #',  value: checkNum || '—' },
                    { label: 'Month',    value: month || '—' },
                    { label: 'Students', value: String(students.length) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4">
                      <p className="text-xs text-[#555] uppercase tracking-widest font-semibold mb-2">{label}</p>
                      <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Extracted rows</SectionLabel>
                  <p className="text-xs text-[#555] -mt-3">
                    Total: <span className="text-white font-semibold">${totalAmount.toLocaleString()}</span>
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#222] border-b border-[#2a2a2a]">
                          {['Last name', 'First name', 'Customer ID', 'Milestone', 'Amount', 'Notes'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-[#555] uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <tr
                            key={i}
                            className={`border-b border-[#1f1f1f] hover:bg-[#222] transition-colors ${i % 2 === 1 ? 'bg-[#1c1c1c]' : 'bg-[#1a1a1a]'}`}
                          >
                            <td className="px-4 py-2.5 font-medium text-[#e5e5e5]">{s.lastName}</td>
                            <td className="px-4 py-2.5 text-[#aaa]">{s.firstName}</td>
                            <td className="px-4 py-2.5 text-[#666] font-mono">{s.customerId}</td>
                            <td className="px-4 py-2.5"><Badge text={s.milestone} color={milestoneColor(s.milestone)} /></td>
                            <td className="px-4 py-2.5 font-semibold text-[#e5e5e5]">${s.amount.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-[#555]">{s.notes ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-emerald-600/40 bg-emerald-600/[0.08] hover:bg-emerald-600/[0.15] text-emerald-400 font-semibold text-sm rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]"
                >
                  <IconDown />
                  Download spreadsheet
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-3 border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222] text-[#666] hover:text-[#999] font-medium text-sm rounded-lg transition-all"
                >
                  Parse another
                </button>
              </div>

              <p className="text-xs text-[#444] text-center">
                {xlsxFile
                  ? `Rows appended to the "${month}" tab of ${xlsxFile.name}`
                  : `Fresh spreadsheet created with a "${month}" tab`}
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
