
import { Auth0Client } from "@auth0/nextjs-auth0/server";

console.log("=== Auth0 Production Debug ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("APP_BASE_URL:", process.env.APP_BASE_URL);
console.log("AUTH0_DOMAIN:", process.env.AUTH0_DOMAIN);
console.log("AUTH0_CLIENT_ID:", process.env.AUTH0_CLIENT_ID);
console.log("AUTH0_CLIENT_SECRET:", process.env.AUTH0_CLIENT_SECRET);
console.log("AUTH0_SECRET:", process.env.AUTH0_SECRET);
console.log("API_URL:", process.env.NEXT_PUBLIC_API_URL);

console.log("Current URL detection:", process.env.VERCEL_URL || 'No VERCEL_URL');
console.log("=== End Production Debug ===");

// Debug: Check if environment variables are loaded
// Initialize the Auth0 client with explicit values and fallbacks
export const auth0 = new Auth0Client();