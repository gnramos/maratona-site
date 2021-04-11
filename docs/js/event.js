/**
 * Exibição de estatísticas dos eventos da Maratona de Programação SBC.
 *
 * Implementação de funções para gerenciar a disposição de informações
 * quanto à participações em eventos específicos.
 *
 * @link   http://www.github.com/gnramos/maratona-site
 * @author Guilherme N. Ramos.
 */

/******************************************************************************
 * Constantes                                                                 *
 ******************************************************************************/
const UF = {"AC": "Acre", "AL": "Alagoas", "AM": "Amazonas",
            "AP": "Amapá", "BA": "Bahia", "CE": "Ceará",
            "DF": "Distrito Federal", "ES": "Espírito Santo",
            "GO": "Goiás", "MA": "Maranhão", "MG": "Minas Gerais",
            "MS": "Mato Grosso do Sul", "MT": "Mato Grosso",
            "PA": "Pará", "PB": "Paraíba", "PE": "Pernambuco",
            "PI": "Piauí", "PR": "Paraná", "RJ": "Rio de Janeiro",
            "RN": "Rio Grande do Norte", "RO": "Rondônia",
            "RR": "Roraima", "RS": "Rio Grande do Sul",
            "SC": "Santa Catarina", "SE": "Sergipe", "SP": "São Paulo",
            "TO": "Tocantins"}

const SELECTORS = ["year", "phase", "region", "uf", "institution", "team"];

/******************************************************************************
 * Funções para obter conjunto de dados.                                      *
 ******************************************************************************/
/**
 * Retorna as informações referentes à opção dada.
 *
 * As informações são organizadas em uma estrutura de árvore, utilizando um
 * objeto dicionário. Cada chave representa uma instância da opção solicitada,
 * e cada valor associado é um novo dicionário contendo as detalhes da instância.
 *
 * A atual implementação considera que há o objeto CONTESTS (dicionário), que
 * já deve ter sido criado, contendo as informações.
 *
 * @param {string}   selector    Define a fonte de informação desejada (um de SELECTORS).
 *
 * @return {object} Dicionário contendo as informações solicitadas.
 */
function fetchDataFor(selector) {
  var info = CONTESTS;
  for (let s of SELECTORS) {
    if (isDefault(s) || s == selector)
      break;

    info = info[current(s)];
  }

  return info;
}

/**
 * Retorna a informação agregada referente à opção dada.
 *
 * As informações são organizadas em uma estrutura de árvore, utilizando um
 * objeto dicionário. Cada chave representa uma instância da opção solicitada,
 * e cada valor associado é um novo dicionário contendo as detalhes da instância.
 *
 * A atual implementação considera que há o objeto AGGREGATED (dicionário), que
 * já deve ter sido criado, contendo as informações.
 *
 * @see  aggregateInfo
 *
 * @param {string}   metric      Define a forma de agregação dos valores.
 * @param {string}   feature     Define para qual tipo de dado se quer agregar.
 * @param {string}   selector    Define a fonte de informação desejada (um de SELECTORS).
 *
 * @return {Number} Valor resultante da agregação.
 */
function fetchAggregatedDataFor(metric, feature, selector) {
  var info = AGGREGATED[metric][feature];

  for (let sel of SELECTORS) {
    info = info[current(sel)];
    if (sel == selector)
      break;
  }

  // Caso não haja informação do resultado agregado, retorna 0.
  return (info === undefined ? 0 : info["Value"]);
}

/******************************************************************************
 * Outras funções                                                             *
 ******************************************************************************/

function addOptionsToSelector(selector) {
  var e = document.getElementById(`${selector}Selector`),
    options = Object.keys(fetchDataFor(selector)).sort(caseInsensitive);

  for (let text of options) {
    var option = document.createElement("option");
    option.text = text;
    e.add(option);
  }
}

function changeDisplay(selector, value) {
  if (selector != "phase")
    document.getElementById(`${selector}Img`).style.display = value;
}

function defaultAggregatedStats(selector) {
  var competidoras = fetchAggregatedDataFor("Count", "Girls", selector),
      times = fetchAggregatedDataFor("Count", "Teams", selector),
      percCompetidoras = 100 * competidoras / (3 * times);

  return `${times} times inscritos, <span class="female">` +
         `competidoras: ${competidoras} (${percCompetidoras.toFixed(1)}%)` +
         `</span>`;
}

function followingSelectors(selector, reverse=false) {
  if (reverse)
    return SELECTORS.slice(SELECTORS.indexOf(selector) + 1).reverse();
  return SELECTORS.slice(SELECTORS.indexOf(selector) + 1);
}

function includeSelectorsHTML() {
  function selectorHTML(selector) {
    return `<select id="${selector}Selector" onchange="selectorChanged('${selector}')" class="selector">
            <option value="${DEFAULT_NAME[selector]}">${DEFAULT_NAME[selector]}</option>
        </select>`;
  }

  for (let sel of SELECTORS)
    selectors.innerHTML += selectorHTML(sel);

  addOptionsToSelector(SELECTORS[0]);
}

// Atualização dos dados.
function selectorChanged(selector) {
  // Remove options, images and statistics for following selectors.
  for (let sel of followingSelectors(selector, true)) {
    removeSelectorOptions(document.getElementById(`${sel}Selector`));
    changeDisplay(sel, "none");
    document.getElementById(`${sel}Stat`).innerHTML = "";
  }
  statHeader.innerHTML = "";

  if (isDefault(selector)) {
    changeDisplay(selector, "none");
    document.getElementById(`${selector}Stat`).innerHTML = "";
  } else {
    changeDisplay(selector, "inline");

    // Update options for the following selectors.
    if (selector != "team") { // team has no following selector
      var next = followingSelectors(selector)[0];
      addOptionsToSelector(next);
    }

    // Update statistics for selection.
    window[`${selector}Changed`]();
  }
}

function yearChanged() {
  yearImg.src = `img/event/${current("year")}/poster.jpg`;
  yearStat.innerHTML = `${current("year")}: ${defaultAggregatedStats("year")}`;
}

function phaseChanged() {
  phaseStat.innerHTML = `${current("phase")}: ${defaultAggregatedStats("phase")}`;
}

function regionChanged() {
  regionImg.src = regionImgSrc();
  regionStat.innerHTML = `${current("region")}: ${defaultAggregatedStats("region")}, ` +
                         `rank médio: ${fetchAggregatedDataFor("Mean", "Rank", "region").toFixed(0)}`;
}

function ufChanged() {
  ufImg.src = ufImgSrc();
  ufStat.innerHTML = `${UF[current("uf")]}: ${defaultAggregatedStats("uf")}, ` +
                     `rank médio: ${fetchAggregatedDataFor("Mean", "Rank", "uf").toFixed(0)}`;
}

function institutionChanged() {
  institutionImg.onerror=`this.src="img/empty.png"`;
  institutionImg.src = institutionImgSrc();
  institutionStat.innerHTML = `${current("institution")}: ${defaultAggregatedStats("institution")}, ` +
                              `rank médio: ${fetchAggregatedDataFor("Mean", "Rank", "institution").toFixed(0)}`;
}

function teamChanged() {
  var teamInfo = fetchDataFor("team")[current("team")];

  // Team info.
  var contestants = '<span class="contestant">';
  for (let i in teamInfo["Contestants"])
    contestants += `<span class="${teamInfo["Sex"][i].toLowerCase()}">${teamInfo["Contestants"][i]}</span>, `;
  contestants = `<span class="contestant">${contestants.slice(0, -2)}</span></span>`;

  var coach = `<span class="coach">${teamInfo["Coach"]} (coach)</span>`;

  var rank = `Rank Geral: ${showRank(teamInfo["Rank"])}`;
  if (current("phase") == PHASES[0])
    rank += ` e rank na Sede ${teamInfo["Site"]}: ${showRank(teamInfo["SiteRank"])}.`;

  // Update stat.
  teamImg.src = teamImgSrc(current("year"), current("phase"), teamInfo["Rank"]);
  statHeader.innerHTML = current("team");
  var heightPx = statHeader.clientHeight / 2;

  console.log(rankImg(current("phase"), heightPx, teamInfo["Rank"]));
  statHeader.innerHTML = `${rankImg(current("phase"), heightPx, teamInfo["Rank"])} ${statHeader.innerHTML}`;
  if (current("phase") == PHASES[0])
    statHeader.innerHTML = `${rankImg(current("phase"), heightPx, teamInfo["SiteRank"])} ${statHeader.innerHTML}`;
  teamStat.innerHTML = `${contestants} e ${coach}.<br>${rank}`;
}

/******************************************************************************
 * SETUP                                                                      *
 ******************************************************************************/
if (typeof CONTESTS === "undefined") {
  document.write("Erro...<br><br>Não há dados carregados!");
} else {
  includeSelectorsHTML();

  // Agregando os dados para diversos eventos.
  for (let metric in AGGREGATED) {
    for (let feature in AGGREGATED[metric]) {
      var featureCounter = 0;

      for (let year in AGGREGATED[metric][feature]) {
        var yearCounter = 0;

        for (let phase in AGGREGATED[metric][feature][year])
          yearCounter += AGGREGATED[metric][feature][year][phase]["Value"]

        AGGREGATED[metric][feature][year]["Value"] = yearCounter;
        featureCounter += yearCounter;

        if (metric == "Mean")
          AGGREGATED[metric][feature][year]["Value"] /= (AGGREGATED[metric][feature][year].length - 1); // -1 para descontar "Value"
      }

      AGGREGATED[metric][feature]["Value"] = featureCounter;

      if (metric == "Mean")
        AGGREGATED[metric][feature]["Value"] /= (AGGREGATED[metric][feature].length - 1); // -1 para descontar "Value"
    }
  }
}