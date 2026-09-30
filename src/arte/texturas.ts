import * as Phaser from "phaser";
import type { Lienzo } from "./Lienzo";
import { dibujarCafe, dibujarCaja, dibujarPepino, dibujarQueso, dibujarQuesito, type VistaQuesito } from "./personajes";

/** Sube un lienzo de píxeles a Phaser como textura (una sola vez por clave). */
export function texturaDe(escena: Phaser.Scene, clave: string, l: Lienzo): string {
  if (escena.textures.exists(clave)) return clave;
  const tex = escena.textures.createCanvas(clave, l.ancho, l.alto)!;
  tex.getContext().putImageData(new ImageData(new Uint8ClampedArray(l.datos), l.ancho, l.alto), 0, 0);
  tex.refresh();
  return clave;
}

/** Texturas de Quesito y de los objetos del mapa. */
export function crearTexturasBase(escena: Phaser.Scene): void {
  for (const vista of ["frente", "espalda", "lado"] as VistaQuesito[])
    for (const paso of [0, 1]) texturaDe(escena, `quesito-${vista}-${paso}`, dibujarQuesito(vista, paso));
  texturaDe(escena, "obj-queso", dibujarQueso());
  texturaDe(escena, "obj-pepino", dibujarPepino());
  texturaDe(escena, "obj-cafe", dibujarCafe());
  texturaDe(escena, "obj-caja", dibujarCaja());
}

/**
 * Convierte una foto recortada en "sticker": borde blanco y, por fuera, un borde del color de la mascota.
 * Usa una transformada de distancia: para cada píxel vacío calcula qué tan lejos está de la foto
 * y lo pinta blanco o de color según esa distancia.
 */
export function crearSticker(escena: Phaser.Scene, claveFoto: string, color: number, tam = 160, blanco = 7, anchoColor = 5): string {
  const clave = `sticker-${claveFoto}`;
  if (escena.textures.exists(clave)) return clave;
  const img = escena.textures.get(claveFoto).getSourceImage() as HTMLImageElement;
  const pad = blanco + anchoColor + 2;
  const lado = tam + pad * 2;
  const r = Math.min(tam / img.width, tam / img.height);
  const w = img.width * r;
  const h = img.height * r;
  const ox = pad + (tam - w) / 2;
  const oy = pad + (tam - h) / 2;

  const tmp = document.createElement("canvas");
  tmp.width = lado;
  tmp.height = lado;
  const tctx = tmp.getContext("2d")!;
  tctx.drawImage(img, ox, oy, w, h);
  const alfa = tctx.getImageData(0, 0, lado, lado).data;

  // Distancia aproximada (chaflán) desde cada píxel hasta el píxel opaco más cercano.
  const N = lado * lado;
  const dist = new Float32Array(N).fill(1e6);
  for (let i = 0; i < N; i++) if (alfa[i * 4 + 3] > 100) dist[i] = 0;
  const D = Math.SQRT2;
  for (let y = 0; y < lado; y++)
    for (let x = 0; x < lado; x++) {
      const i = y * lado + x;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - lado] + 1);
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - lado - 1] + D);
      if (x < lado - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - lado + 1] + D);
    }
  for (let y = lado - 1; y >= 0; y--)
    for (let x = lado - 1; x >= 0; x--) {
      const i = y * lado + x;
      if (x < lado - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < lado - 1) dist[i] = Math.min(dist[i], dist[i + lado] + 1);
      if (x < lado - 1 && y < lado - 1) dist[i] = Math.min(dist[i], dist[i + lado + 1] + D);
      if (x > 0 && y < lado - 1) dist[i] = Math.min(dist[i], dist[i + lado - 1] + D);
    }

  const tex = escena.textures.createCanvas(clave, lado, lado)!;
  const ctx = tex.getContext();
  const out = ctx.createImageData(lado, lado);
  const cr = (color >> 16) & 255;
  const cg = (color >> 8) & 255;
  const cb = color & 255;
  const limite = blanco + anchoColor;
  for (let i = 0; i < N; i++) {
    const d = dist[i];
    if (d > limite + 1) continue;
    const esBlanco = d <= blanco;
    out.data[i * 4] = esBlanco ? 255 : cr;
    out.data[i * 4 + 1] = esBlanco ? 255 : cg;
    out.data[i * 4 + 2] = esBlanco ? 255 : cb;
    out.data[i * 4 + 3] = d > limite ? Math.round(255 * (limite + 1 - d)) : 255; // borde exterior suave
  }
  ctx.putImageData(out, 0, 0);
  ctx.drawImage(img, ox, oy, w, h);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return clave;
}
