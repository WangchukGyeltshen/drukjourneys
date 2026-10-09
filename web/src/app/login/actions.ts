"use server";

import { redirect } from "next/navigation";
import { postAuth } from "@/lib/auth-api";
import { clearSession, getRefreshToken, setSession } from "@/lib/session";
import { API_BASE_URL } from "@/lib/api";
import { safeNextPath } from "@/lib/safe-redirect";

export type FormState = { error?: string; email?: string };

export async function login(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const result = await postAuth("/auth/login", { email, password });
  if (!result.ok) {
    if (result.status === 401) {
      return { error: "That email and password do not match.", email };
    }
    if (result.status === 429) {
      return { error: "Too many attempts. Please wait a few minutes and try again.", email };
    }
    return { error: result.error, email };
  }

  await setSession(result.token, result.refreshToken);
  redirect(next);
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    // Revoke the token on the API. The cookies are cleared either way.
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  await clearSession();
  redirect("/");
}
