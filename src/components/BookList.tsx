import type { Book } from '../types'

interface BookListProps {
  books: Book[]
  onDelete: (id: string) => void
}

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

export default function BookList({ books, onDelete }: BookListProps) {
  if (books.length === 0) {
    return <p className="empty-state">Ainda não registaste nenhum livro.</p>
  }

  const total = books.reduce((sum, book) => sum + book.price, 0)

  return (
    <>
      <ul className="book-list">
        {books.map((book) => (
          <li key={book.id} className="book-card">
            <div className="book-info">
              <div className="book-title">{book.title}</div>
              <div className="book-meta">
                {book.publisher} · {book.year}
              </div>
            </div>
            <div className="book-side">
              <span className="book-price">
                {currencyFormatter.format(book.price)}
              </span>
              <button
                type="button"
                className="book-delete"
                aria-label={`Remover ${book.title}`}
                onClick={() => onDelete(book.id)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="total">
        Total: <strong>{currencyFormatter.format(total)}</strong>
      </p>
    </>
  )
}
