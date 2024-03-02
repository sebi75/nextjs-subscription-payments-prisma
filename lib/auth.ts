import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type GetServerSidePropsContext } from 'next';
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions
} from 'next-auth';

import { env } from '@/env';
import { db } from '@/lib/db';
import GoogleProvider from 'next-auth/providers/google';

export type UserMetadata = {
  uploadedCharacters: number;
};

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      metadata: UserMetadata;
      lastVisitedAt: Date;
    };
  }

  interface User {
    // role: UserRole;
    metadata: UserMetadata;
    lastVisitedAt: Date;
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error'
  },
  events: {
    signIn: async (message) => {
      if (message.isNewUser) {
        // Have some logic for just created users. Create entities in the database.
        try {
          // create user data
        } catch (error) {
          console.error('Error creating user data at signIn event', error);
          throw error;
        }
      }
    }
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        metadata: user.metadata
      }
    })
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  ]
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
