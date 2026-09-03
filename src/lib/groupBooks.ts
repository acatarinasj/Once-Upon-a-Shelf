import type { Book, Category } from '../types'

export interface PublisherGroup {
  category: Category
  publisher: string
  books: Book[]
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, 'pt', { numeric: true, sensitivity: 'base' })
}

export function groupBooksByPublisher(
  books: Book[],
  stands: Record<string, string>,
): PublisherGroup[] {
  const map = new Map<string, PublisherGroup>()

  for (const book of books) {
    const key = `${book.category}|${book.publisher}`
    const group = map.get(key)
    if (group) {
      group.books.push(book)
    } else {
      map.set(key, {
        category: book.category,
        publisher: book.publisher,
        books: [book],
      })
    }
  }

  const groups = Array.from(map.values())
  for (const group of groups) {
    group.books.sort((a, b) => a.published_month.localeCompare(b.published_month))
  }

  groups.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)

    const standA = stands[a.publisher]
    const standB = stands[b.publisher]
    if (standA && standB) return naturalCompare(standA, standB)
    if (standA) return -1
    if (standB) return 1
    return naturalCompare(a.publisher, b.publisher)
  })

  return groups
}
