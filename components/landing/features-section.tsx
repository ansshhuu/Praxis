'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  GitBranch, FileSearch, Users, MessageSquare, BarChart3, Clock,
  ArrowRight, Mail, Shield, Database, Bell, FileText,
} from 'lucide-react'


/* ── Praxis sun-ray icon ─────────────────────────────────── */
function PraxisIcon({ size = 22, color = '#F5CA50' }: { size?: number; color?: string }) {
  const s = size, c = s / 2, rays = 8
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const rad = (i * 360 / rays * Math.PI) / 180
        const inner = c * 0.35, outer = c * 0.82
        return <line key={i} x1={c + inner * Math.cos(rad)} y1={c + inner * Math.sin(rad)} x2={c + outer * Math.cos(rad)} y2={c + outer * Math.sin(rad)} stroke={color} strokeWidth={s * 0.09} strokeLinecap="round" />
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

/* ── Module data ─────────────────────────────────────────── */
const modules = [
  {
    id: 'workflows',
    num: '01',
    icon: GitBranch,
    title: 'Workflow Automation',
    desc: 'Build no-code automation pipelines with drag-and-drop AI nodes, branching logic, and real-time execution monitoring — all without writing a single line of code.',
    link: '/workflows',
  },
  {
    id: 'documents',
    num: '02',
    icon: FileSearch,
    title: 'Document Intelligence',
    desc: 'Extract, classify, and summarize documents using OCR and GPT-powered AI at enterprise scale. Turn unstructured PDFs into actionable structured data instantly.',
    link: '/documents',
  },
  {
    id: 'resumes',
    num: '03',
    icon: Users,
    title: 'Resume Screening',
    desc: 'Rank candidates automatically with AI scoring on skills, experience, and role fit. Cut screening time by 80% and surface your best matches in seconds.',
    link: '/resumes',
  },
  {
    id: 'chat',
    num: '04',
    icon: MessageSquare,
    title: 'AI Assistant',
    desc: "Context-aware assistant that queries your workflows, answers questions, and triggers actions via natural language. Your team's copilot, available 24/7.",
    link: '/chat',
  },
  {
    id: 'analytics',
    num: '05',
    icon: BarChart3,
    title: 'Reports & Analytics',
    desc: 'Deep execution analytics with trend charts, success rate dashboards, and automated reports. Understand exactly how your automation is performing.',
    link: '/analytics',
  },
  {
    id: 'scheduler',
    num: '06',
    icon: Clock,
    title: 'Automation & Scheduler',
    desc: 'Schedule cron jobs and automated tasks with precision. Monitor status, configure retry logic, and keep every recurring process running on time.',
    link: '/scheduler',
  },
]

/* ══════════════════════════════════════════════════════════
   PREVIEW CARDS
   ══════════════════════════════════════════════════════════ */
function PreviewWorkflows() {
  const nodes = [
    { type: 'Trigger', label: 'New Email', sub: 'Gmail inbox', border: '#86efac', badgeBg: '#f0fdf4', iconColor: '#16a34a', Icon: Mail },
    { type: 'AI Classify', label: 'Extract Invoice', sub: 'AI node', border: '#c4b5fd', badgeBg: '#f5f3ff', iconColor: '#7c3aed', Icon: Shield },
    { type: 'Save to DB', label: 'Save Record', sub: 'Invoices table', border: '#fdba74', badgeBg: '#fff7ed', iconColor: '#ea580c', Icon: Database },
    { type: 'Notify', label: 'Email Team', sub: 'Notify sender', border: '#fde68a', badgeBg: '#fffbeb', iconColor: '#d97706', Icon: Bell },
  ]
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
          <PraxisIcon size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>Praxis</span>
        </div>
        <span style={{ fontSize: 10, color: '#B5AFA9', marginLeft: 8, flex: 1 }}>Workflows / Invoice Approval</span>
        <span style={{ fontSize: 9, color: '#76E012', fontWeight: 700 }}>&#10003; Saved</span>
      </div>
      <div className="sss-tabs-row">
        {['Builder', 'Settings', 'History'].map(t => (
          <div key={t} className={`sss-tab${t === 'Builder' ? ' active' : ''}`}>{t}</div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <div className="sss-btn-sm">Test Run</div>
          <div className="sss-btn-sm primary">Publish</div>
        </div>
      </div>
      <div className="sss-canvas-body dotgrid">
        <div className="sss-nodes-row">
          {nodes.map((n, i) => {
            const Icon = n.Icon
            return (
              <React.Fragment key={n.label}>
                <div className="sss-node" style={{ borderColor: n.border }}>
                  <div className="sss-node-badge" style={{ background: n.badgeBg, border: `1.5px solid ${n.border}` }}>
                    <Icon size={12} color={n.iconColor} strokeWidth={1.75} />
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 600, color: n.iconColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{n.type}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111111', lineHeight: 1.2 }}>{n.label}</span>
                  <span style={{ fontSize: 9, color: '#66615B' }}>{n.sub}</span>
                </div>
                {i < nodes.length - 1 && (
                  <svg width="36" height="28" viewBox="0 0 36 28" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 14 H18" stroke="#DFD6C9" strokeWidth="1.5" strokeDasharray="3 2" />
                    <path d="M18 14 H34" stroke="#DFD6C9" strokeWidth="1.5" />
                    <path d="M30 10 L34 14 L30 18" stroke="#DFD6C9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </React.Fragment>
            )
          })}
        </div>
        <div className="sss-zoom-bar">
          <div className="sss-zoom-btn">&#8722;</div>
          <span className="sss-zoom-pct">100%</span>
          <div className="sss-zoom-btn">+</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#76E012', boxShadow: '0 0 5px #76E012', display: 'inline-block' }} />
            <span style={{ fontSize: 9.5, color: '#66615B' }}>142 runs today</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewDocuments() {
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
          <PraxisIcon size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>Praxis</span>
        </div>
        <span style={{ fontSize: 10, color: '#B5AFA9', marginLeft: 8 }}>Documents / Q3_Financial_Report.pdf</span>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '50%', borderRight: '1px solid rgba(0,0,0,0.07)', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#FFFAEC', border: '1px solid rgba(245,202,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={12} color="#D4A017" />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111111' }}>OCR Extraction</span>
            <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: '#4a8c00', background: '#F0F9E6', border: '1px solid rgba(118,224,18,0.35)', borderRadius: 999, padding: '1px 7px' }}>&#10003; 98.7%</span>
          </div>
          {['Q3 Financial Report', 'Period: Jul – Sep 2025', 'Revenue: $12.4M (+23% YoY)', 'EBITDA margin: 31.4%', 'Operating costs: $8.5M', 'Net income: $2.1M'].map((_, i) => (
            <div key={i} style={{ height: 9, borderRadius: 4, background: i === 0 ? '#DFD6C9' : 'rgba(0,0,0,0.07)', width: i === 0 ? '70%' : i % 2 === 0 ? '90%' : '80%' }} />
          ))}
        </div>
        <div style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111111', marginBottom: 4 }}>AI Summary &amp; Q&amp;A</span>
          <div style={{ background: '#F7F7F6', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8, padding: '8px 10px', fontSize: 9.5, color: '#66615B', lineHeight: 1.6 }}>
            <strong style={{ color: '#111111' }}>Key Insights:</strong><br />
            Revenue grew 23% YoY driven by SaaS subscriptions. EBITDA margin expanded to 31.4%.
          </div>
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #EAE3D9', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ fontSize: 9.5, color: '#B5AFA9', flex: 1 }}>Ask a question&hellip;</span>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={10} color="#fff" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewResumes() {
  const candidates = [
    { name: 'Priya Sharma', role: 'Sr. ML Engineer', score: 96, skills: ['Python', 'PyTorch', 'AWS'], highlight: true },
    { name: 'Alex Chen', role: 'AI Researcher', score: 88, skills: ['NLP', 'HuggingFace'], highlight: false },
    { name: 'Marcus Webb', role: 'Data Scientist', score: 81, skills: ['Pandas', 'SQL'], highlight: false },
    { name: 'Yuki Tanaka', role: 'ML Ops', score: 74, skills: ['Docker', 'K8s'], highlight: false },
  ]
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
          <PraxisIcon size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>Praxis</span>
        </div>
        <span style={{ fontSize: 10, color: '#B5AFA9', marginLeft: 8 }}>Resumes / ML Engineer Search</span>
        <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: '#66615B' }}>47 candidates</span>
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 60px', gap: 8, padding: '0 4px 6px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {['Candidate', 'Score', 'Skills', 'Action'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#66615B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {candidates.map((c) => (
          <div key={c.name} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 1fr 60px', gap: 8, padding: '7px 4px',
            background: c.highlight ? 'rgba(118,224,18,0.06)' : 'transparent',
            border: c.highlight ? '1px solid rgba(118,224,18,0.2)' : '1px solid transparent',
            borderRadius: 8, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#111111' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: '#66615B' }}>{c.role}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${c.score >= 90 ? '#76E012' : c.score >= 80 ? '#F5CA50' : '#DFD6C9'}`, background: '#fff' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: c.score >= 90 ? '#4a8c00' : '#111111' }}>{c.score}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {c.skills.map(s => (
                <span key={s} style={{ fontSize: 8.5, background: '#F0EBE3', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 4, padding: '1px 5px', color: '#66615B' }}>{s}</span>
              ))}
            </div>
            <div style={{ fontSize: 8.5, color: c.highlight ? '#4a8c00' : '#66615B', fontWeight: c.highlight ? 700 : 500, cursor: 'default' }}>
              {c.highlight ? '★ Shortlist' : 'Review →'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewChat() {
  const messages = [
    { role: 'user', text: 'How many workflows ran today?' },
    { role: 'ai', text: '142 workflows ran today with a 94% success rate. Top performer: Invoice Approval at 100%.' },
    { role: 'user', text: 'Show me the failed ones.' },
    { role: 'ai', text: '8 failures detected — mostly timeout errors on the Email Trigger node. Want me to auto-retry them?' },
  ]
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={10} color="#76E012" strokeWidth={2} />
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>AI Assistant</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: '#4a8c00', background: '#F0F9E6', border: '1px solid rgba(118,224,18,0.35)', borderRadius: 999, padding: '1px 7px' }}>&#9679; Live</span>
      </div>
      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', justifyContent: 'flex-end' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '7px 10px', fontSize: 10.5, lineHeight: 1.5,
              borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              background: m.role === 'user' ? '#111111' : '#F7F7F6',
              color: m.role === 'user' ? '#fff' : '#111111',
              border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.07)' : 'none',
            }}>
              {m.text}
              {i === messages.length - 1 && m.role === 'ai' && (
                <span style={{ display: 'inline-block', width: 5, height: 11, background: '#76E012', borderRadius: 2, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1.1s step-end infinite' }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: '#F7F7F6', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '7px 10px', fontSize: 9.5, color: '#B5AFA9' }}>Type a message&hellip;</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
          <ArrowRight size={12} color="#fff" />
        </div>
      </div>
    </div>
  )
}

function PreviewAnalytics() {
  const bars = [65, 82, 58, 91, 74, 96, 88, 70, 95, 80, 88, 92]
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const r = 32, circ = 2 * Math.PI * r, pct = 0.926
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
          <PraxisIcon size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>Praxis</span>
        </div>
        <span style={{ fontSize: 10, color: '#B5AFA9', marginLeft: 8 }}>Analytics / Execution Overview</span>
      </div>
      <div style={{ display: 'flex', flex: 1, gap: 12, padding: 14, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111111' }}>Execution Trends</span>
            <span style={{ fontSize: 8.5, color: '#76E012', fontWeight: 700 }}>&#8593; +23% YoY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, paddingBottom: 16 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: i === 7 ? '#F5CA50' : (i === 5 || i === 8) ? '#76E012' : '#EAE3D9', borderRadius: '3px 3px 0 0', height: `${h}%`, transition: 'height 0.3s' }} />
                <span style={{ fontSize: 7, color: '#B5AFA9' }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 100 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: 80 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0 }}>
              <circle cx="36" cy="36" r={r} fill="none" stroke="#EAE3D9" strokeWidth="8" />
              <circle cx="36" cy="36" r={r} fill="none" stroke="#F5CA50" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} />
            </svg>
            <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111111', lineHeight: 1 }}>92.6</div>
              <div style={{ fontSize: 8, color: '#66615B' }}>% success</div>
            </div>
          </div>
          {[{ label: 'Requests', val: '8,421' }, { label: 'Avg time', val: '1.2s' }, { label: 'Errors', val: '0.4%' }].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 8.5, color: '#66615B' }}>{label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#111111' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewScheduler() {
  const jobs = [
    { name: 'Daily Invoice Sync', cron: '0 9 * * *', status: 'running', next: 'tomorrow 09:00' },
    { name: 'Resume Batch Score', cron: '0 */4 * * *', status: 'success', next: 'in 3h' },
    { name: 'Analytics Report', cron: '0 8 * * MON', status: 'success', next: 'next Mon' },
    { name: 'DB Cleanup', cron: '30 2 * * *', status: 'warning', next: 'tonight 02:30' },
    { name: 'Email Digest', cron: '0 7 * * *', status: 'success', next: 'tomorrow 07:00' },
  ]
  const statusMeta: Record<string, { color: string; label: string }> = {
    running: { color: '#16a34a', label: 'Running' },
    success: { color: '#4a8c00', label: 'Success' },
    warning: { color: '#d97706', label: 'Warning' },
  }
  return (
    <div className="sss-preview-inner">
      <div className="sss-preview-topbar">
        <div className="sss-dot" style={{ background: '#FF5F57' }} />
        <div className="sss-dot" style={{ background: '#FEBC2E' }} />
        <div className="sss-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10 }}>
          <PraxisIcon size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#111111' }}>Praxis</span>
        </div>
        <span style={{ fontSize: 10, color: '#B5AFA9', marginLeft: 8 }}>Scheduler / Active Jobs</span>
        <span style={{ marginLeft: 'auto', fontSize: 8.5, color: '#4a8c00', fontWeight: 700 }}>5 active</span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px', gap: 8, padding: '0 4px 6px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          {['Job Name', 'Schedule', 'Status'].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: '#66615B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {jobs.map((j) => {
          const meta = statusMeta[j.status]
          return (
            <div key={j.name} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px', gap: 8, padding: '7px 4px', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#111111', lineHeight: 1.2 }}>{j.name}</div>
                <div style={{ fontSize: 8.5, color: '#66615B', marginTop: 2 }}>Next: {j.next}</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 8.5, color: '#66615B', background: 'rgba(0,0,0,0.04)', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {j.cron}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0, animation: j.status === 'running' ? 'pulse 2s ease-in-out infinite' : 'none' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: meta.color }}>{meta.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT — CSS sticky scroll (no scroll-jacking)
   ══════════════════════════════════════════════════════════ */
const TOTAL = modules.length // 6

export function FeaturesSection() {
  const [active, setActive]   = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const prevActive = useRef(0)

  /* ── Passive scroll listener: map progress → active step ─ */
  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect     = section.getBoundingClientRect()
      const scrolled = -rect.top                         // px scrolled past section top
      const total    = section.offsetHeight - window.innerHeight // total scrollable px
      if (total <= 0) return

      const progress = Math.min(1, Math.max(0, scrolled / total))
      // Map 0-1 evenly across TOTAL steps; clamp last step so it stays at 5
      const step = Math.min(TOTAL - 1, Math.floor(progress * TOTAL))

      if (step !== prevActive.current) {
        prevActive.current = step
        setAnimKey(k => k + 1)
        setActive(step)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // run once on mount to set correct initial step
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Click nav: jump to that step's scroll position ─────── */
  const handleNavClick = (idx: number) => {
    const section = sectionRef.current
    if (!section) return
    const total   = section.offsetHeight - window.innerHeight
    const stepPct = idx / TOTAL
    const targetY = section.offsetTop + total * stepPct
    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  const previewMap: Record<string, React.ReactNode> = {
    workflows: <PreviewWorkflows />,
    documents: <PreviewDocuments />,
    resumes:   <PreviewResumes />,
    chat:      <PreviewChat />,
    analytics: <PreviewAnalytics />,
    scheduler: <PreviewScheduler />,
  }

  return (
    <section
      id="features"
      className="relative h-[400vh] w-full bg-[#F7F7F6]"
      aria-labelledby="features-heading"
      ref={sectionRef}
    >
      {/* Sticky Frame: Locks to the monitor. NEVER moves. */}
      <div className="sticky top-0 left-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden py-12">

        {/* Section Header (Stays fixed at the top of the sticky view) */}
        <div className="text-center mb-12 flex-shrink-0">
          <span className="uppercase tracking-widest text-[11px] font-bold text-[#66615B] bg-[#EAE3D9] px-3 py-1.5 rounded-full">
            Platform Features
          </span>
          <h2 id="features-heading" className="text-4xl md:text-[42px] tracking-tight font-extrabold mt-6 mb-4 text-[#111111]">
            One platform. Endless possibilities.
          </h2>
          <p className="text-lg text-[#66615B] m-0">
            Scroll to explore how Praxis helps every team automate and accelerate their work.
          </p>
        </div>

        {/* Content Grid: Fixed in the dead center of the screen */}
        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-12 gap-12 items-start">

          {/* LEFT COLUMN: STATIC LIST (DO NOT SCROLL THIS) */}
          <div className="col-span-5 flex flex-col justify-center border-l-2 border-[#EAE3D9] space-y-1">
            {modules.map((mod, idx) => {
              const Icon     = mod.icon
              const isActive = active === idx
              return (
                <button
                  key={mod.id}
                  id={`sss-nav-${mod.id}`}
                  className={`text-left flex flex-col py-3 pl-5 -ml-[2px] border-l-2 transition-all duration-300 ${
                    isActive ? 'opacity-100 border-[#111111]' : 'opacity-30 border-transparent hover:opacity-60'
                  }`}
                  onClick={() => handleNavClick(idx)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {/* Title Row (Always visible) */}
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-bold tracking-[0.08em] tabular-nums min-w-[20px] ${isActive ? 'text-[#66615B]' : 'text-[#B5AFA9]'}`}>
                      {mod.num}
                    </span>
                    <span className={`text-[15px] font-bold flex items-center gap-2 ${isActive ? 'text-[#111111]' : 'text-[#66615B]'}`}>
                      <Icon size={14} strokeWidth={2} className="flex-shrink-0" />
                      {mod.title}
                    </span>
                  </div>
                  
                  {/* Description (ONLY visible if active) */}
                  {isActive && (
                    <p className="text-[13.5px] text-[#66615B] leading-[1.6] mt-2 mb-0 ml-[30px] font-normal">
                      {mod.desc}
                    </p>
                  )}
                </button>
              )
            })}
          </div>

          {/* RIGHT COLUMN: STATIC CANVAS (DO NOT SCROLL THIS) */}
          <div className="col-span-7 h-[520px] w-full bg-[#EAE3D9] rounded-2xl p-3 border-[1.5px] border-[#E5E0D8] shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
            <div key={animKey} className="flex-1 bg-white rounded-[14px] border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col min-h-0 sss-fade-slide relative">
              {previewMap[modules[active].id]}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}




