export type ReportType = 'Employee' | 'Workflow' | 'Sales' | 'HR' | 'AI Usage'
export type ReportFormat = 'PDF' | 'Word' | 'Excel'
export type ReportStatus = 'Ready' | 'Generating' | 'Failed'

export interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  generatedAt: string
  size: string
  generatedBy: string
}

const mockReports: Report[] = [
  {
    id: 'rep-1',
    name: 'Monthly Employee Summary – July 2026',
    type: 'Employee',
    format: 'PDF',
    status: 'Ready',
    generatedAt: 'Aug 7, 2026 09:00',
    size: '1.2 MB',
    generatedBy: 'Ava Chen',
  },
  {
    id: 'rep-2',
    name: 'Workflow Performance Report – Q2 2026',
    type: 'Workflow',
    format: 'Excel',
    status: 'Ready',
    generatedAt: 'Aug 6, 2026 14:30',
    size: '856 KB',
    generatedBy: 'System Scheduler',
  },
  {
    id: 'rep-3',
    name: 'Sales Analytics Dashboard Export – Q2',
    type: 'Sales',
    format: 'Excel',
    status: 'Ready',
    generatedAt: 'Aug 5, 2026 11:15',
    size: '2.1 MB',
    generatedBy: 'Marcus Reed',
  },
  {
    id: 'rep-4',
    name: 'HR Compliance Audit – July 2026',
    type: 'HR',
    format: 'PDF',
    status: 'Ready',
    generatedAt: 'Aug 4, 2026 09:45',
    size: '678 KB',
    generatedBy: 'Priya Nair',
  },
  {
    id: 'rep-5',
    name: 'AI Credit Usage Report – July 2026',
    type: 'AI Usage',
    format: 'PDF',
    status: 'Ready',
    generatedAt: 'Aug 3, 2026 08:00',
    size: '445 KB',
    generatedBy: 'System Scheduler',
  },
  {
    id: 'rep-6',
    name: 'Employee Onboarding Report – Aug 2026',
    type: 'Employee',
    format: 'Word',
    status: 'Generating',
    generatedAt: 'Aug 7, 2026 10:05',
    size: '—',
    generatedBy: 'Ava Chen',
  },
  {
    id: 'rep-7',
    name: 'Sales Pipeline Forecast – Q3 2026',
    type: 'Sales',
    format: 'Excel',
    status: 'Failed',
    generatedAt: 'Aug 2, 2026 16:20',
    size: '—',
    generatedBy: 'Diego Alvarez',
  },
]

export function getReports(): Report[] {
  return mockReports
}
