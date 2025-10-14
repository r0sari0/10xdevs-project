import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "../db/supabase.client";

const protectedRoutes = ["/"]; // Strona główna jest chroniona
const publicRoutes = ["/login", "/register", "/password-reset"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie support
  const supabase = createServerClient(context.cookies);
  
  // Get session from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Make Supabase client, session, and user available to all routes
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = user;

  const { pathname } = context.url;

  // Redirect to login if accessing protected route without authentication
  if (protectedRoutes.includes(pathname) && !user) {
    return context.redirect("/login");
  }

  // Redirect to home if accessing public auth routes while authenticated
  if (publicRoutes.includes(pathname) && user) {
    return context.redirect("/");
  }

  return next();
});
