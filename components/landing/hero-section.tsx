'use client'

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, GitBranch, FileText, Users, BarChart3, Check,
  MessageSquare, TrendingUp, Bell, ShoppingBag, Clock, Settings,
  CircleDot, Zap, Filter, BrainCircuit, Database, Link2, Shuffle,
  UserCircle, Mail, Shield,
} from 'lucide-react'

import DotField from '@/components/landing/DotField'
import { CountUp, WordReveal, useTypewriter } from '@/components/motion/primitives'

function PraxisIcon({ size = 22, color = '#F5CA50' }: { size?: number; color?: string }) {
  const s = size
  const c = s / 2
  const rays = 8
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays
        const rad = (angle * Math.PI) / 180
        const inner = c * 0.35
        const outer = c * 0.82
        const x1 = c + inner * Math.cos(rad)
        const y1 = c + inner * Math.sin(rad)
        const x2 = c + outer * Math.cos(rad)
        const y2 = c + outer * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={s * 0.09} strokeLinecap="round" />
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const blobY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const blobOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35])

  return (
    <section className="hero-section" id="hero" aria-label="Hero" ref={sectionRef}>
      <motion.div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, y: blobY, opacity: blobOpacity, pointerEvents: 'none' }}
      >
        <div className="hero-blob-amber" />
        <div className="hero-blob-lime" />
        <div className="hero-blob-sand" />
        <div className="hero-blob-core" />
      </motion.div>

      <DotField
        dotRadius={1.5}
        dotSpacing={16}
        cursorRadius={300}
        cursorForce={0.13}
        bulgeOnly
        bulgeStrength={22}
        glowRadius={0}
        glowColor="transparent"
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="#FACC15"
        gradientTo="#D97706"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="hero-text-area">
        <h1 className="hero-headline">
          <WordReveal text="Automate every process." />
        </h1>
        <p className="hero-subheading fu-2">
          Build, run, and monitor enterprise workflows with no-code AI that understands your team.
        </p>
      </div>

      <div className="dashboard-scene fu-5">
        <WorkflowBuilderCard />
      </div>
    </section>
  )
}

const NODE_STEP = 0.18

const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.86, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, delay: i * NODE_STEP, ease: [0.22, 1, 0.36, 1] },
  }),
}

const connectorVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.26, delay: i * NODE_STEP + 0.14, ease: 'easeInOut' },
      opacity: { duration: 0.08, delay: i * NODE_STEP + 0.14 },
    },
  }),
}

const arrowheadVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.16, delay: i * NODE_STEP + 0.38 },
  }),
}

type HeroTab = 'workflows' | 'documents' | 'resumes' | 'chat' | 'reports'

const TAB_ORDER: HeroTab[] = ['workflows', 'documents', 'resumes', 'chat', 'reports']

const TAB_CRUMBS: Record<HeroTab, { section: string; page: string }> = {
  workflows: { section: 'Workflows', page: 'Invoice Approval Workflow' },
  documents: { section: 'Documents', page: 'Q3_Financial_Report.pdf' },
  resumes: { section: 'Resumes', page: 'ML Engineer Search' },
  chat: { section: 'AI Assistant', page: 'Workspace Copilot' },
  reports: { section: 'Reports', page: 'Execution Overview' },
}

const AUTOPLAY_MS = 4000

const viewMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
}

function DocumentsView() {
  const metrics = ['Revenue up 23% YoY', 'EBITDA margin: 31.4%']
  return (
    <div style={{ display: 'flex', gap: 12, padding: 16, height: '100%' }}>
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <FileText size={13} color="#D4A017" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111111' }}>Q3_Financial_Report.pdf</span>
        </div>
        {[92, 80, 88, 72, 84, 66, 78].map((w, i) => (
          <div key={i} style={{ height: 7, borderRadius: 4, background: 'rgba(0,0,0,0.07)', width: `${w}%`, marginBottom: 7 }} />
        ))}
        <motion.div
          aria-hidden="true"
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '92%', '0%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #F5CA50, transparent)',
            boxShadow: '0 0 12px rgba(245,202,80,0.9)',
          }}
        />
      </div>
      <div style={{ width: 168, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#111111' }}>Extracted metrics</span>
        {metrics.map((metric, i) => (
          <motion.span
            key={metric}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.5, duration: 0.35 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999,
              background: '#FFFAEC', border: '1px solid rgba(245,202,80,0.5)',
              padding: '4px 9px', fontSize: 9.5, fontWeight: 600, color: '#8A6A0B',
            }}
          >
            <Check size={10} strokeWidth={3} color="#D4A017" /> {metric}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function ResumesView() {
  const candidates = [
    { name: 'Priya Sharma', role: 'Sr. ML Engineer', score: 96 },
    { name: 'Alex Chen', role: 'AI Researcher', score: 88 },
    { name: 'Marcus Webb', role: 'Data Scientist', score: 81 },
  ]
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {candidates.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#111111' }}>{c.name}</div>
            <div style={{ fontSize: 9, color: '#66615B', marginBottom: 4 }}>{c.role}</div>
            <div style={{ height: 5, borderRadius: 999, background: '#EAE3D9', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${c.score}%` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', borderRadius: 999, background: c.score >= 90 ? '#76E012' : '#F5CA50' }}
              />
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: c.score >= 90 ? '#4a8c00' : '#111111', width: 32, textAlign: 'right' }}>
            <CountUp value={`${c.score}%`} duration={1.2} />
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function ChatView() {
  const answer = '142 workflows ran today with a 94% success rate'
  const { shown, done } = useTypewriter(answer, { minMs: 1100, maxMs: 2200 })
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '70%', padding: '7px 11px', borderRadius: '12px 12px 3px 12px', background: '#111111', color: '#fff', fontSize: 10.5 }}>
          How many workflows ran today?
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ maxWidth: '78%', padding: '7px 11px', borderRadius: '12px 12px 12px 3px', background: '#F7F7F6', border: '1px solid rgba(0,0,0,0.07)', color: '#111111', fontSize: 10.5, lineHeight: 1.5 }}>
          {shown}
          {!done && (
            <span style={{ display: 'inline-block', width: 5, height: 11, background: '#76E012', borderRadius: 2, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1.1s step-end infinite' }} />
          )}
        </div>
      </div>
    </div>
  )
}

function ReportsView() {
  const points = '0,58 40,44 80,50 120,30 160,36 200,18 240,24 280,8'
  return (
    <div style={{ padding: 16, display: 'flex', gap: 14, height: '100%' }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#111111' }}>Execution trend</span>
        <svg viewBox="0 0 280 70" style={{ width: '100%', height: 96, marginTop: 8 }} fill="none">
          <motion.polyline
            points={points}
            stroke="#F5CA50"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </svg>
      </div>
      <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[{ label: 'Success rate', value: '92.6%' }, { label: 'Avg. time', value: '1.2s' }].map((kpi) => (
          <div key={kpi.label}>
            <div style={{ fontSize: 9, color: '#66615B' }}>{kpi.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111111' }}>
              <CountUp value={kpi.value} duration={1.2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowBuilderCard() {
  const [activeTab, setActiveTab] = useState<HeroTab>('workflows')
  const [autoPlay, setAutoPlay] = useState(true)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!autoPlay || prefersReduced) return
    const timer = window.setInterval(() => {
      setActiveTab((current) => {
        const next = (TAB_ORDER.indexOf(current) + 1) % TAB_ORDER.length
        return TAB_ORDER[next]
      })
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoPlay, prefersReduced])

  function selectTab(tab: HeroTab) {
    setAutoPlay(false)
    setActiveTab(tab)
  }

  const sidebarItems: { icon: React.ElementType; label: string; tab?: HeroTab }[] = [
    { icon: LayoutDashboard, label: 'Dashboard'    },
    { icon: GitBranch,       label: 'Workflows',    tab: 'workflows' },
    { icon: FileText,        label: 'Documents',    tab: 'documents' },
    { icon: Users,           label: 'Resumes',      tab: 'resumes'   },
    { icon: BarChart3,       label: 'Reports',      tab: 'reports'   },
    { icon: MessageSquare,   label: 'AI Assistant', tab: 'chat'      },
    { icon: TrendingUp,      label: 'Analytics'    },
    { icon: ShoppingBag,     label: 'Marketplace'  },
    { icon: Clock,           label: 'Scheduler'    },
    { icon: Bell,            label: 'Notifications'},
    { icon: Settings,        label: 'Settings'     },
  ]

  const paletteItems = [
    { icon: Zap,          label: 'Trigger', active: true },
    { icon: CircleDot,    label: 'Action'    },
    { icon: Filter,       label: 'Condition' },
    { icon: BrainCircuit, label: 'AI'        },
    { icon: Database,     label: 'Data'      },
    { icon: Link2,        label: 'Integration'},
    { icon: Shuffle,      label: 'Flow'      },
  ]

  const nodes: {
    type: string
    Icon: React.ElementType
    label: string
    sub: string
    labelColor: string
    border: string
    badgeBg: string
    iconColor: string
  }[] = [
    { type: 'Trigger',    Icon: Mail,     label: 'New Email',      sub: 'Gmail inbox',    labelColor: '#15803d', border: '#86efac', badgeBg: '#f0fdf4', iconColor: '#16a34a' },
    { type: 'AI Classify',Icon: Shield,   label: 'Extract Invoice', sub: 'AI Classify',   labelColor: '#6d28d9', border: '#c4b5fd', badgeBg: '#f5f3ff', iconColor: '#7c3aed' },
    { type: 'Save to DB', Icon: Database, label: 'Save to DB',     sub: 'Invoices table', labelColor: '#c2410c', border: '#fdba74', badgeBg: '#fff7ed', iconColor: '#ea580c' },
    { type: 'Notify',     Icon: Bell,     label: 'Email Team',     sub: 'Notify sender',  labelColor: '#b45309', border: '#fde68a', badgeBg: '#fffbeb', iconColor: '#d97706' },
  ]

  return (
    <div className="wf-builder-card hover-glow">
      <div className="wfb-topbar">
        <div className="wfb-topbar-dot" style={{ background: '#FF5F57' }} />
        <div className="wfb-topbar-dot" style={{ background: '#FEBC2E' }} />
        <div className="wfb-topbar-dot" style={{ background: '#28C840' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
          <PraxisIcon size={14} color="#D4A017" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#111111', letterSpacing: '-0.02em' }}>Praxis</span>
        </div>
        <div className="wfb-breadcrumb">
          <span style={{ color: '#B5AFA9' }}>{TAB_CRUMBS[activeTab].section} / </span>
          <span style={{ color: '#111111', fontWeight: 600 }}>{TAB_CRUMBS[activeTab].page}</span>
          <span style={{ marginLeft: 5, color: '#76E012', fontSize: 10 }}>&#10003; Saved</span>
        </div>
        <div className="wfb-topbar-icons">
          <Bell size={13} color="#66615B" />
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EAE3D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCircle size={14} color="#66615B" />
          </div>
        </div>
      </div>

      <div className="wfb-tabs">
        {['Builder', 'Settings', 'History', 'Versions'].map((tab) => (
          <div key={tab} className={`wfb-tab${tab === 'Builder' ? ' active' : ''}`}>{tab}</div>
        ))}
        <div className="wfb-tab-actions">
          <div className="wfb-btn-sm">Test Run</div>
          <div className="wfb-btn-sm primary">Publish</div>
        </div>
      </div>

      <div className="wfb-body" style={{ height: 320 }}>
        <div className="wfb-palette" style={{ opacity: activeTab === 'workflows' ? 1 : 0.35, transition: 'opacity 0.3s' }}>
          {paletteItems.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.label} className={`wfb-palette-item${p.active ? ' active' : ''}`}>
                <Icon size={16} strokeWidth={1.75} />
                <span>{p.label}</span>
              </div>
            )
          })}
        </div>

        <div className="wfb-sidebar">
          <div className="wfb-sidebar-logo">
            <PraxisIcon size={16} color="#D4A017" />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#111111', letterSpacing: '-0.01em' }}>Praxis</span>
          </div>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isTab = Boolean(item.tab)
            const isActive = item.tab === activeTab
            return (
              <div
                key={item.label}
                role={isTab ? 'button' : undefined}
                tabIndex={isTab ? 0 : undefined}
                aria-pressed={isTab ? isActive : undefined}
                onClick={isTab ? () => selectTab(item.tab!) : undefined}
                onKeyDown={
                  isTab
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          selectTab(item.tab!)
                        }
                      }
                    : undefined
                }
                className={`wfb-sidebar-item${isActive ? ' active' : ''}`}
                style={
                  isTab
                    ? { cursor: 'pointer', ...(isActive ? { borderRight: '2px solid #FACC15' } : {}) }
                    : undefined
                }
              >
                <Icon size={11} strokeWidth={1.75} />
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>

        <div className="wfb-canvas">
          <AnimatePresence mode="wait">
            {activeTab !== 'workflows' && (
              <motion.div key={activeTab} {...viewMotion} style={{ height: '100%' }}>
                {activeTab === 'documents' && <DocumentsView />}
                {activeTab === 'resumes' && <ResumesView />}
                {activeTab === 'chat' && <ChatView />}
                {activeTab === 'reports' && <ReportsView />}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'workflows' && (
          <motion.div
            className="wfb-nodes-area"
            key="workflows"
            initial="hidden"
            animate="visible"
          >
            {nodes.map((node, i) => {
              const Icon = node.Icon
              return (
                <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                  <motion.div
                    className="wfb-node-card"
                    style={{ borderColor: node.border }}
                    custom={i}
                    variants={nodeVariants}
                  >
                    <div
                      className="wfb-node-badge"
                      style={{ background: node.badgeBg, border: `1.5px solid ${node.border}` }}
                    >
                      <Icon size={13} color={node.iconColor} strokeWidth={1.75} />
                    </div>
                    <span className="wfb-node-type" style={{ color: node.labelColor }}>{node.type}</span>
                    <span className="wfb-node-label">{node.label}</span>
                    <span className="wfb-node-sub">{node.sub}</span>
                    {i < nodes.length - 1 && <div className="wfb-node-plus">+</div>}
                    {!prefersReduced && (
                      <motion.span
                        aria-hidden="true"
                        style={{
                          position: 'absolute', inset: -2, borderRadius: 12,
                          boxShadow: '0 0 0 2px rgba(250,204,21,0.55), 0 0 18px rgba(250,204,21,0.6)',
                          pointerEvents: 'none',
                        }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          times: [0, 0.5, 1],
                          delay: i * 0.45,
                        }}
                      />
                    )}
                  </motion.div>
                  {i < nodes.length - 1 && (
                    <div className="wfb-elbow">
                      <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
                        <motion.path
                          d="M2 16 H22 V16"
                          stroke="#DFD6C9"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                          custom={i}
                          variants={connectorVariants}
                        />
                        <motion.path
                          d="M30 16 H38"
                          stroke="#DFD6C9"
                          strokeWidth="1.5"
                          custom={i}
                          variants={connectorVariants}
                        />
                        <motion.path
                          d="M34 12 L38 16 L34 20"
                          stroke="#DFD6C9"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          custom={i}
                          variants={arrowheadVariants}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
          )}

          <div className="wfb-zoom-bar">
            <div className="wfb-zoom-btn">&#128075;</div>
            <div className="wfb-zoom-btn">&#8722;</div>
            <span className="wfb-zoom-pct">100%</span>
            <div className="wfb-zoom-btn">+</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#76E012', boxShadow: '0 0 5px #76E012' }} />
              <span style={{ fontSize: 9.5, color: '#66615B' }}>142 runs today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
