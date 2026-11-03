// Single source for every WhatsApp text the admin/staff panels send. No cashback, no email.
import { addDaysYMD } from "./ist";

export type WaBooking = {
  studio: string;
  session_type?: string | null;
  session_details?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  total_amount?: number | null;
};

const BRANCH = "Resonance Studio, Sinhgad Road Branch";
const HOW_TO_CHANGE = "To change or cancel your booking, please send us a WhatsApp message only, no calls).";

const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const ordinal = (d: number) => (d > 3 && d < 21 ? "th" : ["th", "st", "nd", "rd"][d % 10] || "th");

// "2026-10-26" -> d=26, "October 2026", "Monday"
function parts(ymd: string) {
  const dt = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
  const d = dt.getUTCDate();
  const monthYear = dt.toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
  const weekday = dt.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "long" });
  return { d, monthYear, weekday };
}

/** "26th October 2026" */
export const dateShort = (ymd: string) => {
  const { d, monthYear } = parts(ymd);
  return `${d}${ordinal(d)} ${monthYear}`;
};
/** "Monday, 26th October 2026" */
export const dateLong = (ymd: string) => `${parts(ymd).weekday}, ${dateShort(ymd)}`;

const hours = (b: WaBooking) => {
  const [sh, sm] = b.start_time.split(":").map(Number);
  const [eh, em] = b.end_time.split(":").map(Number);
  const h = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

/** "Studio C (Karaoke, 1–12 participants)" */
export function sessionLabel(b: WaBooking) {
  const type = b.session_type === "Band" ? "College Student Band" : b.session_type || "Session";
  const det = b.session_details && b.session_details !== b.session_type ? b.session_details.replace(/(\d)\s*-\s*(\d)/, "$1–$2") : "";
  return `${b.studio} (${[type, det].filter(Boolean).join(", ")})`;
}

const when = (b: WaBooking) =>
  `${dateLong(b.date)}, from ${time12(b.start_time)} to ${time12(b.end_time)} (${hours(b)} hrs)`;
const pay = (b: WaBooking) => `Please pay ₹${(b.total_amount || 0).toLocaleString("en-IN")}/- upon completion of your session.`;

/** Free until D-4, 50% D-3..D-1, 100% on the day / no-show. */
function policy(date: string) {
  const d = date.slice(0, 10);
  const from = parts(addDaysYMD(d, -3));
  return `Cancellation / Rescheduling Policy:
Free: Up to ${dateShort(addDaysYMD(d, -4))} (11:59 PM)
50% Charge: ${from.d}${ordinal(from.d)} ${from.monthYear.split(" ")[0]} to ${dateShort(addDaysYMD(d, -1))} (11:59 PM)
100% Charge: On ${dateShort(d)} or for a No-Show`;
}

export function confirmationMessage(b: WaBooking) {
  return `Your booking for ${sessionLabel(b)} at ${BRANCH} on ${when(b)} is confirmed. ${pay(b)}

${policy(b.date)}

${HOW_TO_CHANGE}`;
}

export function changeMessage(b: WaBooking) {
  return `Your booking has been changed. Your updated booking is for ${sessionLabel(b)} at ${BRANCH} on ${when(b)}. ${pay(b)}

${policy(b.date)}

${HOW_TO_CHANGE}`;
}

export function cancellationMessage(b: WaBooking) {
  return `Your booking for ${sessionLabel(b)} at ${BRANCH} on ${when(b)} has been cancelled.

To make a new booking, please visit our website.`;
}

export function reminderMessage(b: WaBooking) {
  return `You have an upcoming booking for ${sessionLabel(b)} at ${BRANCH} on ${when(b)}. ${pay(b)}`;
}
