objetivo

eu criei um mock-end para simular o back-end real do sistema. agora preciso de uma ferramenta para criar um contrato entre o BACK e o MOCK:

- encontrar no BACK os endpoints paralelos ao que o MOCK atende (mock vs proxy)
- listar os gaps entre BACK e MOCK
- iniciar com uma arquitetura MVP e aprofundar a analise aos poucos

referencias (pastas/arquivos)

- BACK (9004 OpenAPI offline):
  - `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/api-docs.json`
- MOCK (catalogo de rotas do connect):
  - `WWW/MICROSERVICE/MOCK-END/PROJETOS/connect/routes.mjs`
- MOCK (logica de proxy que decide mock vs upstream):
  - `WWW/MICROSERVICE/MOCK-END/routes/proxy.mjs`
- ferramenta de contrato (mvp):
  - `WWW/MICROSERVICE/LEAR_LOPES/contract/contract-9004.mjs`
  - `WWW/MICROSERVICE/LEAR_LOPES/contract/contract-9004.config.json`

como rodar (mvp)

1) editar tags do mvp (se quiser mudar o recorte inicial)

- arquivo: `WWW/MICROSERVICE/LEAR_LOPES/contract/contract-9004.config.json`
- tags atuais: `Produto`, `Customer`, `Pedido`

2) gerar o relatorio

```bash
node c:\LOPES\www\MDK-DEV\WWW\MICROSERVICE\LEAR_LOPES\contract\contract-9004.mjs
```

3) ler a saida

- markdown (humano): `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/contract/report.md`
- json (ia friendly): `WWW/MICROSERVICE/LEAR_LOPES/DOCS/lopes_9004/contract/report.json`

como interpretar

- mocked: endpoint do back tem rota declarada no mock (execution.mode mock/hybrid)
- proxied: endpoint do back nao tem rota no routes.mjs, entao o mock-end vai chamar o upstream real (gap de mock)
- mock-only: rota existe no mock, mas nao existe no openapi 9004 (divergencia)



Essa abrodagem não gerou nenhum dado relevante, vamos fazer o seguinte :

uma analise profunda do MOCK-end, , todos endpoints, com todas as rotas., com request e response e playloads , sumarios e etc