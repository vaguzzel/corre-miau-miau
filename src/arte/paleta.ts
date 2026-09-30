// Paleta fija del juego: todo el pixel art usa solo estos colores.
export const P = {
  tinta: 0x2b1d16,
  sombra: 0x4a3326,

  maderaOsc: 0x6b4226,
  madera: 0x8e5b3a,
  maderaMed: 0xa87447,
  maderaClara: 0xc99a66,
  pisoA: 0xd6a26b,
  pisoB: 0xc8925c,
  pisoLinea: 0xa87447,
  pisoBrillo: 0xe3b584,

  mostazaOsc: 0xa8732a,
  mostaza: 0xd49a38,
  mostazaClara: 0xecbd5e,

  salviaOsc: 0x4f6a47,
  salvia: 0x6f8f60,
  salviaClara: 0x93b183,

  terracotaOsc: 0x8c3f30,
  terracota: 0xb85c45,
  terracotaClara: 0xd9826a,

  crema: 0xf2e6d0,
  cremaClara: 0xfbf6ec,
  cremaOsc: 0xd9c4a0,
  papelOsc: 0xc9b18e,

  azulOsc: 0x2f4a63,
  azul: 0x3e5c76,
  azulClaro: 0x6f9bbf,
  cielo: 0xbfe0ee,

  lilaOsc: 0x5e4480,
  lila: 0x9c6b98,
  lilaClara: 0xc3a3d8,

  rosa: 0xe58fa0,
  rosaClara: 0xf4c1cb,

  hojaOsc: 0x24462a,
  hoja: 0x3f7a3a,
  hojaMed: 0x5e9a50,
  hojaClara: 0x8cc06a,

  grisOsc: 0x4f4a48,
  gris: 0x8a8280,
  grisClaro: 0xc9c1bb,

  negroPiano: 0x201714,
  pianoBrillo: 0x4a3a33,

  luz: 0xffe7a0,
  luzClara: 0xfff6d6,
  fuego: 0xf28c38,
  fuegoClaro: 0xffd166,
  rojo: 0xb8403a,
  queso: 0xf6cb4f,
  quesoOsc: 0xd9a52e,
  blanco: 0xffffff,
} as const;

export type Color = number;
