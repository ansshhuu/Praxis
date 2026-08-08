'use client'

import { Cpu, FileSearch, Users, MessageSquare } from 'lucide-react'

const features = [
  {
    icon: Cpu,
    title: 'No-Code Workflows',
    description: 'Drag-and-drop builder with AI nodes, branching logic, and real-time execution monitoring.',
    iconBg: '#FFFAEC',
    iconBorder: 'rgba(245,202,80,0.4)',
    iconColor: '#D4A017',
  },
  {
    icon: FileSearch,
    title: 'Document AI',
    description: 'Extract, classify, and summarize documents with OCR and GPT-powered intelligence at enterprise scale.',
    iconBg: '#F0F9E6',
    iconBorder: 'rgba(118,224,18,0.35)',
    iconColor: '#4a8c00',
  },
  {
    icon: Users,
    title: 'Resume Screening',
    description: 'Rank candidates automatically with AI scoring on skills, experience, and role fit.',
    iconBg: '#FFFAEC',
    iconBorder: 'rgba(245,202,80,0.4)',
    iconColor: '#D4A017',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Context-aware assistant that queries your workflows, answers questions, and triggers actions via natural language.',
    iconBg: '#F0F9E6',
    iconBorder: 'rgba(118,224,18,0.35)',
    iconColor: '#4a8c00',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="features-section" aria-labelledby="features-heading">
      <div style={{ maxWidth: 1060, margin: '0 auto', textAlign: 'center' }}>
        <div className="section-fade-up">
          <span className="section-tag">Platform Features</span>
          <h2 id="features-heading" className="section-heading">
            Everything your enterprise needs
          </h2>
          <p className="section-sub">
            Four intelligent modules that work together seamlessly — or independently, whichever fits your workflow.
          </p>
        </div>

        <div
          id="modules"
          className="section-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 14,
          }}
        >
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div key={feat.title} className="feat-card">
                <div
                  className="feat-icon-wrap"
                  style={{
                    background: feat.iconBg,
                    border: `1px solid ${feat.iconBorder}`,
                  }}
                >
                  <Icon size={20} color={feat.iconColor} strokeWidth={1.75} />
                </div>
                <h3 className="feat-title">{feat.title}</h3>
                <p className="feat-desc">{feat.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
