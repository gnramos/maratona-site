"""Processes DataFrame to extract information on institution/student
participation and writes it to JS files.
"""

import os
from json import dumps, loads


def to_file(df):
    JS_FILE = '../docs/js/data/history.js'
    GROUPS = ['Year', 'Phase', 'Region', 'UF']

    df = df[(df['role'] == 'CONTESTANT') & (df['teamRank'] > 0)]

    # Load file info.
    if os.path.isfile(JS_FILE):
        with open(JS_FILE, 'r') as file:
            content = file.read()

        if not (content and content.startswith('HISTORY = {')):
            raise ValueError(f'file {JS_FILE} not properly formatted')

        _, json = content.split(' = ', 1)
        info = loads(json[:-1])  # -1 to remove trailing ';'
    else:
        info = {}

    # Add df content to info.
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

        for _, row in group_df.iterrows():
            if 'Contestants' not in info[uf][inst]:
                info[uf][inst]['Contestants'] = {}
            if row['username'] not in info[uf][inst]['Contestants']:
                info[uf][inst]['Contestants'][row['username']] = {'FullName': row['FullName']}
            if phase not in info[uf][inst]['Contestants'][row['username']]:
                info[uf][inst]['Contestants'][row['username']][phase] = {}

            info[uf][inst]['Contestants'][row['username']][phase][year] = row['teamRank']

    # Overwrite file.
    with open(JS_FILE, 'w', encoding='utf-8') as file:
        file.write(f'HISTORY = {dumps(info, indent=2, ensure_ascii=False)};')
