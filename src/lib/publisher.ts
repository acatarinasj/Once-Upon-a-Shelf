export function normalizePublisherKey(publisher: string): string {
  return publisher.trim().toLocaleLowerCase('pt')
}
