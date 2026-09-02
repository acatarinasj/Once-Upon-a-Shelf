import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type Mode = 'sign-in' | 'sign-up'

export default function Login() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else if (mode === 'sign-up') {
      setInfo('Conta criada. Verifica o teu email para confirmar o registo.')
    }

    setLoading(false)
  }

  return (
    <section className="auth-card">
      <h1>Once Upon a Shelf</h1>
      <p className="subtitle">Regista os livros que ainda vais comprar</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="form-error">{error}</p>}
        {info && <p className="form-info">{info}</p>}

        <button type="submit" className="primary" disabled={loading}>
          {loading
            ? 'A processar...'
            : mode === 'sign-in'
              ? 'Entrar'
              : 'Criar conta'}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
          setInfo(null)
        }}
      >
        {mode === 'sign-in'
          ? 'Ainda não tens conta? Regista-te'
          : 'Já tens conta? Entra'}
      </button>
    </section>
  )
}
