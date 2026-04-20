import { db } from '@/lib/db'

type Citation = {
  sessionId: string
  respondentName: string | null
  quote: string
  sentiment: string | null
  selectionReason: string
}

type QuestionSummary = {
  questionText: string
  synthesis: string
  skipCount: number
  sentimentDistribution: {
    positive: number
    mixed: number
    negative: number
  }
  citations: Citation[]
}

type Theme = {
  title: string
  description: string
  sessionCount: number
  citations: Citation[]
}

type InsightContent = {
  questionSummaries: QuestionSummary[]
  themes: Theme[]
  sentimentDistribution: {
    positive: number
    mixed: number
    negative: number
  }
  signalStrength: 'strong' | 'moderate' | 'limited'
  completionQualityDistribution: {
    rich: number
    adequate: number
    thin: number
  }
}

export async function generateInsights(templateId: string): Promise<void> {
  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: {
        linkTokens: {
          include: {
            sessions: {
              where: {
                status: 'completed',
              },
              include: {
                findings: true,
                transcriptTurns: {
                  where: { speaker: 'user' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    })

    if (!template) {
      console.warn('[insights] template not found', templateId)
      return
    }

    // Get real sessions only (has user turns)
    const sessions = template.linkTokens
      .flatMap(lt => lt.sessions.map(s => ({
        ...s,
        respondentName: (lt.metadata as { name?: string })?.name ?? null,
      })))
      .filter(s => s.transcriptTurns.length > 0)

    if (sessions.length < 3) {
      console.warn('[insights] not enough sessions', templateId, sessions.length)
      return
    }

    const questions = Array.isArray(template.directedQuestions)
      ? (template.directedQuestions as { text: string; mode: string }[])
      : []

    // Build findings context grouped by question
    const findingsByQuestion = new Map<string, {
      finding: typeof sessions[0]['findings'][0]
      sessionId: string
      respondentName: string | null
    }[]>()

    const observedFindings: {
      finding: typeof sessions[0]['findings'][0]
      sessionId: string
      respondentName: string | null
    }[] = []

    for (const session of sessions) {
      for (const finding of session.findings) {
        if (finding.questionText) {
          const existing = findingsByQuestion.get(finding.questionText) ?? []
          existing.push({ finding, sessionId: session.id, respondentName: session.respondentName })
          findingsByQuestion.set(finding.questionText, existing)
        } else {
          observedFindings.push({ finding, sessionId: session.id, respondentName: session.respondentName })
        }
      }
    }

    // Sentiment distribution
    const sentimentCounts = { positive: 0, mixed: 0, negative: 0 }
    const qualityCounts = { rich: 0, adequate: 0, thin: 0 }
    for (const session of sessions) {
      if (session.sentiment === 'positive') sentimentCounts.positive++
      else if (session.sentiment === 'mixed') sentimentCounts.mixed++
      else if (session.sentiment === 'negative') sentimentCounts.negative++
      if (session.completionQuality === 'rich') qualityCounts.rich++
      else if (session.completionQuality === 'adequate') qualityCounts.adequate++
      else if (session.completionQuality === 'thin') qualityCounts.thin++
    }

    const signalStrength: 'strong' | 'moderate' | 'limited' =
      sessions.length >= 10 && qualityCounts.rich >= 6 ? 'strong'
      : sessions.length >= 5 ? 'moderate'
      : 'limited'

    // Build prompt
    const questionsSection = questions.map((q, i) => {
      const findings = findingsByQuestion.get(q.text) ?? []
      const skipCount = sessions.length - findings.length
      const candidateQuotes = findings.map(f => (
        `  - [${f.respondentName ?? 'Anonymous'} | session:${f.sessionId} | sentiment:${f.finding.sentiment ?? 'unknown'}] "${f.finding.evidence}"\n    Synthesis: ${f.finding.synthesis}`
      )).join('\n')

      return `QUESTION ${i + 1}: ${q.text}
Findings from ${findings.length} of ${sessions.length} sessions (${skipCount} skipped):
${candidateQuotes || '  (no findings — all sessions skipped this question)'}`
    }).join('\n\n')

    const observedSection = observedFindings.length > 0
      ? `OBSERVED THEMES (not tied to directed questions):
${observedFindings.map(f => (
  `  - [${f.respondentName ?? 'Anonymous'} | session:${f.sessionId} | title:${f.finding.title ?? 'untitled'} | sentiment:${f.finding.sentiment ?? 'unknown'}] "${f.finding.evidence}"\n    Synthesis: ${f.finding.synthesis}`
)).join('\n')}`
      : 'OBSERVED THEMES: none'

    const prompt = `You are a senior qualitative researcher synthesizing findings from ${sessions.length} voice interviews.

TEMPLATE: ${template.name}
DIRECTED QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}

---

FINDINGS PER QUESTION:
${questionsSection}

---

${observedSection}

---

Your task: produce a structured insight report. For each directed question:
1. Write a 2-3 sentence synthesis in third-person researcher voice summarizing what respondents said overall
2. Count sentiment distribution across findings for that question
3. From the candidate quotes above, select exactly 3 that together best represent the range of responses — aim for diversity of perspective, not just the most extreme. If fewer than 3 findings exist, include all of them. For each citation include a brief selectionReason explaining why you chose it.

For emerging themes: group the observed findings into coherent themes. Each theme should have a short title, a 1-2 sentence description, session count, and up to 3 representative citations chosen for diversity.

Respond with raw JSON only, no markdown, matching this exact structure:
{
  "questionSummaries": [
    {
      "questionText": string,
      "synthesis": string,
      "skipCount": number,
      "sentimentDistribution": { "positive": number, "mixed": number, "negative": number },
      "citations": [
        {
          "sessionId": string,
          "respondentName": string | null,
          "quote": string,
          "sentiment": string | null,
          "selectionReason": string
        }
      ]
    }
  ],
  "themes": [
    {
      "title": string,
      "description": string,
      "sessionCount": number,
      "citations": [
        {
          "sessionId": string,
          "respondentName": string | null,
          "quote": string,
          "sentiment": string | null,
          "selectionReason": string
        }
      ]
    }
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`)
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[]
    }

    const output = JSON.parse(data.choices[0].message.content) as {
      questionSummaries: QuestionSummary[]
      themes: Theme[]
    }

    const content: InsightContent = {
      questionSummaries: output.questionSummaries,
      themes: output.themes,
      sentimentDistribution: sentimentCounts,
      signalStrength,
      completionQualityDistribution: qualityCounts,
    }

    await db.insight.create({
      data: {
        templateId,
        sessionCount: sessions.length,
        content: content as any,
      },
    })

    console.info('[insights] generated', {
      templateId,
      sessionCount: sessions.length,
      signalStrength,
      questionCount: output.questionSummaries.length,
      themeCount: output.themes.length,
    })
  } catch (err) {
    console.error('[insights] generation failed', templateId, err)
    throw err
  }
}