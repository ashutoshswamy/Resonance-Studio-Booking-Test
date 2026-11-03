"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Phone, Search, Pencil, Check } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface Customer {
  phone_number: string;
  name: string | null;
  created_at: string;
  contacted_at: string | null;
  notes: string | null;
  bookings: number;
}

type Filter = "all" | "new" | "nobooking";

// New customers show up here so the owner can add them to contacts / WhatsApp and call (follow-up if no booking yet).
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("new");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await adminFetch("/api/admin/customers");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load customers.");
    setCustomers(data.customers || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const patch = async (phone: string, body: Record<string, unknown>) => {
    setError("");
    const response = await adminFetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, ...body }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to update customer.");
    await load();
  };

  const rename = (c: Customer) => {
    const name = prompt(`Registered name for ${c.phone_number} (confirm with the customer first):`, c.name || "");
    if (name?.trim()) patch(c.phone_number, { name });
  };

  const q = search.trim().toLowerCase();
  const shown = customers.filter(
    (c) =>
      (!q || c.phone_number.includes(q) || (c.name || "").toLowerCase().includes(q)) &&
      (filter === "all" || (filter === "new" ? !c.contacted_at : c.bookings === 0)),
  );

  const tab = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`px-3.5 py-1.5 rounded-md text-sm font-medium ${filter === f ? "bg-violet-400 text-navy" : "text-zinc-300 hover:text-white"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.16em] text-violet-300">Marketing</p>
        <h1 className="text-3xl font-bold text-white mt-1">Customers</h1>
        <p className="text-zinc-300 mt-1">New customers appear here first. Save the number, say hello on WhatsApp, call, then tick “Contacted”. “No booking yet” is your follow-up list.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {tab("new", "Not contacted")}
          {tab("nobooking", "No booking yet")}
          {tab("all", "All")}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number" className="h-10 w-full rounded-lg border border-white/10 bg-black/20 pl-9 pr-3 text-white" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</p>}

      <ul className="space-y-3">
        {shown.length === 0 && <li className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300">No customers here.</li>}
        {shown.map((c) => (
          <li key={c.phone_number} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{c.name || "Unnamed"}</p>
              <p className="text-sm text-zinc-200 tabular-nums">+91 {c.phone_number}</p>
              <p className="text-xs text-zinc-300 mt-1">
                Joined {new Date(c.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })} ·{" "}
                {c.bookings ? `${c.bookings} booking${c.bookings > 1 ? "s" : ""}` : "No booking yet"}
                {c.contacted_at && ` · Contacted ${new Date(c.contacted_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:+91${c.phone_number}`} className="h-9 px-3 rounded-lg border border-white/15 text-white text-sm inline-flex items-center gap-2"><Phone className="size-4" /> Call</a>
              <a href={`https://wa.me/91${c.phone_number}`} target="_blank" rel="noreferrer" className="h-9 px-3 rounded-lg bg-emerald-500 text-white text-sm inline-flex items-center gap-2"><MessageCircle className="size-4" /> WhatsApp</a>
              <button onClick={() => rename(c)} className="h-9 px-3 rounded-lg border border-white/15 text-white text-sm inline-flex items-center gap-2"><Pencil className="size-4" /> Edit name</button>
              <button onClick={() => patch(c.phone_number, { contacted: !c.contacted_at })} className={`h-9 px-3 rounded-lg text-sm inline-flex items-center gap-2 ${c.contacted_at ? "border border-emerald-400/40 text-emerald-300" : "bg-violet-400 text-navy font-semibold"}`}>
                <Check className="size-4" /> {c.contacted_at ? "Contacted" : "Mark contacted"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
