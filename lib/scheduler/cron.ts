import { CronExpressionParser } from 'cron-parser'

const CRON_FIELD_COUNT = 5

export type CronValidation =
  | { ok: true; nextRun: Date }
  | { ok: false; error: string }

export function validateCron(expression: string, from: Date = new Date()): CronValidation {
  const expr = expression.trim().replace(/\s+/g, ' ')

  if (!expr) {
    return { ok: false, error: 'cron_expr is required' }
  }

  const fields = expr.split(' ')
  if (fields.length !== CRON_FIELD_COUNT) {
    return {
      ok: false,
      error: `cron_expr must have exactly ${CRON_FIELD_COUNT} fields (minute hour day-of-month month day-of-week), got ${fields.length}`,
    }
  }

  try {
    const interval = CronExpressionParser.parse(expr, { currentDate: from })
    return { ok: true, nextRun: interval.next().toDate() }
  } catch (error) {
    return { ok: false, error: `Invalid cron expression: ${(error as Error).message}` }
  }
}

export function nextRunFor(expression: string, from: Date = new Date()): Date {
  const result = validateCron(expression, from)
  return result.ok ? result.nextRun : from
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(minute: string, hour: string): string {
  const h = Number(hour)
  const m = Number(minute)
  const suffix = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function describeCron(expression: string): string {
  const [minute, hour, dom, month, dow] = expression.trim().split(/\s+/)
  if (!dow) return expression

  const everyMinutes = minute?.match(/^\*\/(\d+)$/)
  if (everyMinutes && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return `Every ${everyMinutes[1]} minutes`
  }

  const everyHours = hour?.match(/^\*\/(\d+)$/)
  if (everyHours && /^\d+$/.test(minute) && dom === '*' && month === '*' && dow === '*') {
    return `Every ${everyHours[1]} hours`
  }

  if (minute === '0' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return 'Every hour'
  }

  const isFixedTime = /^\d+$/.test(minute) && /^\d+$/.test(hour)
  if (!isFixedTime) return expression

  const time = formatTime(minute, hour)

  if (dom === '*' && month === '*' && dow === '*') return `Every day at ${time}`
  if (dom === '*' && month === '*' && dow === '1-5') return `Every weekday at ${time}`
  if (dom === '*' && month === '*' && /^\d$/.test(dow)) {
    return `Every ${DAY_NAMES[Number(dow)]} at ${time}`
  }
  if (month === '*' && dow === '*' && /^\d+$/.test(dom)) {
    const suffix = dom === '1' ? 'st' : dom === '2' ? 'nd' : dom === '3' ? 'rd' : 'th'
    return `${dom}${suffix} of every month at ${time}`
  }

  return expression
}
