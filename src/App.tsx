import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import type { Book, NewBook } from './types'
import Login from './components/Login'
import BookForm from './components/BookForm'
import BookList from './components/BookList'
import owlLogo from './assets/owl-logo.png'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState<string | null>(null)

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
      return
    }

    let cancelled = false
    setBooksLoading(true)
    setBooksError(null)

    supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setBooksError(error.message)
        } else {
          setBooks(data as Book[])
        }
        setBooksLoading(false)
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

    setBooks((current) => [data as Book, ...current])
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
          <BookList books={books} onDelete={handleDeleteBook} />
        )}
      </main>
    </div>
  )
}

export default App
