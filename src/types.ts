export interface Book {
  id: string
  user_id: string
  title: string
  publisher: string
  year: number
  price: number
  created_at: string
}

export type NewBook = Pick<Book, 'title' | 'publisher' | 'year' | 'price'>
