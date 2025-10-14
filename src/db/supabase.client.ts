import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import type { Database } from "./database.types";

// Default user ID for testing/development purposes
export const DEFAULT_USER_ID = "d87564bf-68ee-461c-a5d1-4591a086d4fe";

/**
 * Creates a Supabase client for server-side use (SSR)
 * Uses cookies for session management
 */
export function createServerClient(cookies: AstroCookies): SupabaseClient<Database> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key: string) => {
          return cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          cookies.set(key, value, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: "lax",
            secure: import.meta.env.PROD,
          });
        },
        removeItem: (key: string) => {
          cookies.delete(key, {
            path: "/",
          });
        },
      },
    },
  });
}

// Singleton instance for browser client
let browserClientInstance: SupabaseClient<Database> | null = null;

/**
 * Cookie-based storage adapter for browser client
 * This ensures session is synchronized between client and server
 */
const browserCookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find(c => c.startsWith(`${key}=`));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0`;
  },
};

/**
 * Creates a Supabase client for client-side use (browser)
 * Uses singleton pattern to ensure one instance across all components
 * Uses PUBLIC environment variables
 * 
 * NOTE: This should only be called in browser context (e.g., inside useEffect or event handlers)
 */
export function createBrowserClient(): SupabaseClient<Database> {
  // Guard against SSR - should never happen if used correctly
  if (typeof window === 'undefined') {
    throw new Error('createBrowserClient() can only be called in browser context');
  }

  if (browserClientInstance) {
    return browserClientInstance;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  browserClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      storage: browserCookieStorage,
    },
  });

  return browserClientInstance;
}

// Export type for use in other files
export type { SupabaseClient } from "@supabase/supabase-js";
