
import { Auth0Client } from "@auth0/nextjs-auth0/server";


// Debug: Check if environment variables are loaded
// Initialize the Auth0 client with explicit values and fallbacks
export const auth0 = new Auth0Client();