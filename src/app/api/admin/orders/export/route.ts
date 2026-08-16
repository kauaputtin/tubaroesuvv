import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
/**
 * Célula de CSV segura para abrir no Excel.
 *
 * As aspas protegem a estrutura do arquivo, mas não impedem o Excel de avaliar
 * o conteúdo: ao abrir, ele remove as aspas e trata `=...`, `+...`, `-...` e
 * `@...` como fórmula. Como o nome, o e-mail e o telefone vêm do checkout —
 * quer dizer, de qualquer pessoa que faça um pedido —, um cliente poderia
 * gravar uma fórmula que roda na máquina de quem exporta. O apóstrofo à frente
 * faz o Excel tratar tudo como texto.
 */
function cell(value:unknown){const texto=String(value??"");const prefixo=/^[=+\-@\t\r]/.test(texto)?"'":"";return `"${prefixo}${texto.replaceAll('"','""')}"`;}
export async function GET(){const admin=await getAdminSession();if(!admin?.permissions.includes("orders.view"))return NextResponse.json({error:"Não autorizado."},{status:401});const {data,error}=await (await createSupabaseServerClient())!.from("orders").select("public_number,created_at,payment_status,fulfillment_status,fulfillment_type,subtotal,discount,shipping_amount,total,customers(full_name,email,phone),courses(name)").order("created_at",{ascending:false});if(error)return NextResponse.json({error:error.message},{status:500});const headers=["pedido","data","cliente","email","telefone","curso","pagamento","atendimento","recebimento","subtotal","desconto","entrega","total"];const rows=(data??[]).map(order=>{const c=order.customers as unknown as {full_name:string;email:string;phone:string};const course=order.courses as unknown as {name:string}|null;return [order.public_number,order.created_at,c.full_name,c.email,c.phone,course?.name,order.payment_status,order.fulfillment_status,order.fulfillment_type,order.subtotal,order.discount,order.shipping_amount,order.total].map(cell).join(",")});return new NextResponse(`\uFEFF${[headers.join(","),...rows].join("\r\n")}`,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="pedidos-tubaroes-${new Date().toISOString().slice(0,10)}.csv"`}});}

