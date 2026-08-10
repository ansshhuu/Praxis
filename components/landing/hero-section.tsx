'use client'

import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'
import {
  Play, LayoutDashboard, GitBranch, FileText, Users, BarChart3,
  MessageSquare, TrendingUp, Bell, ShoppingBag, Clock, Settings,
  CircleDot, Zap, Filter, BrainCircuit, Database, Link2, Shuffle,
  UserCircle, Mail, Shield,
} from 'lucide-react'

import { WordReveal } from '@/components/motion/primitives'

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

      <div className="hero-text-area">
        <h1 className="hero-headline">
          <WordReveal text="Automate every process." />
        </h1>
        <p className="hero-subheading fu-2">
          Build, run, and monitor enterprise workflows with no-code AI that understands your team.
        </p>
        <div className="hero-cta-row fu-3">
          <Link href="/login" id="hero-get-started-btn" className="btn-cta-primary">Get Started &rarr;</Link>
          <button id="hero-watch-demo-btn" className="btn-cta-demo">
            <span className="demo-play-wrap"><Play size={11} color="#FFFFFF" fill="#FFFFFF" /></span>
            Watch Demo
          </button>
        </div>
      </div>

      <div className="dashboard-scene fu-5">
        <OverlayDocIntel />
        <OverlayResume />
        <OverlayAnalytics />
        <OverlayAIChat />
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

function WorkflowBuilderCard() {
  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard'    },
    { icon: GitBranch,       label: 'Workflows',    active: true },
    { icon: FileText,        label: 'Documents'    },
    { icon: Users,           label: 'Resumes'      },
    { icon: BarChart3,       label: 'Reports'      },
    { icon: MessageSquare,   label: 'AI Assistant' },
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
          <span style={{ color: '#B5AFA9' }}>Workflows / </span>
          <span style={{ color: '#111111', fontWeight: 600 }}>Invoice Approval Workflow</span>
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
        <div className="wfb-palette">
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
            return (
              <div key={item.label} className={`wfb-sidebar-item${item.active ? ' active' : ''}`}>
                <Icon size={11} strokeWidth={1.75} />
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>

        <div className="wfb-canvas">
          <motion.div
            className="wfb-nodes-area"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
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

function OverlayDocIntel() {
  return (
    <div className="overlay-card oc-doc-intel accent-amber hover-glow">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFAEC', border: '1px solid rgba(245,202,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div>
          <p className="oc-title" style={{ marginBottom: 0 }}>Doc Intelligence</p>
          <p className="oc-sub">Q3_Financial_Report.pdf</p>
        </div>
      </div>
      <span className="oc-badge oc-badge-amber">&#10003; OCR Complete &middot; 98.7%</span>
      {['Revenue up 23% YoY', 'EBITDA margin: 31.4%', 'Cash flow positive'].map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D4A017', flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: '#66615B' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function OverlayResume() {
  const candidates = [
    { name: 'Priya Sharma', score: 96 },
    { name: 'Alex Chen',    score: 88 },
    { name: 'Marcus Webb',  score: 81 },
  ]
  return (
    <div className="overlay-card oc-resume accent-lime hover-glow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p className="oc-title" style={{ marginBottom: 0 }}>Resume Screening</p>
        <span style={{ fontSize: 9, color: '#66615B' }}>3 of 47</span>
      </div>
      {candidates.map((c, i) => (
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 7, marginBottom: i < candidates.length - 1 ? 7 : 0, borderBottom: i < candidates.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? '#76E012' : '#EAE3D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: i === 0 ? '#fff' : '#66615B', flexShrink: 0 }}>
            {i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#111111' }}>{c.name}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#4a8c00' }}>{c.score}%</span>
            </div>
            <div style={{ width: '100%', height: 3, borderRadius: 99, background: '#EAE3D9' }}>
              <div style={{ width: `${c.score}%`, height: 3, borderRadius: 99, background: '#76E012' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function OverlayAnalytics() {
  const r = 28, circ = 2 * Math.PI * r, pct = 0.926
  return (
    <div className="overlay-card oc-analytics accent-amber hover-glow">
      <p className="oc-title">Success Rate</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
          <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="34" cy="34" r={r} fill="none" stroke="#EAE3D9" strokeWidth="7" />
            <circle cx="34" cy="34" r={r} fill="none" stroke="#F5CA50" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111111', lineHeight: 1 }}>92.6</span>
            <span style={{ fontSize: 8, color: '#66615B' }}>%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {[{ label: 'Requests', val: '8,421' }, { label: 'Avg. time', val: '1.2s' }, { label: 'Errors', val: '0.4%' }].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9.5, color: '#66615B' }}>{label}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#111111' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OverlayAIChat() {
  return (
    <div className="overlay-card oc-ai-chat accent-lime hover-glow">
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 999, background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={12} color="#76E012" strokeWidth={2} />
        </div>
        <p className="oc-title" style={{ marginBottom: 0 }}>AI Assistant</p>
        <span className="oc-badge" style={{ marginLeft: 'auto', marginBottom: 0 }}>&#9679; Live</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ alignSelf: 'flex-end', background: '#111111', color: '#fff', borderRadius: '12px 12px 3px 12px', padding: '6px 10px', fontSize: 10.5, maxWidth: '80%', lineHeight: 1.4 }}>
          How many workflows ran today?
        </div>
        <div style={{ alignSelf: 'flex-start', background: '#F7F7F6', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px 12px 12px 3px', padding: '6px 10px', fontSize: 10.5, color: '#111111', maxWidth: '85%', lineHeight: 1.4 }}>
          142 workflows ran today with a{' '}
          <span style={{ fontWeight: 700, color: '#4a8c00' }}>94% success rate</span>
          <span style={{ display: 'inline-block', width: 6, height: 12, background: '#76E012', borderRadius: 2, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1.1s step-end infinite' }} />
        </div>
      </div>
    </div>
  )
}
