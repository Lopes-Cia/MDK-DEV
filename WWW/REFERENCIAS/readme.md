# WWW/REFERENCIAS

## Objetivo
- Servir como um diretório central para clonar repositórios de terceiros, projetos base, templates ou ferramentas.
- Facilitar a análise de código, pesquisa de arquiteturas e reutilização de fragmentos de código externos.

## Responsabilidades / Limites
- **Faz**: Armazena clones temporários ou permanentes de repositórios que servem como consulta.
- **Não faz**: Não hospeda código de produção ou de runtime do projeto atual. Nenhuma parte do projeto atual deve importar diretamente arquivos contidos nesta pasta.
- **Dono do domínio**: Ambiente de desenvolvimento (Dev/IA).

## Como usar
- Clone repositórios de interesse aqui. Exemplo: `git clone https://github.com/exemplo/repo.git`
- Explore os códigos localmente.
- Caso encontre um componente, função ou padrão útil, **copie e adapte** para dentro de `src/` ou para a pasta adequada no projeto principal.

## Regras locais
- **Sem Imports**: É estritamente proibido importar código desta pasta para dentro do sistema.
- **Git Ignore**: Recomenda-se adicionar `WWW/REFERENCIAS` ao arquivo `.gitignore` global do seu projeto, para evitar o aninhamento acidental de repositórios ou o aumento desnecessário do tamanho do repositório principal.

## Arquivos-chave
- `readme.md` (Este arquivo com as diretrizes de uso da pasta).

## LEGADO
- Projetos de referência muito antigos ou obsoletos podem ser deletados (ou movidos para um subdiretório `LEGADO/` aqui dentro, se houver necessidade de preservar histórico local de análise).