// Loan / EMI Calculator — pure math

export interface LoanResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
  schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[];
}

export function calculateLoan(
  principal: number,    // loan amount
  annualRate: number,   // annual interest rate %
  tenureMonths: number  // loan tenure in months
): LoanResult {
  if (!Number.isFinite(principal) || principal <= 0) throw new Error("principal must be a positive number");
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new Error("rate must be a non-negative number");
  // An extreme tenure overflows Math.pow(1+r, tenureMonths) to Infinity,
  // turning the EMI formula into Infinity/Infinity — silently NaN, which
  // JSON-serializes as null. Confirmed: months:50000000 returned
  // {"emi":null,...} instead of an error. 1200 months (100 years) is
  // already far beyond any real loan/mortgage term.
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0 || tenureMonths > 1200) {
    throw new Error("months must be a whole number between 1 and 1200");
  }

  const r = annualRate / 12 / 100;
  let emi: number;

  if (r === 0) {
    emi = principal / tenureMonths;
  } else {
    emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  }

  emi = Math.round(emi * 100) / 100;
  const totalPayment = Math.round(emi * tenureMonths * 100) / 100;
  const totalInterest = Math.round((totalPayment - principal) * 100) / 100;

  // Amortization schedule (first 12 + last month)
  const schedule = [];
  let balance = principal;

  for (let m = 1; m <= tenureMonths; m++) {
    const interestPart = Math.round(balance * r * 100) / 100;
    const principalPart = Math.round((emi - interestPart) * 100) / 100;
    balance = Math.round((balance - principalPart) * 100) / 100;
    if (m <= 12 || m === tenureMonths) {
      schedule.push({ month: m, emi, principal: principalPart, interest: interestPart, balance: Math.max(0, balance) });
    }
  }

  return { emi, totalPayment, totalInterest, principal, schedule };
}

export function calculateMortgage(
  homePrice: number,
  downPaymentPct: number,
  annualRate: number,
  tenureYears: number
): LoanResult & { downPayment: number; loanAmount: number } {
  if (!Number.isFinite(homePrice) || homePrice <= 0) throw new Error("homePrice must be a positive number");
  if (!Number.isFinite(downPaymentPct) || downPaymentPct < 0 || downPaymentPct >= 100) throw new Error("downPaymentPct must be between 0 and 100");
  if (!Number.isFinite(tenureYears) || tenureYears <= 0) throw new Error("years must be a positive number");

  const downPayment = (homePrice * downPaymentPct) / 100;
  const loanAmount = homePrice - downPayment;
  // Round to the nearest whole month — calculateLoan requires an integer
  // tenure, but fractional years (e.g. 30.5) are a legitimate input here.
  const result = calculateLoan(loanAmount, annualRate, Math.round(tenureYears * 12));
  return { ...result, downPayment, loanAmount };
}
