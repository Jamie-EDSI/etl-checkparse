/**
 * AI Provider Abstraction
 * ──────────────────────────────────────────────────────────────────────
 * To swap from Claude → Azure AI Foundry later:
 *
 *  1. npm install openai
 *  2. Change PROVIDER to 'azure'
 *  3. Add AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY to your .env
 *
 * Nothing else in the app needs to change.
 * ──────────────────────────────────────────────────────────────────────
 */

const PROVIDER = (process.env.AI_PROVIDER as 'claude' | 'azure') ?? 'claude'

export interface ParsedStudent {
  checkNumber: string
  lastName: string
  firstName: string
  customerId: string
  milestone: string
  amount: number
  month: string
  notes?: string
}

export interface ParseResult {
  students: ParsedStudent[]
  rawText?: string
  error?: string
}

// ── Claude (default) ─────────────────────────────────────────────────
async function parseWithClaude(pdfBase64: string): Promise<ParseResult> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  })

  const text = response.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
  return parseAIResponse(text)
}

// ── Azure AI Foundry (future) ─────────────────────────────────────────
async function parseWithAzure(pdfBase64: string): Promise<ParseResult> {
  // Uncomment when ready to switch:
  //
  // const { AzureOpenAI } = await import('openai')
  // const client = new AzureOpenAI({
  //   endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  //   apiKey: process.env.AZURE_OPENAI_KEY!,
  //   apiVersion: '2024-02-01',
  // })
  // const response = await client.chat.completions.create({
  //   model: process.env.AZURE_DEPLOYMENT_NAME ?? 'gpt-4o',
  //   messages: [
  //     { role: 'system', content: 'You extract check receipt data.' },
  //     { role: 'user', content: [
  //       { type: 'image_url', image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
  //       { type: 'text', text: EXTRACTION_PROMPT }
  //     ]}
  //   ]
  // })
  // return parseAIResponse(response.choices[0].message.content ?? '')

  throw new Error('Azure provider not yet configured — set AI_PROVIDER=azure and add AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_KEY to .env')
}

// ── Shared prompt ─────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `You are extracting data from a Pre-ETS check payment document.

Extract every student row from this check. The check has multiple pages listing students.
Page 3 (or the last data page) typically shows the month this check covers.

Return ONLY a JSON object in this exact format — no preamble, no markdown fences:
{
  "month": "October",
  "checkNumber": "22069",
  "students": [
    {
      "lastName": "Smith",
      "firstName": "John",
      "customerId": "624620",
      "milestone": "JE 4",
      "amount": 468
    }
  ]
}

Rules:
- milestone comes from the last 3 digits / characters of the Invoice Number column
- amount is numeric only (no $ sign)
- month is the calendar month this check batch covers (from page 3)
- checkNumber is the check number at the top of the document
- Include ALL students listed, even if the same student appears multiple times (different milestones)
- If a row looks like a repeated milestone, still include it and add a "notes" field: "Repeated Milestone"
- customerId should be a string of the numeric ID`

// ── Response parser ───────────────────────────────────────────────────
function parseAIResponse(text: string): ParseResult {
  const clean = text.replace(/```json|```/g, '').trim()
  const data = JSON.parse(clean)

  const students: ParsedStudent[] = (data.students ?? []).map((s: Record<string, unknown>) => ({
    checkNumber: String(data.checkNumber ?? ''),
    lastName: String(s.lastName ?? ''),
    firstName: String(s.firstName ?? ''),
    customerId: String(s.customerId ?? ''),
    milestone: String(s.milestone ?? ''),
    amount: Number(s.amount ?? 0),
    month: String(data.month ?? ''),
    notes: s.notes ? String(s.notes) : undefined,
  }))

  return { students, rawText: text }
}

// ── Public entry point ────────────────────────────────────────────────
export async function parseCheckPDF(pdfBase64: string): Promise<ParseResult> {
  try {
    if (PROVIDER === 'azure') return await parseWithAzure(pdfBase64)
    return await parseWithClaude(pdfBase64)
  } catch (err) {
    return { students: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
