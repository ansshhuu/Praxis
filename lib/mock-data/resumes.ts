export interface ResumeCandidate {
  id: string
  name: string
  email: string
  matchScore: number
  rank: number
  skillsMatched: string[]
  skillsMissing: string[]
  yearsExperience: number
  currentRole: string
  education: string
  interviewQuestions: string[]
  summary: string
}

const mockCandidates: ResumeCandidate[] = [
  {
    id: 'cand-1',
    name: 'Jordan Kim',
    email: 'jordan.kim@email.com',
    matchScore: 94,
    rank: 1,
    skillsMatched: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Docker', 'AWS'],
    skillsMissing: ['Kubernetes'],
    yearsExperience: 6,
    currentRole: 'Senior ML Engineer at DataTech',
    education: 'M.Sc. Computer Science, MIT',
    summary:
      'Exceptional candidate with deep ML expertise and strong cloud background. Led multiple production ML pipelines at scale.',
    interviewQuestions: [
      'Describe a time you deployed an ML model to production. What was the biggest challenge?',
      'How do you approach model drift detection and retraining strategies?',
      'Walk me through your experience with TensorFlow in a distributed training setting.',
      'What is your approach to feature engineering for tabular data?',
      'How have you used Docker in your ML workflow? Can you describe a CI/CD pipeline you set up?',
    ],
  },
  {
    id: 'cand-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    matchScore: 87,
    rank: 2,
    skillsMatched: ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'GCP'],
    skillsMissing: ['TensorFlow', 'Docker'],
    yearsExperience: 4,
    currentRole: 'ML Engineer at CloudSoft',
    education: 'B.Tech Computer Engineering, IIT Bombay',
    summary:
      'Strong ML engineer with solid PyTorch experience and GCP certifications. Missing containerization experience but otherwise excellent.',
    interviewQuestions: [
      'Can you explain the difference between PyTorch and TensorFlow from a practical standpoint?',
      'How do you handle class imbalance in your datasets?',
      'Describe your experience with GCP ML services.',
      'What NLP projects have you worked on, if any?',
      'How do you communicate model results to non-technical stakeholders?',
    ],
  },
  {
    id: 'cand-3',
    name: 'Alex Torres',
    email: 'alex.torres@email.com',
    matchScore: 79,
    rank: 3,
    skillsMatched: ['Python', 'SQL', 'AWS', 'Docker'],
    skillsMissing: ['Machine Learning', 'TensorFlow', 'Kubernetes'],
    yearsExperience: 5,
    currentRole: 'Data Engineer at FinanceCorp',
    education: 'B.Sc. Mathematics, UCLA',
    summary:
      'Solid data engineering background with good Python and AWS experience. Limited ML knowledge — would need upskilling.',
    interviewQuestions: [
      'What data pipeline tools and frameworks are you most comfortable with?',
      'Describe your experience with AWS services beyond basic EC2 and S3.',
      'Are you open to upskilling in machine learning? What have you done to learn ML so far?',
      'How do you ensure data quality in pipelines you build?',
      'What is your experience with real-time data processing?',
    ],
  },
  {
    id: 'cand-4',
    name: 'Morgan Lee',
    email: 'morgan.lee@email.com',
    matchScore: 71,
    rank: 4,
    skillsMatched: ['Python', 'SQL', 'Machine Learning'],
    skillsMissing: ['TensorFlow', 'Docker', 'AWS', 'Kubernetes'],
    yearsExperience: 2,
    currentRole: 'Junior Data Scientist at StartupAI',
    education: 'B.Sc. Statistics, University of Michigan',
    summary:
      'Promising junior candidate with good fundamentals. Lacks cloud and infrastructure experience. Best suited for a mentored role.',
    interviewQuestions: [
      'Tell me about your most impactful data science project to date.',
      'How comfortable are you with learning new cloud platforms quickly?',
      'Describe your statistics background and how you apply it in practice.',
      'What machine learning algorithms are you most comfortable with?',
      'Where do you see yourself in 3 years in your ML career?',
    ],
  },
  {
    id: 'cand-5',
    name: 'Sam Nguyen',
    email: 'sam.nguyen@email.com',
    matchScore: 63,
    rank: 5,
    skillsMatched: ['Python', 'SQL'],
    skillsMissing: ['Machine Learning', 'TensorFlow', 'Docker', 'AWS', 'Kubernetes'],
    yearsExperience: 3,
    currentRole: 'Software Developer at WebCo',
    education: 'B.Sc. Computer Science, Arizona State',
    summary: 'General software developer without ML-specific experience. Would require significant training investment.',
    interviewQuestions: [
      'What motivated you to apply for an ML Engineer role?',
      'Have you taken any machine learning courses or certifications?',
      'Describe your Python proficiency — what libraries do you use regularly?',
      'Are you comfortable with a steep learning curve in the first 6 months?',
      'What is your understanding of supervised vs. unsupervised learning?',
    ],
  },
]

export function getCandidates(): ResumeCandidate[] {
  return mockCandidates
}

export function getCandidateById(id: string): ResumeCandidate | undefined {
  return mockCandidates.find((c) => c.id === id)
}
