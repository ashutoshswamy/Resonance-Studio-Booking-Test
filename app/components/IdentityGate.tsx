"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { checkAutoLogin, getDeviceFingerprint } from "@/lib/deviceFingerprint";

type Identity = { phone: string; name: string };

const WHATSAPP_ONLY = "Please drop us a WhatsApp message (no calls) at the contact number above.";
const fmtPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

/**
 * Mobile + name gate (new device) or Correct / Not Correct (known device).
 * Renders the children once verified; `onVerified` also fires so callers can store the identity.
 */
export default function IdentityGate({
  onVerified,
  children,
}: {
  onVerified?: (who: Identity) => void;
  children: (who: Identity) => React.ReactNode;
}) {
  const [stage, setStage] = useState<"checking" | "known" | "mismatch" | "form" | "done">("checking");
  const [who, setWho] = useState<Identity | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAutoLogin().then((r) => {
      if (r.authenticated && r.user) {
        setWho({ phone: r.user.phone, name: r.user.name });
        setStage("known");
      } else setStage("form");
    });
  }, []);

  const finish = (identity: Identity) => {
    setWho(identity);
    setStage("done");
    onVerified?.(identity);
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const { fingerprint, deviceName } = await getDeviceFingerprint();
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: name.trim(), deviceFingerprint: fingerprint, deviceName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Unable to verify your details. Please try again.");
      finish({ phone, name: data.user?.name || name.trim() });
    } catch {
      setError("Unable to verify your details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (stage === "done" && who) return <>{children(who)}</>;

  const box = "mx-auto w-full max-w-md px-4 py-6";

  if (stage === "checking")
    return (
      <div className={`${box} flex justify-center`}>
        <Spinner className="size-6 text-primary" />
      </div>
    );

  if (stage === "known" && who)
    return (
      <div className={`${box} space-y-4`}>
        <h1 className="text-xl font-bold text-foreground">Please confirm your details</h1>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-foreground">
          <p className="text-lg font-semibold">{who.name}</p>
          <p className="text-base font-medium">+91 {fmtPhone(who.phone)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 h-11" onClick={() => setStage("mismatch")}>
            Not Correct
          </Button>
          <Button className="flex-1 h-11 font-semibold" onClick={() => finish(who)}>
            Correct
          </Button>
        </div>
      </div>
    );

  if (stage === "mismatch")
    return (
      <div className={`${box} space-y-4`}>
        <p className="text-base font-semibold text-foreground" role="alert">
          {WHATSAPP_ONLY}
        </p>
        <Button variant="secondary" className="h-11 w-full" onClick={() => setStage("known")}>
          Back
        </Button>
      </div>
    );

  const valid = phone.length === 10 && name.trim().length > 0;
  return (
    <form
      className={`${box} space-y-4`}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !busy) confirm();
      }}
    >
      <p className="text-base font-bold text-foreground">
        Please enter your correct active WhatsApp number and personal name (not a group or band name), as this will be
        used by us for all future WhatsApp communication.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="id-phone" className="text-base font-semibold">Mobile Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground" />
          <Input
            id="id-phone"
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={fmtPhone(phone)}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(d);
              setError("");
              if (d.length === 10) nameRef.current?.focus();
            }}
            placeholder="98765 43210"
            className="h-11 pl-10 text-base"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="id-name" className="text-base font-semibold">Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground" />
          <Input
            id="id-name"
            ref={nameRef}
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Your name"
            className="h-11 pl-10 text-base"
          />
        </div>
      </div>

      <p className="text-base font-semibold text-foreground">
        Once you confirm, these details will be locked. If you ever need to change your mobile number or name in the
        future, just drop us a WhatsApp message (no calls) at the contact number above.
      </p>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-base font-semibold text-foreground" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 h-11"
          onClick={() => {
            setPhone("");
            setName("");
            setError("");
            phoneRef.current?.focus();
          }}
        >
          Edit
        </Button>
        <Button type="submit" className="flex-1 h-11 font-semibold" disabled={!valid || busy}>
          {busy ? <Spinner /> : "Confirm"}
        </Button>
      </div>
    </form>
  );
}
