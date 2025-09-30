import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

const providers: NextAuthOptions['providers'] = []

// Only add Google provider if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Only add email provider if email configuration is provided
if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  )
}

// If no providers are configured, add a basic credentials provider for demo
if (providers.length === 0) {
  providers.push(
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Demo authentication - in production, verify against database
        if (credentials?.email === 'demo@naturalanalytics.ai' && credentials?.password === 'demo123') {
          return {
            id: 'demo-user',
            email: 'demo@naturalanalytics.ai',
            name: 'Demo User',
          }
        }
        return null
      }
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: providers.length > 0 && providers.some(p => p.type !== 'credentials') ? PrismaAdapter(prisma) : undefined,
  providers,
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        const tokenWithId = token as unknown as { id?: unknown }
        const computedId =
          typeof user?.id === 'string'
            ? user.id
            : typeof tokenWithId?.id === 'string'
            ? (tokenWithId.id as string)
            : 'demo-user'
        session.user.id = computedId
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: providers.some(p => p.type === 'credentials') ? 'jwt' : 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
}