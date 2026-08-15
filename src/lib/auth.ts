import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
};

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("active,roles(name,role_permissions(permissions(code))),profiles(full_name)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin?.active) return null;

  const roleRelation = admin.roles as unknown as { name: string; role_permissions: Array<{ permissions: { code: string } | null }> } | null;
  const profileRelation = admin.profiles as unknown as { full_name: string } | null;
  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profileRelation?.full_name ?? user.user_metadata?.full_name ?? "Administrador",
    role: roleRelation?.name ?? "Administrador",
    permissions: roleRelation?.role_permissions.flatMap((item) => item.permissions?.code ? [item.permissions.code] : []) ?? [],
  };
});

export async function requireAdmin(permission?: string) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !session.permissions.includes(permission)) redirect("/admin?erro=sem-permissao");
  return session;
}
