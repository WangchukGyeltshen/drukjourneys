"use server";

import { redirect } from "next/navigation";
import { postAuth } from "@/lib/auth-api";
import { safeNextPath } from "@/lib/safe-redirect";
import { setSession } from "@/lib/session";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: { fullName: string; email: string; nationality: string };
};

export async function register(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const values = { fullName, email, nationality };

  const result = await postAuth("/auth/register", {
    fullName,
    email,
    password,
    ...(nationality ? { nationality } : {}),
  });

  if (!result.ok) {
    if (result.status === 400 && result.fieldErrors) {
      return { fieldErrors: result.fieldErrors, values };
    }
    if (result.status === 409) {
      return { fieldErrors: { email: ["An account with this email already exists."] }, values };
    }
    if (result.status === 429) {
      return { error: "Too many attempts. Please wait a while and try again.", values };
    }
    return { error: result.error, values };
  }

  await setSession(result.token, result.refreshToken);
  redirect(next);
}
