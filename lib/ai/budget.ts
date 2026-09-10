import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getMonthlyUsageEur(userId: string): Promise<number> {
  const result = await db.aIUsageLog.aggregate({
    where: { userId, createdAt: { gte: startOfCurrentMonth() } },
    _sum: { estimatedCostEur: true },
  });
  return result._sum.estimatedCostEur?.toNumber() ?? 0;
}

export async function assertWithinBudget(userId: string): Promise<void> {
  const used = await getMonthlyUsageEur(userId);
  if (used >= env.AI_MONTHLY_BUDGET_EUR) {
    throw new AppError(
      "FORBIDDEN",
      "Dein monatliches KI-Budget ist aufgebraucht. Versuche es nächsten Monat erneut.",
    );
  }
}
