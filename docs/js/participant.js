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
    chart.style.display = "none";
    document.getElementById(`${selector}Stat`).innerHTML = "";
  } else {
    chart.style.display = "inline";
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

  chart.style.display = "none";
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

  drawCurveTypes(info, false);
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

  drawCurveTypes(info, true);
}


function drawCurveTypes(info, isContestant) {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Year');

  var minYear = new Date().getFullYear(), maxYear = 1995, years, row;
  for (let phase of PHASES) {
    data.addColumn('number', phase);
    if (info[phase]) {
      years = Object.keys(info[phase]).sort();
      if (minYear > years[0])
        minYear = years[0];
      if (maxYear < years[years.length - 1])
        maxYear = years[years.length - 1];
    }
  }

  for (var year = Number(minYear); year <= maxYear; year++) {
    row = [year.toString()];
    for (let phase of PHASES)
      if (info[phase] && info[phase][year])
        row.push(isContestant ? info[phase][year] : info[phase][year]["BestRank"]);
      else
        row.push(null);

    data.addRow(row);
  }

  var options = {hAxis: {title: 'Ano'},
                 vAxis: {title: 'Rank'},
                 legend: {position: 'top'}};

  var lineChart = new google.visualization.LineChart(chart);
  lineChart.draw(data, options);
}

/******************************************************************************
 * SETUP                                                                      *
 ******************************************************************************/

if (typeof CONTESTANTS === "undefined" || typeof INSTITUTIONS === "undefined") {
  document.write("Erro...<br><br>Não há dados carregados!");
} else {
  google.charts.load('current', {packages: ['corechart', 'line']});
  populateSelectors();
}