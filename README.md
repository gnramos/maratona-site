# Maratona SBC - Site

Projeto para processar relatórios da [Maratona de Programação da SBC](http://maratona.sbc.org.br/) e criar páginas HTML para divulgação das informações.

## Relatório ICPC

As informações são extraídas dos relatórios disponibilizados pelo [ICPC](https://icpc.global/). Especificamente, considera-se o relatório _Search "Team Members"_, exportado no formato [CSV](https://pt.wikipedia.org/wiki/Comma-separated_values), com os seguintes itens:
* Username
* First name
* Last name
* Site
* Sex
* Institution
* Institution short name
* Team
* Team status
* Rank
* Role

O arquivo deve ser salvo com a seguinte estrutura de nome: `YYYY_1aFase.csv` ou `YYYY_Nacional.csv`, conforme  o evento, dentro do diretório `[reports](reports)`.


## Processamento

O processamento do(s) relatório(s) é feito por scripts em Python 3 (utilizando [numpy](https://numpy.org/) e [pandas](https://pandas.pydata.org/pandas-docs/stable/index.html)). O uso é simples, basta fornecer o endereço do arquivo do relatório.

```bash
cd src
python3 process.py ../reports/2018_Nacional.csv ../reports/2019*.csv -p -e -o -g
```

Algumas informações interessantes sobre o evento podem ser apresentadas neste processamento. Os resultados são armazenados em arquivos javascript, para serem carregados na página e permitirem uma visualização dinâmica. A opção `-e` gera os dados sobre os eventos anuais, que são e a opção `-p` das participações de instituições e competidores nesses eventos. Use a opção `-h` para detalhes sobre as funcionalidades.

### Arquivos Auxiliares

O arquivo [institutions.csv](src/institutions.csv) mapeia cada instituição à suas sigla e UF (por exemplo, `DF,UnB,Universidade de Brasília`. O agrupamento das informações é feito baseado nessas informações. O arquivo [aliases.csv](src/aliases.csv) mapeia diferentes formas de escrita à uma forma única, visando uma padronização dos nomes (por exemplo, _Universidade de Brasilia_ e _University of Brasília_ são mapeadas para _Universidade de Brasília_).

O estilo das informações é definido no arquivo [maratona.css](docs/maratona.css)

## Visualização

Os resultados podem ser visualizados em duas páginas distintas. Todos os arquivos relacionados são armazenados no diretório [docs](docs) deste projeto, que tem uma estrutura específica para facilitar a atualização. Os pontos de ajuste são indicados a seguir:

```
docs
  |- img
  |    +- [YYYY]
  |    |    + poster.jpg
  |    |    +- 1aFase
  |    |    |    `- [RANK].jpg
  |    |    `- Nacional
  |    |         `- [RANK].jpg
  |    `- institutions
  |         `- [INSTITUIÇÃO].png
  `- js
       `- data
            `- [YYYY_FASE].js
```

O diretório [img](docs/img) contém as imagens do site. Imagens de bandeiras de UFs foram obtidas da [Wikimedia Commons](https://commons.wikimedia.org/), as demais foram criadas ou são da organização do evento. Para cada diretório `YYYY`, representando o ano do evento, o poster de chamada fica armazenado no arquivo `poster.jpg` e a foto de cada time participante no respectivo arquivo `RANK.jpg`, onde _RANK_ é o rank do time no placar geral. O arquivo `INSTITUIÇÃO.png`, onde _INSTITUIÇÃO_ é o nome da instituição, formatado apenas com suas letras minúsculas e sem acentos, deve conter a imagem da marca da instituição.

O diretório [js](docs/js) contém os arquivos javascript do site. Além de scripts de manipulação de páginas, o diretório [data](docs/js/data) contém os arquivos com as informações processadas dos eventos, no formato de dicionários.

A exibição dos *eventos* é feita pela página [event.html](docs/eventos.html), com a manipulação dos dados via script [event.js](docs/js/eventos.js). Neste caso, o `parser` processa o relatório de um evento específico e gera o arquivo `YYYY_FASE.js`, que apenas atualiza a variável `CONTESTS` (dicionário) com os dados do evento _FASE_ (*1aFase* ou *Nacional*) realizado no ano _YYYY_. O arquivo HTML é atualizado automaticamente com essa informação.

A exibição das *participações* é feita pela página [participation.html](docs/participation.html), com a manipulação dos dados via script [participation.js](docs/js/participation.js). Neste caso, o `parser` processa o relatório de um evento específico e escreve essas informações nos arquivos `[contestants.js](docs/js/data/contestants.js)` e `[institutions.js](docs/js/data/institutions.js)`, que são carregados pelo HTML.