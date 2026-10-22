# Manual de Usuario y Guía Operativa SICOM
**Sistema Integral de Control Operativo y Modular (SICOM v9.3+)**  
*Actualizado conforme a la Fase 2 y Jubilación de Matriz FOPR-OFP-01-01*

---

## 1. Introducción y Arquitectura de Roles

SICOM opera bajo una filosofía de **cero saturación cognitiva**: cada colaborador accede exclusivamente a las herramientas que requiere para su función, manteniendo los datos estratégicos y de auditoría centralizados.

### Matriz de Roles y Alcance

| Rol | Enfoque Principal | Acceso a Matriz y Gráficos | Edición de Fechas Auditoría | Metadatos Estratégicos |
| :--- | :--- | :---: | :---: | :---: |
| **Consultor / Desarrollador** | Operativo (Tareas, Foro, Entregables) | ❌ Oculto | ❌ Solo lectura | ❌ Oculto |
| **Gestor de Proyectos (PMO)** | Gestión integral, Auditoría y Reportes | ✅ Completo | ✅ Autorizado | ✅ Completo |
| **Supervisor** | Calidad operativa, Reasignación y Filtros | ❌ Oculto | ❌ Solo lectura | ❌ Oculto |
| **Supremo (Dirección)** | Control total, Módulos y Usuarios | ✅ Completo | ✅ Autorizado | ✅ Completo |
| **Lector (Jefatura externa)** | Vista ejecutiva de solo lectura | ❌ Oculto | ❌ Bloqueado | ❌ Oculto |

---

## 2. Guía para el Consultor / Operador

El consultor cuenta con una pantalla despejada centrada en sus **4 pilares de trabajo**:

### 2.1 Tareas Asignadas (`02 // TAREAS`)
* Visualiza las actividades pendientes asignadas a su nombre dentro del proyecto.
* Puede marcar como completada o agregar notas técnicas directas.

### 2.2 Checklist de Documentación Operativa (`03 // DOCUMENTACIÓN`)
* Marca con una casilla los entregables completados conforme avanza el requerimiento.
* Si un documento no aplica para el proyecto, puede marcar `N/A` e ingresar la justificación técnica correspondiente.
* *Nota:* Las fechas compromiso de auditoría son de solo lectura y son fijadas por la PMO.

### 2.3 Foro Técnico y Bloqueos (`04 // FORO`)
* Espacio de comunicación para el equipo técnico.
* Si el proyecto tiene un impedimento técnico o de infraestructura, se registra una nota con etiqueta `⚠️ Bloqueo` para alertar inmediatamente al equipo.

### 2.4 Vínculos Directos a Herramientas
* **Ticket InvGate:** Acceso directo con un clic a la mesa de ayuda (`🎫 #[ID] ↗`).
* **Carpeta Drive:** Enlace directo a la carpeta compartida con la documentación y artefactos técnicos.

---

## 3. Guía para el Gestor de Proyectos (PMO) y Dirección

El Gestor de Proyectos y el Administrador Supremo cuentan con el nuevo módulo integral para sustituir la matriz física de Excel.

### 3.1 Botón de Acceso: "Matriz & Auditoría"
Ubicado en la barra superior (`#btnTopExecutiveDashboard`), abre la ventana ejecutiva modal con dos sub-pestañas:

#### Sub-pestaña 1: [📊 Gráficos y Matriz]
1. **Gráfico de Agrupación por Paquetes:** Distribución de carga por Paquete 1 al 4 y Sin paquete.
2. **Gráfico de Tipo de Propuesta:** Segmentación en Mantenimiento, Servicio Administrado, Venta o Innovación.
3. **Gráfico de Estatus y Tabla Lateral:** Porcentajes y cantidades exactas por indicador semafórico.
4. **Matriz Cruzada 9x21:**
   * Muestra en una sola vista los 9 estados oficiales vs. las 21 empresas filiales.
   * **Interacción Drill-Down (Cero fricción):** Al hacer clic sobre cualquier número en la matriz (o segmento de las gráficas), el sistema viaja automáticamente a la pestaña de tablas con el filtro compuesto ya aplicado.

#### Sub-pestaña 2: [📋 Tablas de Control]
* Vista tabular con `#`, `Estatus`, `Empresa`, `Aplicativo`, `Requerimiento`, `Responsables` y `Observación Ejecutiva`.
* **Filtros Rápidos (Pills):**
  * `[Todos]`: Restablece la vista completa.
  * `[🔴 Retraso STGT]`: Proyectos fuera de tiempo atribuibles a STGT.
  * `[🟡 Relevantes Alta Dirección]`: Proyectos prioritarios para Dirección General.
  * `[⚡ Relevantes STGT]`: Requerimientos estratégicos para la infraestructura STGT.
  * `[👤 Auditoría / Fechas Docs]`: Filtra requerimientos con fechas compromiso asignadas.
* **Inspección sin perder el filtro:** Al hacer clic en cualquier fila de la tabla, se abre lateralmente la ficha técnica para revisar o ajustar datos sin perder el filtro activo de la tabla.

### 3.2 Ficha del Proyecto: Metadatos Estratégicos (`01 // ESTADO Y FECHAS`)
Exclusiva para PMO y Supremo:
* **Empresa:** Selector oficial de las 21 empresas (`AFR`, `ZIN`, `TEO`, `AVM`, etc.).
* **Área Solicitante:** (`Sistemas`, `Finanzas`, `Operaciones`, `RH`, `TI`, `Análisis`, `Dir. General`). Si se elige *Dir. General*, el proyecto muestra un distintivo rojo en cabecera.
* **Paquete y Propuesta:** Clasificación de contrato.
* **Responsables Expandidos:** Identificación de `Líder de Proyecto`, `Consultor`, `Tester` y `Programador`.
* **Relevancia y Resumen:** Checkboxes ejecutivos y campo de `Observación Ejecutiva` (resumen de máximo 250 caracteres para juntas de seguimiento).

### 3.3 Auditoría de Fechas en Documentos Base (`03 // DOCUMENTACIÓN`)
* Catálogo oficial: Propuesta Comercial, Contrato, Plan de trabajo, Plano(s) de negocio, Testing, Comité, Certificado de Capacitación, Carta de Liberación y Factura.
* **Fecha Compromiso:** Selector de fecha editable únicamente por PMO y Supremo.
* **Semáforo Automático:**
  * 🟢 **Verde:** Entregado / Validado.
  * 🟡 **Amarillo:** En tiempo respecto a la fecha compromiso.
  * 🔴 **Rojo:** Fecha vencida sin entregar.

---

## 4. Catálogo Oficial de Estatus STGT

| Estatus | Color | Código Hex | Definición Oficial |
| :--- | :---: | :---: | :--- |
| **Liberado** | 🟢 Verde | `#22c55e` | Puesto en producción y aceptado formalmente. |
| **Estabilización o Piloto** | 🔵 Azul | `#3b82f6` | En pruebas de campo con usuarios o ambiente controlado. |
| **Desarrollado y/o Configurado** | 🟠 Naranja | `#f97316` | Concluido técnicamente, pendiente de pruebas o visto bueno. |
| **En proceso desarrollo / Config** | 🟡 Amarillo | `#eab308` | Trabajo técnico activo en desarrollo o parametrización. |
| **Retraso STGT** | 🔴 Rojo | `#ef4444` | Fuera de fecha compromiso por causas internas de STGT. |
| **Autorizado, sin iniciar** | ⚪ Gris Claro | `#9ca3af` | Aprobado por cliente/dirección, en espera de arranque. |
| **En proceso de autorización** | ⚫ Gris Oscuro | `#374151` | Expediente o propuesta pendiente de visto bueno. |
| **En pausa** | ⏸️ Blanco/Borde | `#ffffff` | Detenido temporalmente a solicitud del solicitante. |
| **Cancelado** | ❌ Rojo Tenue | `#991b1b` | Descartado definitivamente por la organización. |

---

## 5. Procedimientos de Seguridad y Concurrencia

1. **Persistencia en la Nube:** Todos los cambios se respaldan automáticamente en Google Cloud Firestore.
2. **Cero Sobreescritura:** Los consultores nunca alteran metadatos ejecutivos aunque guarden sus tareas o checklists.
3. **Seguridad Nativa:** Las reglas de base de datos impiden modificaciones de fechas compromiso fuera de los perfiles `Supremo` y `Gestor de Proyectos`.
