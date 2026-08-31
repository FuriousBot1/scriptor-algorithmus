# Scriptor Algorithmus

PWA de notas em cards (tema carbono, pt-BR, Android-first). Vite + React 19 + TypeScript.

GitHub Pages: https://furiousbot1.github.io/scriptor-algorithmus/

## Como rodar

npm install
npm run dev          # http://localhost:5173
npm run build
npm run preview      # http://127.0.0.1:4173
npx playwright test

## Instalar no Chrome

1. Abra o app (dev, preview ou Pages).
2. Menu do Chrome: Instalar Scriptor (icone de instalacao na barra).
3. No Android Chrome: Adicionar a tela inicial.

## Google Drive (opcional)

OAuth nao esta configurado por padrao. Sem VITE_SCRIPTOR_CLIENT_ID os itens de Drive no menu ficam ocultos.

Quando tiver um Client ID:

1. Copie .env.example para .env
2. Descomente e preencha VITE_SCRIPTOR_CLIENT_ID
3. Origens autorizadas no Google Cloud:
   - https://furiousbot1.github.io
   - http://localhost:5173
4. Escopo: drive.file. O app nao cria arquivos (files.create); usa files.get / files.update no id em VITE_SCRIPTOR_FILE_ID ou no picker.

Nao commite .env nem tokens.
