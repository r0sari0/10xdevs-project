import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  const { supabase } = locals;

  // Sign out the user
  await supabase.auth.signOut();

  // Redirect to login page
  return redirect("/login");
};
