
import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Debug: Check if environment variables are loaded
console.log("Auth0 Environment Variables Check:");
console.log("AUTH0_DOMAIN:", process.env.NEXT_PUBLIC_AUTH0_DOMAIN ? "✓ Set" : "✗ Missing");
console.log("AUTH0_CLIENT_ID:", process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ? "✓ Set" : "✗ Missing");
console.log("AUTH0_CLIENT_SECRET:", process.env.NEXT_PUBLIC_AUTH0_CLIENT_SECRET ? "✓ Set" : "✗ Missing");
console.log("AUTH0_SECRET:", process.env.NEXT_PUBLIC_AUTH0_SECRET ? "✓ Set" : "✗ Missing");
console.log("APP_BASE_URL:", process.env.NEXT_PUBLIC_APP_BASE_URL ? "✓ Set" : "✗ Missing");

// Initialize the Auth0 client with explicit values and fallbacks
export const auth0 = new Auth0Client({
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000',
  secret: process.env.NEXT_PUBLIC_AUTH0_SECRET,

  // Additional configuration that might help
  authorizationParameters: {
    scope: 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE, // Optional: only if you're using an API
  }
});