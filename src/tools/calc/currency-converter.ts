// Currency Converter — Frankfurter (frankfurter.dev), a free, open-source
// exchange-rate API backed by the European Central Bank's daily reference
// rates. No API key, no published rate limit, explicitly free for
// commercial use (self-hostable too, per its GitHub project) — unlike
// ip-api.com-style services that restrict their free tier to non-commercial
// use.
//
// ECB publishes daily reference rates for 30 major currencies — smaller or
// exotic currencies (many African, Caribbean, or pegged currencies) aren't
// available through this free, no-key source.

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

// Frankfurter's fixed set of 30 ECB-published currencies — kept in sync by
// hand with the "From"/"To" select options in text-tool-fields.ts (which
// can't import this file directly since it's also loaded client-side and
// this module is server-only). Validated up front so a bogus code that
// happens to match itself (from === to === "XYZ") can't slip past the
// same-currency shortcut below and return a fake 1:1 "conversion" for a
// currency that doesn't exist — confirmed this was possible before adding
// this check.
const SUPPORTED_CURRENCIES = new Set([
  "AUD", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD",
  "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK",
  "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
]);

export interface CurrencyConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  result: number;
  date: string;
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<CurrencyConversionResult> {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Amount must be a positive number");
  const fromCode = from?.trim().toUpperCase();
  const toCode = to?.trim().toUpperCase();
  if (!fromCode || !toCode) throw new Error("Both a source and target currency are required");
  if (!SUPPORTED_CURRENCIES.has(fromCode)) throw new Error(`Unsupported currency code: "${fromCode}"`);
  if (!SUPPORTED_CURRENCIES.has(toCode)) throw new Error(`Unsupported currency code: "${toCode}"`);

  // Frankfurter's API 422s on identical from/to pairs instead of returning
  // rate 1 — short-circuit rather than surfacing that as an error. Must come
  // AFTER the SUPPORTED_CURRENCIES check above, not before.
  if (fromCode === toCode) {
    return { amount, from: fromCode, to: toCode, rate: 1, result: amount, date: new Date().toISOString().slice(0, 10) };
  }

  let res: Response;
  try {
    res = await fetch(`${FRANKFURTER_BASE}/latest?from=${fromCode}&to=${toCode}`, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new Error("Could not reach the exchange rate service. Please try again.");
  }
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Unsupported currency code: "${fromCode}" or "${toCode}"`);
    throw new Error(`Exchange rate lookup failed (${res.status})`);
  }

  let data: { rates?: Record<string, number>; date?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error("The exchange rate service returned an unreadable response. Please try again.");
  }
  const rate = data.rates?.[toCode];
  if (typeof rate !== "number") throw new Error(`Unsupported currency code: "${toCode}"`);

  return { amount, from: fromCode, to: toCode, rate, result: amount * rate, date: data.date ?? new Date().toISOString().slice(0, 10) };
}
