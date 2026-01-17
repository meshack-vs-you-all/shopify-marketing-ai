import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

const BackendAPI = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    // Identify user from name
                    const [firstName, ...lastNameParts] = (user.name || "").split(" ");
                    const lastName = lastNameParts.join(" ");

                    // Call backend to upsert user and get token
                    const { data } = await axios.post(`${BackendAPI}/api/auth/google`, {
                        email: user.email,
                        googleId: user.id,
                        firstName,
                        lastName,
                        avatar: user.image,
                    });

                    // Attach backend token to user object temporarily to pass to jwt callback
                    if (data.token) {
                        (user as any).backendToken = data.token;
                        (user as any).role = data.user.role;
                    }
                    return true;
                } catch (error) {
                    console.error("Backend login failed", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            // User is only passed on first signin
            if (user && (user as any).backendToken) {
                token.accessToken = (user as any).backendToken;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken;
                (session as any).user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin", // Optional custom page
    },
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
