// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xylcrunwuztdgrpmtbpq.supabase.co";

// Your Publishable Key (starts with sb_publishable_)
const supabaseAnonKey = "sb_publishable_qgW3aWQgylXDUPVekN9sGg_qpek5qh8";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Safely expose it to the window object for debugging (prevents initialization errors)
if (typeof window !== "undefined") {
  // We use setTimeout to ensure the client is fully initialized before assigning
  setTimeout(() => {
    window.supabase = supabase;
  }, 0);
}