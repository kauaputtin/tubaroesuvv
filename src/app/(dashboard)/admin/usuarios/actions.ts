"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function saveAdminUser(formData:FormData){const admin=await requireAdmin("admins.manage");const parsed=z.object({user_id:z.uuid(),role_id:z.uuid(),full_name:z.string().trim().min(3),active:z.boolean()}).parse({...Object.fromEntries(formData.entries()),active:formData.has("active")});const supabase=(await createSupabaseServerClient())!;const {error:profileError}=await supabase.from("profiles").upsert({id:parsed.user_id,full_name:parsed.full_name});if(profileError)throw new Error("O UUID precisa pertencer a um usuário já criado no Supabase Auth.");const{error}=await supabase.from("admin_users").upsert({user_id:parsed.user_id,role_id:parsed.role_id,active:parsed.active});if(error)throw new Error(error.message);await supabase.from("audit_logs").insert({actor_id:admin.userId,action:"admin_user.save",entity_type:"admin_user",entity_id:parsed.user_id,new_data:parsed});revalidatePath("/admin/usuarios");}

