
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // logging: {
    //     fetches: {
    //         fullUrl: true,
    //     },
    // },
    env: {
        // Turso
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
        // Clerk
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
        NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
        NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
        NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
        CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
        // Leapcell
        LEAPCELL_API_KEY: process.env.LEAPCELL_API_KEY,
        LEAPCELL_TABLE_ID: process.env.LEAPCELL_TABLE_ID,
        // AI
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        MOONSHOT_MODEL: process.env.MOONSHOT_MODEL,
    },
    // Rewrites are handled by Vercel for the frontend and are not needed in the backend code.
};

export default nextConfig;
