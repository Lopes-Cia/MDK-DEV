# Desenho: Projetos e Recursos

## Objetivo
Documentar a estratégia de gestão de recursos de terceiros, referências externas e repositórios base que auxiliam o desenvolvimento do projeto principal.

## Instrução: Diretório de Referências (`WWW/REFERENCIAS`)
Para otimizar a análise de código e a reutilização de componentes de terceiros, adotamos a seguinte estratégia:

1. **Criar e utilizar a pasta `WWW/REFERENCIAS`**.
2. **Propósito**: Esta pasta servirá exclusivamente como um local (sandbox) para clonar repositórios externos.
3. **Casos de Uso**:
   - Analisar arquiteturas ou padrões de código de projetos similares.
   - Extrair e adaptar fragmentos de código, componentes ou funções utilitárias de terceiros.
   - Consultar implementações de referência durante o desenvolvimento.
4. **Regras**:
   - **NÃO** importar arquivos da pasta `WWW/REFERENCIAS` diretamente para dentro do código de produção (ex: `src/`).
   - O código útil deve ser **copiado e adaptado** para dentro da estrutura oficial do projeto, garantindo conformidade com o estilo local e as licenças originais.
   - A pasta `WWW/REFERENCIAS` não deve fazer parte do repositório final do produto (adicione ao `.gitignore` caso a pasta `WWW/` integre o controle de versão principal).
