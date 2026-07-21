// BMI Calculator — pure math

export type Unit = "metric" | "imperial";

export interface BmiResult {
  bmi: number;
  category: string;
  color: string;
  healthyWeightRange: { min: number; max: number };
  unit: Unit;
}

export function calculateBMI(
  weight: number,  // kg or lbs
  height: number,  // cm or inches
  unit: Unit = "metric"
): BmiResult {
  if (!Number.isFinite(weight) || weight <= 0) throw new Error("weight must be a positive number");
  if (!Number.isFinite(height) || height <= 0) throw new Error("height must be a positive number");

  let bmi: number;
  let heightM: number;

  if (unit === "metric") {
    heightM = height / 100;
    bmi = weight / (heightM * heightM);
  } else {
    // Imperial: lbs and inches
    bmi = (703 * weight) / (height * height);
    heightM = height * 0.0254;
  }

  bmi = Math.round(bmi * 10) / 10;

  const minWeightKg = 18.5 * heightM * heightM;
  const maxWeightKg = 24.9 * heightM * heightM;

  let category: string, color: string;
  if (bmi < 18.5)       { category = "Underweight"; color = "#3b82f6"; }
  else if (bmi < 25)    { category = "Normal weight"; color = "#22c55e"; }
  else if (bmi < 30)    { category = "Overweight"; color = "#f59e0b"; }
  else                  { category = "Obese"; color = "#ef4444"; }

  const toDisplay = (kg: number) =>
    unit === "metric" ? Math.round(kg * 10) / 10 : Math.round(kg * 2.205 * 10) / 10;

  return {
    bmi,
    category,
    color,
    healthyWeightRange: { min: toDisplay(minWeightKg), max: toDisplay(maxWeightKg) },
    unit,
  };
}
