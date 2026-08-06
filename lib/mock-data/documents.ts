export type DocumentStatus = 'Processed' | 'Processing' | 'Failed' | 'Pending'
export type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT' | 'PNG' | 'JPG'

export interface Document {
  id: string
  name: string
  type: DocumentType
  uploadDate: string
  status: DocumentStatus
  size: string
  ocrText?: string
  aiSummary?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  referencedDoc?: string
}

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Q3_Invoice_Batch.pdf',
    type: 'PDF',
    uploadDate: 'Aug 7, 2026',
    status: 'Processed',
    size: '2.4 MB',
    ocrText: `INVOICE #INV-2026-0847\nDate: July 15, 2026\nBill To: Acme Corporation\n123 Business Ave, Suite 400\nNew York, NY 10001\n\nDescription: Enterprise Software License (Annual)\nUnit Price: $12,500.00\nQuantity: 1\nSubtotal: $12,500.00\nTax (8.5%): $1,062.50\nTotal Due: $13,562.50\n\nPayment Terms: Net 30\nBank: First National Bank\nAccount: 1234-5678-9012\nRouting: 021000021`,
    aiSummary:
      'This is an invoice from Acme Corporation for an Enterprise Software License. The annual license is priced at $12,500 with an 8.5% tax, bringing the total to $13,562.50. Payment is due within 30 days via bank transfer.',
  },
  {
    id: 'doc-2',
    name: 'Employee_Handbook_2026.docx',
    type: 'DOCX',
    uploadDate: 'Aug 6, 2026',
    status: 'Processed',
    size: '1.8 MB',
    ocrText: `EMPLOYEE HANDBOOK 2026\n\nSection 1: Welcome\nWelcome to EAWMP. This handbook outlines the policies and procedures.\n\nSection 2: Work Hours\nStandard hours are 9 AM to 6 PM, Monday through Friday.\nRemote work is permitted up to 3 days per week.\n\nSection 3: Benefits\n- Health Insurance: Comprehensive coverage\n- Dental & Vision: Included\n- 401(k): 4% employer match\n- PTO: 20 days per year`,
    aiSummary:
      'The 2026 Employee Handbook covers company policies including standard work hours (9 AM–6 PM, Mon–Fri), remote work allowance (up to 3 days/week), and benefits including health insurance, dental/vision, 401(k) with 4% match, and 20 days PTO annually.',
  },
  {
    id: 'doc-3',
    name: 'Sales_Metrics_Q2.xlsx',
    type: 'XLSX',
    uploadDate: 'Aug 5, 2026',
    status: 'Processed',
    size: '512 KB',
    ocrText: `Sales Metrics Q2 2026\n\nRegion | Revenue | Target | Achievement\nNorth  | $2.4M   | $2.2M  | 109%\nSouth  | $1.8M   | $2.0M  | 90%\nEast   | $3.1M   | $2.8M  | 111%\nWest   | $2.6M   | $2.5M  | 104%\nTotal  | $9.9M   | $9.5M  | 104%`,
    aiSummary:
      'Q2 2026 sales metrics show an overall achievement of 104% against a $9.5M target, generating $9.9M in revenue. The East region led with 111% achievement while the South region underperformed at 90%.',
  },
  {
    id: 'doc-4',
    name: 'Contract_Template_v3.pdf',
    type: 'PDF',
    uploadDate: 'Aug 4, 2026',
    status: 'Processing',
    size: '890 KB',
  },
  {
    id: 'doc-5',
    name: 'Audit_Report_Jul2026.pdf',
    type: 'PDF',
    uploadDate: 'Aug 3, 2026',
    status: 'Failed',
    size: '3.2 MB',
  },
  {
    id: 'doc-6',
    name: 'Customer_Feedback_Survey.csv',
    type: 'CSV',
    uploadDate: 'Aug 2, 2026',
    status: 'Processed',
    size: '145 KB',
    ocrText: 'Customer ID,Rating,Comment\n1001,5,"Excellent service"\n1002,4,"Good overall"\n1003,3,"Average experience"',
    aiSummary: 'Customer feedback survey with 3 sample entries. Average rating of 4.0/5. Sentiment is mostly positive.',
  },
]

const mockChatHistory: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'What is the total amount on the Q3 invoice?',
    timestamp: '2:34 PM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Based on the Q3 Invoice Batch document, the total amount due is **$13,562.50**. This includes a base price of $12,500.00 for the Enterprise Software License plus an 8.5% tax of $1,062.50. Payment terms are Net 30.',
    timestamp: '2:34 PM',
    referencedDoc: 'Q3_Invoice_Batch.pdf',
  },
]

export function getDocuments(): Document[] {
  return mockDocuments
}

export function getDocumentById(id: string): Document | undefined {
  return mockDocuments.find((doc) => doc.id === id)
}

export function getDocumentChatHistory(): ChatMessage[] {
  return mockChatHistory
}
