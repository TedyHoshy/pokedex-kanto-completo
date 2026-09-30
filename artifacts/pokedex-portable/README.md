# Pokédex Kanto (portable)

No hace falta ningún archivo `.env`. La IA (Profesor Dex) va **dentro del proyecto**:
usa el catálogo de los 151 y responde siempre, aunque no haya clave de API.

## Arrancar

Necesitas Node.js 18 o superior.

```
cd pokedex-portable
npm install
npm start
```

Abre en el navegador la dirección que imprime la consola (por defecto el puerto 3000).

## Qué incluye

- Express + PokeAPI (solo 001–151)
- Fichas, gritos, sprites, juego de la sombra
- **Profesor Dex**: pestaña IA. Funciona sin internet extra.
- Error si pides un número mayor a 151

## IA (sin .env)

- Por defecto responde el **Profesor Dex local** (`ai.js` + `catalog.json`).
- Si quieres Grok, puedes exportar `XAI_API_KEY` en el sistema (variable de entorno de tu PC o del hosting). **No crees un archivo .env.** Si la clave falta o falla, la IA local sigue contestando.

```
# opcional, en la misma terminal, no en un archivo:
# Windows PowerShell:
#   $env:XAI_API_KEY="tu_clave"
# macOS / Linux:
#   export XAI_API_KEY="tu_clave"
npm start
```

## Estructura

```
pokedex-portable/
  package.json
  server.js
  ai.js
  catalog.json
  public/
```
