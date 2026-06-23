export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;

  return digits;
}

export function isValidIndonesianPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  return /^628[1-9]\d{6,10}$/.test(normalized);
}
