# 🔴 Pokédex - Generación 1 (151 Pokémon)

Pokédex completa de los primeros 151 Pokémon de la primera generación, hecha con **Express**, **PokeAPI** y un diseño retro inspirado en la Pokédex original de Rojo/Azul.

## Características

1. **Express** – Servidor Node.js que sirve la app y actúa de proxy a PokeAPI
2. **PokeAPI** – Todos los datos oficiales (stats, tipos, habilidades, descripciones…)
3. **Sonido de cada Pokémon** – Gritos originales (cries) al pulsar el botón 🔊
4. **Imágenes** – Sprites oficiales + pixel art de Generación 1
5. **Información completa** – Altura, peso, stats, habilidades, movimientos Gen 1, descripción, hábitat…
6. **Decoración de Pokédex Gen 1** – Carcasa roja, luces, pantalla verde, cruceta y botones
7. **Tipos y poder especial** – Badges de tipos + habilidades (incluyendo ocultas)
8. **Apartado “¿Quién es ese Pokémon?”** – Sombra de un Pokémon aleatorio; adivina el nombre
9. **Búsqueda** – Por número de Pokédex (1-151) o por nombre
10. **Errores controlados** – Si pides un Pokémon > 151 o inexistente, muestra error claro

## Cómo ejecutar

```bash
cd pokedex
npm install
npm start
```

Abre el navegador en: **http://localhost:3000**

## Estructura

```
pokedex/
├── server.js          # Express + rutas API + cache
├── package.json
├── public/
│   ├── index.html     # Interfaz principal
│   ├── style.css      # Estilo retro Pokédex
│   └── app.js         # Lógica frontend
└── README.md
```

## Rutas API

| Método | Ruta                     | Descripción                          |
|--------|--------------------------|--------------------------------------|
| GET    | `/api/pokemon`           | Lista de los 151 Pokémon             |
| GET    | `/api/pokemon/:idOrName` | Datos completos de un Pokémon        |
| GET    | `/api/random`            | Pokémon aleatorio (para el quiz)     |
| GET    | `/api/search?q=...`      | Búsqueda por nombre o número         |

## Notas

- Solo acepta Pokémon del **1 al 151**. Cualquier número superior devuelve error 400.
- Los gritos se cargan desde el repositorio oficial de PokeAPI/cries.
- La app usa una caché en memoria de 30 minutos para no saturar PokeAPI.
- Diseño responsive: se ve bien en móvil y escritorio.

¡Atrapalos ya... o al menos consúltalos!
