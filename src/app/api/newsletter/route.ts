import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 60_000).allowed) return NextResponse.redirect(new URL("/?newsletter=limitado", request.url), 303);
  const formData = await request.formData();
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return NextResponse.redirect(new URL("/?newsletter=invalido", request.url), 303);
  if (isSupabaseConfigured()) {
    await createAdminClient().from("newsletter_subscribers").upsert({ email: parsed.data.toLowerCase(), active: true }, { onConflict: "email" });
  }
  return NextResponse.redirect(new URL("/?newsletter=ok", request.url), 303);
}

