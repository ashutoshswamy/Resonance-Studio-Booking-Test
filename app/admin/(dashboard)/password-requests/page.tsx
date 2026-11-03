"use client";

import { useEffect, useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface VerificationRequest {
  id: string;
  phone_number: string;
  name: string | null;
  registered_name: string | null;
  status: "pending" | "resolved";
  created_at: string;
}

// Customers whose typed name did not match the name stored for their mobile number.
export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    const response = await adminFetch("/api/admin/password-requests");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load requests.");
    setRequests(data.requests || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const resolve = async (r: VerificationRequest, useEnteredName: boolean) => {
    if (useEnteredName && !confirm(`Change the registered name to "${r.name}"? Only do this after confirming with the customer.`)) return;
    setError("");
    const response = await adminFetch("/api/admin/password-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, useEnteredName }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to resolve request.");
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.16em] text-violet-300">Customer access</p>
        <h1 className="text-3xl font-bold text-white mt-1">Verification requests</h1>
        <p className="text-zinc-300 mt-1">
          Mobile number and name did not match. Confirm with the customer on WhatsApp. The registered name below is what they must type exactly (capital / small letters do not matter).
        </p>
      </header>
      {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</p>}
      <div className="space-y-3">
        {requests.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300">No verification requests.</div>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-white font-semibold"><ShieldAlert className="size-4 text-amber-300" />+91 {r.phone_number}</div>
              <p className="text-sm text-zinc-200">Registered name: <strong className="text-white">{r.registered_name || "-"}</strong></p>
              <p className="text-sm text-zinc-200">Entered name: <strong className="text-white">{r.name || "-"}</strong></p>
              <p className="text-xs text-zinc-300">{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${r.status === "pending" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{r.status}</span>
            </div>
            {r.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => resolve(r, false)} className="h-10 px-4 rounded-lg border border-white/15 text-white font-semibold inline-flex items-center justify-center gap-2"><Check className="size-4" /> Keep registered name</button>
                <button onClick={() => resolve(r, true)} className="h-10 px-4 rounded-lg bg-violet-400 text-navy font-semibold inline-flex items-center justify-center gap-2">Use entered name</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
