// Versión de escritorio: una ventana con el navegador del sistema (WebView) que abre el mismo juego web.
// No hace falta escribir más Rust: todo el juego sigue siendo TypeScript.

// En Windows, evita que se abra una consola negra junto al juego.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("no se pudo abrir Corre Miau Miau");
}
