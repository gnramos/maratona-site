/**
 * Exibição de participações em eventos da Maratona de Programação SBC.
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

const SELECTORS = ["uf", "institution", "contestant"];

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
 * @param {string}   selector    Define a fonte de informação desejada.
 * @param {string}   source      O dicionário contendo os dados.
 *
 * @return {object} Dicionário contendo as informações solicitadas.
 */
function fetchDataFor(selector, source) {
  if (selector == "contestant")
    return source;

  if (selector == "uf")
    return source;

  return source[current("uf")];
}

/******************************************************************************
 * Outras funções                                                             *
 ******************************************************************************/

function populateSelectors() {
  // UF
  var info = fetchDataFor("uf", INSTITUTIONS),
      option = document.createElement("option");

  option.text = "UF";
  ufSelector.add(option);
  for (let text of Object.keys(info).sort(caseInsensitive)) {
    option = document.createElement("option");
    option.text = text;
    ufSelector.add(option);
  }

  // Instituição
  option = document.createElement("option");
  option.text = "Instituição";
  institutionSelector.add(option);

  // Contestants
  option = document.createElement("option");
  option.text = "Competidores";
  contestantSelector.add(option);

  info = fetchDataFor("contestant", CONTESTANTS);
  var items = Object.keys(info).map(function(key) { return [key, CONTESTANTS[key]['FullName']]; });
  items.sort(function(a, b) { return caseInsensitive(a[1], b[1]); });

  for (let item of items) {
    var option = document.createElement("option");
    option.value = item[0];
    option.text = item[1];
    contestantSelector.add(option);
  }
}

// Atualização dos dados.
function selectorChanged(selector) {
  // Remove options, images and statistics for following selectors.
  for (let sel of SELECTORS) {
    participantImg.style.display = "none";
    participantStat.innerHTML = '';
  }

  if (isDefault(selector)) {
    participantImg.style.display = "none";
    document.getElementById(`${selector}Stat`).innerHTML = "";
  } else {
    statHeader.innerHTML = current(selector);
    window[`${selector}Changed`]();
  }
}

function ufChanged() {
  removeSelectorOptions(institutionSelector);
  contestantSelector.options[0].selected = 'selected';

  var info = fetchDataFor("instititution", INSTITUTIONS);
  for (let text of Object.keys(info).sort(caseInsensitive)) {
    var option = document.createElement("option");
    option.text = text;
    institutionSelector.add(option);
  }
}

function institutionChanged() {
  contestantSelector.options[0].selected = 'selected';

  participantImg.src = institutionImgSrc();
  participantImg.style.display = "inline";

  participantStat.innerHTML = `Participações:`;

  var heightPx = participantStat.clientHeight - 2;

  var info = fetchDataFor("institution", INSTITUTIONS)[current("institution")];
  for (let phase of PHASES) {
    if (info[phase]) {
      participantStat.innerHTML += `<br>${phase}<ul>`;
      for (let year of Object.keys(info[phase]).sort()) {
        participantStat.innerHTML += `<li>${year} ${info[phase][year]["Team"]} time(s) (Melhor Rank: ${showRank(info[phase][year]["BestRank"])}${rankImg(phase, heightPx, info[phase][year]["BestRank"])})</li>`;
      }
      participantStat.innerHTML += `</ul>`;
    }
  }
}

function contestantChanged() {
  ufSelector.options[0].selected = 'selected';
  removeSelectorOptions(institutionSelector);

  // participantImg.src = `img/contestant/${info["Username"]}`;
  // participantImg.style.display = "inline";
  var info = fetchDataFor("contestant", CONTESTANTS)[current("contestant")];

  statHeader.innerHTML = info["FullName"];
  participantStat.innerHTML = `Participações:`;

  var heightPx = participantStat.clientHeight - 2;

  for (let phase of PHASES) {
    if (info[phase]) {
      participantStat.innerHTML += `<br>${phase}<ul>`;
      for (let year of Object.keys(info[phase]).sort())
        participantStat.innerHTML += `<li>${year} (Rank: ${showRank(info[phase][year])}${rankImg(phase, heightPx, info[phase][year])})</li>`;
      participantStat.innerHTML += `</ul>`;
    }
  }
}

/******************************************************************************
 * SETUP                                                                      *
 ******************************************************************************/

if (typeof CONTESTANTS === "undefined" || typeof INSTITUTIONS === "undefined") {
  document.write("Erro...<br><br>Não há dados carregados!");
} else {
  populateSelectors();
}