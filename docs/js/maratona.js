/**
 * Exibição de estatísticas dos eventos da Maratona de Programação SBC.
 *
 * Implementação de funções genéricas/comuns.
 *
 * @link   http://www.github.com/gnramos/maratona-site
 * @author Guilherme N. Ramos.
 */

/******************************************************************************
 * Constantes                                                                 *
 ******************************************************************************/

const DEFAULT_IMG = "img/MaratonaSBC.jpg";

const DEFAULT_NAME = {"contestant": "Competidor", "institution": "Instituição",
                      "phase": "Fase", "region": "Região", "team": "Time",
                      "uf": "UF", "year": "Ano"};

const IMG_PATH = "img";

const PHASES = ["1aFase", "Nacional"];

/******************************************************************************
 * Funções                                                                    *
 ******************************************************************************/

function caseInsensitive(a, b) {
  return a.localeCompare(b, 'pt-br', { sensitivity: 'base' });
}

function current(selector) {
  return document.getElementById(`${selector}Selector`).value;
}

function isDefault(selector) { // Indica se o valor é o padrão
  return (current(selector) == DEFAULT_NAME[selector]);
}

function removeSelectorOptions(selector, minimum=1) {
  var selectorList = (selector.constructor === Array ? selector : [selector]);
  for (let s of selectorList)
    while (s.options.length > minimum)
      s.remove(s.options.length - 1);
}

function regionImgSrc() {
  return `${IMG_PATH}/map/${current("region")}.png`;
}

function ufImgSrc() {
  return `${IMG_PATH}/map/${current("uf")}.png`;
}

function institutionImgSrc() {
  return `${IMG_PATH}/institution/${current("institution").replace(/\W/g, '').toLowerCase()}.png`;
}

function teamImgSrc(year, phase, rank) {
  return `${IMG_PATH}/event/${year}/${phase}/${rank}.jpg`;
}

function showRank(rank) {
  return (rank > 0 ? rank : "X");
}

function rankImg(phase, heightPx, rank, reverse=false) {
  var multiplier = (phase == "Nacional") ? 3 : 1,
  images = [], imgHTML = "";

  if (rank > 0)
    if (rank <= 1 * multiplier)
      images.push("gold_medal");
    else if (rank <= 2 * multiplier)
      images.push("silver_medal");
    else if (rank <= 3 * multiplier)
      images.push("bronze_medal");

  if (phase == "Nacional" && rank == 1)
    images.push("trophy");

  if (reverse)
    images = images.slice().reverse();

  for (let img of images)
    imgHTML += ` <img src="img/${img}.png" style="height:${heightPx}px; width: auto;"> `;

  return imgHTML;
}