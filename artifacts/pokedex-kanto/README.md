# Pokédex Kanto (151)

Dos carpetas:

## 1) express/  — para abrirla en tu PC (Express + PokeAPI)

```
cd express
npm install
npm start
```

Luego abre http://localhost:3000

Incluye: búsqueda por nombre o número, error si pides más del 151,
fichas, gritos, sprites, juego de la sombra.

## 2) react-src/  — código de la Pokédex de la vista previa

Es el código React (lista, ficha, sombra, IA, favoritos, carcasa de dos tapas).
No es un proyecto Node listo para `npm start`; sirve para copiar, estudiar o
montar en tu propio proyecto.

Estructura:

```
pokedex-kanto/
├── README.md
├── favicon.svg
├── express/          ← ejecuta esto
│   ├── server.js
│   ├── package.json
│   └── public/
└── react-src/        ← código de la app visual
    └── src/
        ├── components/pokedex/
        ├── lib/pokemon/
        ├── routes/
        └── styles.css
```
