import { useState } from 'react'
import type { Book } from '../types'
import { groupBooksByPublisher } from '../lib/groupBooks'

interface BookListProps {
  books: Book[]
  stands: Record<string, string>
  onDelete: (id: string) => void
  onUpdateStand: (publisher: string, stand: string) => Promise<string | null>
}

const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

const STALE_MONTHS = 24

const CATEGORY_LABELS = {
  adulto: 'Adulto',
  crianca: 'Criança',
} as const

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

interface StandInputProps {
  publisher: string
  value: string
  onUpdateStand: (publisher: string, stand: string) => Promise<string | null>
}

function StandInput({ publisher, value, onUpdateStand }: StandInputProps) {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  async function commit() {
    if (draft === value) return
    setSaving(true)
    const error = await onUpdateStand(publisher, draft.trim())
    setSaving(false)
    if (error) setDraft(value)
  }

  return (
    <input
      type="text"
      className="stand-input"
      placeholder="Stand"
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      aria-label={`Stand da editora ${publisher}`}
    />
  )
}

export default function BookList({
  books,
  stands,
  onDelete,
  onUpdateStand,
}: BookListProps) {
  if (books.length === 0) {
    return <p className="empty-state">Ainda não registaste nenhum livro.</p>
  }

  const total = books.reduce((sum, book) => sum + book.price, 0)
  const groups = groupBooksByPublisher(books, stands)

  return (
    <>
      {groups.map((group) => (
        <div key={group.standKey} className="publisher-group">
          <div className="publisher-heading-row">
            <h2 className="publisher-heading">{group.publisher}</h2>
            <StandInput
              key={stands[group.standKey] ?? ''}
              publisher={group.publisher}
              value={stands[group.standKey] ?? ''}
              onUpdateStand={onUpdateStand}
            />
          </div>
          <ul className="book-list">
            {group.books.map((book) => {
              const isStale =
                monthsSincePublished(book.published_month) > STALE_MONTHS

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
                      {formatMonthYear(book.published_month)} ·{' '}
                      {CATEGORY_LABELS[book.category]}
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
        </div>
      ))}
      <p className="total">
        Total: <strong>{currencyFormatter.format(total)}</strong>
      </p>
    </>
  )
}
