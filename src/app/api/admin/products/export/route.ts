import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function cell(value: unknown) { const text = String(value ?? ""); return `"${text.replaceAll('"', '""')}"`; }
export async function GET() { const admin = await getAdminSession(); if (!admin?.permissions.includes("products.view")) return NextResponse.json({ error: "Não autorizado." }, { status: 401 }); const { data, error } = await (await createSupabaseServerClient())!.from("products").select("name,slug,sku,price,cost,stock,minimum_stock,main_image_url,active").order("name"); if (error) return NextResponse.json({ error: error.message }, { status: 500 }); const headers = ["name","slug","sku","price","cost","stock","minimum_stock","main_image_url","active"]; const csv = [headers.join(","), ...(data ?? []).map((row) => headers.map((header) => cell(row[header as keyof typeof row])).join(","))].join("\r\n"); return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="produtos-tubaroes-${new Date().toISOString().slice(0,10)}.csv"` } }); }

