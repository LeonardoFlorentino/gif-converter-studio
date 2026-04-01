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

## Como usar

1. Arraste um arquivo `.mp4` para a area principal (ou clique para selecionar).
2. Selecione a pasta de destino (por exemplo, `public/demos` do seu projeto).
3. Ajuste FPS, largura e duracao maxima.
4. Clique em **Converter para GIF**.

## Observacoes

- Formato de entrada suportado no MVP: `.mp4`
- O GIF final usa pipeline de paleta (`palettegen/paletteuse`) para qualidade melhor.
- Voce pode escolher manter ou remover o MP4 original apos a conversao.

## Proximos passos recomendados

- Adicionar botao para abrir automaticamente a pasta `public` de um projeto.
- Suportar lote (multiplos videos de uma vez).
- Gerar binario instalavel com `electron-builder`.
- Criar preset "GitHub README" com tamanho e FPS ideais para docs.

## Branch Protection Setup Note

Use a test pull request to make the `CI / validate` status check available in branch protection rules.
