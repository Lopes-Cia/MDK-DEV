# DEVDASH

Painel de desenvolvimento para operar:
- Mock-End (health + links)
- Builder (link externo para o app existente)
- Seeding/Jobs (execução segura de scripts allowlist do `WWW/MICROSERVICE/MOCK-END`)

## Como rodar

1) Suba o Mock-End:

```bash
cd WWW/MICROSERVICE/MOCK-END
npm install
npm run dev
```

2) Suba o DEVDASH:

```bash
cd WWW/MICROSERVICE/DEVDASH
npm install
npm run dev
```

Abra: http://localhost:3003

## Testes

```bash
npm run test
```

## Variáveis de ambiente

- `DEVDASH_MOCKEND_BASE_URL` (default: `http://localhost:4000`)
  - Usado para health + links dos endpoints.
- `DEVDASH_BUILDER_BASE_URL` (default: `http://localhost:3000`)
  - Host do app existente onde fica `/{tenant}/dashboard/builder`.

## Seeding/Jobs (segurança)

- A API do DEVDASH só executa scripts de uma allowlist fixa:
  - `seed:catalog`, `extract:xlsx`, `gen:blueprint`, `gen:builder`, `verify`
- O `cwd` é fixo em `WWW/MICROSERVICE/MOCK-END`.
- Logs são gravados em `WWW/MICROSERVICE/DEVDASH/.devdash/logs`.
