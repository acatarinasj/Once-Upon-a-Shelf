import type { Book } from '../types'

const CATEGORY_LABELS: Record<string, string> = {
  adulto: 'Adulto',
  crianca: 'Criança',
}

function formatMonthYear(publishedMonth: string): string {
  const [year, month] = publishedMonth.slice(0, 7).split('-').map(Number)
  return `${String(month).padStart(2, '0')}/${year}`
}

export async function exportBooksToExcel(
  books: Book[],
  stands: Record<string, string>,
) {
  const XLSX = await import('xlsx')

  const rows = books.map((book) => ({
    Categoria: CATEGORY_LABELS[book.category] ?? book.category,
    Editora: book.publisher,
    Stand: stands[book.publisher] ?? '',
    Livro: book.title,
    Publicação: formatMonthYear(book.published_month),
    'Preço (€)': book.price,
    Link: book.link ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Livros')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `once-upon-a-shelf-${today}.xlsx`)
}
