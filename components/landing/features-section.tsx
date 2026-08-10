'use client'

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import {
  GitBranch, FileSearch, Users, MessageSquare, BarChart3, Clock,
  ArrowRight, Mail, Shield, Database, Bell, FileText,
} from 'lucide-react'

import { Reveal, hoverCardClass } from '@/components/motion/primitives'

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

const TOTAL = modules.length

const previewMap: Record<string, React.ReactNode> = {
  workflows: <PreviewWorkflows />,
  documents: <PreviewDocuments />,
  resumes:   <PreviewResumes />,
  chat:      <PreviewChat />,
  analytics: <PreviewAnalytics />,
  scheduler: <PreviewScheduler />,
}

const EASE = [0.22, 1, 0.36, 1] as const

function SectionHeading() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-14 text-center md:pt-28">
      <Reveal y={12} duration={0.35}>
        <span className="uppercase tracking-widest text-[11px] font-bold text-[#66615B] bg-[#EAE3D9] px-3 py-1.5 rounded-full">
          Platform Features
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          id="features-heading"
          className="text-4xl md:text-[42px] tracking-tight font-extrabold mt-6 mb-4 text-[#111111]"
        >
          One platform. Endless possibilities.
        </h2>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="text-lg text-[#66615B] m-0">
          Scroll to explore how Praxis helps every team automate and accelerate their work.
        </p>
      </Reveal>
    </div>
  )
}

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`h-[520px] w-full rounded-2xl border-[1.5px] border-[#E5E0D8] bg-[#EAE3D9] p-3 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] ${hoverCardClass}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {children}
      </div>
    </div>
  )
}

function StackedFallback() {
  return (
    <section id="features" className="relative w-full bg-[#F7F7F6]" aria-labelledby="features-heading">
      <SectionHeading />
      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 pb-28">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <motion.div
              key={mod.id}
              id={`sss-nav-${mod.id}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
            >
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2.5">
                  <span className="min-w-[20px] text-[11px] font-bold tracking-[0.08em] tabular-nums text-[#66615B]">
                    {mod.num}
                  </span>
                  <span className="flex items-center gap-2 text-[17px] font-bold text-[#111111]">
                    <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
                    {mod.title}
                  </span>
                </div>
                <p className="mb-0 ml-[30px] mt-2 text-[13.5px] font-normal leading-[1.6] text-[#66615B]">
                  {mod.desc}
                </p>
              </div>
              <div className="lg:col-span-7">
                <PreviewFrame>
                  <div className="flex h-full flex-col">{previewMap[mod.id]}</div>
                </PreviewFrame>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

export function FeaturesSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const prefersReduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  })

  const activeIndex = useTransform(scrollYProgress, (p) =>
    Math.min(TOTAL - 1, Math.max(0, Math.floor(p * TOTAL))),
  )
  useMotionValueEvent(activeIndex, 'change', (value) => setActive(value))

  const railScale = useTransform(scrollYProgress, [0, 1], [1 / TOTAL, 1])

  function handleNavClick(index: number) {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const travel = wrapper.offsetHeight - window.innerHeight
    if (travel <= 0) return
    const target =
      wrapper.offsetTop + travel * ((index + 0.5) / TOTAL)
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  if (mounted && prefersReduced) return <StackedFallback />

  const activeModule = modules[active]

  return (
    <section id="features" className="relative w-full bg-[#F7F7F6]" aria-labelledby="features-heading">
      <SectionHeading />

      <div ref={wrapperRef} className="relative h-[600vh]">
        <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-center gap-12 px-6">

            <div className="col-span-12 lg:col-span-5">
              <div className="relative pl-5">
                <div className="absolute inset-y-0 left-0 w-[2px] overflow-hidden rounded-full bg-[#EAE3D9]">
                  <motion.div
                    className="h-full w-full origin-top rounded-full bg-[#F5CA50]"
                    style={{ scaleY: railScale }}
                  />
                </div>

                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {modules.map((mod, index) => {
                    const Icon = mod.icon
                    const isActive = active === index
                    return (
                      <li key={mod.id} className="relative">
                        {isActive && (
                          <motion.span
                            layoutId="sss-active-dot"
                            className="absolute -left-[23px] top-[18px] size-[9px] rounded-full bg-[#F5CA50] shadow-[0_0_0_3px_rgba(245,202,80,0.25)]"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <button
                          id={`sss-nav-${mod.id}`}
                          type="button"
                          onClick={() => handleNavClick(index)}
                          aria-current={isActive ? 'true' : undefined}
                          className="flex w-full flex-col py-3 text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="min-w-[20px] text-[11px] font-bold tabular-nums tracking-[0.08em] transition-colors duration-300"
                              style={{ color: isActive ? '#66615B' : '#A9A49C' }}
                            >
                              {mod.num}
                            </span>
                            <span
                              className="flex items-center gap-2 text-[15px] transition-colors duration-300"
                              style={{
                                color: isActive ? '#111111' : '#A9A49C',
                                fontWeight: isActive ? 800 : 600,
                              }}
                            >
                              <Icon size={14} strokeWidth={2} className="flex-shrink-0" />
                              {mod.title}
                            </span>
                          </div>

                          <AnimatePresence initial={false}>
                            {isActive && (
                              <motion.p
                                key="desc"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.28, ease: EASE }}
                                className="m-0 ml-[30px] overflow-hidden text-[13.5px] font-normal leading-[1.6] text-[#66615B]"
                              >
                                <span className="block pt-2">{mod.desc}</span>
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <PreviewFrame>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeModule.id}
                    initial={{ opacity: 0, scale: 0.985, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.012, y: -10 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {previewMap[activeModule.id]}
                  </motion.div>
                </AnimatePresence>
              </PreviewFrame>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

