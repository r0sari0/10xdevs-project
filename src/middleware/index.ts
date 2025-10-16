import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "../db/supabase.client";

const protectedRoutes = ["/", "/flashcards", "/generate"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with cookie support
  const supabase = createServerClient(context.cookies);

  // Get session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Make Supabase client, session, and user available to all routes
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = user;

  const { pathname } = context.url;

  // Don't apply middleware to API routes - they handle auth separately
  if (pathname.startsWith("/api")) {
    return next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route))
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    return context.redirect("/login");
  }

  return next();
});
