/** Ported from mobile's Subscription model getters (monthlyAmount, daysUntilRenewal). */
export function subscriptionMonthlyAmount(sub: { amount: number | string; frequency: "monthly" | "yearly" }): number {
  return sub.frequency === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
}

export function daysUntilRenewal(renewalDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const renewal = new Date(renewalDate);
  renewal.setHours(0, 0, 0, 0);
  return Math.round((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
