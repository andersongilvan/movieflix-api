# Nest Auth (Movieflix API)

API REST em **NestJS 11** para um catálogo de filmes (Movieflix): autenticação JWT, papéis `user` / `admin`, recuperação de senha por e-mail, categorias, plataformas de streaming e filmes com paginação.

O frontend (ex.: React em `http://localhost:5173`) consome esta API. Contratos detalhados estão em [`docs/`](docs/).

## Sumário

- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Autenticação e autorização](#autenticação-e-autorização)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts npm](#scripts-npm)
- [Banco de dados](#banco-de-dados)
- [E-mail](#e-mail)
- [Testes](#testes)
- [Documentação da API (frontend)](#documentação-da-api-frontend)
- [Mapa de rotas](#mapa-de-rotas)
- [Produção](#produção)
- [Estrutura do repositório](#estrutura-do-repositório)

## Stack

| Camada | Tecnologia |
| --- | --- |
| Runtime | Node.js, TypeScript 5 |
| Framework | NestJS 11 (Express) |
| Banco | PostgreSQL 16 + TypeORM |
| Auth | JWT HS256 (`@nestjs/jwt`), bcryptjs |
| E-mail | Nodemailer |
| Validação | class-validator + ValidationPipe global |
| Segurança | Helmet, Throttler (60 req / 60s) |
| Testes | Jest + ts-jest |

Alias de imports: `@/` aponta para `src/` (ex.: `@/user/user.service`).

## Funcionalidades

- Cadastro e login com e-mail/senha
- Par de tokens: **access** (5 min) e **refresh** (7 dias)
- Recuperação de senha (token de uso único, 30 min, enviado por e-mail)
- Papéis `user` e `admin` (admin herda user)
- CRUD de categorias, streamings e filmes
- Filmes com título único, filtro por categoria e busca `ILIKE`
- Paginação em `GET /movie` e `GET /streaming`
- Seed de catálogo (12 categorias, 10 streamings, 50 filmes)

## Arquitetura

Módulos Nest:

| Módulo | Responsabilidade |
| --- | --- |
| `AuthModule` | Login, refresh, forgot/reset, JWT, guards |
| `UserModule` | Registro público e CRUD de usuários (admin) |
| `MovieModule` | Filmes e relações N:N com categoria/streaming |
| `CategoryModule` | Categorias |
| `StreamingModule` | Plataformas |
| `EmailModule` | Transporte Nodemailer + HTML do reset |
| `DatabaseModule` | `TypeOrmModule.forRootAsync` (sem `synchronize`) |

O schema **só muda por migration**. O app não aplica migrations ao subir.

Validação global (`src/main.ts`): `whitelist`, `forbidNonWhitelisted`, `transform`. Campos extras no JSON geram **400**.

Rate limit global: **60 requisições por minuto** por cliente; excesso bloqueia por 5s (`ThrottlerGuard`).

## Autenticação e autorização

Não há cookies. O cliente guarda os tokens e envia:

```http
Authorization: Bearer <accessToken>
```

| Token | Uso | TTL padrão |
| --- | --- | --- |
| Access (`type: access`) | Rotas protegidas | `JWT_TTL` = 300s |
| Refresh (`type: refresh`) | Só no body de `POST /auth/refresh-token` | `JWT_REFRESH_TTL` = 604800s |

O `AuthGuard` **rejeita** refresh no header Bearer.

Papéis (`src/user/enum/user-role.enum.ts`):

- **user** — lê/cria/edita catálogo; **não** deleta movie/category/streaming; **não** acessa `/user` (exceto register)
- **admin** — tudo do user **mais** deletes de catálogo e CRUD de usuários; promove com `PATCH /user/:id/admin`

Rotas **públicas** (sem Bearer):

- `POST /user/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/refresh-token`

## Pré-requisitos

- Node.js 20+ (recomendado 22+)
- npm
- Docker (para o Postgres do `docker-compose.yml`) **ou** PostgreSQL local

## Como rodar

### 1. Clonar e instalar

```bash
npm install
```

### 2. Banco

```bash
docker compose up -d
```

Sobe Postgres 16 em `localhost:5432` com usuário/senha `postgres` e banco `db_movieflix` (alinhado ao `.env` de desenvolvimento).

### 3. Ambiente

```bash
cp .env.example .env
```

Ajuste `JWT_SECRET`, SMTP e, se o Postgres não for o do compose, as variáveis `DB_*`.

`FRONTEND_URL` deve ser a origem do React (ex.: `http://localhost:5173`). É usada no **link do e-mail** de reset. Alterar `.env` exige **reiniciar** o Nest (`--watch` não recarrega env).

### 4. Schema e dados

```bash
npm run migration:run
npm run seed
```

O seed é idempotente: títulos já existentes são ignorados.

### 5. API

```bash
npm run start:dev
```

Sobe em `http://localhost:3000` (ou `PORT`).

Primeiro usuário admin: cadastre via `POST /user/register` (nasce `user`) e promova no banco ou por outro admin (`PATCH /user/:id/admin`).

## Variáveis de ambiente

Ver [`.env.example`](.env.example).

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP (padrão 3000) |
| `NODE_ENV` | `development` / `production` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Postgres |
| `JWT_SECRET` | Segredo HS256 (obrigatório em produção) |
| `JWT_TTL` | Access em **segundos** (300 = 5 min) |
| `JWT_REFRESH_TTL` | Refresh em **segundos** (604800 = 7 dias) |
| `FRONTEND_URL` | Origem do frontend (link de reset) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | SMTP |

Porta SMTP **465** usa `secure: true`; **587** (Gmail) usa STARTTLS (`secure: false`).

## Scripts npm

| Script | Função |
| --- | --- |
| `npm run start:dev` | Dev com watch |
| `npm run start:prod` | `node dist/main` (depois de `build`) |
| `npm run build` | Compila para `dist/` |
| `npm run lint` / `npm run format` | ESLint e Prettier |
| `npm test` | Testes unitários Jest |
| `npm run test:cov` | Cobertura |
| `npm run test:e2e` | E2E (`test/jest-e2e.json`) |
| `npm run migration:run` | Aplica migrations |
| `npm run migration:revert` | Desfaz a última |
| `npm run migration:show` | Lista pendentes/aplicadas |
| `npm run migration:generate -- src/database/migrations/Nome` | Gera SQL a partir das entities |
| `npm run seed` | Categorias, streamings e 50 filmes |

Detalhes de migration: [`docs/migrations.md`](docs/migrations.md) (os arquivos ficam em `src/database/migrations/`).

## Banco de dados

Tabelas principais:

- `users` — nome, e-mail único, senha hash, role
- `tokens` — hash SHA-256 de token de reset (nunca o valor cru)
- `categories`, `streamings`, `movies`
- `movie_categories`, `movie_streaming_platforms` — N:N

TypeORM CLI usa `src/database/data-source.ts` e `tsconfig.typeorm.json`.

## E-mail

`PasswordResetService` envia o link:

```text
{FRONTEND_URL}/auth/reset-password?token=<hex>
```

O frontend **precisa** dessa rota e do query `token`.

- **Mailtrap sandbox** (`sandbox.smtp.mailtrap.io`) — captura o e-mail; **não** entrega na caixa real.
- **Gmail** — senha de app + 2FA; `EMAIL_FROM` igual ao `EMAIL_USER`.
- **Produção** — Resend, SendGrid ou Amazon SES com domínio verificado.

Se o e-mail do forgot **não existir** no banco, a API responde **200** e não envia nada (não revela se a conta existe).

## Testes

```bash
npm test
npx jest src/user/user.service.spec.ts --no-coverage
npx jest src/auth/services --no-coverage
```

Specs de serviço instanciam a classe com repositórios mockados (`jest.mock` em `@nestjs/typeorm` / `@nestjs/jwt` por causa de ESM no Jest).

## Documentação da API (frontend)

| Arquivo | Conteúdo |
| --- | --- |
| [`docs/autenticacao.txt`](docs/autenticacao.txt) | Login, register, refresh, erros, papéis |
| [`docs/recuperacao-senha.txt`](docs/recuperacao-senha.txt) | Forgot/reset, rotas React, token |
| [`docs/usuario.txt`](docs/usuario.txt) | Catálogo para role `user` |
| [`docs/admin.txt`](docs/admin.txt) | Usuários e deletes exclusivos de `admin` |

JSON de erro Nest:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

Códigos frequentes: **400** validação, **401** token/credencial, **403** papel insuficiente, **404** recurso, **409** e-mail/título duplicado, **204** DELETE sem body.

## Mapa de rotas

Auth (`/auth`)

| Método | Rota | Auth | Status |
| --- | --- | --- | --- |
| POST | `/auth/login` | pública | 200 |
| POST | `/auth/refresh-token` | pública (refresh no body) | 200 |
| POST | `/auth/forgot-password` | pública | 200 |
| POST | `/auth/reset-password` | pública | 200 |

User (`/user`)

| Método | Rota | Papel | Status |
| --- | --- | --- | --- |
| POST | `/user/register` | pública | 201 |
| GET | `/user` | admin | 200 |
| GET | `/user/:id` | admin | 200 |
| PATCH | `/user/:id` | admin | 200 |
| PATCH | `/user/:id/admin` | admin | 200 |
| DELETE | `/user/:id` | admin | 204 |

Movie / category / streaming — `USER` (admin herda): `GET`, `POST`, `PATCH`.  
`DELETE /movie/:id`, `DELETE /category/:id`, `DELETE /streaming/:id` — **somente admin** (204).

Query de lista (`/movie`, `/streaming`): `page` (1), `limit` (20), `search`. Filmes ainda aceitam `categoryId` (UUID).

## Produção

```bash
npm run build
npm run start:prod
```

Checklist:

- `JWT_SECRET` forte e único
- SMTP de envio real (não sandbox); domínio do `EMAIL_FROM` verificado
- `FRONTEND_URL` = origem HTTPS do app (CORS hoje está `origin: '*'` em `main.ts`; restrinja ao domínio do frontend na AWS)
- Rodar `migration:run` no deploy; nunca ligar `synchronize`
- Postgres gerenciado (RDS etc.) com SSL se o provedor exigir
- Helmet já está ativo; mantenha HTTPS na frente (ALB / CloudFront)

## Estrutura do repositório

```text
src/
  auth/           login, JWT, guards, reset de senha
  user/           cadastro e admin de usuários
  movie/          filmes
  category/
  streaming/
  email/          Nodemailer + template HTML
  common/         paginação
  database/       config, data-source, migrations, seeds
  main.ts         Helmet, CORS, ValidationPipe
docs/             contratos para o frontend
docker-compose.yml
.env.example
```

## Licença

UNLICENSED (uso privado).
