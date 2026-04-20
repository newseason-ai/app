'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDuration } from '@/lib/format'
import { SendLinkModal } from '../../send-link-modal'
import { QuestionEditor } from '../../question-editor'
import type { InterviewData, Question, LinkRow, LinkStatus } from '@/lib/queries/interview'
import {
  interviewKeys,
  invalidateInterview,
  useInterview,
} from '@/lib/queries/interview-client'
import { prefetchSession } from '@/lib/queries/session-client'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_FILTERS = [
  'all',
  'completed',
  'no_response',
  'pending',
  'abandoned',
  'expired',
] as const
type Filter = typeof STATUS_FILTERS[number]

const STATUS_COLORS: Record<LinkStatus, { bg: string; color: string }> = {
  completed: { bg: '#0F3D2E', color: '#3DBFA0' },
  pending: { bg: 'rgba(255,255,255,0.07)', color: '#888' },
  no_response: { bg: 'rgba(255,255,255,0.05)', color: '#555' },
  abandoned: { bg: '#3D2A0A', color: '#EF9F27' },
  expired: { bg: '#2A1A1A', color: '#666' },
}

export function InterviewDetail({
  id,
  initialData,
}: {
  id: string
  initialData: InterviewData
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // ──────────────────────────────────────────────────────────
  // Main query. `initialData` seeds the cache from SSR so there's
  // zero loading state on first render. On return navigation, this
  // same cache is hit instantly; if stale (>30s), it'll refetch in
  // the background while still showing cached data (SWR semantics).
  // ──────────────────────────────────────────────────────────
  const { data } = useInterview(id, initialData)
  // Prefer cache; SSR seed guarantees we always have at least initialData.
  const { template, links, companyName: _companyName } = data ?? initialData

  // ──────────────────────────────────────────────────────────
  // Local UI state (unchanged from before)
  // ──────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ──────────────────────────────────────────────────────────
  // Edit form state — seeded from template, reset when editing toggles
  // ──────────────────────────────────────────────────────────
  const [name, setName] = useState(template.name)
  const [context, setContext] = useState(template.context ?? '')
  const [background, setBackground] = useState(template.background ?? '')
  const [questions, setQuestions] = useState<Question[]>(
    Array.isArray(template.directedQuestions) && template.directedQuestions.length > 0
      ? (template.directedQuestions as Question[])
      : [{ text: '', mode: 'guided' }]
  )

  // ──────────────────────────────────────────────────────────
  // Mutation: Save template changes
  //
  // Optimistic update pattern:
  // 1. onMutate: cancel in-flight queries, snapshot current cache,
  //    write expected new value to cache so UI updates instantly
  // 2. onError: roll back to snapshot if the mutation fails
  // 3. onSettled: invalidate the query so the true server state
  //    replaces our optimistic guess
  // ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      context: string | null
      background: string | null
      directedQuestions: Question[]
    }) => {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to save')
      }
      return res.json()
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: interviewKeys.detail(id) })
      const previous = queryClient.getQueryData<InterviewData>(
        interviewKeys.detail(id),
      )

      if (previous) {
        queryClient.setQueryData<InterviewData>(interviewKeys.detail(id), {
          ...previous,
          template: {
            ...previous.template,
            name: payload.name,
            context: payload.context,
            background: payload.background,
            directedQuestions: payload.directedQuestions,
          },
        })
      }
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(interviewKeys.detail(id), context.previous)
      }
    },
    onSuccess: () => {
      setEditing(false)
    },
    onSettled: () => {
      invalidateInterview(queryClient, id)
    },
  })

  // ──────────────────────────────────────────────────────────
  // Mutation: Generate a new link (replacement for expired/no_response)
  // No optimistic update here — we don't know the new token yet.
  // Just invalidate on settle so the table refreshes.
  // ──────────────────────────────────────────────────────────
  const newLinkMutation = useMutation({
    mutationFn: async (link: LinkRow) => {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          respondentName: link.respondentName,
          respondentContext: link.respondentContext,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate link')
      return res.json() as Promise<{ url: string }>
    },
    onSuccess: async (data) => {
      await navigator.clipboard.writeText(data.url).catch(() => {})
    },
    onSettled: () => {
      invalidateInterview(queryClient, id)
    },
  })

  // ──────────────────────────────────────────────────────────
  // Derived data (unchanged)
  // ──────────────────────────────────────────────────────────
  const filteredLinks = links
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => {
      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        l.respondentName?.toLowerCase().includes(term) ||
        l.respondentRef?.toLowerCase().includes(term)
      )
    })

  const completedLinks = links.filter(l => l.status === 'completed')
  const avgDuration =
    completedLinks.length > 0
      ? Math.round(
          completedLinks.reduce((sum, l) => sum + (l.session?.durationS ?? 0), 0) /
            completedLinks.length,
        )
      : null

  // ──────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────
  async function handleCopyLink(link: LinkRow) {
    const url = `${window.location.origin}/r/${link.token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleSave() {
    saveMutation.mutate({
      name,
      context: context || null,
      background: background || null,
      directedQuestions: questions.filter(q => q.text.trim()),
    })
  }

  function handleCancelEdit() {
    setEditing(false)
    setName(template.name)
    setContext(template.context ?? '')
    setBackground(template.background ?? '')
    setQuestions(
      Array.isArray(template.directedQuestions) && template.directedQuestions.length > 0
        ? (template.directedQuestions as Question[])
        : [{ text: '', mode: 'guided' }]
    )
    saveMutation.reset() // clear any error state
  }

  return (
    <>
      <div className="layout">
        <main className="main">
          <button className="back" onClick={() => router.push('/dashboard/interviews')}>
            ← Back to interviews
          </button>

          <div className="page-header">
            <div style={{ minWidth: 0, flex: 1 }}>
              {editing ? (
                <input
                  style={{
                    fontFamily: 'var(--font, system-ui)',
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#fff',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    outline: 'none',
                    padding: '0 0 4px 0',
                    width: '100%',
                    minWidth: 0,
                    display: 'block',
                    marginBottom: 4,
                  }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Interview name"
                />
              ) : (
                <div className="page-title">{template.name}</div>
              )}
              <div className="page-sub">
                {editing ? 'Editing · ' : ''}
                {timeAgo(template.createdAt)}
              </div>
            </div>
            <div className="header-actions">
              {!editing && (
                <>
                  <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    Send link ↗
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="layout-grid">
            {/* Left — interview config */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Interview setup</span>
                {editing && (
                  <button className="panel-action" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
              <div className="panel-body">
                {editing ? (
                  <>
                    <div className="field">
                      <div className="field-label">
                        Context
                        <span
                          style={{
                            color: '#333',
                            fontSize: 10,
                            fontWeight: 400,
                            textTransform: 'none',
                            letterSpacing: 0,
                            marginLeft: 4,
                          }}
                        >
                          optional
                        </span>
                      </div>
                      <textarea
                        className="field-textarea"
                        rows={2}
                        placeholder="The Acme team is improving the invoicing setup experience for new users."
                        value={context}
                        onChange={e => setContext(e.target.value)}
                      />
                      <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
                        Framed to the respondent. Sets the stage for the interview.
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">
                        Background
                        <span
                          style={{
                            color: '#333',
                            fontSize: 10,
                            fontWeight: 400,
                            textTransform: 'none',
                            letterSpacing: 0,
                            marginLeft: 4,
                          }}
                        >
                          optional
                        </span>
                      </div>
                      <textarea
                        className="field-textarea"
                        rows={2}
                        placeholder="Respondents are first-time users who signed up in the last 30 days. Probe on setup friction."
                        value={background}
                        onChange={e => setBackground(e.target.value)}
                      />
                      <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
                        Silent behavioral guidance for the AI. Respondents never hear this.
                      </div>
                    </div>
                    <div className="field">
                      <div className="field-label">Directed questions</div>
                      <QuestionEditor questions={questions} onChange={setQuestions} />
                    </div>
                    {saveMutation.isError && (
                      <div className="save-error">
                        {saveMutation.error instanceof Error
                          ? saveMutation.error.message
                          : 'Something went wrong'}
                      </div>
                    )}
                    <div className="save-row">
                      <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {template.context && (
                      <div className="field">
                        <div className="field-label">Context</div>
                        <div className="field-value">{template.context}</div>
                      </div>
                    )}
                    {template.background && (
                      <div className="field">
                        <div className="field-label">Background</div>
                        <div className="field-value">{template.background}</div>
                      </div>
                    )}
                    {Array.isArray(template.directedQuestions) &&
                      template.directedQuestions.length > 0 && (
                        <div className="field">
                          <div className="field-label">Directed questions</div>
                          {(template.directedQuestions as Question[]).map((q, i) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                              <div className="field-value">
                                {i + 1}. {q.text}
                              </div>
                              {q.mode === 'verbatim' && (
                                <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                                  Verbatim
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>

            {/* Right — links table */}
            <div className="panel">
              <div className="stat-row">
                <div>
                  <div className="stat-label">Links sent</div>
                  <div className="stat-value">{links.length}</div>
                </div>
                <div>
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{completedLinks.length}</div>
                </div>
                <div>
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">
                    {links.filter(l => l.status === 'pending').length}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Avg duration</div>
                  <div className="stat-value">{formatDuration(avgDuration)}</div>
                </div>
              </div>

              <div className="filter-bar">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f}
                    className={`filter-pill ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'no_response'
                      ? 'No response'
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && (
                      <span style={{ marginLeft: 4, opacity: 0.5 }}>
                        {links.filter(l => l.status === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="search-bar">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {filteredLinks.length > 0 ? (
                <div className="links-table">
                  <div className="link-row header">
                    <div className="link-col-label">Respondent</div>
                    <div className="link-col-label">Status</div>
                    <div className="link-col-label">Duration</div>
                    <div></div>
                  </div>
                  <div className="links-scroll">
                    {filteredLinks.map(link => {
                      const colors = STATUS_COLORS[link.status]
                      const isGenerating =
                        newLinkMutation.isPending && newLinkMutation.variables?.id === link.id
                      return (
                        <div
                          className="link-row"
                          key={link.id}
                          onMouseEnter={
                            link.status === 'completed' && link.session
                              ? () => {
                                  void prefetchSession(queryClient, link.session!.id)
                                }
                              : undefined
                          }
                        >
                          <div>
                            <div className="link-name">
                              {link.respondentName ?? link.respondentRef ?? 'Anonymous'}
                            </div>
                            <div className="link-time">{timeAgo(link.createdAt)}</div>
                          </div>
                          <div>
                            <span
                              className="link-badge"
                              style={{ background: colors.bg, color: colors.color }}
                            >
                              {link.status === 'no_response' ? 'No response' : link.status}
                            </span>
                          </div>
                          <div className="link-dur">
                            {formatDuration(link.session?.durationS ?? null)}
                          </div>
                          <div className="link-actions">
                            {link.status === 'completed' && link.session && (
                              <button
                                className="link-action-btn view"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/sessions/${link.session!.id}?from=${encodeURIComponent(template.name)}`,
                                  )
                                }
                              >
                                View transcript
                              </button>
                            )}
                            {(link.status === 'pending' || link.status === 'abandoned') && (
                              <button
                                className={`link-action-btn ${copiedId === link.id ? 'copied' : 'copy'}`}
                                onClick={() => handleCopyLink(link)}
                              >
                                {copiedId === link.id ? '✓ Copied' : 'Copy link'}
                              </button>
                            )}
                            {(link.status === 'expired' || link.status === 'no_response') && (
                              <button
                                className="link-action-btn newlink"
                                onClick={() => newLinkMutation.mutate(link)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? 'Generating...' : 'New link'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-links">
                  {search.trim()
                    ? `No results for "${search}"`
                    : filter === 'all'
                      ? 'No links sent yet — click "Send link" to generate your first.'
                      : `No ${filter} links.`}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <SendLinkModal
          templateId={template.id}
          templateName={template.name}
          onClose={() => {
            setShowModal(false)
            // SendLinkModal creates a link; invalidate so the table refreshes.
            invalidateInterview(queryClient, id)
          }}
        />
      )}
    </>
  )
}