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
      <table className="book-table">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Editora</th>
            <th>Ano</th>
            <th>Preço</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.publisher}</td>
              <td>{book.year}</td>
              <td>{currencyFormatter.format(book.price)}</td>
              <td>
                <button
                  type="button"
                  className="link danger"
                  onClick={() => onDelete(book.id)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="total">
        Total: <strong>{currencyFormatter.format(total)}</strong>
      </p>
    </>
  )
}
