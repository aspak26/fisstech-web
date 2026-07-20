/** Builds a `wa.me` deep link — same idea as mobile's `whatsapp://send`
 * launch, but web-friendly (opens WhatsApp Web or the app). No backend
 * involved, so this is safe to port as-is. */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("90")
    ? digits
    : digits.startsWith("0")
      ? `90${digits.slice(1)}`
      : `90${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
