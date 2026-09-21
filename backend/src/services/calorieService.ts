import type { ActivityLevel, Goal, Sex } from "@prisma/client";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_CALORIE_ADJUSTMENT: Record<Goal, number> = {
  LOSE: -500,
  MAINTAIN: 0,
  GAIN: 500,
};

const PROTEIN_G_PER_KG = 1.8;
const FAT_CALORIE_SHARE = 0.25;

export interface GoalInput {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface CalculatedGoals {
  dailyCalorieGoal: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatGoalG: number;
}

// Mifflin-St Jeor equation.
function calculateBmr({ age, sex, weightKg, heightCm }: GoalInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "MALE" ? base + 5 : base - 161;
}

export function calculateGoals(input: GoalInput): CalculatedGoals {
  const bmr = calculateBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const dailyCalorieGoal = Math.round(tdee + GOAL_CALORIE_ADJUSTMENT[input.goal]);

  const proteinGoalG = Math.round(input.weightKg * PROTEIN_G_PER_KG);
  const fatGoalG = Math.round((dailyCalorieGoal * FAT_CALORIE_SHARE) / 9);
  const remainingCalories = dailyCalorieGoal - proteinGoalG * 4 - fatGoalG * 9;
  const carbsGoalG = Math.max(0, Math.round(remainingCalories / 4));

  return { dailyCalorieGoal, proteinGoalG, carbsGoalG, fatGoalG };
}
