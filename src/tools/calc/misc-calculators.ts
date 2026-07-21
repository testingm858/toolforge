// Pure-math calculators — no external data/API required.

function assertPositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
}
function assertNonNegative(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
}

// ─── Age ──────────────────────────────────────────────────────────────────────
export function calculateAge(birthDate: string, asOf?: string): { years: number; months: number; days: number; totalDays: number } {
  const start = new Date(birthDate);
  if (isNaN(start.getTime())) throw new Error("birthDate must be a valid date (YYYY-MM-DD)");
  const end = asOf ? new Date(asOf) : new Date();
  if (end < start) throw new Error("asOf date must be after birthDate");

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return { years, months, days, totalDays };
}

// ─── GST / VAT ────────────────────────────────────────────────────────────────
export function calculateGst(amount: number, rate: number, mode: "exclusive" | "inclusive" = "exclusive") {
  assertPositive("amount", amount);
  assertNonNegative("rate", rate);
  if (mode === "exclusive") {
    const gst = Math.round(amount * (rate / 100) * 100) / 100;
    return { baseAmount: amount, gst, total: Math.round((amount + gst) * 100) / 100, rate, mode };
  }
  const baseAmount = Math.round((amount / (1 + rate / 100)) * 100) / 100;
  const gst = Math.round((amount - baseAmount) * 100) / 100;
  return { baseAmount, gst, total: amount, rate, mode };
}

// ─── Profit margin ───────────────────────────────────────────────────────────
export function calculateProfitMargin(revenue: number, cost: number) {
  assertPositive("revenue", revenue);
  assertNonNegative("cost", cost);
  const profit = Math.round((revenue - cost) * 100) / 100;
  const margin = Math.round((profit / revenue) * 10000) / 100;
  const markup = cost > 0 ? Math.round((profit / cost) * 10000) / 100 : null;
  return { revenue, cost, profit, marginPct: margin, markupPct: markup };
}

// ─── Percentage ───────────────────────────────────────────────────────────────
export function calculatePercentage(op: "of" | "change" | "whatPercent", a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("a and b must be numbers");
  if (op === "of") return { op, a, b, result: Math.round(((a / 100) * b) * 100) / 100, description: `${a}% of ${b}` };
  if (op === "change") {
    if (a === 0) throw new Error("a (starting value) must not be 0 for percent change");
    const change = Math.round(((b - a) / Math.abs(a)) * 10000) / 100;
    return { op, a, b, result: change, description: `change from ${a} to ${b}` };
  }
  if (op === "whatPercent") {
    if (b === 0) throw new Error("b must not be 0");
    return { op, a, b, result: Math.round((a / b) * 10000) / 100, description: `${a} is what % of ${b}` };
  }
  throw new Error('op must be "of", "change", or "whatPercent"');
}

// ─── Pregnancy ────────────────────────────────────────────────────────────────
export function calculatePregnancy(lastPeriodDate: string) {
  const lmp = new Date(lastPeriodDate);
  if (isNaN(lmp.getTime())) throw new Error("lastPeriodDate must be a valid date (YYYY-MM-DD)");
  const dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysPregnant = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
  const weeksPregnant = Math.floor(daysPregnant / 7);
  const daysRemainder = daysPregnant % 7;
  let trimester = 1;
  if (weeksPregnant >= 27) trimester = 3;
  else if (weeksPregnant >= 13) trimester = 2;
  return {
    dueDate: dueDate.toISOString().split("T")[0],
    weeksPregnant: Math.max(0, weeksPregnant),
    daysRemainder: Math.max(0, daysRemainder),
    trimester,
  };
}

// ─── Calorie needs (Mifflin-St Jeor) ───────────────────────────────────────────
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
};

export function calculateBmr(weightKg: number, heightCm: number, age: number, sex: "male" | "female") {
  assertPositive("weightKg", weightKg);
  assertPositive("heightCm", heightCm);
  assertPositive("age", age);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = Math.round(sex === "male" ? base + 5 : base - 161);
  return { bmr, weightKg, heightCm, age, sex };
}

export function calculateCalories(weightKg: number, heightCm: number, age: number, sex: "male" | "female", activityLevel: keyof typeof ACTIVITY_MULTIPLIERS) {
  const { bmr } = calculateBmr(weightKg, heightCm, age, sex);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!multiplier) throw new Error(`activityLevel must be one of: ${Object.keys(ACTIVITY_MULTIPLIERS).join(", ")}`);
  const maintenance = Math.round(bmr * multiplier);
  return {
    bmr,
    maintenanceCalories: maintenance,
    mildLoss: Math.round(maintenance - 250),
    weightLoss: Math.round(maintenance - 500),
    mildGain: Math.round(maintenance + 250),
    weightGain: Math.round(maintenance + 500),
  };
}

// ─── Fuel cost ────────────────────────────────────────────────────────────────
export function calculateFuelCost(distanceKm: number, fuelEfficiencyKmPerL: number, pricePerLiter: number) {
  assertPositive("distanceKm", distanceKm);
  assertPositive("fuelEfficiencyKmPerL", fuelEfficiencyKmPerL);
  assertPositive("pricePerLiter", pricePerLiter);
  const litersNeeded = Math.round((distanceKm / fuelEfficiencyKmPerL) * 100) / 100;
  const totalCost = Math.round(litersNeeded * pricePerLiter * 100) / 100;
  return { distanceKm, litersNeeded, totalCost, costPerKm: Math.round((totalCost / distanceKm) * 100) / 100 };
}

// ─── ROI ──────────────────────────────────────────────────────────────────────
export function calculateRoi(gain: number, cost: number) {
  assertNonNegative("gain", gain);
  assertPositive("cost", cost);
  const netProfit = Math.round((gain - cost) * 100) / 100;
  const roiPct = Math.round((netProfit / cost) * 10000) / 100;
  return { gain, cost, netProfit, roiPct };
}

// ─── SaaS MRR / ARR ───────────────────────────────────────────────────────────
export function calculateMrr(customers: { plan: number; count: number }[], churnedMrr = 0, newMrr = 0) {
  if (!Array.isArray(customers) || customers.length === 0) throw new Error("customers must be a non-empty array of { plan, count }");
  for (const c of customers) {
    if (!Number.isFinite(c?.plan) || !Number.isFinite(c?.count)) {
      throw new Error("Every customer entry needs numeric plan and count, e.g. { \"plan\": 29, \"count\": 10 }");
    }
  }
  const mrr = Math.round(customers.reduce((sum, c) => sum + c.plan * c.count, 0) * 100) / 100;
  const arr = Math.round(mrr * 12 * 100) / 100;
  const netNewMrr = Math.round((newMrr - churnedMrr) * 100) / 100;
  return { mrr, arr, netNewMrr, churnedMrr, newMrr };
}

// ─── Meeting cost ─────────────────────────────────────────────────────────────
export function calculateMeetingCost(attendees: number, avgHourlySalary: number, durationMinutes: number) {
  assertPositive("attendees", attendees);
  assertPositive("avgHourlySalary", avgHourlySalary);
  assertPositive("durationMinutes", durationMinutes);
  const cost = Math.round(attendees * avgHourlySalary * (durationMinutes / 60) * 100) / 100;
  return { attendees, durationMinutes, cost, costPerMinute: Math.round((cost / durationMinutes) * 100) / 100 };
}

// ─── Timezone (no external API — uses Intl with IANA zone names) ──────────────
export function convertTimezone(dateTimeIso: string, fromZone: string, toZone: string) {
  const date = new Date(dateTimeIso);
  if (isNaN(date.getTime())) throw new Error("dateTimeIso must be a valid ISO datetime, e.g. 2026-07-15T14:00:00");
  const format = (zone: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).format(date);
    } catch {
      throw new Error(`Unknown IANA timezone "${zone}", e.g. "America/New_York"`);
    }
  };
  return { input: dateTimeIso, fromZone, toZone, fromLocal: format(fromZone), toLocal: format(toZone) };
}
