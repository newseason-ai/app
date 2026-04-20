'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DashboardData } from '@/lib/queries/dashboard'
import { useDashboard } from '@/lib/queries/dashboard-client'
import { prefetchInterview } from '@/lib/queries/interview-client'
import { prefetchInterviews } from '@/lib/queries/interviews-client'
import { NewInterviewButton } from './new-interview-button'
import { InterviewList } from './interview-list'

export function DashboardShell({ initialData }: { initialData: DashboardData }) {
  const queryClient = useQueryClient()
  const { data: dashboardData = initialData } = useDashboard(initialData)

  useEffect(() => {
    void prefetchInterviews(queryClient)
    dashboardData.interviews.forEach(interview => {
      void prefetchInterview(queryClient, interview.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only prefetch from SSR payload
  }, [])

  const {
    companyName,
    responsesThisMonth,
    linksSent,
    optedIn,
    interviews,
  } = dashboardData

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0C0C0E;
          --surface: #1A1A1C;
          --ink: #ffffff;
          --ink-muted: #666;
          --ink-faint: #333;
          --border: rgba(255,255,255,0.05);
          --teal: #3DBFA0;
        }
        html, body { min-height: 100vh; background: var(--bg); }
        .main { padding: 36px 56px; max-width: 1100px; font-family: var(--font); }

        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .company-name { font-size: 24px; font-weight: 600; letter-spacing: -0.03em; color: var(--ink); }
        .topbar-right { display: flex; align-items: center; gap: 20px; }
        .pulse { display: flex; }
        .pulse-item { font-size: 12px; color: #2A2A2C; padding: 0 16px; border-right: 1px solid rgba(255,255,255,0.05); }
        .pulse-item:first-child { padding-left: 0; }
        .pulse-item:last-child { border-right: none; padding-right: 0; }
        .pulse-item span { color: #666; font-weight: 500; }
        .new-btn { font-family: var(--font); font-size: 12px; font-weight: 500; color: #111; background: #fff; border: none; border-radius: 100px; padding: 8px 18px; cursor: pointer; transition: opacity 0.15s; }
        .new-btn:hover { opacity: 0.85; }

        .col-header { display: grid; gap: 0; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
        .col-header-item { font-size: 10px; font-weight: 500; color: #2A2A2C; text-transform: uppercase; letter-spacing: 0.08em; padding-left: 20px; }
        .col-header-item:first-child { padding-left: 16px; }

        .empty-state { padding: 80px 0; text-align: center; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; margin-bottom: 24px; }
      `}</style>

      <div className="main">
        <div className="topbar">
          <div className="company-name">{companyName}</div>
          <div className="topbar-right">
            <div className="pulse">
              <div className="pulse-item">
                <span>{responsesThisMonth}</span> responses this month
              </div>
              <div className="pulse-item">
                <span>{linksSent}</span> links sent
              </div>
              <div className="pulse-item">
                <span>{optedIn}</span> opted in
              </div>
            </div>
            <NewInterviewButton />
          </div>
        </div>

        {interviews.length > 0 ? (
          <>
            <div
              className="col-header"
              style={{ gridTemplateColumns: '1fr 110px 160px 200px' }}
            >
              <div className="col-header-item">Interview</div>
              <div className="col-header-item">Responses</div>
              <div className="col-header-item">Progress</div>
              <div className="col-header-item">Insights</div>
            </div>
            <InterviewList interviews={interviews} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-title">No interviews yet</div>
            <div className="empty-sub">
              Create your first interview to start collecting voice feedback.
            </div>
            <NewInterviewButton />
          </div>
        )}
      </div>
    </>
  )
}
