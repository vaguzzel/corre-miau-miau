// Trazado del laberinto (27×19). Es el mismo para las tres habitaciones;
// lo que cambia entre niveles son los muebles que dibujan cada muro.
//   #  muro o mueble        .  pasillo con queso
//   o  pepino               c  cafecito
//   b  caja de cartón       =  gatera (túnel lateral)
//   Q  inicio de Quesito    G  inicio del gato
export const MAPA_CASA = `
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
`;
