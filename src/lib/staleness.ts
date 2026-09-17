export const STALE_MONTHS = 24

export function monthsSincePublished(publishedMonth: string): number {
  const [year, month] = publishedMonth.slice(0, 7).split('-').map(Number)
  const now = new Date()
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
}

export function isStale(publishedMonth: string): boolean {
  return monthsSincePublished(publishedMonth) > STALE_MONTHS
}
