import { guardar, leer } from "./Guardado";

// Sonidos y música generados con la Web Audio API: no hay archivos de audio.
// Cada efecto es una secuencia corta de notas (frecuencia, duración, forma de onda).

type Onda = OscillatorType;
type Nota = [frecuencia: number, duracion: number, onda?: Onda, volumen?: number];

const EFECTOS: Record<string, Nota[]> = {
  comer: [[880, 0.05, "square", 0.05]],
  comer2: [[988, 0.05, "square", 0.05]],
  pepino: [[523, 0.08, "triangle"], [659, 0.08, "triangle"], [784, 0.08, "triangle"], [1047, 0.16, "triangle"]],
  caja: [[196, 0.08, "square", 0.08], [147, 0.12, "square", 0.08]],
  cafe: [[1047, 0.05, "sine"], [1319, 0.05, "sine"], [1568, 0.05, "sine"], [2093, 0.12, "sine"]],
  tocarGato: [[784, 0.06, "square"], [1047, 0.06, "square"], [1568, 0.14, "square"]],
  atrapado: [[523, 0.12, "sawtooth", 0.07], [440, 0.12, "sawtooth", 0.07], [349, 0.12, "sawtooth", 0.07], [262, 0.3, "sawtooth", 0.07]],
  ganar: [[523, 0.1, "triangle"], [659, 0.1, "triangle"], [784, 0.1, "triangle"], [1047, 0.1, "triangle"], [784, 0.1, "triangle"], [1047, 0.3, "triangle"]],
  vidaExtra: [[659, 0.08, "square"], [880, 0.08, "square"], [1319, 0.2, "square"]],
  corazon: [[1175, 0.06, "sine"], [1568, 0.12, "sine"]],
  guau: [[220, 0.06, "sawtooth", 0.1], [330, 0.1, "sawtooth", 0.1], [260, 0.08, "sawtooth", 0.08]],
  boton: [[660, 0.04, "square", 0.04]],
};

// Música de fondo: acordes suaves y una melodía simple que se repite (8 compases).
const ACORDES = [
  [262, 330, 392],
  [220, 262, 330],
  [175, 220, 262],
  [196, 247, 294],
];
const MELODIA = [659, 0, 587, 523, 587, 0, 659, 784, 659, 0, 523, 440, 523, 0, 587, 0, 523, 0, 440, 392, 440, 0, 523, 587, 494, 0, 392, 0, 440, 494, 523, 0];

class ControlSonido {
  private ctx: AudioContext | null = null;
  private maestro: GainNode | null = null;
  private activo = leer("sonido", true);
  private musicaTimer: number | null = null;
  private tiempoMusica = 0;
  private paso = 0;
  private alternar = false;

  get encendido(): boolean {
    return this.activo;
  }

  /** Los navegadores solo permiten sonido después de que el jugador toca una tecla o hace clic. */
  private preparar(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.maestro = this.ctx.createGain();
        this.maestro.gain.value = this.activo ? 0.6 : 0;
        this.maestro.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  alternarSonido(): boolean {
    this.activo = !this.activo;
    guardar("sonido", this.activo);
    this.preparar();
    if (this.maestro) this.maestro.gain.value = this.activo ? 0.6 : 0;
    return this.activo;
  }

  private tocarNota(f: number, inicio: number, dur: number, onda: Onda, vol: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = onda;
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, inicio);
    g.gain.linearRampToValueAtTime(vol, inicio + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    osc.connect(g).connect(this.maestro!);
    osc.start(inicio);
    osc.stop(inicio + dur + 0.02);
  }

  efecto(nombre: keyof typeof EFECTOS): void {
    const ctx = this.preparar();
    if (!ctx || !this.activo) return;
    let clave = nombre;
    // El "waka" de comer alterna dos notas, como en Pac-Man
    if (nombre === "comer") clave = (this.alternar = !this.alternar) ? "comer" : "comer2";
    let t = ctx.currentTime;
    for (const [f, d, onda = "square", vol = 0.09] of EFECTOS[clave]) {
      this.tocarNota(f, t, d, onda, vol);
      t += d * 0.9;
    }
  }

  /** Programa la música por adelantado en pequeños bloques (así no se corta si el juego se pone lento). */
  iniciarMusica(): void {
    const ctx = this.preparar();
    if (!ctx || this.musicaTimer !== null) return;
    const negra = 0.28;
    this.tiempoMusica = ctx.currentTime + 0.1;
    const programar = () => {
      while (this.tiempoMusica < ctx.currentTime + 0.6) {
        const i = this.paso % MELODIA.length;
        if (this.activo) {
          if (MELODIA[i]) this.tocarNota(MELODIA[i], this.tiempoMusica, negra * 0.9, "triangle", 0.035);
          if (i % 8 === 0) for (const f of ACORDES[(i / 8) % 4]) this.tocarNota(f / 2, this.tiempoMusica, negra * 7.5, "sine", 0.02);
        }
        this.tiempoMusica += negra;
        this.paso++;
      }
    };
    programar();
    this.musicaTimer = window.setInterval(programar, 200);
  }

  detenerMusica(): void {
    if (this.musicaTimer !== null) window.clearInterval(this.musicaTimer);
    this.musicaTimer = null;
  }
}

export const sonido = new ControlSonido();
