# Plan final: Corre Miau Miau

Juego tipo Pac-Man en pixel art, en vista 3/4. Controlas a **Quesito**, un ratón que recorre cada habitación de la casa comiendo queso mientras uno de tus gatos lo persigue. Al final, un nivel tranquilo con **Violeta**.

Muestra interactiva de referencia (estilo, cámara, reglas): https://claude.ai/artifact/KeFcrTcnyWETHTqvoSJqRk

---

## 1. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Motor | **Phaser 4 + TypeScript**, con Vite |
| Plataforma | Navegador; después PWA instalable y al final app de escritorio con **Tauri 2** |
| Publicación | **GitHub Pages**, con despliegue automático desde GitHub Actions |
| Estilo del mundo | **Pixel art detallado** tipo Stardew Valley / Eastward, en **vista 3/4** (los muebles tienen altura, la pared del fondo se ve de frente) |
| Mascotas | **Fotos HD reales** (solo la cabeza) como stickers, con borde blanco y borde del color de cada mascota, encima del pixel art |
| Movimiento de las mascotas | Cabeza flotante: rebota al caminar, se inclina al girar, se estira en las curvas |
| Expresiones | Con efectos sobre la misma foto: tinte azul y temblor (asustado), tamaño y "!" (cazar), estrella y bamboleo (victoria) |
| Protagonista | **Quesito**, ratón dibujado en pixel art con pañuelo amarillo; borde blanco y amarillo queso |
| Tamaño del mapa | **27×19 casillas**, más grande que la pantalla |
| Cámara | Sigue a Quesito con suavidad; se ven unas 16×9 casillas en computador y unas 10 de ancho en celular |
| Mini-mapa | En la esquina: muestra a Quesito, al gato y el área visible |
| Vista "Mapa completo" | Tecla M: aleja la cámara para ver la habitación entera; el juego sigue corriendo (se puede jugar así). La pausa es aparte, con ESPACIO |
| Idiomas | Español e inglés |
| Arte | Lo hace Claude: sprites dibujados como mapas de píxeles en código y convertidos a PNG con un script. Packs CC0 solo como respaldo |
| Presupuesto | $0: todo con herramientas y recursos gratis |

---

## 2. Personajes y niveles

| Orden | Nivel | Gato | Borde | Velocidad vs. Quesito | Cómo persigue | Pepino dura |
|---|---|---|---|---|---|---|
| 1 | El living | Tomasito | celeste `#5FB0E6` | 75% | Al azar en cada cruce, a veces hacia Quesito. Cada tanto se duerme 2 s | 8 s |
| 2 | La cocina | Begoña | miel `#E8A53A` | 95% | Camino más corto (BFS). Alterna entre cazar y patrullar su esquina | 6 s |
| 3 | El jardín | Eren | coral `#EE6A55` | 110% | A* apuntando 4 casillas delante de Quesito: te corta el paso | 4 s |
| Final | El rincón de Violeta | Violeta | lila `#B48CE0` | no persigue | Quesito junta 12 corazones y se los lleva; escena de ladrido, duda y abrazo | — |

Estados del gato (máquina de estados): **Patrullar → Cazar** (alternan por tiempo) → **Asustado** (al tomar un pepino) → **Victoria** (al atrapar a Quesito).

---

## 3. Reglas oficiales

| Objeto | Cantidad | Efecto | Puntos |
|---|---|---|---|
| Trocito de queso | todas las casillas libres | Comer todos = ganar el nivel | 10 |
| Pepino | 4 (esquinas) | El gato se asusta y huye. Si Quesito lo toca, el gato vuelve a su cama | 50 · tocar al gato 200 |
| Cafecito | 1 por nivel | Turbo: +30% de velocidad por 5 s. Aparece a mitad del nivel y dura 10 s | 100 |
| Caja de cartón | 2 por mapa | Escondite: el gato pierde el rastro y vuelve a patrullar. Máx. 4 s dentro, 2 usos por vida | — |

- **Vidas:** 3. Una vida extra cada 10.000 puntos.
- **Gateras:** túneles en los muros laterales, en la fila central. El gato va al 60% de su velocidad dentro.
- **Controles:** flechas o WASD. La próxima dirección queda guardada y Quesito gira apenas puede. En celular, deslizar el dedo (swipe). ESPACIO = pausa, M = mapa completo.
- **Movimiento:** casilla por casilla con desplazamiento suave; las decisiones se toman al llegar al centro de cada casilla.
- **Mejor puntaje:** guardado en el navegador.

Todos los números van en `src/config/niveles.json` para ajustarlos sin tocar el código:

```json
{
  "tomasito": { "velocidadGato": 0.75, "ia": "azar", "pepinoSeg": 8, "siesta": true },
  "begona":   { "velocidadGato": 0.95, "ia": "bfs",  "pepinoSeg": 6 },
  "eren":     { "velocidadGato": 1.10, "ia": "astar", "adelanto": 4, "pepinoSeg": 4 },
  "general":  { "velocidadRaton": 5.0, "turbo": 1.3, "turboSeg": 5, "cajaSeg": 4, "vidas": 3, "vidaExtraCada": 10000 }
}
```

---

## 4. El mapa (27×19)

El mismo trazado para las tres habitaciones; lo que cambia son los muebles que forman los muros. `#` = muro o mueble, `.` = pasillo con queso, `o` = pepino, `c` = cafecito, `b` = caja, `=` = gatera, `Q` = inicio de Quesito, `G` = inicio del gato.

```
###########################
#o.......#.......#.......o#
#.##.###.#.#####.#.###.##.#
#.##.###.#.#####.#.###.##.#
#............G............#
#.##.#.###.......###.#.##.#
#.##.#b...#######....#.##.#
#....#.#..#######..#.#....#
#.##.#.#..#######..#.#.##.#
=............c............=
#.##.#.#..#######..#.#.##.#
#....#.#..#######..#.#....#
#.##.#....#######...b#.##.#
#.##.#.###.......###.#.##.#
#............Q............#
#.##.###.#.#####.#.###.##.#
#.##.###.#.#####.#.###.##.#
#o.......#.......#.......o#
###########################
```

Los bloques grandes del centro (7×3) son las piezas estrella de cada habitación: el castillo de Tomasito y el piano de cola, la mesa del almuerzo y la isla de repostería, la laguna y la terraza.

### Qué hay en cada habitación

- **Living de Tomasito:** papel mural con ventanas, cortinas, guirnalda de luces y **retratos de la familia hechos con tus fotos**; sofá mostaza con arañazos de Tomasito y cojín bordado con cara de gato; sofá verde; castillo-rascador con hamaca, cubo y letrero "TOMASITO"; piano de cola; estufa a leña; sillón de lectura con lámpara; escritorio con máquina de escribir; mesa con puzzle, té y galletas; tocadiscos y vinilos; estantes con libros, velas y fotos; pufs tejidos; canasto de lanas; cama de gato; muchas plantas; alfombra kilim; felpudo "HOLA".
- **Cocina de Begoña:** azulejos, repisa con frascos, utensilios colgando y un dibujo de Begoña pegado; refrigerador con imanes; cocina con cazuela humeante y huevos fritos; cocina a leña antigua; isla con masa, uslero y harina con **huellitas de Begoña**; mesa grande con almuerzo y tabla de quesos; isla de repostería con galletas y torta; lavaplatos; lavadora; platos de Begoña con su nombre; fuente de agua y frasco de premios; mermeladas caseras; canastos de papas y cebollas; huerto de hierbas con etiquetas.
- **Jardín de Eren:** cerca alta con enredaderas y casita de pájaros; limonero, ciruelo, manzano y naranjo; invernadero; huertos de lechugas, zanahorias, tomates y zapallos; laguna con nenúfares, peces y una rana; terraza con reposeras y limonada; parrilla de ladrillo con choripanes y pebre; mesa con quitasol; galpón; **banca de Eren con su nombre tallado**; setos de lavanda, hortensias, rosas y boj; bebedero de pájaros; gnomo y hongos; girasoles.
- **Rincón de Violeta:** papel mural lila, ventana con cortinas, cuadro con su foto, su camita con nombre, hueso de juguete, alfombra.

---

## 5. Cómo se hace el arte

### 5A. Pixel art del mundo (lo hace Claude)
- **Tamaño de casilla:** 24×24 px de arte. En pantalla se amplía ×2 o ×3 (siempre un número entero, para que los píxeles queden cuadrados).
- **Paleta fija** de unos 48 colores cálidos, basada en una paleta libre de Lospec (por ejemplo, Resurrect 64). Todo el arte usa solo esos colores.
- **Vista 3/4:** cada mueble tiene **tapa** (vista desde arriba) y **cara frontal** (su altura), contorno oscuro de 1 px y luz desde arriba a la izquierda.
- **Método:** cada sprite se escribe en `tools/arte/sprites/*.ts` como una grilla de caracteres más una paleta. El script `npm run arte` los convierte en PNG y arma un atlas (spritesheet + JSON) en `public/assets/`. Se revisa en el navegador y se corrige píxel por píxel en el mismo archivo.
- **Respaldo gratis:** si algo cuesta mucho (por ejemplo, agua animada), buscar packs **CC0** en Kenney.nl u OpenGameArt (filtrando por CC0), recolorearlos a la paleta y darles crédito.

### 5B. Fotos de las mascotas (tus 4 PNG)
- Un script (`npm run fotos`, con la librería `sharp`) las normaliza a 256×256 px, con la cabeza centrada y el mismo margen, y les agrega **borde blanco de 6 px + borde del color de la mascota de 4 px**.
- En Phaser, las fotos usan **filtro suave (LINEAR)** y el pixel art usa **filtro de píxel (NEAREST)**. Así el mundo se ve pixelado y las fotos se ven nítidas al mismo tiempo.
- **Opcional, suma mucho:** fotos extra de frente y con la misma luz: Violeta ladrando; cada gato "en modo caza" (ojos grandes); cada gato relajado o bostezando.

### 5C. Quesito
Ratón en pixel art de unos 24×24 px, con pañuelo amarillo, 4 direcciones y 2 cuadros de caminata.

---

## 6. Estructura técnica

```
quesito/
├─ public/assets/        # atlas de pixel art, fotos procesadas, sonidos
├─ src/
│  ├─ main.ts            # configuración de Phaser (pixelArt, escalado)
│  ├─ config/niveles.json
│  ├─ i18n/es.json, en.json
│  ├─ escenas/           # Boot, Carga, Menu, SeleccionNivel, Juego, HUD, Pausa, Violeta, Final, Creditos
│  ├─ mapa/              # grilla 27×19 en texto, muebles por habitación
│  ├─ entidades/         # Quesito, Gato, Objeto
│  ├─ ia/                # azar.ts, bfs.ts, astar.ts (programados a mano, con pruebas)
│  ├─ estados/           # máquina de estados del gato
│  └─ sistemas/          # movimiento en grilla, cámara, mini-mapa, profundidad (y-sort), puntaje
├─ tools/arte/           # sprites como mapas de píxeles + script a PNG
├─ tools/fotos/          # script de bordes para las fotos
└─ .github/workflows/    # despliegue a GitHub Pages
```

Detalles clave:
- **Profundidad (y-sort):** cada objeto usa su base como profundidad (`setDepth(y)`), así los personajes pasan por delante y por detrás de los muebles.
- **Cámara:** `camera.startFollow(quesito)` con suavizado y límites del mapa. El mini-mapa es una segunda cámara con zoom reducido o una textura simple de la grilla.
- **IA:** BFS y A* sobre la grilla, programados a mano (no librerías), con pruebas unitarias (Vitest). Es exactamente lo que se pregunta en entrevistas técnicas.
- **Configuración** en JSON y textos en archivos de idioma: nada de números ni frases sueltas en el código.

---

## 7. Hoja de ruta

Regla de oro: **primero que funcione, después que se vea bonito.** No avanzar de fase sin cumplir el "listo cuando".

| Fase | Qué se hace | Listo cuando |
|---|---|---|
| 0. Preparación | Instalar **Node.js LTS** (falta en tu PC; Git ya está), VS Code, crear el repo en GitHub, plantilla de Phaser + Vite + TypeScript | Ves Phaser corriendo en el navegador |
| 1. Prototipo con cuadrados | Mapa 27×19 desde texto, Quesito como círculo, movimiento suave, giro guardado, cámara y mapa completo | Recorres todo el mapa sin bugs |
| 2. Queso y puntaje | Queso en los pasillos, puntaje, ganar al comer todo | Puedes ganar una partida |
| 3. Nivel Tomasito jugable | Gato con IA al azar + siesta, 3 vidas, Game Over | El nivel 1 se juega de principio a fin |
| 4. Arte del living | Paleta, pisos, paredes y muebles del living en pixel art; fotos con borde; y-sort; sombras, partículas y tweens | Alguien lo ve y dice "qué bonito" |
| 5. Nivel Begoña | BFS, estados patrullar/cazar/asustado, pepino, caja y cafecito; arte de la cocina | Los 4 objetos funcionan en la cocina |
| 6. Nivel Eren + menús | A* con adelanto, arte del jardín, menú, selección de nivel, pausa, sonido, español/inglés | Los 3 niveles se juegan desde el menú |
| 7. Final de Violeta | Rincón de Violeta, 12 corazones y escena del abrazo, créditos | El juego se termina completo |
| 8. Pulido y pruebas | Controles táctiles, mejor puntaje, 3 personas lo prueban, ajustar `niveles.json` | Nadie se queda atascado sin entender qué hacer |
| 9. Publicar en la web | GitHub Pages con Actions + PWA instalable | El link funciona en celular y computador |
| 10. Escritorio y portafolio | Instalar Rust y empaquetar con Tauri 2 para Windows; README final | Hay un .exe descargable y el README está listo |

---

## 8. Herramientas (todas gratis)

VS Code · Node.js LTS · Git + GitHub · Phaser 4 · Vite · TypeScript · Vitest · sharp (fotos) · Tauri 2 + Rust (solo fase 10) · sonidos CC0 de Freesound y Kenney · paletas de Lospec.

---

## 9. Checklist de portafolio

- [ ] Link para jugar en un clic, arriba del README
- [ ] GIF del juego y 3 capturas (una por habitación)
- [ ] Tabla de tecnologías y por qué se eligieron
- [ ] Sección "Qué aprendí": BFS, A*, máquina de estados, y-sort, cámara, pipeline de arte, PWA, Tauri
- [ ] Diagrama simple de la estructura del código
- [ ] Commits ordenados con mensajes claros
- [ ] Licencias: código MIT; las fotos de tus mascotas son tuyas y no se pueden reutilizar; nota de que el pixel art fue generado con ayuda de IA (Claude)
- [ ] Créditos de sonidos y de cualquier asset CC0 usado
