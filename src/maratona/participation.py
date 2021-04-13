import os


def dict_to_json(json_str):
    from json import dumps
    return dumps(json_str, indent=2, ensure_ascii=False)


def update_contestants(contestants, year, phase, df):
    for _, row in df[df['Role'] == 'Contestant'].iterrows():
        if row['Username'] not in contestants:
            contestants[row['Username']] = {'FullName': row['FullName']}
        if phase not in contestants[row['Username']]:
            contestants[row['Username']][phase] = {}

        contestants[row['Username']][phase][year] = row["Rank"]


def update_institutions(institutions, year, phase, df):
    df = df[df['Role'] == 'Contestant'].sort_values(by=['Region', 'UF', 'Site',
                                                        'Rank'])
    for group, group_df in df.groupby(['Region', 'UF', 'Site', 'Institution']):
        uf, inst = group[1], group[-1]

        if uf not in institutions:
            institutions[uf] = {}
        if inst not in institutions[uf]:
            institutions[uf][inst] = {}
        if phase not in institutions[uf][inst]:
            institutions[uf][inst][phase] = {}

        institutions[uf][inst][phase][year] = {
            'Team': group_df['Team'].nunique(),
            'BestRank': int(group_df.iloc[0]['Rank'])}


def to_file(name, info, overwrite=False):
    participation_js = f'../docs/js/data/{name.lower()}.js'

    if os.path.isfile(participation_js) and not overwrite:
        print(f'Não sobrescrever o arquivo "{participation_js}" '
              '(veja a opção "-o").')
    else:
        with open(participation_js, 'w', encoding='utf-8') as file:
            file.write(f'{name.upper()} = {dict_to_json(info)};')
