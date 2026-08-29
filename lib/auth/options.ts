import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { avatarSelect, effectiveAvatar } from '@/lib/auth/avatar'
import { CREDENTIALS_ERRORS } from '@/lib/auth/errors'
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

      const normalizedEmail = credentials.email.trim().toLowerCase()
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      console.log('[auth-debug]', {
        at: new Date().toISOString(),
        queriedEmail: normalizedEmail,
        found: Boolean(user),
        dbUrlHost: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0],
        totalUserCount: await prisma.user.count(),
      })

      if (!user) {
        throw new Error(CREDENTIALS_ERRORS.userNotFound)
      }

      if (!user.passwordHash) {
        console.log('[auth-debug] no passwordHash set for user', normalizedEmail)
        return null
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

      console.log('[auth-debug] password check', { email: normalizedEmail, isValid })

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

      const googlePicture =
        user.image?.trim() ||
        (typeof (profile as { picture?: unknown })?.picture === 'string'
          ? ((profile as { picture: string }).picture.trim() || null)
          : null) ||
        null

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      })

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLogin: new Date(), oauthAvatarUrl: googlePicture },
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
          oauthAvatarUrl: googlePicture,
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

    async jwt({ token, user, account, trigger }) {
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

      if ((user || trigger === 'update') && token.id) {
        try {
          const current = await prisma.user.findUnique({
            where: { id: token.id },
            select: { name: true, email: true, role: true, passwordHash: true, ...avatarSelect },
          })
          console.log('[auth-debug] jwt callback lookup', { tokenId: token.id, found: Boolean(current) })
          if (current) {
            token.name = current.name
            token.email = current.email
            token.role = current.role
            token.picture = effectiveAvatar(current)
            token.hasPassword = Boolean(current.passwordHash)
          }
        } catch (error) {
          console.error('[auth-debug] jwt callback error', error)
          throw error
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.image = token.picture ?? null
        session.user.hasPassword = token.hasPassword
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
