import NextAuth from 'next-auth';
import { generateAuthOptions } from './auth-options';

// Generate dynamic auth options
const authOptionsPromise = generateAuthOptions();

// Create a handler function that awaits the auth options
const handler = async (req: Request, context: any) => {
  const authOptions = await authOptionsPromise;
  return NextAuth(authOptions)(req, context);
};

export { handler as GET, handler as POST }; 