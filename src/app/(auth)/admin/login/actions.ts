"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function loginAdmin(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.object({ email: z.email(), password: z.string().min(8) }).safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Informe e-mail e senha válidos." };
  if (!rateLimit(`admin-login:${parsed.data.email.toLowerCase()}`, 5, 15 * 60_000).allowed) return { error: "Muitas tentativas. Aguarde 15 minutos." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Configure o Supabase para habilitar o acesso administrativo." };
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "E-mail ou senha incorretos." };
  const { data: admin } = await supabase.from("admin_users").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!admin?.active) { await supabase.auth.signOut(); return { error: "Este usuário não possui acesso administrativo." }; }
  redirect("/admin");
}

