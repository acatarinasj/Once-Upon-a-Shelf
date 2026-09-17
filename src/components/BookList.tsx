import { useState } from 'react'
import type { Book, NewBook } from '../types'
import { groupBooksByPublisher } from '../lib/groupBooks'
import BookForm from './BookForm'

interface BookListProps {
  books: Book[]
  stands: Record<string, string>
  selectedIds: Set<string>
  onDelete: (id: string) => void
  onUpdateStand: (publisher: string, stand: string) => Promise<string | null>
  onToggleSelected: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onUpdateDiscount: (id: string, discount: number) => Promise<string | null>
  onUpdateBook: (id: string, book: NewBook) => Promise<string | null>
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

interface DiscountInputProps {
  book: Book
  onUpdateDiscount: (id: string, discount: number) => Promise<string | null>
}

function DiscountInput({ book, onUpdateDiscount }: DiscountInputProps) {
  const [draft, setDraft] = useState(book.discount ? String(book.discount) : '')
  const [saving, setSaving] = useState(false)

  async function commit() {
    const trimmed = draft.trim()
    const parsed = trimmed === '' ? 0 : Number(trimmed)

    if (Number.isNaN(parsed) || parsed < 0) {
      setDraft(book.discount ? String(book.discount) : '')
      return
    }
    if (parsed === book.discount) return

    setSaving(true)
    const error = await onUpdateDiscount(book.id, parsed)
    setSaving(false)
    if (error) setDraft(book.discount ? String(book.discount) : '')
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      min="0"
      className="discount-input"
      placeholder="Desconto"
      value={draft}
      disabled={saving}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      aria-label={`Desconto de ${book.title}`}
    />
  )
}

export default function BookList({
  books,
  stands,
  selectedIds,
  onDelete,
  onUpdateStand,
  onToggleSelected,
  onToggleFavorite,
  onUpdateDiscount,
  onUpdateBook,
}: BookListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (books.length === 0) {
    return <p className="empty-state">Nenhum livro corresponde a este filtro.</p>
  }

  const selectedBooks = books.filter((book) => selectedIds.has(book.id))
  const totalPrice = selectedBooks.reduce((sum, book) => sum + book.price, 0)
  const totalDiscount = selectedBooks.reduce((sum, book) => sum + book.discount, 0)
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

              if (editingId === book.id) {
                return (
                  <li key={book.id}>
                    <BookForm
                      initialValues={book}
                      submitLabel="Guardar"
                      onCancel={() => setEditingId(null)}
                      onSubmit={async (updatedBook) => {
                        const error = await onUpdateBook(book.id, updatedBook)
                        if (!error) setEditingId(null)
                        return error
                      }}
                    />
                  </li>
                )
              }

              return (
                <li
                  key={book.id}
                  className={`book-card category-${book.category}`}
                >
                  <div className="book-top-row">
                    <input
                      type="checkbox"
                      className="book-select"
                      checked={selectedIds.has(book.id)}
                      onChange={() => onToggleSelected(book.id)}
                      aria-label={`Incluir ${book.title} nos totais`}
                    />
                    <button
                      type="button"
                      className={`book-favorite${book.is_favorite ? ' active' : ''}`}
                      onClick={() => onToggleFavorite(book.id, !book.is_favorite)}
                      aria-label={
                        book.is_favorite
                          ? `Remover ${book.title} dos favoritos`
                          : `Adicionar ${book.title} aos favoritos`
                      }
                    >
                      {book.is_favorite ? '★' : '☆'}
                    </button>
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
                    <div className="book-actions">
                      <button
                        type="button"
                        className="book-edit"
                        aria-label={`Editar ${book.title}`}
                        onClick={() => setEditingId(book.id)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="book-delete"
                        aria-label={`Remover ${book.title}`}
                        onClick={() => onDelete(book.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="book-bottom-row">
                    <span className="book-price">
                      {currencyFormatter.format(book.price)}
                    </span>
                    <DiscountInput
                      key={book.discount}
                      book={book}
                      onUpdateDiscount={onUpdateDiscount}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <p className="total">
        Total: <strong>{currencyFormatter.format(totalPrice)}</strong>
      </p>
      <p className="total">
        Total de descontos: <strong>{currencyFormatter.format(totalDiscount)}</strong>
      </p>
    </>
  )
}
