const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPaise(value: string | bigint): string {
  const paise = typeof value === 'bigint' ? value : BigInt(value);
  return INR_FORMATTER.format(Number(paise) / 100);
}

export function reviewCostPaise(
  falsePositiveCount: number,
  reviewMinutes: number,
  analystHourlyRatePaise: string,
): bigint {
  const minutes = BigInt(Math.round(reviewMinutes * 100));
  const hourlyRate = BigInt(analystHourlyRatePaise);
  return (BigInt(falsePositiveCount) * minutes * hourlyRate) / 6000n;
}
