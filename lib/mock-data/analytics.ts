export interface AnalyticsTimePoint {
  label: string
  value: number
}

export interface WorkflowStatusPoint {
  name: string
  success: number
  failed: number
}

export interface ApiCallPoint {
  date: string
  calls: number
}

export interface ResponseTimePoint {
  date: string
  p50: number
  p95: number
  p99: number
}

const mockAiUsageOverTime: AnalyticsTimePoint[] = [
  { label: 'Aug 1', value: 14200 },
  { label: 'Aug 2', value: 15800 },
  { label: 'Aug 3', value: 13400 },
  { label: 'Aug 4', value: 17200 },
  { label: 'Aug 5', value: 16100 },
  { label: 'Aug 6', value: 18900 },
  { label: 'Aug 7', value: 19204 },
]

const mockWorkflowStatus: WorkflowStatusPoint[] = [
  { name: 'Mon', success: 42, failed: 5 },
  { name: 'Tue', success: 38, failed: 3 },
  { name: 'Wed', success: 45, failed: 7 },
  { name: 'Thu', success: 51, failed: 2 },
  { name: 'Fri', success: 48, failed: 4 },
  { name: 'Sat', success: 29, failed: 1 },
  { name: 'Sun', success: 22, failed: 2 },
]

const mockResponseTime: ResponseTimePoint[] = [
  { date: 'Aug 1', p50: 210, p95: 580, p99: 1200 },
  { date: 'Aug 2', p50: 195, p95: 540, p99: 1100 },
  { date: 'Aug 3', p50: 230, p95: 620, p99: 1350 },
  { date: 'Aug 4', p50: 180, p95: 480, p99: 980 },
  { date: 'Aug 5', p50: 200, p95: 510, p99: 1050 },
  { date: 'Aug 6', p50: 175, p95: 460, p99: 920 },
  { date: 'Aug 7', p50: 190, p95: 495, p99: 1010 },
]

const mockApiCalls: ApiCallPoint[] = [
  { date: 'Aug 1', calls: 8400 },
  { date: 'Aug 2', calls: 9200 },
  { date: 'Aug 3', calls: 7800 },
  { date: 'Aug 4', calls: 10100 },
  { date: 'Aug 5', calls: 9600 },
  { date: 'Aug 6', calls: 11200 },
  { date: 'Aug 7', calls: 11850 },
]

export interface StorageUsage {
  label: string
  used: number
  total: number
  unit: string
}

const mockStorageUsage: StorageUsage = {
  label: 'Storage',
  used: 284,
  total: 500,
  unit: 'GB',
}

export function getAiUsageOverTime(): AnalyticsTimePoint[] {
  return mockAiUsageOverTime
}

export function getWorkflowStatusData(): WorkflowStatusPoint[] {
  return mockWorkflowStatus
}

export function getResponseTimeData(): ResponseTimePoint[] {
  return mockResponseTime
}

export function getApiCallData(): ApiCallPoint[] {
  return mockApiCalls
}

export function getStorageUsage(): StorageUsage {
  return mockStorageUsage
}
