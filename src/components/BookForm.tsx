import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NewBook } from '../types'

const currentYear = new Date().getFullYear()

interface BookFormProps {
  onAdd: (book: NewBook) => Promise<string | null>
}

export default function BookForm({ onAdd }: BookFormProps) {
  const [title, setTitle] = useState('')
  const [publisher, setPublisher] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsedYear = Number(year)
    const parsedPrice = Number(price)

    if (!title.trim() || !publisher.trim()) {
      setError('Indica o nome do livro e a editora.')
      return
    }
    if (!Number.isInteger(parsedYear)) {
      setError('Ano inválido.')
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
      year: parsedYear,
      price: parsedPrice,
    })
    setSaving(false)

    if (errorMessage) {
      setError(errorMessage)
      return
    }

    setTitle('')
    setPublisher('')
    setYear(String(currentYear))
    setPrice('')
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
          <label htmlFor="year">Ano</label>
          <input
            id="year"
            type="number"
            inputMode="numeric"
            required
            value={year}
            onChange={(e) => setYear(e.target.value)}
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

      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'A adicionar...' : 'Adicionar livro'}
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  )
}
