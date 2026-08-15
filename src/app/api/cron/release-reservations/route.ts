import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  const { data, error } = await createAdminClient().rpc("release_expired_reservations");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ released: data });
}

