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


contestants, institutions = {}, {}
for file in args.files:
    year, phase, df = report.process(file, args.guess_uf, not args.quiet)

    if df is not None:
        if args.eventos:
            event.to_file(year, phase, df, args.overwrite)
            event.load_js_in_html(year, phase)

        if args.participacoes:
            participation.update_contestants(contestants, year, phase, df)
            participation.update_institutions(institutions, year, phase, df)

if args.participacoes:
    participation.to_file('Contestants', contestants, args.overwrite)
    participation.to_file('Institutions', institutions, args.overwrite)
