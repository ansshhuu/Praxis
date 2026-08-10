import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { SEED_TEMPLATES } from '../lib/marketplace/templates'

const prisma = new PrismaClient()

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

async function seedMarketplace(createdBy: string) {
  let created = 0
  let updated = 0

  for (const template of SEED_TEMPLATES) {
    const existing = await prisma.marketplaceTemplate.findFirst({
      where: { name: template.name },
      select: { id: true },
    })

    const data = {
      name: template.name,
      description: template.description,
      category: template.category,
      workflowJson: template.workflowJson,
    }

    if (existing) {
      await prisma.marketplaceTemplate.update({ where: { id: existing.id }, data })
      updated += 1
    } else {
      await prisma.marketplaceTemplate.create({ data: { ...data, createdBy } })
      created += 1
    }
  }

  console.log(`Marketplace templates: ${created} created, ${updated} refreshed`)
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
