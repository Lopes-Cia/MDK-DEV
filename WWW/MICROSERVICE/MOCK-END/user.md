add comentario em cada rota para ser facil saber do que se trata [text](PROJETOS/connect/routes.mjs)

a gente prescisa da rotas para brands

brands = todos brands
brands/:id = brand por id, com todos produtos desse brand

a gente vai colocar essas funções na classe d produto 
[text](PROJETOS/connect/handlers/mock/products.mjs)


um end-point home

vamos criar um controller para home, e retorna o nosso json, so vamos ter isso no momento



a gente vai colocar o end-point da home no storea [text](../../REFERENCIAS/connect-ecommerce/stores/ecommerce-store.ts), no mesmo padrao dos produtos


[text](../../REFERENCIAS/connect-ecommerce/app/(shop)/dev/page.tsx)
aqui a gente vai cria um botao para cada rota nossa , e ele vai retornar no console.log Ai eu testo tudo

home
    analizar a pagina da home atual
    criar um plano pra usar o mesmo design da home, mas com os dados do store

    card produto e card categoria
        na home eu tenho 2 tipos de card um que representa um produto e outro que representa uma categoria, prescisamos ver se temos componente para eles , se nao criar
    
    carrosel
        tbem na home temos carrosel pra banner, categorias e etc, temos q ver se temos componente para eles , se nao criar

outras questoes, é uma nota para mim ignora isso




slug
    analizar o formato das rotas do front, a gente prescisa de url amigavel , por isso temos o slug. acho q vamos ter um problema pq temos q ter algo assim /produtos/slug, categoria/slug etc, e o nosso slug nao tem essa indicação...
    mas pra simplificar um ponto, a gente atualiza os json com esse formato /produtos/slug, dai fica mais facil de implementar no front
    lembrando, nao podemos regenerar os jsons com seed, pois temos dados manuais, podemos marcar isso em refatorar, 
    sem compatibilidade, isso é codigo legado



remover o produtosV2 para so produtos
    produtosV2 usamos para nao quebrar o codigo que existia no front, porem agora ja podemos substituir por produtos pelo produtosV2. No final nao vamos ter nada nem arquivos nem referencias do V2, e tbem nenhum codigo antigo do produtos



pagina de produtos
    ja existe no front uma pagina de produtos, mas quando tento acessar ela pelo link do carrosel na home , ele me da um erro 404, por isso temos q ajustar
    ja ajustamos tbem essa pagina http://localhost:3000/products

card de categorias, incluir link e nome da categoria



header > menus
pagina de todas categorias
pagina de busca
paginação
pagina de categoria 
filtros

usuarios
pedidos
paginas institucionais
footer
pagina de contato
