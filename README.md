# Once Upon a Shelf

App para registar livros que ainda vais comprar: nome, editora, ano e preço.
Autenticação por email/password via Supabase Auth; cada utilizador só vê os
seus próprios livros (Row Level Security).

## Stack

- React + TypeScript + Vite
- Supabase (Auth + Postgres)

## Configuração

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Copiar `.env.example` para `.env` e preencher com os dados do projeto
   Supabase (URL e chave publicável/anon):

   ```bash
   cp .env.example .env
   ```

3. Correr em desenvolvimento:

   ```bash
   npm run dev
   ```

## Base de dados

A tabela `books` vive no projeto Supabase **buy-now-cry-later** e tem as
colunas `title`, `publisher`, `year`, `price`, associadas ao utilizador via
`user_id`. RLS está ativo: cada utilizador só consegue ler/criar/editar/apagar
os seus próprios registos.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run lint` — oxlint
- `npm run preview` — pré-visualizar a build
