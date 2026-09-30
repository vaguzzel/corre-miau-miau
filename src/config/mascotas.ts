// Datos de las mascotas: nombre visible, archivo de la foto y color de su borde.
export interface Mascota {
  clave: string;
  nombre: string;
  foto: string;
  color: number;
}

export const MASCOTAS: Mascota[] = [
  { clave: "tomasito", nombre: "Tomasito", foto: "assets/fotos/tomasito.png", color: 0x5fb0e6 },
  { clave: "begona", nombre: "Begoña", foto: "assets/fotos/begona.png", color: 0xe8a53a },
  { clave: "eren", nombre: "Eren", foto: "assets/fotos/eren.png", color: 0xee6a55 },
  { clave: "violeta", nombre: "Violeta", foto: "assets/fotos/violeta.png", color: 0xb48ce0 },
];
