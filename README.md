# 🩺 Historias Clínicas · Web App Interactiva para Médicos e Internos

Aplicación web de una sola página (**SPA**) diseñada para agilizar la redacción de historias clínicas en **iPad (Safari / Split View)**, **computadores de escritorio** y **dispositivos móviles**, conservando las **píldoras verdes interactivas** navegables con la tecla `Tab` y botones táctiles de un solo toque.

---

## ✨ Características Principales

- **💊 Píldoras Verdes Interactivas (`{{Campo}}`)**:
  - Navegación fluida con la tecla `Tab` / `Shift+Tab` en teclado físico, tecla **"Siguiente"** en el teclado virtual de iPadOS y botones táctiles `◀ Anterior` / `Siguiente ▶`.
  - Autoajuste de ancho en tiempo real y sincronización automática de campos repetidos (ej. `{{Nombre}}`).
- **📋 Catálogo Clínico Completo Incluido**:
  - `.MC` — Motivo de consulta
  - `.EF` — Examen físico
  - `.EVO` — Evolución médica (SOAP)
  - `.ORD` — Órdenes médicas
- **⚡ Dock Flotante Optimizado para iPad**:
  - **📋 Copiar con 1 Toque**: Copia la plantilla rellenada al portapapeles al instante.
  - **＋ Nueva Plantilla**: Abre el creador visual de plantillas sin necesidad de tocar código.
- **🌓 Modo Claro y Modo Oscuro**:
  - Diseño clínico moderno adaptable para turnos diurnos y nocturnos.
- **🤝 Colaboración Médica**:
  - Exportación e importación de paquetes `.json` o sincronización directa con una **Google Sheet publicada como CSV**.

---

## 📁 Estructura Lista para GitHub Pages

```text
├── index.html             # Aplicación Web SPA principal (Entrada de GitHub Pages)
├── styles.css             # Estilos modernos (Modo Claro/Oscuro, iPad UI y Píldoras Verdes)
├── app.js                 # Lógica interactiva de la SPA, navegación Tab y gestor de plantillas
├── templates.json         # Catálogo base de plantillas (.MC, .EF, .EVO, .ORD)
├── manifest.webmanifest   # Manifiesto PWA para "Agregar a pantalla de inicio" en iPadOS
├── .nojekyll              # Desactiva el procesado Jekyll en GitHub Pages
└── README.md              # Documentación y guía de despliegue
```

---

## 🚀 Cómo publicarlo gratis en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo, `historias-clinicas-app`).
2. Sube los archivos de esta carpeta a la rama `main`:
   ```bash
   git init
   git add .
   git commit -m "feat: Web App SPA de Historias Clínicas para iPad y escritorio"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/historias-clinicas-app.git
   git push -u origin main
   ```
3. En tu repositorio de GitHub, ve a **Settings → Pages**.
4. En **Build and deployment → Source**, selecciona **Deploy from a branch**, elige la rama **`main`** y la carpeta **`/ (root)`**, y pulsa **Save**.
5. En menos de 1 minuto tu aplicación estará disponible en:
   `https://TU_USUARIO.github.io/historias-clinicas-app/`
