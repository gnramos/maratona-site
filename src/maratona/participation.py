"""Processes DataFrame to extract information on institution/student
participation and writes it to JS files.
"""

# Constants
GROUPS = ['Year', 'Phase', 'Region', 'UF']


def _add_contestants(df, info):
    df = df.sort_values(by=GROUPS + ['username'])

    for group, group_df in df.groupby(GROUPS + ['siteName', 'username']):
        year, phase, username = group[0], group[1], group[-1]
        for _, row in group_df.iterrows():
            if username not in info:
                info[username] = {'FullName': row['FullName']}
            if phase not in info[username]:
                info[username][phase] = {}

            info[username][phase][year] = row['teamRank']


def _add_institutions(df, info):
    df = df.sort_values(by=GROUPS + ['instName', 'teamRank'])

    for group, group_df in df.groupby(GROUPS + ['instName']):
        year, phase, uf, inst = group[0], group[1], group[-2], group[-1]

        if uf not in info:
            info[uf] = {}
        if inst not in info[uf]:
            info[uf][inst] = {}
        if phase not in info[uf][inst]:
            info[uf][inst][phase] = {}

        info[uf][inst][phase][year] = {
            'Teams': group_df['teamName'].nunique(),
            'BestRank': int(group_df.iloc[0]['teamRank'])}


def to_file(df):
    import os
    from json import dumps, loads

    df = df[(df['role'] == 'CONTESTANT') & (df['teamRank'] > 0)]

    for name in ['contestants', 'institutions']:
        js_file = f'../docs/js/data/{name.lower()}.js'

        # Load file info.
        if os.path.isfile(js_file):
            with open(js_file, 'r') as file:
                content = file.read()

            if not (content and content.startswith(f'{name.upper()} = {{')):
                raise ValueError(f'file {js_file} not properly formatted')

            _, json = content.split(' = ', 1)
            info = loads(json[:-1])  # -1 to remove trailing ';'
        else:
            info = {}

        # Add df content to info.
        exec(f'_add_{name}(df, info)')

        # Overwrite file.
        with open(js_file, 'w', encoding='utf-8') as file:
            content = dumps(info, indent=2, ensure_ascii=False)
            file.write(f'{name.upper()} = {content};')
