import os
import pandas as pd
import random
import re


# Arquivo com as informações consideradas corretas para cada instituição.
INSTITUTIONS_CSV = 'institutions.csv'
# Arquivo com possíveis formas de escrita dao nome das instituições.
ALIASES_CSV = 'aliases.csv'
# "Constantes" globais para armazenar informações dos arquivos CSV.
ALIASES, INSTITUTIONS = {}, {}

# Valores para região/sede usados na etapa "Nacional".
NATIONAL_REGION, NATIONAL_UF = 'Brasil', 'BR'

# Mapeamento das relações geográficas.
REGIONS = ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul']

REGION_UF = {REGIONS[0]: ['DF', 'GO', 'MS', 'MT'],
             REGIONS[1]: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN',
                          'SE'],
             REGIONS[2]: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
             REGIONS[3]: ['ES', 'MG', 'RJ', 'SP'],
             REGIONS[4]: ['PR', 'RS', 'SC']}

UF_REGION = {uf: region for region, ufs in REGION_UF.items() for uf in ufs}

STATE_UF = {'Acre': 'AC', 'Alagoas': 'AL', 'Amazonas': 'AM', 'Amapá': 'AP',
            'Bahia': 'BA',
            'Ceará': 'CE',
            'Distrito Federal': 'DF',
            'Espírito Santo': 'ES',
            'Goiás': 'GO',
            'Maranhão': 'MA', 'Minas Gerais': 'MG',
            'Mato Grosso do Sul': 'MS', 'Mato Grosso': 'MT',
            'Pará': 'PA', 'Paraíba': 'PB', 'Pernambuco': 'PE', 'Piauí': 'PI',
            'Paraná': 'PR',
            'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
            'Rondônia': 'RO', 'Roraima': 'RR', 'Rio Grande do Sul': 'RS',
            'Santa Catarina': 'SC', 'Sergipe': 'SE', 'São Paulo': 'SP',
            'Tocantins': 'TO'}

# Variações nos nomes de estados para lidar com falta de padronização da
# escrita.
ALIAS_STATE = {'acre': 'Acre',
               'alagoas': 'Alagoas',
               'amazonas': 'Amazonas',
               'amapa': 'Amapá',
               'bahia': 'Bahia',
               'ceara': 'Ceará',
               'distritofederal': 'Distrito Federal',
               'espíritosanto': 'Espírito Santo',
               'goias': 'Goiás',
               'maranhao': 'Maranhão',
               'minasgerais': 'Minas Gerais',
               'matogrossodosul': 'Mato Grosso do Sul',
               'matogrosso': 'Mato Grosso',
               'para': 'Pará',
               'paraiba': 'Paraíba',
               'pernambuco': 'Pernambuco',
               'piaui': 'Piauí',
               'parana': 'Paraná',
               'riodejaneiro': 'Rio de Janeiro',
               'riograndedonorte': 'Rio Grande do Norte',
               'rondonia': 'Rondônia',
               'roraima': 'Roraima',
               'riograndedosul': 'Rio Grande do Sul',
               'santacatarina': 'Santa Catarina',
               'sergipe': 'Sergipe',
               'saopaulo': 'São Paulo',
               'tocantins': 'Tocantins'}

SHORT = 'instShortName'  # melhorar a legibilidade do código
CONTESTANTS_PER_TEAM = 3  # número mágico
###############################################################################
# Funções auxiliares


def _alias(institution):
    return ALIASES.get(_normalize(institution), institution)


def _capitalize(string):
    return ' '.join(word.capitalize() for word in string.split())


def _check_data(df, is_1st_phase):
    problems = []

    short_df = df[df[SHORT].isna()][['instName']]
    missing_short = [g[0] for g in short_df.groupby('instName')]

    if missing_short:
        problem = 'Inclua o "short name" seguintes ' \
                  f'instituições no arquivo "{INSTITUTIONS_CSV}".'
        problems.append((problem, sorted(missing_short)))

    if is_1st_phase:
        uf_df = df[df['UF'] == NATIONAL_UF]
        missing_UF = [f'{_guess_institution_UF(g[1])},{g[0]},{g[1]}'
                      for g, _ in uf_df.groupby(by=[SHORT, 'instName'])]

        if missing_UF:
            problem = 'É preciso incluir as seguintes instituições no ' \
                      f'arquivo "{INSTITUTIONS_CSV}". A UF é apenas uma ' \
                      'sugestão, confirme a informação manualmente.'
            problems.append((problem, sorted(missing_UF)))

    # Ajustando a UF, a região é automaticamente corrigida (_preprocess).

    return problems


def _get_institution_UF(institution):
    if info := INSTITUTIONS.get(_normalize(institution), False):
        return info[0]

    return NATIONAL_UF


def _get_region(uf):
    if uf in UF_REGION:
        return UF_REGION[uf]

    UF_REGION[STATE_UF[ALIAS_STATE]]
    return ALIAS_STATE.get(_normalize(uf), NATIONAL_UF)


def _get_short_name(institution):
    if info := INSTITUTIONS.get(_normalize(institution), False):
        return info[1]

    return institution


def _get_UF(uf_or_statename):
    if uf_or_statename in UF_REGION:
        return uf_or_statename

    if uf_or_statename in ALIAS_STATE:
        return STATE_UF[ALIAS_STATE[uf_or_statename]]

    n_institution = _normalize(_alias(uf_or_statename))
    if info := INSTITUTIONS.get(n_institution, False):
        return info[0]

    return NATIONAL_UF


def _guess_institution_region(institution):
    uf = _guess_institution_UF(institution)
    if uf == NATIONAL_UF:
        return NATIONAL_REGION

    return UF_REGION[uf]


def _guess_institution_UF(institution, site=''):
    uf = _get_institution_UF(institution)
    if uf != NATIONAL_UF:
        return uf

    for state, uf in STATE_UF.items():
        if (re.search(f'\\b{state}\\b', institution, re.IGNORECASE) or
                re.search(f'\\b{_normalize(state, False)}\\b',
                          _normalize(institution, False), re.IGNORECASE) or
                re.search(f'\\b{uf}\\b', institution, re.IGNORECASE) or
                re.search(f'\\buf{uf[0]}[{uf[1]}]{{0,1}}\\b',
                          institution, re.IGNORECASE) or
                re.search(f'\\b{uf}\\b', site, re.IGNORECASE)):
            return uf

    return NATIONAL_UF


def _hash(text):
    text = [c for c in re.sub(r'[\W_]', '', text.lower())]
    random.seed(sum(ord(text[i]) for i in range(0, len(text), 2)))
    random.shuffle(text)
    return ''.join(text)


def _log(messages, level=0):
    if isinstance(messages, str):
        messages = [messages]

    for msg in messages:
        indent = '  ' * level
        print(f'{indent} {msg}')


def _normalize(text, remove_spaces=True):
    import unicodedata

    if remove_spaces:
        text = ''.join(text.split())

    text = unicodedata.normalize('NFD', text.lower()).encode('ascii', 'ignore')
    return str(text.decode('utf-8'))


def _get_site(site):
    parts = [p.strip() for p in site.split('-')]
    if len(parts) == 1:
        return ALIAS_STATE.get(_normalize(parts[0]), parts[0])
    return ALIAS_STATE.get(_normalize(parts[1]), parts[1])


def _preprocess(df, guess_uf=False, verbose=True):
    df['username'] = df['username'].apply(_hash)
    df['instName'] = df['instName'].apply(_alias)

    for i, row in df[df[SHORT].isna()].iterrows():
        df.at[i, SHORT] = _get_short_name(row['instName'])

    df['UF'] = [site.split('-')[0].strip() for site in df['siteName']]
    df['UF'] = df['UF'].apply(_get_UF)
    if guess_uf:
        for i, row in df[df['UF'] == NATIONAL_UF].iterrows():
            df.at[i, 'UF'] = _guess_institution_UF(row['instName'], row['siteName'])

    df['Region'] = [UF_REGION.get(uf, NATIONAL_REGION) for uf in df['UF']]
    df['siteName'] = df['siteName'].apply(_get_site)
    df['FullName'] = df['firstName'].apply(_capitalize) + ' ' + df['lastName'].apply(_capitalize)
    df['teamRank'] = df['teamRank'].fillna(0)
    df['SiteRank'] = df['teamRank']

    ranks = df[df['teamRank'] > 0].sort_values(by=['Region', 'siteName', 'teamRank'])
    for _, group_df in ranks.groupby(by=['Region', 'siteName']):
        for site_rank, (x, team_rank) in enumerate(group_df.groupby('teamRank')):
            df.at[team_rank.index, 'SiteRank'] = site_rank + 1

    df = df.drop(['firstName', 'lastName'], axis=1)

    return df


def _read_csv(file, verbose=True):
    df = pd.read_csv(file, encoding='utf-8')
    if verbose:
        _log(f'{df.shape[0]} registros.')

    df = df.drop(df[df['teamStatus'] != 'ACCEPTED'].index)
    if verbose:
        _log(f'{df.shape[0]} registros aceitos.')

    return df


def _show_statistics(df):
    teams = df['teamName'].unique()
    contestants = df[df['role'] == 'CONTESTANT']
    female_contestants = contestants[contestants['sex'] == 'FEMALE']
    all_female_teams = female_contestants[
        female_contestants.groupby('teamName')[
            'teamName'].transform('count') == CONTESTANTS_PER_TEAM]['teamName'].unique()
    coaches = df[df['role'] == 'COACH']
    student_coaches = df[df['role'] == 'STUDENT_COACH']

    _log(f'{len(df["instName"].unique()):4d} instituições.')
    _log(f'{len(coaches.groupby(["FullName"]).count().index):4d} coaches')
    _log(f'{len(student_coaches.groupby(["FullName"]).count().index):4d} '
         'student-coaches')
    _log(f'{contestants.shape[0]:4d} competidores em {len(teams)} times.')
    _log(f'{contestants.shape[0] - female_contestants.shape[0]:4d} alunOs em '
         f'{len(teams) - all_female_teams.shape[0]} times.')
    _log(f'{female_contestants.shape[0]:4d} alunA(s) em '
         f'{len(female_contestants["teamName"].unique())} time(s) ('
         f'{100 * female_contestants.shape[0] / contestants.shape[0]:.0f}% '
         'dos competidores)')
    if all_female_teams.size > 0:
        _log(f'{len(all_female_teams):4d} time(s) composto(s) apenas por '
             f'mulheres ({100 * len(all_female_teams) / len(teams):.1f}% '
             'dos times)')


def _show_region_best(df):
    _log('Campeões Regionais')
    for _, group_df in df.sort_values(['Region', 'teamRank']).groupby('Region'):
        _log(f'{group_df.iloc[0]["Region"]} > {group_df.iloc[0]["teamName"]}', 1)


def _show_site_best(df):
    _log('Campeões por Sede')
    sites = df.sort_values(by=['Region', 'UF', 'siteName', 'teamRank']).groupby(
            by=['Region', 'UF', 'siteName'])
    for _, group_df in sites:
        r = group_df.iloc[0]
        _log(f'{r["Region"]} > {r["UF"]} > {r["siteName"]} > {r["teamName"]}', 1)


# Função principal.
def process(file, guess_uf=False, verbose=True):
    """Processa o arquivo, gerando um DataFrame com as informações.

    Retorna uma tupla (ano, fase, DataFrame) com as informações do arquivo.
    """

    if verbose:
        _log(f'Processando "{file}"...')

    _, tail = os.path.split(file)
    name, _ = os.path.splitext(tail)
    year, phase = name.split('_')
    _log(f'{year} - {phase}')

    df = _read_csv(file, verbose)
    df = _preprocess(df, guess_uf, verbose)

    if problems := _check_data(df, phase != 'Nacional'):
        print("Pendências identificadas!")
        for description, details in problems:
            _log(f'- {description}', 1)
            for detail in details:
                _log(f'* {detail}', 2)

        if input("Continuar? (S/N) ") not in "sS":
            return None, None, None

    if verbose:
        _show_statistics(df)
        _show_region_best(df)
        _show_site_best(df)

    return year, phase, df
###############################################################################


# Carregar informações dos arquivos.
with open(ALIASES_CSV) as file:
    next(file)  # Remove header.
    for line in file:
        alias, name = line.split(',', 1)
        ALIASES[alias] = name.rstrip()

with open(INSTITUTIONS_CSV) as file:
    next(file)  # Remove header.
    for line in file:
        uf, short_name, institution = line.rstrip().split(',', 2)
        INSTITUTIONS[_normalize(institution)] = (uf, short_name, institution)

        if short_name:
            INSTITUTIONS[_normalize(short_name)] = (uf, short_name, institution)
