# Checklist

## Mock data
- [x] `handlers/mock/clientes.json` usa `meus_dados` em todos os itens (não existe `cliente` como chave principal).
- [x] `privacidade.doisFatores` existe e `cliente.doisFatores` não existe no arquivo.

## MOCK-END compat
- [x] Controller aceita leitura apenas de itens com `meus_dados` (formato novo).
- [x] Login 200 retorna `data.meus_dados`, `data.enderecos`, `data.privacidade`, `data.token` (sem alias `cliente`).
- [x] Cadastro persiste `doisFatores` dentro de `privacidade` no arquivo.

## Front compat
- [x] Front funciona com resposta nova (`meus_dados`) sem fallback para `cliente`.
- [x] Páginas do painel do cliente exibem/editem dados sem quebrar com o schema novo.
- [x] Checkout continua hidratando dados do cliente/endereços/privacidade corretamente.

## Rollback
- [x] Evidências em `WWW/MICROSERVICE/MOCK-END/TEST` foram atualizadas para o schema novo (não referenciam `cliente`).
