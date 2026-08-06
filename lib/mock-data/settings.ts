export type UserRole = 'Admin' | 'Manager' | 'Analyst' | 'Viewer'
export type ConnectionStatus = 'Connected' | 'Not Connected'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  lastActive: string
  avatarInitials: string
}

export interface ApiConnection {
  id: string
  name: string
  description: string
  icon: string
  status: ConnectionStatus
  category: string
}

const mockUsers: AppUser[] = [
  {
    id: 'usr-1',
    name: 'Ava Chen',
    email: 'ava.chen@company.com',
    role: 'Admin',
    lastActive: 'Just now',
    avatarInitials: 'AC',
  },
  {
    id: 'usr-2',
    name: 'Marcus Reed',
    email: 'marcus.reed@company.com',
    role: 'Manager',
    lastActive: '2h ago',
    avatarInitials: 'MR',
  },
  {
    id: 'usr-3',
    name: 'Priya Nair',
    email: 'priya.nair@company.com',
    role: 'Manager',
    lastActive: '1h ago',
    avatarInitials: 'PN',
  },
  {
    id: 'usr-4',
    name: 'Diego Alvarez',
    email: 'diego.alvarez@company.com',
    role: 'Analyst',
    lastActive: '3h ago',
    avatarInitials: 'DA',
  },
  {
    id: 'usr-5',
    name: 'Sarah Kim',
    email: 'sarah.kim@company.com',
    role: 'Analyst',
    lastActive: 'Yesterday',
    avatarInitials: 'SK',
  },
  {
    id: 'usr-6',
    name: 'Tom Wilson',
    email: 'tom.wilson@company.com',
    role: 'Viewer',
    lastActive: '2 days ago',
    avatarInitials: 'TW',
  },
]

const mockApiConnections: ApiConnection[] = [
  {
    id: 'conn-1',
    name: 'OpenAI',
    description: 'GPT-4o and embedding models for AI processing',
    icon: 'brain',
    status: 'Not Connected',
    category: 'AI Models',
  },
  {
    id: 'conn-2',
    name: 'Google Drive',
    description: 'Access and process documents stored in Drive',
    icon: 'hard-drive',
    status: 'Not Connected',
    category: 'Storage',
  },
  {
    id: 'conn-3',
    name: 'Slack',
    description: 'Send notifications and messages to Slack channels',
    icon: 'message-circle',
    status: 'Not Connected',
    category: 'Communication',
  },
  {
    id: 'conn-4',
    name: 'QuickBooks',
    description: 'Sync invoice and financial data with QuickBooks',
    icon: 'book-open',
    status: 'Not Connected',
    category: 'Finance',
  },
  {
    id: 'conn-5',
    name: 'Salesforce',
    description: 'Access CRM data and trigger Salesforce workflows',
    icon: 'cloud',
    status: 'Not Connected',
    category: 'CRM',
  },
  {
    id: 'conn-6',
    name: 'Microsoft Teams',
    description: 'Post alerts and reports to Teams channels',
    icon: 'users',
    status: 'Not Connected',
    category: 'Communication',
  },
  {
    id: 'conn-7',
    name: 'AWS S3',
    description: 'Store and retrieve files from S3 buckets',
    icon: 'archive',
    status: 'Not Connected',
    category: 'Storage',
  },
  {
    id: 'conn-8',
    name: 'SendGrid',
    description: 'Send transactional emails via SendGrid API',
    icon: 'send',
    status: 'Not Connected',
    category: 'Communication',
  },
]

export function getUsers(): AppUser[] {
  return mockUsers
}

export function getApiConnections(): ApiConnection[] {
  return mockApiConnections
}
