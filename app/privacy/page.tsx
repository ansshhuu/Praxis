import type { Metadata } from 'next'

import { LegalPage, type LegalSection } from '@/components/landing/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy - Praxis',
  description:
    'How Praxis collects, uses, and protects your data, including our commitments around AI and customer content.',
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'Data We Collect',
    body: [
      'Account data: your name, work email address, role, and organisation, provided when you create an account or when an administrator creates one for you.',
      'Workspace content: documents, resumes, meeting recordings and transcripts, workflow definitions, and messages you send to the AI assistant.',
      'Usage data: authentication events, workflow executions, and feature interactions, retained so administrators can audit activity and so we can diagnose faults.',
    ],
  },
  {
    heading: 'Use of AI & Customer Data',
    body: [
      'Praxis does not train foundational models on your proprietary enterprise data. Your documents, resumes, transcripts, and assistant conversations are used only to produce results for your own workspace.',
      'Some features send content to third-party model providers to generate a response. That content is transmitted for inference only, is not retained by us for training, and is subject to the provider’s own processing terms.',
      'AI-generated output can be inaccurate. Praxis is a decision-support tool and should not be treated as the sole basis for hiring, financial, legal, or compliance decisions.',
    ],
  },
  {
    heading: 'Data Security',
    body: [
      'Access to workspace data requires an authenticated session, and role-based permissions restrict sensitive areas such as resume screening and user administration.',
      'Uploaded files are held in private object storage and are served only through authenticated, access-checked endpoints. Passwords are stored as salted hashes and never in plain text.',
      'No system is perfectly secure. If we become aware of a breach affecting your data, we will notify affected administrators without undue delay.',
    ],
  },
  {
    heading: 'Data Retention & Your Rights',
    body: [
      'Workspace content is retained until you delete it or your organisation closes its account. Deleting a record removes it from the application and schedules the underlying file for removal from storage.',
      'You may request access to, correction of, or deletion of your personal data by contacting us. Where your organisation controls the workspace, we may direct your request to its administrators.',
    ],
  },
  {
    heading: 'Cookies & Sessions',
    body: [
      'Praxis uses a session cookie to keep you signed in and to identify your account on each request. This cookie is required for the service to function and is not used for advertising or cross-site tracking.',
      'The session cookie is cleared when you sign out or when your session expires. We do not use third-party advertising cookies.',
    ],
  },
  {
    heading: 'Transactional Email',
    body: [
      'We use a third-party transactional email provider (Brevo) to deliver account-related emails, such as password reset links and workflow notifications. These emails include only the content needed to complete the relevant action, such as a time-limited reset link.',
      'Your email address and the content of these messages are shared with our email provider solely to deliver them, and are subject to that provider’s own security and processing terms.',
    ],
  },
  {
    heading: 'Account Termination',
    body: [
      'You may close your account at any time by contacting us or, where available, through your account settings. Where your organisation controls the workspace, closing the account may require action by its administrators.',
      'On termination, your access to the workspace ends and your data is scheduled for deletion in line with the retention practices described above, except where we are required to retain it for legal, security, or billing reasons.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Questions about this policy, or requests concerning your personal data, can be sent to hello@praxis.ai.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="January 2026"
      intro="This policy explains what Praxis collects when you use the platform, how that information is handled, and the commitments we make about your data and our use of AI."
      sections={SECTIONS}
    />
  )
}
