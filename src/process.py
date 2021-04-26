import argparse
from maratona import event, report, participation


parser = argparse.ArgumentParser()
parser.add_argument('files', type=str, nargs='*',
                    help='Arquivo(s) com relatório(s) do ICPC a processar.')
parser.add_argument('-g', '--guess-uf', action='store_true',
                    help='Tentar adivinhar a UF da instituição.')
parser.add_argument('-e', '--eventos', action='store_true',
                    help='Processa o(s) evento(s).')
parser.add_argument('-p', '--participacoes', action='store_true',
                    help='Processa o histórico de participações.')
parser.add_argument('-q', '--quiet', action='store_true',
                    help='Não mostrar as mensagens informativas.')
parser.add_argument('-o', '--overwrite', action='store_true',
                    help='Sobrescrever arquivos.')
args = parser.parse_args()


df_part = None
for file in args.files:
    year, phase, df = report.process(file, args.guess_uf, not args.quiet)

    if df is not None:
        if args.eventos:
            event.to_file(year, phase, df, args.overwrite)
            event.load_js_in_html(year, phase)

        if args.participacoes:
            df['Phase'] = phase
            df['Year'] = year
            if df_part is None:
                df_part = df
            else:
                df_part = df_part.append(df, verify_integrity=True,
                                         ignore_index=True)

if args.participacoes:
    print('Processando as participações...')
    participation.to_file(df_part, args.overwrite)
