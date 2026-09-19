import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import type { Book, Category, NewBook } from './types'
import Login from './components/Login'
import BookForm from './components/BookForm'
import BookList from './components/BookList'
import { exportBooksToExcel } from './lib/exportBooks'
import { normalizePublisherKey } from './lib/publisher'
import { isStale } from './lib/staleness'
import owlLogo from './assets/owl-logo.png'
import './App.css'

function sortBooks(books: Book[]): Book[] {
  return [...books].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.publisher.localeCompare(b.publisher) ||
      a.published_month.localeCompare(b.published_month),
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState<string | null>(null)
  const [stands, setStands] = useState<Record<string, string>>({})
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [staleOnly, setStaleOnly] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      },
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setBooks([])
      setStands({})
      setSelectedIds(new Set())
      return
    }

    let cancelled = false
    setBooksLoading(true)
    setBooksError(null)

    supabase
      .from('books')
      .select('*')
      .order('category', { ascending: true })
      .order('publisher', { ascending: true })
      .order('published_month', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setBooksError(error.message)
        } else {
          const fetchedBooks = data as Book[]
          setBooks(fetchedBooks)
          setSelectedIds(new Set(fetchedBooks.map((book) => book.id)))
        }
        setBooksLoading(false)
      })

    supabase
      .from('publisher_stands')
      .select('publisher, stand')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const map: Record<string, string> = {}
        for (const row of data as { publisher: string; stand: string | null }[]) {
          if (row.stand) map[normalizePublisherKey(row.publisher)] = row.stand
        }
        setStands(map)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function handleAddBook(newBook: NewBook): Promise<string | null> {
    if (!session) return 'Sessão inválida.'

    const { data, error } = await supabase
      .from('books')
      .insert({ ...newBook, user_id: session.user.id })
      .select()
      .single()

    if (error) return error.message

    const addedBook = data as Book
    setBooks((current) => sortBooks([...current, addedBook]))
    setSelectedIds((current) => new Set(current).add(addedBook.id))
    return null
  }

  async function handleUpdateBook(
    id: string,
    updatedBook: NewBook,
  ): Promise<string | null> {
    const previous = books
    setBooks((current) =>
      sortBooks(
        current.map((book) => (book.id === id ? { ...book, ...updatedBook } : book)),
      ),
    )

    const { error } = await supabase.from('books').update(updatedBook).eq('id', id)

    if (error) {
      setBooks(previous)
      return error.message
    }
    return null
  }

  async function handleToggleFavorite(id: string, isFavorite: boolean) {
    const previous = books
    setBooks((current) =>
      current.map((book) =>
        book.id === id ? { ...book, is_favorite: isFavorite } : book,
      ),
    )

    const { error } = await supabase
      .from('books')
      .update({ is_favorite: isFavorite })
      .eq('id', id)

    if (error) {
      setBooksError(error.message)
      setBooks(previous)
    }
  }

  async function handleUpdateDiscount(
    id: string,
    discount: number,
  ): Promise<string | null> {
    const previous = books
    setBooks((current) =>
      current.map((book) => (book.id === id ? { ...book, discount } : book)),
    )

    const { error } = await supabase.from('books').update({ discount }).eq('id', id)

    if (error) {
      setBooks(previous)
      return error.message
    }
    return null
  }

  function handleToggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleUpdateStand(
    publisher: string,
    stand: string,
  ): Promise<string | null> {
    if (!session) return 'Sessão inválida.'

    const key = normalizePublisherKey(publisher)

    const { error } = await supabase.from('publisher_stands').upsert(
      { user_id: session.user.id, publisher: key, stand: stand || null },
      { onConflict: 'user_id,publisher' },
    )

    if (error) return error.message

    setStands((current) => {
      const next = { ...current }
      if (stand) {
        next[key] = stand
      } else {
        delete next[key]
      }
      return next
    })
    return null
  }

  async function handleDeleteBook(id: string) {
    const previous = books
    setBooks((current) => current.filter((book) => book.id !== id))
    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })

    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) {
      setBooksError(error.message)
      setBooks(previous)
      setSelectedIds((current) => new Set(current).add(id))
    }
  }

  if (authLoading) {
    return (
      <div className="page centered">
        <p>A carregar...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="page centered">
        <Login />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="header-title">
          <img src={owlLogo} className="app-logo" alt="" />
          <h1>Once Upon a Shelf</h1>
        </div>
        <button
          type="button"
          className="link"
          onClick={() => supabase.auth.signOut()}
        >
          Sair
        </button>
      </header>

      <main>
        <BookForm onSubmit={handleAddBook} />

        {booksError && <p className="form-error">{booksError}</p>}

        {booksLoading ? (
          <p className="empty-state">A carregar livros...</p>
        ) : (
          <>
            {books.length > 0 && (
              <div className="list-toolbar">
                <div className="filters">
                  <div className="category-filter">
                    <button
                      type="button"
                      className={categoryFilter === 'all' ? 'active' : ''}
                      onClick={() => setCategoryFilter('all')}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      className={categoryFilter === 'adulto' ? 'active' : ''}
                      onClick={() => setCategoryFilter('adulto')}
                    >
                      Adulto
                    </button>
                    <button
                      type="button"
                      className={categoryFilter === 'crianca' ? 'active' : ''}
                      onClick={() => setCategoryFilter('crianca')}
                    >
                      Criança
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`stale-filter${staleOnly ? ' active' : ''}`}
                    onClick={() => setStaleOnly((current) => !current)}
                  >
                    +24 meses
                  </button>
                  <button
                    type="button"
                    className={`stale-filter${favoritesOnly ? ' active' : ''}`}
                    onClick={() => setFavoritesOnly((current) => !current)}
                  >
                    ★ Favoritos
                  </button>
                </div>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => exportBooksToExcel(books, stands)}
                >
                  Exportar para Excel
                </button>
              </div>
            )}
            <BookList
              books={books.filter(
                (book) =>
                  (categoryFilter === 'all' || book.category === categoryFilter) &&
                  (!staleOnly || isStale(book.published_month)) &&
                  (!favoritesOnly || book.is_favorite),
              )}
              stands={stands}
              selectedIds={selectedIds}
              onDelete={handleDeleteBook}
              onUpdateStand={handleUpdateStand}
              onToggleSelected={handleToggleSelected}
              onToggleFavorite={handleToggleFavorite}
              onUpdateDiscount={handleUpdateDiscount}
              onUpdateBook={handleUpdateBook}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
