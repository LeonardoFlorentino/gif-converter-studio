# GIF Converter Studio

App desktop (Electron) para converter videos `.mp4` em `.gif` com interface drag-and-drop.

## Requisitos

- Node.js 18+
- Windows, macOS ou Linux

> O projeto usa `ffmpeg-static`, entao nao precisa instalar ffmpeg globalmente.

## Como rodar

```bash
npm install
npm start
```

## Gerar executavel Windows (.exe)

```bash
npm run build:win
```

Saida em `dist/` com instalador NSIS em modo one-click.

## Como usar

1. Arraste um ou varios arquivos `.mp4` para a area principal (ou clique para selecionar).
2. Selecione a pasta de destino (por exemplo, `public/demos` do seu projeto).
3. Escolha o preset:
	- `Custom`: usa os valores atuais dos campos.
	- `README GitHub (leve)`: aplica automaticamente `fps=10`, `width=480`, `duration=8`.
4. Ajuste FPS, largura e duracao maxima se necessario.
5. Clique em **Converter lote para GIF**.

## Observacoes

- Formato de entrada suportado: `.mp4`
- O GIF final usa pipeline de paleta (`palettegen/paletteuse`) para qualidade melhor.
- Conversao em lote processa os videos em sequencia.
- Voce pode escolher manter ou remover o MP4 original apos a conversao.

## Proximos passos recomendados

- Adicionar botao para abrir automaticamente a pasta `public` de um projeto.
- Adicionar fila com progresso individual por arquivo.
- Permitir presets personalizados salvos localmente.
