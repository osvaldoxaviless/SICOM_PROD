const escapeHtml = (u) => { if (!u) return ''; return u.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
    // Escapa un valor para usarlo como argumento string en un handler inline: onclick="fn('${jsArg(valor)}')"
    const jsArg = (u) => escapeHtml((u == null ? '' : String(u)).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' '));
    
    let appId, db, auth, isFirebaseReady = false, unsubscribeSnapshot = null;
    let globalDoc, globalSetDoc;
    let isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    let svgElem, canvasGroup, svgDefs;
    let translateX = 0, translateY = 0, scale = 1;
    let isPanning = false, startX, startY;
    let initialPinchDistance = null;
    let isDrawerOpen = false, isPriorityDrawerOpen = false, isAlertsDrawerOpen = false, isDailyDrawerOpen = false, isFilterDrawerOpen = false;
    let activeSearchQuery = '';
    let activeFilterModule = 'ALL', activeFilterConsultant = 'ALL', activeFilterStatus = 'ALL', activeFilterCompany = 'ALL';
    let activeFilterConsultants = ['ALL'], activeFilterStatuses = ['ALL'], activeFilterCompanies = ['ALL'];
    let activeFilterUrgency = 'ALL', activeFilterPriority = 'ALL', activeFilterBottleneck = 'ALL', isFocusMode = false, showAllSecondaryLinks = false;
    let collapsedModules = new Set();
    let currentSelection = { type: null, id: null };
    let currentCreateType = 'project';
    let itemToDelete = { category: null, id: null };
    
    let localAuthor = localStorage.getItem('sicom_author') || '';
    let currentUserRole = localStorage.getItem('sicom_role') || 'Consultor';

    const fallbackConsultants = {
      "Emmanuel Sánchez": {"color": "#f97316", "role": "Consultor"}, 
      "Osvaldo Avilés": {"color": "#0071e3", "role": "Supremo"}, 
      "Óscar González": {"color": "#10b981", "role": "Consultor"}, 
      "Rafael Romero": {"color": "#a855f7", "role": "Supervisor"}, 
      "Carlos Islas": {"color": "#ff453a", "role": "Consultor"}, 
      "Ricardo Lira": {"color": "#ff375f", "role": "Consultor"}, 
      "Manuel Gutierrez": {"color": "#5ac8fa", "role": "Consultor"}, 
      "Miguel Muñoz": {"color": "#ff9f0a", "role": "Consultor"}, 
      "Diego Cristobal": {"color": "#ffd60a", "role": "Consultor"}, 
      "Sue Oyuqui": {"color": "#ff6482", "role": "Consultor"},
      "Miguel Barbosa": {"color": "#30d158", "role": "Supervisor"},
      "Lector (Jefatura)": {"color": "#8e8e93", "role": "Lector"}
    };

    const defaultTestingData = {"directHub":{"id":"hub-direct","name":"PROYECTOS DIRECTOS SICOM","color":"#f59e0b"},"secondaryCore":{"name":"SUCOM","active":false,"id":"sucom"},"directProjects":[{"deadline":"2026-10-13","driveLink":"","notes":"","tasks":[],"docs":{"doc_1791192995498":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193015065":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193027382":{"checked":true,"obs":"","na":false,"naValidated":false}},"clientReturnDate":"2026-10-06","id":"dp1","_renderData":{"x":-840,"y":-412.5,"color":"#f97316","type":"direct-project"},"priority":3,"invgateLink":"","name":"Implementación ATN","clientDeliveryDate":"2026-10-21","progress":33,"status":"No Iniciado","consultants":["Emmanuel Sánchez"]},{"progress":0,"notes":"","docs":{"doc_1791193015065":{"checked":false,"na":false,"obs":"","naValidated":false},"doc_1791193027382":{"checked":false,"naValidated":false,"na":false,"obs":""},"doc_1791192995498":{"naValidated":false,"obs":"","na":false,"checked":false}},"id":"dp2","_renderData":{"x":-840,"y":-337.5,"color":"#f97316","type":"direct-project"},"clientDeliveryDate":"","status":"No Iniciado","consultants":["Emmanuel Sánchez"],"clientReturnDate":"","deadline":"","name":"Boletos por SMS","priority":8}],"history":[{"id":"1791350628229","timestamp":"6/10/2026, 23:23:48","projectId":"dp1","projectName":"Implementación ATN","action":"Actualizó avance a 33%","by":"Osvaldo Avilés"},{"id":"1791350623153","timestamp":"6/10/2026, 23:23:43","projectId":"dp1","projectName":"Implementación ATN","action":"Actualizó avance a 0%","by":"Osvaldo Avilés"},{"id":"1791350594430","timestamp":"6/10/2026, 23:23:14","projectId":"dp1","projectName":"Implementación ATN","action":"Actualizó avance a 33%","by":"Osvaldo Avilés"},{"by":"Lector (Jefatura)","action":"Acceso de lectura por: Calidad","timestamp":"6/10/2026, 23:17:25","projectName":"Auditoría Visual","projectId":"login","id":"1791350245483"},{"timestamp":"6/10/2026, 23:12:46","action":"Eliminó el elemento permanentemente","projectName":"Mejoras (PRUEBA)","id":"1791349966079","by":"Osvaldo Avilés","projectId":"p_1791223355853"},{"projectName":"Pantallas Volumétricos","by":"Osvaldo Avilés","timestamp":"6/10/2026, 23:08:31","id":"1791349711172","projectId":"p7","action":"Editó detalles internos"},{"projectId":"p6","id":"1791349673979","by":"Osvaldo Avilés","timestamp":"6/10/2026, 23:07:53","projectName":"Gestión Web / Competencia","action":"Actualizó avance a 0%"},{"projectId":"p6","by":"Osvaldo Avilés","projectName":"Gestión Web / Competencia","id":"1791349671913","action":"Actualizó avance a 33%","timestamp":"6/10/2026, 23:07:51"},{"projectId":"p_1791193478080","by":"Osvaldo Avilés","action":"Eliminó el elemento permanentemente","id":"1791349622165","projectName":"PRUEBA 1","timestamp":"6/10/2026, 23:07:02"},{"id":"1791349566213","projectId":"p13","by":"Osvaldo Avilés","action":"Editó detalles internos","timestamp":"6/10/2026, 23:06:06","projectName":"Contador Pasajeros COP COM"},{"projectName":"Versión Paytech","id":"1791349537433","action":"Actualizó avance a 0%","timestamp":"6/10/2026, 23:05:37","by":"Osvaldo Avilés","projectId":"p2"},{"id":"1791349515359","timestamp":"6/10/2026, 23:05:15","projectName":"OScar prueba","projectId":"p_1791348427563","action":"Eliminó el elemento permanentemente","by":"Osvaldo Avilés"},{"timestamp":"6/10/2026, 23:05:10","by":"Osvaldo Avilés","projectName":"FINAL","projectId":"p_1791347450123","id":"1791349510583","action":"Eliminó el elemento permanentemente"},{"timestamp":"6/10/2026, 23:05:04","id":"1791349504351","by":"Osvaldo Avilés","projectId":"p_1791346340178","projectName":"fff","action":"Eliminó el elemento permanentemente"},{"action":"Eliminó el elemento permanentemente","projectName":"PRUEBA 1","by":"Osvaldo Avilés","projectId":"p_1791234101902","timestamp":"6/10/2026, 23:04:59","id":"1791349499601"},{"action":"Actualizó enlaces del proyecto","by":"Osvaldo Avilés","timestamp":"6/10/2026, 23:04:26","projectName":"Implementación ATN","projectId":"dp1","id":"1791349466015"},{"by":"Osvaldo Avilés","projectName":"Implementación ATN","timestamp":"6/10/2026, 23:04:24","action":"Actualizó enlaces del proyecto","projectId":"dp1","id":"1791349464702"},{"action":"Actualizó enlaces del proyecto","projectName":"Implementación ATN","by":"Osvaldo Avilés","timestamp":"6/10/2026, 23:04:21","projectId":"dp1","id":"1791349461796"},{"projectId":"dp1","by":"Osvaldo Avilés","projectName":"Implementación ATN","action":"Actualizó avance a 0%","timestamp":"6/10/2026, 23:04:05","id":"1791349445731"},{"by":"Osvaldo Avilés","action":"Actualizó avance a 33%","timestamp":"6/10/2026, 23:04:04","projectName":"Implementación ATN","projectId":"dp1","id":"1791349444230"},{"timestamp":"6/10/2026, 23:04:03","id":"1791349443191","projectName":"Implementación ATN","action":"Actualizó avance a 67%","projectId":"dp1","by":"Osvaldo Avilés"},{"timestamp":"6/10/2026, 23:03:51","projectName":"Implementación ATN","by":"Osvaldo Avilés","action":"Cambió estado a [No Iniciado]","id":"1791349431539","projectId":"dp1"},{"id":"1791349380883","action":"Validó una tarea","timestamp":"6/10/2026, 23:03:00","projectName":"PRUEBA 1","by":"Miguel Barbosa","projectId":"p_1791234101902"},{"timestamp":"6/10/2026, 23:01:45","by":"Miguel Barbosa","projectName":"PRUEBA 1","id":"1791349305870","projectId":"p_1791234101902","action":"Asignó tarea a Osvaldo Avilés"},{"action":"Cambió estado a [En Progreso]","id":"1791348982027","timestamp":"6/10/2026, 22:56:22","by":"Miguel Muñoz","projectId":"p21","projectName":"Reportes Ciberseguridad"},{"projectId":"p_1791348427563","by":"Óscar González","timestamp":"6/10/2026, 22:47:07","action":"Creó el proyecto","id":"1791348427564","projectName":"OScar prueba"},{"by":"Óscar González","timestamp":"6/10/2026, 22:45:20","id":"1791348320261","projectId":"p2","action":"Desmarcó una tarea","projectName":"Versión Paytech"},{"action":"Envió tarea a validación","projectId":"p2","by":"Óscar González","projectName":"Versión Paytech","timestamp":"6/10/2026, 22:45:08","id":"1791348308930"},{"projectName":"Versión Paytech","by":"Óscar González","projectId":"p2","action":"Desmarcó una tarea","timestamp":"6/10/2026, 22:45:07","id":"1791348307424"},{"action":"Envió tarea a validación","projectId":"p2","by":"Óscar González","id":"1791348304978","projectName":"Versión Paytech","timestamp":"6/10/2026, 22:45:04"},{"timestamp":"6/10/2026, 22:45:03","action":"Desmarcó una tarea","id":"1791348303829","by":"Óscar González","projectId":"p2","projectName":"Versión Paytech"},{"projectName":"Versión Paytech","id":"1791348298528","timestamp":"6/10/2026, 22:44:58","by":"Óscar González","projectId":"p2","action":"Envió tarea a validación"},{"action":"Agregó nueva tarea","id":"1791348254567","projectId":"p2","timestamp":"6/10/2026, 22:44:14","projectName":"Versión Paytech","by":"Osvaldo Avilés"},{"timestamp":"6/10/2026, 22:42:51","id":"1791348171374","projectName":"Auditoría Visual","action":"Acceso de lectura por: Javier Sánchez","projectId":"login","by":"Lector (Jefatura)"},{"id":"1791347705147","projectId":"p_1791347450123","action":"Validó una tarea","projectName":"FINAL","by":"Osvaldo Avilés","timestamp":"6/10/2026, 22:35:05"},{"timestamp":"6/10/2026, 22:34:22","id":"1791347662018","by":"Miguel Muñoz","action":"Agregó nueva tarea","projectName":"FINAL","projectId":"p_1791347450123"},{"by":"Miguel Muñoz","timestamp":"6/10/2026, 22:33:44","projectName":"FINAL","id":"1791347624705","action":"Envió tarea a validación","projectId":"p_1791347450123"},{"action":"Actualizó avance a 100%","by":"Miguel Muñoz","timestamp":"6/10/2026, 22:33:38","projectId":"p_1791347450123","projectName":"FINAL","id":"1791347618106"},{"by":"Osvaldo Avilés","projectName":"FINAL","timestamp":"6/10/2026, 22:32:33","action":"Editó detalles internos","projectId":"p_1791347450123","id":"1791347553518"},{"projectId":"p_1791347450123","action":"Actualizó enlaces del proyecto","by":"Osvaldo Avilés","timestamp":"6/10/2026, 22:31:57","id":"1791347517566","projectName":"FINAL"},{"timestamp":"6/10/2026, 22:31:56","id":"1791347516133","projectId":"p_1791347450123","action":"Actualizó enlaces del proyecto","by":"Osvaldo Avilés","projectName":"FINAL"},{"projectName":"FINAL","projectId":"p_1791347450123","by":"Osvaldo Avilés","action":"Actualizó avance a 67%","id":"1791347509984","timestamp":"6/10/2026, 22:31:49"},{"id":"1791347502937","projectId":"p_1791347450123","action":"Actualizó avance a 33%","projectName":"FINAL","timestamp":"6/10/2026, 22:31:42","by":"Osvaldo Avilés"},{"projectName":"FINAL","by":"Osvaldo Avilés","timestamp":"6/10/2026, 22:31:36","action":"Agregó nueva tarea","id":"1791347496001","projectId":"p_1791347450123"},{"by":"Osvaldo Avilés","projectName":"FINAL","timestamp":"6/10/2026, 22:31:14","action":"Cambió estado a [En Progreso]","id":"1791347474936","projectId":"p_1791347450123"},{"by":"Osvaldo Avilés","projectName":"FINAL","timestamp":"6/10/2026, 22:30:50","projectId":"p_1791347450123","id":"1791347450124","action":"Creó el proyecto"},{"id":"1791347248070","timestamp":"6/10/2026, 22:27:28","action":"Acceso de lectura por: Javier Sánchez","by":"Lector (Jefatura)","projectId":"login","projectName":"Auditoría Visual"},{"action":"Cambió estado a [Pendiente]","by":"Ricardo Lira","projectId":"p_1791346340178","timestamp":"6/10/2026, 22:18:03","projectName":"fff","id":"1791346683479"},{"id":"1791346534979","projectName":"Auditoría Visual","timestamp":"6/10/2026, 22:15:34","action":"Acceso de lectura por: Javier Sánchez","by":"Lector (Jefatura)","projectId":"login"},{"projectName":"fff","projectId":"p_1791346340178","by":"Lector (Jefatura)","id":"1791346340178","action":"Creó el proyecto","timestamp":"6/10/2026, 22:12:20"},{"projectId":"login","by":"Lector (Jefatura)","timestamp":"6/10/2026, 22:09:58","id":"1791346198960","projectName":"Auditoría Visual","action":"Acceso de lectura por: Javier Sánchez"},{"id":"1791331281353","action":"Actualizó avance a 100%","projectId":"dp1","projectName":"Implementación ATN","timestamp":"6/10/2026, 18:01:21","by":"Osvaldo Avilés"},{"projectId":"dp1","by":"Osvaldo Avilés","timestamp":"6/10/2026, 18:01:20","projectName":"Implementación ATN","action":"Actualizó avance a 67%","id":"1791331280500"},{"id":"1791331267479","timestamp":"6/10/2026, 18:01:07","action":"Actualizó avance a 100%","projectId":"dp1","by":"Osvaldo Avilés","projectName":"Implementación ATN"},{"by":"Osvaldo Avilés","timestamp":"6/10/2026, 18:00:59","action":"Actualizó avance a 67%","projectId":"dp1","id":"1791331259780","projectName":"Implementación ATN"},{"id":"1791331098336","timestamp":"6/10/2026, 17:58:18","projectName":"General","action":"Completó tarea general: Asigba4 hsjfhs","projectId":"global","by":"Emmanuel Sánchez"},{"timestamp":"6/10/2026, 17:57:00","by":"Osvaldo Avilés","action":"Asignó tarea general a Emmanuel Sánchez","id":"1791331020124","projectName":"General","projectId":"global"},{"by":"Osvaldo Avilés","projectId":"global","action":"Completó tarea general: Testing","projectName":"General","id":"1791329365777","timestamp":"6/10/2026, 17:29:25"},{"projectId":"global","projectName":"General","id":"1791329354040","by":"Miguel Barbosa","action":"Asignó tarea general a Osvaldo Avilés","timestamp":"6/10/2026, 17:29:14"},{"id":"1791329263234","timestamp":"6/10/2026, 17:27:43","action":"Actualizó avance a 100%","projectId":"p_1791193478080","projectName":"PRUEBA 1","by":"Miguel Barbosa"},{"projectName":"PRUEBA 1","timestamp":"6/10/2026, 17:27:24","id":"1791329244693","projectId":"p_1791193478080","by":"Miguel Barbosa","action":"Actualizó avance a 67%"},{"id":"1791250453443","timestamp":"5/10/2026, 19:34:13","projectName":"General","action":"Completó tarea general: Actualiza tu información","by":"Rafael Romero","projectId":"global"},{"id":"1791250431738","timestamp":"5/10/2026, 19:33:51","by":"Osvaldo Avilés","projectId":"global","action":"Asignó tarea general a Rafael Romero","projectName":"General"},{"by":"Emmanuel Sánchez","timestamp":"5/10/2026, 19:31:06","action":"Completó una tarea","projectName":"Gestión Web / Competencia","id":"1791250266760","projectId":"p6"},{"projectName":"Gestión Web / Competencia","projectId":"p6","by":"Osvaldo Avilés","timestamp":"5/10/2026, 19:30:13","id":"1791250213227","action":"Agregó nueva tarea"},{"id":"1791242008388","projectId":"dp1","action":"Completó una tarea","by":"Osvaldo Avilés","projectName":"Implementación ATN","timestamp":"5/10/2026, 17:13:28"},{"id":"1791242006182","projectId":"dp1","projectName":"Implementación ATN","action":"Agregó nueva tarea","by":"Osvaldo Avilés","timestamp":"5/10/2026, 17:13:26"},{"timestamp":"5/10/2026, 15:33:11","id":"1791235991011","action":"Completó una tarea","by":"Emmanuel Sánchez","projectId":"p2","projectName":"Versión Paytech"},{"timestamp":"5/10/2026, 15:31:30","projectName":"Boletos por SMS","id":"1791235890545","action":"Cambió estado a [No Iniciado]","by":"Emmanuel Sánchez","projectId":"dp2"},{"projectId":"p1","by":"Emmanuel Sánchez","action":"Completó una tarea","id":"1791235872454","projectName":"Flechamigo","timestamp":"5/10/2026, 15:31:12"},{"id":"1791235870872","timestamp":"5/10/2026, 15:31:10","projectName":"Flechamigo","projectId":"p1","action":"Completó una tarea","by":"Emmanuel Sánchez"},{"projectName":"Flechamigo","projectId":"p1","by":"Emmanuel Sánchez","action":"Completó una tarea","timestamp":"5/10/2026, 15:31:09","id":"1791235869679"},{"by":"Emmanuel Sánchez","timestamp":"5/10/2026, 15:31:04","projectName":"General","action":"Completó tarea general: gyefsdhbkajd","id":"1791235864003","projectId":"global"},{"timestamp":"5/10/2026, 15:14:02","by":"Emmanuel Sánchez","projectName":"Implementación ATN","action":"Completó una tarea","projectId":"dp1","id":"1791234842831"},{"projectId":"p2","action":"Actualizó enlace de Drive","by":"Osvaldo Avilés","projectName":"Versión Paytech","timestamp":"5/10/2026, 15:12:30","id":"1791234750540"},{"timestamp":"5/10/2026, 15:01:41","action":"Creó el proyecto","by":"Emmanuel Sánchez","projectName":"PRUEBA 1","id":"1791234101902","projectId":"p_1791234101902"},{"projectName":"Implementación ATN","id":"1791233951727","projectId":"dp1","action":"Cambió estado a [Completado]","timestamp":"5/10/2026, 14:59:11","by":"Emmanuel Sánchez"},{"id":"1791233943933","timestamp":"5/10/2026, 14:59:03","projectName":"Implementación ATN","projectId":"dp1","by":"Emmanuel Sánchez","action":"Actualizó avance a 100%"},{"by":"Emmanuel Sánchez","projectId":"dp1","action":"Actualizó avance a 67%","projectName":"Implementación ATN","id":"1791233942315","timestamp":"5/10/2026, 14:59:02"},{"projectId":"dp1","id":"1791233941483","projectName":"Implementación ATN","timestamp":"5/10/2026, 14:59:01","by":"Emmanuel Sánchez","action":"Actualizó avance a 33%"},{"by":"Osvaldo Avilés","projectId":"dp1","projectName":"Implementación ATN","action":"Asignó tarea a Emmanuel Sánchez","timestamp":"5/10/2026, 14:58:27","id":"1791233907017"},{"projectId":"global","projectName":"General","id":"1791233860500","action":"Asignó tarea general a Emmanuel Sánchez","by":"Osvaldo Avilés","timestamp":"5/10/2026, 14:57:40"},{"projectName":"Versión Paytech","timestamp":"5/10/2026, 14:46:52","id":"1791233212187","by":"Emmanuel Sánchez","action":"Agregó nueva tarea","projectId":"p2"},{"action":"Editó detalles internos","by":"Osvaldo Avilés","projectId":"p2","projectName":"Versión Paytech","timestamp":"5/10/2026, 14:46:19","id":"1791233179306"},{"timestamp":"5/10/2026, 14:44:43","by":"Osvaldo Avilés","projectName":"Versión Paytech","id":"1791233083083","projectId":"p2","action":"Editó detalles internos"},{"action":"Actualizó estado a [En Progreso]","id":"1791233068687","timestamp":"5/10/2026, 14:44:28","projectId":"p2","projectName":"Versión Paytech","by":"Osvaldo Avilés"},{"action":"Editó detalles internos","id":"1791232263829","timestamp":"5/10/2026, 14:31:03","projectName":"Implementación ATN","by":"Osvaldo Avilés","projectId":"dp1"},{"id":"1791232112459","projectId":"dp1","projectName":"Implementación ATN","action":"Cambió estado a [En Progreso]","by":"Osvaldo Avilés","timestamp":"5/10/2026, 14:28:32"},{"projectId":"p1","id":"1791232029346","projectName":"Flechamigo","by":"Emmanuel Sánchez","action":"Agregó nueva tarea","timestamp":"5/10/2026, 14:27:09"},{"projectId":"p1","projectName":"Flechamigo","by":"Osvaldo Avilés","id":"1791232005255","action":"Asignó tarea global a Emmanuel Sánchez","timestamp":"5/10/2026, 14:26:45"},{"action":"Completó una tarea","projectId":"p1","projectName":"Flechamigo","id":"1791231259342","by":"Miguel Muñoz","timestamp":"5/10/2026, 14:14:19"},{"action":"Agregó nueva tarea","id":"1791231243734","projectId":"p1","projectName":"Flechamigo","by":"Miguel Muñoz","timestamp":"5/10/2026, 14:14:03"},{"id":"1791231139990","action":"Asignó tarea global a Emmanuel Sánchez","projectName":"Flechamigo","timestamp":"5/10/2026, 14:12:19","by":"Osvaldo Avilés","projectId":"p1"},{"by":"Osvaldo Avilés","projectName":"Flechamigo","timestamp":"5/10/2026, 14:10:21","action":"Asignó tarea global a Emmanuel Sánchez","id":"1791231021184","projectId":"p1"},{"projectId":"dp1","action":"Completó una tarea","id":"1791230363281","projectName":"Implementación ATN","by":"Miguel Muñoz","timestamp":"5/10/2026, 13:59:23"},{"projectId":"dp1","action":"Agregó nueva tarea","id":"1791230250962","projectName":"Implementación ATN","timestamp":"5/10/2026, 13:57:30","by":"Osvaldo Avilés"},{"by":"Osvaldo Avilés","action":"Completó una tarea","projectName":"Implementación ATN","projectId":"dp1","timestamp":"5/10/2026, 13:57:08","id":"1791230228797"},{"projectId":"dp1","id":"1791229391558","projectName":"Implementación ATN","action":"Agregó nueva tarea","timestamp":"5/10/2026, 13:43:11","by":"Osvaldo Avilés"},{"projectName":"Gestión Web / Competencia","projectId":"p6","by":"Osvaldo Avilés","id":"1791228396385","timestamp":"5/10/2026, 13:26:36","action":"Completó una tarea"},{"projectId":"p6","id":"1791228391099","by":"Osvaldo Avilés","action":"Agregó nueva tarea","timestamp":"5/10/2026, 13:26:31","projectName":"Gestión Web / Competencia"}],"core":{"id":"sicom","name":"SICOM"},"modules":[{"name":"COM","id":"m1","projects":[{"consultants":["Óscar González"],"docs":{},"status":"Pendiente","progress":0,"tasks":[{"text":"Actualizar","assignee":"Emmanuel Sánchez","id":"t_1791231139989","deadline":"2026-10-06","done":true},{"text":"Actualizar","assignee":"Miguel Muñoz","id":"t_1791231243734","done":true,"deadline":"2026-10-06"},{"text":"grhewsjasiqwhd","deadline":"2026-10-08","id":"t_1791232005253","done":true,"assignee":"Emmanuel Sánchez"},{"id":"t_1791232029345","done":true,"assignee":"Emmanuel Sánchez","text":"hgdksajdh","deadline":"2026-10-15"}],"priority":1,"deadline":"","_renderData":{"x":-840,"y":-262.5,"color":"#10b981","type":"project"},"name":"Flechamigo","id":"p1"},{"clientDeliveryDate":"2026-10-13","docs":{"doc_1791193015065":{"obs":"","checked":false,"naValidated":false,"na":false},"doc_1791192995498":{"naValidated":false,"na":false,"checked":false,"obs":""},"doc_1791193027382":{"obs":"","na":false,"checked":false,"naValidated":false}},"notes":"seguimiento","tasks":[],"deadline":"2026-10-14","consultants":["Óscar González"],"driveLink":"","progress":0,"id":"p2","_renderData":{"x":-840,"y":-187.5,"color":"#10b981","type":"project"},"priority":3,"name":"Versión Paytech","invgateLink":"","clientReturnDate":"2026-10-08","status":"En Progreso"},{"id":"p3","deadline":"","name":"Versión CPU","consultants":["Óscar González"],"priority":3,"_renderData":{"x":-840,"y":-112.5,"color":"#10b981","type":"project"},"status":"Pendiente","docs":{},"progress":0},{"progress":0,"name":"OV Dinámica","_renderData":{"x":-840,"y":-37.5,"color":"#10b981","type":"project"},"id":"p4","consultants":["Óscar González"],"docs":{},"status":"Pendiente","deadline":"","priority":3},{"status":"Pendiente","id":"p5","consultants":["Óscar González"],"progress":0,"name":"Separación Destinos Fav.","_renderData":{"x":-840,"y":37.5,"color":"#10b981","type":"project"},"deadline":"","priority":4,"docs":{}}],"color":"#0071e3"},{"name":"CONTROLES VOLUMÉTRICOS","id":"m2","projects":[{"clientReturnDate":"","consultants":["Osvaldo Avilés"],"progress":0,"id":"p6","name":"Gestión Web / Competencia","priority":1,"deadline":"2027-01-01","clientDeliveryDate":"","status":"En Progreso","tasks":[],"docs":{"doc_1791193027382":{"naValidated":false,"na":false,"obs":"","checked":false},"doc_1791192995498":{"na":false,"obs":"","checked":false,"naValidated":false},"doc_1791193015065":{"na":false,"naValidated":false,"checked":false,"obs":""}},"_renderData":{"x":840,"y":-412.5,"color":"#7eaefb","type":"project"}},{"id":"p7","notes":"","clientReturnDate":"","deadline":"","clientDeliveryDate":"","docs":{"doc_1791193015065":{"checked":false,"naValidated":false,"obs":"","na":false},"doc_1791193027382":{"obs":"","checked":false,"naValidated":false,"na":false},"doc_1791192995498":{"naValidated":false,"checked":false,"na":false,"obs":""}},"driveLink":"","_renderData":{"x":840,"y":-337.5,"color":"url(#grad-5ac8fa-a855f7-7eaefb)","type":"project"},"invgateLink":"","name":"Pantallas Volumétricos","priority":1,"progress":0,"status":"Pendiente","consultants":["Manuel Gutierrez","Rafael Romero","Osvaldo Avilés"]},{"_renderData":{"x":840,"y":-262.5,"color":"#7eaefb","type":"project"},"id":"p8","status":"Pendiente","progress":0,"docs":{},"deadline":"","priority":2,"consultants":["Osvaldo Avilés"],"name":"Carta Porte"},{"docs":{},"deadline":"","priority":3,"_renderData":{"x":840,"y":-187.5,"color":"#7eaefb","type":"project"},"name":"Versión .NET","status":"Pendiente","consultants":["Osvaldo Avilés"],"id":"p9","progress":0},{"progress":0,"name":"Reporte P.H.","_renderData":{"x":840,"y":-112.5,"color":"#7eaefb","type":"project"},"docs":{},"status":"Pendiente","consultants":["Osvaldo Avilés"],"deadline":"","id":"p10","priority":4},{"progress":0,"id":"p11","_renderData":{"x":840,"y":-37.5,"color":"#7eaefb","type":"project"},"name":"Tabla Int.","status":"Pendiente","priority":5,"docs":{},"consultants":["Osvaldo Avilés"],"deadline":""}],"color":"#30d158"},{"color":"#bf5af2","projects":[{"consultants":["Emmanuel Sánchez"],"name":"Correcciones Panel","deadline":"","priority":1,"progress":0,"docs":{},"status":"Pendiente","_renderData":{"x":-840,"y":112.5,"color":"#f97316","type":"project"},"id":"p12"},{"status":"Pendiente","name":"Contador Pasajeros COP COM","notes":"","deadline":"","clientReturnDate":"","id":"p13","consultants":["Emmanuel Sánchez"],"progress":0,"driveLink":"","docs":{"doc_1791192995498":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193027382":{"naValidated":false,"checked":false,"na":false,"obs":""},"doc_1791193015065":{"checked":false,"naValidated":false,"obs":"","na":false}},"_renderData":{"x":-840,"y":187.5,"color":"#f97316","type":"project"},"invgateLink":"","priority":2,"clientDeliveryDate":""},{"id":"p14","consultants":["Emmanuel Sánchez"],"name":"Fase 2 ATR","progress":0,"_renderData":{"x":-840,"y":262.5,"color":"#f97316","type":"project"},"status":"Pendiente","deadline":"","priority":5,"docs":{}},{"priority":6,"deadline":"","name":"Implementación AVM","_renderData":{"x":-840,"y":337.5,"color":"#f97316","type":"project"},"docs":{},"status":"Pendiente","progress":0,"consultants":["Emmanuel Sánchez"],"id":"p15"},{"priority":9,"deadline":"","id":"p16","docs":{},"status":"Pendiente","consultants":["Emmanuel Sánchez"],"_renderData":{"x":-840,"y":412.5,"color":"#f97316","type":"project"},"name":"Requerimientos TEO","progress":0}],"id":"m3","name":"PORTAL OPERATIVO"},{"name":"PANTALLAS EN TERMINAL","id":"m4","color":"#ff453a","projects":[{"consultants":["Emmanuel Sánchez"],"docs":{},"id":"p17","progress":0,"deadline":"","status":"Pendiente","priority":4,"_renderData":{"x":840,"y":37.5,"color":"#f97316","type":"project"},"name":"Pantalla a Público"},{"consultants":["Emmanuel Sánchez"],"progress":0,"docs":{},"status":"Pendiente","_renderData":{"x":840,"y":112.5,"color":"#f97316","type":"project"},"priority":4,"deadline":"","name":"Pantalla p. Jefes Op.","id":"p18"}]},{"projects":[{"status":"Pendiente","_renderData":{"x":840,"y":187.5,"color":"#f97316","type":"project"},"name":"Reportes / Vistas BI","progress":0,"deadline":"","priority":7,"docs":{},"id":"p19","consultants":["Emmanuel Sánchez"]}],"name":"BI","color":"#ff9f0a","id":"m5"},{"projects":[{"priority":3,"consultants":["Óscar González"],"deadline":"","status":"Pendiente","name":"Despacho Centralizado","_renderData":{"x":840,"y":262.5,"color":"#10b981","type":"project"},"docs":{},"progress":0,"id":"p20"}],"id":"m6","name":"DESPACHO CENTRALIZADO","color":"#5ac8fa"},{"id":"m7","color":"#ffd60a","projects":[{"name":"Reportes Ciberseguridad","clientReturnDate":"","consultants":["Osvaldo Avilés"],"clientDeliveryDate":"","priority":6,"deadline":"","docs":{"doc_1791192995498":{"naValidated":false,"na":false,"checked":false,"obs":""},"doc_1791193027382":{"checked":false,"na":false,"obs":"","naValidated":false},"doc_1791193015065":{"obs":"","na":false,"naValidated":false,"checked":false}},"progress":0,"id":"p21","status":"En Progreso","_renderData":{"x":-840,"y":487.5,"color":"#7eaefb","type":"project"}}],"name":"PLATAFORMA ÚNICA DE IDENTIDAD"},{"projects":[],"id":"m_1791193338595","name":"Módulo de Planeación y Servicios (MPS)","color":"#00ffff"},{"id":"m_1791193355710","color":"#00ffff","projects":[],"name":"Módulo Comercial (MC)"},{"name":"Módulo de Liquidación a Conductores (MLC)","id":"m_1791193408237","projects":[],"color":"#00ffff"}],"globalTasks":[{"done":true,"id":"gt_1791233860500","assignedBy":"Osvaldo Avilés","assignTime":"02:57 p.m.","deadline":"2026-10-05","assignDate":"5/10/2026","text":"gyefsdhbkajd","assignee":"Emmanuel Sánchez"},{"text":"Actualiza tu información","assignTime":"07:33 p.m.","assignedBy":"Osvaldo Avilés","assignDate":"5/10/2026","deadline":"2026-10-05","id":"gt_1791250431737","assignee":"Rafael Romero","done":true},{"assignDate":"6/10/2026","assignee":"Osvaldo Avilés","assignedBy":"Miguel Barbosa","assignTime":"05:29 p.m.","done":true,"deadline":"2026-10-07","text":"Testing","id":"gt_1791329354039"},{"assignee":"Emmanuel Sánchez","id":"gt_1791331020123","deadline":"2026-10-06","text":"Asigba4 hsjfhs","done":true,"assignDate":"6/10/2026","assignedBy":"Osvaldo Avilés","assignTime":"05:57 p.m."}],"dailyTasks":[]};

    let appData = JSON.parse(JSON.stringify(defaultTestingData));
    let consultants = JSON.parse(JSON.stringify(fallbackConsultants));
    let globalDocs = [{"id":"doc_1791193027382","name":"Propuesta Comercial"},{"id":"doc_1791192995498","name":"Contrato"},{"id":"doc_1791193015065","name":"Plano(s) de negocio"},{"id":"doc_1791350819805","name":"Plan de trabajo"},{"id":"doc_1791350871690","name":"Matriz de pruebas"},{"id":"doc_1791350852225","name":"Formato de Validación"},{"id":"doc_1791350881937","name":"Certificado de Pruebas"},{"id":"doc_1791350912895","name":"Certificado de Comité"},{"id":"doc_1791350927050","name":"Certificado de Capacitación"},{"id":"doc_1791350940031","name":"Carta de Liberación"},{"id":"doc_1791350945532","name":"Factura"}];
    window.getAppData = () => appData;
    try {
      Object.defineProperty(window, 'appData', {
        get: () => appData,
        set: (v) => { appData = v; },
        configurable: true
      });
    } catch (_) {
      window.appData = appData;
    }

    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = '#8e8e93'; 
      Chart.defaults.borderColor = 'rgba(255,255,255,0.05)'; 
      Chart.defaults.font.family = 'Inter';
    }

    // --- SISTEMA DE TEMAS DUAL (DARK / LIGHT MODO APPLE) ---
    // NOTA: Por directiva de UX, el modo Claro está temporalmente bloqueado y restringido al perfil 'Supremo'.
    window.setTheme = function(theme) {
        if (typeof currentUserRole !== 'undefined' && currentUserRole && currentUserRole !== 'Supremo') {
            theme = 'dark';
        }
        const isLight = theme === 'light';
        if (isLight) {
            document.body.classList.add('theme-light');
            document.documentElement.classList.add('theme-light');
            document.documentElement.classList.remove('dark');
        } else {
            document.body.classList.remove('theme-light');
            document.documentElement.classList.remove('theme-light');
            document.documentElement.classList.add('dark');
        }
        localStorage.setItem('sicom_theme', isLight ? 'light' : 'dark');

        const sunIcon = document.getElementById('themeIconSun');
        const moonIcon = document.getElementById('themeIconMoon');
        const themeLabel = document.getElementById('themeToggleLabel');
        const mobileThemeText = document.getElementById('mobileThemeText');

        if (sunIcon && moonIcon) {
            if (isLight) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
                if (themeLabel) themeLabel.textContent = 'Claro';
                if (mobileThemeText) mobileThemeText.textContent = 'Modo Oscuro';
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
                if (themeLabel) themeLabel.textContent = 'Oscuro';
                if (mobileThemeText) mobileThemeText.textContent = 'Modo Claro';
            }
        }

        if (window.Chart) {
            Chart.defaults.color = isLight ? '#6e6e73' : '#8e8e93';
            Chart.defaults.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
        }

        if (typeof window.renderMindMap === 'function' && canvasGroup) {
            window.renderMindMap();
        }
    };

    window.toggleTheme = function() {
        if (typeof currentUserRole !== 'undefined' && currentUserRole && currentUserRole !== 'Supremo') {
            window.showToast('🔒 El cambio de tema está bloqueado. Exclusivo para perfil Supremo.', true);
            return;
        }
        const currentTheme = localStorage.getItem('sicom_theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        window.setTheme(newTheme);
        window.showToast(newTheme === 'light' ? '☀️ Modo Claro activado (Supremo)' : '🌙 Modo Oscuro activado (Supremo)');
    };

    window.initTheme = function() {
        let savedTheme = localStorage.getItem('sicom_theme') || 'dark';
        if (typeof currentUserRole !== 'undefined' && currentUserRole && currentUserRole !== 'Supremo') {
            savedTheme = 'dark';
        }
        window.setTheme(savedTheme);
    };

    // --- EXPERIENCIA DELEITE (CONFETTI CELEBRACIÓN DUOLINGO) ---
    window.triggerCelebration = function(originX = 0.5, originY = 0.6) {
        if (typeof confetti === 'function') {
            try {
                confetti({
                    particleCount: 55,
                    spread: 65,
                    origin: { x: originX, y: originY },
                    colors: ['#0071e3', '#30d158', '#ffd60a', '#bf5af2', '#ff9f0a'],
                    ticks: 200,
                    gravity: 1.2,
                    scalar: 0.9,
                    disableForReducedMotion: true
                });
            } catch (e) {
                console.warn('Celebration confetti:', e);
            }
        }
    };

    // Inicialización inmediata de tema
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initTheme);
    } else {
        window.initTheme();
    }


    async function initData() {
        window.populateLoginDropdown();

        // Arranque instantáneo de interfaz (Cero tiempo de espera)
        if (localAuthor) { 
            finishInit(); 
        } else { 
            showLoginScreen(); 
        } 

        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js");
            const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js");
            const { getFirestore, doc, setDoc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js");
            
            globalDoc = doc; globalSetDoc = setDoc;

            const firebaseConfig = {
                apiKey: ['AIzaSyD5_UtypfJ', 'g5qsFDdv-MBamP18IZ_vZhVE'].join(''),
                authDomain: "sicom-stgt.firebaseapp.com",
                projectId: "sicom-stgt",
                storageBucket: "sicom-stgt.firebasestorage.app",
                messagingSenderId: "690320034262",
                appId: "1:690320034262:web:8ddf75c3310ad669c83c77"
            };

            const app = initializeApp(firebaseConfig);
            auth = getAuth(app); db = getFirestore(app); appId = 'sicom-stgt';

            await signInAnonymously(auth);

            if(auth.currentUser) {
                isFirebaseReady = true;
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main');
                
                unsubscribeSnapshot = onSnapshot(docRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        
                        // Protección estricta: verificar que la nube tenga módulos reales
                        if (data.appData && Array.isArray(data.appData.modules) && data.appData.modules.length > 0) {
                            appData = data.appData;
                        } else {
                            console.warn("⚠️ [SICOM Cloud] Firestore sin módulos detectado. Restaurando datos maestros a la nube...");
                            appData = JSON.parse(JSON.stringify(defaultTestingData));
                            if (globalSetDoc && docRef) {
                                globalSetDoc(docRef, { appData, consultants, globalDocs }, { merge: false });
                            }
                        }
                        
                        if(data.consultants && Object.keys(data.consultants).length > 2) {
                            consultants = data.consultants;
                            if (consultants["Osvaldo Avilés"]) consultants["Osvaldo Avilés"].role = "Supremo";
                            if (consultants["Rafael Romero"]) consultants["Rafael Romero"].role = "Supervisor";
                            if (!consultants["Miguel Barbosa"]) consultants["Miguel Barbosa"] = {"color": "#30d158", "role": "Supervisor"};
                            if (!consultants["Lector (Jefatura)"]) consultants["Lector (Jefatura)"] = {"color": "#8e8e93", "role": "Lector"};
                            Object.keys(consultants).forEach(k => { if(!consultants[k].role) consultants[k].role = "Consultor"; });
                        }
                        globalDocs = data.globalDocs || []; ensureDataStructure();
                        
                        if(localAuthor && consultants[localAuthor]) {
                            currentUserRole = consultants[localAuthor].role;
                            localStorage.setItem('sicom_role', currentUserRole);
                            window.applyRolePermissions();
                        }
                        
                        if(localAuthor) refreshUI(); else window.populateLoginDropdown(); 
                    } else {
                        loadLocalFallback(); 
                        setDoc(docRef, { appData, consultants, globalDocs }, { merge: true });
                    }
                }, (error) => { console.error("Error Firebase:", error); loadLocalFallback(); });
            }
        } catch (e) { 
            console.error("Fallo inicialización Firebase:", e); 
            loadLocalFallback(); 
        }

        if(localAuthor) { finishInit(); } else { showLoginScreen(); }
    }

    // Registro de auditoría (Historial). Firma: (idElemento, nombreElemento, accion, autor)
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
        } catch (e) { console.warn('No se pudo registrar la actividad:', e); }
    }

    function ensureDataStructure() {
        if(!appData.history) appData.history = []; 
        if(!appData.secondaryCore) appData.secondaryCore = { id: 'sucom', name: 'SUCOM', active: false };
        if(!appData.directHub) appData.directHub = { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' };
        if(!appData.core) appData.core = { id: 'sicom', name: 'SICOM' };
        if(!appData.directProjects) appData.directProjects = [];
        if(!appData.modules) appData.modules = [];
        if(!appData.dailyTasks) appData.dailyTasks = [];
        if(!appData.globalTasks) appData.globalTasks = [];

        // --- Autoreparación: un proyecto con datos dañados ya no impide abrir su ficha ---
        const idsVistos = new Set();
        const repararProyectos = (lista) => (lista || []).filter(p => p && typeof p === 'object').map(p => {
            if (!p.id || idsVistos.has(p.id)) { let n = 1, base = p.id || 'p', nuevo = base + '_r' + n; while (idsVistos.has(nuevo)) nuevo = base + '_r' + (++n); p.id = nuevo; }
            idsVistos.add(p.id);
            p.tasks = Array.isArray(p.tasks) ? p.tasks.filter(t => t && typeof t === 'object') : [];
            if (typeof p.notes !== 'string') p.notes = Array.isArray(p.notes) ? p.notes.filter(n => n && typeof n === 'object') : [];
            if (p.docs === null || typeof p.docs !== 'object') p.docs = {};
            if (p.deadline && typeof p.deadline !== 'string') p.deadline = '';
            if (p.driveLink && typeof p.driveLink !== 'string') p.driveLink = '';
            if (p.invgateLink && typeof p.invgateLink !== 'string') p.invgateLink = '';
            return p;
        });
        appData.directProjects = repararProyectos(appData.directProjects);
        appData.modules = appData.modules.filter(m => m && typeof m === 'object');
        appData.modules.forEach(m => { m.projects = repararProyectos(m.projects); });
    }

    function loadLocalFallback() {
        const localD = localStorage.getItem('sicom_data'); const localC = localStorage.getItem('sicom_consultants'); const localDocs = localStorage.getItem('sicom_global_docs');
        let parsedData = localD ? JSON.parse(localD) : null;
        if (!parsedData || !parsedData.modules || parsedData.modules.length === 0) { 
            appData = JSON.parse(JSON.stringify(defaultTestingData)); 
            consultants = JSON.parse(JSON.stringify(fallbackConsultants)); 
            globalDocs = []; 
        } else { 
            appData = parsedData; ensureDataStructure(); 
            consultants = localC ? JSON.parse(localC) : JSON.parse(JSON.stringify(fallbackConsultants)); 
            if (consultants["Osvaldo Avilés"]) consultants["Osvaldo Avilés"].role = "Supremo";
            if (consultants["Rafael Romero"]) consultants["Rafael Romero"].role = "Supervisor";
            if (!consultants["Miguel Barbosa"]) consultants["Miguel Barbosa"] = {"color": "#30d158", "role": "Supervisor"};
                            if (!consultants["Lector (Jefatura)"]) consultants["Lector (Jefatura)"] = {"color": "#8e8e93", "role": "Lector"};
            Object.keys(consultants).forEach(k => { if(!consultants[k].role) consultants[k].role = "Consultor"; });
            globalDocs = localDocs ? JSON.parse(localDocs) : []; 
        }

        if(localAuthor && consultants[localAuthor]) {
            currentUserRole = consultants[localAuthor].role;
            localStorage.setItem('sicom_role', currentUserRole);
        }
    }

    window.populateLoginDropdown = function() {
        const select = document.getElementById('loginUserSelect'); if(!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="" class="bg-black text-gray-400">-- Seleccionar Perfil --</option>';
        let allConsultants = Object.keys(consultants);
        if (!allConsultants.includes('Osvaldo Avilés')) allConsultants.push('Osvaldo Avilés');
        allConsultants.sort().forEach(c => { select.innerHTML += `<option value="${escapeHtml(c)}" class="bg-black text-white">${escapeHtml(c)}</option>`; });
        if (currentVal && allConsultants.includes(currentVal)) select.value = currentVal;
    }

    function showLoginScreen() {
        document.getElementById('cloudLoader').style.opacity = '0'; setTimeout(() => document.getElementById('cloudLoader').style.display = 'none', 500);
        const overlay = document.getElementById('loginOverlay'), card = document.getElementById('loginCard');
        overlay.classList.remove('hidden'); setTimeout(() => { overlay.style.opacity = '1'; card.style.opacity = '1'; card.style.transform = 'scale(1) translateY(0)'; }, 50);
    }

    window.togglePasswordVisibility = function(inputId, iconId) {
        const passInput = document.getElementById(inputId), eyeIcon = document.getElementById(iconId);
        if (passInput.type === 'password') {
            passInput.type = 'text'; eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />`;
        } else {
            passInput.type = 'password'; eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
        }
    }

    window.handleLoginUserChange = function() {
        const val = document.getElementById('loginUserSelect').value;
        const passDiv = document.getElementById('loginPasswordDiv'), passLabel = document.getElementById('loginPasswordLabel');
        const lectorNameDiv = document.getElementById('loginLectorNameDiv');
        
        if (val) {
            const userRole = consultants[val] ? (consultants[val].role || 'Consultor') : 'Consultor';
            if (userRole === 'Supremo') {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Acceso Supremo (Administración)`;
                passLabel.className = 'block text-[10px] font-semibold mb-2 ml-1 flex items-center gap-1 uppercase tracking-widest text-[#ff453a]';
            } else if (userRole === 'Supervisor') {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Acceso Supervisor (Edición Completa)`;
                passLabel.className = 'block text-[10px] font-semibold mb-2 ml-1 flex items-center gap-1 uppercase tracking-widest text-[#ff9f0a]';
            } else if (userRole === 'Lector') {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Acceso Lector (Solo Vista)`;
                passLabel.className = 'block text-[10px] font-semibold mb-2 ml-1 flex items-center gap-1 uppercase tracking-widest text-gray-400';
            } else {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> Acceso Consultor (Básico)`;
                passLabel.className = 'block text-[10px] font-semibold mb-2 ml-1 flex items-center gap-1 uppercase tracking-widest text-brand-accent';
            }
            passDiv.classList.remove('hidden'); setTimeout(() => { passDiv.style.opacity = '1'; passDiv.style.transform = 'translateY(0)'; }, 10);
            
            if (userRole === 'Lector') {
                lectorNameDiv.classList.remove('hidden');
                setTimeout(() => { lectorNameDiv.style.opacity = '1'; lectorNameDiv.style.transform = 'translateY(0)'; }, 10);
            } else {
                lectorNameDiv.style.opacity = '0'; lectorNameDiv.style.transform = 'translateY(10px)'; 
                setTimeout(() => lectorNameDiv.classList.add('hidden'), 300);
            }
        } else { 
            passDiv.style.opacity = '0'; passDiv.style.transform = 'translateY(10px)'; setTimeout(() => passDiv.classList.add('hidden'), 300);
            if(lectorNameDiv) { lectorNameDiv.style.opacity = '0'; lectorNameDiv.style.transform = 'translateY(10px)'; setTimeout(() => lectorNameDiv.classList.add('hidden'), 300); }
        }
    }

    window.attemptLogin = function() {
        const val = document.getElementById('loginUserSelect').value;
        const pass = document.getElementById('loginPasswordInput').value;
        if (!val) { window.showToast("Selecciona tu perfil", true); return; }
        
        const cData = consultants[val];
        const userRole = cData ? (cData.role || 'Consultor') : 'Consultor';
        
        // Determinar contraseña esperada (Personalizada vs Default)
        let expectedPass = cData ? cData.password : null;
        if (!expectedPass) {
            if (userRole === 'Supremo') expectedPass = 'Sicom2026';
            else if (userRole === 'Supervisor') expectedPass = 'Super2026';
            else if (userRole === 'Lector') expectedPass = 'Lector2026';
            else expectedPass = 'Consultor2026';
        }

        let viewerName = '';
        if (userRole === 'Lector') {
            viewerName = document.getElementById('loginLectorNameInput').value.trim();
            if (!viewerName) {
                window.showToast("Ingresa tu nombre para auditoría", true);
                shakeLogin();
                return;
            }
        }

        if (pass !== expectedPass) { window.showToast("Contraseña incorrecta", true); shakeLogin(); return; }
        
        currentUserRole = userRole; 
    localAuthor = val;
    localStorage.setItem('sicom_author', val); 
    localStorage.setItem('sicom_role', currentUserRole);
    
    if (userRole === 'Lector') {
        logActivity('login', 'Control de Accesos', `Acceso de lectura por: ${viewerName}`, val);
    } else {
        logActivity('login', 'Control de Accesos', `Inició sesión en el sistema`, val);
    }
    
    // Ocultar overlay de forma inmediata y disparar la interfaz principal
    const overlay = document.getElementById('loginOverlay'); 
    if (overlay) {
        overlay.style.opacity = '0'; 
        setTimeout(() => { 
            overlay.classList.add('hidden'); 
            finishInit(); 
        }, 200);
    }
    }
    
    function shakeLogin() { document.getElementById('loginCard').style.transform = 'scale(0.98)'; setTimeout(() => document.getElementById('loginCard').style.transform = 'scale(1)', 150); }

    
    window.openTaskFeedbackModal = function(taskId, taskType, projectId = null) {
        document.getElementById('feedbackTaskId').value = taskId;
        document.getElementById('feedbackTaskType').value = taskType;
        document.getElementById('feedbackProjectId').value = projectId || '';
        document.getElementById('taskFeedbackText').value = '';
        
        const modal = document.getElementById('taskFeedbackModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    };

    window.closeTaskFeedbackModal = function() {
        const modal = document.getElementById('taskFeedbackModal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 400);
    };

    window.submitTaskFeedback = function() {
        const taskId = document.getElementById('feedbackTaskId').value;
        const taskType = document.getElementById('feedbackTaskType').value;
        const projectId = document.getElementById('feedbackProjectId').value;
        const feedback = document.getElementById('taskFeedbackText').value.trim();
        
        if (!feedback) {
            window.showToast("Debes ingresar una observación o evidencia", true);
            return;
        }

        const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
        const finalStatus = isSuper ? true : 'pending';
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-MX');
        const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        if (taskType === 'global') {
            const t = appData.globalTasks.find(x => x.id === taskId);
            if (t) {
                t.done = finalStatus;
                t.feedback = feedback;
                if (isSuper) {
                    t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${dateStr} ${timeStr}]` : '';
                    logActivity('global', 'General', `Validó tarea general de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor);
                    window.sendExternalAlert('TASK_VALIDATED', { project: 'General', task: t.text, validatedBy: localAuthor, consultant: t.assignee || 'Consultor' });
                } else {
                    t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                    logActivity('global', 'General', `Envió tarea a validación: "${t.text}" (Evidencia: "${feedback}")`, localAuthor);
                    window.sendExternalAlert('VALIDATION_SUBMITTED', { project: 'General', task: t.text, feedback: feedback, consultant: localAuthor });
                }
                window.saveData(false);
                window.renderAlerts();
            }
        } else if (taskType === 'daily') {
            const t = appData.dailyTasks.find(x => x.id === taskId);
            if (t) {
                t.done = finalStatus;
                t.feedback = feedback;
                if (isSuper) {
                    t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${dateStr} ${timeStr}]` : '';
                    logActivity('daily', 'Actividades Diarias', `Validó tarea diaria de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor);
                } else {
                    t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                    logActivity('daily', 'Actividades Diarias', `Envió tarea diaria a validación: "${t.text}" (Evidencia: "${feedback}")`, localAuthor);
                }
                window.saveData(false);
                window.renderAlerts();
            }
        } else {
            let item = null;
            if (projectId) {
                item = appData.directProjects.find(p => p.id === projectId);
                if (!item) {
                    appData.modules.forEach(m => {
                        const p = (m.projects||[]).find(proj => proj.id === projectId);
                        if (p) item = p;
                    });
                }
            } else {
                item = getSelectedItem();
            }
            
            if (item && item.tasks) {
                const t = item.tasks.find(x => x.id === taskId);
                if (t) {
                    t.done = finalStatus;
                    t.feedback = feedback;
                    if (isSuper) {
                        t.validatedDate = dateStr; t.validatedTime = timeStr; t.validatedBy = localAuthor;
                        const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${dateStr} ${timeStr}]` : '';
                        logActivity(item.id, item.name, `Validó tarea de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor);
                        window.sendExternalAlert('TASK_VALIDATED', {
                            project: item.name,
                            task: t.text,
                            validatedBy: localAuthor,
                            consultant: t.assignee || 'Consultor'
                        });
                    } else {
                        t.submittedDate = dateStr; t.submittedTime = timeStr; t.submittedBy = localAuthor;
                        logActivity(item.id, item.name, `Envió tarea a validación: "${t.text}" (Evidencia: "${feedback}")`, localAuthor);
                        window.sendExternalAlert('VALIDATION_SUBMITTED', {
                            project: item.name,
                            task: t.text,
                            feedback: feedback,
                            consultant: localAuthor
                        });
                    }
                    window.saveData(false); 
                    window.renderTasksQuick(item); 
                    window.renderAlerts();
                }
            }
        }
        
        window.renderDailyTasks();
        window.showToast("Enviado correctamente");
        window.triggerCelebration();
        window.closeTaskFeedbackModal();
    };

    
    window.toggleMobileMenu = function(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const menu = document.getElementById('mobileMenuDropdown');
        if (!menu) return;
        const isHidden = menu.classList.contains('opacity-0');
        if (isHidden) {
            menu.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
        } else {
            menu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        }
    };
    
    // Cerrar menú móvil al hacer clic o tocar fuera
    const handleCloseMobileMenuOutside = (e) => {
        const menu = document.getElementById('mobileMenuDropdown');
        if (menu && !menu.classList.contains('opacity-0')) {
            if (e.target.closest('#mobileMenuBtn') || e.target.closest('#mobileMenuDropdown')) return;
            menu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        }
    };
    document.addEventListener('click', handleCloseMobileMenuOutside);
    document.addEventListener('touchend', handleCloseMobileMenuOutside, { passive: true });

    window.logout = function() { document.getElementById('cloudLoader').style.display = 'flex'; document.getElementById('cloudLoader').style.opacity = '1'; setTimeout(() => { localStorage.removeItem('sicom_author'); localStorage.removeItem('sicom_role'); location.reload(); }, 500); }

    // --- SISTEMA DE CIERRE DE SESIÓN POR INACTIVIDAD (10 MIN) ---
    let inactivityTimeout;
    function resetInactivityTimeout() {
        clearTimeout(inactivityTimeout);
        if (localAuthor) {
            inactivityTimeout = setTimeout(() => {
                logActivity('logout', 'Control de Accesos', 'Cierre de sesión automático por inactividad (10 min)', localAuthor);
                window.saveData(false);
                window.logout();
            }, 600000); // 10 minutos (600,000 ms)
        }
    }
    // Eventos que reinician el temporizador
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => 
        document.addEventListener(evt, resetInactivityTimeout, {passive: true})
    );

    window.openManual = function() {
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
        if (isAlertsDrawerOpen) window.toggleAlertsDrawer();
        if (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) window.toggleDailyDrawer();
        
        const content = document.getElementById('manualContent');
        if (currentUserRole === 'Supremo') {
            content.innerHTML = `
            <div class="border-b border-white/10 pb-3 mb-4">
                <h3 class="text-lg font-bold text-[#ff453a] flex items-center gap-2">
                    <span>👑</span> Supremo (Dirección General)
                </h3>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Como Supremo, tienes el control absoluto de la arquitectura, configuración, usuarios y datos críticos del Mini-ERP SICOM.</p>
            </div>
            <ul class="text-xs space-y-3.5 text-gray-300 list-none leading-relaxed">
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🔑 Gestión de Accesos y Equipo:</strong>
                    En <strong>Panel > Equipo</strong>, puedes dar de alta nuevos consultores o modificar existentes. Haz clic en la llave para asignar o resetear la contraseña privada de cualquier usuario, o cambiar sus niveles de acceso al instante.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🏗️ Arquitectura y Estructura:</strong>
                    Eres el único con la capacidad de crear nuevos <strong>Módulos</strong> (agrupadores departamentales). Además, al editar un proyecto o módulo, tienes la facultad exclusiva de eliminarlo permanentemente.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📋 Panel Notificaciones y Trabajo (Izquierdo):</strong>
                    Supervisa todo el ciclo operativo en sus 4 pestañas: 
                    <span class="text-[#ff453a] font-semibold">⚠️ Alertas</span> (proyectos vencidos), 
                    <span class="text-[#35aee8] font-semibold">📌 Pendientes</span> (agrupadas por consultor), 
                    <span class="text-[#ff9f0a] font-semibold">⏳ Validación</span> (evidencias por auditar) y 
                    <span class="text-[#30d158] font-semibold">✅ Hechas</span> (tareas validadas). 
                    Puedes <strong>Aprobar</strong> o <strong>Rechazar</strong> entregas de cualquier miembro.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">➕ Acciones Rápidas (Speed Dial +):</strong>
                    Desde el botón flotante inferior puedes crear proyectos, registrar tus tareas personales, asignar <strong>Tareas por proyecto</strong> o abrir un nuevo módulo directamente sin buscar en el mapa.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📊 Docs Base y Estandarización:</strong>
                    En <strong>Panel > Docs Base</strong>, defines los documentos obligatorios de calidad. El avance porcentual (0 a 100%) de cada proyecto se calcula matemáticamente según los documentos validados.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🔒 Auditoría Inmutable y Respaldos:</strong>
                    En <strong>Panel > Historial</strong> puedes auditar quién hizo qué modificación y a qué hora. Al final del Panel dispones de herramientas para exportar a Excel (CSV), descargar respaldo JSON y forzar sincronización con Firebase.
                </li>
            </ul>`;
        } else if (currentUserRole === 'Supervisor') {
            content.innerHTML = `
            <div class="border-b border-white/10 pb-3 mb-4">
                <h3 class="text-lg font-bold text-[#ff9f0a] flex items-center gap-2">
                    <span>🛡️</span> Supervisor (Coordinador de Operaciones)
                </h3>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Como Supervisor, eres responsable del flujo operativo, la auditoría de calidad de las entregas y el cumplimiento de tiempos del equipo.</p>
            </div>
            <ul class="text-xs space-y-3.5 text-gray-300 list-none leading-relaxed">
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">⏳ Auditoría y Validación de Entregas:</strong>
                    Abre el panel izquierdo <strong>Notificaciones y Trabajo</strong> en la pestaña <strong>Validación</strong>. Verás las tareas concluidas por los consultores junto con su evidencia registrada. Podrás <span class="text-[#30d158] font-bold">✅ Aprobar</span> (pasa a Hechas y registra la firma) o <span class="text-[#ff453a] font-bold">❌ Rechazar</span> (se devuelve a pendientes para corrección).
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📌 Asignación de Tareas por Proyecto:</strong>
                    Utiliza el botón <strong>"+" > Tarea por proyecto</strong> para delegar actividades vinculadas directamente a cualquier proyecto, definiendo el responsable y la fecha límite sin necesidad de buscar el proyecto en el mapa.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🛠️ Control Operativo de Proyectos:</strong>
                    Selecciona cualquier proyecto para editar su estatus (No Iniciado, Pendiente, En Progreso, Completado), fechas compromiso (propuesta/autorización/límite), porcentaje de avance y enlaces oficiales de Drive e InvGate.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📈 Tablero y Radiografía Operativa:</strong>
                    Entra a <strong>Panel > Tablero</strong> para medir en tiempo real la carga de proyectos por consultor, su avance promedio y los proyectos con atrasos acumulados (<span class="text-[#ff453a]">🚨</span>).
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">💬 Foro Técnico y Notas:</strong>
                    Comunícate y registra acuerdos operativos en la sección de Foro y Notas Técnicas de cada proyecto.
                </li>
            </ul>`;
        } else if (currentUserRole === 'Lector') {
            content.innerHTML = `
            <div class="border-b border-white/10 pb-3 mb-4">
                <h3 class="text-lg font-bold text-gray-400 flex items-center gap-2">
                    <span>👁️</span> Lector (Auditoría y Supervisión Ejecutiva)
                </h3>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Como Lector, tienes acceso de auditoría visual total a todo el sistema SICOM, con protección absoluta contra alteraciones involuntarias.</p>
            </div>
            <ul class="text-xs space-y-3.5 text-gray-300 list-none leading-relaxed">
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🔍 Navegación y Búsqueda:</strong>
                    Explora libremente el mapa mental arrastrando con el ratón o el dedo. Usa la Lupa superior para localizar proyectos al instante o aplica filtros por consultor y estatus para evaluar áreas específicas.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📋 Inspección Detallada de Proyectos:</strong>
                    Haz clic en cualquier proyecto para ver su tarjeta informativa: estatus, fechas límite, tareas concluidas y el desglose de documentos base que acreditan matemáticamente su avance.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📁 Evidencias y Tickets Oficiales:</strong>
                    Accede directamente a los botones de <strong class="text-[#0071e3]">Drive</strong> e <strong class="text-[#30d158]">InvGate</strong> si han sido enlazados al proyecto.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📊 Métricas y Trazabilidad:</strong>
                    En el menú <strong>Panel</strong>, consulta el <strong>Tablero</strong> para evaluar el rendimiento global del equipo y la pestaña <strong>Historial</strong> para auditar cada movimiento registrado por los operadores.
                </li>
            </ul>`;
        } else {
            content.innerHTML = `
            <div class="border-b border-white/10 pb-3 mb-4">
                <h3 class="text-lg font-bold text-brand-accent flex items-center gap-2">
                    <span>🚀</span> Consultor Operativo (Ejecutor)
                </h3>
                <p class="text-xs text-gray-300 mt-1 leading-relaxed">Como Consultor, tu objetivo es ejecutar las asignaciones con precisión, documentar tu avance con evidencias y mantenerte al día con tus entregas.</p>
            </div>
            <ul class="text-xs space-y-3.5 text-gray-300 list-none leading-relaxed">
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📌 Centro de Trabajo (Panel Izquierdo):</strong>
                    Abre el panel <strong>Notificaciones y Trabajo</strong> en el extremo izquierdo. Encontrarás:
                    <br>• <strong class="text-white">Pendientes:</strong> Tus tareas aparecen al inicio bajo <strong>(Mis Tareas)</strong>. Puedes desplegar o contraer otros compañeros.
                    <br>• <strong class="text-[#ff453a]">Alertas:</strong> Avisos de proyectos próximos a vencer o con atrasos.
                    <br>• <strong class="text-[#ff9f0a]">Validación:</strong> Estado de tus entregas enviadas a jefatura (puedes cancelar el envío si necesitas corregir).
                    <br>• <strong class="text-[#30d158]">Hechas:</strong> Historial de tus tareas validadas y aprobadas.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">➕ Diferenciación de Tareas (Speed Dial +):</strong>
                    En el botón flotante (+) en la esquina inferior derecha:
                    <br>• <strong class="text-[#35aee8]">Nueva tarea diaria (Personal):</strong> Registra recordatorios o tareas de tu día a día personal.
                    <br>• <strong class="text-[#bf5af2]">Tarea por proyecto:</strong> Vincula una tarea directamente a un proyecto del sistema (queda registrada en el proyecto y visible para tu supervisor).
                    <br>• <strong class="text-[#ff9f0a]">Nuevo proyecto:</strong> Alta rápida de un proyecto en tu área.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📝 Reporte con Evidencia:</strong>
                    Al marcar una tarea como completada, se abrirá la ventana de evidencia. Escribe tu enlace, observación o resumen del entregable y pulsa <strong>Enviar a Validación</strong>. Tu supervisor la revisará y validará.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">🎯 Modo Enfoque y Filtros:</strong>
                    Pulsa el botón <strong>Modo Enfoque</strong> en la barra superior para atenuar todo el sistema y concentrarte únicamente en los proyectos donde estás asignado.
                </li>
                <li class="bg-black/40 p-3 rounded-xl border border-white/5">
                    <strong class="text-white block mb-1">📁 Enlaces Rápidos y Foro Técnico:</strong>
                    En la tarjeta de cada proyecto dispones de botones para abrir carpetas de <strong>Drive</strong> y tickets de <strong>InvGate</strong>, así como publicar notas o comentarios en el <strong>Foro Técnico</strong>.
                </li>
            </ul>`;
        }
        
        const modal = document.getElementById('manualModal');
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].style.transform = 'scale(1)'; }, 10);
    }
    
    window.closeManual = function() {
        const modal = document.getElementById('manualModal');
        modal.classList.add('opacity-0');
        modal.children[0].style.transform = 'scale(0.95)';
        setTimeout(() => modal.classList.add('hidden'), 400);
    }


    function finishInit() {
        document.getElementById('cloudLoader').style.display = 'none'; document.getElementById('topBarWelcome').textContent = `Bienvenido, ${localAuthor}`;
        try { window.initTheme(); ensureDataStructure(); window.applyRolePermissions(); refreshUI(); } catch (e) { console.error('Error al renderizar la interfaz:', e); }
        setTimeout(() => { try { window.recenterCanvas(); } catch (e) { console.error(e); } }, 100);
        resetInactivityTimeout(); // Iniciar temporizador de inactividad
    }

    window.applyRolePermissions = function() {
        const isSupremo = currentUserRole === 'Supremo';
        const isSupervisorUp = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';

        if (!isSupremo) {
            window.setTheme('dark');
        }

        document.querySelectorAll('.supremo-only').forEach(el => { 
            if(isSupremo) el.classList.remove('hidden'); else el.classList.add('hidden'); 
        });

        document.querySelectorAll('.supervisor-up').forEach(el => { 
            if(isSupervisorUp) el.classList.remove('hidden'); else el.classList.add('hidden'); 
        });

        const isLector = currentUserRole === 'Lector';
        document.querySelectorAll('.lector-hide').forEach(el => { 
            if(isLector) el.classList.add('hidden'); else el.classList.remove('hidden'); 
        });
        
        const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
        if (activeTabEl && activeTabEl.id === 'tab-new' && isLector) {
            window.switchTab('dashboard');
        }
        if (activeTabEl && !isSupremo && (activeTabEl.id === 'tab-consultants' || activeTabEl.id === 'tab-docs')) {
            window.switchTab('dashboard');
        }
        if (activeTabEl && !isSupervisorUp && (activeTabEl.id === 'tab-edit' || activeTabEl.id === 'tab-history')) {
            window.switchTab('dashboard');
        }
    }

    function refreshUI() {
        window.ensureDomReferences(); window.populateConsultantSelects(); window.renderRegisteredConsultantsList(); window.renderRegisteredDocsList();
        window.populateGlobalEditSelector(); window.updateDatalist(); window.renderMindMap(); window.renderHistory(); window.renderDashboard(); 
        if(isPriorityDrawerOpen) window.renderPriorityDrawer();
        window.renderAlerts(); // SENSOR DE ALERTAS
        refreshOpenInfoNotes();
    }

    // Si la tarjeta de un proyecto está abierta, actualiza sus comentarios cuando llegan cambios de otros usuarios
    function refreshOpenInfoNotes() {
        try {
            const card = document.getElementById('infoCard');
            if (!card || card.classList.contains('hidden')) return;
            if (currentSelection.type !== 'project' && currentSelection.type !== 'direct-project') return;
            const item = getSelectedItem(); if (!item) return;
            const n = Array.isArray(item.notes) ? item.notes : [];
            const sig = n.length + ':' + (n.length ? n[n.length - 1].id : '');
            if (card.dataset.notesSig === sig) return; // sin cambios: no mover el scroll del lector
            card.dataset.notesSig = sig;
            window.renderNotesHistory(item.notes, 'infoNotes');
        } catch (e) { console.warn('No se pudieron refrescar los comentarios:', e); }
    }

    // === LÓGICA DE ALERTAS INTERNAS (PARCHADA PARA SUPREMO/SUPERVISOR) ===
    window.toggleAlertsDrawer = function() {
        if(isAlertsDrawerOpen) {
            document.getElementById('alertsDrawer').classList.add('translate-x-full');
            isAlertsDrawerOpen = false;
        } else {
            if(isDrawerOpen) window.closeConfigDrawer();
            if(isPriorityDrawerOpen) window.closePriorityDrawer();
            document.getElementById('alertsDrawer').classList.remove('translate-x-full');
            isAlertsDrawerOpen = true;
            window.renderAlerts();
        }
    };

   window.renderAlerts = function() {
        if(!localAuthor) return;
        const container = document.getElementById('alertsListContainer');
        const badge = document.getElementById('alertsBadge');
        if (currentUserRole === 'Lector') {
            window.__lastAlerts = [];
            if(badge) badge.classList.add('hidden');
            const badgeMobile = document.getElementById('alertsBadgeMobile'); if(badgeMobile) badgeMobile.classList.add('hidden');
            if(container) container.innerHTML = `<div class="text-center py-10 opacity-50"><p class="text-sm text-gray-300">Modo Lector Activo. Las alertas son exclusivas para el equipo operativo.</p></div>`;
            return;
        }
        
        let myAlerts = [];
        
        const checkAlert = (p, pType, pParent) => {
            if (!p) return;
            const canSeeAll = (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor');
            const pConsArray = getProjectConsultants(p); // Usa el parser seguro que creamos
            const isInProject = pConsArray.includes(localAuthor);
            const isProjectComplete = (p.status === 'Completado' || p.progress === 100);
            
            if(!isProjectComplete && p.deadline) {
                const [y,m,d] = p.deadline.split('-'); 
                if(new Date(y, m-1, d) < new Date(new Date().setHours(0,0,0,0))) {
                    if (canSeeAll || isInProject) {
                        myAlerts.push({ 
                            id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                            alertType: 'danger', icon: '⚠️',
                            reason: `Proyecto vencido: ${p.deadline}`,
                            users: pConsArray
                        });
                    }
                }
            }

            if (p.status === 'No Iniciado') {
                if (isInProject) {
                    myAlerts.push({ 
                        id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                        alertType: 'info', icon: '🆕',
                        reason: `Estado "No Iniciado". Por favor revisa las fechas y empieza.`,
                        users: pConsArray
                    });
                } else if (canSeeAll) {
                    myAlerts.push({ 
                        id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                        alertType: 'info', icon: '📦',
                        reason: `Estado "No Iniciado". Proyecto asignado a tu equipo.`,
                        users: pConsArray
                    });
                }
            }
            
            // Menciones directas con @ en el Foro del Proyecto (alerta prioritaria e inmediata)
            if (p.notes && Array.isArray(p.notes) && localAuthor) {
                p.notes.forEach(n => {
                    if (!n) return;
                    const isReadByMe = Array.isArray(n.readBy) && n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
                    if (!isReadByMe && window.isUserMentionedInText && window.isUserMentionedInText(n.text, localAuthor)) {
                        myAlerts.push({
                            id: p.id,
                            name: p.name || 'Sin nombre',
                            pType,
                            parentName: pParent,
                            alertType: 'mention',
                            icon: '🔔',
                            reason: `@${localAuthor}: ${n.by || 'Un consultor'} te mencionó en el foro: "${(n.text || '').length > 55 ? (n.text || '').substring(0, 52) + '...' : (n.text || '')}"`,
                            users: [n.by || 'Consultor'],
                            noteInfo: n
                        });
                    }
                });
            }

            if(p.tasks && Array.isArray(p.tasks)) {
                for(let t of p.tasks) {
                    if(t.done === true) continue;
                    
                    const isMyTask = t.assignee === localAuthor;
                    const isUnassignedAndImInProject = !t.assignee && isInProject;
                    
                    if(t.done === 'pending') {
                        if (canSeeAll) {
                            myAlerts.push({ 
                                id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                                alertType: 'warning', icon: '👀',
                                reason: `Requiere Validación: ${t.text}`,
                                users: t.assignee ? [t.assignee] : pConsArray,
                                taskInfo: t, isPendingVal: true
                            });
                        }
                        continue;
                    }
                    
                    if (canSeeAll || isMyTask || isUnassignedAndImInProject) {
                        let isTaskOverdue = false;
                        if(t.deadline) {
                            const [y,m,d] = t.deadline.split('-');
                            if(new Date(y, m-1, d) < new Date(new Date().setHours(0,0,0,0))) isTaskOverdue = true;
                        }
                        
                        if(isTaskOverdue) {
                            myAlerts.push({ 
                                id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                                alertType: 'danger', icon: '🚨',
                                reason: `Tarea vencida: ${t.text}`,
                                users: t.assignee ? [t.assignee] : pConsArray,
                                taskInfo: t
                            });
                        } else {
                            myAlerts.push({ 
                                id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                                alertType: 'info', icon: '📌',
                                reason: `Nueva tarea: ${t.text} ${t.deadline ? '(Para: '+t.deadline+')' : ''}`,
                                users: t.assignee ? [t.assignee] : pConsArray,
                                taskInfo: t
                            });
                        }
                    }
                }
            }
        };
        
        if (appData.directProjects && Array.isArray(appData.directProjects)) {
            appData.directProjects.forEach(p => checkAlert(p, 'direct-project', appData.directHub ? appData.directHub.name : 'Proyectos'));
        }
        if (appData.modules && Array.isArray(appData.modules)) {
            appData.modules.forEach(m => {
                if (m.projects && Array.isArray(m.projects)) {
                    m.projects.forEach(p => checkAlert(p, 'project', m.name || 'Módulo'));
                }
            });
        }
        
        const canSeeAll = (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor');
        if(appData.globalTasks && Array.isArray(appData.globalTasks)) {
            for(let t of appData.globalTasks) {
                if(t.done === true) continue;
                
                const isMyTask = t.assignee === localAuthor;
                const isAssigner = t.assignedBy === localAuthor;
                const isUnassigned = !t.assignee;
                
                if (t.done === 'pending') {
                    if (canSeeAll || isAssigner) {
                        myAlerts.push({ id: t.id, name: "Tarea General", pType: 'global', parentName: 'SIN PROYECTO', alertType: 'warning', icon: '👀', reason: `Requiere Validación: ${t.text}`, users: t.assignee ? [t.assignee] : [], globalTaskInfo: t, isPendingVal: true });
                    }
                    continue;
                }
                
                if (canSeeAll || isMyTask || isAssigner || isUnassigned) {
                    let isTaskOverdue = false;
                    if(t.deadline) {
                        const [y,m,d] = t.deadline.split('-');
                        if(new Date(y, m-1, d) < new Date(new Date().setHours(0,0,0,0))) isTaskOverdue = true;
                    }
                    
                    if(isTaskOverdue) {
                        myAlerts.push({ id: t.id, name: "Tarea General", pType: 'global', parentName: 'SIN PROYECTO', alertType: 'danger', icon: '🚨', reason: `Vencida: ${t.text}`, users: t.assignee ? [t.assignee] : [], globalTaskInfo: t });
                    } else {
                        myAlerts.push({ id: t.id, name: "Tarea General", pType: 'global', parentName: 'SIN PROYECTO', alertType: 'info', icon: '📌', reason: `Pendiente: ${t.text} ${t.deadline ? '(Para: '+t.deadline+')' : ''}`, users: t.assignee ? [t.assignee] : [], globalTaskInfo: t });
                    }
                }
            }
        }
        
        window.__lastAlerts = myAlerts; // Lo consume el panel izquierdo (Notificaciones y Trabajo)
        if(myAlerts.length > 0) {
            if (badge) {
                badge.textContent = myAlerts.length;
                badge.classList.remove('hidden');
            }
            
            if (container) {
                container.innerHTML = myAlerts.map(a => {
                    const isDanger = a.alertType === 'danger';
                    const isWarning = a.alertType === 'warning';
                    const isMention = a.alertType === 'mention';
                    const colorClassText = isDanger ? 'text-[#ff453a]' : (isWarning ? 'text-[#ff9f0a]' : (isMention ? 'text-[#64d2ff]' : 'text-brand-accent'));
                    const colorClassBg = isDanger ? 'bg-[#ff453a]/10' : (isWarning ? 'bg-[#ff9f0a]/10' : (isMention ? 'bg-[#0071e3]/15' : 'bg-brand-accent/10'));
                    const colorClassBorder = isDanger ? 'border-[#ff453a]/30' : (isWarning ? 'border-[#ff9f0a]/30' : (isMention ? 'border-[#0071e3]/40' : 'border-brand-accent/30'));
                    const colorClassBadgeBg = isDanger ? 'bg-[#ff453a]/20' : (isWarning ? 'bg-[#ff9f0a]/20' : (isMention ? 'bg-[#0071e3]/25' : 'bg-brand-accent/20'));
                    
                    // BLINDAJE DE SEGURIDAD
                    const userText = (a.users && a.users.length > 0) ? (Array.isArray(a.users) ? a.users.join(', ') : a.users) : 'Sin asignar';
                    
                    let clickAction = `window.selectNode('${a.pType}', '${a.id}'); window.toggleAlertsDrawer();`;
                    let extraGlobalHTML = '';
                    let cursorStyle = 'cursor-pointer hover:opacity-80';
                    let assignedByText = '';
                    
                    if (a.isPendingVal) {
                        clickAction = '';
                        cursorStyle = 'cursor-default';
                        assignedByText = a.taskInfo ? (a.taskInfo.assignedBy ? `<span class="text-[9px] text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded shadow-inner self-start truncate max-w-[280px]">De: ${escapeHtml(a.taskInfo.assignedBy)}</span>` : '') : (a.globalTaskInfo && a.globalTaskInfo.assignedBy ? `<span class="text-[9px] text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded shadow-inner self-start truncate max-w-[280px]">De: ${escapeHtml(a.globalTaskInfo.assignedBy)}</span>` : '');
                        
                        if (a.pType === 'global') {
                            extraGlobalHTML = `<div class="flex gap-2 mt-3 ml-7"><button onclick="validateGlobalTask('${a.globalTaskInfo.id}', true)" class="pill-btn py-1.5 px-3 bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 font-bold text-[9px] hover:bg-[#30d158]/30 transition shadow-inner">✅ Aprobar</button><button onclick="validateGlobalTask('${a.globalTaskInfo.id}', false)" class="pill-btn py-1.5 px-3 bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/30 font-bold text-[9px] hover:bg-[#ff453a]/30 transition shadow-inner">❌ Rechazar</button></div>`;
                        } else {
                            extraGlobalHTML = `<div class="flex gap-2 mt-3 ml-7"><button onclick="validateProjectTask('${a.pType}', '${a.id}', '${a.taskInfo.id}', true); event.stopPropagation();" class="pill-btn py-1.5 px-3 bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 font-bold text-[9px] hover:bg-[#30d158]/30 transition shadow-inner">✅ Aprobar</button><button onclick="validateProjectTask('${a.pType}', '${a.id}', '${a.taskInfo.id}', false); event.stopPropagation();" class="pill-btn py-1.5 px-3 bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/30 font-bold text-[9px] hover:bg-[#ff453a]/30 transition shadow-inner">❌ Rechazar</button></div>`;
                        }
                    } else if (a.pType === 'global') {
                        clickAction = ''; 
                        cursorStyle = 'cursor-default';
                        
                        const t = a.globalTaskInfo;
                        const isMyTask = t.assignee === localAuthor;
                        const isAssigner = t.assignedBy === localAuthor;
                        const canComplete = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor' || isMyTask || !t.assignee;
                        const canDelete = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor' || isAssigner;
                        
                        assignedByText = t.assignedBy ? `<span class="text-[9px] text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded shadow-inner self-start truncate max-w-[280px]">De: ${escapeHtml(t.assignedBy)} (${t.assignDate||''} ${t.assignTime||''})</span>` : '';
                        
                        extraGlobalHTML = `<div class="flex gap-2 mt-3 ml-7">`;
                        if(canComplete) extraGlobalHTML += `<button onclick="completeGlobalTask('${t.id}')" class="pill-btn py-1.5 px-3 bg-[#30d158]/20 text-[#30d158] hover:bg-[#30d158]/30 border border-[#30d158]/30 font-bold text-[9px] shadow-inner transition">✅ Marcar Lista</button>`;
                        if(canDelete) extraGlobalHTML += `<button onclick="deleteGlobalTask('${t.id}')" class="pill-btn py-1.5 px-3 bg-[#ff453a]/20 text-[#ff453a] hover:bg-[#ff453a]/30 border border-[#ff453a]/30 font-bold text-[9px] shadow-inner transition">🗑️ Borrar</button>`;
                        extraGlobalHTML += `</div>`;
                    } else if (a.taskInfo) {
                        const t = a.taskInfo;
                        assignedByText = t.assignedBy ? `<span class="text-[9px] text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded shadow-inner self-start truncate max-w-[280px]">De: ${escapeHtml(t.assignedBy)} (${t.assignDate||''} ${t.assignTime||''})</span>` : '';
                    }
                    
                    return `
                    <div class="${colorClassBg} border ${colorClassBorder} rounded-2xl p-4 ${cursorStyle} transition shadow-inner" onclick="if('${a.pType}' !== 'global') { ${clickAction} }">
                        <div class="flex items-start gap-2 mb-1">
                            <span class="text-lg mt-0.5">${a.icon}</span>
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-semibold ${colorClassText} leading-tight truncate">${escapeHtml(a.name)}</h4>
                                <p class="text-[10px] text-gray-400 uppercase tracking-widest truncate">└ ${escapeHtml(a.parentName)}</p>
                            </div>
                        </div>
                        <div class="ml-7 mt-2 flex flex-col gap-2">
                            <span class="text-[10px] ${colorClassText} font-medium ${colorClassBadgeBg} border ${colorClassBorder} px-2 py-1.5 rounded shadow-inner self-start leading-snug break-words max-w-[280px]">${escapeHtml(a.reason)}</span>
                            <div class="flex flex-wrap gap-2">
                                <span class="text-[9px] text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded shadow-inner self-start truncate max-w-[200px]">👤 ${escapeHtml(userText)}</span>
                                ${assignedByText}
                                ${a.globalTaskInfo && a.globalTaskInfo.feedback ? `<span class="text-[9px] text-gray-300 font-medium bg-black/40 border border-white/10 px-2 py-1.5 rounded shadow-inner w-full mt-1 block">💬 <b>Nota:</b> ${escapeHtml(a.globalTaskInfo.feedback)}</span>` : ''}
                                ${a.taskInfo && a.taskInfo.feedback ? `<span class="text-[9px] text-gray-300 font-medium bg-black/40 border border-white/10 px-2 py-1.5 rounded shadow-inner w-full mt-1 block">💬 <b>Nota:</b> ${escapeHtml(a.taskInfo.feedback)}</span>` : ''}
                            </div>
                        </div>
                        ${extraGlobalHTML}
                    </div>
                    `;
                }).join('');
            }
        } else {
            if (badge) badge.classList.add('hidden');
            if (container) container.innerHTML = `<div class="text-center py-10 opacity-50"><span class="text-4xl block mb-2">🎉</span><p class="text-sm text-gray-300">¡Al día! No tienes tareas asignadas pendientes ni compromisos vencidos.</p></div>`;
        }
    };

    window.showToast = function(msg, isError = false) {
        const t = document.getElementById('toast'); t.textContent = msg;
        if(isError) t.classList.add('error'); else t.classList.remove('error');
        t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
    }

    window.setConnectionStatus = function(status) {
        const dot = document.getElementById('connectionStatusDot');
        if(!dot) return;
        dot.className = "w-2 h-2 rounded-full transition-all duration-300"; // Reset classes
        if(status === 'online') {
            dot.classList.add('bg-[#30d158]', 'shadow-[0_0_8px_#30d158]', 'animate-pulse');
            dot.title = "En Línea";
        } else if (status === 'syncing') {
            dot.classList.add('bg-[#ff9f0a]', 'shadow-[0_0_8px_#ff9f0a]');
            dot.title = "Sincronizando nube...";
        } else {
            dot.classList.add('bg-[#ff453a]', 'shadow-[0_0_8px_#ff453a]');
            dot.title = "Sin Conexión (Modo Local)";
        }
    };

    window.addEventListener('online', () => window.setConnectionStatus('online'));
    window.addEventListener('offline', () => window.setConnectionStatus('offline'));

    window.saveData = function(showToastUI = true) {
        // Blindaje contra borrado accidental de la nube
        if (!appData || !Array.isArray(appData.modules) || (appData.modules.length === 0 && (!appData.directProjects || appData.directProjects.length === 0))) {
            console.warn("🛡️ [SICOM Guard] saveData bloqueado: intento de sobreescritura con appData vacío.");
            return;
        }
        window.setConnectionStatus('syncing');
        if (isFirebaseReady && db && appId && globalDoc && globalSetDoc) {
            const docRef = globalDoc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main');
            globalSetDoc(docRef, { appData, consultants, globalDocs }, { merge: false });
        } else {
            localStorage.setItem('sicom_data', JSON.stringify(appData)); localStorage.setItem('sicom_consultants', JSON.stringify(consultants)); localStorage.setItem('sicom_global_docs', JSON.stringify(globalDocs));
        }
        
        setTimeout(() => { if(navigator.onLine) window.setConnectionStatus('online'); }, 800);
        
        if(showToastUI) window.showToast("Cambios guardados");
        if(isPriorityDrawerOpen) window.renderPriorityDrawer(); window.renderHistory(); window.renderDashboard(); window.updateDatalist();
        window.renderAlerts(); 
    }

    window.forceCloudSync = async function() {
        if(!isFirebaseReady || !globalSetDoc) { window.showToast("⚠️ Conecta Firebase y activa Modo Anónimo primero.", true); return; }
        try {
            document.getElementById('cloudLoader').style.display = 'flex'; document.getElementById('cloudLoader').style.opacity = '1';
            const docRef = globalDoc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main');
            await globalSetDoc(docRef, { appData, consultants, globalDocs }, { merge: false });
            window.showToast("✅ Rescate exitoso. La nube ha sido restaurada.");
            setTimeout(() => { document.getElementById('cloudLoader').style.opacity = '0'; setTimeout(() => document.getElementById('cloudLoader').style.display = 'none', 500); }, 1000);
        } catch(e) { console.error(e); window.showToast("❌ Error al subir a la nube", true); setTimeout(() => { document.getElementById('cloudLoader').style.opacity = '0'; setTimeout(() => document.getElementById('cloudLoader').style.display = 'none', 500); }, 500); }
    }

    function getProjectConsultants(proj) { return Array.isArray(proj.consultants) ? proj.consultants : (proj.consultants ? [proj.consultants] : []); }
    
    window.getProjectCompanies = function(proj) {
      if (!proj) return [];
      if (Array.isArray(proj.companies)) {
        return proj.companies.filter(c => typeof c === 'string' && c.trim()).map(c => c.trim().toUpperCase());
      }
      if (typeof proj.company === 'string' && proj.company.trim()) {
        return [proj.company.trim().toUpperCase()];
      }
      return [];
    };
    function getProjectCompanies(proj) { return window.getProjectCompanies(proj); }

    window.getCompanyStyle = function(company) {
      const c = String(company || '').trim().toUpperCase();
      switch (c) {
        case 'AFR':
          return { name: 'AFR', color: '#ff9f0a', bg: 'rgba(255, 159, 10, 0.16)', border: 'rgba(255, 159, 10, 0.4)', icon: '🏢' };
        case 'AVM':
          return { name: 'AVM', color: '#30d158', bg: 'rgba(48, 209, 88, 0.16)', border: 'rgba(48, 209, 88, 0.4)', icon: '🏢' };
        case 'TEO':
          return { name: 'TEO', color: '#0071e3', bg: 'rgba(0, 113, 227, 0.16)', border: 'rgba(0, 113, 227, 0.4)', icon: '🏢' };
        case 'TNO':
          return { name: 'TNO', color: '#bf5af2', bg: 'rgba(191, 90, 242, 0.16)', border: 'rgba(191, 90, 242, 0.4)', icon: '🏢' };
        case 'ZIN':
          return { name: 'ZIN', color: '#ff375f', bg: 'rgba(255, 55, 95, 0.16)', border: 'rgba(255, 55, 95, 0.4)', icon: '🏢' };
        case 'GENERAL':
          return { name: 'GENERAL', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.16)', border: 'rgba(148, 163, 184, 0.4)', icon: '🌐' };
        default:
          return { name: c, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.4)', icon: '🏢' };
      }
    };
    function getCompanyStyle(c) { return window.getCompanyStyle(c); }

    window.getAllKnownCompanies = function() {
      const base = ['AFR', 'AVM', 'TEO', 'TNO', 'ZIN', 'GENERAL'];
      const set = new Set(base);
      if (typeof appData !== 'undefined' && appData) {
        (appData.directProjects || []).forEach(p => {
          window.getProjectCompanies(p).forEach(c => set.add(c));
        });
        (appData.modules || []).forEach(m => {
          (m.projects || []).forEach(p => {
            window.getProjectCompanies(p).forEach(c => set.add(c));
          });
        });
      }
      return Array.from(set);
    };
    
    function hexToRgb(hex) {
      if (!hex || typeof hex !== 'string') return [142, 142, 147];
      let clean = hex.replace('#', '').trim();
      if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
      if (clean.length !== 6) return [142, 142, 147];
      return [
        parseInt(clean.substring(0, 2), 16),
        parseInt(clean.substring(2, 4), 16),
        parseInt(clean.substring(4, 6), 16)
      ];
    }

    function hexToRgba(hex, alpha = 1) {
      const [r, g, b] = hexToRgb(hex);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function getGlassFill(colorValue, isLight, isOverdue) {
      if (isOverdue) {
        return isLight ? 'rgba(255, 69, 58, 0.08)' : 'rgba(255, 69, 58, 0.08)';
      }
      // CRISTAL CLARO PURO: sin relleno tintado interior para que la nebulosa cósmica traspase la cápsula nítidamente
      return isLight ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.03)';
    }

    function generateJointGradient(consultantNames) {
      if (!consultantNames || consultantNames.length === 0) return '#48484a';
      if (consultantNames.length === 1) return consultants[consultantNames[0]] ? consultants[consultantNames[0]].color : '#48484a';
      const validColors = consultantNames.map(name => consultants[name] ? consultants[name].color : null).filter(c => c);
      if (validColors.length === 0) return '#48484a';
      if (validColors.length === 1) return validColors[0];
      const gradKey = validColors.map(c => c.replace('#','')).join('-');
      const gradId = `grad-${gradKey}`;
      const glassGradId = `grad-glass-${gradKey}`;
      const darkGlassGradId = `grad-darkglass-${gradKey}`;
      if (!document.getElementById(gradId) && svgDefs) {
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', gradId); linearGradient.setAttribute('x1', '0%'); linearGradient.setAttribute('y1', '0%'); linearGradient.setAttribute('x2', '100%'); linearGradient.setAttribute('y2', '100%');
        validColors.forEach((color, i) => { const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); stop.setAttribute('offset', `${(i / (validColors.length - 1)) * 100}%`); stop.setAttribute('stop-color', color); linearGradient.appendChild(stop); });
        svgDefs.appendChild(linearGradient);

        const glassGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        glassGradient.setAttribute('id', glassGradId); glassGradient.setAttribute('x1', '0%'); glassGradient.setAttribute('y1', '0%'); glassGradient.setAttribute('x2', '100%'); glassGradient.setAttribute('y2', '100%');
        validColors.forEach((color, i) => { const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); stop.setAttribute('offset', `${(i / (validColors.length - 1)) * 100}%`); stop.setAttribute('stop-color', color); stop.setAttribute('stop-opacity', '0.12'); glassGradient.appendChild(stop); });
        svgDefs.appendChild(glassGradient);

        const darkGlassGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        darkGlassGradient.setAttribute('id', darkGlassGradId); darkGlassGradient.setAttribute('x1', '0%'); darkGlassGradient.setAttribute('y1', '0%'); darkGlassGradient.setAttribute('x2', '100%'); darkGlassGradient.setAttribute('y2', '100%');
        validColors.forEach((color, i) => { const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); stop.setAttribute('offset', `${(i / (validColors.length - 1)) * 100}%`); stop.setAttribute('stop-color', color); stop.setAttribute('stop-opacity', '0.16'); darkGlassGradient.appendChild(stop); });
        svgDefs.appendChild(darkGlassGradient);
      }
      return `url(#${gradId})`;
    }

    // === GESTIÓN DE FORO Y BITÁCORA TÉCNICA DEL PROYECTO ===
    window.currentNoteTagInfo = 'comentario';
    window.currentNoteTagEdit = 'comentario';

    // Helpers de Menciones con @ y Reglas de Involucramiento (Señal vs Ruido)
    window.extractMentionsFromText = function(text) {
        if (!text) return [];
        const allCons = Object.keys(consultants || {});
        const found = [];
        allCons.forEach(c => {
            const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`@${escaped}\\b`, 'i');
            if (regex.test(text)) found.push(c);
        });
        return found;
    };

    window.isUserMentionedInText = function(text, userName) {
        if (!text || !userName) return false;
        const escaped = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`@${escaped}\\b`, 'i');
        return regex.test(text);
    };

    window.isUserInvolvedInProject = function(proj, userName) {
        if (!proj || !userName) return false;
        const u = userName.trim().toLowerCase();
        
        // 1. Asignado formalmente en la lista de consultores del proyecto
        const cons = typeof getProjectConsultants === 'function' ? getProjectConsultants(proj) : (Array.isArray(proj.consultants) ? proj.consultants : []);
        if (cons.some(c => c && c.trim().toLowerCase() === u)) return true;
        
        // 2. Tiene alguna tarea asignada en el proyecto
        if (Array.isArray(proj.tasks) && proj.tasks.some(t => t.assignee && t.assignee.trim().toLowerCase() === u)) {
            return true;
        }
        
        return false;
    };

    window.shouldShowProjectForumBadge = function(proj, userName, userRole) {
        if (!proj || !userName) return false;
        if (!Array.isArray(proj.notes) || proj.notes.length === 0) return false;

        // Calcular notas no leídas por este usuario
        const unreadNotes = proj.notes.filter(n => {
            if (!n) return false;
            if (!Array.isArray(n.readBy)) return n.by !== userName;
            return !n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === userName);
        });

        if (unreadNotes.length === 0) return false;

        // 1. ¿Fue mencionado explícitamente en alguna nota no leída? (Prioridad absoluta para cualquier rol)
        const hasUnreadMention = unreadNotes.some(n => window.isUserMentionedInText(n.text, userName));
        if (hasUnreadMention) return true;

        // 2. ¿Está involucrado directamente en el proyecto (consultor o tareas)?
        const isInvolved = window.isUserInvolvedInProject(proj, userName);
        if (isInvolved) return true;

        // 3. Regla para Supremo (Dirección General): Si no está asignado, solo ve si hay Bloqueos Críticos (⚠️ Bloqueo)
        if (userRole === 'Supremo') {
            return unreadNotes.some(n => n.tag === 'bloqueo');
        }

        // Para Supervisores y Consultores no involucrados: CERO RUIDO
        return false;
    };

    window.toggleMentionDropdown = function(context) {
        const isInfo = context === 'info';
        const menu = document.getElementById(isInfo ? 'mentionMenu_info' : 'mentionMenu_edit');
        if (!menu) return;
        
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            return;
        }
        
        const allCons = Object.keys(consultants || {}).filter(k => consultants[k].role !== 'Lector');
        menu.innerHTML = allCons.map(cName => {
            const col = (consultants[cName] && consultants[cName].color) ? consultants[cName].color : '#64d2ff';
            const initial = cName.charAt(0).toUpperCase();
            return `
                <button type="button" onclick="insertMention('${escapeHtml(cName)}', '${context}')" class="w-full text-left p-2 rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-xs text-white">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0" style="background-color: ${col};">
                        ${initial}
                    </div>
                    <span class="truncate font-medium flex-1">${escapeHtml(cName)}</span>
                    <span class="text-[9px] text-[#64d2ff] font-mono">@${escapeHtml(cName.split(' ')[0])}</span>
                </button>
            `;
        }).join('');
        
        menu.classList.remove('hidden');
    };

    window.insertMention = function(userName, context) {
        const isInfo = context === 'info';
        const input = document.getElementById(isInfo ? 'infoNoteInput' : 'editNotes');
        const menu = document.getElementById(isInfo ? 'mentionMenu_info' : 'mentionMenu_edit');
        if (menu) menu.classList.add('hidden');
        if (!input) return;

        const val = input.value;
        const cursorPos = input.selectionStart || val.length;
        const textBefore = val.slice(0, cursorPos);
        const textAfter = val.slice(cursorPos);

        if (textBefore.endsWith('@')) {
            input.value = textBefore.slice(0, -1) + `@${userName} ` + textAfter;
        } else {
            input.value = textBefore + (textBefore.length && !textBefore.endsWith(' ') ? ' ' : '') + `@${userName} ` + textAfter;
        }
        input.focus();
    };

    window.setNoteTag = function(tag, context) {
        const isInfo = context === 'info';
        if (isInfo) window.currentNoteTagInfo = tag;
        else window.currentNoteTagEdit = tag;

        const prefix = isInfo ? 'tagBtn_info_' : 'tagBtn_edit_';
        const tags = ['comentario', 'acuerdo', 'bloqueo', 'entregable'];
        
        tags.forEach(t => {
            const btn = document.getElementById(prefix + t);
            if (!btn) return;
            if (t === tag) {
                btn.className = 'note-tag-btn px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 shadow-sm';
                if (t === 'comentario') {
                    btn.className += ' bg-white/20 text-white border border-white/30';
                } else if (t === 'acuerdo') {
                    btn.className += ' bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                } else if (t === 'bloqueo') {
                    btn.className += ' bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/40 shadow-[0_0_10px_rgba(255,69,58,0.25)]';
                } else if (t === 'entregable') {
                    btn.className += ' bg-[#64d2ff]/20 text-[#64d2ff] border border-[#64d2ff]/40 shadow-[0_0_10px_rgba(100,210,255,0.2)]';
                }
            } else {
                btn.className = 'note-tag-btn px-2.5 py-1 rounded-lg text-[10px] font-medium transition flex items-center gap-1 text-gray-400 hover:text-white hover:bg-white/5 border border-transparent';
            }
        });
    };

    window.formatFriendlyNoteDate = function(dateStr) {
        if (!dateStr) return '';
        try {
            const raw = String(dateStr).trim();
            let datePart = '', timePart = '';
            if (raw.includes(',')) {
                const p = raw.split(',');
                datePart = p[0].trim();
                timePart = (p[1] || '').trim().slice(0, 5);
            } else if (raw.includes(' ')) {
                const p = raw.split(' ');
                datePart = p[0].trim();
                timePart = (p[1] || '').trim().slice(0, 5);
            } else {
                return raw;
            }

            const now = new Date();
            const dNow = now.getDate();
            const mNow = now.getMonth() + 1;
            const yNow = now.getFullYear();

            const todayStr = `${String(dNow).padStart(2, '0')}/${String(mNow).padStart(2, '0')}/${yNow}`;
            
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yestStr = `${String(yesterday.getDate()).padStart(2, '0')}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${yesterday.getFullYear()}`;

            if (datePart === todayStr) {
                return `Hoy ${timePart}`;
            }
            if (datePart === yestStr) {
                return `Ayer ${timePart}`;
            }

            const parts = datePart.split('/');
            if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const mName = months[m - 1] || parts[1];
                return `${d} ${mName}${timePart ? ', ' + timePart : ''}`;
            }

            return raw.length > 20 ? raw.slice(0, 16) : raw;
        } catch (e) {
            return String(dateStr);
        }
    };

    window.addProjectNote = function(source) {
        if (currentUserRole === 'Lector') return;
        if (!currentSelection.id) return;
        const isInfo = source === 'info';
        const input = document.getElementById(isInfo ? 'infoNoteInput' : 'editNotes');
        if (!input) return;
        const noteText = input.value.trim();
        if (!noteText) {
            input.focus();
            return;
        }

        let item = getSelectedItem();
        if (item) {
            // Retrocompatibilidad: convierte texto viejo a bloque de foro
            if (typeof item.notes === 'string') {
                const oldNote = item.notes.trim();
                item.notes = [];
                if (oldNote) item.notes.push({ id: 'n_legacy', text: oldNote, by: 'Sistema/Anterior', tag: 'comentario', date: new Date().toLocaleString('es-MX', {hour12:false}) });
            }
            if (!Array.isArray(item.notes)) item.notes = [];
            
            const newNoteId = 'n_' + Date.now();
            const tag = (isInfo ? window.currentNoteTagInfo : window.currentNoteTagEdit) || 'comentario';
            const nowTimestamp = new Date().toLocaleString('es-MX', {hour12:false});
            const mentions = window.extractMentionsFromText(noteText);

            item.notes.push({ 
                id: newNoteId, 
                text: noteText, 
                by: localAuthor, 
                tag: tag,
                mentions: mentions,
                date: nowTimestamp,
                readBy: [
                    { user: localAuthor, at: nowTimestamp }
                ]
            });
            input.value = '';

            // Asegurar que el acordeón esté expandido para ver la nota recién publicada
            if (isInfo) {
                const acc = document.getElementById('acc-notes-details');
                if (acc) acc.open = true;
            }
            
            const tagLabel = tag === 'acuerdo' ? 'Acuerdo' : (tag === 'bloqueo' ? 'Bloqueo' : (tag === 'entregable' ? 'Entregable' : 'Comentario'));
            const mentionLog = mentions.length ? ` (Mencionó a: ${mentions.join(', ')})` : '';
            logActivity(item.id, item.name, `Añadió nota al foro [${tagLabel}]: "${noteText.length > 40 ? noteText.slice(0, 37) + '...' : noteText}"${mentionLog}`, localAuthor);
            window.saveData(false);
            window.renderNotesHistory(item.notes, 'editNotesHistory');
            window.renderNotesHistory(item.notes, 'infoNotes');
            window.renderMindMap(); // Refresca los badges de notificación del mapa mental
            if (typeof window.renderAlerts === 'function') window.renderAlerts();
            if (typeof window.renderDailyDrawer === 'function') window.renderDailyDrawer();
        }
    };

    window.confirmNoteRead = function(noteId) {
        if (!localAuthor) return;
        let item = getSelectedItem();
        if (item && Array.isArray(item.notes)) {
            const note = item.notes.find(n => n.id === noteId);
            if (note) {
                if (!Array.isArray(note.readBy)) {
                    note.readBy = note.by ? [{ user: note.by, at: note.date || '' }] : [];
                }
                const already = note.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
                if (!already) {
                    const nowStr = new Date().toLocaleString('es-MX', {hour12:false});
                    note.readBy.push({ user: localAuthor, at: nowStr });
                    logActivity(item.id, item.name, `Confirmó lectura de nota de ${note.by}`, localAuthor);
                    window.saveData(false);
                    window.renderNotesHistory(item.notes, 'infoNotes');
                    window.renderNotesHistory(item.notes, 'editNotesHistory');
                    window.renderMindMap();
                    if (typeof window.renderAlerts === 'function') window.renderAlerts();
                    if (typeof window.renderDailyDrawer === 'function') window.renderDailyDrawer();
                    window.showToast("✓ Acuse de lectura confirmado", false);
                }
            }
        }
    };

    window.confirmAllNotesRead = function() {
        if (!localAuthor) return;
        let item = getSelectedItem();
        if (item && Array.isArray(item.notes)) {
            const nowStr = new Date().toLocaleString('es-MX', {hour12:false});
            let markedAny = false;
            item.notes.forEach(note => {
                if (!Array.isArray(note.readBy)) {
                    note.readBy = note.by ? [{ user: note.by, at: note.date || '' }] : [];
                }
                const already = note.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
                if (!already) {
                    note.readBy.push({ user: localAuthor, at: nowStr });
                    markedAny = true;
                }
            });
            if (markedAny) {
                logActivity(item.id, item.name, 'Confirmó lectura de todas las notas del proyecto', localAuthor);
                window.saveData(false);
                window.renderNotesHistory(item.notes, 'infoNotes');
                window.renderNotesHistory(item.notes, 'editNotesHistory');
                window.renderMindMap();
                if (typeof window.renderAlerts === 'function') window.renderAlerts();
                if (typeof window.renderDailyDrawer === 'function') window.renderDailyDrawer();
                window.showToast("✓ Todas las notas marcadas como enterado", false);
            }
        }
    };

    window.renderNotesHistory = function(notesData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let arr = [];
        if (typeof notesData === 'string') { if (notesData.trim()) arr = [{ id: 'legacy', text: notesData, by: 'Sistema', tag: 'comentario', date: '' }]; } 
        else if (Array.isArray(notesData)) { arr = notesData; }

        // Calcular cuántas notas están pendientes de acuse para el usuario activo
        const unreadForMeList = arr.filter(n => {
            if (!localAuthor) return false;
            if (!Array.isArray(n.readBy)) return n.by !== localAuthor;
            return !n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
        });
        const unreadForMeCount = unreadForMeList.length;

        const isInfo = containerId === 'infoNotes';
        const badge = document.getElementById(isInfo ? 'infoNotesBadge' : 'editNotesBadge');
        if (badge) {
            if (unreadForMeCount > 0) {
                const hasBlocker = unreadForMeList.some(n => n.tag === 'bloqueo');
                const hasMention = unreadForMeList.some(n => window.isUserMentionedInText(n.text, localAuthor));
                const badgeDotColor = hasBlocker ? 'bg-[#ff453a]' : (hasMention ? 'bg-[#64d2ff]' : 'bg-white');
                badge.innerHTML = `${arr.length} <span class="w-1.5 h-1.5 rounded-full ${badgeDotColor} inline-block animate-ping ml-0.5"></span>`;
                badge.classList.remove('hidden');
            } else {
                badge.textContent = arr.length;
                if (arr.length > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }
        }

        if (arr.length === 0) {
            container.classList.remove('hidden');
            container.innerHTML = `
                <div class="text-center py-6 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-[#bf5af2]/10 border border-[#bf5af2]/20 flex items-center justify-center text-[#bf5af2]">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </div>
                    <p class="text-xs font-semibold text-gray-200">Aún no hay notas en este proyecto</p>
                    <p class="text-[10px] text-gray-500 mt-1 max-w-[260px] mx-auto">Sé el primero en registrar acuerdos con cliente, bloqueos técnicos o comentarios.</p>
                </div>
            `;
            return;
        }
        
        const isSupremo = currentUserRole === 'Supremo';
        const isSupervisor = currentUserRole === 'Supervisor';
        const isLector = currentUserRole === 'Lector';
        const item = getSelectedItem();
        const projCons = (item && typeof getProjectConsultants === 'function') ? getProjectConsultants(item) : [];

        // Banner superior si hay múltiples notas sin enterar
        let headerBanner = '';
        if (unreadForMeCount > 1) {
            headerBanner = `
                <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-2 shadow-sm mb-1">
                    <div class="flex items-center gap-1.5 text-xs text-purple-200 font-medium">
                        <span class="w-2 h-2 rounded-full bg-[#bf5af2] animate-ping shrink-0"></span>
                        <span>Tienes <strong class="text-white font-bold">${unreadForMeCount} notas</strong> sin enterarte</span>
                    </div>
                    <button type="button" onclick="confirmAllNotesRead()" class="px-3 py-1 bg-[#bf5af2] hover:bg-[#a855f7] active:scale-95 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm flex items-center gap-1 shrink-0">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        <span>Enterado de todas</span>
                    </button>
                </div>
            `;
        }
        
        container.classList.remove('hidden');
        container.innerHTML = headerBanner + arr.map(n => {
            const col = (consultants[n.by] && consultants[n.by].color) ? consultants[n.by].color : '#bf5af2';
            const initial = (n.by || '?').charAt(0).toUpperCase();
            
            // Permiso de borrado: Supremo, Supervisor o el propio autor
            const isAuthor = Boolean(n.by && localAuthor && n.by.trim().toLowerCase() === localAuthor.trim().toLowerCase());
            const canDelete = !isLector && (isSupremo || isSupervisor || isAuthor);

            const delBtn = canDelete ? `
                <button type="button" onclick="deleteProjectNote('${n.id}')" class="text-gray-500 hover:text-[#ff453a] transition p-1 ml-auto opacity-70 hover:opacity-100 shrink-0" title="${(isSupremo || isSupervisor) && !isAuthor ? 'Moderar/Borrar comentario' : 'Eliminar mi comentario'}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            ` : '';

            // Tag badge
            const tag = n.tag || 'comentario';
            let tagBadge = '';
            if (tag === 'acuerdo') {
                tagBadge = `<span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0"><span>📌</span><span>Acuerdo</span></span>`;
            } else if (tag === 'bloqueo') {
                tagBadge = `<span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 flex items-center gap-1 shrink-0 shadow-[0_0_10px_rgba(255,69,58,0.2)]"><span>⚠️</span><span>Bloqueo</span></span>`;
            } else if (tag === 'entregable') {
                tagBadge = `<span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#64d2ff]/15 text-[#64d2ff] border border-[#64d2ff]/30 flex items-center gap-1 shrink-0"><span>🔗</span><span>Entregable</span></span>`;
            } else {
                tagBadge = `<span class="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1 shrink-0"><span>💬</span><span>Nota</span></span>`;
            }

            // Detección de si el usuario activo fue mencionado con @
            const isMentioned = localAuthor && window.isUserMentionedInText(n.text, localAuthor);
            let mentionTag = '';
            if (isMentioned) {
                mentionTag = `<span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/20 text-[#64d2ff] border border-blue-500/35 flex items-center gap-1 shrink-0 shadow-sm animate-pulse"><span>🔔</span><span>Te mencionaron</span></span>`;
            }

            // Formatear menciones con @Nombre dentro del texto
            const safeText = escapeHtml(n.text || '');
            let formattedText = safeText;
            const allCons = Object.keys(consultants || {});
            allCons.forEach(cName => {
                const escaped = escapeHtml(cName);
                const col = (consultants[cName] && consultants[cName].color) ? consultants[cName].color : '#64d2ff';
                const regex = new RegExp(`@${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                formattedText = formattedText.replace(regex, `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0071e3]/20 text-[#64d2ff] border border-[#0071e3]/30 font-semibold text-[10px] shadow-sm"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${col}"></span>@${escaped}</span>`);
            });

            // Auto-enlazar URLs en el texto
            const linkedText = formattedText.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0071e3] hover:underline break-all inline-flex items-center gap-0.5">$1 <svg class="w-3 h-3 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>');

            const friendlyDate = window.formatFriendlyNoteDate(n.date);

            // Estado de lectura individual
            const isReadByMe = (() => {
                if (!localAuthor) return true;
                if (!Array.isArray(n.readBy)) return n.by === localAuthor;
                return n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
            })();

            // Sección de acuse y auditoría
            let receiptSection = '';
            if (!isReadByMe) {
                const noticeText = isMentioned ? '🔔 Te mencionaron en esta nota' : (tag === 'bloqueo' ? '⚠️ Bloqueo pendiente de tu acuse' : '📌 Pendiente de tu lectura');
                const noticeColor = isMentioned ? 'text-[#64d2ff]' : (tag === 'bloqueo' ? 'text-[#ff453a]' : 'text-purple-300');
                const pingColor = isMentioned ? 'bg-[#64d2ff]' : (tag === 'bloqueo' ? 'bg-[#ff453a]' : 'bg-[#bf5af2]');
                const btnColor = isMentioned ? 'bg-[#0071e3] hover:bg-[#005bb5] shadow-[0_0_10px_rgba(0,113,227,0.4)]' : (tag === 'bloqueo' ? 'bg-[#ff453a] hover:bg-[#e0382e] shadow-[0_0_10px_rgba(255,69,58,0.4)]' : 'bg-gradient-to-r from-[#bf5af2] to-[#a855f7] hover:brightness-110 shadow-[0_0_10px_rgba(191,90,242,0.4)]');

                receiptSection = `
                    <div class="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 text-[10px] ${noticeColor} font-semibold">
                            <span class="w-2 h-2 rounded-full ${pingColor} animate-ping shrink-0"></span>
                            <span>${noticeText}</span>
                        </div>
                        <button type="button" onclick="confirmNoteRead('${n.id}')" class="px-3 py-1.5 ${btnColor} active:scale-95 text-white font-bold text-[10px] rounded-xl transition flex items-center gap-1.5 shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <span>Enterado / Confirmar lectura</span>
                        </button>
                    </div>
                `;
            } else {
                const myReceipt = Array.isArray(n.readBy) ? n.readBy.find(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor) : null;
                const myReceiptDate = (myReceipt && typeof myReceipt === 'object' && myReceipt.at) ? window.formatFriendlyNoteDate(myReceipt.at) : '';
                
                const readList = Array.isArray(n.readBy) ? n.readBy.map(r => (typeof r === 'string' ? r : (r && r.user))).filter(Boolean) : (n.by ? [n.by] : []);
                const pendingCons = projCons.filter(c => !readList.includes(c));
                const auditTitle = `Leído por: ${readList.join(', ') || 'Nadie'}${pendingCons.length ? '\nPendiente: ' + pendingCons.join(', ') : ''}`;

                receiptSection = `
                    <div class="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-400">
                        <span class="flex items-center gap-1 text-[#30d158] font-medium">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            ${isAuthor ? 'Publicado por ti' : `Enterado (${myReceiptDate || 'Confirmado'})`}
                        </span>
                        <span class="text-[9px] text-gray-500 hover:text-gray-300 transition cursor-help flex items-center gap-1 ml-auto" title="${escapeHtml(auditTitle)}">
                            <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <span>${readList.length}${projCons.length ? '/' + projCons.length : ''} enterados</span>
                        </span>
                    </div>
                `;
            }

            const unreadCardClasses = !isReadByMe ? (isMentioned ? 'border-[#0071e3]/60 bg-[#0071e3]/10 shadow-[0_0_15px_rgba(0,113,227,0.2)]' : (tag === 'bloqueo' ? 'border-[#ff453a]/60 bg-[#ff453a]/10 shadow-[0_0_15px_rgba(255,69,58,0.2)]' : 'border-[#bf5af2]/60 bg-[#bf5af2]/10 shadow-[0_0_15px_rgba(191,90,242,0.15)]')) : 'border-white/5 hover:border-white/10 bg-black/40 hover:bg-black/50';

            return `
                <div class="flex flex-col gap-2 p-3 rounded-xl border ${unreadCardClasses} shadow-sm transition-all group">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0" style="background-color: ${col};">
                            ${initial}
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span class="text-[11px] font-bold text-white tracking-wide truncate max-w-[120px]">${escapeHtml(n.by || 'Consultor')}</span>
                            ${tagBadge}
                            ${mentionTag}
                        </div>
                        <span class="text-[9px] text-gray-500 ml-auto shrink-0" title="${escapeHtml(n.date || '')}">${friendlyDate}</span>
                        ${delBtn}
                    </div>
                    <div class="text-xs text-gray-200 pl-7 leading-relaxed whitespace-pre-wrap break-words">${linkedText}</div>
                    ${receiptSection}
                </div>
            `;
        }).join('');
        setTimeout(() => container.scrollTop = container.scrollHeight, 50);
    };

    window.deleteProjectNote = function(noteId) {
        if (currentUserRole === 'Lector') return;
        let item = getSelectedItem();
        if (item && Array.isArray(item.notes)) {
            const noteToDelete = item.notes.find(n => n.id === noteId);
            if (noteToDelete) {
                const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
                const isAuthor = Boolean(noteToDelete.by && localAuthor && noteToDelete.by.trim().toLowerCase() === localAuthor.trim().toLowerCase());
                if (!isSuper && !isAuthor) {
                    alert('Solo el autor de la nota o un supervisor pueden eliminarla.');
                    return;
                }
                if (!confirm('¿Deseas eliminar este comentario del foro?')) return;
                item.notes = item.notes.filter(n => n.id !== noteId);
                logActivity(item.id, item.name, `Eliminó nota del foro de ${noteToDelete.by}`, localAuthor);
                window.saveData(false);
                window.renderNotesHistory(item.notes, 'editNotesHistory');
                window.renderNotesHistory(item.notes, 'infoNotes');
                window.renderMindMap();
            }
        }
    };

    window.ensureDomReferences = function() { 
        svgElem = document.getElementById('mindmapCanvas'); 
        canvasGroup = document.getElementById('canvasGroup'); 
        svgDefs = document.getElementById('svgDefs'); 
        if (!window._forumKeybindingsInitialized) {
            window._forumKeybindingsInitialized = true;
            ['infoNoteInput', 'editNotes'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('keydown', function(e) {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            window.addProjectNote(id === 'infoNoteInput' ? 'info' : 'edit');
                        }
                    });
                    el.addEventListener('input', function(e) {
                        const context = id === 'infoNoteInput' ? 'info' : 'edit';
                        const val = this.value;
                        const cursorPos = this.selectionStart;
                        const lastChar = val.slice(cursorPos - 1, cursorPos);
                        if (lastChar === '@') {
                            window.toggleMentionDropdown(context);
                        }
                    });
                }
            });
            document.addEventListener('click', function(e) {
                if (!e.target.closest('#btnMention_info') && !e.target.closest('#mentionMenu_info')) {
                    const m = document.getElementById('mentionMenu_info');
                    if (m) m.classList.add('hidden');
                }
                if (!e.target.closest('#btnMention_edit') && !e.target.closest('#mentionMenu_edit')) {
                    const m = document.getElementById('mentionMenu_edit');
                    if (m) m.classList.add('hidden');
                }
            });
        }
    };
    
    window.updateCanvasTransform = function() {
        if(!canvasGroup) return; 
        const limit = 4000; translateX = Math.max(-limit, Math.min(limit, translateX)); translateY = Math.max(-limit, Math.min(limit, translateY));
        
        // FIX MAESTRO: Forzamos el transform nativo de SVG en vez del de CSS.
        // Esto recalcula el área sólida del mapa y permite dar clic sin importar qué tan a la orilla esté.
        canvasGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
        if(svgElem) svgElem.style.overflow = 'visible';
    }

    let animationFrameId = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchPanOriginX = 0;
    let touchPanOriginY = 0;
    let touchTotalDistance = 0;
    let suppressClickUntil = 0;
    let isTouchActive = false;
    let initialPinchMidX = 0;
    let initialPinchMidY = 0;

    // Supresor global de clics fantasmas tras arrastrar el mapa en móvil
    window.addEventListener('click', (e) => {
        if (Date.now() < suppressClickUntil) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    function isAnyDrawerActive() {
        return isDrawerOpen || isPriorityDrawerOpen || isAlertsDrawerOpen || 
               (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) || 
               (typeof isFilterDrawerOpen !== 'undefined' && isFilterDrawerOpen);
    }

    const ws = document.getElementById('workspace');
    if(ws) {
        ws.addEventListener('touchstart', (e) => {
            if (isAnyDrawerActive() || e.target.closest('#infoCard')) return;
            if (e.touches.length === 1) { 
                isTouchActive = true; 
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchPanOriginX = e.touches[0].clientX - translateX; 
                touchPanOriginY = e.touches[0].clientY - translateY; 
                touchTotalDistance = 0;
                isPanning = false;
                initialPinchDistance = null;
            } else if (e.touches.length === 2) { 
                isTouchActive = true;
                isPanning = false; 
                touchTotalDistance = 50; 
                initialPinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); 
                initialPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                initialPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                ws.classList.add('is-panning'); // Desactiva transiciones CSS para respuesta táctil a 120 FPS
            }
        }, {passive: true});

        ws.addEventListener('touchmove', (e) => {
            if (isAnyDrawerActive() || e.target.closest('#infoCard')) return;
            if (e.touches.length === 1 && isTouchActive) { 
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                const dist = Math.hypot(dx, dy);
                touchTotalDistance = Math.max(touchTotalDistance, dist);

                if (touchTotalDistance > 6) {
                    if (!isPanning) {
                        isPanning = true;
                        ws.classList.add('is-panning');
                    }
                    if (e.cancelable) e.preventDefault();
                    translateX = e.touches[0].clientX - touchPanOriginX; 
                    translateY = e.touches[0].clientY - touchPanOriginY; 
                    if(!animationFrameId) { 
                        animationFrameId = requestAnimationFrame(() => { 
                            window.updateCanvasTransform(); 
                            animationFrameId = null; 
                        }); 
                    }
                }
            } else if (e.touches.length === 2) { 
                if (e.cancelable) e.preventDefault();
                touchTotalDistance = 50;
                const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); 
                const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                if (initialPinchDistance && initialPinchDistance > 10 && currentDist > 10) {
                    // Zoom proporcional multiplicativo con amortiguación sedosa (evita saltos bruscos)
                    const rawRatio = currentDist / initialPinchDistance;
                    const factor = 1 + (rawRatio - 1) * 0.60;
                    
                    const minScale = window.getMinZoomLimit();
                    const maxScale = 2.2;
                    const newScale = Math.max(minScale, Math.min(maxScale, scale * factor));
                    
                    const panDx = currentMidX - initialPinchMidX;
                    const panDy = currentMidY - initialPinchMidY;
                    
                    if (Math.abs(newScale - scale) > 0.00005) {
                        if (!svgElem) window.ensureDomReferences();
                        const rect = svgElem.getBoundingClientRect();
                        const focalX = currentMidX - rect.left;
                        const focalY = currentMidY - rect.top;
                        
                        translateX = focalX - (focalX - translateX) * (newScale / scale) + panDx;
                        translateY = focalY - (focalY - translateY) * (newScale / scale) + panDy;
                        scale = newScale;
                    } else {
                        translateX += panDx;
                        translateY += panDy;
                    }
                    
                    initialPinchDistance = currentDist;
                    initialPinchMidX = currentMidX;
                    initialPinchMidY = currentMidY;

                    if(!animationFrameId) {
                        animationFrameId = requestAnimationFrame(() => {
                            window.updateCanvasTransform();
                            animationFrameId = null;
                        });
                    }
                } 
            }
        }, {passive: false});

        const handleTouchEnd = (e) => { 
            if (touchTotalDistance > 6) {
                suppressClickUntil = Date.now() + 350;
            }
            if (e && e.touches && e.touches.length === 1) {
                // Continuidad fluida si se levanta un dedo durante el pellizco
                isTouchActive = true;
                isPanning = true;
                initialPinchDistance = null;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchPanOriginX = e.touches[0].clientX - translateX;
                touchPanOriginY = e.touches[0].clientY - translateY;
                ws.classList.add('is-panning');
                return;
            }
            isTouchActive = false;
            isPanning = false; 
            initialPinchDistance = null; 
            ws.classList.remove('is-panning');
        };

        ws.addEventListener('touchend', handleTouchEnd);
        ws.addEventListener('touchcancel', handleTouchEnd);

        ws.addEventListener('mousedown', (e) => { 
            if(e.target.closest('.interactive-node') || e.target.closest('#infoCard') || isAnyDrawerActive()) return; 
            isPanning = true; 
            startX = e.clientX - translateX; 
            startY = e.clientY - translateY; 
            ws.style.cursor = 'grabbing'; 
            ws.classList.add('is-panning');
        }); 
        ws.addEventListener('mousemove', (e) => { 
            if(!isPanning) return; 
            translateX = e.clientX - startX; 
            translateY = e.clientY - startY; 
            if(!animationFrameId) { animationFrameId = requestAnimationFrame(() => { window.updateCanvasTransform(); animationFrameId = null; }); }
        }); 
        ws.addEventListener('mouseup', () => { 
            isPanning = false; 
            ws.style.cursor = 'grab'; 
            ws.classList.remove('is-panning');
        }); 
        ws.addEventListener('mouseleave', () => { 
            isPanning = false; 
            ws.style.cursor = 'grab'; 
            ws.classList.remove('is-panning');
        }); 
        ws.addEventListener('wheel', (e) => { 
            if(isAnyDrawerActive() || e.target.closest('#infoCard') || e.target.closest('#dailyDrawer')) return; 
            e.preventDefault(); 
            window.zoomCanvas(-e.deltaY * 0.001, e.clientX, e.clientY); 
        }, {passive: false});
    }

    // CANDADO DE ZOOM: Calcula dinámicamente el límite mínimo de zoom
    // para que el mapa NUNCA se aleje más allá de los extremos donde terminan los proyectos.
    window.getMinZoomLimit = function() {
        const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;
        if (!svgElem || !canvasGroup) return isSmallScreen ? 0.15 : 0.40;
        try {
            const bbox = canvasGroup.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
                const rect = svgElem.getBoundingClientRect();
                const padding = isSmallScreen ? 15 : 70;
                const fitX = (rect.width - padding * 2) / bbox.width;
                const fitY = (rect.height - padding * 2) / bbox.height;
                const fitScale = Math.min(fitX, fitY);
                // Piso flexible en móvil para que quepa todo el mapa en pantallas estrechas u horizontales
                const minFloor = isSmallScreen ? 0.10 : 0.35;
                return Math.max(minFloor, Math.min(0.85, fitScale * 0.95));
            }
        } catch(e) {}
        return isSmallScreen ? 0.15 : 0.40;
    };

    window.zoomCanvas = function(delta, mx = window.innerWidth/2, my = window.innerHeight/2) {
      if(!svgElem) window.ensureDomReferences();
      const minScale = window.getMinZoomLimit();
      const maxScale = 2.2;
      const targetScale = scale + delta;
      // Previene inversión y asegura el candado estricto
      const newScale = Math.max(minScale, Math.min(maxScale, targetScale));
      
      // Si ya alcanzó el límite del candado, evitar trabajo y saltos
      if (Math.abs(newScale - scale) < 0.0001) return;

      const rect = svgElem.getBoundingClientRect(); 
      const x = mx - rect.left, y = my - rect.top;
      translateX = x - (x - translateX) * (newScale / scale); 
      translateY = y - (y - translateY) * (newScale / scale);
      scale = newScale; 
      window.updateCanvasTransform();
    }
    
    window.focusNode = function(nodeX, nodeY) {
        if(!svgElem) return;
        const rect = svgElem.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 768;
        
        let availableWidth = rect.width;
        let availableHeight = rect.height;
        
        if (isDesktop) {
            if (isDrawerOpen) availableWidth -= 480;
            else if (!document.getElementById('infoCard').classList.contains('hidden')) availableWidth -= 400;
        } else {
            if (!document.getElementById('infoCard').classList.contains('hidden')) availableHeight -= (rect.height * 0.42);
        }
        
        const targetScale = window.innerWidth < 640 ? 0.80 : 1.05; // Acercamiento óptimo responsive
        let targetTx = (availableWidth / 2) - (nodeX * targetScale);
        let targetTy = (availableHeight / 2) - (nodeY * targetScale);
        
        scale = targetScale;
        translateX = targetTx;
        translateY = targetTy;
        window.updateCanvasTransform();
    };

    window.recenterCanvas = function() {
        if(!svgElem || !canvasGroup) return; 
        const rect = svgElem.getBoundingClientRect();
        try {
            const bbox = canvasGroup.getBBox(); if (bbox.width === 0) throw new Error();
            const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;
            const padding = isSmallScreen ? 16 : 70;
            
            const sX = (rect.width - padding*2) / bbox.width;
            const sY = (rect.height - padding*2) / bbox.height;
            
            const minAllowed = window.getMinZoomLimit();
            scale = Math.max(minAllowed, Math.min(1.10, Math.min(sX, sY)));
            
            translateX = (rect.width / 2) - ((bbox.x + bbox.width / 2) * scale); 
            translateY = (rect.height / 2) - ((bbox.y + bbox.height / 2) * scale);
        } catch(e) { 
            translateX = rect.width / 2; 
            translateY = rect.height / 2; 
            const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;
            scale = isSmallScreen ? 0.28 : 0.85; 
        }
        window.updateCanvasTransform();
    }

    window.toggleConfigDrawer = function() { isDrawerOpen ? window.closeConfigDrawer() : window.openConfigDrawer(); }
    window.openConfigDrawer = function() { 
        if (window.innerWidth < 768) window.closeInfoCardSafe();
        if (isPriorityDrawerOpen) window.closePriorityDrawer(); 
        if(isAlertsDrawerOpen) window.toggleAlertsDrawer(); 
        document.getElementById('configDrawer').classList.remove('translate-x-full'); 
        isDrawerOpen = true; 
        window.populateGlobalEditSelector(); 
        window.renderDashboard();
        window.applyRolePermissions();
    }
    window.closeConfigDrawer = function() { document.getElementById('configDrawer').classList.add('translate-x-full'); isDrawerOpen = false; }
    window.togglePriorityDrawer = function() { isPriorityDrawerOpen ? window.closePriorityDrawer() : window.openPriorityDrawer(); }
    window.openPriorityDrawer = function() { 
        if (window.innerWidth < 768) window.closeInfoCardSafe();
        if(isDrawerOpen) window.closeConfigDrawer(); 
        if(isAlertsDrawerOpen) window.toggleAlertsDrawer(); 
        document.getElementById('priorityDrawer').classList.remove('translate-x-full'); 
        isPriorityDrawerOpen = true; 
        window.renderPriorityDrawer(); 
    }
    window.closePriorityDrawer = function() { document.getElementById('priorityDrawer').classList.add('translate-x-full'); isPriorityDrawerOpen = false; }
    window.openFastCreateProject = function() { window.openConfigDrawer(); window.switchTab('new'); window.setCreateType('project'); setTimeout(() => document.getElementById('newProjName').focus(), 300); }
    
    window.switchTab = function(tabId) {
      if (tabId === 'history' && currentUserRole !== 'Supremo' && currentUserRole !== 'Supervisor') {
          window.showToast("Acceso denegado: El Historial solo es accesible para Supervisores y Administrador.", true);
          return;
      }
      if (tabId === 'edit' && currentUserRole !== 'Supremo' && currentUserRole !== 'Supervisor') {
          window.showToast("Acceso denegado: Función para Supervisores y Administrador.", true);
          return;
      }
      if ((tabId === 'consultants' || tabId === 'docs') && currentUserRole !== 'Supremo') {
          window.showToast("Acceso exclusivo para Administrador Supremo.", true);
          return;
      }
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => { el.classList.remove('bg-white/10','text-white','shadow-sm','text-gray-400'); el.classList.add('text-gray-400'); });
      document.getElementById(`tab-${tabId}`).classList.remove('hidden');
      const btn = document.getElementById(`tabBtn-${tabId}`); if (btn) { btn.classList.remove('text-gray-400'); btn.classList.add('bg-white/10','text-white','shadow-sm'); }
      if(tabId === 'edit') {
          window.populateGlobalEditSelector(); 
          if(currentSelection && currentSelection.id) {
              window.selectNode(currentSelection.type, currentSelection.id);
          }
      }
      if(tabId === 'new') window.populateNewProjectLocationSelect(); 
      if(tabId === 'dashboard') window.renderDashboard();
      if(tabId === 'history') window.renderHistory();
      if(tabId === 'consultants') window.renderRegisteredConsultantsList();
      if(tabId === 'docs') window.renderRegisteredDocsList();
    }

    window.setCreateType = function(type) {
       currentCreateType = type; const btnP = document.getElementById('btnCreateTypeProject'), btnM = document.getElementById('btnCreateTypeModule'), formP = document.getElementById('createProjectForm'), formM = document.getElementById('createModuleForm');
       if(type === 'project') { 
           btnP.classList.add('bg-white/10','text-white'); btnP.classList.remove('text-gray-400','border-transparent'); 
           btnM.classList.remove('bg-white/10','text-white'); btnM.classList.add('text-gray-400','border-transparent'); 
           formP.classList.remove('hidden'); formM.classList.add('hidden'); 
           if (typeof window.populateNewProjectLocationSelect === 'function') {
               const locSel = document.getElementById('newProjLocation');
               window.populateNewProjectLocationSelect(locSel ? locSel.value : null);
           }
       } 
       else { btnM.classList.add('bg-white/10','text-white'); btnM.classList.remove('text-gray-400','border-transparent'); btnP.classList.remove('bg-white/10','text-white'); btnP.classList.add('text-gray-400','border-transparent'); formM.classList.remove('hidden'); formP.classList.add('hidden'); }
    }
    
    window.toggleSearch = function() {
        const inp = document.getElementById('searchInput');
        const btn = document.getElementById('searchBtnIcon');
        const wrapC = document.getElementById('filterConsultantWrapper');
        const wrapS = document.getElementById('filterStatusWrapper');
        
        if (inp.classList.contains('opacity-0')) {
            inp.classList.remove('opacity-0', 'w-0', 'pointer-events-none'); inp.classList.add('opacity-100', 'w-48', 'sm:w-64'); btn.classList.add('bg-white/10'); 
            btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
            if(wrapC) wrapC.classList.add('hidden');
            if(wrapS) wrapS.classList.add('hidden');
            inp.focus();
        } else {
            inp.classList.add('opacity-0', 'w-0', 'pointer-events-none'); inp.classList.remove('opacity-100', 'w-48', 'sm:w-64'); btn.classList.remove('bg-white/10'); 
            btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`;
            if(wrapC) wrapC.classList.remove('hidden');
            if(wrapS) wrapS.classList.remove('hidden');
            inp.value = ''; window.handleSearch();
            window.recenterCanvas();
        }
    }
    
    window.updateDatalist = function() {
        const dl = document.getElementById('projectsDatalist'); if(!dl) return; let allProjs = [];
        appData.directProjects.forEach(p => allProjs.push(p.name)); appData.modules.forEach(m => (m.projects||[]).forEach(p => allProjs.push(p.name)));
        allProjs.sort((a,b) => a.localeCompare(b)); dl.innerHTML = allProjs.map(n => `<option value="${escapeHtml(n)}">`).join('');
    }

    window.handleSearch = function() { activeSearchQuery = document.getElementById('searchInput').value.trim(); window.renderMindMap(); }
    window.handleFilterChange = function() { const fc = document.getElementById('consultantFilter'), fs = document.getElementById('statusFilter'); if (fc) activeFilterConsultant = fc.value; if (fs) activeFilterStatus = fs.value; window.renderMindMap(); window.closeInfoCardSafe(); if(isPriorityDrawerOpen) window.renderPriorityDrawer(); }

    function hasUnvalidatedNA(prefix) { return globalDocs.some(d => { const na = document.getElementById(`${prefix}Na${d.id}`), val = document.getElementById(`${prefix}NaValidated${d.id}`); return (na && na.checked && val && val.value !== "true"); }); }
    window.closeInfoCardSafe = function() { 
        if(hasUnvalidatedNA('quick')) { window.showToast("⚠️ Tienes N/A sin validar.", true); return; } 
        document.body.classList.remove('info-card-open');
        document.getElementById('infoCard').classList.add('opacity-0'); 
        setTimeout(() => {
            document.getElementById('infoCard').classList.add('hidden');
            document.body.classList.remove('info-card-open');
        }, 400); 
        if (currentSelection && currentSelection.id) {
            currentSelection = { type: null, id: null };
            window.renderMindMap();
        }
    }

    
    // === LÓGICA DE TAREA POR PROYECTO Y TAREA GLOBAL ===
    window.openProjectTaskModal = function() {
        if (currentUserRole === 'Lector') return;
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
        if (isAlertsDrawerOpen) window.toggleAlertsDrawer();
        if (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) window.toggleDailyDrawer();
        
        const projSelect = document.getElementById('gtProject');
        projSelect.innerHTML = '<option value="" class="bg-black text-gray-400">-- Selecciona un Proyecto Destino --</option>';
        
        // 1. Proyectos directos
        if (appData.directProjects && appData.directProjects.length > 0) {
            appData.directProjects.forEach(p => {
                const isMyProject = Array.isArray(p.consultants) && p.consultants.includes(localAuthor);
                projSelect.innerHTML += `<option value="direct-project|${p.id}" class="bg-black text-white">⚡ ${isMyProject ? '⭐ ' : ''}${escapeHtml(p.name)}${isMyProject ? ' (Mi proyecto)' : ''}</option>`;
            });
        }
        
        // 2. Proyectos dentro de módulos
        if (appData.modules && appData.modules.length > 0) {
            appData.modules.forEach(m => {
                (m.projects || []).forEach(p => {
                    const isMyProject = Array.isArray(p.consultants) && p.consultants.includes(localAuthor);
                    projSelect.innerHTML += `<option value="project|${p.id}" class="bg-black text-white">📦 ${isMyProject ? '⭐ ' : ''}${escapeHtml(p.name)} [${escapeHtml(m.name)}]${isMyProject ? ' (Mi proyecto)' : ''}</option>`;
                });
            });
        }
        
        // Si el usuario tenía un proyecto seleccionado o abierto en el mapa, preseleccionarlo
        if (currentSelection && currentSelection.id) {
            const matchOpt = Array.from(projSelect.options).find(opt => opt.value.endsWith('|' + currentSelection.id));
            if (matchOpt) projSelect.value = matchOpt.value;
        }
        
        const assSelect = document.getElementById('gtAssignee');
        assSelect.innerHTML = '';
        const activeConsultants = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector').sort();
        activeConsultants.forEach(c => {
            const isSelf = c === localAuthor;
            assSelect.innerHTML += `<option value="${escapeHtml(c)}" class="bg-black text-white" ${isSelf ? 'selected' : ''}>${escapeHtml(c)} ${isSelf ? '(Yo)' : ''}</option>`;
        });
        
        document.getElementById('gtDescription').value = '';
        document.getElementById('gtDate').value = '';
        
        const modal = document.getElementById('globalTaskModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    };
    window.openGlobalTaskModal = window.openProjectTaskModal;

    window.closeGlobalTaskModal = function() {
        const modal = document.getElementById('globalTaskModal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 400);
    };

    // --- MÓDULO DE ALERTAS EXTERNAS (TORRE DE CONTROL GOOGLE WORKSPACE / CHAT) ---
    const _chatK = ['AIzaSyDdI0hCZtE', '6vySjMm-WEfRq3CPzqKqqsHI'].join('');
    const _chatT = '_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
    const GOOGLE_CHAT_WEBHOOK_URL = `https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=${_chatK}&token=${_chatT}`;
    const URL_APPS_SCRIPT_WEBAPP = 'https://script.google.com/macros/s/AKfycbyrEdRic_xTLQTGtdxlgiX_EFLXBWlk3UrDj-57ie0d_IVUuM8ZIitBT2qoz3wmagLS/exec';

    window.sendExternalAlert = async function(type, dataOrMessage, assignedUser) {
        try {
            let payload = { type: type || 'CHAT' };
            if (typeof dataOrMessage === 'object' && dataOrMessage !== null) {
                payload = Object.assign(payload, dataOrMessage);
                if (!payload.assignedUser && payload.assignee) payload.assignedUser = payload.assignee;
            } else {
                payload.message = dataOrMessage || '';
                payload.assignedUser = assignedUser || 'General';
            }

            // Construir texto formateado Markdown para Google Chat
            let chatText = '';
            if (type === 'ASSIGNMENT') {
                chatText = `📌 *NUEVA ASIGNACIÓN DE TRABAJO*\n` +
                           `👤 *Consultor:* ${payload.assignee || payload.assignedUser || 'Consultor'}\n` +
                           `📦 *Proyecto:* ${payload.project || 'General'}\n` +
                           `📝 *Tarea:* "${payload.task || ''}"\n` +
                           `📅 *Fecha Límite:* ${payload.deadline || 'Sin fecha'}\n` +
                           `✍️ *Asignado por:* ${payload.author || localAuthor || 'Sistema'}`;
            } else if (type === 'VALIDATION_SUBMITTED') {
                chatText = `⏳ *TAREA ENVIADA A VALIDACIÓN*\n` +
                           `👤 *Consultor:* ${payload.consultant || payload.assignedUser || localAuthor || 'Consultor'}\n` +
                           `📦 *Proyecto:* ${payload.project || 'General'}\n` +
                           `📝 *Tarea:* "${payload.task || ''}"\n` +
                           `📎 *Evidencia:* "${payload.feedback || 'Sin comentarios'}"`;
            } else if (type === 'TASK_VALIDATED') {
                chatText = `✅ *TAREA VALIDADA Y APROBADA*\n` +
                           `👤 *Consultor:* ${payload.consultant || 'Consultor'}\n` +
                           `📦 *Proyecto:* ${payload.project || 'General'}\n` +
                           `📝 *Tarea:* "${payload.task || ''}"\n` +
                           `🎖️ *Validado por:* ${payload.validatedBy || localAuthor || 'Supervisor'}`;
            } else if (type === 'PROJECT_CREATED') {
                chatText = `🚀 *NUEVO PROYECTO REGISTRADO*\n` +
                           `📦 *Proyecto:* ${payload.project || ''}\n` +
                           `📂 *Módulo:* ${payload.module || 'Directo'}\n` +
                           `👥 *Equipo Asignado:* ${payload.consultants || 'Por definir'}\n` +
                           `📅 *Fecha Límite:* ${payload.deadline || 'Sin fecha'}\n` +
                           `✍️ *Registrado por:* ${payload.author || localAuthor || 'Sistema'}\n` +
                           `🔗 ${(typeof window !== 'undefined' && window.location) ? (window.location.origin + window.location.pathname) : 'https://panel-control-sicom.netlify.app/'}`;
            } else if (type === 'MORNING_DIGEST') {
                chatText = payload.message || (typeof window.generateMorningDigestText === 'function' ? window.generateMorningDigestText() : '');
            } else {
                chatText = payload.message || `🔔 *ALERTA SICOM*\n👤 *Para:* ${payload.assignedUser || 'General'}\n📋 *Detalle:* ${payload.message || ''}`;
            }

            console.log('🔔 [SICOM External Alert] Despachando notificación:', { type, preview: (chatText || '').substring(0, 60) + '...' });

            // Envío DIRECTO e INMEDIATO al Webhook de Google Chat (instantáneo, limpio y sin duplicados)
            if (GOOGLE_CHAT_WEBHOOK_URL) {
                fetch(GOOGLE_CHAT_WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ text: chatText })
                }).then(() => {
                    console.log('✅ [SICOM Google Chat] Mensaje entregado directamente al Webhook de Google Chat');
                }).catch(err => {
                    console.warn('⚠️ [SICOM Google Chat] Error en Webhook directo:', err);
                });
            }
        } catch (e) {
            console.warn('⚠️ [SICOM External Alert] Excepción silenciosa:', e);
        }
    };

    window.generateMorningDigestText = function() {
        const now = new Date();
        const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const allProjects = [];
        (appData.directProjects || []).forEach(p => allProjects.push({ ...p, moduleName: 'PROYECTOS DIRECTOS' }));
        (appData.modules || []).forEach(m => {
            (m.projects || []).forEach(p => allProjects.push({ ...p, moduleName: m.name }));
        });
        
        const overdue = [];
        const dueSoon = [];
        const clientHold = [];
        const pendingValidation = [];
        
        allProjects.forEach(p => {
            (p.tasks || []).forEach(t => {
                if (t.done === 'pending') {
                    pendingValidation.push({ task: t.text, project: p.name, assignee: t.assignee || 'Sin asignar' });
                }
            });
            
            if (p.clientDeliveryDate && !p.clientReturnDate && p.status !== 'Completado') {
                clientHold.push({ name: p.name, sentDate: p.clientDeliveryDate, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
            }
            
            if (p.deadline && p.status !== 'Completado') {
                const parts = p.deadline.split('-');
                const deadTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
                const diffDays = Math.round((deadTime - todayTime) / 86400000);
                
                if (diffDays < 0) {
                    overdue.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysOverdue: Math.abs(diffDays), consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
                } else if (diffDays <= 3) {
                    dueSoon.push({ name: p.name, module: p.moduleName, deadline: p.deadline, daysLeft: diffDays, consultants: (p.consultants || []).join(', ') || 'Sin asignar' });
                }
            }
        });
        
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const fechaTexto = `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
        
        let msg = `🌅 *TORRE DE CONTROL SICOM — RESUMEN DE RIESGOS*\n` +
                  `📅 _${fechaTexto}_\n\n`;
                  
        if (overdue.length > 0) {
            msg += `🔴 *PROYECTOS VENCIDOS / ATRASADOS (${overdue.length}):*\n`;
            overdue.forEach(o => {
                msg += `• *${o.name}* [${o.module}]\n  ↳ Atraso: ${o.daysOverdue} día(s) (Venció: ${o.deadline})\n  ↳ Responsable(s): ${o.consultants}\n`;
            });
            msg += `\n`;
        } else {
            msg += `✅ *Proyectos Vencidos:* ¡Ninguno! Todo al corriente.\n\n`;
        }
        
        if (dueSoon.length > 0) {
            msg += `🟡 *PRÓXIMAS ENTREGAS (PRÓXIMOS 3 DÍAS) (${dueSoon.length}):*\n`;
            dueSoon.forEach(s => {
                const t = s.daysLeft === 0 ? "¡VENCE HOY!" : `Vence en ${s.daysLeft} día(s)`;
                msg += `• *${s.name}* — ${t} (${s.deadline})\n  ↳ Responsable(s): ${s.consultants}\n`;
            });
            msg += `\n`;
        }
        
        if (pendingValidation.length > 0) {
            msg += `⏳ *TAREAS PENDIENTES DE VALIDACIÓN (${pendingValidation.length}):*\n`;
            pendingValidation.forEach(v => {
                msg += `• "${v.task}" en *[${v.project}]*\n  ↳ Enviado por: ${v.assignee}\n`;
            });
            msg += `\n`;
        }
        
        if (clientHold.length > 0) {
            msg += `🤝 *EN REVISIÓN CON EL CLIENTE (${clientHold.length}):*\n`;
            clientHold.forEach(c => {
                msg += `• *${c.name}* (Enviado: ${c.sentDate})\n  ↳ Resp: ${c.consultants}\n`;
            });
            msg += `\n`;
        }
        
        const appUrl = (typeof window !== 'undefined' && window.location) ? (window.location.origin + window.location.pathname) : 'https://panel-control-sicom.netlify.app/';
        msg += `🔗 *Acceso al Panel:* ${appUrl}`;
        return msg;
    };

    window.triggerChatMorningDigest = async function(btnEl) {
        if (currentUserRole === 'Lector') {
            window.showToast("⚠️ Los lectores no tienen permisos para publicar alertas.", true);
            return;
        }
        let originalText = '';
        if (btnEl && btnEl.innerHTML) {
            originalText = btnEl.innerHTML;
            btnEl.innerHTML = `⏳ Publicando en Chat...`;
            btnEl.disabled = true;
        }
        window.showToast("📡 Despachando Resumen a Google Chat...", false);
        try {
            const digestText = window.generateMorningDigestText();
            await window.sendExternalAlert('MORNING_DIGEST', { message: digestText, assignedUser: 'General' });
            window.showToast("✅ Resumen de Riesgos publicado en Google Chat", false);
        } catch (err) {
            console.error('Error al generar o enviar resumen:', err);
            window.showToast("⚠️ Ocurrió un error al despachar el resumen.", true);
        } finally {
            if (btnEl && originalText) {
                setTimeout(() => {
                    btnEl.innerHTML = originalText;
                    btnEl.disabled = false;
                }, 1500);
            }
        }
    };

    window.saveGlobalTask = function() { 
        if (currentUserRole === 'Lector') return;
        const projVal = document.getElementById('gtProject').value;
        const text = document.getElementById('gtDescription').value.trim();
        const assignee = document.getElementById('gtAssignee').value || localAuthor;
        const deadline = document.getElementById('gtDate').value;
        
        if (!projVal) {
            window.showToast("Debes seleccionar un proyecto destino", true);
            return;
        }
        if (!text) {
            window.showToast("La descripción de la tarea es obligatoria", true);
            return;
        }
        
        const now = new Date();
        const assignDate = now.toLocaleDateString('es-MX');
        const assignTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        const parts = projVal.split('|');
        const pType = parts[0];
        const pId = parts[1];
        let item = null;
        if (pType === 'direct-project') {
            item = (appData.directProjects || []).find(p => p.id === pId);
        } else {
            (appData.modules || []).forEach(m => {
                const p = (m.projects || []).find(proj => proj.id === pId);
                if (p) item = p;
            });
        }
        
        if (item) {
            item.tasks = item.tasks || [];
            item.tasks.push({ 
                id: 't_' + Date.now(), 
                text, 
                deadline, 
                assignee, 
                assignedBy: localAuthor, 
                assignDate, 
                assignTime, 
                done: false 
            });
            logActivity(item.id, item.name, `Asignó tarea de proyecto a ${assignee}`, localAuthor);

            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('ASSIGNMENT', {
                    project: item.name,
                    task: text,
                    deadline: deadline || 'Sin fecha',
                    assignee: assignee || 'Sin asignar',
                    author: localAuthor
                });
            }

            window.saveData(true);
            window.closeGlobalTaskModal();
            window.renderAlerts(); 
            window.renderDailyTasks();
            if (currentSelection && currentSelection.id === item.id) {
                window.renderTasksQuick(item);
            }
            window.showToast("Tarea asignada al proyecto con éxito");
        } else {
            window.showToast("Error: No se encontró el proyecto seleccionado", true);
        }
    };
    
    window.completeGlobalTask = function(taskId) {
        window.openTaskFeedbackModal(taskId, 'global');
    };
    window.validateGlobalTask = function(taskId, approve) {
        if(!appData.globalTasks) return;
        const t = appData.globalTasks.find(x => x.id === taskId);
        if(t) {
            const now = new Date();
            const valDate = now.toLocaleDateString('es-MX');
            const valTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            t.done = approve ? true : false;
            if(approve) {
                t.validatedDate = valDate; t.validatedTime = valTime; t.validatedBy = localAuthor;
            } else {
                delete t.validatedDate; delete t.validatedTime; delete t.validatedBy;
                delete t.feedback;
            }
            const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
            logActivity('global', 'General', approve ? `Validó tarea general de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}` : `Rechazó tarea general: "${t.text}"`, localAuthor);
            window.saveData(false);
            window.renderAlerts();
            window.renderDailyTasks();
            if (approve) window.triggerCelebration();
        }
    };
    window.validateProjectTask = function(pType, pId, taskId, approve) {
        let item = null;
        if (pType === 'direct-project') { item = (appData.directProjects || []).find(p => p.id === pId); } 
        else { (appData.modules || []).forEach(m => { const p = (m.projects||[]).find(proj => proj.id === pId); if(p) item = p; }); }
        if (!item && pId) {
            item = (appData.directProjects || []).find(p => p.id === pId);
            if (!item) { (appData.modules || []).forEach(m => { const p = (m.projects||[]).find(proj => proj.id === pId); if(p) item = p; }); }
        }
        if (item && item.tasks) {
            const t = item.tasks.find(x => x.id === taskId);
            if(t) {
                const now = new Date();
                const valDate = now.toLocaleDateString('es-MX');
                const valTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                t.done = approve ? true : false;
                if(approve) {
                    t.validatedDate = valDate; t.validatedTime = valTime; t.validatedBy = localAuthor;
                } else {
                    delete t.validatedDate; delete t.validatedTime; delete t.validatedBy;
                    delete t.feedback;
                }
                const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
                logActivity(item.id, item.name, approve ? `Validó tarea de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}` : `Rechazó tarea: "${t.text}"`, localAuthor);
                window.saveData(false);
                window.renderAlerts();
                if(currentSelection && currentSelection.id === item.id) window.renderTasksQuick(item);
                window.renderDailyTasks();
                if (approve) window.triggerCelebration();
            }
        }
    };

    window.deleteGlobalTask = function(taskId) {
        if(!appData.globalTasks) return;
        const t = appData.globalTasks.find(x => x.id === taskId);
        if (!t) return;
        
        const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
        const isAssigner = t.assignedBy === localAuthor;
        
        if (!isSuper && !isAssigner) {
            window.showToast("Acceso denegado: Privilegios insuficientes.", true);
            return;
        }
        
        appData.globalTasks = appData.globalTasks.filter(x => x.id !== taskId);
        logActivity('global', 'General', `Eliminó la tarea general: ${t.text}`, localAuthor);
        window.saveData(false);
        window.renderAlerts();
        window.renderDailyTasks();
    };

    // === LÓGICA DE TAREAS ===

    function getSelectedItem() {
        if (!currentSelection.id) return null;
        if (currentSelection.type === 'direct-project') return appData.directProjects.find(p => p.id === currentSelection.id);
        let found = null; appData.modules.forEach(m => { const p = (m.projects||[]).find(proj => proj.id === currentSelection.id); if(p) found = p; }); return found;
    }

    window.addQuickTask = function() { if (currentUserRole === 'Lector') return;
        const input = document.getElementById('newQuickTaskInput');
        const dateInput = document.getElementById('newQuickTaskDate');
        const assigneeInput = document.getElementById('newQuickTaskAssignee');
        const text = input.value.trim(); 
        const deadline = dateInput.value;
        const assignee = assigneeInput ? assigneeInput.value : '';
        if(!text) return;
        let item = getSelectedItem();
        if(item) {
            item.tasks = item.tasks || [];
            const now = new Date();
            const assignDate = now.toLocaleDateString('es-MX');
            const assignTime = now.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
            item.tasks.push({ id: 't_'+Date.now(), text, deadline, assignee, assignedBy: localAuthor, assignDate, assignTime, done: false });
            input.value = ''; dateInput.value = ''; if(assigneeInput && !assigneeInput.disabled) assigneeInput.value = '';
            logActivity(item.id, item.name, 'Agregó nueva tarea', localAuthor); 

            // Inyección de alerta externa hacia Google Workspace (Google Chat)
            if (currentUserRole !== 'Lector') {
                window.sendExternalAlert('ASSIGNMENT', {
                    project: item.name,
                    task: text,
                    deadline: deadline || 'Sin fecha',
                    assignee: assignee || 'Sin asignar',
                    author: localAuthor
                });
            }

            window.saveData(false); 
            window.renderTasksQuick(item);
            window.renderDailyTasks();
        }
    };

    window.toggleQuickTask = function(taskId, directProjectId = null) {
        let item = null;
        if (directProjectId) {
            item = (appData.directProjects || []).find(p => p.id === directProjectId);
            if (!item) {
                (appData.modules || []).forEach(m => {
                    const p = (m.projects || []).find(proj => proj.id === directProjectId);
                    if (p) item = p;
                });
            }
        }
        if (!item) item = getSelectedItem();
        if(item && item.tasks) {
            const t = item.tasks.find(x => x.id === taskId);
            if(t) {
                const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
                const now = new Date();
                const valDate = now.toLocaleDateString('es-MX');
                const valTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                if (t.done === true) {
                    // Desmarcar / Reabrir
                    if (isSuper) {
                        t.done = false;
                        delete t.feedback; delete t.validatedDate; delete t.validatedTime; delete t.validatedBy;
                        logActivity(item.id, item.name, `Reabrió tarea de ${t.assignee||'consultor'}: "${t.text}"`, localAuthor); 
                        window.saveData(false); 
                        window.renderTasksQuick(item); 
                        window.renderAlerts(); 
                        window.renderDailyTasks();
                    }
                } else if (t.done === 'pending') {
                    // Supervisor aprueba o Consultor cancela envío
                    if (isSuper) {
                        t.done = true;
                        t.validatedDate = valDate; t.validatedTime = valTime; t.validatedBy = localAuthor;
                        const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
                        logActivity(item.id, item.name, `Validó tarea de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor); 
                        window.sendExternalAlert('TASK_VALIDATED', {
                            project: item.name,
                            task: t.text,
                            validatedBy: localAuthor,
                            consultant: t.assignee || 'Consultor'
                        });
                        window.saveData(false); 
                        window.renderTasksQuick(item); 
                        window.renderAlerts(); 
                        window.renderDailyTasks();
                        window.triggerCelebration();
                    } else {
                        t.done = false;
                        delete t.feedback;
                        logActivity(item.id, item.name, `Canceló envío a validación: "${t.text}"`, localAuthor); 
                        window.saveData(false); 
                        window.renderTasksQuick(item); 
                        window.renderAlerts(); 
                        window.renderDailyTasks();
                    }
                } else {
                    // Completar / Enviar a validar (abre modal)
                    window.openTaskFeedbackModal(taskId, 'project', item.id);
                    setTimeout(() => window.renderTasksQuick(item), 100); 
                }
            }
        }
    };

    window.deleteQuickTask = function(taskId) {
        let item = getSelectedItem();
        if(item && item.tasks) {
            const t = item.tasks.find(x => x.id === taskId);
            if (!t) return;
            
            const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
            const isAssigner = t.assignedBy === localAuthor;
            
            if (!isSuper && !isAssigner) {
                window.showToast("Acceso denegado: Privilegios insuficientes.", true);
                return;
            }
            
            item.tasks = item.tasks.filter(x => x.id !== taskId); 
            logActivity(item.id, item.name, `Eliminó la tarea: ${t.text}`, localAuthor);
            window.saveData(false); 
            window.renderTasksQuick(item);
        }
    };

    window.renderTasksQuick = function(item) {
        const c = document.getElementById('quickTasksList');
        const badge = document.getElementById('badge-acc-tasks');
        
        if(!item.tasks || item.tasks.length === 0) { 
            c.innerHTML = `
            <div class="py-3 px-3 text-center rounded-xl bg-white/[0.03] border border-dashed border-white/10 mb-2">
                <p class="text-xs text-gray-300 font-medium">Sin tareas registradas en este proyecto</p>
                <p class="text-[10px] text-gray-500 mt-0.5">Usa el formulario inferior para asignar una tarea con fecha límite.</p>
            </div>`; 
            if(badge) badge.classList.add('hidden');
            return; 
        }

        const pendingCount = item.tasks.filter(t => t.done === 'pending').length;
        if(badge) {
            if(pendingCount > 0) {
                badge.textContent = `${pendingCount} Rev`;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        c.innerHTML = item.tasks.map(t => {
            let isOverdue = false;
            let isChecked = t.done === true;
            let isPending = t.done === 'pending';
            
            if(t.deadline && !isChecked) {
                const [y,m,d] = t.deadline.split('-');
                if(new Date(y, m-1, d) < new Date(new Date().setHours(0,0,0,0))) isOverdue = true;
            }
            const dateColor = isChecked ? 'text-gray-500' : (isOverdue ? 'text-[#ff453a] font-bold' : 'text-[#35aee8]');
            
            const isMyTask = t.assignee === localAuthor;
            const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
            const isAssigner = t.assignedBy === localAuthor;
            
            // canEdit permite interactuar con el checkbox (marcar completado/enviar a validación)
            const canEdit = currentUserRole !== 'Lector' && (isSuper || isMyTask || !t.assignee);
            const checkDisabled = canEdit ? '' : 'disabled';
            const checkCursor = canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50';
            
            // canDelete es estricto: Solo roles superiores o el creador de la tarea
            const canDelete = isSuper || isAssigner;
            const delBtn = canDelete ? `<button onclick="deleteQuickTask('${t.id}')" class="text-gray-500 hover:text-[#ff453a] opacity-0 group-hover:opacity-100 transition p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : '';
            let statusBadge = '';
            let boxUI = '';
            if (isPending) {
                statusBadge = `<span class="text-[8px] bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 px-1.5 py-0.5 rounded font-bold uppercase shadow-inner ml-2 shrink-0 mt-0.5">⏳ En Validación</span>`;
                if(isSuper) {
                    boxUI = `<button onclick="toggleQuickTask('${t.id}')" class="h-4 w-4 rounded border border-[#ff9f0a] bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center shrink-0 mt-0.5 hover:bg-[#ff9f0a]/40 transition" title="Haz clic para aprobar"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></button>`;
                } else {
                    boxUI = `<input type="checkbox" checked onchange="toggleQuickTask('${t.id}')" class="rounded border-[#ff9f0a] bg-[#ff9f0a]/20 text-[#ff9f0a] focus:ring-[#ff9f0a] h-4 w-4 shrink-0 cursor-pointer mt-0.5" title="Click para cancelar envío">`;
                }
            } else if (isChecked) {
                statusBadge = `<span class="text-[8px] bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 px-1.5 py-0.5 rounded font-bold uppercase shadow-inner ml-2 shrink-0 mt-0.5">✅ Validada</span>`;
                boxUI = `<input type="checkbox" checked onchange="toggleQuickTask('${t.id}')" class="rounded border-[#30d158] bg-[#30d158]/20 text-[#30d158] focus:ring-[#30d158] h-4 w-4 shrink-0 cursor-pointer mt-0.5" ${!isSuper ? 'disabled class="... opacity-50 cursor-not-allowed"' : ''}>`;
            } else {
                boxUI = `<input type="checkbox" onchange="toggleQuickTask('${t.id}')" class="rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4 shrink-0 ${checkCursor} mt-0.5" ${checkDisabled}>`;
            }

            return `
            <div class="flex items-start gap-3 bg-black/30 p-2.5 rounded-xl border border-white/5 group transition ${isChecked ? 'opacity-40' : (isPending ? 'border-[#ff9f0a]/30 bg-[#ff9f0a]/5' : 'shadow-inner')}">
                ${boxUI}
                <div class="flex flex-col flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                        <span class="text-xs text-white break-words pr-2 ${isChecked ? 'line-through text-gray-400' : ''}">${escapeHtml(t.text)}</span>
                        ${statusBadge}
                    </div>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                        ${(t.assignDate || t.date) ? `<span class="text-[9px] text-gray-400 font-mono">📅 Asignada: ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                        ${t.validatedDate ? `<span class="text-[9px] text-[#30d158] font-mono font-bold bg-[#30d158]/10 border border-[#30d158]/30 px-1.5 py-0.5 rounded">✅ Validada: ${escapeHtml(t.validatedDate)}${t.validatedTime ? ' ' + escapeHtml(t.validatedTime) : ''}${t.validatedBy ? ' por ' + escapeHtml(t.validatedBy) : ''}</span>` : ''}
                        ${t.deadline ? `<span class="text-[9px] ${dateColor}">🎯 Límite: ${escapeHtml(t.deadline)}</span>` : ''}
                        ${t.assignee ? `<span class="text-[8px] bg-white/10 text-gray-300 border border-white/10 px-1.5 py-0.5 rounded shadow-inner">👤 ${escapeHtml(t.assignee)}</span>` : ''}
                        ${t.assignedBy && t.assignedBy !== t.assignee ? `<span class="text-[8px] bg-white/5 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded shadow-inner">De: ${escapeHtml(t.assignedBy)}</span>` : ''}
                    </div>
                    ${t.feedback ? `<div class="mt-2 text-[9px] text-gray-300 bg-black/40 border border-white/10 p-2 rounded shadow-inner">💬 ${escapeHtml(t.feedback)}</div>` : ''}
                </div>
                ${delBtn}
            </div>
        `}).join('');
    };

    window.saveQuickLinks = function() {
        if (currentUserRole === 'Lector') return;
        if (!currentSelection.id) return;
        let item = getSelectedItem();
        if (item) {
            const newDrive = document.getElementById('quickEditDriveLink').value.trim();
            const newInvgate = document.getElementById('quickEditInvgateLink').value.trim();
            item.driveLink = newDrive;
            item.invgateLink = newInvgate;
            logActivity(item.id, item.name, 'Actualizó enlaces del proyecto', localAuthor);
            window.saveData(true);
            
            const btnDrive = document.getElementById('infoDriveBtn');
            const btnInvgate = document.getElementById('infoInvgateBtn');
            
            if(item.driveLink) {
                let formattedLink = item.driveLink;
                if(!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) formattedLink = 'https://' + formattedLink;
                btnDrive.href = formattedLink; btnDrive.classList.remove('hidden');
            } else btnDrive.classList.add('hidden');
            
            if(item.invgateLink) {
                let formattedLink = item.invgateLink;
                if(!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) formattedLink = 'https://' + formattedLink;
                btnInvgate.href = formattedLink; btnInvgate.classList.remove('hidden');
            } else btnInvgate.classList.add('hidden');
        }
    };

    window.silentSaveInfoCard = function() {
        if (currentUserRole === 'Lector') return;
        if (!currentSelection.id) return; if(hasUnvalidatedNA('quick')) return;
        let item = getSelectedItem();
        if (item) {
            const oldStatus = item.status || 'Pendiente'; const oldProg = item.progress || 0;
            item.status = document.getElementById('quickEditStatus').value; if (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor') { item.deadline = document.getElementById('quickEditDeadline').value; } item.clientDeliveryDate = document.getElementById('quickEditDeliveryDate').value; item.clientReturnDate = document.getElementById('quickEditReturnDate').value; item.progress = parseInt(document.getElementById('quickEditProgress').value);
            item.docs = {}; globalDocs.forEach(d => { item.docs[d.id] = { checked: document.getElementById(`quickDoc${d.id}`)?.checked||false, obs: document.getElementById(`quickObs${d.id}`)?.value||'', na: document.getElementById(`quickNa${d.id}`)?.checked||false, naValidated: document.getElementById(`quickNaValidated${d.id}`)?.value==="true" }; });
            if (oldStatus !== item.status) logActivity(item.id, item.name, `Cambió estado a [${item.status}]`, localAuthor);
            else if (oldProg !== item.progress) logActivity(item.id, item.name, `Actualizó avance a ${item.progress}%`, localAuthor);
            window.saveData(false); const ind = document.getElementById('quickSaveIndicator'); ind.classList.remove('opacity-0'); setTimeout(() => ind.classList.add('opacity-0'), 800); window.renderMindMap(); if(isDrawerOpen) window.renderHistory();
        }
    }

    window.handleMainCheck = function(p, id) { 
    if(currentUserRole==='Lector') return; 
    const na = document.getElementById(`${p}Na${id}`), 
          valHidden = document.getElementById(`${p}NaValidated${id}`), 
          btn = document.getElementById(`${p}BtnNa${id}`), 
          dChk = document.getElementById(`${p}Doc${id}`), 
          obsInput = document.getElementById(`${p}Obs${id}`),
          obsCont = document.getElementById(`${p}ObsContainer${id}`);
          
    if(dChk && dChk.checked){ 
        if(na) na.checked = false; 
        if(valHidden) valHidden.value = "false"; 
        if(btn) btn.classList.add('hidden'); 
        if(obsInput) obsInput.value = ''; 
        if(obsCont) obsCont.classList.add('hidden');
    } 
    p==='quick'?window.calculateQuickProgress():window.calculateEditProgress(); 
    if(p==='quick') {
        window.silentSaveInfoCard();
    }
};
    window.handleObsInput = function(p, id) { if(currentUserRole==='Lector') return; const obs = document.getElementById(`${p}Obs${id}`), na = document.getElementById(`${p}Na${id}`), valHidden = document.getElementById(`${p}NaValidated${id}`), btn = document.getElementById(`${p}BtnNa${id}`); if(na&&na.checked){ if(obs&&obs.value.trim()===''){ na.checked=false; valHidden.value="false"; if(btn)btn.classList.add('hidden'); window.showToast("Observación vacía",true); } else if(valHidden&&valHidden.value==="true"){ valHidden.value="false"; if(btn){btn.classList.remove('hidden'); btn.textContent="Re-validar N/A"; btn.className="pill-btn w-full py-2 bg-white text-black text-[10px] font-bold mt-2";} } p==='quick'?window.calculateQuickProgress():window.calculateEditProgress(); } };
    window.handleNaCheck = function(p, id) { 
    if(currentUserRole==='Lector') return; 
    const mChk = document.getElementById(`${p}Doc${id}`), 
          na = document.getElementById(`${p}Na${id}`), 
          obs = document.getElementById(`${p}Obs${id}`), 
          obsCont = document.getElementById(`${p}ObsContainer${id}`),
          btn = document.getElementById(`${p}BtnNa${id}`), 
          valHidden = document.getElementById(`${p}NaValidated${id}`);
          
    if(na && na.checked){ 
        if(mChk) mChk.checked = false; 
        if(obsCont) obsCont.classList.remove('hidden');
        if(btn){
            btn.classList.remove('hidden'); 
            btn.textContent = "Validar N/A"; 
            btn.className = "pill-btn w-full py-2 bg-brand-accent text-[10px] font-bold text-white mt-2 shadow-[0_0_15px_rgba(0,113,227,0.3)]";
        } 
    } else { 
        if(obsCont) obsCont.classList.add('hidden');
        if(obs) obs.value = '';
        if(btn) btn.classList.add('hidden'); 
        if(valHidden) valHidden.value = "false"; 
    } 
    p==='quick'?window.calculateQuickProgress():window.calculateEditProgress(); 
    if(p==='quick' && !na.checked) window.silentSaveInfoCard(); 
};
    window.confirmNa = function(p, id) { if(currentUserRole==='Lector') return; const btn = document.getElementById(`${p}BtnNa${id}`), valHidden = document.getElementById(`${p}NaValidated${id}`); if(valHidden)valHidden.value="true"; if(btn){btn.textContent="✓ Validado"; btn.className="pill-btn w-full py-2 bg-[#30d158]/20 border border-[#30d158]/50 text-[#30d158] text-[10px] font-bold mt-2";} p==='quick'?window.calculateQuickProgress():window.calculateEditProgress(); if(p==='quick') window.silentSaveInfoCard(); };

    window.calculateQuickProgress = function() { if(globalDocs.length===0)return; let sc = 0; const inc = 100/globalDocs.length; globalDocs.forEach(d=>{ if(document.getElementById(`quickDoc${d.id}`)?.checked || (document.getElementById(`quickNa${d.id}`)?.checked && document.getElementById(`quickNaValidated${d.id}`)?.value==="true")) sc+=inc; }); document.getElementById('quickEditProgress').value = Math.round(sc); document.getElementById('quickEditProgressLabel').textContent = Math.round(sc)+'%'; }
    window.calculateEditProgress = function() { if(globalDocs.length===0)return; let sc = 0; const inc = 100/globalDocs.length; globalDocs.forEach(d=>{ if(document.getElementById(`editDoc${d.id}`)?.checked || (document.getElementById(`editNa${d.id}`)?.checked && document.getElementById(`editNaValidated${d.id}`)?.value==="true")) sc+=inc; }); document.getElementById('editProgress').value = Math.round(sc); document.getElementById('editProgressLabel').textContent = Math.round(sc)+'%'; }

    window.renderDocChecklists = function(prefix, savedData) {
        const c = document.getElementById(`${prefix}DocsContainer`); if(!c) return; c.innerHTML = '';
        if (globalDocs.length === 0) { c.innerHTML = `<p class="text-xs text-gray-500 italic">No hay documentos base.</p>`; document.getElementById(`${prefix}SliderContainer`).classList.remove('hidden'); return; }
        document.getElementById(`${prefix}SliderContainer`).classList.add('hidden');
        c.innerHTML = globalDocs.map(doc => `<div class="bg-black/40 p-4 rounded-2xl border border-white/5 border-t-white/10 mb-3 shadow-inner">
                 <div class="flex justify-between items-start mb-3 gap-3">
                     <label class="flex items-start gap-3 text-xs text-white cursor-pointer flex-1 group">
                        <input type="checkbox" id="${prefix}Doc${doc.id}" onchange="handleMainCheck('${prefix}', '${doc.id}')" class="rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4 mt-0.5 shrink-0 transition" ${currentUserRole==='Lector'?'disabled':''}>
                        <span class="break-words whitespace-normal leading-relaxed group-hover:text-brand-accent transition tracking-wide" style="word-break: break-word;">${escapeHtml(doc.name)}</span>
                     </label>
                     <label class="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold tracking-widest cursor-pointer shrink-0 mt-0.5">
                        <input type="checkbox" id="${prefix}Na${doc.id}" onchange="handleNaCheck('${prefix}', '${doc.id}')" class="rounded border-white/20 bg-black/40 text-gray-400 h-3.5 w-3.5 transition" ${currentUserRole==='Lector'?'disabled':''}>N/A
                     </label>
                 </div>
                 <div id="${prefix}ObsContainer${doc.id}" class="flex flex-col gap-2 hidden mt-2 pt-2 border-t border-white/5"><input type="text" id="${prefix}Obs${doc.id}" oninput="handleObsInput('${prefix}', '${doc.id}')" placeholder="Motivo N/A..." class="w-full liquid-input rounded-xl p-3 text-xs focus:outline-none" ${currentUserRole==='Lector'?'readonly':''}><button id="${prefix}BtnNa${doc.id}" type="button" onclick="confirmNa('${prefix}', '${doc.id}')" class="hidden pill-btn w-full py-2 bg-brand-accent text-[10px] font-bold text-white transition">Validar N/A</button></div>
                 <input type="hidden" id="${prefix}NaValidated${doc.id}" value="false"></div>`).join('');
        
        globalDocs.forEach(doc => {
            const data = savedData ? savedData[doc.id] : null;
            if(data) {
                if(data.checked) document.getElementById(`${prefix}Doc${doc.id}`).checked = true;
                if(data.na) {
                    document.getElementById(`${prefix}Na${doc.id}`).checked = true;
                    const obsCont = document.getElementById(`${prefix}ObsContainer${doc.id}`);
                    if(obsCont) obsCont.classList.remove('hidden');
                    if(data.obs) document.getElementById(`${prefix}Obs${doc.id}`).value = data.obs;
                }
                if(data.naValidated) document.getElementById(`${prefix}NaValidated${doc.id}`).value = "true";
                if(data.na && data.naValidated) { const btn = document.getElementById(`${prefix}BtnNa${doc.id}`); btn.classList.remove('hidden'); btn.textContent = "✓ Validado"; btn.className = "pill-btn w-full py-2 bg-[#30d158]/20 border border-[#30d158]/50 text-[#30d158] text-[10px] font-bold mt-2"; } else if(data.na && !data.naValidated) { const btn = document.getElementById(`${prefix}BtnNa${doc.id}`); btn.classList.remove('hidden'); btn.textContent = "Validar N/A"; }
            }
        });
    }

    window.saveEditChanges = function() { 
      if (currentUserRole === 'Lector') return;
      if (!currentSelection.id) return; 
      if (hasUnvalidatedNA('edit')) { window.showToast("⚠️ N/A sin validar.", true); return; }
      const newName = document.getElementById('editName').value.trim(); 
      if (!newName) { window.showToast("⚠️ El nombre no puede estar vacío.", true); return; }
      let { type, id } = currentSelection; 
      let item = null;
      if (type === 'core') { 
        appData.core.name = newName; 
        logActivity('core', newName, 'Renombró el núcleo central', localAuthor); 
      } 
      else if (type === 'direct-hub') { 
        appData.directHub.name = newName; 
        appData.directHub.color = document.getElementById('editModuleColor').value; 
        logActivity('hub', newName, 'Editó el agrupador principal', localAuthor); 
      } 
      else if (type === 'module') { 
        item = appData.modules.find(m => m.id === id); 
        if (item) { 
          item.name = newName; 
          item.color = document.getElementById('editModuleColor').value; 
          logActivity(item.id, item.name, 'Editó diseño del módulo', localAuthor); 
        } 
      } 
      else {
        if (type === 'direct-project') item = appData.directProjects.find(p => p.id === id); 
        else appData.modules.forEach(m => { const p = (m.projects || []).find(proj => proj.id === id); if (p) item = p; });
        if (item) {
          const oldStatus = item.status; 
          const oldProg = item.progress;
          item.name = newName; 
          item.priority = parseFloat(document.getElementById('editPriority').value || 1); 
          item.driveLink = document.getElementById('editDriveLink').value.trim(); 
          item.invgateLink = document.getElementById('editInvgateLink').value.trim(); 
          item.status = document.getElementById('editStatus').value; 
          item.deadline = document.getElementById('editDeadline').value; 
          item.clientDeliveryDate = document.getElementById('editDeliveryDate').value; 
          item.clientReturnDate = document.getElementById('editReturnDate').value; 
          item.progress = parseInt(document.getElementById('editProgress').value);
          item.docs = {}; 
          globalDocs.forEach(d => { 
            item.docs[d.id] = { 
              checked: document.getElementById(`editDoc${d.id}`)?.checked || false, 
              obs: document.getElementById(`editObs${d.id}`)?.value || '', 
              na: document.getElementById(`editNa${d.id}`)?.checked || false, 
              naValidated: document.getElementById(`editNaValidated${d.id}`)?.value === "true" 
            }; 
          });
          item.consultants = Array.from(document.querySelectorAll('.editProjCons-chk:checked')).map(cb => cb.value);
          
          // Reubicación de proyecto entre módulos o directo
          const targetLoc = document.getElementById('editProjectLocation')?.value;
          if (targetLoc) {
            let currentLoc = (type === 'direct-project') ? 'DIRECT' : null;
            let currentParentName = appData.directHub.name;
            if (!currentLoc) {
              const srcMod = appData.modules.find(m => (m.projects || []).some(p => p.id === id));
              if (srcMod) {
                currentLoc = srcMod.id;
                currentParentName = srcMod.name;
              }
            }
            if (currentLoc && targetLoc !== currentLoc) {
              // 1. Quitar de la ubicación anterior
              if (currentLoc === 'DIRECT') {
                appData.directProjects = appData.directProjects.filter(p => p.id !== id);
              } else {
                const srcMod = appData.modules.find(m => m.id === currentLoc);
                if (srcMod && srcMod.projects) {
                  srcMod.projects = srcMod.projects.filter(p => p.id !== id);
                }
              }
              // 2. Insertar en la nueva ubicación
              let targetParentName = '';
              if (targetLoc === 'DIRECT') {
                if (!appData.directProjects) appData.directProjects = [];
                appData.directProjects.push(item);
                type = 'direct-project';
                currentSelection.type = 'direct-project';
                targetParentName = appData.directHub.name;
              } else {
                const destMod = appData.modules.find(m => m.id === targetLoc);
                if (destMod) {
                  if (!destMod.projects) destMod.projects = [];
                  destMod.projects.push(item);
                  targetParentName = destMod.name;
                }
                type = 'project';
                currentSelection.type = 'project';
              }
              logActivity(item.id, item.name, `Reubicó proyecto de [${currentParentName}] hacia [${targetParentName}]`, localAuthor);
            }
          }

          // Módulos secundarios / dependencias multimódulo
          const checkedSec = Array.from(document.querySelectorAll('.editProjSecMod-chk:checked'))
            .map(cb => cb.value)
            .filter(v => v !== targetLoc);
          const oldSecStr = (item.secondaryModules || []).slice().sort().join(',');
          const newSecStr = checkedSec.slice().sort().join(',');
          item.secondaryModules = checkedSec;
          if (oldSecStr !== newSecStr) {
            logActivity(item.id, item.name, `Actualizó dependencias multimódulo`, localAuthor);
          }

          // Empresas destino
          const checkedComps = Array.from(document.querySelectorAll('.editProjComp-chk:checked'))
            .map(cb => cb.value.trim().toUpperCase());
          const oldComps = window.getProjectCompanies(item);
          const oldCompStr = oldComps.slice().sort().join(',');
          const newCompStr = checkedComps.slice().sort().join(',');
          item.companies = checkedComps;
          if (oldCompStr !== newCompStr) {
            logActivity(item.id, item.name, `Actualizó empresas destino a [${checkedComps.join(', ') || 'Sin empresa'}]`, localAuthor);
          }

          if (oldStatus !== item.status) logActivity(item.id, item.name, `Actualizó estado a [${item.status}]`, localAuthor);
          else if (oldProg !== item.progress) logActivity(item.id, item.name, `Actualizó avance a ${item.progress}%`, localAuthor);
          else logActivity(item.id, item.name, `Editó detalles internos`, localAuthor);
        }
      }
      window.saveData(true); 
      window.populateGlobalEditSelector(); 
      window.updateDatalist(); 
      window.renderMindMap(); 
      window.showInfoCard(type, id);
      window.showToast("Cambios guardados con éxito", false);
    }

    window.showInfoCard = function(type, id) {
      const card = document.getElementById('infoCard'); let item = null;
      document.getElementById('infoQuickEditContainer').classList.add('hidden'); document.getElementById('btnFullEditInfoCard').classList.add('hidden');
      document.getElementById('infoNotesContainer').classList.add('hidden');
      const modActions = document.getElementById('moduleActionsInfoCard');
      if (modActions) modActions.classList.add('hidden');
      card.dataset.notesSig = '';
      document.getElementById('infoRelativeTime').classList.add('hidden');
      document.getElementById('infoDriveBtn').classList.add('hidden');
      document.getElementById('infoInvgateBtn').classList.add('hidden');
      const modContainer = document.getElementById('infoModulesContainer');
      if (modContainer) {
        modContainer.innerHTML = '';
        modContainer.classList.add('hidden');
      }
      const compContainer = document.getElementById('infoCompaniesContainer');
      if (compContainer) {
        compContainer.innerHTML = '';
        compContainer.classList.add('hidden');
      }
      
      if (type === 'core') {
        item = appData.core;
        document.getElementById('infoType').textContent = 'NÚCLEO';
        const totalProjects = (appData.directProjects || []).length + (appData.modules || []).reduce((acc, m) => acc + (m.projects || []).length, 0);
        const leftLbl = document.getElementById('infoBoxLeftLabel'); if (leftLbl) leftLbl.textContent = 'MÓDULOS ACTIVOS';
        document.getElementById('infoConsultant').innerHTML = `<span class="text-white font-bold text-lg">${appData.modules.length}</span>`;
        document.getElementById('infoMetricLabel').textContent = 'PROYECTOS TOTALES';
        document.getElementById('infoMetricValue').innerHTML = `<span class="text-white font-bold text-lg">${totalProjects}</span>`;
      } else if (type === 'direct-hub' || type === 'module') {
        item = type === 'module' ? appData.modules.find(m => m.id === id) : appData.directHub;
        document.getElementById('infoType').textContent = type==='module'?'MÓDULO':'AGRUPADOR';
        const projs = type === 'module' ? (item.projects || []) : (appData.directProjects || []);
        const avgProg = projs.length > 0 ? Math.round(projs.reduce((acc, p) => acc + (p.progress || 0), 0) / projs.length) : 0;
        const leftLbl = document.getElementById('infoBoxLeftLabel'); if (leftLbl) leftLbl.textContent = 'PROYECTOS';
        document.getElementById('infoConsultant').innerHTML = `<span class="text-white font-bold text-lg">${projs.length}</span>`;
        document.getElementById('infoMetricLabel').textContent = 'AVANCE PROMEDIO';
        document.getElementById('infoMetricValue').innerHTML = `<span class="text-white font-bold text-lg">${avgProg}%</span>`;
        
        // Detección de proyectos dependientes / vinculados de otros módulos
        const modIdCheck = type === 'module' ? id : 'DIRECT';
        const sharedProjs = [];
        (appData.directProjects || []).forEach(p => {
          if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(modIdCheck) || (modIdCheck === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
            sharedProjs.push(p);
          }
        });
        (appData.modules || []).forEach(m => {
          (m.projects || []).forEach(p => {
            if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(modIdCheck) || (modIdCheck === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
              sharedProjs.push(p);
            }
          });
        });
        if (modContainer && sharedProjs.length > 0) {
          modContainer.innerHTML = `
            <div class="w-full text-[10px] text-blue-300 bg-[#0071e3]/10 border border-[#0071e3]/25 px-3 py-2 rounded-xl flex items-center justify-between shadow-inner">
              <span class="flex items-center gap-1.5 font-medium"><span>🔗</span> <b>${sharedProjs.length}</b> proyecto(s) vinculados como dependencia</span>
              <span class="text-[9px] text-[#0071e3] font-bold bg-[#0071e3]/20 px-2 py-0.5 rounded-full border border-[#0071e3]/30">Multimódulo</span>
            </div>
          `;
          modContainer.classList.remove('hidden');
        }

        if (type === 'module' && (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor')) {
          document.getElementById('btnFullEditInfoCard').classList.remove('hidden');
        }
        if (modActions && currentUserRole !== 'Lector') {
          modActions.classList.remove('hidden');
          const btnAdd = document.getElementById('btnAddProjectToModule');
          if (btnAdd) {
            const targetLocId = (type === 'module' && item) ? item.id : 'DIRECT';
            btnAdd.onclick = () => window.openCreateProjectForModule(targetLocId);
          }
        }
      } else {
        if (type === 'direct-project') item = appData.directProjects.find(p => p.id === id); else appData.modules.forEach(m => { const p = (m.projects||[]).find(proj => proj.id === id); if(p) item = p; }); if(!item) return;
        document.getElementById('infoType').textContent = 'PROYECTO';

        // Renderizado de Empresa(s) Destino (AFR, AVM, TEO, TNO, ZIN, GENERAL...)
        if (compContainer) {
          const comps = window.getProjectCompanies(item);
          if (comps.length > 0) {
            compContainer.innerHTML = '';
            compContainer.classList.remove('hidden');
            comps.forEach(c => {
              const st = window.getCompanyStyle ? window.getCompanyStyle(c) : { color: '#ff9f0a', bg: 'rgba(255,159,10,0.15)', border: 'rgba(255,159,10,0.3)', icon: '🏢' };
              const pill = document.createElement('span');
              pill.className = "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-sm border";
              pill.style.backgroundColor = st.bg;
              pill.style.borderColor = st.border;
              pill.style.color = st.color;
              pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]" style="background-color: ${st.color}"></span>${st.icon} ${escapeHtml(c)}`;
              compContainer.appendChild(pill);
            });
          }
        }

        // Renderizado de Módulos (Base y Secundarios)
        if (modContainer) {
          modContainer.innerHTML = '';
          modContainer.classList.remove('hidden');
          
          let primMod = null;
          let primType = 'module';
          if (type === 'direct-project') {
            primMod = appData.directHub || { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' };
            primType = 'direct-hub';
          } else {
            primMod = appData.modules.find(m => (m.projects || []).some(p => p.id === id));
            if (!primMod) {
              primMod = appData.directHub || { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' };
              primType = 'direct-hub';
            }
          }
          
          const pPill = document.createElement('button');
          pPill.type = 'button';
          pPill.className = "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl text-white bg-white/10 hover:bg-white/20 border border-white/15 transition shadow-sm";
          pPill.innerHTML = `<span class="w-2 h-2 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.4)]" style="background-color: ${primMod.color || '#0071e3'}"></span>📦 ${escapeHtml(primMod.name)} <span class="text-[8px] text-gray-400 font-normal uppercase tracking-wider">(Base)</span>`;
          pPill.onclick = () => window.selectNode(primType, primMod.id);
          modContainer.appendChild(pPill);

          const secList = Array.isArray(item.secondaryModules) ? item.secondaryModules : [];
          secList.forEach(sId => {
            let sMod = null, sType = 'module';
            if (sId === 'DIRECT' || sId === 'hub-direct') {
              sMod = appData.directHub || { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' };
              sType = 'direct-hub';
            } else {
              sMod = (appData.modules || []).find(m => m.id === sId);
            }
            if (sMod) {
              const sPill = document.createElement('button');
              sPill.type = 'button';
              sPill.className = "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xl text-blue-200 bg-[#0071e3]/15 hover:bg-[#0071e3]/25 border border-[#0071e3]/30 transition shadow-sm";
              sPill.title = "Módulo dependiente / vinculación cruzada";
              sPill.innerHTML = `<span class="w-2 h-2 rounded-full shadow-[0_0_4px_rgba(0,113,227,0.4)]" style="background-color: ${sMod.color || '#0071e3'}"></span>🔗 ${escapeHtml(sMod.name)}`;
              sPill.onclick = () => window.selectNode(sType, sMod.id);
              modContainer.appendChild(sPill);
            }
          });
        }

        const leftLbl = document.getElementById('infoBoxLeftLabel'); if (leftLbl) leftLbl.textContent = 'CONSULTOR(ES)';
        document.getElementById('infoConsultant').innerHTML = getProjectConsultants(item).map(n => `<div class="text-xs flex items-center gap-2"><span class="w-3 h-3 rounded-full border border-white/20 shadow-[0_0_5px_rgba(255,255,255,0.3)]" style="background-color: ${consultants[n]?consultants[n].color:'#8e8e93'}"></span> ${escapeHtml(n)}</div>`).join('') || 'Sin asignar';
        document.getElementById('infoMetricLabel').textContent = 'PRIORIDAD'; document.getElementById('infoMetricValue').innerHTML = `<span class="text-white font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/5">*${item.priority}</span>`;
        document.getElementById('infoQuickEditContainer').classList.remove('hidden'); 
        
        const btnDrive = document.getElementById('infoDriveBtn');
        const btnInvgate = document.getElementById('infoInvgateBtn');
        
        if(item.driveLink) {
            let formattedLink = item.driveLink;
            if(!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) formattedLink = 'https://' + formattedLink;
            btnDrive.href = formattedLink; btnDrive.classList.remove('hidden');
        } else btnDrive.classList.add('hidden');
        
        if(item.invgateLink) {
            let formattedLink = item.invgateLink;
            if(!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) formattedLink = 'https://' + formattedLink;
            btnInvgate.href = formattedLink; btnInvgate.classList.remove('hidden');
        } else btnInvgate.classList.add('hidden');

        const isLector = currentUserRole === 'Lector';
        const canEditProject = !isLector && (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor' || getProjectConsultants(item).includes(localAuthor));
        
        ['quickEditStatus', 'quickEditDeliveryDate', 'quickEditReturnDate', 'quickEditSlider'].forEach(id => {
            const el = document.getElementById(id); if(el) el.disabled = isLector;
        });
        
        // Fecha Límite solo editable por Supremo o Supervisor
        const isSuperOrSupremo = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
        const elDeadline = document.getElementById('quickEditDeadline');
        if (elDeadline) {
            elDeadline.disabled = !isSuperOrSupremo;
            if (!isSuperOrSupremo) {
                elDeadline.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                elDeadline.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
        
        const qTaskBlock = document.getElementById('quickTaskInputBlock');
        if(qTaskBlock) {
            if(isLector) qTaskBlock.classList.add('hidden'); else qTaskBlock.classList.remove('hidden');
        }

        const qLinksCont = document.getElementById('acc-links-details'); 
        if (qLinksCont) {
            // Regla de Seguridad: Solo Supremo y Supervisor pueden inyectar o modificar las URLs base
            if (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor') {
                qLinksCont.classList.remove('hidden');
                document.getElementById('quickEditDriveLink').value = item.driveLink || '';
                document.getElementById('quickEditInvgateLink').value = item.invgateLink || '';
            } else {
                qLinksCont.classList.add('hidden');
            }
        }

        if(currentUserRole === 'Supremo' || currentUserRole === 'Supervisor') document.getElementById('btnFullEditInfoCard').classList.remove('hidden');
        
        const assigneeSelect = document.getElementById('newQuickTaskAssignee');
        if (assigneeSelect) {
            assigneeSelect.innerHTML = '<option value="">👤 Asignar a...</option>';
            if (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor') {
                assigneeSelect.disabled = false;
                Object.keys(consultants).filter(k => consultants[k].role !== 'Lector').sort().forEach(c => {
                    assigneeSelect.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
                });
            } else {
                assigneeSelect.innerHTML += `<option value="${escapeHtml(localAuthor)}" selected>${escapeHtml(localAuthor)}</option>`;
                assigneeSelect.disabled = true;
            }
        }
        
        document.getElementById('quickEditStatus').value = item.status || 'Pendiente'; document.getElementById('quickEditDeadline').value = item.deadline || ''; 
        document.getElementById('quickEditDeliveryDate').value = item.clientDeliveryDate || ''; document.getElementById('quickEditReturnDate').value = item.clientReturnDate || ''; 
        
        if(item.deadline) {
            const rt = document.getElementById('infoRelativeTime'); rt.classList.remove('hidden');
            const [y,m,d] = item.deadline.split('-'); const dDate = new Date(y, m-1, d); const today = new Date(new Date().setHours(0,0,0,0));
            const diffTime = dDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if(item.status === 'Completado') { rt.className = "text-xs font-semibold px-4 py-2.5 rounded-xl mb-5 border flex items-center gap-2 bg-[#30d158]/10 text-[#30d158] border-[#30d158]/30 shadow-inner"; rt.innerHTML = "✅ Entregado"; }
            else if(diffDays < 0) { rt.className = "text-xs font-semibold px-4 py-2.5 rounded-xl mb-5 border flex items-center gap-2 bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/30 shadow-inner"; rt.innerHTML = `⚠️ Vencido hace ${Math.abs(diffDays)} días`; }
            else if(diffDays === 0) { rt.className = "text-xs font-semibold px-4 py-2.5 rounded-xl mb-5 border flex items-center gap-2 bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/30 shadow-inner"; rt.innerHTML = `⚠️ Vence HOY`; }
            else { rt.className = "text-xs font-semibold px-4 py-2.5 rounded-xl mb-5 border flex items-center gap-2 bg-white/5 text-gray-300 border-white/10 shadow-inner"; rt.innerHTML = `📅 Vence en ${diffDays} días`; }
        }

        window.renderTasksQuick(item);
        window.renderDocChecklists('quick', item.docs||{}); window.calculateQuickProgress(); document.getElementById('quickEditSlider').value = item.progress || 0;
        
        const notesCont = document.getElementById('infoNotesContainer');
        const notesText = document.getElementById('infoNotes');
        const hasNotes = item.notes && (typeof item.notes === 'string' ? item.notes.trim() : item.notes.length > 0);
        if (hasNotes || currentUserRole !== 'Lector') {
            notesCont.classList.remove('hidden');
            window.renderNotesHistory(item.notes, 'infoNotes');

            // Si hay notas no leídas para el usuario activo, expandir automáticamente el foro
            const hasUnreadForMe = Array.isArray(item.notes) && item.notes.some(n => {
                if (!localAuthor) return false;
                if (!Array.isArray(n.readBy)) return n.by !== localAuthor;
                return !n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
            });
            if (hasUnreadForMe) {
                const acc = document.getElementById('acc-notes-details');
                if (acc) acc.open = true;
            }
        } else {
            notesCont.classList.add('hidden');
        }
        // Un borrador escrito en un proyecto nunca debe aparecer en otro
        const noteInput = document.getElementById('infoNoteInput');
        if (noteInput && noteInput.dataset.pid !== String(id)) { 
            noteInput.value = ''; 
            noteInput.dataset.pid = String(id); 
            if (typeof window.setNoteTag === 'function') window.setNoteTag('comentario', 'info');
        }
      }
      document.getElementById('infoTitle').textContent = item.name; 
      document.body.classList.add('info-card-open');
      card.classList.remove('hidden'); 
      setTimeout(() => card.classList.remove('opacity-0'), 10);
    }
    window.editFromInfoCard = function() { window.closeInfoCardSafe(); if(currentSelection.id) window.selectNodeAndOpenConfig(currentSelection.type, currentSelection.id); }

    window.selectNode = function(type, id) {
      currentSelection = { type, id };
      const ges = document.getElementById('globalEditSelector');
      if (ges) ges.value = `${type}|${id}`;
      document.getElementById('editEmptyState').classList.add('hidden'); 
      document.getElementById('editFormArea').classList.remove('hidden');
      document.getElementById('editProjectFields').classList.add('hidden'); 
      document.getElementById('editModuleFields').classList.add('hidden');
      let item = null, isProject = false, isModule = false;
      const btnDel = document.getElementById('btnDeleteElement');
      
      if (type === 'core') { 
        item = appData.core; 
        document.getElementById('editTypeBadge').textContent = 'NÚCLEO'; 
        if(btnDel) btnDel.classList.add('hidden'); 
      } else if (type === 'direct-hub') { 
        item = appData.directHub; 
        isModule = true; 
        document.getElementById('editTypeBadge').textContent = 'AGRUPADOR'; 
        if(btnDel) btnDel.classList.add('hidden'); 
      } else if (type === 'module') { 
        item = appData.modules.find(m => m.id === id); 
        isModule = true; 
        document.getElementById('editTypeBadge').textContent = 'MÓDULO'; 
        if(btnDel && currentUserRole === 'Supremo') btnDel.classList.remove('hidden'); 
      } else if (type === 'direct-project') { 
        item = appData.directProjects.find(p => p.id === id); 
        isProject = true; 
        document.getElementById('editTypeBadge').textContent = 'PROYECTO'; 
        if(btnDel && currentUserRole === 'Supremo') btnDel.classList.remove('hidden'); 
      } else if (type === 'project') { 
        appData.modules.forEach(m => { 
          const p = (m.projects || []).find(proj => proj.id === id); 
          if (p) item = p; 
        }); 
        isProject = true; 
        document.getElementById('editTypeBadge').textContent = 'PROYECTO'; 
        if(btnDel && currentUserRole === 'Supremo') btnDel.classList.remove('hidden'); 
      }
      if (!item) return; 
      document.getElementById('editName').value = item.name;
      if (isProject) {
        document.getElementById('editProjectFields').classList.remove('hidden'); 
        document.getElementById('editPriority').value = item.priority; 
        document.getElementById('editNotes').value = ''; 
        document.getElementById('editStatus').value = item.status || 'Pendiente';
        window.renderNotesHistory(item.notes, 'editNotesHistory'); 
        if (typeof window.setNoteTag === 'function') window.setNoteTag('comentario', 'edit');
        document.getElementById('editDeadline').value = item.deadline || '';
        document.getElementById('editDriveLink').value = item.driveLink || '';
        document.getElementById('editInvgateLink').value = item.invgateLink || '';
        
        // Reubicación de proyecto
        let currentLoc = 'DIRECT';
        if (type === 'project') {
          const pMod = appData.modules.find(m => (m.projects || []).some(p => p.id === id));
          if (pMod) currentLoc = pMod.id;
        }
        if (typeof window.populateEditProjectLocationSelect === 'function') {
          window.populateEditProjectLocationSelect(currentLoc);
        }
        if (typeof window.populateSecondaryModulesChecklist === 'function') {
          window.populateSecondaryModulesChecklist('editProj', currentLoc, item.secondaryModules || []);
        }
        if (typeof window.populateCompanyChecklist === 'function') {
          window.populateCompanyChecklist('editProj', window.getProjectCompanies(item));
        }

        // Botones Abrir Drive e Invgate en vivo
        const updateEditLinkButtons = () => {
          const dVal = (document.getElementById('editDriveLink')?.value || '').trim();
          const btnD = document.getElementById('btnOpenEditDrive');
          if (btnD) {
            if (dVal) {
              btnD.href = (!dVal.startsWith('http://') && !dVal.startsWith('https://')) ? 'https://' + dVal : dVal;
              btnD.classList.remove('hidden');
            } else {
              btnD.classList.add('hidden');
            }
          }
          const iVal = (document.getElementById('editInvgateLink')?.value || '').trim();
          const btnI = document.getElementById('btnOpenEditInvgate');
          if (btnI) {
            if (iVal) {
              btnI.href = (!iVal.startsWith('http://') && !iVal.startsWith('https://')) ? 'https://' + iVal : iVal;
              btnI.classList.remove('hidden');
            } else {
              btnI.classList.add('hidden');
            }
          }
        };
        updateEditLinkButtons();
        document.getElementById('editDriveLink').oninput = updateEditLinkButtons;
        document.getElementById('editInvgateLink').oninput = updateEditLinkButtons;

        document.getElementById('editDeliveryDate').value = item.clientDeliveryDate || ''; 
        document.getElementById('editReturnDate').value = item.clientReturnDate || ''; 
        window.renderDocChecklists('edit', item.docs || {}); 
        window.calculateEditProgress(); 
        document.getElementById('editSlider').value = item.progress || 0;
        const consultNames = getProjectConsultants(item); 
        document.querySelectorAll('.editProjCons-chk').forEach(chk => chk.checked = consultNames.includes(chk.value));
      }
      if (isModule) { 
        document.getElementById('editModuleFields').classList.remove('hidden'); 
        document.getElementById('editModuleColor').value = item.color || '#0071e3'; 
        document.getElementById('editModuleColorHex').value = item.color || '#0071e3'; 
        document.getElementById('editModuleColor').onchange = function() { 
          document.getElementById('editModuleColorHex').value = this.value; 
        }; 

        // Resumen analítico del módulo
        const sumCont = document.getElementById('editModuleSummary');
        if (sumCont) {
          const projs = (type === 'module' ? (item.projects || []) : (appData.directProjects || []));
          const total = projs.length;
          const comp = projs.filter(p => p.status === 'Completado').length;
          const inProg = projs.filter(p => p.status === 'En Progreso').length;
          const pend = projs.filter(p => p.status === 'Pendiente' || p.status === 'No Iniciado').length;
          const avgProg = total > 0 ? Math.round(projs.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;
          const assignedCons = Array.from(new Set(projs.flatMap(p => getProjectConsultants(p))));

          // Conteo de proyectos vinculados de otros módulos
          const mCheckId = type === 'module' ? item.id : 'DIRECT';
          let sharedCount = 0;
          (appData.directProjects || []).forEach(p => {
            if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(mCheckId) || (mCheckId === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
              sharedCount++;
            }
          });
          (appData.modules || []).forEach(m => {
            (m.projects || []).forEach(p => {
              if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(mCheckId) || (mCheckId === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
                sharedCount++;
              }
            });
          });

          sumCont.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-white/10 font-bold">
              <span class="text-white text-xs">${type === 'module' ? 'Módulo' : 'Agrupador'}: ${escapeHtml(item.name)}</span>
              <span class="text-brand-accent text-xs">${avgProg}% Avance</span>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-2 text-[10px]">
              <div>📁 Propios: <b class="text-white">${total}</b></div>
              <div>🔗 Vinculados: <b class="text-[#0071e3]">${sharedCount}</b></div>
              <div>✅ Completados: <b class="text-[#30d158]">${comp}</b></div>
              <div>🚀 En Curso: <b class="text-[#0071e3]">${inProg}</b></div>
            </div>
            <div class="pt-2 text-[10px] text-gray-400 border-t border-white/5 truncate">
              👥 Consultores (${assignedCons.length}): <span class="text-gray-200">${escapeHtml(assignedCons.join(', ')) || 'Ninguno'}</span>
            </div>
          `;
        }
      }
      window.showInfoCard(type, id);
      
      setTimeout(() => {
          if (item && item._renderData) {
              window.focusNode(item._renderData.x, item._renderData.y);
          } else if (type === 'core') {
              window.focusNode(0, 0);
          } else if (type === 'direct-hub' && appData.directHub && appData.directHub._renderData) {
              window.focusNode(appData.directHub._renderData.x, appData.directHub._renderData.y);
          }
      }, 50);
    }
    window.selectNodeAndOpenConfig = function(type, id) { if(window.innerWidth < 768) window.closePriorityDrawer(); window.openConfigDrawer(); window.switchTab('edit'); document.getElementById('globalEditSelector').value = `${type}|${id}`; window.selectNode(type, id); }
    window.handleGlobalEditSelectionChange = function() { const v = document.getElementById('globalEditSelector').value; if(!v) { currentSelection={type:null,id:null}; document.getElementById('editFormArea').classList.add('hidden'); document.getElementById('editEmptyState').classList.remove('hidden'); return;} window.selectNode(...v.split('|')); }

    window.requestDeleteCurrentSelection = function() { if(!currentSelection.id || currentSelection.type === 'core' || currentSelection.type === 'direct-hub') return; itemToDelete = { category: 'element', id: currentSelection.id }; document.getElementById('deleteConfirmModal').classList.remove('hidden'); setTimeout(() => document.getElementById('deleteConfirmModal').classList.remove('opacity-0'), 10); }
    window.closeDeleteModal = function() { document.getElementById('deleteConfirmModal').classList.add('opacity-0'); setTimeout(() => { document.getElementById('deleteConfirmModal').classList.add('hidden'); itemToDelete = {category:null, id:null}; }, 400); }
    window.confirmDeleteSelection = function() { if (currentUserRole === 'Lector') return;
       if (itemToDelete.category === 'element') { 
           const { type, id } = currentSelection; 
           let pName = "";
           if (type === 'module') {
               const mod = appData.modules.find(m => m.id === id);
               if(mod) pName = mod.name;
               appData.modules = appData.modules.filter(m => m.id !== id);
               (appData.directProjects || []).forEach(p => {
                   if (Array.isArray(p.secondaryModules)) p.secondaryModules = p.secondaryModules.filter(mId => mId !== id);
               });
               (appData.modules || []).forEach(m => {
                   (m.projects || []).forEach(p => {
                       if (Array.isArray(p.secondaryModules)) p.secondaryModules = p.secondaryModules.filter(mId => mId !== id);
                   });
               });
           }
           else if (type === 'direct-project') {
               const proj = appData.directProjects.find(p => p.id === id);
               if(proj) pName = proj.name;
               appData.directProjects = appData.directProjects.filter(p => p.id !== id); 
           }
           else if (type === 'project') {
               appData.modules.forEach(m => { 
                   const proj = (m.projects || []).find(p => p.id === id);
                   if(proj) pName = proj.name;
                   if(m.projects) m.projects = m.projects.filter(p => p.id !== id); 
               }); 
           }
           if (pName) logActivity(id, pName, 'Eliminó el elemento permanentemente', localAuthor);
           currentSelection = { type: null, id: null }; document.getElementById('globalEditSelector').value = ""; window.saveData(true); window.handleGlobalEditSelectionChange(); window.populateGlobalEditSelector(); window.closeInfoCardSafe(); window.renderMindMap(); 
       } 
       else if(itemToDelete.category === 'consultant') { const name = itemToDelete.id; appData.directProjects.forEach(p => { p.consultants = p.consultants.filter(c => c !== name); }); appData.modules.forEach(m => { (m.projects || []).forEach(p => { p.consultants = p.consultants.filter(c => c !== name); }); }); delete consultants[name]; if (activeFilterConsultant === name) activeFilterConsultant = 'ALL'; activeFilterConsultants = activeFilterConsultants.filter(c => c !== name); if (activeFilterConsultants.length === 0) activeFilterConsultants = ['ALL']; if (localAuthor === name) { localAuthor = ''; localStorage.removeItem('sicom_author'); location.reload(); } window.saveData(true); window.populateConsultantSelects(); window.renderRegisteredConsultantsList(); if(isDrawerOpen && currentSelection.id) window.handleGlobalEditSelectionChange(); window.renderMindMap(); }
       window.closeDeleteModal(); window.updateDatalist();
    }

    window.openRenameModal = function(oldName) { document.getElementById('renameOldName').value = oldName; document.getElementById('renameNewName').value = oldName; document.getElementById('renameModal').classList.remove('hidden'); setTimeout(() => document.getElementById('renameModal').classList.remove('opacity-0'), 10); }
    window.closeRenameModal = function() { document.getElementById('renameModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('renameModal').classList.add('hidden'), 400); }
    window.confirmRenameConsultant = function() { if (currentUserRole === 'Lector') return;
        const oldName = document.getElementById('renameOldName').value; const newName = document.getElementById('renameNewName').value.trim();
        if (!newName || newName === oldName || consultants[newName]) { window.closeRenameModal(); return; }
        consultants[newName] = consultants[oldName]; delete consultants[oldName];
        appData.directProjects.forEach(p => { let idx = p.consultants.indexOf(oldName); if (idx !== -1) p.consultants[idx] = newName; }); appData.modules.forEach(m => { (m.projects || []).forEach(p => { let idx = p.consultants.indexOf(oldName); if (idx !== -1) p.consultants[idx] = newName; }); });
        if (activeFilterConsultant === oldName) activeFilterConsultant = newName; activeFilterConsultants = activeFilterConsultants.map(c => c === oldName ? newName : c); if (localAuthor === oldName) { localAuthor = newName; localStorage.setItem('sicom_author', newName); }
        window.saveData(false); window.populateConsultantSelects(); window.renderRegisteredConsultantsList(); if(isDrawerOpen && currentSelection.id) window.handleGlobalEditSelectionChange(); window.renderMindMap(); window.closeRenameModal();
    }

    window.openPasswordModal = function(name) {
        document.getElementById('passConsultantName').textContent = name;
        document.getElementById('passConsultantId').value = name;
        document.getElementById('passNewValue').value = consultants[name].password || '';
        const modal = document.getElementById('passwordModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
    window.closePasswordModal = function() {
        const modal = document.getElementById('passwordModal');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 400);
    }
    window.confirmPasswordChange = function() { if (currentUserRole === 'Lector') return;
        const name = document.getElementById('passConsultantId').value;
        const newPass = document.getElementById('passNewValue').value.trim();
        if (newPass) {
            consultants[name].password = newPass;
        } else {
            delete consultants[name].password; // Vuelve a la default
        }
        window.saveData(false);
        window.showToast("Contraseña actualizada", false);
        window.closePasswordModal();
    }

    window.createNewProject = function() { 
      if (currentUserRole === 'Lector') return;
      const name = document.getElementById('newProjName').value.trim(); 
      if (!name) { 
        window.showToast("⚠️ Ingresa un nombre para el proyecto", true); 
        return; 
      }
      const loc = document.getElementById('newProjLocation').value;
      const secMods = Array.from(document.querySelectorAll('.newProjSecMod-chk:checked')).map(cb => cb.value).filter(v => v !== loc);
      const comps = Array.from(document.querySelectorAll('.newProjComp-chk:checked')).map(cb => cb.value.trim().toUpperCase());
      const prio = parseFloat(document.getElementById('newProjPriority').value || 1);
      const cons = Array.from(document.querySelectorAll('.newProjCons-chk:checked')).map(cb => cb.value);
      const driveLink = document.getElementById('newProjDrive').value.trim();
      const invgateLink = document.getElementById('newProjInvgate').value.trim();
      const deadline = document.getElementById('newProjDeadline')?.value || '';
      const status = document.getElementById('newProjStatus')?.value || 'No Iniciado';
      const progress = (status === 'Completado') ? 100 : 0;

      const np = { 
        id: 'p_' + Date.now(), 
        name, 
        priority: prio, 
        consultants: cons, 
        notes: '', 
        driveLink, 
        invgateLink, 
        tasks: [], 
        status, 
        deadline, 
        progress, 
        docs: {}, 
        clientDeliveryDate: "", 
        clientReturnDate: "",
        secondaryModules: secMods,
        companies: comps
      };

      if (loc === 'DIRECT') {
        if (!appData.directProjects) appData.directProjects = [];
        appData.directProjects.push(np);
      } else { 
        const mod = appData.modules.find(m => m.id === loc); 
        if (mod) { 
          if (!mod.projects) mod.projects = []; 
          mod.projects.push(np); 
        } else {
          console.error("Módulo destino no encontrado:", loc);
          window.showToast("⚠️ Error: No se encontró el módulo seleccionado", true);
          return;
        }
      }

      document.getElementById('newProjName').value = ''; 
      document.getElementById('newProjDrive').value = ''; 
      document.getElementById('newProjInvgate').value = ''; 
      if (document.getElementById('newProjDeadline')) document.getElementById('newProjDeadline').value = '';
      if (document.getElementById('newProjStatus')) document.getElementById('newProjStatus').value = 'No Iniciado';
      if (document.getElementById('newProjPriority')) document.getElementById('newProjPriority').value = '1';
      document.querySelectorAll('.newProjCons-chk').forEach(cb => cb.checked = false); 
      document.querySelectorAll('.newProjSecMod-chk').forEach(cb => cb.checked = false);
      document.querySelectorAll('.newProjComp-chk').forEach(cb => cb.checked = false);
      if (typeof window.populateCompanyChecklist === 'function') window.populateCompanyChecklist('newProj', []);

      const secCountMsg = secMods.length > 0 ? ` (+ ${secMods.length} dependencias multimódulo)` : '';
      const compMsg = comps.length > 0 ? ` [Empresas: ${comps.join(', ')}]` : '';
      logActivity(np.id, np.name, `Creó el proyecto [Estado: ${status}]${compMsg}${secCountMsg}`, localAuthor); 

      // Alerta a Google Chat de nuevo proyecto (con blindaje contra fallos)
      try {
        const baseModName = loc === 'DIRECT' ? (appData.directHub?.name || 'Proyectos Directos') : ((appData.modules.find(m => m.id === loc) || {}).name || 'Módulo');
        const secNames = secMods.map(smId => {
          if (smId === 'DIRECT' || smId === 'hub-direct') return (appData.directHub?.name || 'Directos');
          const sm = (appData.modules || []).find(m => m.id === smId);
          return sm ? sm.name : smId;
        });
        const modDisplayName = secNames.length > 0 ? `${baseModName} (+ ${secNames.join(', ')})` : baseModName;
        window.sendExternalAlert('PROJECT_CREATED', {
          project: np.name,
          module: modDisplayName,
          consultants: (Array.isArray(cons) ? cons.join(', ') : '') || 'Sin asignar',
          deadline: deadline || 'Sin fecha',
          author: localAuthor
        });
      } catch (errAlert) {
        console.warn("No se pudo enviar alerta de nuevo proyecto:", errAlert);
      }

      window.saveData(true); 
      window.populateGlobalEditSelector(); 
      window.updateDatalist(); 
      window.renderMindMap();
      window.showToast(`Proyecto "${name}" creado exitosamente`, false);

      const createdType = (loc === 'DIRECT') ? 'direct-project' : 'project';
      setTimeout(() => {
        window.selectNode(createdType, np.id);
      }, 100);
    }

    window.createNewModule = function() { 
      if (currentUserRole !== 'Supremo') {
        window.showToast("⚠️ Solo el Administrador Supremo puede crear módulos", true);
        return;
      }
      const name = document.getElementById('newModName').value.trim(); 
      if (!name) { 
        window.showToast("⚠️ Ingresa un nombre para el módulo", true); 
        return; 
      }
      const newId = 'm_' + Date.now(); 
      const color = document.getElementById('newModColor').value;
      appData.modules.push({ id: newId, name, color, projects: [] }); 
      document.getElementById('newModName').value = ''; 
      logActivity(newId, name, 'Creó el módulo', localAuthor); 
      window.saveData(true); 
      window.populateGlobalEditSelector(); 
      window.populateNewProjectLocationSelect(newId); 
      if (typeof window.populateEditProjectLocationSelect === 'function') {
        window.populateEditProjectLocationSelect();
      }
      window.updateDatalist(); 
      window.renderMindMap(); 
      window.showToast(`Módulo "${name}" creado exitosamente`, false);

      setTimeout(() => {
        window.selectNode('module', newId);
      }, 100);
    }

    window.registerConsultant = function() { 
        if (currentUserRole === 'Lector') return; 
        const n = document.getElementById('newConsultantName').value.trim();
        const c = document.getElementById('newConsultantColor').value; 
        const r = document.getElementById('newConsultantRole').value; 
        if (!n || consultants[n]) return; 
        consultants[n] = { color: c, role: r }; 
        document.getElementById('newConsultantName').value = ''; 
        window.saveData(false); 
        window.populateConsultantSelects(); 
        window.renderRegisteredConsultantsList(); 
        window.renderMindMap(); 
        window.showToast(`Consultor "${n}" registrado con éxito`, false);
    };

    window.handleUpdateExistingConsultantColor = function(name, newColor) { 
        if(consultants[name]) { 
            consultants[name].color = newColor; 
            window.saveData(false); 
            window.renderRegisteredConsultantsList(); 
            window.renderMindMap(); 
            if(currentSelection && currentSelection.id) window.showInfoCard(currentSelection.type, currentSelection.id); 
        } 
    };

    window.updateConsultantRole = function(name, newRole) { 
        if(consultants[name]) { 
            consultants[name].role = newRole; 
            window.saveData(false); 
            window.showToast(`Rol de ${name} actualizado a ${newRole}`, false);
        } 
    };

    window.requestDeleteConsultant = function(name) { 
        itemToDelete = { category: 'consultant', id: name }; 
        document.getElementById('deleteModalTitle').textContent = `¿Eliminar a ${name}?`; 
        document.getElementById('deleteConfirmModal').classList.remove('hidden'); 
        setTimeout(() => document.getElementById('deleteConfirmModal').classList.remove('opacity-0'), 10); 
    };

    window.populateGlobalEditSelector = function() {
      const s = document.getElementById('globalEditSelector'); 
      if (!s) return;
      s.innerHTML = `<option value="" class="bg-black text-gray-400">-- Selecciona en el mapa --</option><optgroup label="Núcleo" class="text-white bg-white/10"><option value="core|sicom" class="bg-black text-white">🌐 SICOM</option><option value="direct-hub|hub-direct" class="bg-black text-white">⚡ ${escapeHtml(appData.directHub ? appData.directHub.name : 'PROYECTOS DIRECTOS SICOM')}</option></optgroup>`;
      if (appData.directProjects && appData.directProjects.length > 0) {
        s.innerHTML += `<optgroup label="Directos" class="bg-black text-gray-300">${appData.directProjects.map(p => `<option value="direct-project|${p.id}" class="bg-black text-white">└ ${escapeHtml(p.name)}</option>`).join('')}</optgroup>`;
      }
      if (appData.modules) {
        appData.modules.forEach(m => { 
          s.innerHTML += `<option value="module|${m.id}" class="bg-white/10 text-white font-bold">📦 ${escapeHtml(m.name)}</option>`; 
          if (m.projects && m.projects.length > 0) {
            s.innerHTML += `<optgroup label="Proyectos: ${escapeHtml(m.name)}" class="bg-black text-gray-400">${m.projects.map(p => `<option value="project|${p.id}" class="bg-black text-white">└ ${escapeHtml(p.name)}</option>`).join('')}</optgroup>`;
          }
        });
      }
      if (currentSelection && currentSelection.id) {
        s.value = `${currentSelection.type}|${currentSelection.id}`;
      }
    };

    window.populateSecondaryModulesChecklist = function(prefix, primaryModId, selectedIds = []) {
      const container = document.getElementById(`${prefix}SecondaryModulesList`);
      if (!container) return;
      const selSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);
      
      const options = [];
      const directId = 'DIRECT';
      if (primaryModId !== directId) {
        options.push({
          id: directId,
          name: appData.directHub ? appData.directHub.name : 'PROYECTOS DIRECTOS SICOM',
          color: (appData.directHub && appData.directHub.color) ? appData.directHub.color : '#f59e0b',
          icon: '⚡'
        });
      }
      
      (appData.modules || []).forEach(m => {
        if (m && m.id && m.id !== primaryModId) {
          options.push({
            id: m.id,
            name: m.name || 'Módulo',
            color: m.color || '#0071e3',
            icon: '📦'
          });
        }
      });

      if (options.length === 0) {
        container.innerHTML = '<div class="text-[11px] text-gray-500 italic py-2 px-1">No hay otros módulos disponibles para vincular.</div>';
        return;
      }

      container.innerHTML = options.map(opt => {
        const isChecked = selSet.has(opt.id) || (opt.id === 'DIRECT' && selSet.has('hub-direct'));
        return `
          <label class="flex items-center gap-2.5 text-xs font-medium text-gray-300 cursor-pointer p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition select-none">
            <input type="checkbox" value="${escapeHtml(opt.id)}" class="${prefix}SecMod-chk rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4" ${isChecked ? 'checked' : ''}>
            <span class="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-[0_0_5px_rgba(255,255,255,0.2)]" style="background-color: ${opt.color}"></span>
            <span class="truncate text-white/90">${opt.icon} ${escapeHtml(opt.name)}</span>
          </label>
        `;
      }).join('');
    };

    window.populateCompanyChecklist = function(prefix, selectedCompanies = []) {
      const container = document.getElementById(`${prefix}CompaniesList`);
      if (!container) return;
      const selSet = new Set((Array.isArray(selectedCompanies) ? selectedCompanies : []).map(c => String(c).trim().toUpperCase()));
      
      const allComps = window.getAllKnownCompanies ? window.getAllKnownCompanies() : ['AFR', 'AVM', 'TEO', 'TNO', 'ZIN', 'GENERAL'];
      selSet.forEach(c => {
        if (c && !allComps.includes(c)) allComps.push(c);
      });

      container.innerHTML = allComps.map(comp => {
        const isChecked = selSet.has(comp);
        const style = window.getCompanyStyle ? window.getCompanyStyle(comp) : { color: '#0071e3', bg: 'rgba(0,113,227,0.15)' };
        return `
          <label class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer transition select-none border shadow-sm ${isChecked ? 'ring-1 ring-white/20' : 'opacity-70 hover:opacity-100'}"
                 style="background-color: ${isChecked ? style.bg : 'rgba(255,255,255,0.04)'};
                        border-color: ${isChecked ? style.color : 'rgba(255,255,255,0.1)'};
                        color: ${isChecked ? '#ffffff' : '#94a3b8'};">
            <input type="checkbox" value="${escapeHtml(comp)}" class="${prefix}Comp-chk sr-only" ${isChecked ? 'checked' : ''} onchange="window.handleCompanyCheckboxChange('${prefix}')">
            <span class="w-2 h-2 rounded-full shrink-0 shadow-[0_0_5px_rgba(255,255,255,0.3)]" style="background-color: ${style.color}"></span>
            <span>${escapeHtml(comp)}</span>
            ${isChecked ? `<svg class="w-3.5 h-3.5 text-white ml-0.5" fill="none" stroke="${style.color}" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ''}
          </label>
        `;
      }).join('');
    };

    window.handleCompanyCheckboxChange = function(prefix) {
      const checked = Array.from(document.querySelectorAll(`.${prefix}Comp-chk:checked`)).map(cb => cb.value.trim().toUpperCase());
      window.populateCompanyChecklist(prefix, checked);
    };

    window.addCustomCompany = function(prefix) {
      const input = document.getElementById(`${prefix}CustomComp`);
      if (!input) return;
      const val = input.value.trim().toUpperCase();
      if (!val) {
        window.showToast("⚠️ Ingresa el nombre de la empresa", true);
        return;
      }
      input.value = '';
      const currentChecked = Array.from(document.querySelectorAll(`.${prefix}Comp-chk:checked`)).map(cb => cb.value.trim().toUpperCase());
      if (!currentChecked.includes(val)) currentChecked.push(val);
      window.populateCompanyChecklist(prefix, currentChecked);
    };

    window.populateEditProjectLocationSelect = function(currentLoc) { 
      const s = document.getElementById('editProjectLocation'); 
      if (!s) return; 
      s.innerHTML = `<option value="DIRECT" class="bg-black text-white">⚡ Directo (${escapeHtml(appData.directHub ? appData.directHub.name : 'PROYECTOS DIRECTOS SICOM')})</option>` + (appData.modules || []).map(m => `<option value="${m.id}" class="bg-black text-white">📦 Módulo: ${escapeHtml(m.name)}</option>`).join(''); 
      if (currentLoc) s.value = currentLoc;
      if (!s._hasSecModListener) {
        s._hasSecModListener = true;
        s.addEventListener('change', function() {
          const checked = Array.from(document.querySelectorAll('.editProjSecMod-chk:checked')).map(cb => cb.value);
          window.populateSecondaryModulesChecklist('editProj', this.value, checked);
        });
      }
    };
    
    window.populateNewProjectLocationSelect = function(preselectedId) { 
      const s = document.getElementById('newProjLocation'); 
      if (!s) return; 
      const prevVal = preselectedId || s.value;
      s.innerHTML = `<option value="DIRECT" class="bg-black text-white">⚡ Directo (${escapeHtml(appData.directHub ? appData.directHub.name : 'PROYECTOS DIRECTOS SICOM')})</option>` + (appData.modules || []).map(m => `<option value="${m.id}" class="bg-black text-white">📦 Módulo: ${escapeHtml(m.name)}</option>`).join(''); 
      if (prevVal && Array.from(s.options).some(o => o.value === prevVal)) {
        s.value = prevVal;
      }
      if (!s._hasSecModListener) {
        s._hasSecModListener = true;
        s.addEventListener('change', function() {
          const checked = Array.from(document.querySelectorAll('.newProjSecMod-chk:checked')).map(cb => cb.value);
          window.populateSecondaryModulesChecklist('newProj', this.value, checked);
        });
      }
      const checked = Array.from(document.querySelectorAll('.newProjSecMod-chk:checked')).map(cb => cb.value);
      window.populateSecondaryModulesChecklist('newProj', s.value, checked);
      const checkedComps = Array.from(document.querySelectorAll('.newProjComp-chk:checked')).map(cb => cb.value);
      window.populateCompanyChecklist('newProj', checkedComps);
    };

    window.openCreateProjectForModule = function(moduleId) {
      if (currentUserRole === 'Lector') return;
      window.closeInfoCardSafe();
      window.openConfigDrawer();
      window.switchTab('new');
      window.setCreateType('project');
      window.populateNewProjectLocationSelect(moduleId);
      setTimeout(() => {
        const inp = document.getElementById('newProjName');
        if (inp) inp.focus();
      }, 350);
    };
    window.populateConsultantSelects = function() {
      const f = document.getElementById('consultantFilter'), all = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector');
      if(f) f.innerHTML = `<option value="ALL" class="bg-black text-white">👥 Todos</option>` + all.map(n => `<option value="${escapeHtml(n)}" class="bg-black text-white">${escapeHtml(n)}</option>`).join('');
      const mkChk = (pr) => all.map(n => `<label class="flex items-center gap-3 text-xs font-medium text-gray-300 cursor-pointer p-2.5 hover:bg-white/10 rounded-xl transition border border-transparent hover:border-white/10"><input type="checkbox" value="${escapeHtml(n)}" class="${pr}-chk rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4"><span class="w-3.5 h-3.5 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.3)] border border-white/20" style="background-color: ${consultants[n].color}"></span>${escapeHtml(n)}</label>`).join('');
      document.getElementById('editConsultantsChecks').innerHTML = mkChk('editProjCons'); document.getElementById('newProjConsultantsChecks').innerHTML = mkChk('newProjCons');
    }
    window.renderRegisteredConsultantsList = function() {
      const all = Object.keys(consultants); document.getElementById('consultantsCountBadge').textContent = all.length;
      document.getElementById('registeredConsultantsList').innerHTML = all.map(n => {
        let cnt = 0; (appData.directProjects||[]).forEach(p=>{if(getProjectConsultants(p).includes(n))cnt++;}); appData.modules.forEach(m=>{(m.projects||[]).forEach(p=>{if(getProjectConsultants(p).includes(n))cnt++;});});
        const cData = consultants[n];
        return `<div class="flex flex-col w-full p-4 bg-black/40 rounded-2xl border border-white/10 mb-3 shadow-inner group">
                   <div class="flex items-center justify-between gap-3 mb-2">
                       <div class="w-10 h-10 rounded-xl overflow-hidden border border-white/20 relative shrink-0">
                          <input type="color" value="${cData.color}" onchange="handleUpdateExistingConsultantColor('${jsArg(n)}', this.value)" class="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0">
                       </div>
                       <div class="flex-1 min-w-0"><span class="text-sm text-white font-bold block truncate">${escapeHtml(n)}</span><span class="text-[10px] text-gray-500 font-medium tracking-widest block mt-0.5">${cnt} proyectos</span></div>
                       <button onclick="openPasswordModal('${jsArg(n)}')" class="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition shrink-0" title="Cambiar Contraseña"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></button>
                       <button onclick="openRenameModal('${jsArg(n)}')" class="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition shrink-0" title="Renombrar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                       <button onclick="requestDeleteConsultant('${jsArg(n)}')" class="p-2 hover:bg-[#ff453a]/20 text-gray-400 hover:text-[#ff453a] rounded-xl transition shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                   </div>
                   <div class="flex items-center gap-2 border-t border-white/5 pt-2 mt-1">
                       <span class="text-[9px] text-gray-500 uppercase tracking-widest">Rol asignado:</span>
                       <select onchange="updateConsultantRole('${jsArg(n)}', this.value)" class="bg-transparent text-[10px] text-gray-300 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer">
                           <option value="Consultor" ${cData.role==='Consultor'?'selected':''}>Consultor</option>
                           <option value="Supervisor" ${cData.role==='Supervisor'?'selected':''}>Supervisor</option>
                           <option value="Supremo" ${cData.role==='Supremo'?'selected':''}>Supremo</option>
                           <option value="Lector" ${cData.role==='Lector'?'selected':''}>Lector</option>
                       </select>
                   </div>
                </div>`}).join('');
    }

    window.registerGlobalDocument = function() { const n = document.getElementById('newDocName').value.trim(); if(!n) return; globalDocs.push({ id: 'doc_'+Date.now(), name: n }); document.getElementById('newDocName').value = ''; window.saveData(false); window.renderRegisteredDocsList(); }
    window.renderRegisteredDocsList = function() {
        document.getElementById('registeredDocsList').innerHTML = globalDocs.map((d, i) => `<div class="flex items-center p-3 bg-black/40 rounded-2xl border border-white/10 gap-2 mb-2 shadow-inner"><div class="flex flex-col gap-1 shrink-0"><button onclick="moveDoc(${i}, -1)" class="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded p-0.5 text-[9px] transition">&uarr;</button><button onclick="moveDoc(${i}, 1)" class="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded p-0.5 text-[9px] transition">&darr;</button></div><span class="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded-md shrink-0 border border-white/5">${i+1}</span><input type="text" value="${escapeHtml(d.name)}" onchange="globalDocs[${i}].name=this.value; saveData(false);" class="bg-transparent border border-transparent hover:border-white/20 focus:border-white/40 rounded-lg text-xs text-white font-medium w-full p-2 focus:outline-none transition"><button onclick="deleteDoc('${d.id}')" class="p-2 hover:bg-[#ff453a]/20 text-gray-500 hover:text-[#ff453a] rounded-lg transition shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>`).join('');
    }
    window.moveDoc = function(idx, dir) { if(idx+dir < 0 || idx+dir >= globalDocs.length) return; const t = globalDocs[idx]; globalDocs[idx] = globalDocs[idx+dir]; globalDocs[idx+dir] = t; window.saveData(false); window.renderRegisteredDocsList(); }
    window.deleteDoc = function(id) { globalDocs = globalDocs.filter(d => d.id !== id); window.saveData(false); window.renderRegisteredDocsList(); }

    window.renderPriorityDrawer = function() {
        const c = document.getElementById('priorityListContainer'); if(!c) return;
        const all = (!activeFilterConsultants.includes('ALL') && activeFilterConsultants.length > 0) ? activeFilterConsultants : Object.keys(consultants);
        let has = false; let h = '';
        const statusMatches = (p) => (activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0 || activeFilterStatuses.includes(p.status));
        const companyMatches = (p) => (activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0 || window.getProjectCompanies(p).some(comp => activeFilterCompanies.includes(comp)));
        all.forEach(cons => {
            const cData = consultants[cons]; if (!cData) return; let projs = [];
            appData.directProjects.forEach(p => { if(getProjectConsultants(p).includes(cons) && statusMatches(p) && companyMatches(p)) projs.push({...p, parentName: appData.directHub.name, pType: 'direct-project'}); });
            appData.modules.forEach(m => { (m.projects||[]).forEach(p => { if(getProjectConsultants(p).includes(cons) && statusMatches(p) && companyMatches(p)) projs.push({...p, parentName: m.name, pType: 'project'}); }); });
            if(projs.length === 0) return; has = true; projs.sort((a,b) => parseFloat(a.priority||0) - parseFloat(b.priority||0));
            h += `<div class="mb-8"><h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style="color: ${cData.color}"><span class="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_${cData.color}] border border-white/20" style="background-color: ${cData.color}"></span>${escapeHtml(cons)}<span class="bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[9px] ml-auto border border-white/5 shadow-inner">${projs.length} proy.</span></h3><div class="space-y-4">`;
            projs.forEach(p => {
                let sIco = p.status==='En Progreso'?'🚀':(p.status==='Completado'?'✅':(p.status==='No Iniciado'?'⏸️':'⏳'));
                let over = false; if(p.deadline && p.status !== 'Completado') { const [y,m,d] = p.deadline.split('-'); if(new Date(y,m-1,d) < new Date(new Date().setHours(0,0,0,0))) over=true; }
                const pComps = window.getProjectCompanies(p);
                const compBadges = pComps.map(c => {
                    const st = window.getCompanyStyle ? window.getCompanyStyle(c) : { color: '#ff9f0a', bg: 'rgba(255,159,10,0.15)', border: 'rgba(255,159,10,0.3)', icon: '🏢' };
                    return `<span class="text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm border" style="background-color:${st.bg}; color:${st.color}; border-color:${st.border};">${st.icon} ${escapeHtml(c)}</span>`;
                }).join('');
                h += `<div class="bg-black/40 border border-white/10 rounded-[1.5rem] p-5 flex gap-4 hover:bg-white/10 transition-all cursor-pointer group shadow-inner ${over?'border-[#ff453a]/50 bg-[#ff453a]/5':''}" onclick="window.selectNodeAndOpenConfig('${p.pType}', '${p.id}')"><div class="text-xl font-bold mt-1.5 shrink-0 w-8 text-center drop-shadow-md" style="color: ${cData.color}">*${p.priority}</div><div class="flex-1 min-w-0"><h4 class="text-sm font-semibold text-white leading-tight group-hover:text-brand-accent transition truncate">${over?'⚠️ ':''}${escapeHtml(p.name)}</h4><p class="text-[9px] text-gray-500 mt-1.5 uppercase tracking-widest truncate">└ ${escapeHtml(p.parentName)}</p><div class="flex flex-wrap items-center gap-2 mt-3">${compBadges}<span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-black/40 border border-white/5 text-gray-300 shadow-inner">${sIco} ${p.status||'Pendiente'} (${p.progress||0}%)</span>${p.deadline ? `<span class="text-[9px] font-mono font-bold text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20 px-2.5 py-1 rounded-md">📅 ${p.deadline}</span>` : ''}</div></div></div>`;
            }); h += `</div></div>`;
        });
        c.innerHTML = has ? h : `<div class="flex flex-col items-center justify-center py-20 text-center opacity-50"><svg class="w-16 h-16 text-gray-500 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg><p class="text-gray-300 text-sm font-medium tracking-wide">No hay coincidencias.</p></div>`;
    }

    window.renderMindMap = function() {
      if (!canvasGroup) return; canvasGroup.innerHTML = '';
      const dynamicDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      canvasGroup.appendChild(dynamicDefs);
      const q = activeSearchQuery.toLowerCase();
      const isLight = document.body.classList.contains('theme-light');
      
      const isFiltered = (p) => {
          if (isFocusMode) {
              let isOverdue = false, isSoon = false;
              if (p.deadline && p.status !== 'Completado') {
                  const [y,m,d] = p.deadline.split('-'); 
                  const diff = Math.ceil((new Date(y, m-1, d) - new Date(new Date().setHours(0,0,0,0))) / 86400000);
                  if (diff < 0) isOverdue = true;
                  if (diff >= 0 && diff <= 3) isSoon = true;
              }
              const hasVal = (p.tasks||[]).some(t => t.done === 'pending');
              return isOverdue || isSoon || hasVal;
          }

          if (activeFilterModule !== 'ALL') {
              const isPrim = (p._modId === activeFilterModule) || (activeFilterModule === 'direct-hub' && p._modId === 'direct-hub');
              const isSec = Array.isArray(p.secondaryModules) && (
                  p.secondaryModules.includes(activeFilterModule) ||
                  (activeFilterModule === 'direct-hub' && p.secondaryModules.includes('DIRECT')) ||
                  (activeFilterModule === 'DIRECT' && p.secondaryModules.includes('hub-direct'))
              );
              if (!isPrim && !isSec) return false;
          }
          if (activeFilterStatuses.length > 0 && !activeFilterStatuses.includes('ALL')) {
              if (!activeFilterStatuses.includes(p.status)) return false;
          }
          if (activeFilterConsultants.length > 0 && !activeFilterConsultants.includes('ALL')) {
              const pCons = getProjectConsultants(p);
              if (!pCons.some(c => activeFilterConsultants.includes(c))) return false;
          }
          if (activeFilterCompanies.length > 0 && !activeFilterCompanies.includes('ALL')) {
              const pComps = window.getProjectCompanies(p);
              if (!pComps.some(c => activeFilterCompanies.includes(c))) return false;
          }
          
          if (activeFilterUrgency !== 'ALL') {
              if (p.status === 'Completado') return false;
              let isOver = false, isSoon = false, is30 = false;
              if (p.deadline) {
                  const [y,m,d] = p.deadline.split('-'); 
                  const diff = Math.ceil((new Date(y, m-1, d) - new Date(new Date().setHours(0,0,0,0))) / 86400000);
                  if (diff < 0) isOver = true; if (diff >= 0 && diff <= 7) isSoon = true; if (diff >= 0 && diff <= 30) is30 = true;
              }
              if (activeFilterUrgency === 'OVERDUE' && !isOver) return false;
              if (activeFilterUrgency === 'WEEK' && !isSoon) return false;
              if (activeFilterUrgency === 'MONTH' && !is30) return false;
              if (activeFilterUrgency === 'NONE' && p.deadline) return false;
          }

          if (activeFilterPriority !== 'ALL') {
              const prio = parseFloat(p.priority || 1);
              if (activeFilterPriority === 'HIGH' && prio > 3) return false;
              if (activeFilterPriority === 'MED' && (prio < 4 || prio > 6)) return false;
              if (activeFilterPriority === 'LOW' && prio < 7) return false;
          }

          if (activeFilterBottleneck !== 'ALL') {
              if (activeFilterBottleneck === 'CLIENT' && (!p.clientDeliveryDate || p.clientReturnDate || p.status === 'Completado')) return false;
              if (activeFilterBottleneck === 'VALIDATION' && !(p.tasks||[]).some(t => t.done === 'pending')) return false;
              if (activeFilterBottleneck === 'NA') {
                  let unv = false; if(p.docs) Object.keys(p.docs).forEach(k => { if(p.docs[k].na && !p.docs[k].naValidated) unv = true; });
                  if(!unv) return false;
              }
          }

          if (q && !p.name.toLowerCase().includes(q) && !getProjectConsultants(p).some(c => c.toLowerCase().includes(q)) && !window.getProjectCompanies(p).some(c => c.toLowerCase().includes(q))) return false;
          return true;
      };

      const isConsAll = activeFilterConsultants.includes('ALL') || activeFilterConsultants.length === 0;
      const isStatusAll = activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0;
      const isCompAll = activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0;

      const isDefaultState = !isFocusMode &&
          activeFilterModule === 'ALL' &&
          isStatusAll &&
          isConsAll &&
          isCompAll &&
          activeFilterUrgency === 'ALL' &&
          activeFilterPriority === 'ALL' &&
          activeFilterBottleneck === 'ALL' &&
          !q;

      function isModuleCollapsed(modId, n) {
          if (!collapsedModules.has(modId)) return false;
          // Si hay una búsqueda o filtro activo, auto-expandir si el módulo contiene proyectos coincidentes
          if (!isDefaultState) {
              const hasMatchingProj = (n.projects || []).some(p => isFiltered(p));
              if (hasMatchingProj) return false;
          }
          return true;
      }

      ensureDataStructure();
      const directHubItem = appData.directHub || { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' };
      const visDir = appData.directProjects || [];
      const activeMods = (appData.modules || []).filter(m => m && typeof m === 'object');
      
      // Balanceo estático y estable de lados para evitar que los módulos brinquen de izquierda a derecha al colapsar
      let lNodes = [], rNodes = [], lStaticWeight = 0, rStaticWeight = 0;
      const directData = { type: 'direct-hub', item: directHubItem, projects: visDir };
      lNodes.push(directData);
      lStaticWeight += Math.max(1, visDir.length);
      
      activeMods.forEach(m => {
          if (!m.id) m.id = 'm_' + Math.random().toString(36).slice(2, 9);
          if (!m.name) m.name = 'Módulo';
          if (!m.color) m.color = '#0071e3';
          const modData = { type: 'module', item: m, projects: m.projects || [] };
          const pStaticLen = Math.max(1, modData.projects.length);
          if (lStaticWeight <= rStaticWeight) {
              lNodes.push(modData);
              lStaticWeight += pStaticLen;
          } else {
              rNodes.push(modData);
              rStaticWeight += pStaticLen;
          }
      });

      const slotH = 75, mOffX = 400, pOffX = 900; 
      function procSide(nodes, isLeft) {
          const mx = isLeft ? -mOffX : mOffX, px = isLeft ? -pOffX : pOffX;
          
          // Total de slots reales en este lado según su estado actual (colapsado o expandido)
          const totalSlots = nodes.reduce((sum, n) => {
              const modId = n.type === 'direct-hub' ? 'hub-direct' : (n.item ? n.item.id : 'mod');
              const isCollapsed = isModuleCollapsed(modId, n);
              const pCount = (n.projects || []).length;
              return sum + (isCollapsed ? 1 : Math.max(1, pCount));
          }, 0);

          let cy = -(totalSlots * slotH / 2) + (slotH / 2);
          nodes.forEach(n => {
              const pCount = (n.projects || []).length;
              const modId = n.type === 'direct-hub' ? 'hub-direct' : (n.item ? n.item.id : 'mod');
              const nItemId = String(modId).replace(/[^a-zA-Z0-9_-]/g, '');
              const nItemColor = (n.item && n.item.color) ? n.item.color : '#0071e3';
              const nItemName = n.item ? (n.item.name || '') : '';
              const isCollapsed = isModuleCollapsed(modId, n);
              const weight = isCollapsed ? 1 : Math.max(1, pCount);
              
              const sy = cy;
              const ey = cy + (weight - 1) * slotH;
              const my = (sy + ey) / 2;
              cy += weight * slotH;

              if (!isCollapsed && pCount > 0) {
                  n.projects.forEach((p, idx) => { 
                      const cN = getProjectConsultants(p);
                      const col = generateJointGradient(cN);
                      const strictType = n.type === 'direct-hub' ? 'direct-project' : 'project';
                      p._modId = n.type === 'direct-hub' ? 'direct-hub' : (n.item ? n.item.id : 'mod');
                      const py = sy + idx * slotH;
                      p._renderData = { x: px, y: py, color: col, type: strictType, realId: p.id }; 
                  });
              } else {
                  (n.projects || []).forEach(p => { p._renderData = null; });
              }

              n._renderData = { x: mx, y: my, isLeft };
              if (n.item) n.item._renderData = n._renderData;

              // PARCHE: Evaluación estricta de módulos y ghosting de líneas
              const hasSecMatches = (appData.directProjects || []).concat(
                  (appData.modules || []).flatMap(m => m.projects || [])
              ).some(p => {
                  const isSec = Array.isArray(p.secondaryModules) && (
                      p.secondaryModules.includes(nItemId) ||
                      (nItemId === 'hub-direct' && p.secondaryModules.includes('DIRECT')) ||
                      (nItemId === 'DIRECT' && p.secondaryModules.includes('hub-direct'))
                  );
                  return isSec && isFiltered(p);
              });
              const modMatches = isDefaultState || (n.projects || []).some(p => isFiltered(p)) || hasSecMatches || (q !== '' && nItemName && nItemName.toLowerCase().includes(q));
              const lineOpacity = modMatches ? '1' : '0.15';

              const pC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              pC.classList.add('mindmap-connector');
              const coreStartX = isLeft ? -60 : 60;
              const modEndX = isLeft ? mx + 165 : mx - 165;
              const cp1CoreX = isLeft ? -125 : 125;
              const cp2CoreX = isLeft ? modEndX + 65 : modEndX - 65;
              pC.setAttribute('d', `M ${coreStartX} 0 C ${cp1CoreX} 0, ${cp2CoreX} ${my}, ${modEndX} ${my}`);
              pC.setAttribute('fill', 'none'); 

              // Conector de fibra óptica: Gradiente direccional de Núcleo a Módulo
              const coreGradId = `grad-c-${nItemId}`;
              const cGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
              cGrad.setAttribute('id', coreGradId);
              cGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
              cGrad.setAttribute('x1', `${coreStartX}`);
              cGrad.setAttribute('y1', '0');
              cGrad.setAttribute('x2', `${modEndX}`);
              cGrad.setAttribute('y2', `${my}`);

              const cs1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              cs1.setAttribute('offset', '0%');
              cs1.setAttribute('stop-color', '#0071e3');
              cs1.setAttribute('stop-opacity', isLight ? '0.40' : '0.50');
              cGrad.appendChild(cs1);

              const cs2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              cs2.setAttribute('offset', '100%');
              cs2.setAttribute('stop-color', nItemColor);
              cs2.setAttribute('stop-opacity', isLight ? '0.75' : '0.85');
              cGrad.appendChild(cs2);

              dynamicDefs.appendChild(cGrad);

              pC.setAttribute('stroke', `url(#${coreGradId})`); 
              pC.setAttribute('stroke-width', '1.8');
              pC.setAttribute('opacity', lineOpacity);
              canvasGroup.appendChild(pC);

              if (!isCollapsed && pCount > 0) (n.projects || []).forEach(p => {
                  if (!p._renderData) return;
                  const pMatches = isDefaultState || isFiltered(p);
                  let isOver = false;
                  if(p.deadline && p.status !== 'Completado') {
                      const [dy, dm, dd] = p.deadline.split('-');
                      if(new Date(dy, dm-1, dd) < new Date(new Date().setHours(0,0,0,0))) isOver = true;
                  }

                  const pP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  pP.classList.add('mindmap-connector');
                  const solidColor = (getProjectConsultants(p).length > 0 && consultants[getProjectConsultants(p)[0]]) ? consultants[getProjectConsultants(p)[0]].color : (isLight ? '#64748b' : '#48484a');
                  const endCol = isOver ? '#ff453a' : solidColor;

                  // Conexión limpia y fluida que nace exactamente en el botón de colapso
                  const startX = isLeft ? (mx - 165 - 11) : (mx + 165 + 11);
                  const endX = isLeft ? p._renderData.x + 160 : p._renderData.x - 160;
                  const dx = Math.abs(endX - startX);
                  const cpDist = Math.max(40, Math.min(95, dx * 0.45));
                  const cp1X = isLeft ? startX - cpDist : startX + cpDist;
                  const cp2X = isLeft ? endX + cpDist : endX - cpDist;
                  
                  pP.setAttribute('d', `M ${startX} ${my} C ${cp1X} ${my}, ${cp2X} ${p._renderData.y}, ${endX} ${p._renderData.y}`);
                  pP.setAttribute('fill', 'none'); 

                  // Conector de fibra óptica: Gradiente direccional de Módulo a Proyecto
                  const pIdClean = String(p.id || Math.random().toString(36).slice(2, 7)).replace(/[^a-zA-Z0-9_-]/g, '');
                  const pGradId = `grad-p-${pIdClean}`;
                  const pGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                  pGrad.setAttribute('id', pGradId);
                  pGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
                  pGrad.setAttribute('x1', `${startX}`);
                  pGrad.setAttribute('y1', `${my}`);
                  pGrad.setAttribute('x2', `${endX}`);
                  pGrad.setAttribute('y2', `${p._renderData.y}`);

                  const ps1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  ps1.setAttribute('offset', '0%');
                  ps1.setAttribute('stop-color', nItemColor);
                  ps1.setAttribute('stop-opacity', isLight ? '0.45' : '0.50');
                  pGrad.appendChild(ps1);

                  const ps2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  ps2.setAttribute('offset', '100%');
                  ps2.setAttribute('stop-color', endCol);
                  ps2.setAttribute('stop-opacity', isLight ? '0.85' : '0.85');
                  pGrad.appendChild(ps2);

                  dynamicDefs.appendChild(pGrad);

                  pP.setAttribute('stroke', `url(#${pGradId})`); 
                  pP.setAttribute('stroke-width', isLight ? '2' : '1.5'); 
                  pP.setAttribute('opacity', pMatches ? '1' : '0.12'); 
                  canvasGroup.appendChild(pP);
              });
          });
      }
      procSide(lNodes, true); procSide(rNodes, false);

      // Mapa de nodos de módulo para resolución rápida de conectores secundarios
      const moduleNodeMap = new Map();
      [...lNodes, ...rNodes].forEach(n => {
          const mId = n.type === 'direct-hub' ? 'DIRECT' : (n.item ? n.item.id : '');
          if (mId) moduleNodeMap.set(mId, n);
          if (n.type === 'direct-hub') moduleNodeMap.set('hub-direct', n);
      });

      // Conectores Secundarios Multimódulo (Fibras ópticas de dependencias cruzadas)
      [...lNodes, ...rNodes].forEach(n => {
          (n.projects || []).forEach(p => {
              if (!Array.isArray(p.secondaryModules) || p.secondaryModules.length === 0) return;
              if (!p._renderData) return;

              const pData = p._renderData;
              const pMatches = isDefaultState || isFiltered(p);
              const isProjectSel = currentSelection.id === p.id;

              p.secondaryModules.forEach(secId => {
                  const secNode = moduleNodeMap.get(secId) || (secId === 'DIRECT' ? moduleNodeMap.get('hub-direct') : null);
                  if (!secNode || !secNode._renderData) return;

                  const secData = secNode._renderData;
                  const secMx = secData.x;
                  const secMy = secData.y;
                  const secIsLeft = secData.isLeft;
                  const secColor = (secNode.item && secNode.item.color) ? secNode.item.color : '#0071e3';
                  const secNodeId = secNode.item ? secNode.item.id : (secNode.type === 'direct-hub' ? 'hub-direct' : '');
                  const isSecModSel = currentSelection.id === secNodeId;

                  const pX = pData.x;
                  const pY = pData.y;
                  const pIsLeft = pX < 0;

                  let startX, startY = secMy, endX, endY = pY;
                  let cp1X, cp2X;

                  if (secIsLeft && pIsLeft) {
                      startX = secMx - 165;
                      endX = pX + 160;
                      cp1X = startX - 70;
                      cp2X = endX + 70;
                  } else if (!secIsLeft && !pIsLeft) {
                      startX = secMx + 165;
                      endX = pX - 160;
                      cp1X = startX + 70;
                      cp2X = endX - 70;
                  } else if (secIsLeft && !pIsLeft) {
                      startX = secMx + 165;
                      endX = pX - 160;
                      cp1X = startX + 220;
                      cp2X = endX - 220;
                  } else {
                      startX = secMx - 165;
                      endX = pX + 160;
                      cp1X = startX - 220;
                      cp2X = endX + 220;
                  }

                  const pSec = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  pSec.classList.add('mindmap-connector', 'secondary-module-connector');
                  pSec.setAttribute('d', `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`);
                  pSec.setAttribute('fill', 'none');
                  pSec.setAttribute('data-source-proj', String(p.id));
                  pSec.setAttribute('data-target-mod', String(secId));

                  const pIdClean = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');
                  const secIdClean = String(secId).replace(/[^a-zA-Z0-9_-]/g, '');
                  const secGradId = `grad-sec-${pIdClean}-${secIdClean}`;

                  const sGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                  sGrad.setAttribute('id', secGradId);
                  sGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
                  sGrad.setAttribute('x1', `${startX}`);
                  sGrad.setAttribute('y1', `${startY}`);
                  sGrad.setAttribute('x2', `${endX}`);
                  sGrad.setAttribute('y2', `${endY}`);

                  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  stop1.setAttribute('offset', '0%');
                  stop1.setAttribute('stop-color', secColor);
                  stop1.setAttribute('stop-opacity', isLight ? '0.60' : '0.75');
                  sGrad.appendChild(stop1);

                  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  stop2.setAttribute('offset', '100%');
                  stop2.setAttribute('stop-color', isLight ? '#0071e3' : '#60a5fa');
                  stop2.setAttribute('stop-opacity', isLight ? '0.75' : '0.90');
                  sGrad.appendChild(stop2);

                  dynamicDefs.appendChild(sGrad);

                  pSec.setAttribute('stroke', `url(#${secGradId})`);
                  pSec.setAttribute('stroke-width', '1.6');

                  if (!pMatches) {
                      pSec.classList.add('sec-connector-dimmed');
                  } else if (isProjectSel || isSecModSel) {
                      pSec.classList.add('sec-connector-selected');
                      pSec.setAttribute('stroke-width', '2.5');
                      pSec.setAttribute('filter', 'url(#glow)');
                  } else if (activeFilterModule === secId || (secId === 'DIRECT' && activeFilterModule === 'direct-hub')) {
                      pSec.classList.add('sec-connector-selected');
                      pSec.setAttribute('stroke-width', '2.2');
                  }
                  canvasGroup.appendChild(pSec);
              });
          });
      });

      [...lNodes, ...rNodes].forEach(n => {
        const modId = n.item ? n.item.id : (n.type === 'direct-hub' ? 'hub-direct' : 'mod');
        const isCollapsed = isModuleCollapsed(modId, n);
        if (!isCollapsed) {
          (n.projects || []).forEach(p => {
            if (!p._renderData) return;
            const { x, y, color, type: strictType, realId } = p._renderData; 
          const isSel = currentSelection.id === realId;
          const pMatches = isDefaultState || isFiltered(p);
          
          let isOver = false; if(p.deadline && p.status !== 'Completado') { const [dy, dm, dd] = p.deadline.split('-'); if(new Date(dy, dm-1, dd) < new Date(new Date().setHours(0,0,0,0))) isOver = true; }
          const sCol = p.status==='En Progreso'?'#0071e3':(p.status==='Completado'?'#30d158':(p.status==='No Iniciado'?'#48484a':'#8e8e93'));

          // 1. CREACIÓN DEL CONTENEDOR PRINCIPAL
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', `translate(${x - 160}, ${y - 28})`);
          const pCleanId = String(realId).replace(/[^a-zA-Z0-9_-]/g, '');
          g.setAttribute('data-project-id', String(realId));
          g.classList.add('mindmap-project-node', `proj-node-${pCleanId}`);
          
          // ESTADO DE VISIBILIDAD Y BLOQUEO DURO
          const forceInteractive = isDefaultState;
          if (!pMatches && !forceInteractive) {
              g.setAttribute('opacity', '0.15');
              g.style.pointerEvents = 'none';
              g.classList.remove('interactive-node'); 
          } else {
              g.setAttribute('opacity', '1');
              g.style.pointerEvents = 'all'; // Captura total en el contenedor
              g.classList.add('interactive-node');
          }

          // 2. CONGELAMIENTO LÉXICO (Cierre Perfecto)
          const currentNodeType = strictType;
          const currentNodeId = realId;
          
          g.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              try { window.selectNode(currentNodeType, currentNodeId); } catch (err) { console.error('No se pudo abrir el proyecto:', p, err); window.showToast('⚠️ No se pudo abrir "' + p.name + '": ' + err.message, true); }
          }, false);

          // ILUMINACIÓN INTERACTIVA ON-DEMAND PARA PROYECTOS MULTIMÓDULO
          if (Array.isArray(p.secondaryModules) && p.secondaryModules.length > 0) {
              g.addEventListener('mouseenter', function() {
                  const conns = canvasGroup.querySelectorAll(`.secondary-module-connector[data-source-proj="${currentNodeId}"]`);
                  conns.forEach(c => c.classList.add('sec-connector-highlight'));
                  
                  p.secondaryModules.forEach(sModId => {
                      const cleanId = String(sModId === 'DIRECT' ? 'hub-direct' : sModId).replace(/[^a-zA-Z0-9_-]/g, '');
                      const targetModG = canvasGroup.querySelector(`.mod-node-${cleanId}`);
                      if (targetModG) targetModG.classList.add('target-module-highlight');
                  });
              });
              g.addEventListener('mouseleave', function() {
                  const conns = canvasGroup.querySelectorAll(`.secondary-module-connector[data-source-proj="${currentNodeId}"]`);
                  conns.forEach(c => c.classList.remove('sec-connector-highlight'));
                  
                  p.secondaryModules.forEach(sModId => {
                      const cleanId = String(sModId === 'DIRECT' ? 'hub-direct' : sModId).replace(/[^a-zA-Z0-9_-]/g, '');
                      const targetModG = canvasGroup.querySelector(`.mod-node-${cleanId}`);
                      if (targetModG) targetModG.classList.remove('target-module-highlight');
                  });
              });
          }

          // 3. CAPA VISUAL (Píldoras estilo original con liquid glass)
          // AURA PARPADEANTE / FARO VISUAL PARA PROYECTOS VENCIDOS
          if (isOver) {
              const aura = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              aura.setAttribute('x', '-5');
              aura.setAttribute('y', '-5');
              aura.setAttribute('width', '330');
              aura.setAttribute('height', '66');
              aura.setAttribute('rx', '21');
              aura.setAttribute('fill', 'rgba(255, 69, 58, 0.12)');
              aura.setAttribute('stroke', '#ff453a');
              aura.setAttribute('stroke-width', '1.5');
              aura.classList.add('overdue-aura-pulse');
              aura.style.pointerEvents = 'none';
              g.appendChild(aura);
          }

          const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('width', '320'); r.setAttribute('height', '56'); r.setAttribute('rx', '16'); 
          r.setAttribute('fill', 'rgba(18, 18, 24, 0.65)'); 
          r.setAttribute('stroke', isOver ? '#ff453a' : color); 
          r.setAttribute('stroke-width', isOver ? '2' : (isSel ? '2' : '1')); 
          r.style.pointerEvents = 'none';
          if (isOver) r.classList.add('overdue-capsule');
          if(isSel || (!isDefaultState && pMatches)) r.setAttribute('filter', 'url(#glow)'); 
          g.appendChild(r);

          const rSheen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rSheen.setAttribute('width', '320'); rSheen.setAttribute('height', '56'); rSheen.setAttribute('rx', '16');
          rSheen.setAttribute('fill', 'url(#capsule-sheen-dark)');
          rSheen.style.pointerEvents = 'none';
          g.appendChild(rSheen);

          const sC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sC.setAttribute('cx', '18'); sC.setAttribute('cy', '18'); sC.setAttribute('r', '4'); 
          sC.setAttribute('fill', isOver ? '#ff453a' : sCol); 
          sC.style.pointerEvents = 'none';
          if (isOver) {
              sC.classList.add('overdue-dot');
          } else if (pMatches) {
              sC.setAttribute('filter', `drop-shadow(0 0 5px ${sCol})`); 
          }
          g.appendChild(sC);

          const pComps = window.getProjectCompanies(p);
          let compBadgeOffset = 0;
          if (pComps.length > 0) {
              const mainC = pComps[0];
              const cStyle = window.getCompanyStyle ? window.getCompanyStyle(mainC) : { color: '#ff9f0a', bg: 'rgba(255,159,10,0.15)' };
              const bText = pComps.length > 1 ? `${mainC} +${pComps.length - 1}` : mainC;
              const bWidth = pComps.length > 1 ? 46 : 34;

              const cG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              cG.setAttribute('transform', 'translate(34, 10)');
              cG.style.pointerEvents = 'none';

              const cP = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              cP.setAttribute('width', String(bWidth));
              cP.setAttribute('height', '14');
              cP.setAttribute('rx', '4');
              cP.setAttribute('fill', cStyle.bg);
              cP.setAttribute('stroke', cStyle.color);
              cP.setAttribute('stroke-width', '1');
              cG.appendChild(cP);

              const cT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              cT.setAttribute('x', String(bWidth / 2));
              cT.setAttribute('y', '10.5');
              cT.setAttribute('text-anchor', 'middle');
              cT.setAttribute('fill', cStyle.color);
              cT.setAttribute('style', 'font-size: 8px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; letter-spacing: 0.3px;');
              cT.textContent = bText;
              cG.appendChild(cT);

              g.appendChild(cG);
              compBadgeOffset = bWidth + 5;
          }

          const hasSecBadge = Array.isArray(p.secondaryModules) && p.secondaryModules.length > 0;
          const nT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          nT.setAttribute('x', String(34 + compBadgeOffset));
          nT.setAttribute('y', '22');
          nT.setAttribute('fill', '#ffffff'); 
          nT.classList.add('svg-text', 'svg-text-bold');
          let fullText = (isOver ? "⚠️ " : "") + p.name;
          let fontSize = fullText.length > 35 ? 9 : (fullText.length > 25 ? 10 : 12);
          nT.setAttribute('style', `font-size: ${fontSize}px; pointer-events: none;`);
          const maxNameLen = hasSecBadge ? (compBadgeOffset ? 26 : 34) : (compBadgeOffset ? 35 : 55);
          nT.textContent = fullText.length > maxNameLen ? fullText.substring(0, maxNameLen - 3)+'...' : fullText;
          g.appendChild(nT);

          // Micro-badge de multimódulo en la pastilla del proyecto
          if (hasSecBadge) {
              const multiG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              multiG.setAttribute('transform', 'translate(252, 9)');
              multiG.style.pointerEvents = 'auto';
              multiG.style.cursor = 'pointer';

              const secModNames = p.secondaryModules.map(smId => {
                  if (smId === 'DIRECT' || smId === 'hub-direct') return 'Proyectos Directos';
                  const m = (appData.modules || []).find(x => x.id === smId);
                  return m ? m.name : smId;
              }).join(', ');

              const mTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              mTitle.textContent = `🔗 Vinculado a: ${secModNames} (Posa el cursor para iluminar conexiones)`;
              multiG.appendChild(mTitle);

              const mPill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              mPill.setAttribute('width', '38');
              mPill.setAttribute('height', '14');
              mPill.setAttribute('rx', '7');
              mPill.setAttribute('fill', isLight ? 'rgba(0,113,227,0.12)' : 'rgba(0,113,227,0.25)');
              mPill.setAttribute('stroke', '#0071e3');
              mPill.setAttribute('stroke-width', '1');
              multiG.appendChild(mPill);

              const mTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              mTxt.setAttribute('x', '19');
              mTxt.setAttribute('y', '10.5');
              mTxt.setAttribute('text-anchor', 'middle');
              mTxt.setAttribute('fill', isLight ? '#0071e3' : '#60a5fa');
              mTxt.setAttribute('style', 'font-size: 8px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;');
              mTxt.textContent = `🔗+${p.secondaryModules.length}`;
              multiG.appendChild(mTxt);

              g.appendChild(multiG);
          }
          
          const prog = Math.round(p.progress || 0);

          // Pista base de la barra de progreso
          const pbBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          pbBg.setAttribute('x', '34'); pbBg.setAttribute('y', '38');
          pbBg.setAttribute('width', '224'); pbBg.setAttribute('height', '3.5');
          pbBg.setAttribute('rx', '1.75');
          pbBg.setAttribute('fill', isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)');
          pbBg.style.pointerEvents = 'none';
          g.appendChild(pbBg);

          if (prog > 0) {
             const pb = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
             pb.setAttribute('x', '34'); pb.setAttribute('y', '38');
             pb.setAttribute('width', Math.max(4, 224 * (prog / 100)));
             pb.setAttribute('height', '3.5'); pb.setAttribute('rx', '1.75');
             pb.setAttribute('fill', isOver ? '#ff453a' : sCol);
             pb.style.pointerEvents = 'none';
             if (pMatches) pb.setAttribute('filter', `drop-shadow(0 0 4px ${isOver ? '#ff453a' : sCol})`);
             g.appendChild(pb);
          }

          // Micro indicador numérico exacto de porcentaje a la derecha
          const pPerc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          pPerc.setAttribute('x', '302'); pPerc.setAttribute('y', '42');
          pPerc.setAttribute('text-anchor', 'end');
          pPerc.setAttribute('fill', prog > 0 ? (prog === 100 ? '#30d158' : (isLight ? '#475569' : 'rgba(255,255,255,0.65)')) : (isLight ? '#94a3b8' : 'rgba(255,255,255,0.30)'));
          pPerc.setAttribute('style', 'font-size: 9.5px; font-weight: 600; font-family: "SF Mono", monospace; pointer-events: none;');
          pPerc.textContent = `${prog}%`;
          g.appendChild(pPerc);

          // 3.5 BADGE DE NOTIFICACIÓN DE FORO (FILTRO DE INVOLUCRAMIENTO Y MENCIONES)
          if (localAuthor && Array.isArray(p.notes) && p.notes.length > 0 && (typeof window.shouldShowProjectForumBadge !== 'function' || window.shouldShowProjectForumBadge(p, localAuthor, currentUserRole))) {
              const unreadNotes = p.notes.filter(n => {
                  if (!n) return false;
                  if (!Array.isArray(n.readBy)) {
                      return n.by !== localAuthor;
                  }
                  return !n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
              });

              const unreadCount = unreadNotes.length;
              if (unreadCount > 0) {
                  const hasMention = unreadNotes.some(n => window.isUserMentionedInText && window.isUserMentionedInText(n.text, localAuthor));
                  const hasBlocker = unreadNotes.some(n => n.tag === 'bloqueo');

                  // Prioridad visual: 1. Mención (@ Azul Eléctrico) > 2. Bloqueo (⚠️ Rojo) > 3. Normal (💬 Morado)
                  const badgeColor = hasMention ? '#0071e3' : (hasBlocker ? '#ff453a' : '#bf5af2');
                  const animClass = hasMention ? 'unread-mention-pulse' : (hasBlocker ? 'unread-blocker-pulse' : 'unread-purple-pulse');
                  const badgeText = hasMention ? '@' : (unreadCount > 9 ? '9+' : String(unreadCount));

                  const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  badgeG.setAttribute('class', 'project-unread-badge');
                  badgeG.style.pointerEvents = 'none';

                  if (hasMention || unreadCount < 10) {
                      const bCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                      bCircle.setAttribute('cx', '310');
                      bCircle.setAttribute('cy', '4');
                      bCircle.setAttribute('r', '8.5');
                      bCircle.setAttribute('fill', badgeColor);
                      bCircle.setAttribute('stroke', '#0d0d12');
                      bCircle.setAttribute('stroke-width', '1.5');
                      bCircle.setAttribute('class', animClass);
                      bCircle.setAttribute('filter', `drop-shadow(0 0 6px ${badgeColor})`);
                      badgeG.appendChild(bCircle);

                      const bTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                      bTxt.setAttribute('x', '310');
                      bTxt.setAttribute('y', hasMention ? '7.5' : '7');
                      bTxt.setAttribute('text-anchor', 'middle');
                      bTxt.setAttribute('fill', '#ffffff');
                      bTxt.setAttribute('style', `font-size: ${hasMention ? '10px' : '9px'}; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; pointer-events: none;`);
                      bTxt.textContent = badgeText;
                      badgeG.appendChild(bTxt);
                  } else {
                      const bPill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                      bPill.setAttribute('x', '298');
                      bPill.setAttribute('y', '-5');
                      bPill.setAttribute('width', '24');
                      bPill.setAttribute('height', '18');
                      bPill.setAttribute('rx', '9');
                      bPill.setAttribute('fill', badgeColor);
                      bPill.setAttribute('stroke', '#0d0d12');
                      bPill.setAttribute('stroke-width', '1.5');
                      bPill.setAttribute('class', animClass);
                      bPill.setAttribute('filter', `drop-shadow(0 0 6px ${badgeColor})`);
                      badgeG.appendChild(bPill);

                      const bTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                      bTxt.setAttribute('x', '310');
                      bTxt.setAttribute('y', '7.5');
                      bTxt.setAttribute('text-anchor', 'middle');
                      bTxt.setAttribute('fill', '#ffffff');
                      bTxt.setAttribute('style', 'font-size: 8.5px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; pointer-events: none;');
                      bTxt.textContent = '9+';
                      badgeG.appendChild(bTxt);
                  }

                  g.appendChild(badgeG);
              }
          }

          // 4. CAPA DE INTERCEPCIÓN (Caja invisible final con silueta continua)
          const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hitBox.setAttribute('width', '320'); hitBox.setAttribute('height', '56'); hitBox.setAttribute('rx', '16');
          hitBox.setAttribute('fill', 'transparent');
          hitBox.style.cursor = 'pointer';
          g.appendChild(hitBox);
          
          canvasGroup.appendChild(g);
          });
        }

        // PARCHE: Evaluación estricta de módulos y ghosting de bloques
        const modName = n.item ? (n.item.name || '') : '';
        const modCol = (n.item && n.item.color) ? n.item.color : '#0071e3';
        const hasSecMatchesMod = (appData.directProjects || []).concat(
            (appData.modules || []).flatMap(m => m.projects || [])
        ).some(p => {
            const isSec = Array.isArray(p.secondaryModules) && (
                p.secondaryModules.includes(modId) ||
                (modId === 'hub-direct' && p.secondaryModules.includes('DIRECT')) ||
                (modId === 'DIRECT' && p.secondaryModules.includes('hub-direct'))
            );
            return isSec && isFiltered(p);
        });
        const modMatches = isDefaultState || (n.projects || []).some(p => isFiltered(p)) || hasSecMatchesMod || (q !== '' && modName && modName.toLowerCase().includes(q));
        const { x, y } = n._renderData || { x: 0, y: 0 };
        const isSel = currentSelection.id === modId;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${x - 165}, ${y - 25})`);
        const cleanModId = String(modId).replace(/[^a-zA-Z0-9_-]/g, '');
        g.setAttribute('data-module-id', String(modId));
        g.classList.add('mindmap-module-node', `mod-node-${cleanModId}`);
        
        if (!modMatches) {
             g.setAttribute('opacity', '0.15');
             g.style.pointerEvents = 'none';
             g.classList.remove('interactive-node');
        } else {
             g.setAttribute('opacity', '1');
             g.style.pointerEvents = 'all';
             g.classList.add('interactive-node');
        }
        
        const currentModType = n.type === 'direct-hub' ? 'direct-hub' : 'module';
        const currentModId = modId;
        
        g.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.selectNode(currentModType, currentModId);
        }, false);

        // INTERACCIÓN HOVER EN MÓDULO PARA ILUMINAR VÍNCULOS ENTRANTES
        g.addEventListener('mouseenter', function() {
            const inConns = canvasGroup.querySelectorAll(`.secondary-module-connector[data-target-mod="${modId}"]${modId === 'hub-direct' ? ', .secondary-module-connector[data-target-mod="DIRECT"]' : ''}`);
            inConns.forEach(c => c.classList.add('sec-connector-highlight'));
        });
        g.addEventListener('mouseleave', function() {
            const inConns = canvasGroup.querySelectorAll(`.secondary-module-connector[data-target-mod="${modId}"]${modId === 'hub-direct' ? ', .secondary-module-connector[data-target-mod="DIRECT"]' : ''}`);
            inConns.forEach(c => c.classList.remove('sec-connector-highlight'));
        });

        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('width', '330'); r.setAttribute('height', '50'); r.setAttribute('rx', '25'); 
        r.setAttribute('fill', n.type==='direct-hub' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(20, 20, 26, 0.65)');
        r.setAttribute('stroke', modCol); r.setAttribute('stroke-width', isSel ? '2.5' : '1');
        r.style.pointerEvents = 'none';
        if(n.type==='direct-hub') r.setAttribute('stroke-dasharray', '5,5'); 
        if(isSel || (!isDefaultState && modMatches)) r.setAttribute('filter', 'url(#glow)'); 
        g.appendChild(r);

        const rSheen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rSheen.setAttribute('width', '330'); rSheen.setAttribute('height', '50'); rSheen.setAttribute('rx', '25');
        rSheen.setAttribute('fill', 'url(#capsule-sheen-dark)');
        rSheen.style.pointerEvents = 'none';
        g.appendChild(rSheen);

        // Indicador de color del módulo a la izquierda
        const mDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mDot.setAttribute('cx', '20'); mDot.setAttribute('cy', '25'); mDot.setAttribute('r', '4');
        mDot.setAttribute('fill', modCol);
        mDot.style.pointerEvents = 'none';
        if(modMatches) mDot.setAttribute('filter', `drop-shadow(0 0 5px ${modCol})`);
        g.appendChild(mDot);
        
        // Título del módulo completo sin truncamiento
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); 
        t.setAttribute('x', '34'); t.setAttribute('y', '30'); 
        t.setAttribute('fill', '#ffffff'); t.setAttribute('text-anchor', 'start'); 
        t.classList.add('svg-text', 'svg-text-bold'); 
        t.style.pointerEvents = 'none';
        
        let rawName = n.item.name || '';
        let len = rawName.length;
        let mFontSize = 12;
        if (len > 35) mFontSize = 9.5;
        else if (len > 28) mFontSize = 10.5;
        else if (len > 20) mFontSize = 11.5;
        let displayName = len > 45 ? rawName.substring(0, 42) + '…' : rawName;
        t.setAttribute('style', `font-size: ${mFontSize}px; font-weight: 600; letter-spacing: -0.01em; pointer-events: none;`);
        t.textContent = displayName; 
        g.appendChild(t);

        // Micro-badge pill de conteo de proyectos a la derecha
        const pCount = n.projects.length;
        const allProjsList = (appData.directProjects || []).concat((appData.modules || []).flatMap(m => m.projects || []));
        const secCount = allProjsList.filter(p => Array.isArray(p.secondaryModules) && (
            p.secondaryModules.includes(modId) ||
            (modId === 'hub-direct' && p.secondaryModules.includes('DIRECT')) ||
            (modId === 'DIRECT' && p.secondaryModules.includes('hub-direct'))
        )).length;

        const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.textContent = `${rawName} (${pCount} propios${secCount > 0 ? `, ${secCount} vinculados` : ''})`;
        g.appendChild(titleEl);

        const countG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        countG.setAttribute('transform', secCount > 0 ? 'translate(254, 16)' : 'translate(262, 16)');
        countG.style.pointerEvents = 'none';
        
        const countBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        countBg.setAttribute('width', secCount > 0 ? '62' : '52'); countBg.setAttribute('height', '18');
        countBg.setAttribute('rx', '9');
        countBg.setAttribute('fill', isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)');
        countBg.setAttribute('stroke', isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)');
        countBg.setAttribute('stroke-width', '1');
        countG.appendChild(countBg);
        
        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', secCount > 0 ? '31' : '26'); countText.setAttribute('y', '12.5');
        countText.setAttribute('text-anchor', 'middle');
        countText.setAttribute('fill', modCol);
        countText.setAttribute('style', 'font-size: 8.5px; font-weight: 700; font-family: "SF Mono", monospace; letter-spacing: 0.04em;');
        countText.textContent = secCount > 0 ? `${pCount}+${secCount}P` : `${pCount} ${pCount === 1 ? 'PROY' : 'PROYS'}`;
        countG.appendChild(countText);
        g.appendChild(countG);

        // Capa invisible para interacción de módulos
        const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hitBox.setAttribute('width', '330'); hitBox.setAttribute('height', '50'); hitBox.setAttribute('rx', '25');
        hitBox.setAttribute('fill', 'transparent');
        hitBox.style.cursor = 'pointer';
        g.appendChild(hitBox);

        // Botón interactivo de colapso/expansión (+/-) del módulo
        if (pCount > 0) {
            const isCollapsed = isModuleCollapsed(modId, n);
            const isLeft = (n._renderData && n._renderData.isLeft);
            const toggleBtnG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            toggleBtnG.classList.add('mod-toggle-btn');
            const btnX = isLeft ? -11 : 341;
            const btnY = 25;
            toggleBtnG.setAttribute('transform', `translate(${btnX}, ${btnY})`);
            
            const btnCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            btnCircle.classList.add('btn-circle-bg');
            btnCircle.setAttribute('cx', '0');
            btnCircle.setAttribute('cy', '0');
            btnCircle.setAttribute('r', '11');
            btnCircle.setAttribute('fill', isLight ? '#ffffff' : '#14141a');
            btnCircle.setAttribute('stroke', modCol);
            btnCircle.setAttribute('stroke-width', '1.6');
            btnCircle.setAttribute('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))');
            toggleBtnG.appendChild(btnCircle);
            
            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', '-4.5'); hLine.setAttribute('y1', '0');
            hLine.setAttribute('x2', '4.5'); hLine.setAttribute('y2', '0');
            hLine.setAttribute('stroke', isLight ? '#0f172a' : '#ffffff');
            hLine.setAttribute('stroke-width', '2');
            hLine.setAttribute('stroke-linecap', 'round');
            toggleBtnG.appendChild(hLine);
            
            if (isCollapsed) {
                const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                vLine.setAttribute('x1', '0'); vLine.setAttribute('y1', '-4.5');
                vLine.setAttribute('x2', '0'); vLine.setAttribute('y2', '4.5');
                vLine.setAttribute('stroke', isLight ? '#0f172a' : '#ffffff');
                vLine.setAttribute('stroke-width', '2');
                vLine.setAttribute('stroke-linecap', 'round');
                toggleBtnG.appendChild(vLine);
            }

            // Área invisible de clic amplia para interacción inmediata
            const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hitArea.setAttribute('cx', '0'); hitArea.setAttribute('cy', '0');
            hitArea.setAttribute('r', '18');
            hitArea.setAttribute('fill', 'transparent');
            hitArea.style.cursor = 'pointer';
            toggleBtnG.appendChild(hitArea);
            
            const btnTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            btnTitle.textContent = isCollapsed ? `Expandir ${rawName} (${pCount} proyectos)` : `Colapsar ${rawName}`;
            toggleBtnG.appendChild(btnTitle);
            
            toggleBtnG.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.toggleModuleCollapse(modId);
            });
            
            g.appendChild(toggleBtnG);
        }

        canvasGroup.appendChild(g);
      });

      const coreG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      coreG.setAttribute('transform', `translate(-60, -60)`);
      coreG.classList.add('interactive-node');
      coreG.onclick = (e) => { e.stopPropagation(); window.selectNode('core', 'sicom'); };
      
      // Anillo orbital concéntrico
      const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orbit.setAttribute('cx', '60'); orbit.setAttribute('cy', '60'); orbit.setAttribute('r', '74');
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', isLight ? 'rgba(0, 113, 227, 0.25)' : 'rgba(0, 113, 227, 0.35)');
      orbit.setAttribute('stroke-width', '1');
      orbit.setAttribute('stroke-dasharray', '5 7');
      orbit.classList.add('core-orbit-ring');
      orbit.style.pointerEvents = 'none';
      coreG.appendChild(orbit);

      // Base de cristal oscura y núcleo iluminado
      const cc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cc.setAttribute('cx', '60'); cc.setAttribute('cy', '60'); cc.setAttribute('r', '60');
      cc.setAttribute('fill', isLight ? 'rgba(0, 113, 227, 0.12)' : 'rgba(10, 24, 48, 0.55)');
      cc.setAttribute('stroke', '#0071e3');
      cc.setAttribute('stroke-width', '2');
      cc.style.filter = 'drop-shadow(0 0 24px rgba(0, 113, 227, 0.45))';
      cc.classList.add('core-bg-circle');
      cc.style.pointerEvents = 'none';
      coreG.appendChild(cc);

      // Brillo especular
      const ccSheen = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ccSheen.setAttribute('cx', '60'); ccSheen.setAttribute('cy', '60'); ccSheen.setAttribute('r', '60');
      ccSheen.setAttribute('fill', isLight ? 'url(#capsule-sheen-light)' : 'url(#capsule-sheen-dark)');
      ccSheen.style.pointerEvents = 'none';
      coreG.appendChild(ccSheen);

      // Faro/Punto de pulso activo del sistema
      const coreDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      coreDot.setAttribute('cx', '60'); coreDot.setAttribute('cy', '40'); coreDot.setAttribute('r', '2.5');
      coreDot.setAttribute('fill', '#35aee8');
      coreDot.classList.add('core-status-beacon');
      coreDot.style.pointerEvents = 'none';
      coreG.appendChild(coreDot);

      // Título Principal
      const ct = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ct.setAttribute('x', '60'); ct.setAttribute('y', '58');
      ct.setAttribute('fill', '#ffffff');
      ct.setAttribute('text-anchor', 'middle');
      ct.classList.add('svg-text');
      ct.setAttribute('style', 'font-size: 14px; font-weight: 800; letter-spacing: 0.14em; pointer-events: none;');
      ct.textContent = 'SICOM';
      coreG.appendChild(ct);

      // Subtítulo micro-tecnológico
      const cSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cSub.setAttribute('x', '60'); cSub.setAttribute('y', '72');
      cSub.setAttribute('fill', isLight ? '#0071e3' : 'rgba(53, 174, 232, 0.75)');
      cSub.setAttribute('text-anchor', 'middle');
      cSub.classList.add('svg-text');
      cSub.setAttribute('style', 'font-size: 7.5px; font-weight: 700; letter-spacing: 0.16em; font-family: "SF Mono", monospace; pointer-events: none;');
      cSub.textContent = 'NÚCLEO ERP';
      coreG.appendChild(cSub);

      // HitBox
      const coreHit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      coreHit.setAttribute('cx', '60'); coreHit.setAttribute('cy', '60'); coreHit.setAttribute('r', '74');
      coreHit.setAttribute('fill', 'transparent');
      coreHit.style.cursor = 'pointer';
      coreG.appendChild(coreHit);

      canvasGroup.appendChild(coreG);
      
      if(appData.secondaryCore && appData.secondaryCore.active) {
          const sucomG = document.createElementNS('http://www.w3.org/2000/svg', 'g'); sucomG.setAttribute('transform', `translate(-60, 100)`); sucomG.classList.add('interactive-node');
          
          const sccBase = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sccBase.setAttribute('cx', '60'); sccBase.setAttribute('cy', '60'); sccBase.setAttribute('r', '60');
          sccBase.setAttribute('fill', isLight ? 'rgba(255, 255, 255, 0.50)' : 'rgba(14, 14, 20, 0.20)');
          sccBase.style.pointerEvents = 'none';
          sucomG.appendChild(sccBase);

          const scc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          scc.setAttribute('cx', '60'); scc.setAttribute('cy', '60'); scc.setAttribute('r', '60');
          scc.setAttribute('fill', isLight ? 'rgba(255, 159, 10, 0.12)' : 'rgba(255, 159, 10, 0.14)');
          scc.setAttribute('stroke', '#ff9f0a');
          scc.setAttribute('stroke-width', '2');
          scc.setAttribute('stroke-dasharray', '5,5');
          scc.style.filter = isLight ? 'drop-shadow(0 6px 20px rgba(255, 159, 10, 0.28))' : 'drop-shadow(0 0 24px rgba(255, 159, 10, 0.40))';
          scc.classList.add('core-bg-circle');
          scc.style.pointerEvents = 'none';
          sucomG.appendChild(scc);

          const sccSheen = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sccSheen.setAttribute('cx', '60'); sccSheen.setAttribute('cy', '60'); sccSheen.setAttribute('r', '60');
          sccSheen.setAttribute('fill', isLight ? 'url(#capsule-sheen-light)' : 'url(#capsule-sheen-dark)');
          sccSheen.style.pointerEvents = 'none';
          sucomG.appendChild(sccSheen);

          const sct = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          sct.setAttribute('x', '60'); sct.setAttribute('y', '65');
          sct.setAttribute('fill', isLight ? '#ff9f0a' : '#ffffff');
          sct.setAttribute('text-anchor', 'middle');
          sct.classList.add('svg-text');
          sct.setAttribute('style', 'font-size: 15px; font-weight: 700; letter-spacing: 0.06em; font-family: var(--font-heading), \'Inter\', sans-serif; pointer-events: none;');
          sct.textContent = 'SUCOM';
          sucomG.appendChild(sct);

          const sucomHit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sucomHit.setAttribute('cx', '60'); sucomHit.setAttribute('cy', '60'); sucomHit.setAttribute('r', '60');
          sucomHit.setAttribute('fill', 'transparent');
          sucomHit.style.cursor = 'pointer';
          sucomG.appendChild(sucomHit);

          canvasGroup.appendChild(sucomG);
      }
    };

    let currentHistoryCategory = 'all'; // 'all' | 'validaciones' | 'tareas' | 'proyectos'

    window.setHistoryCategoryFilter = function(cat) {
        currentHistoryCategory = cat;
        ['all', 'validaciones', 'tareas', 'proyectos'].forEach(c => {
            const btn = document.getElementById(`histCatBtn-${c}`);
            if (btn) {
                if (c === cat) {
                    btn.className = 'hist-cat-btn px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/15 text-white border border-white/20 shadow-sm';
                } else {
                    btn.className = 'hist-cat-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent';
                }
            }
        });
        window.renderHistory();
    };

    window.setHistoryFilterToday = function() {
        const dateInput = document.getElementById('historyDateFilter');
        const today = new Date();
        const tDay = String(today.getDate()).padStart(2, '0');
        const tMonth = String(today.getMonth() + 1).padStart(2, '0');
        const tYear = today.getFullYear();
        if (dateInput) dateInput.value = `${tYear}-${tMonth}-${tDay}`;
        window.renderHistory();
    };

    window.clearHistoryFilter = function() {
        const dateInput = document.getElementById('historyDateFilter');
        if (dateInput) dateInput.value = '';
        const searchInput = document.getElementById('historySearchInput');
        if (searchInput) searchInput.value = '';
        currentHistoryCategory = 'all';
        ['all', 'validaciones', 'tareas', 'proyectos'].forEach(c => {
            const btn = document.getElementById(`histCatBtn-${c}`);
            if (btn) {
                btn.className = c === 'all' 
                    ? 'hist-cat-btn px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'hist-cat-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent';
            }
        });
        window.renderHistory();
    };

    window.renderHistory = function() {
        const c = document.getElementById('historyListContainer');
        const e = document.getElementById('historyEmptyState');
        const emptyMsg = document.getElementById('historyEmptyMsg');
        const filterLabel = document.getElementById('historyFilterLabel');
        const countBadge = document.getElementById('historyCountBadge');
        if (!c) return;
        
        if (!appData.history || appData.history.length === 0) { 
            c.innerHTML = ''; 
            if (e) e.classList.remove('hidden'); 
            if (emptyMsg) emptyMsg.textContent = 'Aún no hay actividades registradas en la bitácora.';
            if (countBadge) countBadge.textContent = '0 registros';
            if (filterLabel) filterLabel.textContent = 'Historial vacío';
            return; 
        }
        
        const dateInput = document.getElementById('historyDateFilter');
        const selectedDateStr = dateInput ? dateInput.value : ''; // Formato yyyy-mm-dd
        const searchInput = document.getElementById('historySearchInput');
        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        let filtered = appData.history.filter(log => {
            if (!log.timestamp) return false;
            
            // 1. Filtro por fecha si hay fecha seleccionada
            if (selectedDateStr) {
                const datePart = log.timestamp.split(',')[0].trim();
                const parts = datePart.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    const logFormatted = `${year}-${month}-${day}`;
                    if (logFormatted !== selectedDateStr) return false;
                } else {
                    return false;
                }
            }

            // 2. Filtro por categoría
            if (currentHistoryCategory === 'validaciones') {
                const act = (log.action || '').toLowerCase();
                if (!act.includes('validó') && !act.includes('aprobó') && !act.includes('rechazó') && !act.includes('validada')) return false;
            } else if (currentHistoryCategory === 'tareas') {
                const act = (log.action || '').toLowerCase();
                const proj = (log.projectName || '').toLowerCase();
                if (!act.includes('tarea') && !proj.includes('diaria') && !proj.includes('general')) return false;
            } else if (currentHistoryCategory === 'proyectos') {
                const act = (log.action || '').toLowerCase();
                if (!act.includes('proyecto') && !act.includes('módulo') && !act.includes('estado') && !act.includes('avance') && !act.includes('reubicó')) return false;
            }

            // 3. Filtro por búsqueda de texto
            if (q) {
                const textMatch = (log.projectName || '').toLowerCase().includes(q) ||
                                  (log.action || '').toLowerCase().includes(q) ||
                                  (log.by || '').toLowerCase().includes(q) ||
                                  (log.timestamp || '').toLowerCase().includes(q);
                if (!textMatch) return false;
            }

            return true;
        });

        if (countBadge) countBadge.textContent = `${filtered.length} de ${appData.history.length}`;
        if (filterLabel) {
            let labelParts = [];
            if (selectedDateStr) {
                const [y, m, d] = selectedDateStr.split('-');
                labelParts.push(`Fecha: ${d}/${m}/${y}`);
            }
            if (currentHistoryCategory !== 'all') {
                labelParts.push(`Categoría: ${currentHistoryCategory}`);
            }
            if (q) {
                labelParts.push(`Búsqueda: "${q}"`);
            }
            filterLabel.textContent = labelParts.length > 0 ? labelParts.join(' | ') : 'Mostrando historial completo';
        }

        if (filtered.length === 0) { 
            c.innerHTML = ''; 
            if (e) e.classList.remove('hidden'); 
            if (emptyMsg) emptyMsg.textContent = (selectedDateStr || q || currentHistoryCategory !== 'all') ? 'No hay registros que coincidan con los filtros aplicados.' : 'No hay registros en la bitácora.';
            return; 
        }
        
        if (e) e.classList.add('hidden');
        c.innerHTML = filtered.map(log => {
            const col = consultants[log.by] ? consultants[log.by].color : '#8e8e93';
            const isVal = (log.action || '').includes('Validó') || (log.action || '').includes('Aprobó');
            const isRej = (log.action || '').includes('Rechazó');
            const isDel = (log.action || '').includes('Borró') || (log.action || '').includes('Eliminó');
            
            let tagBadge = '';
            if (isVal) tagBadge = '<span class="text-[8px] bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 px-1.5 py-0.2 rounded font-bold uppercase">Validación</span>';
            else if (isRej || isDel) tagBadge = '<span class="text-[8px] bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/30 px-1.5 py-0.2 rounded font-bold uppercase">Atención</span>';

            return `<div class="bg-black/30 border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-inner group hover:border-white/15 transition">
                <div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style="background-color: ${col}"></div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] text-gray-400 font-mono tracking-widest pl-1">🕒 ${log.timestamp}</span>
                    <div class="flex items-center gap-1.5">
                        ${tagBadge}
                        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/5 uppercase" style="color: ${col}">👤 ${escapeHtml(log.by)}</span>
                    </div>
                </div>
                <p class="text-xs font-semibold text-white mb-1 leading-tight pl-1">${escapeHtml(log.projectName)}</p>
                <p class="text-[11px] text-gray-300 pl-1 leading-relaxed">${escapeHtml(log.action)}</p>
            </div>`;
        }).join('');
    };

    window.renderDashboard = function() {
        let t = 0, c = 0, p = 0, pend = 0, noIni = 0, o = 0, totalProg = 0;
        let withDeadline = 0;
        let riskCount = 0;
        let totalDocsRequired = 0, totalDocsChecked = 0;
        let consStats = {};
        let moduleStats = [];

        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const in72Hours = new Date(todayMidnight.getTime() + (3 * 24 * 60 * 60 * 1000));

        const isOver = (proj) => { 
            if (!proj.deadline || proj.status === 'Completado') return false; 
            const [y, m, d] = proj.deadline.split('-'); 
            return new Date(y, m - 1, d) < todayMidnight; 
        };

        const isRisk = (proj) => {
            if (!proj.deadline || proj.status === 'Completado') return false;
            const [y, m, d] = proj.deadline.split('-');
            const dDate = new Date(y, m - 1, d);
            return dDate >= todayMidnight && dDate <= in72Hours && (proj.progress || 0) < 80;
        };

        const countDocs = (proj) => {
            if (globalDocs && globalDocs.length > 0) {
                globalDocs.forEach(d => {
                    totalDocsRequired++;
                    const docState = proj.docs ? proj.docs[d.id] : null;
                    if (docState && (docState.checked || (docState.na && docState.naValidated))) {
                        totalDocsChecked++;
                    }
                });
            }
        };

        const tally = (proj) => { 
            t++; 
            totalProg += (proj.progress || 0); 
            if (proj.deadline) withDeadline++;
            
            const over = isOver(proj);
            const risk = isRisk(proj);
            if (over) o++;
            if (risk) riskCount++;

            if (proj.status === 'Completado') c++; 
            else if (proj.status === 'En Progreso') p++; 
            else if (proj.status === 'No Iniciado') noIni++; 
            else pend++; 

            countDocs(proj);

            const projCons = getProjectConsultants(proj);
            projCons.forEach(cons => { 
                if (!consStats[cons]) {
                    consStats[cons] = { completed: 0, inProgress: 0, overdue: 0 };
                }
                if (proj.status === 'Completado') {
                    consStats[cons].completed++;
                } else if (over) {
                    consStats[cons].overdue++;
                } else {
                    consStats[cons].inProgress++;
                }
            }); 
        };

        (appData.directProjects || []).forEach(tally); 
        (appData.modules || []).forEach(m => (m.projects || []).forEach(tally));

        // Estadísticas por módulo
        if (appData.directProjects && appData.directProjects.length > 0) {
            const mProg = appData.directProjects.reduce((acc, x) => acc + (x.progress || 0), 0);
            moduleStats.push({
                name: appData.directHub.name || 'Proyectos Directos',
                count: appData.directProjects.length,
                avg: Math.round(mProg / appData.directProjects.length),
                color: appData.directHub.color || '#35aee8'
            });
        }
        (appData.modules || []).forEach(m => {
            const projs = m.projects || [];
            if (projs.length > 0) {
                const mProg = projs.reduce((acc, x) => acc + (x.progress || 0), 0);
                moduleStats.push({
                    name: m.name,
                    count: projs.length,
                    avg: Math.round(mProg / projs.length),
                    color: m.color || '#0071e3'
                });
            }
        });

        // 1. KPI Cálculos
        const slaRate = withDeadline > 0 ? Math.max(0, Math.round(((withDeadline - o) / withDeadline) * 100)) : 100;
        const docsRate = totalDocsRequired > 0 ? Math.round((totalDocsChecked / totalDocsRequired) * 100) : 100;
        const avgGlobal = t > 0 ? Math.round(totalProg / t) : 0;

        // 2. Renderizado de Elementos DOM KPI
        const elTotal = document.getElementById('dashTotal'); if (elTotal) elTotal.textContent = t;
        const elComp = document.getElementById('dashCompleted'); if (elComp) elComp.textContent = c;
        const elProg = document.getElementById('dashProgress'); if (elProg) elProg.textContent = p;
        const elOver = document.getElementById('dashOverdue'); if (elOver) elOver.textContent = o;
        const elOverBadge = document.getElementById('dashOverdueBadge'); if (elOverBadge) elOverBadge.textContent = o;
        
        const elSlaRate = document.getElementById('dashSlaRate'); if (elSlaRate) elSlaRate.textContent = `${slaRate}%`;
        const elSlaSub = document.getElementById('dashSlaSub');
        if (elSlaSub) {
            if (slaRate >= 85) { elSlaSub.textContent = 'Excelente ritmo'; elSlaSub.className = 'text-[9px] text-[#30d158] mt-0.5 font-medium truncate'; }
            else if (slaRate >= 70) { elSlaSub.textContent = 'En margen regular'; elSlaSub.className = 'text-[9px] text-[#ff9f0a] mt-0.5 font-medium truncate'; }
            else { elSlaSub.textContent = 'Atención requerida'; elSlaSub.className = 'text-[9px] text-[#ff453a] mt-0.5 font-medium truncate'; }
        }

        const elRiskCount = document.getElementById('dashRiskCount'); if (elRiskCount) elRiskCount.textContent = riskCount;
        const elRiskSub = document.getElementById('dashRiskSub'); if (elRiskSub) elRiskSub.textContent = riskCount === 1 ? '1 proyecto en riesgo' : `${riskCount} proyectos en riesgo`;

        const elDocsRate = document.getElementById('dashDocsRate'); if (elDocsRate) elDocsRate.textContent = `${docsRate}%`;
        const elDocsSub = document.getElementById('dashDocsSub'); if (elDocsSub) elDocsSub.textContent = `${totalDocsChecked} de ${totalDocsRequired} validados`;

        const elGlobalBar = document.getElementById('dashGlobalBar'); if (elGlobalBar) elGlobalBar.style.width = `${avgGlobal}%`;
        const elGlobalText = document.getElementById('dashGlobalText'); if (elGlobalText) elGlobalText.textContent = `${avgGlobal}%`;

        // 3. Gráfica 1: Balance de Carga por Consultor (Stacked Bar)
        const ctxCons = document.getElementById('consultantChart')?.getContext('2d');
        if (ctxCons) {
            if (window.consultantChartInstance) window.consultantChartInstance.destroy();
            
            const cLabels = Object.keys(consStats).sort((a, b) => {
                const totalA = consStats[a].completed + consStats[a].inProgress + consStats[a].overdue;
                const totalB = consStats[b].completed + consStats[b].inProgress + consStats[b].overdue;
                return totalB - totalA;
            });

            const dataDone = cLabels.map(l => consStats[l].completed);
            const dataProg = cLabels.map(l => consStats[l].inProgress);
            const dataOver = cLabels.map(l => consStats[l].overdue);

            window.consultantChartInstance = new Chart(ctxCons, {
                type: 'bar',
                data: {
                    labels: cLabels,
                    datasets: [
                        { label: 'Completados', data: dataDone, backgroundColor: '#30d158', borderRadius: 4, stack: 'carga' },
                        { label: 'En Tiempo', data: dataProg, backgroundColor: '#0071e3', borderRadius: 4, stack: 'carga' },
                        { label: 'Vencidos', data: dataOver, backgroundColor: '#ff453a', borderRadius: 4, stack: 'carga' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#8e8e93', font: { size: 9, family: 'Inter' }, boxWidth: 10, padding: 8 } }
                    },
                    scales: {
                        x: { stacked: true, ticks: { color: '#8e8e93', font: { size: 9 } }, grid: { display: false } },
                        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, color: '#636366', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // 4. Gráfica 2: Rendimiento por Módulo de Negocio (Horizontal Bar)
        const ctxMod = document.getElementById('moduleChart')?.getContext('2d');
        if (ctxMod) {
            if (window.moduleChartInstance) window.moduleChartInstance.destroy();
            
            moduleStats.sort((a, b) => b.avg - a.avg);
            const mLabels = moduleStats.map(m => m.name.length > 24 ? m.name.substring(0, 22) + '…' : m.name);
            const mData = moduleStats.map(m => m.avg);
            const mColors = moduleStats.map(m => m.color || '#0071e3');

            window.moduleChartInstance = new Chart(ctxMod, {
                type: 'bar',
                data: {
                    labels: mLabels,
                    datasets: [{
                        label: 'Avance %',
                        data: mData,
                        backgroundColor: mColors,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` Avance: ${ctx.parsed.x}% (${moduleStats[ctx.dataIndex]?.count || 0} proyectos)`
                            }
                        }
                    },
                    scales: {
                        x: { min: 0, max: 100, ticks: { callback: v => v + '%', color: '#8e8e93', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#ffffff', font: { size: 9.5, weight: '600' } }, grid: { display: false } }
                    }
                }
            });
        }

        // 5. Gráfica 3: Estado General del Portafolio (Doughnut)
        const ctxStatus = document.getElementById('statusChart')?.getContext('2d');
        if (ctxStatus) {
            if (window.statusChartInstance) window.statusChartInstance.destroy();
            window.statusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Completados', 'En Progreso', 'Pendientes', 'No Iniciados', 'Vencidos'],
                    datasets: [{
                        data: [c, p, pend, noIni, o],
                        backgroundColor: ['#30d158', '#0071e3', '#ff9f0a', '#48484a', '#ff453a'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#8e8e93', font: { size: 9.5, family: 'Inter' }, boxWidth: 10, padding: 8 } }
                    },
                    cutout: '72%'
                }
            });
        }
    };

    window.exportCSV = function() {
        let csv = "Tipo,Módulo,Empresas,Proyecto,Estado,Avance(%),Prioridad,Fecha Límite,Envío Propuesta,Autorización,Drive,Invgate,Consultores\n";
        const addRow = (t, m, p) => { 
            const comps = (window.getProjectCompanies(p) || []).join('; ');
            csv += `"${t}","${m}","${comps}","${p.name}","${p.status||'Pendiente'}","${p.progress||0}","${p.priority||1}","${p.deadline||''}","${p.clientDeliveryDate||''}","${p.clientReturnDate||''}","${p.driveLink||''}","${p.invgateLink||''}","${getProjectConsultants(p).join(', ')}"\n`; 
        };
        appData.directProjects.forEach(p => addRow('Directo', appData.directHub.name, p)); appData.modules.forEach(m => (m.projects||[]).forEach(p => addRow('Módulo', m.name, p)));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `sicom_reporte_${new Date().toISOString().slice(0,10)}.csv`; link.click();
    };
    
    window.exportData = function() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ appData, consultants, globalDocs }));
      const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `sicom_backup_${new Date().toISOString().slice(0,10)}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    };

    window.safeImportJSON = function() {
        if (confirm("⚠️ ADVERTENCIA DE SEGURIDAD:\n\nAl importar un archivo JSON se reemplazará el estado completo del sistema y se sincronizará con la nube.\n\n¿Estás seguro de que deseas continuar?")) {
            document.getElementById('importFile').click();
        }
    };

    window.safeForceCloudSync = async function() {
        const confirmation = prompt("⚠️ PELIGRO DE SOBREESCRITURA GLOBAL:\n\nEsta acción forzará los datos que tienes en este navegador hacia la base de datos central en la nube, sobreescribiendo cualquier cambio reciente realizado por otros usuarios concurrentes.\n\nPara confirmar esta acción crítica, escribe exactamente 'CONFIRMAR':");
        if (confirmation === 'CONFIRMAR') {
            await window.forceCloudSync();
        } else if (confirmation !== null) {
            window.showToast("Acción cancelada. No se alteró la nube.", false);
        }
    };

    window.importData = function(event) {
      const file = event.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if(imported.appData && imported.consultants) {
            appData = imported.appData; consultants = imported.consultants; if(imported.globalDocs) globalDocs = imported.globalDocs;
            ensureDataStructure(); window.saveData(true); refreshUI();
            window.showToast("Datos importados con éxito");
          }
        } catch (err) { window.showToast("Error al importar", true); }
      };
      reader.readAsText(file);
    };

    // Inicialización directa

// === LÓGICA DE ACTIVIDADES DIARIAS ===
window.toggleDailyDrawer = function() {
        const btnDaily = document.getElementById('btnDailyTasks');
        const btnManual = document.getElementById('btnManual');

        if(isDailyDrawerOpen) {
            document.getElementById('dailyDrawer').classList.add('-translate-x-full');
            isDailyDrawerOpen = false;
            
            // Restaurar botones al cerrar
            if (btnDaily) btnDaily.classList.remove('hidden');
            if (btnManual) btnManual.classList.remove('hidden');
        } else {
            if(isDrawerOpen) window.closeConfigDrawer();
            if(isPriorityDrawerOpen) window.closePriorityDrawer();
            if(isAlertsDrawerOpen) { document.getElementById('alertsDrawer').classList.add('translate-x-full'); isAlertsDrawerOpen = false; }
            if (window.innerWidth < 768) window.closeInfoCardSafe();
            document.getElementById('dailyDrawer').classList.remove('-translate-x-full');
            isDailyDrawerOpen = true;
            
            // Ocultar botones para limpiar la interfaz
            if (btnDaily) btnDaily.classList.add('hidden');
            if (btnManual) btnManual.classList.add('hidden');

            window.populateDailyAssignee();
            window.renderDailyTasks();
        }
    };

    // Parches de cierre automático para evitar colisiones visuales
    const ogOpenManual = window.openManual; window.openManual = function() { if (isDailyDrawerOpen) window.toggleDailyDrawer(); ogOpenManual(); };
    const ogOpenConfig = window.openConfigDrawer; window.openConfigDrawer = function() { if (isDailyDrawerOpen) window.toggleDailyDrawer(); ogOpenConfig(); };
    const ogOpenPriority = window.openPriorityDrawer; window.openPriorityDrawer = function() { if (isDailyDrawerOpen) window.toggleDailyDrawer(); ogOpenPriority(); };
    const ogToggleAlerts = window.toggleAlertsDrawer; window.toggleAlertsDrawer = function() { if (isDailyDrawerOpen && !isAlertsDrawerOpen) window.toggleDailyDrawer(); ogToggleAlerts(); };
    
    // Parches a Refresh y SaveData para mantener la vista sincronizada
    const ogRefreshUI = refreshUI; refreshUI = function() { ogRefreshUI(); if(isDailyDrawerOpen) window.renderDailyTasks(); };
    const ogSaveData = window.saveData; window.saveData = function(b) { ogSaveData(b); if(isDailyDrawerOpen) window.renderDailyTasks(); };

    window.populateDailyAssignee = function() {
        const sel = document.getElementById('newDailyTaskAssignee'); if (!sel) return;
        sel.innerHTML = '';
        if (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor') {
            sel.innerHTML = '<option value="">(Asignar a mí mismo)</option>';
            Object.keys(consultants).filter(k => consultants[k].role !== 'Lector').sort().forEach(c => { sel.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`; });
            sel.disabled = false;
        } else {
            sel.innerHTML = `<option value="${escapeHtml(localAuthor)}">Para: ${escapeHtml(localAuthor)}</option>`;
            sel.disabled = true;
        }
    };

    window.addDailyTask = function() {
        if (currentUserRole === 'Lector') return;
        const input = document.getElementById('newDailyTaskInput'); const text = input.value.trim(); if (!text) return;
        const assigneeSel = document.getElementById('newDailyTaskAssignee').value;
        const assignee = assigneeSel || localAuthor;
        const now = new Date();
        const assignDate = now.toLocaleDateString('es-MX');
        const assignTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        appData.dailyTasks = appData.dailyTasks || [];
        appData.dailyTasks.push({ 
            id: 'dt_' + Date.now(), 
            text: text, 
            assignee: assignee, 
            assignedBy: localAuthor, 
            assignDate: assignDate,
            assignTime: assignTime,
            date: assignDate, 
            done: false 
        });
        input.value = ''; 
        logActivity('daily', 'Actividades Diarias', `Asignó tarea diaria a ${assignee}: "${text}" (Asignada: ${assignDate} ${assignTime})`, localAuthor);
        window.saveData(false);
        window.renderDailyTasks();
    };

// NUEVAS FUNCIONES PARA EL SPEED DIAL DE ACTIVIDAD DIARIA
    window.openFastDailyTaskModal = function() {
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
        if (isAlertsDrawerOpen) window.toggleAlertsDrawer();
        
        document.getElementById('fdtDescription').value = '';
        document.getElementById('fastDailyTaskModal').classList.remove('hidden');
        setTimeout(() => document.getElementById('fastDailyTaskModal').classList.remove('opacity-0'), 10);
    }
    
    window.closeFastDailyTaskModal = function() {
        document.getElementById('fastDailyTaskModal').classList.add('opacity-0');
        setTimeout(() => document.getElementById('fastDailyTaskModal').classList.add('hidden'), 400);
    }

    window.saveFastDailyTask = function() {
        if (currentUserRole === 'Lector') return;
        const text = document.getElementById('fdtDescription').value.trim();
        if (!text) { window.showToast("La descripción es obligatoria", true); return; }
        
        const now = new Date();
        const assignDate = now.toLocaleDateString('es-MX');
        const assignTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        appData.dailyTasks = appData.dailyTasks || [];
        appData.dailyTasks.push({ 
            id: 'dt_' + Date.now(), 
            text: text, 
            assignee: localAuthor, 
            assignedBy: localAuthor, 
            assignDate: assignDate,
            assignTime: assignTime,
            date: assignDate, 
            done: false 
        });
        
        logActivity('daily', 'Actividades Diarias', `Se auto-asignó tarea diaria: "${text}" (Asignada: ${assignDate} ${assignTime})`, localAuthor);
        window.saveData(true);
        window.closeFastDailyTaskModal();
        if (isDailyDrawerOpen) window.renderDailyTasks();
    }

window.toggleDailyTask = function(taskId) {
        if (currentUserRole === 'Lector') return;
        const t = appData.dailyTasks.find(x => x.id === taskId);
        if (t) {
            const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
            const isAssigner = t.assignedBy === localAuthor;
            const now = new Date();
            const valDate = now.toLocaleDateString('es-MX');
            const valTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            
            if (t.done === true) {
                if (isSuper || isAssigner) {
                    t.done = false; 
                    delete t.feedback; delete t.validatedDate; delete t.validatedTime; delete t.validatedBy;
                    logActivity('daily', 'Actividades Diarias', `Reabrió tarea diaria de ${t.assignee||'consultor'}: "${t.text}"`, localAuthor);
                    window.saveData(false);
                    window.renderDailyTasks();
                }
            } else if (t.done === 'pending') {
                if (isSuper || isAssigner) {
                    t.done = true;
                    t.validatedDate = valDate; t.validatedTime = valTime; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
                    logActivity('daily', 'Actividades Diarias', `Validó tarea diaria de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor);
                    window.saveData(false);
                    window.renderDailyTasks();
                    window.triggerCelebration();
                } else if (t.assignee === localAuthor) {
                    t.done = false; delete t.feedback;
                    logActivity('daily', 'Actividades Diarias', `Canceló envío a validación: "${t.text}"`, localAuthor);
                    window.saveData(false);
                    window.renderDailyTasks();
                }
            } else {
                window.openTaskFeedbackModal(taskId, 'daily');
                setTimeout(() => window.renderDailyTasks(), 100);
            }
        }
    };

    window.deleteDailyTask = function(taskId) {
        const t = appData.dailyTasks.find(x => x.id === taskId); if (!t) return;
        // BLOQUEO ABSOLUTO: Ningún consultor puede borrar tareas de esta lista, ni siquiera las suyas.
        if (currentUserRole !== 'Supremo' && currentUserRole !== 'Supervisor') { 
            window.showToast("Solo Supervisores o Supremacia pueden borrar de la bitácora.", true); return; 
        }
        appData.dailyTasks = appData.dailyTasks.filter(x => x.id !== taskId); 
        logActivity('daily', 'Actividades Diarias', `Borró tarea: ${t.text}`, localAuthor);
        window.saveData(false);
    };

// === SISTEMA DE PESTAÑAS Y NOTIFICACIONES UNIFICADAS EN EL PANEL IZQUIERDO ===
let currentNotifTab = 'pending'; // 'alerts' | 'pending' | 'validation' | 'completed'

window.setNotifTab = function(tabName) {
    currentNotifTab = tabName;
    window.updateNotifTabsUI();
    window.renderDailyTasks();
};

window.updateNotifTabsUI = function() {
    const activeThemes = {
        alerts: 'bg-[#ff453a]/15 border-[#ff453a]/60 text-white shadow-[0_0_15px_rgba(255,69,58,0.25)] ring-1 ring-[#ff453a]/50',
        pending: 'bg-brand-accent/20 border-brand-accent text-white shadow-[0_0_15px_rgba(0,113,227,0.3)] ring-1 ring-brand-accent/50',
        validation: 'bg-[#ff9f0a]/15 border-[#ff9f0a]/60 text-white shadow-[0_0_15px_rgba(255,159,10,0.25)] ring-1 ring-[#ff9f0a]/50',
        completed: 'bg-[#30d158]/15 border-[#30d158]/60 text-white shadow-[0_0_15px_rgba(48,209,88,0.25)] ring-1 ring-[#30d158]/50'
    };
    const inactiveTheme = 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white shadow-sm';
    const baseClasses = 'p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-between text-left border cursor-pointer';

    ['alerts', 'pending', 'validation', 'completed'].forEach(t => {
        const btn = document.getElementById(`notifTabBtn-${t}`);
        if (!btn) return;
        const theme = (t === currentNotifTab) ? activeThemes[t] : inactiveTheme;
        btn.className = `${baseClasses} ${theme}`;
    });
};

// Helper universal para validar o rechazar cualquier tarea (diaria, global o de proyecto)
window.validateAnyTask = function(sourceType, strictType, projectId, taskId, approve) {
    if (sourceType === 'global') {
        window.validateGlobalTask(taskId, approve);
    } else if (sourceType === 'project') {
        window.validateProjectTask(strictType, projectId, taskId, approve);
    } else if (sourceType === 'daily') {
        const t = (appData.dailyTasks || []).find(x => x.id === taskId);
        if (t) {
            const now = new Date();
            const valDate = now.toLocaleDateString('es-MX');
            const valTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            t.done = approve ? true : false;
            if (approve) {
                t.validatedDate = valDate;
                t.validatedTime = valTime;
                t.validatedBy = localAuthor;
            } else {
                delete t.validatedDate;
                delete t.validatedTime;
                delete t.validatedBy;
                delete t.feedback;
            }
            const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
            logActivity('daily', 'Actividades Diarias', approve ? `Validó tarea diaria de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}` : `Rechazó o reabrió tarea diaria: "${t.text}"`, localAuthor);
            window.saveData(false);
            window.renderAlerts();
            window.renderDailyTasks();
            if (approve) window.triggerCelebration();
        }
    }
};

window.renderDailyTasks = function() {
    const container = document.getElementById('dailyTasksContainer'); 
    const badge = document.getElementById('dailyAlertsBadge');
    if (!container) return;

    window.updateNotifTabsUI();
    const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';

    // 1. RECOLECTOR MAESTRO DE TAREAS
    let allTasks = [];
    if (appData.dailyTasks) {
        appData.dailyTasks.forEach(t => allTasks.push({...t, sourceType: 'daily', pName: 'Tarea Diaria'}));
    }
    if (appData.globalTasks) {
        appData.globalTasks.forEach(t => allTasks.push({...t, sourceType: 'global', pName: 'Asignación Global'}));
    }
    if (appData.directProjects) {
        appData.directProjects.forEach(p => {
            if (p.tasks) p.tasks.forEach(t => allTasks.push({...t, sourceType: 'project', projectId: p.id, pName: p.name, strictType: 'direct-project'}));
        });
    }
    if (appData.modules) {
        appData.modules.forEach(m => {
            if (m.projects) {
                m.projects.forEach(p => {
                    if (p.tasks) p.tasks.forEach(t => allTasks.push({...t, sourceType: 'project', projectId: p.id, pName: p.name, strictType: 'project'}));
                });
            }
        });
    }

    // 2. ALERTAS (de proyectos vencidos, No Iniciados, etc. calculadas por renderAlerts)
    const alertsList = window.__lastAlerts || [];

    // 3. CLASIFICACIÓN DE TAREAS SEGÚN PERMISOS Y ESTADO
    const canViewTask = (t) => isSuper || t.assignee === localAuthor || t.assignedBy === localAuthor;
    const visibleTasks = allTasks.filter(canViewTask);

    const pendingTasks = visibleTasks.filter(t => t.done === false);
    const validationTasks = visibleTasks.filter(t => t.done === 'pending');
    const completedTasks = visibleTasks.filter(t => t.done === true);

    // 4. ACTUALIZACIÓN DE CONTADORES EN LAS PESTAÑAS
    const tabCounts = {
        alerts: alertsList.length,
        pending: pendingTasks.length,
        validation: validationTasks.length,
        completed: completedTasks.length
    };
    ['alerts', 'pending', 'validation', 'completed'].forEach(t => {
        const el = document.getElementById(`notifTabCount-${t}`);
        if (el) el.textContent = tabCounts[t];
    });

    // 5. GLOBO FLOTANTE DE ATENCIÓN (suma alertas críticas + validaciones pendientes + mis pendientes)
    let alertBadgeTotal = alertsList.length;
    if (isSuper) {
        alertBadgeTotal += validationTasks.length;
        alertBadgeTotal += pendingTasks.filter(t => t.assignee === localAuthor).length;
    } else {
        alertBadgeTotal += validationTasks.filter(t => t.assignedBy === localAuthor).length;
        alertBadgeTotal += pendingTasks.filter(t => t.assignee === localAuthor).length;
    }
    if (badge) {
        if (alertBadgeTotal > 0) {
            badge.textContent = alertBadgeTotal;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // 6. RENDERIZADO DEL CONTENIDO DE LA PESTAÑA SELECCIONADA

    // --- PESTAÑA A: ALERTAS IMPORTANTES ---
    if (currentNotifTab === 'alerts') {
        if (alertsList.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner mb-3.5">🎉</div>
                <h3 class="text-sm font-semibold text-white tracking-tight">¡Todo al día!</h3>
                <p class="text-xs text-gray-400 mt-1 max-w-[240px] leading-relaxed">No hay proyectos vencidos ni alertas importantes pendientes de atención.</p>
            </div>`;
            return;
        }

        const style = { 
            danger: ['text-[#ff453a]', 'bg-[#ff453a]/10', 'border-[#ff453a]/30'], 
            warning: ['text-[#ff9f0a]', 'bg-[#ff9f0a]/10', 'border-[#ff9f0a]/30'], 
            info: ['text-brand-accent', 'bg-brand-accent/10', 'border-brand-accent/30'],
            mention: ['text-[#64d2ff]', 'bg-[#0071e3]/15', 'border-[#0071e3]/40']
        };

        container.innerHTML = `
        <div class="space-y-3 pb-6">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest px-1">Alertamientos del Sistema (${alertsList.length})</p>
            ${alertsList.map(a => {
                const [txt, bg, br] = style[a.alertType] || style.info;
                const users = (a.users && a.users.length > 0) ? (Array.isArray(a.users) ? a.users.join(', ') : a.users) : 'Sin asignar';
                const canOpen = a.pType && a.pType !== 'global';
                const click = canOpen ? ` onclick="window.selectNode('${jsArg(a.pType)}', '${jsArg(a.id)}'); window.toggleDailyDrawer();"` : '';
                return `
                <div class="${bg} border ${br} rounded-2xl p-4 ${canOpen ? 'cursor-pointer hover:opacity-85' : 'cursor-default'} transition shadow-inner" ${click} title="${canOpen ? 'Clic para ir al proyecto' : ''}">
                    <div class="flex items-start gap-2.5">
                        <span class="text-lg leading-none mt-0.5">${a.icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2">
                                <h4 class="text-xs font-semibold ${txt} leading-tight truncate">${escapeHtml(a.name)}</h4>
                                ${canOpen ? `<span class="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded border border-white/5 shrink-0">Ver en mapa ↗</span>` : ''}
                            </div>
                            <p class="text-[9px] text-gray-400 uppercase tracking-widest truncate mt-0.5">└ ${escapeHtml(a.parentName || 'Proyectos')}</p>
                            <p class="text-[10px] ${txt} mt-2 leading-snug break-words">${escapeHtml(a.reason)}</p>
                            <div class="flex items-center gap-2 mt-2 flex-wrap text-[9px] text-gray-400 font-mono">
                                <span class="bg-black/40 px-2 py-0.5 rounded border border-white/5">👤 ${escapeHtml(users)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
        return;
    }

    // --- PESTAÑA B: PENDIENTES (DESPLEGABLES POR CONSULTOR) ---
    if (currentNotifTab === 'pending') {
        if (pendingTasks.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner mb-3.5">📋</div>
                <h3 class="text-sm font-semibold text-white tracking-tight">Bandeja despejada</h3>
                <p class="text-xs text-gray-400 mt-1 max-w-[240px] leading-relaxed">No tienes tareas pendientes asignadas en este momento.</p>
                <div class="mt-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">💡 Usa el formulario superior para anotar tareas rápidas</div>
            </div>`;
            return;
        }

        // Agrupar por consultor asignado
        let grouped = {};
        pendingTasks.forEach(t => {
            const key = t.assignee || 'Sin Asignar';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });

        // Ordenar: primero yo, luego alfabéticamente
        const sortedConsultants = Object.keys(grouped).sort((a, b) => {
            if (a === localAuthor) return -1;
            if (b === localAuthor) return 1;
            return a.localeCompare(b);
        });

        container.innerHTML = `<div class="space-y-3 pb-6">${sortedConsultants.map(cons => {
            const tasks = grouped[cons].sort((a, b) => (parseInt(b.id.split('_')[1]) || 0) - (parseInt(a.id.split('_')[1]) || 0));
            const cData = consultants[cons] || { color: '#8e8e93' };
            const isMe = cons === localAuthor;

            return `
            <details open class="group bg-black/30 border border-white/10 rounded-2xl overflow-hidden transition shadow-inner">
                <summary class="flex justify-between items-center cursor-pointer p-3.5 select-none hover:bg-white/5 transition list-none [&::-webkit-details-marker]:hidden">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_${cData.color}] border border-white/20 shrink-0" style="background-color: ${cData.color}"></span>
                        <span class="text-xs font-bold uppercase tracking-wider truncate" style="color: ${cData.color}">${escapeHtml(cons)} ${isMe ? '(Mis Tareas)' : ''}</span>
                        <span class="text-[9px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono shrink-0">${tasks.length} pdtes.</span>
                    </div>
                    <svg class="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <div class="p-3 space-y-2.5 border-t border-white/10 bg-black/20">
                    ${tasks.map(t => {
                        const isMyTask = t.assignee === localAuthor;
                        const isAssigner = t.assignedBy === localAuthor;
                        const canEdit = isSuper || isMyTask || isAssigner;
                        const canDel = (isSuper || isAssigner) && t.sourceType === 'daily';

                        let toggleAction = `toggleDailyTask('${t.id}')`;
                        let openAction = '';
                        if (t.sourceType === 'global') toggleAction = `validateGlobalTask('${t.id}', true)`;
                        if (t.sourceType === 'project') toggleAction = `toggleQuickTask('${t.id}', '${t.projectId}')`;
                        if (t.sourceType === 'project' || t.sourceType === 'global') {
                            openAction = t.sourceType === 'project' ? `window.selectNode('${t.strictType}', '${t.projectId}'); window.toggleDailyDrawer();` : `window.openProjectTaskModal();`;
                        }

                        let srcColor = t.sourceType === 'daily' ? 'text-[#35aee8]' : (t.sourceType === 'global' ? 'text-[#bf5af2]' : 'text-[#ff9f0a]');

                        return `
                        <div class="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 group transition shadow-inner" onclick="if(!event.target.closest('input') && !event.target.closest('button') && '${openAction}'!=='') { ${openAction} }">
                            <input type="checkbox" onchange="${t.sourceType === 'global' ? `completeGlobalTask('${t.id}')` : toggleAction}" class="rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4 shrink-0 mt-0.5 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}" ${!canEdit ? 'disabled' : ''} title="Marcar para completar">
                            <div class="flex flex-col flex-1 min-w-0 ${openAction !== '' ? 'cursor-pointer' : ''}">
                                <span class="text-xs text-white break-words leading-snug">${escapeHtml(t.text)}</span>
                                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span class="text-[9px] ${srcColor} font-semibold">${escapeHtml(t.pName)}</span>
                                    ${(t.assignDate || t.date) ? `<span class="text-[9px] text-gray-400 font-mono">📅 Asignada: ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                                    ${t.deadline ? `<span class="text-[9px] text-[#ff9f0a] font-mono">⏱ Límite: ${escapeHtml(t.deadline)}</span>` : ''}
                                    ${t.assignedBy && t.assignedBy !== t.assignee ? `<span class="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded shadow-inner border border-white/5">De: ${escapeHtml(t.assignedBy)}</span>` : ''}
                                </div>
                            </div>
                            ${canDel ? `<button onclick="deleteDailyTask('${t.id}')" class="text-gray-500 hover:text-[#ff453a] opacity-0 group-hover:opacity-100 transition p-1 shrink-0" title="Borrar tarea"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </details>`;
        }).join('')}</div>`;
        return;
    }

    // --- PESTAÑA C: EN VALIDACIÓN ---
    if (currentNotifTab === 'validation') {
        if (validationTasks.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner mb-3.5">⏳</div>
                <h3 class="text-sm font-semibold text-white tracking-tight">Sin entregas pendientes</h3>
                <p class="text-xs text-gray-400 mt-1 max-w-[240px] leading-relaxed">No hay tareas esperando revisión o visto bueno de jefatura.</p>
            </div>`;
            return;
        }

        container.innerHTML = `
        <div class="space-y-3 pb-6">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest px-1">Esperando Aprobación de Jefatura (${validationTasks.length})</p>
            ${validationTasks.map(t => {
                const isAssigner = t.assignedBy === localAuthor;
                const canApprove = isSuper || isAssigner;
                const isMyTask = t.assignee === localAuthor;

                let srcColor = t.sourceType === 'daily' ? 'text-[#35aee8]' : (t.sourceType === 'global' ? 'text-[#bf5af2]' : 'text-[#ff9f0a]');

                return `
                <div class="bg-[#ff9f0a]/5 border border-[#ff9f0a]/30 rounded-2xl p-4 shadow-inner">
                    <div class="flex items-start justify-between gap-2">
                        <span class="text-xs text-white font-medium break-words">${escapeHtml(t.text)}</span>
                        <span class="text-[8px] bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 px-1.5 py-0.5 rounded font-bold uppercase shadow-inner shrink-0">⏳ En Validación</span>
                    </div>

                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                        <span class="text-[9px] ${srcColor} font-semibold">${escapeHtml(t.pName)}</span>
                        <span class="text-[9px] text-gray-300 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">👤 Por: ${escapeHtml(t.assignee || 'Sin asignar')}</span>
                        ${(t.assignDate || t.date) ? `<span class="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">📅 Asignada: ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                        ${t.submittedDate ? `<span class="text-[9px] text-[#ff9f0a] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">🚀 Entregada: ${escapeHtml(t.submittedDate)}${t.submittedTime ? ' ' + escapeHtml(t.submittedTime) : ''}</span>` : ''}
                        ${t.assignedBy ? `<span class="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">Asignó: ${escapeHtml(t.assignedBy)}</span>` : ''}
                    </div>

                    ${t.feedback ? `<div class="mt-2.5 text-[10px] text-gray-200 bg-black/60 border border-white/10 p-2.5 rounded-xl shadow-inner break-words">💬 <b>Evidencia registrada:</b> ${escapeHtml(t.feedback)}</div>` : ''}

                    <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        ${canApprove ? `
                            <div class="flex gap-2 w-full">
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', true)" class="flex-1 py-1.5 px-3 bg-[#30d158]/20 hover:bg-[#30d158]/30 text-[#30d158] border border-[#30d158]/30 font-bold text-[10px] rounded-xl transition shadow-inner flex items-center justify-center gap-1">
                                    ✅ Aprobar
                                </button>
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)" class="flex-1 py-1.5 px-3 bg-[#ff453a]/20 hover:bg-[#ff453a]/30 text-[#ff453a] border border-[#ff453a]/30 font-bold text-[10px] rounded-xl transition shadow-inner flex items-center justify-center gap-1">
                                    ❌ Rechazar
                                </button>
                            </div>
                        ` : (isMyTask ? `
                            <div class="flex items-center justify-between w-full">
                                <span class="text-[9px] text-gray-400 italic">Esperando que un supervisor valide tu entrega...</span>
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)" class="py-1 px-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[9px] rounded-lg transition">Cancelar envío</button>
                            </div>
                        ` : '<span class="text-[9px] text-gray-500 italic">Pendiente de revisión</span>')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
        return;
    }

    // --- PESTAÑA D: COMPLETADAS / HECHAS ---
    if (currentNotifTab === 'completed') {
        if (completedTasks.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner mb-3.5">✅</div>
                <h3 class="text-sm font-semibold text-white tracking-tight">Sin historial reciente</h3>
                <p class="text-xs text-gray-400 mt-1 max-w-[240px] leading-relaxed">Las tareas que completes y valides aparecerán organizadas aquí.</p>
            </div>`;
            return;
        }

        let grouped = {};
        completedTasks.forEach(t => {
            const key = t.assignee || 'Sin Asignar';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });

        const sortedConsultants = Object.keys(grouped).sort((a, b) => {
            if (a === localAuthor) return -1;
            if (b === localAuthor) return 1;
            return a.localeCompare(b);
        });

        container.innerHTML = `<div class="space-y-3 pb-6">${sortedConsultants.map(cons => {
            const tasks = grouped[cons].sort((a, b) => (parseInt(b.id.split('_')[1]) || 0) - (parseInt(a.id.split('_')[1]) || 0));
            const cData = consultants[cons] || { color: '#8e8e93' };

            return `
            <details class="group bg-black/25 border border-white/10 rounded-2xl overflow-hidden transition shadow-inner">
                <summary class="flex justify-between items-center cursor-pointer p-3.5 select-none hover:bg-white/5 transition list-none [&::-webkit-details-marker]:hidden">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_${cData.color}] border border-white/20 shrink-0" style="background-color: ${cData.color}"></span>
                        <span class="text-xs font-bold uppercase tracking-wider truncate" style="color: ${cData.color}">${escapeHtml(cons)}</span>
                        <span class="text-[9px] bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 px-2 py-0.5 rounded-full font-mono shrink-0">${tasks.length} hechas ✅</span>
                    </div>
                    <svg class="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <div class="p-3 space-y-2 border-t border-white/10 bg-black/20">
                    ${tasks.map(t => {
                        const canRevert = isSuper || t.assignedBy === localAuthor;
                        return `
                        <div class="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5 opacity-80 hover:opacity-100 transition shadow-inner">
                            <input type="checkbox" checked onchange="${canRevert ? `validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)` : ''}" class="rounded border-[#30d158] bg-[#30d158]/20 text-[#30d158] h-4 w-4 shrink-0 mt-0.5 ${canRevert ? 'cursor-pointer' : 'cursor-not-allowed'}" ${!canRevert ? 'disabled' : ''} title="${canRevert ? 'Click para reabrir tarea' : 'Completada'}">
                            <div class="flex flex-col flex-1 min-w-0">
                                <span class="text-xs text-gray-300 line-through break-words">${escapeHtml(t.text)}</span>
                                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span class="text-[9px] text-gray-400 font-semibold">${escapeHtml(t.pName)}</span>
                                    ${(t.assignDate || t.date) ? `<span class="text-[9px] text-gray-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded">📅 Asignada: ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                                    <span class="text-[9px] text-[#30d158] font-mono font-bold bg-[#30d158]/15 border border-[#30d158]/30 px-2 py-0.5 rounded">✅ Validada: ${escapeHtml(t.validatedDate || t.date || 'S/F')}${t.validatedTime ? ' ' + escapeHtml(t.validatedTime) : ''}${t.validatedBy ? ' por ' + escapeHtml(t.validatedBy) : ''}</span>
                                </div>
                                ${t.feedback ? `<div class="mt-1.5 text-[9px] text-gray-400 bg-black/60 p-2 rounded-lg border border-white/5">💬 <i>${escapeHtml(t.feedback)}</i></div>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </details>`;
        }).join('')}</div>`;
        return;
    }
};

// Cada vez que se recalculan las alertas, se refresca el panel
const baseRenderAlerts = window.renderAlerts;
window.renderAlerts = function() {
    baseRenderAlerts();
    window.renderDailyTasks();
};


// === LÓGICA DE FILTROS AVANZADOS Y MODO ENFOQUE ===
    window.toggleFilterDrawer = function() {
        if(isFilterDrawerOpen) {
            document.getElementById('filterDrawer').classList.add('translate-x-full');
            isFilterDrawerOpen = false;
        } else {
            if(isDrawerOpen) window.closeConfigDrawer();
            if(isPriorityDrawerOpen) window.closePriorityDrawer();
            if(isAlertsDrawerOpen) window.toggleAlertsDrawer();
            document.getElementById('filterDrawer').classList.remove('translate-x-full');
            isFilterDrawerOpen = true;
            window.populateAdvFilters();
        }
    };

    // === CHIPS DE MULTISELECCIÓN EN FILTROS AVANZADOS ===
    window.renderFilterChips = function() {
        // 1. Consultores
        const consContainer = document.getElementById('advFilterConsultantChips');
        if (consContainer) {
            const allC = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector');
            const isAllSelected = activeFilterConsultants.includes('ALL') || activeFilterConsultants.length === 0;
            
            let html = `<button type="button" onclick="toggleFilterChip('consultant', 'ALL')" class="filter-chip ${isAllSelected ? 'active' : ''}">👥 Todos</button>`;
            
            allC.forEach(name => {
                const isAct = !isAllSelected && activeFilterConsultants.includes(name);
                const cColor = consultants[name]?.color || '#0071e3';
                html += `<button type="button" onclick="toggleFilterChip('consultant', '${escapeHtml(name)}')" class="filter-chip ${isAct ? 'active' : ''}">
                    <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${cColor}; box-shadow: 0 0 5px ${cColor};"></span>
                    <span>${escapeHtml(name)}</span>
                </button>`;
            });
            consContainer.innerHTML = html;
        }

        // 2. Empresas Destino
        const compContainer = document.getElementById('advFilterCompanyChips');
        if (compContainer) {
            const allComps = window.getAllKnownCompanies ? window.getAllKnownCompanies() : ['AFR', 'AVM', 'TEO', 'TNO', 'ZIN', 'GENERAL'];
            const isAllSelected = activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0;

            let html = `<button type="button" onclick="toggleFilterChip('company', 'ALL')" class="filter-chip ${isAllSelected ? 'active' : ''}">🏢 Todas</button>`;

            allComps.forEach(comp => {
                const isAct = !isAllSelected && activeFilterCompanies.includes(comp);
                html += `<button type="button" onclick="toggleFilterChip('company', '${escapeHtml(comp)}')" class="filter-chip ${isAct ? 'active' : ''}">
                    <span>${escapeHtml(comp)}</span>
                </button>`;
            });
            compContainer.innerHTML = html;
        }

        // 3. Estatus
        const statusContainer = document.getElementById('advFilterStatusChips');
        if (statusContainer) {
            const statuses = [
                { id: 'ALL', label: '🌐 Todos' },
                { id: 'No Iniciado', label: '⏸️ No Iniciado' },
                { id: 'Pendiente', label: '⏳ Pendiente' },
                { id: 'En Progreso', label: '🚀 En Progreso' },
                { id: 'Completado', label: '✅ Completado' }
            ];
            const isAllSelected = activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0;

            let html = '';
            statuses.forEach(st => {
                const isAct = (st.id === 'ALL' && isAllSelected) || (!isAllSelected && activeFilterStatuses.includes(st.id));
                html += `<button type="button" onclick="toggleFilterChip('status', '${escapeHtml(st.id)}')" class="filter-chip ${isAct ? 'active' : ''}">
                    <span>${escapeHtml(st.label)}</span>
                </button>`;
            });
            statusContainer.innerHTML = html;
        }
    };

    window.toggleFilterChip = function(type, val) {
        if (type === 'consultant') {
            if (val === 'ALL') {
                activeFilterConsultants = ['ALL'];
            } else {
                activeFilterConsultants = activeFilterConsultants.filter(x => x !== 'ALL');
                if (activeFilterConsultants.includes(val)) {
                    activeFilterConsultants = activeFilterConsultants.filter(x => x !== val);
                    if (activeFilterConsultants.length === 0) activeFilterConsultants = ['ALL'];
                } else {
                    activeFilterConsultants.push(val);
                }
            }
            activeFilterConsultant = activeFilterConsultants[0] || 'ALL';
        } else if (type === 'company') {
            if (val === 'ALL') {
                activeFilterCompanies = ['ALL'];
            } else {
                activeFilterCompanies = activeFilterCompanies.filter(x => x !== 'ALL');
                if (activeFilterCompanies.includes(val)) {
                    activeFilterCompanies = activeFilterCompanies.filter(x => x !== val);
                    if (activeFilterCompanies.length === 0) activeFilterCompanies = ['ALL'];
                } else {
                    activeFilterCompanies.push(val);
                }
            }
            activeFilterCompany = activeFilterCompanies[0] || 'ALL';
        } else if (type === 'status') {
            if (val === 'ALL') {
                activeFilterStatuses = ['ALL'];
            } else {
                activeFilterStatuses = activeFilterStatuses.filter(x => x !== 'ALL');
                if (activeFilterStatuses.includes(val)) {
                    activeFilterStatuses = activeFilterStatuses.filter(x => x !== val);
                    if (activeFilterStatuses.length === 0) activeFilterStatuses = ['ALL'];
                } else {
                    activeFilterStatuses.push(val);
                }
            }
            activeFilterStatus = activeFilterStatuses[0] || 'ALL';
        }
        
        window.renderFilterChips();
        window.handleAdvFilter();
    };

    window.populateAdvFilters = function() {
        const modSel = document.getElementById('advFilterModule');
        if (modSel) {
            modSel.innerHTML = `<option value="ALL">Todos los módulos</option><option value="direct-hub">⚡ ${escapeHtml(appData.directHub.name)}</option>` + (appData.modules || []).map(m => `<option value="${m.id}">📦 ${escapeHtml(m.name)}</option>`).join('');
            modSel.value = activeFilterModule;
        }
        
        const urgSel = document.getElementById('advFilterUrgency');
        if (urgSel) urgSel.value = activeFilterUrgency;
        const prioSel = document.getElementById('advFilterPriority');
        if (prioSel) prioSel.value = activeFilterPriority;
        const botSel = document.getElementById('advFilterBottleneck');
        if (botSel) botSel.value = activeFilterBottleneck;

        window.renderFilterChips();
    };

    window.handleAdvFilter = function() {
        const modSel = document.getElementById('advFilterModule');
        if (modSel) activeFilterModule = modSel.value;
        const urgSel = document.getElementById('advFilterUrgency');
        if (urgSel) activeFilterUrgency = urgSel.value;
        const prioSel = document.getElementById('advFilterPriority');
        if (prioSel) activeFilterPriority = prioSel.value;
        const botSel = document.getElementById('advFilterBottleneck');
        if (botSel) activeFilterBottleneck = botSel.value;
        
        let c = 0;
        if (activeFilterModule !== 'ALL') c++;
        if (!activeFilterConsultants.includes('ALL') && activeFilterConsultants.length > 0) c += activeFilterConsultants.length;
        if (!activeFilterStatuses.includes('ALL') && activeFilterStatuses.length > 0) c += activeFilterStatuses.length;
        if (!activeFilterCompanies.includes('ALL') && activeFilterCompanies.length > 0) c += activeFilterCompanies.length;
        if (activeFilterUrgency !== 'ALL') c++;
        if (activeFilterPriority !== 'ALL') c++;
        if (activeFilterBottleneck !== 'ALL') c++;
        
        const badge = document.getElementById('activeFiltersBadge');
        if (badge) {
            if (c > 0) { badge.textContent = c; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }
        }
        
        if (isFocusMode) window.toggleFocusMode(); // Si usas filtros manuales, apaga el enfoque
        else window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
    };

    window.resetAdvFilters = function() {
        activeFilterModule = 'ALL';
        activeFilterConsultants = ['ALL'];
        activeFilterStatuses = ['ALL'];
        activeFilterCompanies = ['ALL'];
        activeFilterConsultant = 'ALL';
        activeFilterStatus = 'ALL';
        activeFilterCompany = 'ALL';
        activeFilterUrgency = 'ALL';
        activeFilterPriority = 'ALL';
        activeFilterBottleneck = 'ALL';
        
        const badge = document.getElementById('activeFiltersBadge');
        if (badge) badge.classList.add('hidden');
        
        // Apaga el Modo Enfoque si estaba encendido al limpiar filtros
        if (isFocusMode) {
            isFocusMode = false;
            const btn = document.getElementById('btnFocusMode');
            if (btn) {
                btn.classList.remove('bg-[#bf5af2]/20', 'border-[#bf5af2]/50', 'text-[#bf5af2]');
                btn.classList.add('bg-white/5', 'border-white/10', 'text-gray-400');
            }
        }
        
        window.populateAdvFilters(); 
        window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
    };

    // === GESTIÓN DE COLAPSO Y EXPANSIÓN INTELIGENTE DE MÓDULOS ===
    window.toggleModuleCollapse = function(modId) {
        if (collapsedModules.has(modId)) {
            collapsedModules.delete(modId);
        } else {
            collapsedModules.add(modId);
        }
        window.updateCollapseAllButtonState();
        window.renderMindMap();
    };

    window.collapseAllModules = function() {
        const allModIds = ['hub-direct', ...(appData.modules || []).map(m => m.id)];
        allModIds.forEach(id => collapsedModules.add(id));
        window.updateCollapseAllButtonState();
        window.renderMindMap();
        window.showToast('Módulos colapsados para vista panorámica');
    };

    window.expandAllModules = function() {
        collapsedModules.clear();
        window.updateCollapseAllButtonState();
        window.renderMindMap();
        window.showToast('Todos los módulos expandidos');
    };

    window.toggleAllModulesCollapse = function() {
        const totalModules = 1 + (appData.modules || []).length;
        if (collapsedModules.size >= Math.ceil(totalModules / 2)) {
            window.expandAllModules();
        } else {
            window.collapseAllModules();
        }
    };

    window.updateCollapseAllButtonState = function() {
        const totalModules = 1 + (appData.modules || []).length;
        const isMostlyCollapsed = collapsedModules.size >= Math.ceil(totalModules / 2);
        const txt = document.getElementById('textCollapseAll') || document.getElementById('btnToggleCollapseAllText');
        const mTxt = document.getElementById('mobileToggleCollapseText');
        const label = isMostlyCollapsed ? 'Expandir Todo' : 'Colapsar Todo';
        if (txt) txt.textContent = label;
        if (mTxt) mTxt.textContent = label;
    };

    window.toggleFocusMode = function() {
        isFocusMode = !isFocusMode;
        const btn = document.getElementById('btnFocusMode');
        if (isFocusMode) {
            btn.classList.add('bg-[#bf5af2]/20', 'border-[#bf5af2]/50', 'text-[#bf5af2]');
            btn.classList.remove('bg-white/5', 'border-white/10', 'text-gray-400');
            window.showToast("Modo Enfoque: Mostrando Riesgos", false);
        } else {
            btn.classList.remove('bg-[#bf5af2]/20', 'border-[#bf5af2]/50', 'text-[#bf5af2]');
            btn.classList.add('bg-white/5', 'border-white/10', 'text-gray-400');
        }
        window.renderMindMap();
    };

    window.toggleSecondaryLinks = function() {
        showAllSecondaryLinks = !showAllSecondaryLinks;
        document.body.classList.toggle('show-all-sec-links', showAllSecondaryLinks);
        const btn = document.getElementById('btnToggleLinks');
        const mText = document.getElementById('mobileToggleLinksText');
        if (btn) {
            if (showAllSecondaryLinks) {
                btn.classList.add('bg-[#0071e3]/20', 'border-[#0071e3]/60', 'text-[#38bdf8]', 'shadow-[0_0_12px_rgba(0,113,227,0.35)]');
                btn.classList.remove('bg-white/5', 'border-white/10', 'text-gray-400');
                if (mText) mText.textContent = "Vínculos Multimódulo: On";
                window.showToast("🔗 Mostrando todos los vínculos multimódulo", false);
            } else {
                btn.classList.remove('bg-[#0071e3]/20', 'border-[#0071e3]/60', 'text-[#38bdf8]', 'shadow-[0_0_12px_rgba(0,113,227,0.35)]');
                btn.classList.add('bg-white/5', 'border-white/10', 'text-gray-400');
                if (mText) mText.textContent = "Vínculos Multimódulo: Off";
                window.showToast("🔗 Vínculos en modo inteligente (hover/selección)", false);
            }
        }
        window.renderMindMap();
    };

    // Fondo cósmico de la Nebulosa de Orión renderizado de forma ultraligera y nítida en el DOM
    initData();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isPanning && !isTouchActive) {
                window.updateCanvasTransform();
            }
        }, 150);
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (!isPanning && !isTouchActive) {
                window.recenterCanvas();
            }
        }, 250);
    });
