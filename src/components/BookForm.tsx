import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NewBook } from '../types'

const currentYearMonth = new Date().toISOString().slice(0, 7)

interface BookFormProps {
  onAdd: (book: NewBook) => Promise<string | null>
}

export default function BookForm({ onAdd }: BookFormProps) {
  const [title, setTitle] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedMonth, setPublishedMonth] = useState(currentYearMonth)
  const [price, setPrice] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsedPrice = Number(price)

    if (!title.trim() || !publisher.trim()) {
      setError('Indica o nome do livro e a editora.')
      return
    }
    if (!/^\d{4}-\d{2}$/.test(publishedMonth)) {
      setError('Mês de publicação inválido.')
      return
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Preço inválido.')
      return
    }

    setSaving(true)
    const errorMessage = await onAdd({
      title: title.trim(),
      publisher: publisher.trim(),
      published_month: `${publishedMonth}-01`,
      price: parsedPrice,
      link: link.trim() || null,
    })
    setSaving(false)

    if (errorMessage) {
      setError(errorMessage)
      return
    }

    setTitle('')
    setPublisher('')
    setPublishedMonth(currentYearMonth)
    setPrice('')
    setLink('')
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">Nome do livro</label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="publisher">Editora</label>
        <input
          id="publisher"
          type="text"
          required
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="published-month">Mês de publicação</label>
          <input
            id="published-month"
            type="month"
            required
            value={publishedMonth}
            onChange={(e) => setPublishedMonth(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="price">Preço (€)</label>
          <input
            id="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="link">Link (opcional)</label>
        <input
          id="link"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'A adicionar...' : 'Adicionar livro'}
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  )
}
