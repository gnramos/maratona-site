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
 * Outras funções                                                             *
 ******************************************************************************/

// Atualização dos dados.
function selectorChanged(selector) {
  statistics.style.display = "none";
  participantStat.innerHTML = "";
  participantImg.style.display = "none";
  window[`${selector}Changed`]();
}

function populateSelectors() {
  ufSelector.options.add(new Option(DEFAULT_NAME["uf"]));
  var info = HISTORY;
  for (let text of Object.keys(info).sort(caseInsensitive))
    ufSelector.options.add(new Option(text));

  institutionSelector.options.add(new Option(DEFAULT_NAME["institution"]));

  contestantSelector.options.add(new Option(DEFAULT_NAME["contestant"]));
}

function ufChanged() {
  removeSelectorOptions(institutionSelector);
  removeSelectorOptions(contestantSelector);

  if (!isDefault("uf")) {
    var info = HISTORY[current("uf")];
    for (let text of Object.keys(info).sort(caseInsensitive))
      institutionSelector.options.add(new Option(text));
  }
}

function institutionChanged() {
  removeSelectorOptions(contestantSelector);

  if (!isDefault("institution")) {
    var info = HISTORY[current("uf")][current("institution")]['Contestants'];
    var items = Object.keys(info).map(function(key) { return [key, info[key]['FullName']]; });
    items.sort(function(a, b) { return caseInsensitive(a[1], b[1]); });
    for (let item of items)
      contestantSelector.options.add(new Option(item[1], item[0]));

    showInstitution();
  }
}

function contestantChanged() {
  if (isDefault("contestant"))
    showInstitution();
  else
    showContestant();
}

function showInstitution() {
  statistics.style.display = "inline";
  statHeader.innerHTML = current('institution');

  statHeader.innerHTML = current("institution");

  participantImg.src = institutionImgSrc();
  participantImg.style.display = "inline";

  participantStat.innerHTML = `Participações:`;

  var heightPx = participantStat.clientHeight - 2;

  var info = HISTORY[current("uf")][current("institution")];
  for (let phase of PHASES) {
    if (info[phase]) {
      participantStat.innerHTML += `<br>${phase}<ul>`;
      for (let year of Object.keys(info[phase]).sort()) {
        participantStat.innerHTML += `<li>${year} ${info[phase][year]["Teams"]} time(s) (Melhor Rank: ${showRank(info[phase][year]["BestRank"])}${rankImg(phase, heightPx, info[phase][year]["BestRank"])})</li>`;
      }
      participantStat.innerHTML += `</ul>`;
    }
  }

  drawCurveTypes(info, false);
}

function showContestant() {
  statistics.style.display = "inline";
  statHeader.innerHTML = current('contestant');

  var info = HISTORY[current("uf")][current("institution")]['Contestants'][current("contestant")];
  statHeader.innerHTML = info["FullName"];

  participantImg.src = `img/contestant/${current("contestant")}`;
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

function toolTip(phase, rank) {
  return `<div style="padding:5px 5px 5px 5px; min-width:75px;"><strong>Rank:</strong> ${rank} ${rankImg(phase, 12, rank)}</div>`;
}

function drawCurveTypes(info, isContestant) {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Year');

  var minYear = new Date().getFullYear(), maxYear = 1995, years, row;
  for (let phase of PHASES) {
    data.addColumn('number', phase);
    data.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}});
    if (info[phase]) {
      years = Object.keys(info[phase]).sort();
      if (minYear > years[0])
        minYear = years[0];
      if (maxYear < years[years.length - 1])
        maxYear = years[years.length - 1];
    }
  }

  var rank;
  for (var year = Number(minYear); year <= maxYear; year++) {
    row = [year.toString()];
    for (let phase of PHASES)
      if (info[phase] && info[phase][year]) {
        rank = isContestant ? info[phase][year] : info[phase][year]["BestRank"];
        row.push(rank, toolTip(phase, rank));
      }
      else
        row.push(null, '');

    data.addRow(row);
  }

  var options = {hAxis: {title: 'Ano'},
                 vAxis: {title: 'Rank', baseline: 1},
                 legend: {position: 'top'},
                 tooltip: {isHtml: true}};

  var lineChart = new google.visualization.LineChart(chart);
  lineChart.draw(data, options);
}

/******************************************************************************
 * SETUP                                                                      *
 ******************************************************************************/

if (typeof HISTORY === "undefined") {
  document.write("Erro...<br><br>Não há dados carregados!");
} else {
  google.charts.load('current', {packages: ['corechart', 'line']});
  populateSelectors();
}