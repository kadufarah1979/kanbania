/** Format large numbers: 1200 → "1.2K", 1500000 → "1.5M" */
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

/** Compute moving average for token trend charts */
export function movingAvg(data: { date: string; tokens: number }[], window: number) {
  return data.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = Math.round(slice.reduce((s, x) => s + x.tokens, 0) / slice.length);
    return { ...d, avg };
  });
}
