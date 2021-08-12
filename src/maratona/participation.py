import os

# Constants
GROUPS = ['Year', 'Phase', 'Region', 'UF']


def dict_to_json(info):
    from json import dumps
    return dumps(info, indent=2, ensure_ascii=False)


def _write_to_file(name, info, overwrite):
    participation_js = f'../docs/js/data/{name.lower()}.js'

    if os.path.isfile(participation_js) and not overwrite:
        print(f'Não sobrescrever o arquivo "{participation_js}" '
              '(veja a opção "-o").')
    else:
        with open(participation_js, 'w', encoding='utf-8') as file:
            file.write(f'{name.upper()} = {dict_to_json(info)};')


def _write_contestant_file(df, overwrite):
    df = df.sort_values(by=GROUPS + ['username'])

    contestants = {}
    for group, group_df in df.groupby(GROUPS + ['siteName', 'username']):
        year, phase, username = group[0], group[1], group[-1]
        for _, row in group_df.iterrows():
            if username not in contestants:
                contestants[username] = {'FullName': row['FullName']}
            if phase not in contestants[username]:
                contestants[username][phase] = {}

            contestants[username][phase][year] = row['teamRank']

    _write_to_file('contestants', contestants, overwrite)


def _write_institution_file(df, overwrite):
    df = df.sort_values(by=GROUPS + ['instName', 'teamRank'])

    institutions = {}
    for group, group_df in df.groupby(GROUPS + ['instName']):
        year, phase, uf, inst = group[0], group[1], group[-2], group[-1]

        if uf not in institutions:
            institutions[uf] = {}
        if inst not in institutions[uf]:
            institutions[uf][inst] = {}
        if phase not in institutions[uf][inst]:
            institutions[uf][inst][phase] = {}

        institutions[uf][inst][phase][year] = {
            'Team': group_df['teamName'].nunique(),
            'BestRank': int(group_df.iloc[0]['teamRank'])}

    _write_to_file('institutions', institutions, overwrite)


def to_file(df, overwrite=False):
    df = df[(df['role'] == 'CONTESTANT') & (df['teamRank'] > 0)]
    _write_contestant_file(df, overwrite)
    _write_institution_file(df, overwrite)
