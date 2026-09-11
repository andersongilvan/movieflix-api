# Migrations

As migrations ficam em `src/migrations` e são executadas pelo CLI do TypeORM, usando a DataSource em `src/database/data-source.ts`.

O app **não** aplica migrations ao subir. Use os scripts abaixo.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run migration:create -- src/migrations/NomeDaMigration` | Cria um arquivo de migration vazio |
| `npm run migration:generate -- src/migrations/NomeDaMigration` | Gera o SQL comparando as entities com o banco |
| `npm run migration:run` | Aplica as migrations pendentes |
| `npm run migration:revert` | Desfaz a última migration aplicada |
| `npm run migration:show` | Lista migrations e quais já foram aplicadas |

## Fluxo

1. Crie ou altere uma entity (`*.entity.ts`).
2. Gere a migration a partir do diff com o banco:

```bash
npm run migration:generate -- src/migrations/CreateUsers
```

3. Revise o arquivo gerado em `src/migrations`.
4. Aplique no banco:

```bash
npm run migration:run
```

Para uma migration manual (sem gerar SQL):

```bash
npm run migration:create -- src/migrations/AddIndexToUsersEmail
```

## Reverter

```bash
npm run migration:revert
```

Cada execução desfaz **apenas** a última migration.

## Observações

- As variáveis de conexão vêm do `.env` (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`).
- `synchronize` está desligado. O schema só muda via migration.
- `migration:generate` exige que o banco esteja no ar e que as entities já existam no projeto.
