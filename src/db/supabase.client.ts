import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Default user ID for testing/development purposes
export const DEFAULT_USER_ID = "d87564bf-68ee-461c-a5d1-4591a086d4fe";
