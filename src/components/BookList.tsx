import type { Book } from '../types'

interface BookListProps {
  books: Book[]
  onDelete: (id: string) => void
}

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

const STALE_MONTHS = 24

function monthsSincePublished(publishedMonth: string): number {
  const [year, month] = publishedMonth.slice(0, 7).split('-').map(Number)
  const now = new Date()
  return (
    (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  )
}

function formatMonthYear(publishedMonth: string): string {
  const [year, month] = publishedMonth.slice(0, 7).split('-').map(Number)
  return `${String(month).padStart(2, '0')}/${year}`
}

export default function BookList({ books, onDelete }: BookListProps) {
  if (books.length === 0) {
    return <p className="empty-state">Ainda não registaste nenhum livro.</p>
  }

  const total = books.reduce((sum, book) => sum + book.price, 0)

  return (
    <>
      <ul className="book-list">
        {books.map((book) => {
          const isStale = monthsSincePublished(book.published_month) > STALE_MONTHS

          return (
            <li key={book.id} className="book-card">
              <div className="book-info">
                <div className="book-title-row">
                  {isStale && (
                    <span
                      className="stale-dot"
                      title={`Publicado há mais de ${STALE_MONTHS} meses`}
                    />
                  )}
                  {book.link ? (
                    <a
                      className="book-title book-title-link"
                      href={book.link}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {book.title}
                    </a>
                  ) : (
                    <div className="book-title">{book.title}</div>
                  )}
                </div>
                <div className="book-meta">
                  {book.publisher} · {formatMonthYear(book.published_month)}
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
          )
        })}
      </ul>
      <p className="total">
        Total: <strong>{currencyFormatter.format(total)}</strong>
      </p>
    </>
  )
}
