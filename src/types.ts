export interface Book {
  id: string
  user_id: string
  title: string
  publisher: string
  published_month: string
  price: number
  link: string | null
  created_at: string
}

export type NewBook = Pick<
  Book,
  'title' | 'publisher' | 'published_month' | 'price' | 'link'
>
