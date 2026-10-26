import { z } from "zod";

// What we need to send a cash payout. Checked in the form and again on the server.
export const UPI_ID = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
export const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER = /^[0-9]{9,18}$/;

export const PayoutDetails = z.discriminatedUnion("method", [
  z.object({ method: z.literal("credits") }),
  z.object({ method: z.literal("upi"), upiId: z.string().trim().regex(UPI_ID, "Enter a valid UPI ID, like name@bank.") }),
  z.object({
    method: z.literal("bank"),
    holder: z.string().trim().min(2, "Enter the name on the account.").max(100),
    accountNumber: z.string().trim().regex(ACCOUNT_NUMBER, "The account number should be 9 to 18 digits."),
    ifsc: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(IFSC, "The IFSC should be 4 letters, a 0, then 6 letters or digits.")),
    bankName: z.string().trim().max(100).optional(),
  }),
  z.object({ method: z.literal("wise"), email: z.string().trim().email("Enter the email on your Wise account.").max(200) }),
]);
export type PayoutDetails = z.infer<typeof PayoutDetails>;

/** One line the owner reads in admin to know where to send the money. Empty for credits. */
export function destinationOf(d: PayoutDetails): string {
  switch (d.method) {
    case "credits":
      return "";
    case "upi":
      return d.upiId;
    case "wise":
      return d.email;
    case "bank":
      return [d.holder, `A/C ${d.accountNumber}`, `IFSC ${d.ifsc}`, d.bankName].filter(Boolean).join(" | ");
  }
}
