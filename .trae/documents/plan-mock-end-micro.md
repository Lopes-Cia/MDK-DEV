## Objetivo
Criar uma versão simplificada do microservice em `WWW/MICROSERVICE/MOCK-END-MICRO`, contendo apenas o projeto `PROJETOS/connect` e removendo a lógica equivalente ao trecho `PROJETOS/connect/routes.mjs#L9-L13` (sem `auth` e sem `execution.mode`).

## Premissas / Restrições
- O micro deve atender apenas rotas do projeto `connect` (sem suporte a múltiplos projetos/bases).
- Não deve existir verificação/obrigatoriedade de `Authorization` (o campo `auth` não existe no micro).
- Não deve existir “switch” de execução `original/mock/hybrid` (o campo `execution` não existe no micro).
- Deve continuar servindo assets de imagens usados pelo connect (`/assets/images/*`) a partir do conteúdo do projeto.
- Sem novas dependências npm (manter runtime Node puro).

## Estratégia Recomendada
Converter o catálogo de rotas para um formato direto:
- Em `MOCK-END-MICRO/PROJETOS/connect/routes.mjs`, remover `auth` e `execution` de todas as rotas.
- Ajustar `handler_class` para apontar diretamente para handlers mock (prefixo `mock/`), eliminando a necessidade de “mode”.

Trade-off: isso fixa o micro como “mock-only” (o que é o objetivo de simplificação). Se no futuro precisar de proxy/original/hybrid, será outro micro.

## Passos (3–8)
1) Inventariar o mínimo necessário do `MOCK-END` atual para rodar:
   - `server.mjs`, `lib/*` essenciais (cors/response/body), e `routes/*` necessários.
2) Criar a estrutura do novo microservice em `WWW/MICROSERVICE/MOCK-END-MICRO`:
   - `package.json` com script `dev/start` (Node ESM).
   - `server.mjs` simplificado (sem `resolveProjectByPathname`, sem proxy, sem `.env` por projeto).
3) Implementar roteador mínimo no micro:
   - Atender `GET/HEAD /assets/images/*` servindo de `PROJETOS/connect/handlers/mock/assets/images`.
   - Atender `/connect/*` (especialmente `/connect/Servidor/webservice/integration/*`) fazendo match contra `PROJETOS/connect/routes.mjs` e executando handlers.
4) Copiar `PROJETOS/connect` do mock-end atual para `MOCK-END-MICRO/PROJETOS/connect`.
5) Simplificar `MOCK-END-MICRO/PROJETOS/connect/routes.mjs`:
   - Remover `auth: { ... }`.
   - Remover `execution: { ... }`.
   - Atualizar `handler_class` para `mock/<valor_antigo>` (ex.: `api/produtos` -> `mock/api/produtos`).
6) Ajustar o dispatcher no micro para:
   - Carregar módulos em `PROJETOS/connect/handlers/<handler_class>.mjs` diretamente.
   - Passar `ctx.routeParams` para handlers (compatível com o mock atual).
7) Validação manual (sem testes automatizados):
   - Subir o micro e chamar 2–3 endpoints principais via curl/HTTP:
     - `GET /connect/Servidor/webservice/integration/home`
     - `GET /connect/Servidor/webservice/integration/produtos/categorias`
     - `GET /assets/images/banners/banner-1.webp`
   - Confirmar: não exige Authorization e responde usando handlers mock.

## Critérios de Aceite
- `MOCK-END-MICRO` sobe com `node server.mjs`.
- Rotas do `connect` funcionam em modo mock, sem qualquer dependência de `auth`/`execution`.
- `PROJETOS/connect/routes.mjs` no micro não contém os blocos `auth` e `execution`.
- Assets em `/assets/images/*` são servidos.

## Fora de Escopo
- Proxy para upstream (`INTEGRATION_URL_API` / `AUTH_BASE_URL`).
- Modos `original` e `hybrid`.
- Compatibilidade com outros projetos além de `connect`.

