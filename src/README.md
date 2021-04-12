# Processamento

O processamento do(s) relatório(s) é feito por scripts em Python 3 (utilizando [numpy](https://numpy.org/) e [pandas](https://pandas.pydata.org/pandas-docs/stable/index.html)). O uso é simples, basta fornecer o endereço do arquivo do relatório.

```bash
cd src
python3 process.py ../reports/2018_Nacional.csv ../reports/2019*.csv -p -e -o -g
```

## `-e` ou `--event`

O processamento de um evento envolve a análise dos dados e a reestruturação deles como dicionários, que são armazenados em arquivos `.js` para serem carregados na página. Especificamente, os dicionários _CONTESTS_ e _AGGREGATED_, que têm as seguintes estruturas:

```javascript
// YYYY é o ano do evento, FASE é "1aFase" ou "Nacional".
CONTESTS[YYYY][FASE] = {
  REGIÃO: {                // Região onde a instituição está localizada.
    UF: {                  // Unidade Federativa onde a instituição está localizada.
      INSTITUIÇÃO: {       // Nome completo da instituição.
        TIME: {            // Nome do time.
          "Rank": 4,       // Rank geral do time na fase.
          "SiteRank": 1,   // Rank no site onde disputou a fase.
          "Site": "Sede",  // Nome da sede onde o time participou.
          "Short name": "Sigla", // Nome curto da instituição.
          "Contestants": [ // Lista dos competidores.
            "Fulano da Silva",
            "Fulanésio da Sylva",
            "Beltrana da Ciuva"
          ],
          "Sex": [         // Lista do gênero de cada competidor
            "Male",        // (na mesma ordem dos nomes).
            "Male",
            "Female"
          ],
          "Coach": "Sicrano da Siwa"  // Nome do técnico do time.
        }
      }
    }
  }
};

// METRICA é a medida dos dados agregados, CARACTERISTICA é a característica para
// a qual os dados foram agregados, YYYY é o ano do evento e "FASE" é "1aFase" ou
// "Nacional".
AGGREGATED[METRICA][CARACTERISTICA][YYYY][FASE] = {
  REGIÃO: {           // Região onde a instituição está localizada.
    "Value": 27.5,    // Valor agregado para a região.
    UF: {             // Unidade Federativa onde a instituição está localizada.
      "Value": 10.0,  // Valor agregado para a UF.
      INSTITUIÇÃO: {  // Nome completo da instituição.
        "Value": 4.0  // Valor agregado para a instituição.
      }
    },
```

Para ambos, as informações indicadas em letras maiúsculas são substituídas pelos valores obtidos ao processar um relatório.

## `-p` ou `--participant`

O processamento dos participantes envolve a análise dos dados de diversos relatórios e a reestruturação deles como dicionários, que são armazenados em arquivos `.js` para serem carregados na página. Especificamente, o arquivo [`contestants.js`](../docs/js/data/contestants.js) tem o dicionário _CONTESTANTS_ com a seguinte estrutura:

```javascript
CONTESTANTS = {
  USERID: {                        // Identificador único do competidor.
    "FullName": "Fulano da Silva", // Nome do competidor.
    FASE: {                        // Registro das participações na FASE.
      YYYY: 4                      // Ano da participação na FASE e o rank obtido.
    }
  }
};
```

Já o arquivo [`institutions.js`](../docs/js/data/institutions.js) tem o dicionário _INSTITUTIONS_ com a seguinte estrutura:

```javascript
INSTITUTIONS = {
  UF: { // Unidade Federativa onde a instituição está localizada.
    INSTITUIÇÃO: {      // Nome completo da instituição.
      FASE: {           // Registro das participações na FASE.
        YYYY: {         // Registro do ano da participação.
          "Team": 1,    // Quantidade de times da instituição participantes.
          "BestRank": 4 // Rank do time melhor qualificado.
        }
      }
    }
  }
};
```

Para ambos, as informações indicadas em letras maiúsculas são substituídas pelos valores obtidos ao processar um relatório.

### Atenção

O resultado de processar a participação é o agregado para todos os relatórios, ou seja, o processamento de um relatório para um evento apenas sobrescreve os arquivos com os dados de somente esse evento.