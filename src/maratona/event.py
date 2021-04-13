import os

# Constants
GROUPS = ['Region', 'UF', 'Institution']


def _aggregate_count_girls(df):
    count, filters = {}, []
    for col in GROUPS:
        filters.append(col)
        for items, group in df[filters + ['Sex']].groupby(filters):
            aux_dict = count
            names = [items] if isinstance(items, str) else items
            for k in names:
                if k not in aux_dict:
                    aux_dict[k] = {}
                aux_dict = aux_dict[k]
            # json não reconhece tipos do NumPy.
            aux_dict['Value'] = int(group[
                group['Sex'] == 'Female']['Sex'].count())

    count['Value'] = sum(item['Value'] for item in count.values())
    return count


def _aggregate_count_teams(df):
    count, filters = {}, []
    for col in GROUPS:
        filters.append(col)
        for items, group in df[filters + ['Team']].groupby(filters):
            aux_dict = count
            names = [items] if isinstance(items, str) else items
            for k in names:
                if k not in aux_dict:
                    aux_dict[k] = {}
                aux_dict = aux_dict[k]
            # json não reconhece tipos do NumPy.
            aux_dict['Value'] = group['Team'].nunique()

    count['Value'] = sum(item['Value'] for item in count.values())
    return count


def _aggregate_mean_rank(df):
    mean, filters = {}, []
    for col in GROUPS:
        filters.append(col)
        for i, row in df[df['Rank'] > 0].groupby(filters).mean().iterrows():
            aux_dict = mean
            names = [row.name] if isinstance(row.name, str) else row.name
            for k in names:
                if k not in aux_dict:
                    aux_dict[k] = {}
                aux_dict = aux_dict[k]
            aux_dict['Value'] = float(row['Rank'])

    return mean


def _aggregate_to_js(year, phase, df):
    return (f'{_aggregate_javascript("Mean", "Rank",  year, phase, df)}\n\n'
            f'{_aggregate_javascript("Count", "Girls",  year, phase, df)}\n\n'
            f'{_aggregate_javascript("Count", "Teams",  year, phase, df)}\n')


def _aggregate_javascript(metric, feature, year, phase, df):
    event = eval(f'_aggregate_{metric.lower()}_{feature.lower()}(df)')
    json = dict_to_json(event)

    return f'''if (AGGREGATED === undefined)
  var AGGREGATED = {{}};
if (AGGREGATED["{metric}"] === undefined)
  AGGREGATED["{metric}"] = {{}};
if (AGGREGATED["{metric}"]["{feature}"] === undefined)
  AGGREGATED["{metric}"]["{feature}"] = {{}};
if (AGGREGATED["{metric}"]["{feature}"][{year}] === undefined)
  AGGREGATED["{metric}"]["{feature}"][{year}] = {{}};

AGGREGATED["{metric}"]["{feature}"][{year}]["{phase}"] = {json};
'''


def dict_to_json(event):
    from json import dumps
    return dumps(event, indent=2, ensure_ascii=False)


def load_js_in_html(year, phase):
    from datetime import date

    js = f'{year}_{phase}.js'

    with open('../docs/event.html') as file:
        html = file.read()

    if js not in html:
        placeholder = '<!-- <script src="js/data/YYYY_FASE.js"></script> -->'
        padding = ' ' * (len('Nacional') - len(phase))
        script = f'<script src="js/data/{js}"></script> {padding}' \
                 '<!-- Added automatically in ' \
                 f'{date.today().strftime("%d/%m/%Y")} -->'
        html = html.replace(placeholder, f'{placeholder}\n    {script}')

        with open('../docs/event.html', 'w') as file:
            file.write(html)


def _to_js(year, phase, df):
    event = {}
    contestants = df[df['Role'] == 'Contestant']
    coaches = df[df['Role'] == 'Coach']
    for group in contestants.groupby(by=['Region', 'UF',
                                         'Institution', 'Team']):
        r, u, i, t = group[0]
        if r not in event:
            event[r] = {u: {i: {}}}
        elif u not in event[r]:
            event[r][u] = {i: {}}
        elif i not in event[r][u]:
            event[r][u][i] = {}

        coach = ''
        if t in coaches['Team'].values:
            coach = coaches.loc[coaches['Team'] == t].iloc[0]['FullName']
        else:
            coach = df.loc[(df['Role'] == 'Student Coach') &
                           (df['Team'] == t)].iloc[0]['FullName']

        # int(Rank) pois json não reconhece tipos do NumPy.
        event[r][u][i][t] = {'Rank': int(group[1].iloc[0]['Rank']),
                             'SiteRank': int(group[1].iloc[0]['SiteRank']),
                             'Site': group[1].iloc[0]['Site'],
                             'Short name': group[1].iloc[0][
                                'Institution short name'],
                             'Contestants': list(group[1]['FullName']),
                             'Sex': list(group[1]['Sex']),
                             'Coach': coach}

    event_js = f'''if (CONTESTS === undefined)
  var CONTESTS = {{}};
if (CONTESTS[{year}] === undefined)
  CONTESTS[{year}] = {{}};

CONTESTS[{year}]["{phase}"] = {dict_to_json(event)};
'''

    return event_js


def to_file(year, phase, df, overwrite=False):
    event_js = f'../docs/js/data/{year}_{phase}.js'

    if os.path.isfile(event_js) and not overwrite:
        print(f'Não sobrescrever o arquivo "{event_js}" (veja a opção "-o").')
    else:
        with open(event_js, 'w', encoding='utf-8') as file:
            file.write(_to_js(year, phase, df))
            file.write('\n\n')
            file.write(_aggregate_to_js(year, phase, df))
