import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE, createCookieHeader, generateAccessToken,
  generateRefreshToken, getRefreshTokenExpiryDate, hashRefreshToken,
} from "@/lib/tokens";
import { rateLimit } from "@/lib/apiSecurity";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const validPhone = (phone: string) => /^\d{10}$/.test(phone);

const norm = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Customer identity check: mobile + name. First sight of a number registers it (name is then locked);
 * later visits must match the stored name (case-insensitive, spelling exact) or the admin has to resolve it.
 */
export async function POST(request: Request) {
  const limited = await rateLimit(request, "customer_password", 10, 900);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const name = String(body.name ?? "").replace(/[<>]/g, "").trim().slice(0, 100);
  const deviceFingerprint = String(body.deviceFingerprint ?? "").trim().slice(0, 128);
  const deviceName = String(body.deviceName ?? "Unknown Device").trim().slice(0, 100);
  if (!validPhone(phone)) return NextResponse.json({ error: "Enter a valid 10-digit WhatsApp number." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  const phoneLimited = await rateLimit(request, "customer_password_phone", 10, 900, `phone:${phone}`);
  if (phoneLimited) return phoneLimited;

  const { data: user, error: lookupError } = await supabase.from("users").select("phone_number, name").eq("phone_number", phone).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Unable to verify your details." }, { status: 500 });

  if (!user) {
    const { error } = await supabase.from("users").insert({ phone_number: phone, name });
    if (error) return NextResponse.json({ error: "Unable to save your details." }, { status: 500 });
  } else if (!user.name?.trim()) {
    await supabase.from("users").update({ name }).eq("phone_number", phone);
  } else if (norm(user.name) !== norm(name)) {
    // Shows up in the admin panel (Verification Requests) so the owner can confirm with the customer.
    const { data: pending } = await supabase.from("password_reset_requests").select("id").eq("phone_number", phone).eq("name", name).eq("status", "pending").limit(1);
    if (!pending?.length) await supabase.from("password_reset_requests").insert({ phone_number: phone, name });
    return NextResponse.json(
      { error: "Mobile number and name do not match. Please drop us a WhatsApp message (no calls) at the contact number above." },
      { status: 401 },
    );
  }
  const savedName = user?.name?.trim() || name;

  const accessToken = generateAccessToken(phone);
  const refreshToken = generateRefreshToken(phone, deviceFingerprint || undefined);
  const { error: tokenError } = await supabase.from("refresh_tokens").insert({
    user_phone: phone, token_hash: hashRefreshToken(refreshToken),
    device_fingerprint: deviceFingerprint || null, device_name: deviceName,
    expires_at: getRefreshTokenExpiryDate().toISOString(),
  });
  if (tokenError) console.error("[Customer Password] Failed to store refresh token:", tokenError);
  if (deviceFingerprint) {
    await supabase.from("trusted_devices").upsert({ phone, device_fingerprint: deviceFingerprint, device_name: deviceName, last_used_at: new Date().toISOString(), is_active: true }, { onConflict: "phone,device_fingerprint" });
  }
  const response = NextResponse.json({ authenticated: true, user: { phone, name: savedName } });
  response.headers.append("Set-Cookie", createCookieHeader(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE));
  response.headers.append("Set-Cookie", createCookieHeader(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE));
  return response;
}

export async function GET(request: Request) {
  const limited = await rateLimit(request, "customer_password_status", 20, 600);
  if (limited) return limited;
  const phone = new URL(request.url).searchParams.get("phone")?.replace(/\D/g, "") || "";
  if (!validPhone(phone)) return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  const { data: user, error } = await supabase.from("users").select("phone_number").eq("phone_number", phone).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to check account." }, { status: 500 });
  return NextResponse.json({ exists: !!user });
}
