import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { cleanText, isPhone, requireAdmin } from "@/lib/apiSecurity";

const ROLES = ["admin", "super_admin"];

// GET /api/admin/customers - every customer, newest first, with booking count (for follow-up calls)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request, ROLES);
  if (admin instanceof NextResponse) return admin;

  const [{ data: users, error }, { data: bookings }] = await Promise.all([
    supabaseServer.from("users").select("phone_number, name, created_at, contacted_at, notes").order("created_at", { ascending: false }),
    supabaseServer.from("bookings").select("phone_number, status"),
  ]);
  if (error) return NextResponse.json({ error: "Unable to load customers." }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const b of bookings || []) if (b.status !== "cancelled") counts[b.phone_number] = (counts[b.phone_number] || 0) + 1;
  return NextResponse.json({ customers: (users || []).map((u) => ({ ...u, bookings: counts[u.phone_number] || 0 })) });
}

// PATCH /api/admin/customers - { phone, name? , contacted?: boolean, notes? }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request, ROLES);
  if (admin instanceof NextResponse) return admin;

  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  if (!isPhone(phone)) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = cleanText(body.name, 100);
    if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    updates.name = name;
  }
  if (body.contacted !== undefined) updates.contacted_at = body.contacted ? new Date().toISOString() : null;
  if (body.notes !== undefined) updates.notes = cleanText(body.notes, 500) || null;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { error } = await supabaseServer.from("users").update(updates).eq("phone_number", phone);
  if (error) return NextResponse.json({ error: "Unable to update customer." }, { status: 500 });
  return NextResponse.json({ success: true });
}
