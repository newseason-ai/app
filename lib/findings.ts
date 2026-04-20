import { db } from '@/lib/db'

type FindingOutput = {
  questionText: string | null
  title: string | null
  synthesis: string
  evidence: string
  sentiment: string | null
  turnIndex: number | null
}

type GenerationOutput = {
  sentiment: 'positive' | 'mixed' | 'negative'
  completionQuality: 'rich' | 'adequate' | 'thin'
  findings: FindingOutput[]
}

export async function generateFindings(sessionId: string): Promise<void> {
  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        transcriptTurns: {
          where: { speaker: { not: 'system' } },
          orderBy: { turnIndex: 'asc' },
        },
        linkToken: {
          include: {
            template: true,
          },
        },
      },
    })

    if (!session) {
      console.warn('[findings] session not found', sessionId)
      return
    }

    const turns = session.transcriptTurns
    const userTurns = turns.filter(t => t.speaker === 'user')
    if (userTurns.length === 0) {
      console.info('[findings] no user turns, skipping', sessionId)
      return
    }

    const template = session.linkToken.template
    const questions = Array.isArray(template.directedQuestions)
      ? (template.directedQuestions as { text: string; mode: string }[])
      : []

    const transcriptText = turns
      .map(t => `[${t.speaker.toUpperCase()} ${t.turnIndex}] ${t.content}`)
      .join('\n')

    const questionsText = questions.length > 0
      ? questions.map((q, i) => `${i + 1}. [${q.mode}] ${q.text}`).join('\n')
      : 'No directed questions — open exploration.'

    const prompt = `You are a qualitative researcher analyzing a voice interview transcript. Extract structured findings from this conversation.

TEMPLATE QUESTIONS:
${questionsText}

TRANSCRIPT (speaker label followed by turn index):
${transcriptText}

Respond with a JSON object exactly matching this structure:
{
  "sentiment": "positive" | "mixed" | "negative",
  "completionQuality": "rich" | "adequate" | "thin",
  "findings": [
    {
      "questionText": string | null,
      "title": string | null,
      "synthesis": string,
      "evidence": string,
      "sentiment": "positive" | "negative" | "neutral",
      "turnIndex": number | null
    }
  ]
}

Rules:
- For each directed question that was meaningfully addressed, produce one finding with questionText set to the exact question text and title null
- For significant themes not covered by directed questions, produce findings with questionText null and a short title (3-6 words, title case) summarizing the theme
- synthesis: 1-2 sentences in third person researcher voice summarizing what the respondent said
- evidence: the respondent's most relevant verbatim words (user turns only)
- turnIndex: the turn index number of the transcript turn that contains the evidence
- sentiment: sentiment toward the specific topic of this finding
- completionQuality: rich = detailed engaged responses, adequate = reasonable responses, thin = brief disengaged responses
- Only produce directed findings where there is genuine signal. Skip questions the respondent skipped or deflected entirely.
- After addressing all directed questions, review the full transcript again for any remaining signal worth capturing. Look for:
  - Recurring themes or concerns the respondent kept returning to
  - Surprising asides or context that reframes their answers
  - Behavioral cues — hesitation, enthusiasm, frustration — that aren't captured in the directed findings
  - Anything the respondent seemed to genuinely care about that didn't fit a directed question
  - Contextual details about their life, habits, or situation that could inform product decisions
  Do not leave signal on the table. If something felt meaningful in the conversation, capture it.
- For observed findings (questionText null), generate a short title (3-6 words, title case) that names the theme or signal. e.g. "Doctor Recommended Purchase", "Price Sensitivity vs. Perceived Value"
- Respond with raw JSON only, no markdown, no explanation.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`)
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[]
    }

    const output = JSON.parse(data.choices[0].message.content) as GenerationOutput

    await db.$transaction(async (tx) => {
      // Update session sentiment and completion quality
      await tx.session.update({
        where: { id: sessionId },
        data: {
          sentiment: output.sentiment,
          completionQuality: output.completionQuality,
        },
      })

      // Delete any existing findings (idempotent — safe to rerun)
      await tx.finding.deleteMany({ where: { sessionId } })

      // Write new findings
      if (output.findings.length > 0) {
        await tx.finding.createMany({
          data: output.findings.map(f => ({
            sessionId,
            questionText: f.questionText ?? null,
            title: f.title ?? null,
            synthesis: f.synthesis,
            evidence: f.evidence,
            sentiment: f.sentiment ?? null,
            turnIndex: f.turnIndex ?? null,
          })),
        })
      }
    })

    console.info('[findings] generated', {
      sessionId,
      sentiment: output.sentiment,
      completionQuality: output.completionQuality,
      findingCount: output.findings.length,
    })
  } catch (err) {
    console.error('[findings] generation failed', sessionId, err)
  }
}