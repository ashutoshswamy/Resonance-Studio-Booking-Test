import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/apiSecurity";

// "Verification requests": a customer entered a name that does not match the one stored for that mobile number.
// (Table is still password_reset_requests - reused to avoid a migration.)
const ROLES = ["admin", "super_admin"];

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request, ROLES);
  if (admin instanceof NextResponse) return admin;
  const { data, error } = await supabaseServer
    .from("password_reset_requests")
    .select("id, phone_number, name, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Unable to load requests." }, { status: 500 });

  const phones = [...new Set((data || []).map((r) => r.phone_number))];
  const { data: users } = phones.length
    ? await supabaseServer.from("users").select("phone_number, name").in("phone_number", phones)
    : { data: [] as { phone_number: string; name: string | null }[] };
  const registered = Object.fromEntries((users || []).map((u) => [u.phone_number, u.name]));
  return NextResponse.json({ requests: (data || []).map((r) => ({ ...r, registered_name: registered[r.phone_number] ?? null })) });
}

// PATCH { id, useEnteredName?: boolean } - mark resolved; optionally replace the stored name with the one the customer typed.
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request, ROLES);
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const { data: req } = await supabaseServer.from("password_reset_requests").select("id, phone_number, name").eq("id", id).single();
  if (!req) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (body.useEnteredName && req.name) {
    const { error } = await supabaseServer.from("users").update({ name: req.name }).eq("phone_number", req.phone_number);
    if (error) return NextResponse.json({ error: "Unable to update the customer name." }, { status: 500 });
  }
  const { error } = await supabaseServer
    .from("password_reset_requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "Unable to resolve request." }, { status: 500 });
  return NextResponse.json({ success: true });
}
