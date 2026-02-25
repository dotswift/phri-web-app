import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const TEST_EMAIL = "e2e@phri.dev";
const TEST_PASSWORD = "testpass123";

export { TEST_EMAIL, TEST_PASSWORD };

export default async function globalSetup() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const apiUrl = process.env.VITE_API_URL;

  if (!supabaseUrl || !serviceRoleKey || !anonKey || !apiUrl) {
    throw new Error(
      "Missing env vars. Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_API_URL",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if test user already exists
  const { data: users } = await admin.auth.admin.listUsers();
  const existing = users?.users.find((u) => u.email === TEST_EMAIL);

  if (!existing) {
    // First run — create the user via admin API
    const { error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      throw new Error(
        `[global-setup] Failed to create test user: ${error.message}`,
      );
    }
    console.log(`[global-setup] Created test user ${TEST_EMAIL}`);
    return; // No backend data to clean on first run
  }

  // Existing user — sign in and wipe backend data for a clean test run
  const { data: signInData, error: signInError } =
    await userClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

  if (signInError) {
    throw new Error(
      `[global-setup] Cannot sign in as test user: ${signInError.message}`,
    );
  }

  const token = signInData.session!.access_token;

  // Wipe consent, patient, chat, embeddings
  const res = await fetch(`${apiUrl}/api/settings/data`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.ok) {
    console.log(`[global-setup] Cleaned backend data for ${TEST_EMAIL}`);
  } else {
    // 404/500 is fine — user may not have any data yet
    console.log(
      `[global-setup] Backend cleanup returned ${res.status} (may be clean already)`,
    );
  }
}
