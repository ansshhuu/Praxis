import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10)

  await prisma.user.create({
    data: {
      email: 'admin@company.com',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created')
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user (it may already exist):', error.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
