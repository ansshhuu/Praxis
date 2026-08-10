import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { prisma } from '@/lib/db/prisma'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.trim().toLowerCase() },
      })

      if (!user || !user.passwordHash) {
        return null
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

      if (!isValid) {
        return null
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      await logActivity(user.id, ACTIVITY_ACTIONS.userLogin, {
        email: user.email,
        role: user.role,
        provider: 'credentials',
      })

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    },
  }),
]

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true

      const email = user.email?.trim().toLowerCase()
      if (!email) return false

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      })

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLogin: new Date() },
        })
        await logActivity(existing.id, ACTIVITY_ACTIONS.userLogin, {
          email,
          role: existing.role,
          provider: 'google',
        })
        return true
      }

      const fallbackName = email.split('@')[0]
      const created = await prisma.user.create({
        data: {
          email,
          name: user.name?.trim() || profile?.name?.trim() || fallbackName,
          passwordHash: null,
          role: 'EMPLOYEE',
          lastLogin: new Date(),
        },
        select: { id: true, role: true },
      })

      await logActivity(created.id, ACTIVITY_ACTIONS.userLogin, {
        email,
        role: created.role,
        provider: 'google',
        firstSignIn: true,
      })

      return true
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.trim().toLowerCase() },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
