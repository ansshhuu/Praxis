import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { SEED_TEMPLATES } from '../lib/marketplace/templates'

const prisma = new PrismaClient()

/** Idempotent: reuses the admin when a previous seed already created it. */
async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@company.com' } })
  if (existing) {
    console.log('Admin user already exists')
    return existing
  }

  const passwordHash = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created')
  return admin
}

/**
 * Populates the marketplace gallery. Skipped entirely once the table has any
 * row, so re-running the seed never duplicates templates or clobbers ones an
 * admin published through POST /api/marketplace.
 */
async function seedMarketplace(createdBy: string) {
  const count = await prisma.marketplaceTemplate.count()
  if (count > 0) {
    console.log(`Marketplace already has ${count} template(s) — skipping`)
    return
  }

  await prisma.marketplaceTemplate.createMany({
    data: SEED_TEMPLATES.map((template) => ({
      name: template.name,
      description: template.description,
      category: template.category,
      workflowJson: template.workflowJson,
      createdBy,
    })),
  })

  console.log(`Seeded ${SEED_TEMPLATES.length} marketplace templates`)
}

async function main() {
  const admin = await seedAdmin()
  await seedMarketplace(admin.id)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
