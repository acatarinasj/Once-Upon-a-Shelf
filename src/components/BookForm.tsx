import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category, NewBook } from '../types'

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const now = new Date()
const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
const currentYear = String(now.getFullYear())

interface BookFormProps {
  onAdd: (book: NewBook) => Promise<string | null>
}

export default function BookForm({ onAdd }: BookFormProps) {
  const [title, setTitle] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedMonth, setPublishedMonth] = useState(currentMonth)
  const [publishedYear, setPublishedYear] = useState(currentYear)
  const [category, setCategory] = useState<Category>('adulto')
  const [price, setPrice] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsedYear = Number(publishedYear)
    const parsedPrice = Number(price)

    if (!title.trim() || !publisher.trim()) {
      setError('Indica o nome do livro e a editora.')
      return
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
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
      published_month: `${publishedYear}-${publishedMonth}-01`,
      category,
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
    setPublishedMonth(currentMonth)
    setPublishedYear(currentYear)
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
          <label htmlFor="published-month">Mês</label>
          <select
            id="published-month"
            required
            value={publishedMonth}
            onChange={(e) => setPublishedMonth(e.target.value)}
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="published-year">Ano</label>
          <input
            id="published-year"
            type="number"
            inputMode="numeric"
            required
            value={publishedYear}
            onChange={(e) => setPublishedYear(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="category">Categoria</label>
        <select
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="adulto">Adulto</option>
          <option value="crianca">Criança</option>
        </select>
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
