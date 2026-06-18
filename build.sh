#!/usr/bin/env bash
# exit on error
set -o errexit

# Instala as dependências (caso falte no pipeline)
pip install -r requirements.txt

# Coleta os arquivos estáticos
python manage.py collectstatic --noinput

# Executa as migrações do banco de dados
python manage.py migrate