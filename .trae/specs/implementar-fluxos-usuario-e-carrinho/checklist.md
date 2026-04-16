- [ ] Endpoints de perfil (`PUT /me`) funcionam e persistem no JSON do tenant
- [ ] Fluxo “esqueci senha” cria token com expiração e permite redefinir senha (token marcado como usado)
- [ ] Carrinho persiste por usuário (GET/PUT e, se implementado, operações por item)
- [ ] Checkout cria pedido a partir do carrinho e limpa carrinho ao sucesso
- [ ] UI inclui páginas: login, cadastro, meus dados, carrinho, checkout, pedidos, detalhe do pedido, esqueci senha, redefinir senha
- [ ] UI mantém estados de loading/empty/error consistentes e sem fetch direto fora dos stores
- [ ] Persistência por tenant validada (arquivos `COMMERCE/*.json` sendo lidos e escritos corretamente)

