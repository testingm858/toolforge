// Password Generator — secure, uses crypto.getRandomValues

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean; // exclude 0, O, l, 1, I
}

const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  upperSafe: "ABCDEFGHJKLMNPQRSTUVWXYZ",   // no O, I
  lower: "abcdefghijklmnopqrstuvwxyz",
  lowerSafe: "abcdefghjkmnpqrstuvwxyz",     // no l
  numbers: "0123456789",
  numbersSafe: "23456789",                  // no 0, 1
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export function generatePassword(opts: PasswordOptions): string {
  if (!Number.isInteger(opts.length) || opts.length < 4 || opts.length > 128) {
    throw new Error("length must be an integer between 4 and 128");
  }

  let charset = "";
  if (opts.uppercase) charset += opts.excludeAmbiguous ? CHARS.upperSafe : CHARS.upper;
  if (opts.lowercase) charset += opts.excludeAmbiguous ? CHARS.lowerSafe : CHARS.lower;
  if (opts.numbers) charset += opts.excludeAmbiguous ? CHARS.numbersSafe : CHARS.numbers;
  if (opts.symbols) charset += CHARS.symbols;

  if (!charset) charset = CHARS.lower;

  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => charset[x % charset.length]).join("");
}

export function generatePasswords(opts: PasswordOptions, count: number): string[] {
  // Unbounded count is a real resource-exhaustion vector, not just a
  // hypothetical one — each password does its own crypto.getRandomValues
  // call, and confirmed count:100000 hung for 15s+ with no response.
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error("count must be an integer between 1 and 100");
  }
  return Array.from({ length: count }, () => generatePassword(opts));
}

export function scorePassword(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 4) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 6) return { score, label: "Good", color: "#3b82f6" };
  return { score, label: "Strong", color: "#22c55e" };
}
