import fs from 'node:fs'
import path from 'node:path'

import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env')
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    const eq = trimmed.indexOf('=')
    if (!trimmed || trimmed.startsWith('#') || eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

const TEMPLATE_PATTERN = /\{\{\s*[\w.]+\s*\}\}/g

function tidy(raw: string): string {
  return raw
    .replace(TEMPLATE_PATTERN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim()
}

async function main() {
  const rows = await prisma.notification.findMany({
    where: { message: { contains: '{{' } },
    select: { id: true, message: true },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`${rows.length} notification row(s) contain template syntax`)

  const changes = rows
    .map((row) => ({ id: row.id, before: row.message, after: tidy(row.message) }))
    .filter((change) => change.after !== change.before)

  for (const change of changes) {
    console.log(`  ${change.id}`)
    console.log(`    before: ${JSON.stringify(change.before)}`)
    console.log(`    after:  ${JSON.stringify(change.after)}`)
  }

  if (changes.length === 0) {
    console.log('Nothing to scrub.')
    return
  }

  if (!APPLY) {
    console.log(`DRY RUN - ${changes.length} row(s) would be updated. Re-run with --apply.`)
    return
  }

  let updated = 0
  for (const change of changes) {
    await prisma.notification.update({
      where: { id: change.id },
      data: { message: change.after },
    })
    updated += 1
  }
  console.log(`Updated ${updated} row(s).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
