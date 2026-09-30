// Guardado en el navegador (localStorage). Todo se envuelve en try/catch:
// en modo incógnito o con el almacenamiento bloqueado, el juego sigue funcionando sin guardar.

const PREFIJO = "corre-miau-miau:";

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v === null ? porDefecto : (JSON.parse(v) as T);
  } catch {
    return porDefecto;
  }
}

export function guardar<T>(clave: string, valor: T): void {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

/** Guarda el puntaje si es récord. Devuelve true si lo fue. */
export function registrarPuntaje(nivel: string, puntaje: number): boolean {
  const records = leer<Record<string, number>>("records", {});
  if (puntaje <= (records[nivel] ?? 0)) return false;
  records[nivel] = puntaje;
  guardar("records", records);
  return true;
}

export function record(nivel: string): number {
  return leer<Record<string, number>>("records", {})[nivel] ?? 0;
}

export function marcarCompletado(nivel: string): void {
  const hechos = leer<string[]>("completados", []);
  if (!hechos.includes(nivel)) guardar("completados", [...hechos, nivel]);
}

export function completado(nivel: string): boolean {
  return leer<string[]>("completados", []).includes(nivel);
}
