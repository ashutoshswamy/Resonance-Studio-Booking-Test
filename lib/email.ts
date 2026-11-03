// ponytail: email removed on purpose (WhatsApp is the only channel now). Stubs keep
// the old call sites compiling; nothing is ever sent. Delete callers + this file when convenient.
type Result = { success: false; error: string };
const off = async (..._args: unknown[]): Promise<Result> => ({ success: false, error: 'Email disabled' });

export const sendBookingConfirmationEmail = off;
export const sendAdminBookingConfirmationEmail = off;
export const sendBookingUpdateEmail = off;
export const sendBookingCancellationEmail = off;
