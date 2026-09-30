import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { Lienzo } from "../src/arte/Lienzo";

// Codificador PNG mínimo (RGBA de 8 bits), sin dependencias.
const TABLA_CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloque(tipo: string, datos: Buffer): Buffer {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

/** Guarda un lienzo como PNG, ampliado `escala` veces con píxeles duros. */
export function guardarPNG(l: Lienzo, ruta: string, escala = 1): void {
  const w = l.ancho * escala;
  const h = l.alto * escala;
  const crudo = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    crudo[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const s = (Math.floor(y / escala) * l.ancho + Math.floor(x / escala)) * 4;
      const d = y * (w * 4 + 1) + 1 + x * 4;
      crudo[d] = l.datos[s];
      crudo[d + 1] = l.datos[s + 1];
      crudo[d + 2] = l.datos[s + 2];
      crudo[d + 3] = l.datos[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    ruta,
    Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloque("IHDR", ihdr), bloque("IDAT", deflateSync(crudo)), bloque("IEND", Buffer.alloc(0))]),
  );
}
