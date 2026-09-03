import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import type { Book, NewBook } from './types'
import Login from './components/Login'
import BookForm from './components/BookForm'
import BookList from './components/BookList'
import { exportBooksToExcel } from './lib/exportBooks'
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
          setBooks(data as Book[])
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
          if (row.stand) map[row.publisher] = row.stand
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

    setBooks((current) => sortBooks([...current, data as Book]))
    return null
  }

  async function handleUpdateStand(
    publisher: string,
    stand: string,
  ): Promise<string | null> {
    if (!session) return 'Sessão inválida.'

    const { error } = await supabase.from('publisher_stands').upsert(
      { user_id: session.user.id, publisher, stand: stand || null },
      { onConflict: 'user_id,publisher' },
    )

    if (error) return error.message

    setStands((current) => {
      const next = { ...current }
      if (stand) {
        next[publisher] = stand
      } else {
        delete next[publisher]
      }
      return next
    })
    return null
  }

  async function handleDeleteBook(id: string) {
    const previous = books
    setBooks((current) => current.filter((book) => book.id !== id))

    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) {
      setBooksError(error.message)
      setBooks(previous)
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
        <BookForm onAdd={handleAddBook} />

        {booksError && <p className="form-error">{booksError}</p>}

        {booksLoading ? (
          <p className="empty-state">A carregar livros...</p>
        ) : (
          <>
            {books.length > 0 && (
              <div className="export-bar">
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
              books={books}
              stands={stands}
              onDelete={handleDeleteBook}
              onUpdateStand={handleUpdateStand}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
