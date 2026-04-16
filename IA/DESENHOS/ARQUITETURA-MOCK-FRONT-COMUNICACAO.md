para criar um recurso no front que consome dados dinamicos do mock-end, essa é a arquitetura:

começando sempre pelo mock-end

[text](MOCK-END-MODELO-ROTA.md)
aqui tem o modelo ou template de como fazer a implementação no mock-end. Esse modelo é geral e usado para entender as regras de arquivos, de padrão, de funções etc.

O usuario (eu) vai te pedir uma implementação como foi pedida para os endpoints clientes, Observa que foi gerado o [text](MOCK-CLIENTES.md), ele usou o modelo para atender as necessidades do usuario na criação do clientes.

O passo que estamos construindo é o front, que sempre vai ser feito apos o mock-end. O motivo é simples... O front precisa de dados do mock-end para funcionar.

Da mesma Forma que o mock-end tem um modelo de rota, o front tem o seu proprio modelo [text](FRONT-END-MODELO-FLUXO.md), e claro tem a implementação definida [text](FRONT-CLIENTES.md). 
essa implementação nada mais é que o consumo dos endpoints gerados pelo [text](MOCK-CLIENTES.md)