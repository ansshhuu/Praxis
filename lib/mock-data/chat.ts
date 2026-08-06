export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  referencedDoc?: string
}

export const suggestedPrompts = [
  'Summarize last month\'s invoice documents',
  'Which candidates scored highest in the recent resume screening?',
  'Show me failed workflow runs from this week',
  'What is our current AI credit usage?',
  'Generate a summary of Q3 sales performance',
  'List all pending approvals in the system',
]

const mockChatHistory: ChatMessage[] = [
  {
    id: 'chat-1',
    role: 'user',
    content: 'Can you summarize the Q3 invoice batch?',
    timestamp: '2:15 PM',
  },
  {
    id: 'chat-2',
    role: 'assistant',
    content:
      'The Q3 Invoice Batch contains **47 invoices** totaling **$284,350.00**. The largest invoice is from Acme Corporation for $13,562.50 for an Enterprise Software License. 38 invoices are marked as paid, 6 are pending, and 3 are overdue.\n\nAverage invoice value: **$6,050.00**\nPayment terms range from Net 15 to Net 45.',
    timestamp: '2:15 PM',
    referencedDoc: 'Q3_Invoice_Batch.pdf',
  },
  {
    id: 'chat-3',
    role: 'user',
    content: 'Which invoices are overdue?',
    timestamp: '2:16 PM',
  },
  {
    id: 'chat-4',
    role: 'assistant',
    content:
      'Based on the Q3 Invoice Batch, the **3 overdue invoices** are:\n\n1. **INV-2026-0831** – TechVendor Inc. – $4,200.00 (12 days overdue)\n2. **INV-2026-0839** – CloudServices LLC – $8,750.00 (7 days overdue)\n3. **INV-2026-0845** – DataPro Corp – $2,100.00 (3 days overdue)\n\nTotal overdue amount: **$15,050.00**. Would you like me to draft follow-up emails for these vendors?',
    timestamp: '2:16 PM',
    referencedDoc: 'Q3_Invoice_Batch.pdf',
  },
]

export function getChatHistory(): ChatMessage[] {
  return mockChatHistory
}
