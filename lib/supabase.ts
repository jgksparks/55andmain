import { createClient } from "@supabase/supabase-js";

const url = "https://nvaxpqwaqjwddofossdc.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52YXhwcXdhcWp3ZGRvZm9zc2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjIwMTEsImV4cCI6MjA5ODQ5ODAxMX0.8y3SNtzde0IJxsjSR5lk3ZPN5q0vnaaUibS7G3Ibhco";

export const supabase = createClient(url, anonKey);

export function getServiceClient() {
  return createClient(url, anonKey);
}
