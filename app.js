const escapeHtml = (u) => { if (!u) return ''; return u.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
    // Escapa un valor para usarlo como argumento string en un handler inline: onclick="fn('${jsArg(valor)}')"
    const jsArg = (u) => escapeHtml((u == null ? '' : String(u)).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' '));
    
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
    let initialCollapseApplied = false;
    let initialCloudCollapseApplied = false;
    let cameraAnimId = null;
    let lastExpandedModuleId = null;
    let prevModulePositions = new Map();
    let prevCorePaths = new Map();
    let consultantFilterMode = 'ANY';
    let moduleFilterMode = 'ANY'; // 'ANY' | 'CORRELATED'
    const normModId = (id) => (id === 'direct-hub' || id === 'DIRECT' || id === 'hub-direct') ? 'hub-direct' : String(id || '');
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

    const defaultTestingData = {"directHub":{"id":"hub-direct","name":"PROYECTOS DIRECTOS SICOM","color":"#f59e0b"},"directProjects":[{"deadline":"2026-10-13","driveLink":"","notes":"","tasks":[],"docs":{"doc_1791192995498":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193015065":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193027382":{"checked":true,"obs":"","na":false,"naValidated":false}},"clientReturnDate":"2026-10-06","id":"dp1","_renderData":{"x":-840,"y":-412.5,"color":"#f97316","type":"direct-project"},"priority":3,"invgateLink":"","name":"Implementación ATN","clientDeliveryDate":"2026-10-21","progress":33,"status":"No Iniciado","consultants":["Emmanuel Sánchez"]},{"progress":0,"notes":"","tasks":[],"docs":{"doc_1791193015065":{"checked":false,"na":false,"obs":"","naValidated":false},"doc_1791193027382":{"checked":false,"naValidated":false,"na":false,"obs":""},"doc_1791192995498":{"naValidated":false,"obs":"","na":false,"checked":false}},"id":"dp2","_renderData":{"x":-840,"y":-337.5,"color":"#f97316","type":"direct-project"},"clientDeliveryDate":"","status":"No Iniciado","consultants":["Emmanuel Sánchez"],"clientReturnDate":"","deadline":"","name":"Boletos por SMS","priority":8}],"history":[],"core":{"id":"sicom","name":"SICOM"},"modules":[{"name":"COM","id":"m1","projects":[{"consultants":["Óscar González"],"docs":{},"status":"Pendiente","progress":0,"tasks":[],"priority":1,"deadline":"","_renderData":{"x":-840,"y":-262.5,"color":"#10b981","type":"project"},"name":"Flechamigo","id":"p1"},{"clientDeliveryDate":"2026-10-13","docs":{"doc_1791193015065":{"obs":"","checked":false,"naValidated":false,"na":false},"doc_1791192995498":{"naValidated":false,"na":false,"checked":false,"obs":""},"doc_1791193027382":{"obs":"","na":false,"checked":false,"naValidated":false}},"notes":"seguimiento","tasks":[],"deadline":"2026-10-14","consultants":["Óscar González"],"driveLink":"","progress":0,"id":"p2","_renderData":{"x":-840,"y":-187.5,"color":"#10b981","type":"project"},"priority":3,"name":"Versión Paytech","invgateLink":"","clientReturnDate":"2026-10-08","status":"En Progreso"},{"id":"p3","deadline":"","name":"Versión CPU","consultants":["Óscar González"],"priority":3,"_renderData":{"x":-840,"y":-112.5,"color":"#10b981","type":"project"},"status":"Pendiente","docs":{},"tasks":[],"progress":0},{"progress":0,"name":"OV Dinámica","_renderData":{"x":-840,"y":-37.5,"color":"#10b981","type":"project"},"id":"p4","consultants":["Óscar González"],"docs":{},"tasks":[],"status":"Pendiente","deadline":"","priority":3},{"status":"Pendiente","id":"p5","consultants":["Óscar González"],"progress":0,"name":"Separación Destinos Fav.","_renderData":{"x":-840,"y":37.5,"color":"#10b981","type":"project"},"deadline":"","priority":4,"docs":{},"tasks":[]}],"color":"#0071e3"},{"name":"CONTROLES VOLUMÉTRICOS","id":"m2","projects":[{"clientReturnDate":"","consultants":["Osvaldo Avilés"],"progress":0,"id":"p6","name":"Gestión Web / Competencia","priority":1,"deadline":"2027-01-01","clientDeliveryDate":"","status":"En Progreso","tasks":[],"docs":{"doc_1791193027382":{"naValidated":false,"na":false,"obs":"","checked":false},"doc_1791192995498":{"na":false,"obs":"","checked":false,"naValidated":false},"doc_1791193015065":{"na":false,"naValidated":false,"checked":false,"obs":""}},"_renderData":{"x":840,"y":-412.5,"color":"#7eaefb","type":"project"}},{"id":"p7","notes":"","clientReturnDate":"","deadline":"","clientDeliveryDate":"","tasks":[],"docs":{"doc_1791193015065":{"checked":false,"naValidated":false,"obs":"","na":false},"doc_1791193027382":{"obs":"","checked":false,"naValidated":false,"na":false},"doc_1791192995498":{"naValidated":false,"checked":false,"na":false,"obs":""}},"driveLink":"","_renderData":{"x":840,"y":-337.5,"color":"url(#grad-5ac8fa-a855f7-7eaefb)","type":"project"},"invgateLink":"","name":"Pantallas Volumétricos","priority":1,"progress":0,"status":"Pendiente","consultants":["Manuel Gutierrez","Rafael Romero","Osvaldo Avilés"]},{"_renderData":{"x":840,"y":-262.5,"color":"#7eaefb","type":"project"},"id":"p8","status":"Pendiente","progress":0,"docs":{},"tasks":[],"deadline":"","priority":2,"consultants":["Osvaldo Avilés"],"name":"Carta Porte"},{"docs":{},"tasks":[],"deadline":"","priority":3,"_renderData":{"x":840,"y":-187.5,"color":"#7eaefb","type":"project"},"name":"Versión .NET","status":"Pendiente","consultants":["Osvaldo Avilés"],"id":"p9","progress":0},{"progress":0,"name":"Reporte P.H.","_renderData":{"x":840,"y":-112.5,"color":"#7eaefb","type":"project"},"docs":{},"tasks":[],"status":"Pendiente","consultants":["Osvaldo Avilés"],"deadline":"","id":"p10","priority":4},{"progress":0,"id":"p11","_renderData":{"x":840,"y":-37.5,"color":"#7eaefb","type":"project"},"name":"Tabla Int.","status":"Pendiente","priority":5,"docs":{},"tasks":[],"consultants":["Osvaldo Avilés"],"deadline":""}],"color":"#30d158"},{"color":"#bf5af2","projects":[{"consultants":["Emmanuel Sánchez"],"name":"Correcciones Panel","deadline":"","priority":1,"progress":0,"docs":{},"tasks":[],"status":"Pendiente","_renderData":{"x":-840,"y":112.5,"color":"#f97316","type":"project"},"id":"p12"},{"status":"Pendiente","name":"Contador Pasajeros COP COM","notes":"","deadline":"","clientReturnDate":"","id":"p13","consultants":["Emmanuel Sánchez"],"progress":0,"driveLink":"","tasks":[],"docs":{"doc_1791192995498":{"checked":false,"obs":"","na":false,"naValidated":false},"doc_1791193027382":{"naValidated":false,"checked":false,"na":false,"obs":""},"doc_1791193015065":{"checked":false,"naValidated":false,"obs":"","na":false}},"_renderData":{"x":-840,"y":187.5,"color":"#f97316","type":"project"},"invgateLink":"","priority":2,"clientDeliveryDate":""},{"id":"p14","consultants":["Emmanuel Sánchez"],"name":"Fase 2 ATR","progress":0,"_renderData":{"x":-840,"y":262.5,"color":"#f97316","type":"project"},"status":"Pendiente","deadline":"","priority":5,"docs":{},"tasks":[]},{"priority":6,"deadline":"","name":"Implementación AVM","_renderData":{"x":-840,"y":337.5,"color":"#f97316","type":"project"},"docs":{},"tasks":[],"status":"Pendiente","progress":0,"consultants":["Emmanuel Sánchez"],"id":"p15"},{"priority":9,"deadline":"","id":"p16","docs":{},"tasks":[],"status":"Pendiente","consultants":["Emmanuel Sánchez"],"_renderData":{"x":-840,"y":412.5,"color":"#f97316","type":"project"},"name":"Requerimientos TEO","progress":0}],"id":"m3","name":"PORTAL OPERATIVO"},{"name":"PANTALLAS EN TERMINAL","id":"m4","color":"#ff453a","projects":[{"consultants":["Emmanuel Sánchez"],"docs":{},"tasks":[],"id":"p17","progress":0,"deadline":"","status":"Pendiente","priority":4,"_renderData":{"x":840,"y":37.5,"color":"#f97316","type":"project"},"name":"Pantalla a Público"},{"consultants":["Emmanuel Sánchez"],"progress":0,"docs":{},"tasks":[],"status":"Pendiente","_renderData":{"x":840,"y":112.5,"color":"#f97316","type":"project"},"priority":4,"deadline":"","name":"Pantalla p. Jefes Op.","id":"p18"}]},{"projects":[{"status":"Pendiente","_renderData":{"x":840,"y":187.5,"color":"#f97316","type":"project"},"name":"Reportes / Vistas BI","progress":0,"deadline":"","priority":7,"docs":{},"tasks":[],"id":"p19","consultants":["Emmanuel Sánchez"]}],"name":"BI","color":"#ff9f0a","id":"m5"},{"projects":[{"priority":3,"consultants":["Óscar González"],"deadline":"","status":"Pendiente","name":"Despacho Centralizado","_renderData":{"x":840,"y":262.5,"color":"#10b981","type":"project"},"docs":{},"tasks":[],"progress":0,"id":"p20"}],"id":"m6","name":"DESPACHO CENTRALIZADO","color":"#5ac8fa"},{"id":"m7","color":"#ffd60a","projects":[{"name":"Reportes Ciberseguridad","clientReturnDate":"","consultants":["Osvaldo Avilés"],"clientDeliveryDate":"","priority":6,"deadline":"","tasks":[],"docs":{"doc_1791192995498":{"naValidated":false,"na":false,"checked":false,"obs":""},"doc_1791193027382":{"checked":false,"na":false,"obs":"","naValidated":false},"doc_1791193015065":{"obs":"","na":false,"naValidated":false,"checked":false}},"progress":0,"id":"p21","status":"En Progreso","_renderData":{"x":-840,"y":487.5,"color":"#7eaefb","type":"project"}}],"name":"PLATAFORMA ÚNICA DE IDENTIDAD"},{"projects":[],"id":"m_1791193338595","name":"Módulo de Planeación y Servicios (MPS)","color":"#00ffff"},{"id":"m_1791193355710","color":"#00ffff","projects":[],"name":"Módulo Comercial (MC)"},{"name":"Módulo de Liquidación a Conductores (MLC)","id":"m_1791193408237","projects":[],"color":"#00ffff"}],"globalTasks":[],"dailyTasks":[]};

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
      Chart.defaults.color = '#8a8380'; 
      Chart.defaults.borderColor = '#1d1a18'; 
      Chart.defaults.font.family = "'Geist Mono', monospace";
    }

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
                        
                        if (!initialCloudCollapseApplied) {
                            initialCloudCollapseApplied = true;
                            collapsedModules.add('hub-direct');
                            knownModuleIds.add('hub-direct');
                            (appData.modules || []).forEach(m => {
                                if (m && m.id) {
                                    collapsedModules.add(m.id);
                                    knownModuleIds.add(m.id);
                                }
                            });
                            if (typeof window.updateCollapseAllButtonState === 'function') {
                                window.updateCollapseAllButtonState();
                            }
                        }

                        if(localAuthor && consultants[localAuthor]) {
                            currentUserRole = consultants[localAuthor].role;
                            localStorage.setItem('sicom_role', currentUserRole);
                            window.applyRolePermissions();
                        }
                        
                        if(localAuthor) {
                            refreshUI();
                            if (!window._initialCloudRecentered) {
                                window._initialCloudRecentered = true;
                                setTimeout(() => { try { window.recenterCanvas(); } catch (e) {} }, 80);
                            }
                        } else {
                            window.populateLoginDropdown(); 
                        }
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
            if (appData.history.length > 250) appData.history.length = 250;
        } catch (e) { console.warn('No se pudo registrar la actividad:', e); }
    }

    function ensureDataStructure() {
        if(!appData.history) appData.history = []; 
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
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5 text-[#ee6018]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Acceso Supremo (Administración)`;
                passLabel.className = 'block font-mono text-[10px] mb-2 flex items-center gap-1.5 uppercase text-[#ee6018]';
            } else if (userRole === 'Supervisor') {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5 text-[#eeeeee]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Acceso Supervisor (Edición Completa)`;
                passLabel.className = 'block font-mono text-[10px] mb-2 flex items-center gap-1.5 uppercase text-[#eeeeee]';
            } else if (userRole === 'Lector') {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5 text-[#8a8380]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Acceso Lector (Solo Vista)`;
                passLabel.className = 'block font-mono text-[10px] mb-2 flex items-center gap-1.5 uppercase text-[#8a8380]';
            } else {
                passLabel.innerHTML = `<svg class="w-3.5 h-3.5 text-[#a0ca92]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> Acceso Consultor (Operativo)`;
                passLabel.className = 'block font-mono text-[10px] mb-2 flex items-center gap-1.5 uppercase text-[#a0ca92]';
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

    // --- MOTOR SHA-256 PURO (SÍNCRONO Y COMPATIBLE CON CUALQUIER ENTORNO) ---
    function sha256Hex(ascii) {
        const str = unescape(encodeURIComponent(String(ascii ?? '')));
        function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
        const mathPow = Math.pow, maxWord = mathPow(2, 32);
        let i, j, result = '';
        const words = [], asciiBitLength = str.length * 8;
        let hash = sha256Hex.h = sha256Hex.h || [];
        const k = sha256Hex.k = sha256Hex.k || [];
        let primeCounter = k.length;
        const isComposite = {};
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
                hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        let s = str + '\x80';
        while ((s.length % 64) - 56) s += '\x00';
        for (i = 0; i < s.length; i++) {
            j = s.charCodeAt(i);
            if (j >> 8) return '';
            words[i >> 2] |= j << ((3 - (i % 4)) * 8);
        }
        words[words.length] = (asciiBitLength / maxWord) | 0;
        words[words.length] = asciiBitLength;
        let H = hash.slice(0, 8);
        for (j = 0; j < words.length;) {
            const w = words.slice(j, (j += 16)), oldHash = H.slice(0);
            for (i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const a = H[0], e = H[4];
                const temp1 = H[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & H[5]) ^ (~e & H[6])) + k[i] +
                    (w[i] = i < 16 ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
                const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & H[1]) ^ (a & H[2]) ^ (H[1] & H[2]));
                H = [(temp1 + temp2) | 0].concat(H);
                H[4] = (H[4] + temp1) | 0;
                H.pop();
            }
            for (i = 0; i < 8; i++) H[i] = (H[i] + oldHash[i]) | 0;
        }
        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                const b = (H[i] >> (j * 8)) & 255;
                result += (b < 16 ? '0' : '') + b.toString(16);
            }
        }
        return result;
    }

    // Sanitizador de enlaces externos (bloquea protocolos peligrosos como javascript: o data:)
    window.sanitizeSafeUrl = function(rawUrl) {
        const clean = String(rawUrl || '').trim();
        if (!clean) return '';
        if (/^(javascript|data|vbscript):/i.test(clean)) return '';
        return (!clean.startsWith('http://') && !clean.startsWith('https://')) ? 'https://' + clean : clean;
    };

    // Hashes SHA-256 de credenciales por rol (Cero contraseñas en texto plano en el código fuente)
    const ROLE_PASSWORD_HASHES = {
        Supremo: '43521c6d451cdba4e26f837672ab85d0e40a8e05d1679e37587a30a851e006a5',
        Supervisor: 'd7f4cd045526fd00bb0880cc98e7b38357843c9524f74d82f57ae873d40f96d9',
        Lector: 'bb689e16a21690a2d6b3da908110a2e5a922e07942a8f8b62e8871f72a43d23a',
        Consultor: '2d335d79507ea715ed46a2ce905b0baf721f194fb89930091fa9a2876d6cd16b'
    };

    let loginFailedAttempts = 0;
    let loginLockUntil = 0;

    window.attemptLogin = function() {
        const now = Date.now();
        if (now < loginLockUntil) {
            const waitSec = Math.ceil((loginLockUntil - now) / 1000);
            window.showToast(`⏳ Demasiados intentos. Espera ${waitSec}s para volver a intentar.`, true);
            shakeLogin();
            return;
        }

        const val = document.getElementById('loginUserSelect').value;
        const pass = document.getElementById('loginPasswordInput').value;
        if (!val) { window.showToast("Selecciona tu perfil", true); return; }
        
        const cData = consultants[val];
        const userRole = cData ? (cData.role || 'Consultor') : 'Consultor';
        const inputHash = sha256Hex(pass);
        
        // Determinar validación de contraseña (Personalizada con soporte SHA-256 vs Hash de Rol por defecto)
        let isValidPass = false;
        const customPass = cData ? cData.password : null;
        if (customPass) {
            if (String(customPass).startsWith('sha256:')) {
                isValidPass = ('sha256:' + inputHash) === customPass;
            } else {
                isValidPass = (pass === customPass);
                if (isValidPass && cData) {
                    // Migrar contraseña personalizada en texto plano a SHA-256 automáticamente
                    cData.password = 'sha256:' + inputHash;
                    window.saveData(false);
                }
            }
        } else {
            const expectedHash = ROLE_PASSWORD_HASHES[userRole] || ROLE_PASSWORD_HASHES.Consultor;
            isValidPass = (inputHash === expectedHash);
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

        if (!isValidPass) {
            loginFailedAttempts++;
            if (loginFailedAttempts >= 5) {
                loginLockUntil = Date.now() + 30000;
                loginFailedAttempts = 0;
                window.showToast("🔒 Acceso bloqueado por 30s tras 5 intentos fallidos.", true);
            } else {
                window.showToast("Contraseña incorrecta", true);
            }
            shakeLogin();
            return;
        }
        
        loginFailedAttempts = 0;
        loginLockUntil = 0;
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
                    window.sendExternalAlert('VALIDATION_SUBMITTED', {
                        project: 'Actividad Diaria',
                        task: t.text,
                        feedback: feedback,
                        consultant: localAuthor
                    });
                }
                window.saveData(false);
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
                }
            }
        }
        
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
        if (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) window.toggleDailyDrawer();
        
        const content = document.getElementById('manualContent');
        if (currentUserRole === 'Supremo') {
            content.innerHTML = `
            <div class="border-b border-[#3d3a39] pb-3 mb-4">
                <h3 class="text-base font-normal text-[#eeeeee] flex items-center gap-2">
                    <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/40">SUPREMO</span>
                    <span>Dirección General</span>
                </h3>
                <p class="text-xs text-[#b8b3b0] mt-1.5 leading-relaxed">Control absoluto de la arquitectura, configuración, usuarios y datos críticos del sistema STGT // SICOM.</p>
            </div>
            <ul class="text-xs space-y-2.5 text-[#b8b3b0] list-none leading-relaxed">
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">01 // Gestión de Accesos y Equipo</strong>
                    En <strong class="text-[#eeeeee]">Panel &gt; Equipo</strong>, puedes dar de alta nuevos consultores o modificar existentes. Haz clic en la llave para asignar o resetear la contraseña privada de cualquier usuario, o cambiar sus niveles de acceso al instante.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">02 // Arquitectura y Estructura</strong>
                    Capacidad exclusiva para crear nuevos <strong class="text-[#eeeeee]">Módulos</strong> (agrupadores departamentales) y eliminar proyectos o módulos permanentemente desde el panel de edición.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">03 // Centro de Trabajo (Panel Izquierdo)</strong>
                    Supervisa todo el ciclo operativo en sus 4 pestañas: 
                    <span class="text-[#ee6018] font-mono text-[10px] uppercase">Alertas</span> (vencidos), 
                    <span class="text-[#eeeeee] font-mono text-[10px] uppercase">Pendientes</span> (por consultor), 
                    <span class="text-[#ee6018] font-mono text-[10px] uppercase">Validación</span> (evidencias por auditar) y 
                    <span class="text-[#a0ca92] font-mono text-[10px] uppercase">Hechas</span> (tareas validadas).
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">04 // Acciones Rápidas (+)</strong>
                    Desde el botón inferior derecho puedes crear proyectos, registrar tareas personales, asignar <strong class="text-[#eeeeee]">Tareas por proyecto</strong> o abrir un nuevo módulo directamente.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">05 // Docs Base y Estandarización</strong>
                    En <strong class="text-[#eeeeee]">Panel &gt; Docs Base</strong>, defines los documentos obligatorios de calidad. El avance porcentual (0 a 100%) de cada proyecto se calcula automáticamente según los documentos validados.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">06 // Auditoría Inmutable y Respaldos</strong>
                    En <strong class="text-[#eeeeee]">Panel &gt; Historial</strong> puedes auditar cada modificación. Al final del Panel dispones de exportación CSV, respaldo JSON y sincronización con la nube.
                </li>
            </ul>`;
        } else if (currentUserRole === 'Supervisor') {
            content.innerHTML = `
            <div class="border-b border-[#3d3a39] pb-3 mb-4">
                <h3 class="text-base font-normal text-[#eeeeee] flex items-center gap-2">
                    <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/40">SUPERVISOR</span>
                    <span>Coordinación de Operaciones</span>
                </h3>
                <p class="text-xs text-[#b8b3b0] mt-1.5 leading-relaxed">Responsable del flujo operativo, auditoría de calidad de entregas y cumplimiento de tiempos del equipo.</p>
            </div>
            <ul class="text-xs space-y-2.5 text-[#b8b3b0] list-none leading-relaxed">
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">01 // Auditoría y Validación de Entregas</strong>
                    Abre el panel izquierdo en la pestaña <strong class="text-[#eeeeee]">Validación</strong> para revisar tareas concluidas con su evidencia y <span class="text-[#a0ca92] font-mono uppercase">Aprobar</span> o <span class="text-[#ee6018] font-mono uppercase">Rechazar</span>.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">02 // Asignación de Tareas por Proyecto</strong>
                    Utiliza el botón <strong class="text-[#eeeeee]">"+" &gt; Tarea por proyecto</strong> para delegar actividades vinculadas a cualquier proyecto con responsable y fecha límite.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">03 // Control Operativo de Proyectos</strong>
                    Selecciona cualquier proyecto para editar su estatus, fechas compromiso, porcentaje de avance y enlaces oficiales de Drive e InvGate.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">04 // Tablero y Prioridades por Consultor</strong>
                    Usa <strong class="text-[#eeeeee]">Prioridades</strong> (con pestañas por consultor) y <strong class="text-[#eeeeee]">Panel &gt; Tablero</strong> para medir carga operativa, avance promedio y atrasos.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">05 // Foro y Bitácora Técnica</strong>
                    Registra acuerdos, bloqueos y menciones (<code class="font-mono text-[#ee6018]">@</code>) con acuse de lectura en cada proyecto.
                </li>
            </ul>`;
        } else if (currentUserRole === 'Lector') {
            content.innerHTML = `
            <div class="border-b border-[#3d3a39] pb-3 mb-4">
                <h3 class="text-base font-normal text-[#eeeeee] flex items-center gap-2">
                    <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] bg-[#101010] text-[#b8b3b0] border border-[#3d3a39]">LECTOR</span>
                    <span>Auditoría y Supervisión Ejecutiva</span>
                </h3>
                <p class="text-xs text-[#b8b3b0] mt-1.5 leading-relaxed">Acceso de auditoría visual total al sistema STGT // SICOM, con protección contra modificaciones.</p>
            </div>
            <ul class="text-xs space-y-2.5 text-[#b8b3b0] list-none leading-relaxed">
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">01 // Navegación y Búsqueda</strong>
                    Explora libremente el mapa mental arrastrando con el ratón. Usa la búsqueda superior o aplica filtros por consultor, empresa y estatus.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">02 // Inspección Detallada de Proyectos</strong>
                    Haz clic en cualquier proyecto para consultar estatus, fechas límite, tareas concluidas, bitácora técnica y documentos base.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">03 // Evidencias y Tickets Oficiales</strong>
                    Accede directamente a los botones de <strong class="text-[#eeeeee]">Drive</strong> e <strong class="text-[#a0ca92]">InvGate</strong> enlazados al proyecto.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">04 // Métricas y Trazabilidad</strong>
                    En el menú <strong class="text-[#eeeeee]">Panel</strong>, consulta el <strong class="text-[#eeeeee]">Tablero</strong> para evaluar el rendimiento global y la pestaña <strong class="text-[#eeeeee]">Historial</strong>.
                </li>
            </ul>`;
        } else {
            content.innerHTML = `
            <div class="border-b border-[#3d3a39] pb-3 mb-4">
                <h3 class="text-base font-normal text-[#eeeeee] flex items-center gap-2">
                    <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]/40">CONSULTOR</span>
                    <span>Operación y Ejecución</span>
                </h3>
                <p class="text-xs text-[#b8b3b0] mt-1.5 leading-relaxed">Ejecuta asignaciones con precisión, documenta avances con evidencias y mantén al día tus entregas.</p>
            </div>
            <ul class="text-xs space-y-2.5 text-[#b8b3b0] list-none leading-relaxed">
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">01 // Centro de Trabajo (Panel Izquierdo)</strong>
                    Abre el panel izquierdo para gestionar tus <strong class="text-[#eeeeee]">Pendientes</strong>, revisar <strong class="text-[#ee6018]">Alertas</strong>, dar seguimiento a entregas en <strong class="text-[#ee6018]">Validación</strong> y consultar tus tareas <strong class="text-[#a0ca92]">Hechas</strong>.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">02 // Diferenciación de Tareas (+)</strong>
                    En el botón flotante inferior derecho puedes registrar <strong class="text-[#eeeeee]">Tareas diarias personales</strong>, vincular una <strong class="text-[#eeeeee]">Tarea por proyecto</strong> o dar de alta un <strong class="text-[#eeeeee]">Nuevo proyecto</strong>.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">03 // Reporte con Evidencia</strong>
                    Al marcar una tarea como completada, registra tu enlace u observación del entregable y pulsa <strong class="text-[#eeeeee]">Enviar a Validación</strong>.
                </li>
                <li class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39]">
                    <strong class="font-mono text-[11px] uppercase text-[#eeeeee] block mb-1">04 // Modo Enfoque y Foro Técnico</strong>
                    Usa <strong class="text-[#eeeeee]">Modo Enfoque</strong> en la barra superior para aislar tus proyectos asignados y utiliza el <strong class="text-[#eeeeee]">Foro y Bitácora Técnica</strong> para acuerdos, bloqueos y menciones con acuse de lectura.
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
        try { ensureDataStructure(); window.applyRolePermissions(); refreshUI(); } catch (e) { console.error('Error al renderizar la interfaz:', e); }
        setTimeout(() => { try { window.recenterCanvas(); } catch (e) { console.error(e); } }, 100);
        resetInactivityTimeout(); // Iniciar temporizador de inactividad
    }

    window.applyRolePermissions = function() {
        const isSupremo = currentUserRole === 'Supremo';
        const isSupervisorUp = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';

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
        window.ensureDomReferences(); window.populateConsultantSelects();
        if (isDrawerOpen) {
            window.renderRegisteredConsultantsList(); window.renderRegisteredDocsList(); window.populateGlobalEditSelector();
        }
        window.updateDatalist(); window.renderMindMap(); window.renderHistory(); window.renderDashboard(); 
        if(isPriorityDrawerOpen) window.renderPriorityDrawer();
        window.renderAlerts(); // SENSOR DE ALERTAS
        refreshOpenInfoNotes();
        const hookInp = document.getElementById('customWebhookInput');
        if (hookInp && !hookInp.value) {
            hookInp.value = (appData.config && appData.config.webhookUrl) || localStorage.getItem('sicom_custom_webhook') || '';
        }
    }

    // Si la tarjeta de un proyecto está abierta, actualiza sus comentarios cuando llegan cambios de otros usuarios
    function refreshOpenInfoNotes() {
        try {
            const card = document.getElementById('infoCard');
            if (!card || card.classList.contains('hidden')) return;
            if (currentSelection.type !== 'project' && currentSelection.type !== 'direct-project') return;
            const item = getSelectedItem();
            if (!item) {
                window.closeInfoCardSafe(true);
                currentSelection = { type: null, id: null };
                return;
            }
            const n = Array.isArray(item.notes) ? item.notes : [];
            const sig = n.length + ':' + (n.length ? n[n.length - 1].id : '');
            if (card.dataset.notesSig === sig) return; // sin cambios: no mover el scroll del lector
            card.dataset.notesSig = sig;
            window.renderNotesHistory(item.notes, 'infoNotes');
        } catch (e) { console.warn('No se pudieron refrescar los comentarios:', e); }
    }

    // === LÓGICA DE ALERTAS INTERNAS (UNIFICADA CON PANEL DE NOTIFICACIONES Y TRABAJO) ===
    window.renderAlerts = function() {
        if(!localAuthor) return;
        if (currentUserRole === 'Lector') {
            window.__lastAlerts = [];
            window.renderDailyTasks();
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
        window.renderDailyTasks();
    };

    window.showToast = function(msg, isError = false) {
        const t = document.getElementById('toast'); t.textContent = msg;
        if(isError) t.classList.add('error'); else t.classList.remove('error');
        t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000);
    }

    window.setConnectionStatus = function(status) {
        const dot = document.getElementById('connectionStatusDot');
        if(!dot) return;
        dot.className = "w-1.5 h-1.5 rounded-full transition-colors duration-150";
        if(status === 'online') {
            dot.classList.add('bg-[#a0ca92]');
            dot.title = "En Línea";
        } else if (status === 'syncing') {
            dot.classList.add('bg-[#ee6018]', 'animate-pulse');
            dot.title = "Sincronizando nube...";
        } else {
            dot.classList.add('bg-[#ee6018]');
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
        try {
            localStorage.setItem('sicom_data', JSON.stringify(appData));
            localStorage.setItem('sicom_consultants', JSON.stringify(consultants));
            localStorage.setItem('sicom_global_docs', JSON.stringify(globalDocs));
        } catch (e) {}

        if (isFirebaseReady && db && appId && globalDoc && globalSetDoc) {
            const docRef = globalDoc(db, 'artifacts', appId, 'public', 'data', 'sicom_state', 'main');
            globalSetDoc(docRef, { appData, consultants, globalDocs }, { merge: false });
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
    
    function generateJointGradient(consultantNames) {
      if (!consultantNames || consultantNames.length === 0) return '#48484a';
      if (consultantNames.length === 1) return (consultants && consultants[consultantNames[0]]) ? consultants[consultantNames[0]].color : '#48484a';
      const validColors = consultantNames.map(name => (consultants && consultants[name]) ? consultants[name].color : null).filter(Boolean);
      if (validColors.length === 0) return '#48484a';
      if (validColors.length === 1) return validColors[0];
      const gradKey = validColors.map(c => String(c).replace('#','')).join('-');
      const gradId = `grad-${gradKey}`;
      if (!document.getElementById(gradId)) {
        const defsContainer = document.getElementById('svgDefs') || (typeof canvasGroup !== 'undefined' && canvasGroup ? canvasGroup.querySelector('defs') : null) || document.querySelector('svg defs');
        if (defsContainer) {
          const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
          linearGradient.setAttribute('id', gradId);
          linearGradient.setAttribute('x1', '0%');
          linearGradient.setAttribute('y1', '0%');
          linearGradient.setAttribute('x2', '100%');
          linearGradient.setAttribute('y2', '100%');
          validColors.forEach((color, i) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', `${(i / (validColors.length - 1)) * 100}%`);
            stop.setAttribute('stop-color', color);
            linearGradient.appendChild(stop);
          });
          defsContainer.appendChild(linearGradient);
        }
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
            const col = (consultants[cName] && consultants[cName].color) ? consultants[cName].color : '#ee6018';
            const initial = cName.charAt(0).toUpperCase();
            return `
                <button type="button" onclick="insertMention('${escapeHtml(cName)}', '${context}')" class="w-full text-left px-2.5 py-1.5 rounded-[3px] bg-[#1d1a18] hover:bg-[#3d3a39]/40 border border-[#3d3a39] hover:border-[#eeeeee] transition flex items-center gap-2 text-xs text-[#eeeeee]">
                    <div class="w-4 h-4 rounded-[2px] flex items-center justify-center font-mono text-[9px] text-[#fafafa] shrink-0" style="background-color: ${col};">
                        ${initial}
                    </div>
                    <span class="truncate text-[11px] text-[#eeeeee] flex-1">${escapeHtml(cName)}</span>
                    <span class="text-[9px] text-[#ee6018] font-mono shrink-0">@${escapeHtml(cName.split(' ')[0])}</span>
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
        const inactiveBg = isInfo ? 'bg-[#101010]' : 'bg-[#1d1a18]';
        
        tags.forEach(t => {
            const btn = document.getElementById(prefix + t);
            if (!btn) return;
            if (t === tag) {
                btn.className = 'note-tag-btn px-2 py-1 rounded-[3px] font-mono text-[10px] uppercase transition flex items-center gap-1';
                if (t === 'comentario') {
                    btn.className += ' bg-[#eeeeee] text-[#101010] border border-[#eeeeee]';
                } else if (t === 'acuerdo') {
                    btn.className += ' bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]';
                } else if (t === 'bloqueo') {
                    btn.className += ' bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]';
                } else if (t === 'entregable') {
                    btn.className += ' bg-[#eeeeee] text-[#101010] border border-[#eeeeee]';
                }
            } else {
                btn.className = `note-tag-btn px-2 py-1 rounded-[3px] font-mono text-[10px] uppercase transition flex items-center gap-1 text-[#8a8380] hover:text-[#eeeeee] ${inactiveBg} border border-[#3d3a39]`;
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
                const badgeDotColor = (hasBlocker || hasMention) ? 'bg-[#ee6018]' : 'bg-[#a0ca92]';
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
                <div class="text-center py-5 px-4 bg-[#101010] border border-dashed border-[#3d3a39] rounded-[10px]">
                    <div class="w-8 h-8 mx-auto mb-2 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center justify-center text-[#ee6018]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </div>
                    <p class="font-mono text-[10px] uppercase text-[#eeeeee]">Bitácora sin registros</p>
                    <p class="text-[11px] text-[#8a8380] mt-1 max-w-[260px] mx-auto">Registra acuerdos con cliente, bloqueos técnicos o notas operativas.</p>
                </div>
            `;
            return;
        }
        
        const isSupremo = currentUserRole === 'Supremo';
        const isSupervisor = currentUserRole === 'Supervisor';
        const isLector = currentUserRole === 'Lector';
        const item = getSelectedItem();
        const projCons = (item && typeof getProjectConsultants === 'function') ? getProjectConsultants(item) : [];

        // Banner superior si hay múltiples notas sin enterar (Factory Design System)
        let headerBanner = '';
        if (unreadForMeCount > 1) {
            headerBanner = `
                <div class="p-2.5 rounded-[10px] bg-[#101010] border border-[#ee6018]/60 flex items-center justify-between gap-2 mb-1">
                    <div class="flex items-center gap-2 text-xs text-[#eeeeee]">
                        <span class="w-2 h-2 rounded-full bg-[#ee6018] animate-ping shrink-0"></span>
                        <span class="font-mono text-[10px] uppercase text-[#eeeeee]">Tienes <strong class="text-[#ee6018]">${unreadForMeCount} notas</strong> sin enterarte</span>
                    </div>
                    <button type="button" onclick="confirmAllNotesRead()" class="px-2.5 py-1 bg-[#fafafa] hover:bg-[#eeeeee] text-[#101010] font-mono uppercase text-[10px] rounded-[3px] transition flex items-center gap-1 shrink-0">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Enterado de todas</span>
                    </button>
                </div>
            `;
        }
        
        container.classList.remove('hidden');
        container.innerHTML = headerBanner + arr.map(n => {
            const col = (consultants[n.by] && consultants[n.by].color) ? consultants[n.by].color : '#ee6018';
            const initial = (n.by || '?').charAt(0).toUpperCase();
            
            // Permiso de borrado: Supremo, Supervisor o el propio autor
            const isAuthor = Boolean(n.by && localAuthor && n.by.trim().toLowerCase() === localAuthor.trim().toLowerCase());
            const canDelete = !isLector && (isSupremo || isSupervisor || isAuthor);

            const delBtn = canDelete ? `
                <button type="button" onclick="deleteProjectNote('${n.id}')" class="text-[#8a8380] hover:text-[#ee6018] transition p-1 ml-1 shrink-0" title="${(isSupremo || isSupervisor) && !isAuthor ? 'Moderar/Borrar comentario' : 'Eliminar mi comentario'}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            ` : '';

            // Tag badge (Factory Design System)
            const tag = n.tag || 'comentario';
            let tagBadge = '';
            if (tag === 'acuerdo') {
                tagBadge = `<span class="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]/40 flex items-center gap-1 shrink-0"><span>📌</span><span>Acuerdo</span></span>`;
            } else if (tag === 'bloqueo') {
                tagBadge = `<span class="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/50 flex items-center gap-1 shrink-0"><span>⚠️</span><span>Bloqueo</span></span>`;
            } else if (tag === 'entregable') {
                tagBadge = `<span class="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase bg-[#1d1a18] text-[#eeeeee] border border-[#3d3a39] flex items-center gap-1 shrink-0"><span>🔗</span><span>Entregable</span></span>`;
            } else {
                tagBadge = `<span class="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase bg-[#1d1a18] text-[#8a8380] border border-[#3d3a39] flex items-center gap-1 shrink-0"><span>💬</span><span>Nota</span></span>`;
            }

            // Detección de si el usuario activo fue mencionado con @
            const isMentioned = localAuthor && window.isUserMentionedInText(n.text, localAuthor);
            let mentionTag = '';
            if (isMentioned) {
                mentionTag = `<span class="px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] uppercase bg-[#ee6018]/20 text-[#ee6018] border border-[#ee6018]/50 flex items-center gap-1 shrink-0"><span>@</span><span>Te mencionaron</span></span>`;
            }

            // Formatear menciones con @Nombre dentro del texto
            const safeText = escapeHtml(n.text || '');
            let formattedText = safeText;
            const allCons = Object.keys(consultants || {});
            allCons.forEach(cName => {
                const escaped = escapeHtml(cName);
                const cCol = (consultants[cName] && consultants[cName].color) ? consultants[cName].color : '#ee6018';
                const regex = new RegExp(`@${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                formattedText = formattedText.replace(regex, `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-[#1d1a18] text-[#eeeeee] border border-[#3d3a39] font-mono text-[10px]"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${cCol}"></span>@${escaped}</span>`);
            });

            // Auto-enlazar URLs en el texto
            const linkedText = formattedText.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#ee6018] hover:underline break-all inline-flex items-center gap-0.5 font-mono text-[11px]">$1 <svg class="w-3 h-3 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>');

            const friendlyDate = window.formatFriendlyNoteDate(n.date);

            // Estado de lectura individual
            const isReadByMe = (() => {
                if (!localAuthor) return true;
                if (!Array.isArray(n.readBy)) return n.by === localAuthor;
                return n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor);
            })();

            // Lista deduplicada de personas que ya leyeron la nota
            const rawReadList = Array.isArray(n.readBy) ? n.readBy.map(r => (typeof r === 'string' ? r : (r && r.user))).filter(Boolean) : (n.by ? [n.by] : []);
            const uniqueReaders = [...new Set(rawReadList)];
            const pendingCons = projCons.filter(c => !uniqueReaders.includes(c));
            const auditTitle = `Confirmaron lectura (${uniqueReaders.length}): ${uniqueReaders.join(', ') || 'Nadie'}${pendingCons.length ? '\nFalta por leer del proyecto: ' + pendingCons.join(', ') : ''}`;

            const readerChipsHtml = uniqueReaders.map(rName => {
                const rCol = (consultants[rName] && consultants[rName].color) ? consultants[rName].color : '#8a8380';
                const shortName = rName.split(' ')[0];
                return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#1d1a18] border border-[#3d3a39] text-[#b8b3b0] font-mono text-[9px]" title="${escapeHtml(rName)}"><span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${rCol}"></span>${escapeHtml(shortName)}</span>`;
            }).join('');

            const pendingBadgeHtml = pendingCons.length > 0
                ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#ee6018]/10 border border-[#ee6018]/30 text-[#ee6018] font-mono text-[9px]" title="Asignados pendientes de leer: ${escapeHtml(pendingCons.join(', '))}">⏳ Falta: ${escapeHtml(pendingCons.map(c => c.split(' ')[0]).join(', '))}</span>`
                : '';

            // Sección de acuse y auditoría
            let receiptSection = '';
            if (!isReadByMe) {
                const noticeText = isMentioned ? 'Te mencionaron en esta nota' : (tag === 'bloqueo' ? 'Bloqueo pendiente de acuse' : 'Pendiente de tu lectura');
                const noticeColor = (isMentioned || tag === 'bloqueo') ? 'text-[#ee6018]' : 'text-[#eeeeee]';
                const pingColor = (isMentioned || tag === 'bloqueo') ? 'bg-[#ee6018]' : 'bg-[#a0ca92]';
                const btnColor = (isMentioned || tag === 'bloqueo')
                    ? 'bg-[#ee6018] hover:bg-[#ff742e] text-[#fafafa]'
                    : 'bg-[#fafafa] hover:bg-[#eeeeee] text-[#101010]';

                receiptSection = `
                    <div class="mt-2.5 pt-2 border-t border-[#3d3a39] flex flex-col gap-2">
                        <div class="flex items-center justify-between gap-2 flex-wrap">
                            <div class="flex items-center gap-1.5 font-mono text-[9px] uppercase ${noticeColor}">
                                <span class="w-1.5 h-1.5 rounded-full ${pingColor} animate-ping shrink-0"></span>
                                <span>${noticeText}</span>
                            </div>
                            <button type="button" onclick="confirmNoteRead('${n.id}')" class="px-2.5 py-1 ${btnColor} font-mono uppercase text-[10px] rounded-[3px] transition flex items-center gap-1.5 shrink-0">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                <span>Confirmar lectura</span>
                            </button>
                        </div>
                        ${uniqueReaders.length > 0 ? `
                        <div class="flex items-center gap-1 flex-wrap pt-1" title="${escapeHtml(auditTitle)}">
                            <span class="font-mono text-[9px] text-[#8a8380] uppercase mr-0.5">👁 Visto (${uniqueReaders.length}):</span>
                            ${readerChipsHtml}
                            ${pendingBadgeHtml}
                        </div>` : ''}
                    </div>
                `;
            } else {
                const myReceipt = Array.isArray(n.readBy) ? n.readBy.find(r => (typeof r === 'string' ? r : (r && r.user)) === localAuthor) : null;
                const myReceiptDate = (myReceipt && typeof myReceipt === 'object' && myReceipt.at) ? window.formatFriendlyNoteDate(myReceipt.at) : '';

                receiptSection = `
                    <div class="mt-2 pt-2 border-t border-[#3d3a39]/70 flex flex-col gap-1.5" title="${escapeHtml(auditTitle)}">
                        <div class="flex items-center justify-between gap-2 text-[9px]">
                            <span class="flex items-center gap-1 text-[#a0ca92] font-mono uppercase">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                ${isAuthor ? 'Publicado por ti' : `Enterado (${myReceiptDate || 'Confirmado'})`}
                            </span>
                            <span class="font-mono text-[9px] text-[#8a8380] uppercase ml-auto">
                                👁 ${uniqueReaders.length} ${uniqueReaders.length === 1 ? 'enterado' : 'enterados'}
                            </span>
                        </div>
                        <div class="flex items-center gap-1 flex-wrap">
                            ${readerChipsHtml}
                            ${pendingBadgeHtml}
                        </div>
                    </div>
                `;
            }

            const unreadCardClasses = !isReadByMe
                ? ((isMentioned || tag === 'bloqueo') ? 'border-[#ee6018] bg-[#101010]' : 'border-[#eeeeee]/60 bg-[#101010]')
                : 'border-[#3d3a39] hover:border-[#4d4947] bg-[#101010]';

            return `
                <div class="flex flex-col gap-2 p-3 rounded-[10px] border ${unreadCardClasses} transition group">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-[3px] flex items-center justify-center font-mono text-[10px] text-[#fafafa] shrink-0" style="background-color: ${col};">
                            ${initial}
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span class="text-xs font-normal text-[#eeeeee] truncate max-w-[130px]">${escapeHtml(n.by || 'Consultor')}</span>
                            ${tagBadge}
                            ${mentionTag}
                        </div>
                        <span class="font-mono text-[9px] text-[#8a8380] ml-auto shrink-0" title="${escapeHtml(n.date || '')}">${friendlyDate}</span>
                        ${delBtn}
                    </div>
                    <div class="text-xs text-[#eeeeee] pl-7 leading-relaxed whitespace-pre-wrap break-words">${linkedText}</div>
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
        if(!svgElem) window.ensureDomReferences();
        const rect = svgElem ? svgElem.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        
        const b = window._currentMapBounds || { minX: -590, maxX: 590, minY: -250, maxY: 250 };
        
        // Mantener siempre visible en pantalla un margen sustancial del contenido del mapa
        // Esto previene al 100% que el mapa se pierda o vuele fuera de la pantalla al hacer zoom o pan
        const marginX = Math.min(rect.width * 0.22, 200);
        const marginY = Math.min(rect.height * 0.22, 140);

        const minTx = marginX - (b.maxX * scale);
        const maxTx = rect.width - marginX - (b.minX * scale);
        const minTy = marginY - (b.maxY * scale);
        const maxTy = rect.height - marginY - (b.minY * scale);

        if (minTx <= maxTx) {
            translateX = Math.max(minTx, Math.min(maxTx, translateX));
        } else {
            translateX = (minTx + maxTx) / 2;
        }

        if (minTy <= maxTy) {
            translateY = Math.max(minTy, Math.min(maxTy, translateY));
        } else {
            translateY = (minTy + maxTy) / 2;
        }
        
        // Forzamos el transform nativo de SVG en vez del de CSS
        canvasGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
        if(svgElem) svgElem.style.overflow = 'visible';
    };

    window.animateCameraTo = function(targetTx, targetTy, targetScale, duration = 480) {
        if (cameraAnimId) {
            cancelAnimationFrame(cameraAnimId);
            cameraAnimId = null;
        }
        const startTx = translateX;
        const startTy = translateY;
        const startScale = scale;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / Math.max(1, duration));
            const ease = 1 - Math.pow(1 - progress, 4);
            translateX = startTx + (targetTx - startTx) * ease;
            translateY = startTy + (targetTy - startTy) * ease;
            scale = startScale + (targetScale - startScale) * ease;
            window.updateCanvasTransform();
            if (progress < 1) {
                cameraAnimId = requestAnimationFrame(step);
            } else {
                cameraAnimId = null;
            }
        }
        cameraAnimId = requestAnimationFrame(step);
    };

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
        return isDrawerOpen || isPriorityDrawerOpen || 
               (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) || 
               (typeof isFilterDrawerOpen !== 'undefined' && isFilterDrawerOpen);
    }

    const ws = document.getElementById('workspace');
    if(ws) {
        ws.addEventListener('touchstart', (e) => {
            if (isAnyDrawerActive() || e.target.closest('#infoCard')) return;
            if (cameraAnimId) {
                cancelAnimationFrame(cameraAnimId);
                cameraAnimId = null;
            }
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
            if (cameraAnimId) {
                cancelAnimationFrame(cameraAnimId);
                cameraAnimId = null;
            }
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
            if (cameraAnimId) {
                cancelAnimationFrame(cameraAnimId);
                cameraAnimId = null;
            }
            // Zoom proporcional suave (factor 1.07 / 0.93) para que la pantalla nunca salte ni se aleje de golpe
            const factor = e.deltaY < 0 ? 1.07 : 0.93;
            window.zoomCanvasByFactor(factor, e.clientX, e.clientY); 
        }, {passive: false});
    }

    // CANDADO DE ZOOM SEGURO: Mantiene el mapa siempre en un rango visual confortable
    // Impide alejarse al infinito o encoger el mapa a un punto minúsculo
    window.getMinZoomLimit = function() {
        const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;
        return isSmallScreen ? 0.22 : 0.28;
    };

    window.zoomCanvas = function(delta, mx = window.innerWidth/2, my = window.innerHeight/2) {
      if(!svgElem) window.ensureDomReferences();
      const minScale = window.getMinZoomLimit();
      const maxScale = 2.0;
      const targetScale = scale + delta;
      const newScale = Math.max(minScale, Math.min(maxScale, targetScale));
      
      if (Math.abs(newScale - scale) < 0.0001) return;

      const rect = svgElem.getBoundingClientRect(); 
      const x = mx - rect.left, y = my - rect.top;
      translateX = x - (x - translateX) * (newScale / scale); 
      translateY = y - (y - translateY) * (newScale / scale);
      scale = newScale; 
      window.updateCanvasTransform();
    };

    window.zoomCanvasByFactor = function(factor, mx = window.innerWidth/2, my = window.innerHeight/2) {
      if(!svgElem) window.ensureDomReferences();
      const minScale = window.getMinZoomLimit();
      const maxScale = 2.0;
      const targetScale = scale * factor;
      const newScale = Math.max(minScale, Math.min(maxScale, targetScale));
      
      if (Math.abs(newScale - scale) < 0.0001) return;

      const rect = svgElem.getBoundingClientRect(); 
      const x = mx - rect.left, y = my - rect.top;
      translateX = x - (x - translateX) * (newScale / scale); 
      translateY = y - (y - translateY) * (newScale / scale);
      scale = newScale; 
      window.updateCanvasTransform();
    };
    
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
        
        window.animateCameraTo(targetTx, targetTy, targetScale, 520);
    };

    window.recenterCanvas = function(customDuration = 480) {
        if(!svgElem || !canvasGroup) window.ensureDomReferences();
        if(!svgElem || !canvasGroup) return; 
        const rect = svgElem.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 768;
        const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;

        let availW = rect.width;
        let availH = rect.height;
        let offsetLeft = 0;

        if (isDesktop) {
            if (typeof isDailyDrawerOpen !== 'undefined' && isDailyDrawerOpen) {
                offsetLeft += 420;
                availW -= 420;
            }
            if ((typeof isDrawerOpen !== 'undefined' && isDrawerOpen) || 
                (typeof isPriorityDrawerOpen !== 'undefined' && isPriorityDrawerOpen) || 
                (typeof isFilterDrawerOpen !== 'undefined' && isFilterDrawerOpen)) {
                availW -= 420;
            }
            availW = Math.max(320, availW);
        }

        const b = window._currentMapBounds || { minX: -590, maxX: 590, minY: -250, maxY: 250 };
        const contentW = Math.max(200, b.maxX - b.minX);
        const contentH = Math.max(150, b.maxY - b.minY);
        const contentCenterX = (b.minX + b.maxX) / 2;
        const contentCenterY = (b.minY + b.maxY) / 2;

        const allModuleIds = ['hub-direct', ...(appData.modules || []).map(m => m && m.id).filter(Boolean)];
        const isAllCollapsed = allModuleIds.every(id => collapsedModules.has(id)) || (canvasGroup.querySelectorAll('.mindmap-project-node').length === 0);

        let targetTx, targetTy, targetScale;

        if (isAllCollapsed) {
            // Forma original limpia y centrada exactamente en el Hub
            targetTx = offsetLeft + (availW / 2);
            targetTy = (availH / 2);
            const fitScale = Math.min((availW - 60) / contentW, (availH - 60) / contentH);
            targetScale = isSmallScreen ? Math.min(0.70, fitScale) : Math.min(0.85, Math.max(0.65, fitScale));
        } else {
            // Previsualización panorámica con proyectos legibles en encuadre seguro
            const padX = isSmallScreen ? 20 : 60;
            const padY = isSmallScreen ? 25 : 50;
            const fitX = (availW - padX * 2) / contentW;
            const fitY = (availH - padY * 2) / contentH;
            const fitScale = Math.min(fitX, fitY);
            
            const minPreview = isSmallScreen ? 0.24 : 0.32;
            const maxPreview = isSmallScreen ? 0.45 : 0.58;
            targetScale = Math.min(maxPreview, Math.max(minPreview, fitScale));
            targetTx = offsetLeft + (availW / 2) - (contentCenterX * targetScale); 
            targetTy = (availH / 2) - (contentCenterY * targetScale);
        }
        window.animateCameraTo(targetTx, targetTy, targetScale, customDuration);
    };

    window.toggleConfigDrawer = function() { isDrawerOpen ? window.closeConfigDrawer() : window.openConfigDrawer(); }
    window.openConfigDrawer = function() { 
        if (isDailyDrawerOpen) window.toggleDailyDrawer();
        if (window.innerWidth < 768) window.closeInfoCardSafe(true);
        if (isPriorityDrawerOpen) window.closePriorityDrawer(); 
        document.getElementById('configDrawer').classList.remove('translate-x-full'); 
        isDrawerOpen = true; 
        window.populateGlobalEditSelector(); 
        window.renderDashboard();
        window.applyRolePermissions();
    }
    window.closeConfigDrawer = function() { document.getElementById('configDrawer').classList.add('translate-x-full'); isDrawerOpen = false; }
    window.togglePriorityDrawer = function() { isPriorityDrawerOpen ? window.closePriorityDrawer() : window.openPriorityDrawer(); }
    window.openPriorityDrawer = function() { 
        if (isDailyDrawerOpen) window.toggleDailyDrawer();
        if (window.innerWidth < 768) window.closeInfoCardSafe(true);
        if(isDrawerOpen) window.closeConfigDrawer(); 
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
      document.querySelectorAll('.tab-btn').forEach(el => { el.classList.remove('bg-[#eeeeee]','text-[#101010]','bg-white/10','text-white','shadow-sm','text-gray-400','text-[#8a8380]'); el.classList.add('text-[#8a8380]'); });
      document.getElementById(`tab-${tabId}`).classList.remove('hidden');
      const btn = document.getElementById(`tabBtn-${tabId}`); if (btn) { btn.classList.remove('text-[#8a8380]','text-gray-400'); btn.classList.add('bg-[#eeeeee]','text-[#101010]'); }
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
           btnP.classList.add('bg-[#eeeeee]','text-[#101010]'); btnP.classList.remove('bg-white/10','text-white','text-gray-400','text-[#8a8380]','border-transparent'); 
           btnM.classList.remove('bg-[#eeeeee]','text-[#101010]','bg-white/10','text-white'); btnM.classList.add('text-[#8a8380]','border-transparent'); 
           formP.classList.remove('hidden'); formM.classList.add('hidden'); 
           if (typeof window.populateNewProjectLocationSelect === 'function') {
               const locSel = document.getElementById('newProjLocation');
               window.populateNewProjectLocationSelect(locSel ? locSel.value : null);
           }
       } 
       else { btnM.classList.add('bg-[#eeeeee]','text-[#101010]'); btnM.classList.remove('bg-white/10','text-white','text-gray-400','text-[#8a8380]','border-transparent'); btnP.classList.remove('bg-[#eeeeee]','text-[#101010]','bg-white/10','text-white'); btnP.classList.add('text-[#8a8380]','border-transparent'); formM.classList.remove('hidden'); formP.classList.add('hidden'); }
    }
    
    window.toggleSearch = function() {
        const inp = document.getElementById('searchInput');
        const btn = document.getElementById('searchBtnIcon');
        
        if (inp.classList.contains('opacity-0')) {
            inp.classList.remove('opacity-0', 'w-0', 'pointer-events-none'); inp.classList.add('opacity-100', 'w-48', 'sm:w-64'); btn.classList.add('bg-white/10'); 
            btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
            inp.focus();
        } else {
            inp.classList.add('opacity-0', 'w-0', 'pointer-events-none'); inp.classList.remove('opacity-100', 'w-48', 'sm:w-64'); btn.classList.remove('bg-white/10'); 
            btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`;
            inp.value = ''; window.handleSearch();
            window.recenterCanvas();
        }
    }
    
    window.updateDatalist = function() {
        const dl = document.getElementById('projectsDatalist'); if(!dl) return; let allProjs = [];
        appData.directProjects.forEach(p => allProjs.push(p.name)); appData.modules.forEach(m => (m.projects||[]).forEach(p => allProjs.push(p.name)));
        allProjs.sort((a,b) => a.localeCompare(b)); dl.innerHTML = allProjs.map(n => `<option value="${escapeHtml(n)}">`).join('');
    }

    window.handleSearch = function() { activeSearchQuery = document.getElementById('searchInput').value.trim(); window.renderMindMap(); setTimeout(() => { if (typeof window.focusFilteredMindMap === 'function') window.focusFilteredMindMap(); }, 40); }

    function hasUnvalidatedNA(prefix) { return globalDocs.some(d => { const na = document.getElementById(`${prefix}Na${d.id}`), val = document.getElementById(`${prefix}NaValidated${d.id}`); return (na && na.checked && val && val.value !== "true"); }); }
    let infoCardHideTimer = null;
    window.closeInfoCardSafe = function(keepSelection = false) { 
        if(hasUnvalidatedNA('quick')) { window.showToast("⚠️ Tienes N/A sin validar.", true); return false; } 
        document.body.classList.remove('info-card-open');
        const card = document.getElementById('infoCard');
        if (card) card.classList.add('opacity-0'); 
        if (infoCardHideTimer) clearTimeout(infoCardHideTimer);
        infoCardHideTimer = setTimeout(() => {
            if (card) card.classList.add('hidden');
            document.body.classList.remove('info-card-open');
            infoCardHideTimer = null;
        }, 250); 
        if (!keepSelection && currentSelection && currentSelection.id) {
            currentSelection = { type: null, id: null };
            window.renderMindMap();
        }
        return true;
    }

    
    // === LÓGICA DE TAREA POR PROYECTO Y TAREA GLOBAL ===
    window.openProjectTaskModal = function() {
        if (currentUserRole === 'Lector') return;
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
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

    // === SENSOR DE ENFRIAMIENTO Y CÁLCULO DE DÍAS HÁBILES (FACTORY RISK ENGINE) ===
    window.calcBusinessDaysSince = function(dateStr) {
        if (!dateStr) return 0;
        let d;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
                d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            } else {
                d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            }
        } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[2] && parts[2].length === 4) {
                d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            } else if (parts[0] && parts[0].length === 4) {
                d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            } else {
                d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            }
        } else {
            d = new Date(dateStr);
        }
        
        if (isNaN(d.getTime())) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);

        if (d >= today) return 0;

        let count = 0;
        let cur = new Date(d);
        cur.setDate(cur.getDate() + 1);

        while (cur <= today) {
            const dayOfWeek = cur.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Excluir sábados (6) y domingos (0)
                count++;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    window.getProjectRiskStatus = function(proj) {
        if (!proj || proj.status === 'Completado') return null;

        const now = new Date();
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // RIESGO CRÍTICO (ROJO / FUEGO):
        // 1. Fecha límite de proyecto vencida
        let isDeadlineOver = false;
        let daysOverdue = 0;
        if (proj.deadline) {
            const parts = proj.deadline.split('-');
            if (parts.length === 3) {
                const dTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
                if (dTime < todayZero) {
                    isDeadlineOver = true;
                    daysOverdue = Math.ceil((todayZero - dTime) / (1000 * 60 * 60 * 24));
                }
            }
        }

        // 2. Entrega con cliente sin retorno por más de 5 días hábiles
        let isClientDeliveryOver = false;
        let clientWaitDays = 0;
        if (proj.clientDeliveryDate && !proj.clientReturnDate) {
            clientWaitDays = window.calcBusinessDaysSince(proj.clientDeliveryDate);
            if (clientWaitDays >= 5) {
                isClientDeliveryOver = true;
            }
        }

        if (isDeadlineOver || isClientDeliveryOver) {
            const label = isDeadlineOver 
                ? `Fecha límite vencida hace ${daysOverdue} ${daysOverdue === 1 ? 'día' : 'días'}` 
                : `Entrega a cliente sin retorno (+${clientWaitDays}d hábiles)`;
            return {
                level: 'critical',
                color: '#ff453a',
                bg: 'rgba(255, 69, 58, 0.12)',
                label: label,
                detail: `🚨 Alerta Crítica: ${label}`
            };
        }

        // RIESGO DE ENFRIAMIENTO (ÁMBAR TÉCNICO):
        // Más de 5 días hábiles en «Validación» sin revisión de supervisión
        const tasks = Array.isArray(proj.tasks) ? proj.tasks : [];
        const pendingTasks = tasks.filter(t => t && t.done === 'pending');

        if (pendingTasks.length > 0) {
            let maxDaysInValidation = 0;
            pendingTasks.forEach(t => {
                const dateStr = t.submittedDate || t.requestDate || t.assignDate;
                if (dateStr) {
                    const bDays = window.calcBusinessDaysSince(dateStr);
                    if (bDays > maxDaysInValidation) maxDaysInValidation = bDays;
                } else {
                    maxDaysInValidation = Math.max(maxDaysInValidation, 5);
                }
            });

            if (maxDaysInValidation >= 5) {
                const label = `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarea' : 'tareas'} en validación (+${maxDaysInValidation}d hábiles)`;
                return {
                    level: 'cooling',
                    color: '#ff9f0a',
                    bg: 'rgba(255, 159, 10, 0.10)',
                    label: label,
                    detail: `⏳ Sensor de Enfriamiento: ${label}`
                };
            }
        }

        return null;
    };

    // --- MÓDULO DE ALERTAS EXTERNAS (TORRE DE CONTROL GOOGLE WORKSPACE / CHAT / SLACK / TEAMS) ---
    const _chatK = ['AIzaSyDdI0hCZtE', '6vySjMm-WEfRq3CPzqKqqsHI'].join('');
    const _chatT = '_iCQr9wsy0wvYbtRNBhbkQEbc9akwecjFXn8Hqg8v0c';
    const GOOGLE_CHAT_WEBHOOK_URL = `https://chat.googleapis.com/v1/spaces/AAQAyNI0CRc/messages?key=${_chatK}&token=${_chatT}`;

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
                           `🔗 ${(typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) ? (window.location.origin + window.location.pathname) : 'https://tablerocontrolaplstgt.vercel.app/'}`;
            } else if (type === 'MORNING_DIGEST') {
                chatText = payload.message || (typeof window.generateMorningDigestText === 'function' ? window.generateMorningDigestText() : '');
            } else {
                chatText = payload.message || `🔔 *ALERTA SICOM*\n👤 *Para:* ${payload.assignedUser || 'General'}\n📋 *Detalle:* ${payload.message || ''}`;
            }

            console.log('🔔 [SICOM External Alert] Despachando notificación:', { type, preview: (chatText || '').substring(0, 60) + '...' });

            // Envío DIRECTO e INMEDIATO al Webhook de Google Chat (instantáneo, limpio y sin duplicados)
            // 1. Envío al Webhook nativo de Google Chat
            if (GOOGLE_CHAT_WEBHOOK_URL) {
                fetch(GOOGLE_CHAT_WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ text: chatText })
                }).then(() => {
                    console.log('✅ [SICOM Google Chat] Mensaje entregado directamente al Webhook de Google Chat');
                }).catch(err => {
                    console.warn('⚠️ [SICOM Google Chat] Error en Webhook de Google Chat:', err);
                });
            }

            // 2. Envío al Webhook personalizado (Slack, Teams, Discord o genérico)
            const customWebhook = (appData.config && appData.config.webhookUrl) || localStorage.getItem('sicom_custom_webhook');
            if (customWebhook && customWebhook.trim().startsWith('http')) {
                const targetUrl = customWebhook.trim();
                let customBody;
                if (targetUrl.includes('discord.com')) {
                    customBody = JSON.stringify({ content: chatText });
                } else if (targetUrl.includes('slack.com')) {
                    customBody = JSON.stringify({ text: chatText });
                } else if (targetUrl.includes('office.com') || targetUrl.includes('webhook.office')) {
                    customBody = JSON.stringify({
                        "@type": "MessageCard",
                        "@context": "http://schema.org/extensions",
                        "summary": "Alerta SICOM",
                        "text": chatText.replace(/\n/g, '<br>')
                    });
                } else {
                    customBody = JSON.stringify({
                        text: chatText,
                        type: type,
                        payload: payload,
                        timestamp: new Date().toISOString()
                    });
                }

                fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: customBody
                }).then(() => {
                    console.log('✅ [SICOM Webhook] Notificación externa entregada con éxito');
                }).catch(err => {
                    console.warn('⚠️ [SICOM Webhook] Error en webhook externo:', err);
                });
            }
        } catch (e) {
            console.warn('⚠️ [SICOM External Alert] Excepción silenciosa:', e);
        }
    };

    window.saveCustomWebhook = function(url) {
        if (!appData.config) appData.config = {};
        appData.config.webhookUrl = (url || '').trim();
        try { localStorage.setItem('sicom_custom_webhook', appData.config.webhookUrl); } catch(e) {}
        window.saveData(false);
        window.showToast("Canal de notificaciones guardado");
    };

    window.testCustomWebhook = async function() {
        const input = document.getElementById('customWebhookInput');
        const url = input ? input.value.trim() : ((appData.config && appData.config.webhookUrl) || '');
        if (!url && !GOOGLE_CHAT_WEBHOOK_URL) {
            window.showToast("Ingresa un Webhook URL válido", true);
            return;
        }
        window.showToast("Enviando prueba de alerta...");
        await window.sendExternalAlert('VALIDATION_SUBMITTED', {
            project: 'Proyecto Prueba SICOM',
            task: 'Prueba de enlace operativo y alertas inmediatas',
            feedback: 'El canal de notificaciones externas está conectado y operativo.',
            consultant: localAuthor || 'Sistema'
        });
        window.showToast("✅ Notificación de prueba despachada");
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
        
        const appUrl = (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) ? (window.location.origin + window.location.pathname) : 'https://tablerocontrolaplstgt.vercel.app/';
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
                if(currentSelection && currentSelection.id === item.id) window.renderTasksQuick(item);
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
                        window.triggerCelebration();
                    } else {
                        t.done = false;
                        delete t.feedback;
                        logActivity(item.id, item.name, `Canceló envío a validación: "${t.text}"`, localAuthor); 
                        window.saveData(false); 
                        window.renderTasksQuick(item); 
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
            <div class="py-3.5 px-3 text-center rounded-[10px] bg-[#101010] border border-dashed border-[#3d3a39] mb-2">
                <p class="font-mono text-[10px] uppercase text-[#eeeeee]">Sin tareas registradas</p>
                <p class="text-[11px] text-[#8a8380] mt-0.5">Usa el formulario inferior para asignar una actividad con fecha límite.</p>
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
            const dateColor = isChecked ? 'text-[#8a8380]' : (isOverdue ? 'text-[#ee6018]' : 'text-[#b8b3b0]');
            
            const isMyTask = t.assignee === localAuthor;
            const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
            const isAssigner = t.assignedBy === localAuthor;
            
            // canEdit permite interactuar con el checkbox (marcar completado/enviar a validación)
            const canEdit = currentUserRole !== 'Lector' && (isSuper || isMyTask || !t.assignee);
            const checkDisabled = canEdit ? '' : 'disabled';
            const checkCursor = canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50';
            
            // canDelete es estricto: Solo roles superiores o el creador de la tarea
            const canDelete = isSuper || isAssigner;
            const delBtn = canDelete ? `<button onclick="deleteQuickTask('${t.id}')" class="text-[#8a8380] hover:text-[#ee6018] opacity-0 group-hover:opacity-100 transition p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : '';
            let statusBadge = '';
            let boxUI = '';
            if (isPending) {
                statusBadge = `<span class="font-mono text-[8px] bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/40 px-1.5 py-0.5 rounded-[2px] uppercase ml-2 shrink-0 mt-0.5">⏳ Validación</span>`;
                if(isSuper) {
                    boxUI = `<button onclick="toggleQuickTask('${t.id}')" class="h-4 w-4 rounded-[2px] border border-[#ee6018] bg-[#ee6018]/20 text-[#ee6018] flex items-center justify-center shrink-0 mt-0.5 hover:bg-[#ee6018] hover:text-[#fafafa] transition" title="Haz clic para aprobar"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg></button>`;
                } else {
                    boxUI = `<input type="checkbox" checked onchange="toggleQuickTask('${t.id}')" class="rounded-[2px] border-[#ee6018] bg-[#101010] accent-[#ee6018] h-4 w-4 shrink-0 cursor-pointer mt-0.5" title="Click para cancelar envío">`;
                }
            } else if (isChecked) {
                statusBadge = `<span class="font-mono text-[8px] bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]/40 px-1.5 py-0.5 rounded-[2px] uppercase ml-2 shrink-0 mt-0.5">✓ Validada</span>`;
                boxUI = `<input type="checkbox" checked onchange="toggleQuickTask('${t.id}')" class="rounded-[2px] border-[#a0ca92] bg-[#101010] accent-[#a0ca92] h-4 w-4 shrink-0 mt-0.5 ${isSuper ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}" ${!isSuper ? 'disabled' : ''}>`;
            } else {
                boxUI = `<input type="checkbox" onchange="toggleQuickTask('${t.id}')" class="rounded-[2px] border-[#3d3a39] bg-[#101010] accent-[#ee6018] h-4 w-4 shrink-0 ${checkCursor} mt-0.5" ${checkDisabled}>`;
            }

            return `
            <div class="flex items-start gap-2.5 bg-[#101010] p-2.5 rounded-[10px] border ${isChecked ? 'border-[#3d3a39]/60 opacity-50' : (isPending ? 'border-[#ee6018]/60' : 'border-[#3d3a39]')} group transition">
                ${boxUI}
                <div class="flex flex-col flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                        <span class="text-xs text-[#eeeeee] break-words pr-2 ${isChecked ? 'line-through text-[#8a8380]' : ''}">${escapeHtml(t.text)}</span>
                        ${statusBadge}
                    </div>
                    <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        ${(t.assignDate || t.date) ? `<span class="text-[9px] text-[#8a8380] font-mono">📅 ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                        ${t.validatedDate ? `<span class="text-[9px] text-[#a0ca92] font-mono bg-[#a0ca92]/10 border border-[#a0ca92]/30 px-1.5 py-0.5 rounded-[2px]">✓ ${escapeHtml(t.validatedDate)}${t.validatedTime ? ' ' + escapeHtml(t.validatedTime) : ''}${t.validatedBy ? ' por ' + escapeHtml(t.validatedBy) : ''}</span>` : ''}
                        ${t.deadline ? `<span class="font-mono text-[9px] ${dateColor}">🎯 Límite: ${escapeHtml(t.deadline)}</span>` : ''}
                        ${t.assignee ? `<span class="font-mono text-[9px] bg-[#1d1a18] text-[#eeeeee] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">👤 ${escapeHtml(t.assignee)}</span>` : ''}
                        ${t.assignedBy && t.assignedBy !== t.assignee ? `<span class="font-mono text-[9px] bg-[#1d1a18] text-[#8a8380] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">De: ${escapeHtml(t.assignedBy)}</span>` : ''}
                    </div>
                    ${t.feedback ? `<div class="mt-2 text-[10px] text-[#b8b3b0] bg-[#1d1a18] border border-[#3d3a39] p-2 rounded-[3px]">💬 ${escapeHtml(t.feedback)}</div>` : ''}
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
            const newDrive = window.sanitizeSafeUrl(document.getElementById('quickEditDriveLink').value);
            const newInvgate = window.sanitizeSafeUrl(document.getElementById('quickEditInvgateLink').value);
            item.driveLink = newDrive;
            item.invgateLink = newInvgate;
            logActivity(item.id, item.name, 'Actualizó enlaces del proyecto', localAuthor);
            window.saveData(true);
            
            const btnDrive = document.getElementById('infoDriveBtn');
            const btnInvgate = document.getElementById('infoInvgateBtn');
            
            if(item.driveLink) {
                btnDrive.href = item.driveLink; btnDrive.classList.remove('hidden');
            } else btnDrive.classList.add('hidden');
            
            if(item.invgateLink) {
                btnInvgate.href = item.invgateLink; btnInvgate.classList.remove('hidden');
            } else btnInvgate.classList.add('hidden');

            const linksCont = document.getElementById('infoLinksContainer');
            if (linksCont) {
                if (item.driveLink || item.invgateLink) linksCont.classList.remove('hidden');
                else linksCont.classList.add('hidden');
            }
            window.showToast("Enlaces actualizados con éxito", false);
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
    window.confirmNa = function(p, id) { if(currentUserRole==='Lector') return; const btn = document.getElementById(`${p}BtnNa${id}`), valHidden = document.getElementById(`${p}NaValidated${id}`); if(valHidden)valHidden.value="true"; if(btn){btn.textContent="✓ Validado"; btn.className="pill-btn w-full py-2 bg-[#1d1a18] border border-[#a0ca92] text-[#a0ca92] font-mono text-[10px] uppercase mt-2";} p==='quick'?window.calculateQuickProgress():window.calculateEditProgress(); if(p==='quick') window.silentSaveInfoCard(); };

    window.calculateQuickProgress = function() { if(globalDocs.length===0)return; let sc = 0; const inc = 100/globalDocs.length; globalDocs.forEach(d=>{ if(document.getElementById(`quickDoc${d.id}`)?.checked || (document.getElementById(`quickNa${d.id}`)?.checked && document.getElementById(`quickNaValidated${d.id}`)?.value==="true")) sc+=inc; }); const rounded = Math.round(sc); document.getElementById('quickEditProgress').value = rounded; document.getElementById('quickEditProgressLabel').textContent = rounded+'%'; const pp = document.getElementById('infoProgressPill'); if (pp) pp.textContent = rounded+'%'; }
    window.calculateEditProgress = function() { if(globalDocs.length===0)return; let sc = 0; const inc = 100/globalDocs.length; globalDocs.forEach(d=>{ if(document.getElementById(`editDoc${d.id}`)?.checked || (document.getElementById(`editNa${d.id}`)?.checked && document.getElementById(`editNaValidated${d.id}`)?.value==="true")) sc+=inc; }); document.getElementById('editProgress').value = Math.round(sc); document.getElementById('editProgressLabel').textContent = Math.round(sc)+'%'; }

    window.renderDocChecklists = function(prefix, savedData) {
        const c = document.getElementById(`${prefix}DocsContainer`); if(!c) return; c.innerHTML = '';
        if (globalDocs.length === 0) { c.innerHTML = `<p class="font-mono text-xs text-[#8a8380] uppercase">No hay documentos base.</p>`; document.getElementById(`${prefix}SliderContainer`).classList.remove('hidden'); return; }
        document.getElementById(`${prefix}SliderContainer`).classList.add('hidden');
        c.innerHTML = globalDocs.map(doc => `<div class="bg-[#101010] p-3.5 rounded-[10px] border border-[#3d3a39] mb-2.5">
                 <div class="flex justify-between items-start gap-3">
                     <label class="flex items-start gap-3 text-xs text-[#eeeeee] cursor-pointer flex-1 group">
                        <input type="checkbox" id="${prefix}Doc${doc.id}" onchange="handleMainCheck('${prefix}', '${doc.id}')" class="rounded-[2px] border-[#3d3a39] bg-[#1d1a18] text-[#ee6018] focus:ring-[#ee6018] h-4 w-4 mt-0.5 shrink-0 transition" ${currentUserRole==='Lector'?'disabled':''}>
                        <span class="break-words whitespace-normal leading-relaxed group-hover:text-[#fafafa] transition" style="word-break: break-word;">${escapeHtml(doc.name)}</span>
                     </label>
                     <label class="flex items-center gap-1.5 font-mono text-[10px] text-[#8a8380] uppercase cursor-pointer shrink-0 mt-0.5">
                        <input type="checkbox" id="${prefix}Na${doc.id}" onchange="handleNaCheck('${prefix}', '${doc.id}')" class="rounded-[2px] border-[#3d3a39] bg-[#1d1a18] text-[#8a8380] h-3.5 w-3.5 transition" ${currentUserRole==='Lector'?'disabled':''}>N/A
                     </label>
                 </div>
                 <div id="${prefix}ObsContainer${doc.id}" class="flex flex-col gap-2 hidden mt-2.5 pt-2.5 border-t border-[#3d3a39]"><input type="text" id="${prefix}Obs${doc.id}" oninput="handleObsInput('${prefix}', '${doc.id}')" placeholder="Motivo N/A..." class="w-full liquid-input rounded-[3px] p-2.5 text-xs focus:outline-none text-[#eeeeee]" ${currentUserRole==='Lector'?'readonly':''}><button id="${prefix}BtnNa${doc.id}" type="button" onclick="confirmNa('${prefix}', '${doc.id}')" class="hidden pill-btn w-full py-2 bg-[#fafafa] hover:bg-[#eeeeee] font-mono text-[10px] uppercase text-[#101010] transition">Validar N/A</button></div>
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
                if(data.na && data.naValidated) { const btn = document.getElementById(`${prefix}BtnNa${doc.id}`); btn.classList.remove('hidden'); btn.textContent = "✓ Validado"; btn.className = "pill-btn w-full py-2 bg-[#1d1a18] border border-[#a0ca92] text-[#a0ca92] font-mono text-[10px] uppercase mt-2"; } else if(data.na && !data.naValidated) { const btn = document.getElementById(`${prefix}BtnNa${doc.id}`); btn.classList.remove('hidden'); btn.textContent = "Validar N/A"; }
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
      if (infoCardHideTimer) { clearTimeout(infoCardHideTimer); infoCardHideTimer = null; }
      const card = document.getElementById('infoCard'); let item = null;
      document.getElementById('infoQuickEditContainer').classList.add('hidden'); document.getElementById('btnFullEditInfoCard').classList.add('hidden');
      document.getElementById('infoNotesContainer').classList.add('hidden');
      const modActions = document.getElementById('moduleActionsInfoCard');
      if (modActions) modActions.classList.add('hidden');
      card.dataset.notesSig = '';
      document.getElementById('infoRelativeTime').classList.add('hidden');
      document.getElementById('infoDriveBtn').classList.add('hidden');
      document.getElementById('infoInvgateBtn').classList.add('hidden');
      const linksCont = document.getElementById('infoLinksContainer');
      if (linksCont) linksCont.classList.add('hidden');
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
        document.getElementById('infoConsultant').innerHTML = `<span class="font-mono text-[#eeeeee] font-medium text-sm">${appData.modules.length} MÓDULOS</span>`;
        document.getElementById('infoMetricLabel').textContent = 'PROYECTOS';
        document.getElementById('infoMetricValue').innerHTML = `<span class="font-mono text-[#eeeeee] font-medium text-sm">${totalProjects} TOTALES</span>`;
      } else if (type === 'direct-hub' || type === 'module') {
        item = type === 'module' ? appData.modules.find(m => m.id === id) : appData.directHub;
        document.getElementById('infoType').textContent = type==='module'?'MÓDULO':'AGRUPADOR';
        const projs = type === 'module' ? (item.projects || []) : (appData.directProjects || []);
        const avgProg = projs.length > 0 ? Math.round(projs.reduce((acc, p) => acc + (p.progress || 0), 0) / projs.length) : 0;
        const leftLbl = document.getElementById('infoBoxLeftLabel'); if (leftLbl) leftLbl.textContent = 'PROYECTOS';
        document.getElementById('infoConsultant').innerHTML = `<span class="font-mono text-[#eeeeee] font-medium text-sm">${projs.length} ASIGNADOS</span>`;
        document.getElementById('infoMetricLabel').textContent = 'AVANCE';
        document.getElementById('infoMetricValue').innerHTML = `<span class="font-mono text-[#a0ca92] font-medium text-sm">${avgProg}%</span>`;
        
        // Detección de proyectos dependientes / vinculados de otros módulos
        const modIdCheck = type === 'module' ? id : 'DIRECT';
        const sharedProjs = [];
        (appData.directProjects || []).forEach(p => {
          if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(modIdCheck) || (modIdCheck === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
            sharedProjs.push({ proj: p, projType: 'direct-project', parentColor: (appData.directHub && appData.directHub.color) || '#f59e0b' });
          }
        });
        (appData.modules || []).forEach(m => {
          (m.projects || []).forEach(p => {
            if (Array.isArray(p.secondaryModules) && (p.secondaryModules.includes(modIdCheck) || (modIdCheck === 'DIRECT' && p.secondaryModules.includes('hub-direct')))) {
              sharedProjs.push({ proj: p, projType: 'project', parentColor: m.color || '#eeeeee' });
            }
          });
        });
        if (modContainer && sharedProjs.length > 0) {
          modContainer.innerHTML = `
            <div class="w-full font-mono text-[10px] uppercase text-[#eeeeee] bg-[#1d1a18] border border-[#3d3a39] px-3 py-2 rounded-[3px] flex items-center justify-between">
              <span class="flex items-center gap-1.5"><span>🔗</span> <b>${sharedProjs.length}</b> proyecto(s) vinculados</span>
              <span class="text-[9px] text-[#b8b3b0] bg-[#101010] px-2 py-0.5 rounded-[2px] border border-[#3d3a39]">Multimódulo</span>
            </div>
          `;
          const chipsWrap = document.createElement('div');
          chipsWrap.className = "w-full flex flex-wrap gap-1.5 mt-1";
          sharedProjs.forEach(({ proj, projType, parentColor }) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1.5 rounded-[3px] text-[#eeeeee] bg-[#1d1a18] hover:bg-[#101010] border transition";
            chip.style.borderColor = parentColor || '#3d3a39';
            chip.title = "Ir al proyecto vinculado";
            chip.innerHTML = `<span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${parentColor}"></span><span>🔗 ${escapeHtml(proj.name)}</span><span class="text-[9px] text-[#8a8380] ml-0.5">↗</span>`;
            chip.onclick = () => {
              const modKey = type === 'module' ? id : 'hub-direct';
              if (collapsedModules.has(modKey)) {
                collapsedModules.delete(modKey);
                lastExpandedModuleId = modKey;
                window.updateCollapseAllButtonState();
                window.renderMindMap();
              }
              window.selectNode(projType, proj.id);
            };
            chipsWrap.appendChild(chip);
          });
          modContainer.appendChild(chipsWrap);
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
              const st = window.getCompanyStyle ? window.getCompanyStyle(c) : { color: '#ee6018', bg: 'rgba(238,96,24,0.15)', border: 'rgba(238,96,24,0.3)', icon: '🏢' };
              const pill = document.createElement('span');
              pill.className = "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded-[3px] border";
              pill.style.backgroundColor = st.bg;
              pill.style.borderColor = st.border;
              pill.style.color = st.color;
              pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full" style="background-color: ${st.color}"></span>${st.icon} ${escapeHtml(c)}`;
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
          pPill.className = "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded-[3px] text-[#eeeeee] bg-[#1d1a18] hover:bg-[#101010] border transition";
          pPill.style.borderColor = primMod.color || '#3d3a39';
          pPill.innerHTML = `<span class="w-2 h-2 rounded-full" style="background-color: ${primMod.color || '#eeeeee'}"></span>📦 ${escapeHtml(primMod.name)} <span class="text-[9px] text-[#8a8380] font-normal uppercase">(Base)</span>`;
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
              sPill.className = "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded-[3px] text-[#b8b3b0] hover:text-[#eeeeee] bg-[#101010] hover:bg-[#1d1a18] border transition";
              sPill.style.borderColor = sMod.color || '#3d3a39';
              sPill.title = "Módulo dependiente / vinculación cruzada";
              sPill.innerHTML = `<span class="w-2 h-2 rounded-full" style="background-color: ${sMod.color || '#eeeeee'}"></span>🔗 ${escapeHtml(sMod.name)}`;
              sPill.onclick = () => window.selectNode(sType, sMod.id);
              modContainer.appendChild(sPill);
            }
          });
        }

        const leftLbl = document.getElementById('infoBoxLeftLabel'); if (leftLbl) leftLbl.textContent = 'CONSULTOR(ES)';
        document.getElementById('infoConsultant').innerHTML = getProjectConsultants(item).map(n => `<span class="inline-flex items-center gap-1.5 text-xs text-[#eeeeee]"><span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${consultants[n]?consultants[n].color:'#8a8380'}"></span>${escapeHtml(n)}</span>`).join('') || '<span class="text-[#8a8380] text-xs">Sin asignar</span>';
        document.getElementById('infoMetricLabel').textContent = 'PRIORIDAD';
        const prioNum = parseFloat(item.priority || 1);
        const prioTag = prioNum <= 3 ? 'ALTA' : (prioNum <= 6 ? 'MEDIA' : 'BAJA');
        const prioColor = prioNum <= 3 ? 'text-[#ee6018] border-[#ee6018]/40' : (prioNum <= 6 ? 'text-[#eeeeee] border-[#3d3a39]' : 'text-[#8a8380] border-[#3d3a39]');
        document.getElementById('infoMetricValue').innerHTML = `<span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[3px] bg-[#101010] border ${prioColor} font-medium">#${item.priority || 1} · ${prioTag}</span>`;
        document.getElementById('infoQuickEditContainer').classList.remove('hidden'); 
        
        const btnDrive = document.getElementById('infoDriveBtn');
        const btnInvgate = document.getElementById('infoInvgateBtn');
        const linksCont = document.getElementById('infoLinksContainer');
        
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

        if (linksCont) {
            if (item.driveLink || item.invgateLink) linksCont.classList.remove('hidden');
            else linksCont.classList.add('hidden');
        }

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
        
        const riskInfo = window.getProjectRiskStatus(item);
        if (riskInfo) {
            const rt = document.getElementById('infoRelativeTime');
            rt.classList.remove('hidden');
            if (riskInfo.level === 'critical') {
                rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center justify-between gap-2 bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/40";
                rt.innerHTML = `<span>🚨 ${escapeHtml(riskInfo.label)}</span><span class="w-2 h-2 rounded-full bg-[#ff453a] animate-ping shrink-0"></span>`;
            } else {
                rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center justify-between gap-2 bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/40";
                rt.innerHTML = `<span>⏳ ${escapeHtml(riskInfo.label)}</span><span class="w-2 h-2 rounded-full bg-[#ff9f0a] animate-ping shrink-0"></span>`;
            }
        } else if (item.deadline) {
            const rt = document.getElementById('infoRelativeTime'); rt.classList.remove('hidden');
            const [y,m,d] = item.deadline.split('-'); const dDate = new Date(y, m-1, d); const today = new Date(new Date().setHours(0,0,0,0));
            const diffTime = dDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if(item.status === 'Completado') { rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center gap-2 bg-[#1d1a18] text-[#a0ca92] border-[#a0ca92]/40"; rt.innerHTML = "✅ ENTREGADO"; }
            else if(diffDays < 0) { rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center gap-2 bg-[#1d1a18] text-[#ee6018] border-[#ee6018]/60"; rt.innerHTML = `⚠️ VENCIDO HACE ${Math.abs(diffDays)} DÍAS`; }
            else if(diffDays === 0) { rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center gap-2 bg-[#1d1a18] text-[#ee6018] border-[#ee6018]/40"; rt.innerHTML = `⚠️ VENCE HOY`; }
            else { rt.className = "font-mono text-[10px] uppercase px-3 py-2 rounded-[3px] mb-4 border flex items-center gap-2 bg-[#1d1a18] text-[#b8b3b0] border-[#3d3a39]"; rt.innerHTML = `📅 VENCE EN ${diffDays} DÍAS`; }
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
      const progPill = document.getElementById('infoProgressPill');
      if (progPill) {
        if (type === 'project' || type === 'direct-project') {
          progPill.textContent = Math.round(item.progress || 0) + '%';
          progPill.classList.remove('hidden');
        } else {
          progPill.classList.add('hidden');
        }
      }
      document.body.classList.add('info-card-open');
      card.classList.remove('hidden'); 
      setTimeout(() => card.classList.remove('opacity-0'), 10);
    }
    window.editFromInfoCard = function() {
      if (!currentSelection || !currentSelection.id) return;
      const targetType = currentSelection.type;
      const targetId = currentSelection.id;
      if (window.closeInfoCardSafe(true) === false) return;
      window.selectNodeAndOpenConfig(targetType, targetId);
      const card = document.getElementById('infoCard');
      if (card) {
        if (infoCardHideTimer) { clearTimeout(infoCardHideTimer); infoCardHideTimer = null; }
        card.classList.add('opacity-0', 'hidden');
        document.body.classList.remove('info-card-open');
      }
    }

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
      if (isProject && !item._renderData) {
          let parentModKey = (type === 'direct-project') ? 'hub-direct' : null;
          if (!parentModKey) {
              const pMod = (appData.modules || []).find(m => (m.projects || []).some(p => p.id === id));
              if (pMod) parentModKey = pMod.id;
          }
          if (parentModKey && collapsedModules.has(parentModKey)) {
              collapsedModules.delete(parentModKey);
              lastExpandedModuleId = parentModKey;
              window.updateCollapseAllButtonState();
              window.renderMindMap();
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
        const passInp = document.getElementById('passNewValue');
        passInp.value = '';
        passInp.placeholder = (consultants[name] && consultants[name].password)
            ? '•••••••• (Activa — deja vacío para restablecer)'
            : 'Nueva contraseña personalizada...';
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
            consultants[name].password = 'sha256:' + sha256Hex(newPass);
        } else {
            delete consultants[name].password; // Vuelve a la default del rol
        }
        window.saveData(false);
        window.showToast("Contraseña actualizada y protegida (SHA-256)", false);
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
      const all = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector');
      const mkChk = (pr) => all.map(n => `<label class="flex items-center gap-3 text-xs font-normal text-[#eeeeee] cursor-pointer p-2.5 bg-[#101010] hover:bg-[#1d1a18] rounded-[3px] transition border border-[#3d3a39] hover:border-[#4d4947]"><input type="checkbox" value="${escapeHtml(n)}" class="${pr}-chk rounded-[2px] border-[#3d3a39] bg-[#101010] text-[#ee6018] focus:ring-[#ee6018] h-4 w-4"><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${consultants[n].color}"></span>${escapeHtml(n)}</label>`).join('');
      document.getElementById('editConsultantsChecks').innerHTML = mkChk('editProjCons'); document.getElementById('newProjConsultantsChecks').innerHTML = mkChk('newProjCons');
    }
    window.renderRegisteredConsultantsList = function() {
      const all = Object.keys(consultants); document.getElementById('consultantsCountBadge').textContent = all.length;
      document.getElementById('registeredConsultantsList').innerHTML = all.map(n => {
        let cnt = 0; (appData.directProjects||[]).forEach(p=>{if(getProjectConsultants(p).includes(n))cnt++;}); appData.modules.forEach(m=>{(m.projects||[]).forEach(p=>{if(getProjectConsultants(p).includes(n))cnt++;});});
        const cData = consultants[n];
        return `<div class="flex flex-col w-full p-4 bg-[#1d1a18] rounded-[10px] border border-[#3d3a39] mb-2.5 group" style="border-left: 2px solid ${cData.color};">
                   <div class="flex items-center justify-between gap-3 mb-2">
                       <div class="w-9 h-9 rounded-[3px] overflow-hidden border border-[#3d3a39] relative shrink-0">
                          <input type="color" value="${cData.color}" onchange="handleUpdateExistingConsultantColor('${jsArg(n)}', this.value)" class="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0">
                       </div>
                       <div class="flex-1 min-w-0"><span class="text-sm text-[#eeeeee] font-normal block truncate">${escapeHtml(n)}</span><span class="font-mono text-[10px] text-[#8a8380] uppercase block mt-0.5">${cnt} proyectos</span></div>
                       <button onclick="openPasswordModal('${jsArg(n)}')" class="p-2 hover:bg-[#101010] text-[#b8b3b0] hover:text-[#eeeeee] border border-transparent hover:border-[#3d3a39] rounded-[3px] transition shrink-0" title="Cambiar Contraseña"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></button>
                       <button onclick="openRenameModal('${jsArg(n)}')" class="p-2 hover:bg-[#101010] text-[#b8b3b0] hover:text-[#eeeeee] border border-transparent hover:border-[#3d3a39] rounded-[3px] transition shrink-0" title="Renombrar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                       <button onclick="requestDeleteConsultant('${jsArg(n)}')" class="p-2 hover:bg-[#101010] text-[#8a8380] hover:text-[#ee6018] border border-transparent hover:border-[#ee6018] rounded-[3px] transition shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                   </div>
                   <div class="flex items-center gap-2 border-t border-[#3d3a39] pt-2 mt-1">
                       <span class="font-mono text-[9px] text-[#8a8380] uppercase">Rol asignado:</span>
                       <select onchange="updateConsultantRole('${jsArg(n)}', this.value)" class="bg-[#101010] font-mono text-[10px] text-[#eeeeee] border border-[#3d3a39] rounded-[3px] px-2 py-0.5 focus:outline-none cursor-pointer">
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
        document.getElementById('registeredDocsList').innerHTML = globalDocs.map((d, i) => `<div class="flex items-center p-3 bg-[#1d1a18] rounded-[10px] border border-[#3d3a39] gap-2.5 mb-2"><div class="flex flex-col gap-1 shrink-0"><button onclick="moveDoc(${i}, -1)" class="text-[#b8b3b0] hover:text-[#101010] bg-[#101010] hover:bg-[#eeeeee] border border-[#3d3a39] rounded-[2px] p-0.5 text-[9px] transition">&uarr;</button><button onclick="moveDoc(${i}, 1)" class="text-[#b8b3b0] hover:text-[#101010] bg-[#101010] hover:bg-[#eeeeee] border border-[#3d3a39] rounded-[2px] p-0.5 text-[9px] transition">&darr;</button></div><span class="font-mono text-[10px] text-[#b8b3b0] bg-[#101010] px-2 py-1 rounded-[3px] shrink-0 border border-[#3d3a39]">${String(i+1).padStart(2, '0')}</span><input type="text" value="${escapeHtml(d.name)}" onchange="globalDocs[${i}].name=this.value; saveData(false);" class="bg-transparent border border-transparent hover:border-[#3d3a39] focus:border-[#eeeeee] rounded-[3px] text-xs text-[#eeeeee] font-normal w-full p-2 focus:outline-none transition"><button onclick="deleteDoc('${d.id}')" class="p-2 hover:bg-[#101010] text-[#8a8380] hover:text-[#ee6018] border border-transparent hover:border-[#ee6018] rounded-[3px] transition shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div>`).join('');
    }
    window.moveDoc = function(idx, dir) { if(idx+dir < 0 || idx+dir >= globalDocs.length) return; const t = globalDocs[idx]; globalDocs[idx] = globalDocs[idx+dir]; globalDocs[idx+dir] = t; window.saveData(false); window.renderRegisteredDocsList(); }
    window.deleteDoc = function(id) { globalDocs = globalDocs.filter(d => d.id !== id); window.saveData(false); window.renderRegisteredDocsList(); }

    let activePriorityConsultantTab = null;
    window.setPriorityConsultantTab = function(cons) {
        activePriorityConsultantTab = cons;
        window.renderPriorityDrawer();
        const c = document.getElementById('priorityListContainer');
        if (c) c.scrollTop = 0;
    };

    window.renderPriorityDrawer = function() {
        const c = document.getElementById('priorityListContainer');
        const tabsBar = document.getElementById('priorityTabsBar');
        if (!c) return;
        const all = (!activeFilterConsultants.includes('ALL') && activeFilterConsultants.length > 0) ? activeFilterConsultants : Object.keys(consultants);
        const statusMatches = (p) => (activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0 || activeFilterStatuses.includes(p.status));
        const companyMatches = (p) => (activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0 || window.getProjectCompanies(p).some(comp => activeFilterCompanies.includes(comp)));
        const isModAllPrio = activeFilterModules.includes('ALL') || activeFilterModules.length === 0;
        const selModsPrio = new Set(activeFilterModules.filter(x => x !== 'ALL').map(normModId));
        const moduleMatches = (p, modId) => {
            if (isModAllPrio) return true;
            const pPrim = normModId(modId);
            const pSecs = (Array.isArray(p.secondaryModules) ? p.secondaryModules : []).map(normModId);
            const allMods = new Set([pPrim, ...pSecs].filter(Boolean));
            if (moduleFilterMode === 'CORRELATED' && selModsPrio.size >= 2) {
                return [...allMods].filter(m => selModsPrio.has(m)).length >= 2;
            }
            return selModsPrio.has(pPrim);
        };

        const groups = [];
        all.forEach(cons => {
            const cData = consultants[cons];
            if (!cData) return;
            let projs = [];
            appData.directProjects.forEach(p => { if (getProjectConsultants(p).includes(cons) && statusMatches(p) && companyMatches(p) && moduleMatches(p, 'hub-direct')) projs.push({ ...p, parentName: appData.directHub.name, pType: 'direct-project' }); });
            appData.modules.forEach(m => { (m.projects || []).forEach(p => { if (getProjectConsultants(p).includes(cons) && statusMatches(p) && companyMatches(p) && moduleMatches(p, m.id)) projs.push({ ...p, parentName: m.name, pType: 'project' }); }); });
            if (projs.length === 0) return;
            projs.sort((a, b) => parseFloat(a.priority || 0) - parseFloat(b.priority || 0));
            groups.push({ cons, cData, projs });
        });

        if (groups.length === 0) {
            if (tabsBar) { tabsBar.innerHTML = ''; tabsBar.classList.add('hidden'); }
            c.innerHTML = `<div class="flex flex-col items-center justify-center py-20 text-center opacity-50"><svg class="w-12 h-12 text-[#8a8380] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg><p class="font-mono text-xs text-[#b8b3b0] uppercase">Sin coincidencias.</p></div>`;
            return;
        }

        const validNames = groups.map(g => g.cons);
        if (!activePriorityConsultantTab || (activePriorityConsultantTab !== 'ALL' && !validNames.includes(activePriorityConsultantTab))) {
            activePriorityConsultantTab = groups[0].cons;
        }

        if (tabsBar) {
            if (groups.length > 1) {
                tabsBar.classList.remove('hidden');
                const totalProjs = groups.reduce((acc, g) => acc + g.projs.length, 0);
                let tabsHtml = `<div class="flex items-center justify-between mb-2"><span class="font-mono text-[10px] text-[#8a8380] uppercase">Seleccionar Consultor</span><span class="font-mono text-[10px] text-[#b8b3b0] uppercase">${groups.length} activos</span></div>`;
                tabsHtml += `<div class="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-0.5">`;
                groups.forEach(g => {
                    const isAct = activePriorityConsultantTab === g.cons;
                    const borderStyle = isAct ? `border-color: ${g.cData.color}; background-color: #1d1a18;` : `border-color: #3d3a39; background-color: #101010;`;
                    tabsHtml += `<button type="button" onclick="window.setPriorityConsultantTab('${jsArg(g.cons)}')" class="px-2.5 py-2 rounded-[3px] border text-left transition flex items-center justify-between gap-1.5 hover:bg-[#1d1a18]" style="${borderStyle}">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${g.cData.color}"></span>
                            <span class="font-mono text-[10px] uppercase truncate ${isAct ? 'text-[#eeeeee]' : 'text-[#b8b3b0]'}">${escapeHtml(g.cons)}</span>
                        </div>
                        <span class="font-mono text-[9px] px-1.5 py-0.2 rounded-[2px] bg-[#101010] border border-[#3d3a39] shrink-0" style="color: ${isAct ? g.cData.color : '#8a8380'}">${g.projs.length}</span>
                    </button>`;
                });
                const isAllAct = activePriorityConsultantTab === 'ALL';
                tabsHtml += `<button type="button" onclick="window.setPriorityConsultantTab('ALL')" class="col-span-2 px-2.5 py-1.5 rounded-[3px] border text-center transition flex items-center justify-center gap-2 ${isAllAct ? 'bg-[#eeeeee] text-[#101010] border-[#eeeeee]' : 'bg-[#101010] hover:bg-[#1d1a18] text-[#b8b3b0] border-[#3d3a39]'}">
                    <span class="font-mono text-[10px] uppercase">Ver Todos los Consultores (${totalProjs})</span>
                </button>`;
                tabsHtml += `</div>`;
                tabsBar.innerHTML = tabsHtml;
            } else {
                tabsBar.innerHTML = '';
                tabsBar.classList.add('hidden');
            }
        }

        const renderProjectCards = (projs, cData) => projs.map(p => {
            let sIco = p.status === 'En Progreso' ? '🚀' : (p.status === 'Completado' ? '✅' : (p.status === 'No Iniciado' ? '⏸️' : '⏳'));
            let over = false;
            if (p.deadline && p.status !== 'Completado') {
                const [y, m, d] = p.deadline.split('-');
                if (new Date(y, m - 1, d) < new Date(new Date().setHours(0, 0, 0, 0))) over = true;
            }
            const pComps = window.getProjectCompanies(p);
            const compBadges = pComps.map(comp => {
                const st = window.getCompanyStyle ? window.getCompanyStyle(comp) : { color: '#ee6018', bg: 'rgba(238,96,24,0.15)', border: 'rgba(238,96,24,0.3)', icon: '🏢' };
                return `<span class="font-mono text-[9px] uppercase px-2 py-0.5 rounded-[3px] border" style="background-color:${st.bg}; color:${st.color}; border-color:${st.border};">${st.icon} ${escapeHtml(comp)}</span>`;
            }).join('');
            return `<div class="bg-[#1d1a18] border ${over ? 'border-[#ee6018]' : 'border-[#3d3a39] hover:border-[#eeeeee]'} rounded-[10px] p-4 flex gap-3.5 transition-colors cursor-pointer group" style="border-left: 2px solid ${over ? '#ee6018' : cData.color};" onclick="window.selectNodeAndOpenConfig('${p.pType}', '${p.id}')"><div class="font-mono text-lg font-normal mt-0.5 shrink-0 w-8 text-center" style="color: ${cData.color}">*${p.priority}</div><div class="flex-1 min-w-0"><h4 class="text-sm font-normal text-[#eeeeee] leading-tight group-hover:text-[#fafafa] transition truncate">${over ? '⚠️ ' : ''}${escapeHtml(p.name)}</h4><p class="font-mono text-[10px] text-[#8a8380] mt-1 uppercase truncate">└ ${escapeHtml(p.parentName)}</p><div class="flex flex-wrap items-center gap-1.5 mt-2.5">${compBadges}<span class="font-mono text-[9px] uppercase px-2 py-0.5 rounded-[3px] bg-[#101010] border border-[#3d3a39] text-[#b8b3b0]">${sIco} ${p.status || 'Pendiente'} (${p.progress || 0}%)</span>${p.deadline ? `<span class="font-mono text-[9px] uppercase ${over ? 'text-[#ee6018] border-[#ee6018]/50' : 'text-[#b8b3b0] border-[#3d3a39]'} bg-[#101010] border px-2 py-0.5 rounded-[3px]">📅 ${p.deadline}</span>` : ''}</div></div></div>`;
        }).join('');

        let h = '';
        const visibleGroups = (groups.length > 1 && activePriorityConsultantTab !== 'ALL')
            ? groups.filter(g => g.cons === activePriorityConsultantTab)
            : groups;

        if (groups.length > 1 && activePriorityConsultantTab === 'ALL') {
            visibleGroups.forEach(g => {
                h += `<details class="group bg-[#101010] border border-[#3d3a39] rounded-[10px] mb-3 overflow-hidden" open>
                    <summary class="flex items-center gap-2.5 p-3.5 bg-[#1d1a18] cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-[#3d3a39]/30 transition" style="border-left: 2px solid ${g.cData.color};">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${g.cData.color}"></span>
                        <span class="font-mono text-[11px] uppercase text-[#eeeeee] truncate">${escapeHtml(g.cons)}</span>
                        <span class="bg-[#101010] text-[#b8b3b0] px-2 py-0.5 rounded-[3px] font-mono text-[10px] ml-auto border border-[#3d3a39]">${g.projs.length} PROYS</span>
                        <svg class="w-4 h-4 text-[#8a8380] group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 9l-7 7-7-7"/></svg>
                    </summary>
                    <div class="p-3 space-y-2.5 border-t border-[#3d3a39]">${renderProjectCards(g.projs, g.cData)}</div>
                </details>`;
            });
        } else {
            visibleGroups.forEach(g => {
                h += `<div class="mb-4"><div class="flex items-center gap-2 mb-3 px-1"><span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${g.cData.color}"></span><h3 class="font-mono text-[11px] uppercase text-[#eeeeee] truncate">${escapeHtml(g.cons)}</h3><span class="bg-[#1d1a18] text-[#b8b3b0] px-2 py-0.5 rounded-[3px] font-mono text-[10px] ml-auto border border-[#3d3a39]">${g.projs.length} PROYS</span></div><div class="space-y-2.5">${renderProjectCards(g.projs, g.cData)}</div></div>`;
            });
        }
        c.innerHTML = h;
    }

    window.renderMindMap = function() {
      if (!canvasGroup) return; canvasGroup.innerHTML = '';
      const dynamicDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      canvasGroup.appendChild(dynamicDefs);
      const q = activeSearchQuery.toLowerCase();

      ensureDataStructure();
      if (!initialCollapseApplied) {
          collapsedModules.add('hub-direct');
          knownModuleIds.add('hub-direct');
          (appData.modules || []).forEach(m => {
              if (m && m.id) {
                  collapsedModules.add(m.id);
                  knownModuleIds.add(m.id);
              }
          });
          initialCollapseApplied = true;
          window.updateCollapseAllButtonState();
      } else {
          // Cualquier módulo que llegue por primera vez (ej. desde Firebase o recién creado) inicia colapsado
          if (!knownModuleIds.has('hub-direct')) {
              collapsedModules.add('hub-direct');
              knownModuleIds.add('hub-direct');
          }
          (appData.modules || []).forEach(m => {
              if (m && m.id && !knownModuleIds.has(m.id)) {
                  collapsedModules.add(m.id);
                  knownModuleIds.add(m.id);
              }
          });
      }

      // Garantizar que todos los proyectos tengan su _modId primario antes de evaluar filtros
      (appData.directProjects || []).forEach(p => {
          if (p) { p._modId = 'hub-direct'; p._renderData = null; }
      });
      (appData.modules || []).forEach(m => {
          if (!m) return;
          (m.projects || []).forEach(p => {
              if (p) { p._modId = m.id; p._renderData = null; }
          });
      });

      const isModAll = activeFilterModules.includes('ALL') || activeFilterModules.length === 0;
      const selectedNormMods = new Set(activeFilterModules.filter(x => x !== 'ALL').map(normModId));
      const isMultiModSelected = !isModAll && selectedNormMods.size >= 2;

      const getProjectAllNormMods = (p) => {
          const orig = p._origProj || p;
          const prim = normModId(orig._modId || p._modId);
          const secs = (Array.isArray(orig.secondaryModules) ? orig.secondaryModules : []).map(normModId);
          return new Set([prim, ...secs].filter(Boolean));
      };

      const isProjectModCorrelated = (p) => {
          if (!isMultiModSelected) return false;
          const pMods = getProjectAllNormMods(p);
          let matchCount = 0;
          pMods.forEach(mId => { if (selectedNormMods.has(mId)) matchCount++; });
          return matchCount >= 2;
      };
      
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

          if (!isModAll) {
              const pContainerMod = normModId(p._modId);
              const origPrim = normModId((p._origProj || p)._modId || p._modId);
              const pAllMods = getProjectAllNormMods(p);

              if (!selectedNormMods.has(pContainerMod)) return false;

              if (selectedNormMods.size === 1) {
                  // Selección de 1 solo módulo: enfocar exclusivamente los proyectos de ese módulo sin expandir otros
                  if (!pAllMods.has(pContainerMod)) return false;
              } else {
                  // Multiselección de módulos (2 o más)
                  // Evitar duplicar una copia vinculada si su módulo primario ya está entre los seleccionados
                  if (p._isLinkedCopy && selectedNormMods.has(origPrim)) return false;
                  if (p._isLinkedCopy && !selectedNormMods.has(origPrim)) {
                      const firstSelectedSec = [...selectedNormMods].find(sm => pAllMods.has(sm));
                      if (pContainerMod !== firstSelectedSec) return false;
                  }
                  if (moduleFilterMode === 'CORRELATED') {
                      if (!isProjectModCorrelated(p)) return false;
                  }
              }
          }
          if (activeFilterStatuses.length > 0 && !activeFilterStatuses.includes('ALL')) {
              if (!activeFilterStatuses.includes(p.status)) return false;
          }
          if (activeFilterConsultants.length > 0 && !activeFilterConsultants.includes('ALL')) {
              const pCons = getProjectConsultants(p);
              if (consultantFilterMode === 'ALL_SELECTED' && activeFilterConsultants.length >= 2) {
                  if (!activeFilterConsultants.every(c => pCons.includes(c))) return false;
              } else {
                  if (!pCons.some(c => activeFilterConsultants.includes(c))) return false;
              }
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
          isModAll &&
          isStatusAll &&
          isConsAll &&
          isCompAll &&
          activeFilterUrgency === 'ALL' &&
          activeFilterPriority === 'ALL' &&
          activeFilterBottleneck === 'ALL' &&
          !q;

      function isModuleCollapsed(modId, n) {
          const nMod = normModId(modId);
          if (!isDefaultState) {
              if (!isModAll && !selectedNormMods.has(nMod)) {
                  return true;
              }
              return (n.projects || []).length === 0;
          }
          return collapsedModules.has(modId);
      }

      const directHubItem = appData.directHub || (appData.directHub = { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' });
      const visDir = appData.directProjects || [];
      const activeMods = (appData.modules || []).filter(m => m && typeof m === 'object');

      const getLinkedProjectsForModule = (modId) => {
          const linked = [];
          if (modId !== 'hub-direct' && modId !== 'DIRECT') {
              visDir.forEach(p => {
                  if (Array.isArray(p.secondaryModules) && p.secondaryModules.includes(modId)) {
                      linked.push(Object.assign(Object.create(p), {
                          _isLinkedCopy: true,
                          _origProj: p,
                          _modId: modId,
                          _strictType: 'direct-project',
                          _renderData: null
                      }));
                  }
              });
          }
          activeMods.forEach(m => {
              if (!m || m.id === modId) return;
              (m.projects || []).forEach(p => {
                  const isSec = Array.isArray(p.secondaryModules) && (
                      p.secondaryModules.includes(modId) ||
                      (modId === 'hub-direct' && p.secondaryModules.includes('DIRECT')) ||
                      (modId === 'DIRECT' && p.secondaryModules.includes('hub-direct'))
                  );
                  if (isSec) {
                      linked.push(Object.assign(Object.create(p), {
                          _isLinkedCopy: true,
                          _origProj: p,
                          _modId: modId,
                          _strictType: 'project',
                          _renderData: null
                      }));
                  }
              });
          });
          return linked;
      };

      const buildModuleProjectsList = (modId, ownP, linkedP) => {
          const rawList = ownP.length > 0 ? ownP : linkedP;
          return isDefaultState ? rawList : rawList.filter(p => isFiltered(p));
      };

      const dirLinked = getLinkedProjectsForModule('hub-direct');
      // Ordenamiento por Peso (Gravedad al Centro): mayor a menor según cantidad de proyectos
      const allNodes = [
          {
              type: 'direct-hub',
              item: directHubItem,
              ownProjects: visDir,
              linkedProjects: dirLinked,
              projects: buildModuleProjectsList('hub-direct', visDir, dirLinked)
          }
      ];
      
      activeMods.forEach(m => {
          if (!m.id) m.id = 'm_' + Math.random().toString(36).slice(2, 9);
          if (!m.name) m.name = 'Módulo';
          if (!m.color) m.color = '#0071e3';
          const ownP = m.projects || [];
          const linkedP = getLinkedProjectsForModule(m.id);
          allNodes.push({
              type: 'module',
              item: m,
              ownProjects: ownP,
              linkedProjects: linkedP,
              projects: buildModuleProjectsList(m.id, ownP, linkedP)
          });
      });

      allNodes.sort((a, b) => ((b.ownProjects || []).length || (b.linkedProjects || []).length) - ((a.ownProjects || []).length || (a.linkedProjects || []).length));

      // Simetría izquierda (Oeste) y derecha (Este), con los más pesados al centro (y ≈ 0) y los ligeros hacia Norte y Sur
      const leftRaw = [], rightRaw = [];
      allNodes.forEach((n, idx) => {
          if (idx % 2 === 0) leftRaw.push(n);
          else rightRaw.push(n);
      });

      function arrangeFromCenterOutward(rawList) {
          const ordered = [];
          rawList.forEach((n, idx) => {
              if (idx === 0) ordered.push(n);
              else if (idx % 2 === 1) ordered.unshift(n); // Hacia zona Norte (Arriba)
              else ordered.push(n); // Hacia zona Sur (Abajo)
          });
          return ordered;
      }

      const lNodes = arrangeFromCenterOutward(leftRaw);
      const rNodes = arrangeFromCenterOutward(rightRaw);

      // Helper para saber si un módulo está activo bajo el filtro actual
      const isModuleMatchedByFilter = (modId, n) => {
          if (isDefaultState) return true;
          const nMod = normModId(modId);
          const nItemName = n.item ? (n.item.name || '') : '';
          if (!isModAll) {
              if (!selectedNormMods.has(nMod)) return false;
              if (isMultiModSelected && moduleFilterMode === 'CORRELATED') {
                  if ((n.projects || []).length > 0) return true;
                  // También iluminar si es el módulo destino de un proyecto correlacionado en otro módulo seleccionado
                  const allVisibleCorrelated = [...lNodes, ...rNodes].flatMap(node => node.projects || []);
                  return allVisibleCorrelated.some(p => getProjectAllNormMods(p).has(nMod));
              }
              return true;
          }
          return (n.projects || []).length > 0 || (q !== '' && nItemName.toLowerCase().includes(q));
      };

      const slotH = 75, mOffX = 400, pOffX = 900;
      function procSide(nodes, isLeft) {
          const mx = isLeft ? -mOffX : mOffX, px = isLeft ? -pOffX : pOffX;
          
          // Total de slots reales en este sector según su estado actual (colapsado o expandido)
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
                      const strictType = p._strictType || (n.type === 'direct-hub' ? 'direct-project' : 'project');
                      p._modId = n.type === 'direct-hub' ? 'hub-direct' : (n.item ? n.item.id : 'mod');
                      const py = sy + idx * slotH;
                      p._renderData = { x: px, y: py, color: col, type: strictType, realId: p.id, parentModColor: nItemColor }; 
                      if (p._isLinkedCopy && p._origProj && !p._origProj._renderData) {
                          p._origProj._renderData = p._renderData;
                      }
                  });
              } else {
                  (n.projects || []).forEach(p => { p._renderData = null; });
              }

              n._renderData = { x: mx, y: my, isLeft };
              if (n.item) n.item._renderData = n._renderData;

              const modMatches = isModuleMatchedByFilter(modId, n);
              const lineOpacity = modMatches ? '1' : '0.12';

              const pC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              pC.classList.add('mindmap-connector');
              const modEndX = isLeft ? mx + 165 : mx - 165;
              const modEndY = my;
              let coreStartX, coreStartY, cp1CoreX, cp1CoreY, cp2CoreX, cp2CoreY;

              if (my < -70) {
                  coreStartX = 0;
                  coreStartY = -60;
                  cp1CoreX = 0;
                  cp1CoreY = -60 - Math.max(55, Math.abs(modEndY + 60) * 0.55);
                  cp2CoreX = isLeft ? modEndX + 75 : modEndX - 75;
                  cp2CoreY = modEndY;
              } else if (my > 70) {
                  coreStartX = 0;
                  coreStartY = 60;
                  cp1CoreX = 0;
                  cp1CoreY = 60 + Math.max(55, Math.abs(modEndY - 60) * 0.55);
                  cp2CoreX = isLeft ? modEndX + 75 : modEndX - 75;
                  cp2CoreY = modEndY;
              } else if (isLeft) {
                  coreStartX = -60;
                  coreStartY = 0;
                  cp1CoreX = -125;
                  cp1CoreY = 0;
                  cp2CoreX = modEndX + 65;
                  cp2CoreY = modEndY;
              } else {
                  coreStartX = 60;
                  coreStartY = 0;
                  cp1CoreX = 125;
                  cp1CoreY = 0;
                  cp2CoreX = modEndX - 65;
                  cp2CoreY = modEndY;
              }

              const newCorePathD = `M ${coreStartX} ${coreStartY} C ${cp1CoreX} ${cp1CoreY}, ${cp2CoreX} ${cp2CoreY}, ${modEndX} ${modEndY}`;
              pC.setAttribute('d', newCorePathD);
              pC.setAttribute('fill', 'none'); 

              // Conector de fibra óptica: Gradiente direccional de Núcleo a Módulo
              const coreGradId = `grad-c-${nItemId}`;
              const cGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
              cGrad.setAttribute('id', coreGradId);
              cGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
              cGrad.setAttribute('x1', `${coreStartX}`);
              cGrad.setAttribute('y1', `${coreStartY}`);
              cGrad.setAttribute('x2', `${modEndX}`);
              cGrad.setAttribute('y2', `${modEndY}`);

              const cs1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              cs1.setAttribute('offset', '0%');
              cs1.setAttribute('stop-color', nItemColor);
              cs1.setAttribute('stop-opacity', '0.38');
              cGrad.appendChild(cs1);

              const cs2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              cs2.setAttribute('offset', '100%');
              cs2.setAttribute('stop-color', nItemColor);
              cs2.setAttribute('stop-opacity', '0.85');
              cGrad.appendChild(cs2);

              dynamicDefs.appendChild(cGrad);

              pC.setAttribute('stroke', `url(#${coreGradId})`); 
              pC.setAttribute('stroke-width', '1.8');
              pC.setAttribute('opacity', lineOpacity);
              canvasGroup.appendChild(pC);

              const prevModPos = prevModulePositions.get(modId);
              const prevCorePathD = prevCorePaths.get(modId);
              if (prevModPos && prevModPos.y !== my && prevCorePathD && prevCorePathD !== newCorePathD) {
                  const prevNums = (prevCorePathD.match(/-?\d+(\.\d+)?/g) || []).map(Number);
                  const currNums = [coreStartX, coreStartY, cp1CoreX, cp1CoreY, cp2CoreX, cp2CoreY, modEndX, modEndY];
                  if (prevNums.length === 8) {
                      pC.setAttribute('d', prevCorePathD);
                      const animStart = performance.now();
                      const animDur = 380;
                      const stepCorePath = (now) => {
                          const t = Math.min(1, (now - animStart) / animDur);
                          const ease = 1 - Math.pow(1 - t, 3);
                          const v = prevNums.map((p0, i) => p0 + (currNums[i] - p0) * ease);
                          pC.setAttribute('d', `M ${v[0]} ${v[1]} C ${v[2]} ${v[3]}, ${v[4]} ${v[5]}, ${v[6]} ${v[7]}`);
                          cGrad.setAttribute('x1', `${v[0]}`);
                          cGrad.setAttribute('y1', `${v[1]}`);
                          cGrad.setAttribute('x2', `${v[6]}`);
                          cGrad.setAttribute('y2', `${v[7]}`);
                          if (t < 1 && pC.isConnected) requestAnimationFrame(stepCorePath);
                      };
                      requestAnimationFrame(stepCorePath);
                  }
              }
              prevCorePaths.set(modId, newCorePathD);

              if (!isCollapsed && pCount > 0) (n.projects || []).forEach((p, idx) => {
                  if (!p._renderData) return;
                  const pMatches = isDefaultState || isFiltered(p);
                  const isSynergyMatch = !activeFilterConsultants.includes('ALL') && activeFilterConsultants.length >= 2 && activeFilterConsultants.every(c => getProjectConsultants(p).includes(c));
                  const isModCorrMatch = isProjectModCorrelated(p);
                  let isOver = false;
                  if(p.deadline && p.status !== 'Completado') {
                      const [dy, dm, dd] = p.deadline.split('-');
                      if(new Date(dy, dm-1, dd) < new Date(new Date().setHours(0,0,0,0))) isOver = true;
                  }

                  const pP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  pP.classList.add('mindmap-connector');
                  pP.setAttribute('pathLength', '1');
                  pP.setAttribute('data-parent-mod', String(modId));
                  pP.style.setProperty('--target-opacity', pMatches ? '1' : '0.12');
                  const solidColor = (getProjectConsultants(p).length > 0 && consultants[getProjectConsultants(p)[0]]) ? consultants[getProjectConsultants(p)[0]].color : '#48484a';
                  const endCol = isOver ? '#ee6018' : solidColor;

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
                  const pGradId = `grad-p-${nItemId}-${pIdClean}`;
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
                  ps1.setAttribute('stop-opacity', '0.50');
                  pGrad.appendChild(ps1);

                  const ps2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  ps2.setAttribute('offset', '100%');
                  ps2.setAttribute('stop-color', endCol);
                  ps2.setAttribute('stop-opacity', '0.85');
                  pGrad.appendChild(ps2);

                  dynamicDefs.appendChild(pGrad);

                  if (isSynergyMatch || isModCorrMatch) {
                      pP.removeAttribute('pathLength');
                      pP.classList.add('synergy-connector-line');
                      pP.setAttribute('stroke', isSynergyMatch ? generateJointGradient(activeFilterConsultants) : `url(#${pGradId})`);
                  } else {
                      pP.setAttribute('stroke', `url(#${pGradId})`);
                  }
                  pP.setAttribute('stroke-width', '1.5'); 
                  pP.setAttribute('opacity', pMatches ? '1' : '0.12'); 
                  if (lastExpandedModuleId === modId && !isSynergyMatch && !isModCorrMatch) {
                      pP.classList.add('connector-animate-in');
                      pP.style.animationDelay = `${idx * 15}ms`;
                  }
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
          const containerModId = n.type === 'direct-hub' ? 'hub-direct' : (n.item ? n.item.id : '');
          const containerModColor = (n.item && n.item.color) ? n.item.color : '#ee6018';
          (n.projects || []).forEach(p => {
              if (!p._renderData) return;
              const origProj = p._origProj || p;
              const allRelatedMods = [
                  normModId(origProj._modId || containerModId),
                  ...((Array.isArray(origProj.secondaryModules) ? origProj.secondaryModules : []).map(normModId))
              ].filter((mId, idx, arr) => mId && mId !== normModId(containerModId) && arr.indexOf(mId) === idx);

              if (allRelatedMods.length === 0) return;

              const pData = p._renderData;
              const pMatches = isDefaultState || isFiltered(p);
              const isProjectSel = currentSelection.id === p.id;

              allRelatedMods.forEach(secId => {
                  const secNode = moduleNodeMap.get(secId) || (secId === 'DIRECT' || secId === 'hub-direct' ? moduleNodeMap.get('hub-direct') : null);
                  if (!secNode || !secNode._renderData) return;

                  const secData = secNode._renderData;
                  const secMx = secData.x;
                  const secMy = secData.y;
                  const secIsLeft = secData.isLeft;
                  const secColor = (secNode.item && secNode.item.color) ? secNode.item.color : '#ee6018';
                  const secNodeId = secNode.item ? secNode.item.id : (secNode.type === 'direct-hub' ? 'hub-direct' : '');
                  const isSecModSel = currentSelection.id === secNodeId;
                  const normSecId = normModId(secNodeId);
                  const normContainerId = normModId(containerModId);

                  // Regla clave de ruido cero estricta:
                  // 1. Si hay filtro de módulos activo, NUNCA conectar hacia un módulo que no esté seleccionado
                  if (!isModAll && !selectedNormMods.has(normSecId)) {
                      return;
                  }
                  // 2. Si solo hay 1 módulo seleccionado (no multiselección), NUNCA cruzar líneas a otros módulos
                  if (!isModAll && !isMultiModSelected && !showAllSecondaryLinks) {
                      return;
                  }
                  // 3. En multiselección, encender las líneas que correlacionan los módulos seleccionados entre sí
                  const isMultiModCorrelationLink = isMultiModSelected && pMatches && selectedNormMods.has(normContainerId) && selectedNormMods.has(normSecId);
                  if (!isModAll && !isMultiModCorrelationLink && !showAllSecondaryLinks) {
                      return;
                  }

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
                  pSec.setAttribute('data-target-mod', String(secNodeId));

                  const pIdClean = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');
                  const secIdClean = String(secNodeId).replace(/[^a-zA-Z0-9_-]/g, '');
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
                  stop1.setAttribute('stop-opacity', '0.88');
                  sGrad.appendChild(stop1);

                  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                  stop2.setAttribute('offset', '100%');
                  stop2.setAttribute('stop-color', containerModColor);
                  stop2.setAttribute('stop-opacity', '0.92');
                  sGrad.appendChild(stop2);

                  dynamicDefs.appendChild(sGrad);

                  pSec.setAttribute('stroke', `url(#${secGradId})`);
                  pSec.setAttribute('stroke-width', '1.8');

                  if (!pMatches) {
                      pSec.classList.add('sec-connector-dimmed');
                  } else if (isProjectSel || (isSecModSel && isModAll) || isMultiModCorrelationLink) {
                      pSec.classList.add('sec-connector-selected');
                      pSec.setAttribute('stroke-width', isMultiModCorrelationLink ? '2.4' : '2.2');
                  }
                  canvasGroup.appendChild(pSec);
              });
          });
      });

      [...lNodes, ...rNodes].forEach(n => {
        const modId = n.item ? n.item.id : (n.type === 'direct-hub' ? 'hub-direct' : 'mod');
        const isCollapsed = isModuleCollapsed(modId, n);
        const { x: mx, y: my } = n._renderData || { x: 0, y: 0 };
        if (!isCollapsed) {
          (n.projects || []).forEach((p, idx) => {
            if (!p._renderData) return;
            const { x, y, color, type: strictType, realId } = p._renderData; 
          const isSel = currentSelection.id === realId;
          const pMatches = isDefaultState || isFiltered(p);
          
          const riskInfo = window.getProjectRiskStatus(p);
          const isOver = riskInfo && riskInfo.level === 'critical';
          const isCooling = riskInfo && riskInfo.level === 'cooling';
          const sCol = p.status==='En Progreso'?'#ee6018':(p.status==='Completado'?'#a0ca92':(p.status==='No Iniciado'?'#4d4947':'#8a8380'));

          // 1. CREACIÓN DEL CONTENEDOR PRINCIPAL
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', `translate(${x - 160}, ${y - 28})`);
          const pCleanId = String(realId).replace(/[^a-zA-Z0-9_-]/g, '');
          g.setAttribute('data-project-id', String(realId));
          g.setAttribute('data-parent-mod', String(modId));
          g.classList.add('mindmap-project-node', `proj-node-${pCleanId}`);
          g.style.setProperty('--start-transform', `translate(${n._renderData.x - 160}px, ${n._renderData.y - 28}px)`);
          g.style.setProperty('--end-transform', `translate(${x - 160}px, ${y - 28}px)`);
          if (lastExpandedModuleId === modId) {
              g.classList.add('proj-animate-in');
              g.style.animationDelay = `${idx * 18}ms`;
          }
          
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
              try {
                  if (p._origProj && p._renderData) p._origProj._renderData = p._renderData;
                  window.selectNode(currentNodeType, currentNodeId);
              } catch (err) { console.error('No se pudo abrir el proyecto:', p, err); window.showToast('⚠️ No se pudo abrir "' + p.name + '": ' + err.message, true); }
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

          // 3. CAPA VISUAL (Factory Technical Card rx=10)
          // SENSOR DE ENFRIAMIENTO Y PULSO DE RIESGO TÉCNICO
          if (riskInfo) {
              const aura = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              aura.setAttribute('x', '-4');
              aura.setAttribute('y', '-4');
              aura.setAttribute('width', '328');
              aura.setAttribute('height', '64');
              aura.setAttribute('rx', '12');
              aura.setAttribute('fill', riskInfo.bg);
              aura.setAttribute('stroke', riskInfo.color);
              aura.setAttribute('stroke-width', '1.4');
              aura.classList.add(isCooling ? 'risk-pulse-amber' : 'risk-pulse-red');
              aura.style.pointerEvents = 'none';
              
              const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              titleEl.textContent = riskInfo.detail;
              aura.appendChild(titleEl);
              g.appendChild(aura);

              // Indicador técnico luminoso (LED táctico en esquina superior derecha)
              const ledG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              ledG.setAttribute('transform', 'translate(306, 10)');
              ledG.style.pointerEvents = 'none';
              
              const ledPing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              ledPing.setAttribute('r', '4');
              ledPing.setAttribute('fill', riskInfo.color);
              ledPing.classList.add(isCooling ? 'risk-dot-amber' : 'risk-dot-red');
              ledG.appendChild(ledPing);

              const ledCore = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              ledCore.setAttribute('r', '2');
              ledCore.setAttribute('fill', '#eeeeee');
              ledG.appendChild(ledCore);
              
              g.appendChild(ledG);
          }

          const isSynergyMatch = !activeFilterConsultants.includes('ALL') && activeFilterConsultants.length >= 2 && activeFilterConsultants.every(c => getProjectConsultants(p).includes(c));
          const isModCorrMatch = isProjectModCorrelated(p);
          const projStrokeColor = isOver ? '#ee6018' : (isSynergyMatch ? generateJointGradient(activeFilterConsultants) : (color || '#ee6018'));
          if (isSel) {
              const selFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              selFrame.setAttribute('x', '-3');
              selFrame.setAttribute('y', '-3');
              selFrame.setAttribute('width', '326');
              selFrame.setAttribute('height', '62');
              selFrame.setAttribute('rx', '12');
              selFrame.setAttribute('fill', 'none');
              selFrame.setAttribute('stroke', projStrokeColor);
              selFrame.setAttribute('stroke-width', '1');
              selFrame.setAttribute('stroke-dasharray', '4,3');
              selFrame.setAttribute('opacity', '0.85');
              selFrame.style.pointerEvents = 'none';
              g.appendChild(selFrame);
          }
          const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('width', '320'); r.setAttribute('height', '56'); r.setAttribute('rx', '10'); 
          r.setAttribute('fill', '#1d1a18'); 
          r.setAttribute('stroke', projStrokeColor); 
          r.setAttribute('stroke-width', isSel ? '2.2' : (isOver ? '1.6' : ((isSynergyMatch || isModCorrMatch) ? '2' : '1.2'))); 
          r.style.pointerEvents = 'none';
          if (isOver) r.classList.add('overdue-capsule');
          if (isSynergyMatch || isModCorrMatch) r.classList.add('synergy-capsule-glow');
          g.appendChild(r);

          const sC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sC.setAttribute('cx', '18'); sC.setAttribute('cy', '18'); sC.setAttribute('r', '3'); 
          sC.setAttribute('fill', isOver ? '#ee6018' : sCol); 
          sC.style.pointerEvents = 'none';
          if (isOver) {
              sC.classList.add('overdue-dot');
          }
          g.appendChild(sC);

          const pComps = window.getProjectCompanies(p);
          let compBadgeOffset = 0;
          if (pComps.length > 0) {
              const mainC = pComps[0];
              const cStyle = window.getCompanyStyle ? window.getCompanyStyle(mainC) : { color: '#ee6018', bg: 'rgba(238,96,24,0.15)' };
              const bText = pComps.length > 1 ? `${mainC} +${pComps.length - 1}` : mainC;
              const bWidth = pComps.length > 1 ? 46 : 34;

              const cG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              cG.setAttribute('transform', 'translate(32, 10)');
              cG.style.pointerEvents = 'none';

              const cP = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              cP.setAttribute('width', String(bWidth));
              cP.setAttribute('height', '14');
              cP.setAttribute('rx', '3');
              cP.setAttribute('fill', cStyle.bg);
              cP.setAttribute('stroke', cStyle.color);
              cP.setAttribute('stroke-width', '1');
              cG.appendChild(cP);

              const cT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              cT.setAttribute('x', String(bWidth / 2));
              cT.setAttribute('y', '10.5');
              cT.setAttribute('text-anchor', 'middle');
              cT.setAttribute('fill', cStyle.color);
              cT.setAttribute('style', "font-size: 8px; font-weight: 500; font-family: 'Geist Mono', monospace; letter-spacing: 0.2px;");
              cT.textContent = bText;
              cG.appendChild(cT);

              g.appendChild(cG);
              compBadgeOffset = bWidth + 5;
          }

          const hasSecBadge = Array.isArray(p.secondaryModules) && p.secondaryModules.length > 0;
          const nT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          nT.setAttribute('x', String(32 + compBadgeOffset));
          nT.setAttribute('y', '22');
          nT.setAttribute('fill', '#eeeeee'); 
          nT.classList.add('svg-text', 'svg-text-bold');
          let fullText = (isOver ? "⚠️ " : "") + p.name;
          let fontSize = fullText.length > 35 ? 9.5 : (fullText.length > 25 ? 10.5 : 12);
          nT.setAttribute('style', `font-size: ${fontSize}px; font-weight: 400; pointer-events: none;`);
          const maxNameLen = (hasSecBadge || isSynergyMatch || isModCorrMatch) ? (compBadgeOffset ? 22 : 28) : (compBadgeOffset ? 35 : 55);
          nT.textContent = fullText.length > maxNameLen ? fullText.substring(0, maxNameLen - 3)+'...' : fullText;
          g.appendChild(nT);

          // Micro-badge de multimódulo en la tarjeta del proyecto
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
              mPill.setAttribute('rx', '3');
              mPill.setAttribute('fill', isModCorrMatch ? 'rgba(238, 96, 24, 0.22)' : '#101010');
              mPill.setAttribute('stroke', isModCorrMatch ? '#ee6018' : '#3d3a39');
              mPill.setAttribute('stroke-width', '1');
              multiG.appendChild(mPill);

              const mTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              mTxt.setAttribute('x', '19');
              mTxt.setAttribute('y', '10.5');
              mTxt.setAttribute('text-anchor', 'middle');
              mTxt.setAttribute('fill', '#eeeeee');
              mTxt.setAttribute('style', "font-size: 8px; font-weight: 500; font-family: 'Geist Mono', monospace;");
              mTxt.textContent = `🔗+${p.secondaryModules.length}`;
              multiG.appendChild(mTxt);

              g.appendChild(multiG);
          }

          // Micro-badge destacado de Sinergia (🤝 JUNTOS) o Correlación de Módulos (🔗 CORREL)
          if (isSynergyMatch || isModCorrMatch) {
              const synG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              const synX = hasSecBadge ? 192 : 248;
              synG.setAttribute('transform', `translate(${synX}, 9)`);
              synG.style.pointerEvents = 'none';

              const synBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              synBg.setAttribute('width', '54');
              synBg.setAttribute('height', '14');
              synBg.setAttribute('rx', '3');
              synBg.setAttribute('fill', 'rgba(238, 96, 24, 0.18)');
              synBg.setAttribute('stroke', '#ee6018');
              synBg.setAttribute('stroke-width', '1');
              synG.appendChild(synBg);

              const synTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              synTxt.setAttribute('x', '27');
              synTxt.setAttribute('y', '10.5');
              synTxt.setAttribute('text-anchor', 'middle');
              synTxt.setAttribute('fill', '#eeeeee');
              synTxt.setAttribute('style', "font-size: 7.5px; font-weight: 500; font-family: 'Geist Mono', monospace;");
              synTxt.textContent = isSynergyMatch ? '🤝 JUNTOS' : '🔗 CORREL';
              synG.appendChild(synTxt);

              g.appendChild(synG);
          }

          // Micro-Avatares de consultores asignados en la zona inferior izquierda (y = 40)
          const pConsList = getProjectConsultants(p);
          let avatarOffset = 0;
          if (pConsList.length > 0) {
              const avG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              avG.style.pointerEvents = 'auto';
              
              const avTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
              avTitle.textContent = `Asignado a: ${pConsList.join(', ')}`;
              avG.appendChild(avTitle);

              pConsList.forEach((cName, cIdx) => {
                  const cx = 38 + cIdx * 12;
                  const cData = consultants[cName];
                  const cColor = cData?.color || '#ee6018';
                  const initial = (cName || '?').trim().charAt(0).toUpperCase();

                  const avCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  avCircle.setAttribute('cx', String(cx));
                  avCircle.setAttribute('cy', '40');
                  avCircle.setAttribute('r', '6');
                  avCircle.setAttribute('fill', cColor);
                  avCircle.setAttribute('stroke', '#1d1a18');
                  avCircle.setAttribute('stroke-width', '1.2');
                  avG.appendChild(avCircle);

                  const avTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  avTxt.setAttribute('x', String(cx));
                  avTxt.setAttribute('y', '42.5');
                  avTxt.setAttribute('text-anchor', 'middle');
                  avTxt.setAttribute('fill', '#ffffff');
                  avTxt.setAttribute('style', "font-size: 7px; font-weight: 500; font-family: 'Geist Mono', monospace; pointer-events: none;");
                  avTxt.textContent = initial;
                  avG.appendChild(avTxt);
              });
              g.appendChild(avG);
              avatarOffset = pConsList.length * 12 + 6;
          }
          
          const prog = Math.round(p.progress || 0);
          const pbStartX = 32 + avatarOffset;
          const pbMaxWidth = Math.max(30, 258 - pbStartX);

          // Pista base de la barra de progreso
          const pbBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          pbBg.setAttribute('x', String(pbStartX)); pbBg.setAttribute('y', '38.5');
          pbBg.setAttribute('width', String(pbMaxWidth)); pbBg.setAttribute('height', '3');
          pbBg.setAttribute('rx', '1.5');
          pbBg.setAttribute('fill', '#101010');
          pbBg.style.pointerEvents = 'none';
          g.appendChild(pbBg);

          if (prog > 0) {
             const pb = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
             pb.setAttribute('x', String(pbStartX)); pb.setAttribute('y', '38.5');
             pb.setAttribute('width', String(Math.max(4, pbMaxWidth * (prog / 100))));
             pb.setAttribute('height', '3'); pb.setAttribute('rx', '1.5');
             pb.setAttribute('fill', isOver ? '#ee6018' : sCol);
             pb.style.pointerEvents = 'none';
             g.appendChild(pb);
          }

          // Micro indicador numérico exacto de porcentaje a la derecha
          const pPerc = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          pPerc.setAttribute('x', '304'); pPerc.setAttribute('y', '42.5');
          pPerc.setAttribute('text-anchor', 'end');
          pPerc.setAttribute('fill', prog > 0 ? (prog === 100 ? '#a0ca92' : '#b8b3b0') : '#8a8380');
          pPerc.setAttribute('style', "font-size: 9.5px; font-weight: 400; font-family: 'Geist Mono', monospace; pointer-events: none;");
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

                  const badgeColor = (hasMention || hasBlocker) ? '#ee6018' : '#eeeeee';
                  const badgeTextColor = (hasMention || hasBlocker) ? '#fafafa' : '#101010';
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
                      bCircle.setAttribute('stroke', '#101010');
                      bCircle.setAttribute('stroke-width', '1.5');
                      bCircle.setAttribute('class', animClass);
                      badgeG.appendChild(bCircle);

                      const bTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                      bTxt.setAttribute('x', '310');
                      bTxt.setAttribute('y', hasMention ? '7.5' : '7');
                      bTxt.setAttribute('text-anchor', 'middle');
                      bTxt.setAttribute('fill', badgeTextColor);
                      bTxt.setAttribute('style', `font-size: ${hasMention ? '10px' : '9px'}; font-weight: 500; font-family: 'Geist Mono', monospace; pointer-events: none;`);
                      bTxt.textContent = badgeText;
                      badgeG.appendChild(bTxt);
                  } else {
                      const bPill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                      bPill.setAttribute('x', '298');
                      bPill.setAttribute('y', '-5');
                      bPill.setAttribute('width', '24');
                      bPill.setAttribute('height', '18');
                      bPill.setAttribute('rx', '3');
                      bPill.setAttribute('fill', badgeColor);
                      bPill.setAttribute('stroke', '#101010');
                      bPill.setAttribute('stroke-width', '1.5');
                      bPill.setAttribute('class', animClass);
                      badgeG.appendChild(bPill);

                      const bTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                      bTxt.setAttribute('x', '310');
                      bTxt.setAttribute('y', '7.5');
                      bTxt.setAttribute('text-anchor', 'middle');
                      bTxt.setAttribute('fill', badgeTextColor);
                      bTxt.setAttribute('style', "font-size: 8.5px; font-weight: 500; font-family: 'Geist Mono', monospace; pointer-events: none;");
                      bTxt.textContent = '9+';
                      badgeG.appendChild(bTxt);
                  }

                  g.appendChild(badgeG);
              }
          }

          // 4. CAPA DE INTERCEPCIÓN (Caja invisible final con silueta continua)
          const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hitBox.setAttribute('width', '320'); hitBox.setAttribute('height', '56'); hitBox.setAttribute('rx', '10');
          hitBox.setAttribute('fill', 'transparent');
          hitBox.style.cursor = 'pointer';
          g.appendChild(hitBox);
          
          canvasGroup.appendChild(g);
          });
        }

        // Evaluación estricta de módulos y ghosting de bloques
        const modName = n.item ? (n.item.name || '') : '';
        const modCol = (n.item && n.item.color) ? n.item.color : '#ee6018';
        const modMatches = isModuleMatchedByFilter(modId, n);
        const { x, y } = n._renderData || { x: 0, y: 0 };
        const isSel = currentSelection.id === modId;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${x - 165}, ${y - 25})`);
        const cleanModId = String(modId).replace(/[^a-zA-Z0-9_-]/g, '');
        g.setAttribute('data-module-id', String(modId));
        g.classList.add('mindmap-module-node', `mod-node-${cleanModId}`);

        if (prevModulePositions.has(modId)) {
            const prev = prevModulePositions.get(modId);
            if (prev && (prev.x !== x || prev.y !== y)) {
                g.style.setProperty('--mod-prev-transform', `translate(${prev.x - 165}px, ${prev.y - 25}px)`);
                g.style.setProperty('--mod-curr-transform', `translate(${x - 165}px, ${y - 25}px)`);
                g.classList.add('module-slide-anim');
            }
        }
        prevModulePositions.set(modId, { x, y });
        
        if (!modMatches) {
             g.setAttribute('opacity', '0.15');
             g.style.pointerEvents = 'none';
             g.classList.remove('interactive-node');
        } else {
             g.setAttribute('opacity', '1');
             g.style.pointerEvents = 'all';
             g.classList.add('interactive-node');
        }
        
        // Pulso de riesgo a nivel módulo cuando está colapsado
        if (isCollapsed) {
            const hasCrit = (n.projects || []).some(p => { const r = window.getProjectRiskStatus(p); return r && r.level === 'critical'; });
            const hasCool = !hasCrit && (n.projects || []).some(p => { const r = window.getProjectRiskStatus(p); return r && r.level === 'cooling'; });
            if (hasCrit || hasCool) {
                const modRiskAura = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                modRiskAura.setAttribute('x', '-3');
                modRiskAura.setAttribute('y', '-3');
                modRiskAura.setAttribute('width', '336');
                modRiskAura.setAttribute('height', '56');
                modRiskAura.setAttribute('rx', '12');
                modRiskAura.setAttribute('fill', hasCrit ? 'rgba(255, 69, 58, 0.08)' : 'rgba(255, 159, 10, 0.08)');
                modRiskAura.setAttribute('stroke', hasCrit ? '#ff453a' : '#ff9f0a');
                modRiskAura.setAttribute('stroke-width', '1.2');
                modRiskAura.classList.add(hasCrit ? 'risk-pulse-red' : 'risk-pulse-amber');
                modRiskAura.style.pointerEvents = 'none';
                g.appendChild(modRiskAura);
            }
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
        r.setAttribute('width', '330'); r.setAttribute('height', '50'); r.setAttribute('rx', '10'); 
        r.setAttribute('fill', n.type==='direct-hub' ? '#101010' : '#1d1a18');
        r.setAttribute('stroke', modCol); r.setAttribute('stroke-width', isSel ? '2' : '1.2');
        r.style.pointerEvents = 'none';
        if(n.type==='direct-hub') r.setAttribute('stroke-dasharray', '4,4'); 
        g.appendChild(r);

        // Indicador de color del módulo a la izquierda (6px = r=3)
        const mDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        mDot.setAttribute('cx', '18'); mDot.setAttribute('cy', '25'); mDot.setAttribute('r', '3.5');
        mDot.setAttribute('fill', modCol);
        mDot.style.pointerEvents = 'none';
        g.appendChild(mDot);
        
        // Título del módulo completo sin truncamiento
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); 
        t.setAttribute('x', '32'); t.setAttribute('y', '29'); 
        t.setAttribute('fill', '#eeeeee'); t.setAttribute('text-anchor', 'start'); 
        t.classList.add('svg-text', 'svg-text-bold'); 
        t.style.pointerEvents = 'none';
        
        let rawName = n.item.name || '';
        let len = rawName.length;
        let mFontSize = 12;
        if (len > 35) mFontSize = 9.5;
        else if (len > 28) mFontSize = 10.5;
        else if (len > 20) mFontSize = 11.5;
        let displayName = len > 45 ? rawName.substring(0, 42) + '…' : rawName;
        t.setAttribute('style', `font-size: ${mFontSize}px; font-weight: 400; letter-spacing: -0.02em; pointer-events: none;`);
        t.textContent = displayName; 
        g.appendChild(t);

        // Micro-badge técnico de conteo de proyectos a la derecha
        const pCount = (n.ownProjects || []).length;
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
        countBg.setAttribute('rx', '3');
        countBg.setAttribute('fill', '#101010');
        countBg.setAttribute('stroke', modCol);
        countBg.setAttribute('stroke-opacity', '0.5');
        countBg.setAttribute('stroke-width', '1');
        countG.appendChild(countBg);
        
        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', secCount > 0 ? '31' : '26'); countText.setAttribute('y', '12.5');
        countText.setAttribute('text-anchor', 'middle');
        countText.setAttribute('fill', modCol);
        countText.setAttribute('style', "font-size: 8.5px; font-weight: 500; font-family: 'Geist Mono', monospace; letter-spacing: 0.02em;");
        countText.textContent = secCount > 0 ? `${pCount}+${secCount}P` : `${pCount} ${pCount === 1 ? 'PROY' : 'PROYS'}`;
        countG.appendChild(countText);
        g.appendChild(countG);

        // Capa invisible para interacción de módulos
        const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hitBox.setAttribute('width', '330'); hitBox.setAttribute('height', '50'); hitBox.setAttribute('rx', '10');
        hitBox.setAttribute('fill', 'transparent');
        hitBox.style.cursor = 'pointer';
        g.appendChild(hitBox);

        // Botón interactivo de colapso/expansión (+/-) del módulo
        if (pCount > 0 || secCount > 0) {
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
            btnCircle.setAttribute('r', '10');
            btnCircle.setAttribute('fill', '#101010');
            btnCircle.setAttribute('stroke', modCol);
            btnCircle.setAttribute('stroke-width', '1.3');
            toggleBtnG.appendChild(btnCircle);
            
            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', '-4'); hLine.setAttribute('y1', '0');
            hLine.setAttribute('x2', '4'); hLine.setAttribute('y2', '0');
            hLine.setAttribute('stroke', '#eeeeee');
            hLine.setAttribute('stroke-width', '1.5');
            hLine.setAttribute('stroke-linecap', 'round');
            toggleBtnG.appendChild(hLine);
            
            if (isCollapsed) {
                const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                vLine.setAttribute('x1', '0'); vLine.setAttribute('y1', '-4');
                vLine.setAttribute('x2', '0'); vLine.setAttribute('y2', '4');
                vLine.setAttribute('stroke', '#eeeeee');
                vLine.setAttribute('stroke-width', '1.5');
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
            const totalExpandable = pCount > 0 ? pCount : secCount;
            btnTitle.textContent = isCollapsed ? `Expandir ${rawName} (${totalExpandable} proyectos)` : `Colapsar ${rawName}`;
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

      if (appData.core) appData.core._renderData = { x: 0, y: 0 };
      const totalCoreProjects = (appData.directProjects || []).length + (appData.modules || []).reduce((acc, m) => acc + (m.projects || []).length, 0);
      const isCoreSel = currentSelection.id === 'sicom';
      const coreG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      coreG.setAttribute('transform', `translate(-60, -60)`);
      coreG.classList.add('interactive-node');
      coreG.onclick = (e) => { e.stopPropagation(); window.selectNode('core', 'sicom'); };
      
      // 1. Anillo perimetral técnico sutil
      const orbit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orbit.setAttribute('cx', '60'); orbit.setAttribute('cy', '60'); orbit.setAttribute('r', '68');
      orbit.setAttribute('fill', 'none');
      orbit.setAttribute('stroke', '#3d3a39');
      orbit.setAttribute('stroke-width', '1');
      orbit.setAttribute('stroke-dasharray', '3 5');
      orbit.classList.add('core-orbit-ring');
      orbit.style.pointerEvents = 'none';
      coreG.appendChild(orbit);

      // 2. Chasis exterior Obsidian (#101010)
      const ccChassis = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ccChassis.setAttribute('cx', '60'); ccChassis.setAttribute('cy', '60'); ccChassis.setAttribute('r', '60');
      ccChassis.setAttribute('fill', '#101010');
      ccChassis.setAttribute('stroke', isCoreSel ? '#eeeeee' : '#3d3a39');
      ccChassis.setAttribute('stroke-width', '1.2');
      ccChassis.style.pointerEvents = 'none';
      coreG.appendChild(ccChassis);

      // 3. Superficie principal Carbon Lift (#1d1a18) integrada con el resto del mapa
      const cc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cc.setAttribute('cx', '60'); cc.setAttribute('cy', '60'); cc.setAttribute('r', '55');
      cc.setAttribute('fill', '#1d1a18');
      cc.setAttribute('stroke', isCoreSel ? '#eeeeee' : '#4d4947');
      cc.setAttribute('stroke-width', isCoreSel ? '1.8' : '1.2');
      cc.classList.add('core-bg-circle');
      cc.style.pointerEvents = 'none';
      coreG.appendChild(cc);

      // 4. Anillo interno de calibración
      const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerRing.setAttribute('cx', '60'); innerRing.setAttribute('cy', '60'); innerRing.setAttribute('r', '47');
      innerRing.setAttribute('fill', 'none');
      innerRing.setAttribute('stroke', '#3d3a39');
      innerRing.setAttribute('stroke-opacity', '0.55');
      innerRing.setAttribute('stroke-width', '1');
      innerRing.style.pointerEvents = 'none';
      coreG.appendChild(innerRing);

      // 5. Puertos cardinales de conexión (N, S, E, O en los puntos exactos de salida de fibra)
      [
          { cx: 60, cy: 0 },
          { cx: 60, cy: 120 },
          { cx: 0, cy: 60 },
          { cx: 120, cy: 60 }
      ].forEach(pt => {
          const port = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          port.setAttribute('cx', String(pt.cx)); port.setAttribute('cy', String(pt.cy)); port.setAttribute('r', '3');
          port.setAttribute('fill', '#101010');
          port.setAttribute('stroke', isCoreSel ? '#eeeeee' : '#8a8380');
          port.setAttribute('stroke-width', '1.2');
          port.style.pointerEvents = 'none';
          coreG.appendChild(port);
      });

      // 6. Cápsula superior STGT con faro #ee6018
      const stgtPill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      stgtPill.setAttribute('x', '39'); stgtPill.setAttribute('y', '29');
      stgtPill.setAttribute('width', '42'); stgtPill.setAttribute('height', '13');
      stgtPill.setAttribute('rx', '3');
      stgtPill.setAttribute('fill', '#101010');
      stgtPill.setAttribute('stroke', '#3d3a39');
      stgtPill.setAttribute('stroke-width', '1');
      stgtPill.style.pointerEvents = 'none';
      coreG.appendChild(stgtPill);

      const coreDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      coreDot.setAttribute('cx', '46'); coreDot.setAttribute('cy', '35.5'); coreDot.setAttribute('r', '2');
      coreDot.setAttribute('fill', '#ee6018');
      coreDot.classList.add('core-status-beacon');
      coreDot.style.pointerEvents = 'none';
      coreG.appendChild(coreDot);

      const coreTag = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      coreTag.setAttribute('x', '52'); coreTag.setAttribute('y', '38');
      coreTag.setAttribute('fill', '#b8b3b0');
      coreTag.setAttribute('text-anchor', 'start');
      coreTag.setAttribute('style', "font-size: 7px; font-weight: 500; letter-spacing: 0.14em; font-family: 'Geist Mono', monospace; pointer-events: none;");
      coreTag.textContent = 'STGT';
      coreG.appendChild(coreTag);

      // 7. Título Principal SICOM en Hueso (#eeeeee) sobre Carbon (#1d1a18)
      const ct = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      ct.setAttribute('x', '60'); ct.setAttribute('y', '60');
      ct.setAttribute('fill', '#eeeeee');
      ct.setAttribute('text-anchor', 'middle');
      ct.classList.add('svg-text');
      ct.setAttribute('style', "font-size: 16px; font-weight: 500; letter-spacing: 0.14em; font-family: 'Geist Mono', monospace; pointer-events: none;");
      ct.textContent = 'SICOM';
      coreG.appendChild(ct);

      // 8. Divisor técnico de 1px
      const coreDiv = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      coreDiv.setAttribute('x1', '36'); coreDiv.setAttribute('y1', '68');
      coreDiv.setAttribute('x2', '84'); coreDiv.setAttribute('y2', '68');
      coreDiv.setAttribute('stroke', '#3d3a39');
      coreDiv.setAttribute('stroke-width', '1');
      coreDiv.style.pointerEvents = 'none';
      coreG.appendChild(coreDiv);

      // 9. Telemetría en vivo inferior (conteo de proyectos)
      const cSub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cSub.setAttribute('x', '60'); cSub.setAttribute('y', '79');
      cSub.setAttribute('fill', '#8a8380');
      cSub.setAttribute('text-anchor', 'middle');
      cSub.classList.add('svg-text');
      cSub.setAttribute('style', "font-size: 7.5px; font-weight: 500; letter-spacing: 0.1em; font-family: 'Geist Mono', monospace; pointer-events: none;");
      cSub.textContent = `${totalCoreProjects} PROYS`;
      coreG.appendChild(cSub);

      // HitBox
      const coreHit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      coreHit.setAttribute('cx', '60'); coreHit.setAttribute('cy', '60'); coreHit.setAttribute('r', '68');
      coreHit.setAttribute('fill', 'transparent');
      coreHit.style.cursor = 'pointer';
      coreG.appendChild(coreHit);

      canvasGroup.appendChild(coreG);

      // Calcular caja delimitadora exacta de los módulos y proyectos filtrados para auto-enfoque de cámara
      if (!isDefaultState) {
          let fMinX = Infinity, fMaxX = -Infinity, fMinY = Infinity, fMaxY = -Infinity, fCount = 0;
          [...lNodes, ...rNodes].forEach(n => {
              const modId = n.item ? n.item.id : (n.type === 'direct-hub' ? 'hub-direct' : 'mod');
              if (isModuleMatchedByFilter(modId, n) && n._renderData) {
                  fMinX = Math.min(fMinX, n._renderData.x - 180);
                  fMaxX = Math.max(fMaxX, n._renderData.x + 180);
                  fMinY = Math.min(fMinY, n._renderData.y - 40);
                  fMaxY = Math.max(fMaxY, n._renderData.y + 40);
                  fCount++;
                  (n.projects || []).forEach(p => {
                      if (p._renderData) {
                          fMinX = Math.min(fMinX, p._renderData.x - 175);
                          fMaxX = Math.max(fMaxX, p._renderData.x + 175);
                          fMinY = Math.min(fMinY, p._renderData.y - 40);
                          fMaxY = Math.max(fMaxY, p._renderData.y + 40);
                          fCount++;
                      }
                  });
              }
          });
          window._lastFilteredBounds = fCount > 0 ? { minX: fMinX, maxX: fMaxX, minY: fMinY, maxY: fMaxY, count: fCount } : null;
      } else {
          window._lastFilteredBounds = null;
      }

      // Calcular caja delimitadora global de todo el contenido visible para encuadre y candado de zoom
      let totalMinX = -80, totalMaxX = 80, totalMinY = -80, totalMaxY = 80;
      [...lNodes, ...rNodes].forEach(n => {
          if (n._renderData) {
              totalMinX = Math.min(totalMinX, n._renderData.x - 190);
              totalMaxX = Math.max(totalMaxX, n._renderData.x + 190);
              totalMinY = Math.min(totalMinY, n._renderData.y - 45);
              totalMaxY = Math.max(totalMaxY, n._renderData.y + 45);
          }
          (n.projects || []).forEach(p => {
              if (p._renderData) {
                  totalMinX = Math.min(totalMinX, p._renderData.x - 180);
                  totalMaxX = Math.max(totalMaxX, p._renderData.x + 180);
                  totalMinY = Math.min(totalMinY, p._renderData.y - 45);
                  totalMaxY = Math.max(totalMaxY, p._renderData.y + 45);
              }
          });
      });
      window._currentMapBounds = { minX: totalMinX, maxX: totalMaxX, minY: totalMinY, maxY: totalMaxY };

      lastExpandedModuleId = null;
    };

    let currentHistoryCategory = 'all'; // 'all' | 'validaciones' | 'tareas' | 'proyectos'

    window.setHistoryCategoryFilter = function(cat) {
        currentHistoryCategory = cat;
        ['all', 'validaciones', 'tareas', 'proyectos'].forEach(c => {
            const btn = document.getElementById(`histCatBtn-${c}`);
            if (btn) {
                if (c === cat) {
                    btn.className = 'hist-cat-btn px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase bg-[#eeeeee] text-[#101010] border border-[#eeeeee]';
                } else {
                    btn.className = 'hist-cat-btn px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase text-[#8a8380] hover:text-[#eeeeee] bg-[#101010] border border-[#3d3a39]';
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
                    ? 'hist-cat-btn px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase bg-[#eeeeee] text-[#101010] border border-[#eeeeee]'
                    : 'hist-cat-btn px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase text-[#8a8380] hover:text-[#eeeeee] bg-[#101010] border border-[#3d3a39]';
            }
        });
        window.renderHistory();
    };

    window.renderHistory = function() {
        const histTab = document.getElementById('tab-history');
        if (!isDrawerOpen || (histTab && histTab.classList.contains('hidden'))) return;
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
            const col = consultants[log.by] ? consultants[log.by].color : '#8a8380';
            const isVal = (log.action || '').includes('Validó') || (log.action || '').includes('Aprobó');
            const isRej = (log.action || '').includes('Rechazó');
            const isDel = (log.action || '').includes('Borró') || (log.action || '').includes('Eliminó');
            
            let tagBadge = '';
            if (isVal) tagBadge = '<span class="font-mono text-[8px] bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]/40 px-1.5 py-0.5 rounded-[2px] uppercase">Validación</span>';
            else if (isRej || isDel) tagBadge = '<span class="font-mono text-[8px] bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/40 px-1.5 py-0.5 rounded-[2px] uppercase">Atención</span>';

            return `<div class="bg-[#101010] border border-[#3d3a39] rounded-[10px] p-3.5 relative overflow-hidden group hover:border-[#4d4947] transition">
                <div class="absolute left-0 top-0 bottom-0 w-1 opacity-90" style="background-color: ${col}"></div>
                <div class="flex justify-between items-start mb-1.5">
                    <span class="text-[10px] text-[#8a8380] font-mono pl-1.5">${log.timestamp}</span>
                    <div class="flex items-center gap-1.5">
                        ${tagBadge}
                        <span class="font-mono text-[9px] px-2 py-0.5 rounded-[2px] bg-[#1d1a18] border border-[#3d3a39] uppercase flex items-center gap-1 text-[#eeeeee]"><span class="w-1.5 h-1.5 rounded-full" style="background-color: ${col}"></span>${escapeHtml(log.by)}</span>
                    </div>
                </div>
                <p class="text-xs font-normal text-[#eeeeee] mb-1 leading-tight pl-1.5">${escapeHtml(log.projectName)}</p>
                <p class="text-[11px] text-[#b8b3b0] pl-1.5 leading-relaxed">${escapeHtml(log.action)}</p>
            </div>`;
        }).join('');
    };

    window.toggleTaskFromDashboard = function(pType, projId, taskId) {
        let p = null;
        if (pType === 'direct-project') p = (appData.directProjects || []).find(x => x.id === projId);
        else (appData.modules || []).forEach(m => { const found = (m.projects || []).find(x => x.id === projId); if (found) p = found; });
        if (!p || !Array.isArray(p.tasks)) return;
        const task = p.tasks.find(t => t.id === taskId);
        if (!task) return;
        task.done = !task.done;
        logActivity(p.id, p.name, `${task.done ? 'Completó' : 'Reabrió'} tarea: ${task.text}`, localAuthor);
        window.saveData(true);
        window.renderDashboard();
        window.showToast(task.done ? "Tarea completada" : "Tarea reactivada", false);
    };

    window.renderDashboard = function() {
        const dashTab = document.getElementById('tab-dashboard');
        if (!isDrawerOpen || (dashTab && dashTab.classList.contains('hidden'))) return;

        const isSuper = (currentUserRole === 'Supremo' || currentUserRole === 'Supervisor');
        let targetConsultant = null;

        const scopeContainer = document.getElementById('dashScopeSelectorContainer');
        const scopeSel = document.getElementById('dashScopeSelect');

        if (isSuper) {
            if (scopeContainer) {
                scopeContainer.classList.remove('hidden');
                const curVal = scopeSel ? scopeSel.value : 'GLOBAL';
                if (scopeSel) {
                    scopeSel.innerHTML = '<option value="GLOBAL">🌐 Visión Global (Empresa Completa)</option>';
                    Object.keys(consultants).sort().forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = `👤 Resumen de: ${c}`;
                        if (c === curVal) opt.selected = true;
                        scopeSel.appendChild(opt);
                    });
                }
                if (scopeSel && scopeSel.value !== 'GLOBAL') {
                    targetConsultant = scopeSel.value;
                }
            }
        } else {
            if (scopeContainer) scopeContainer.classList.add('hidden');
            targetConsultant = localAuthor;
        }

        // Títulos según rol
        const drawerTitle = document.getElementById('configDrawerTitle');
        const sectionTitle = document.getElementById('dashSectionTitle');
        const telemetryBadge = document.getElementById('dashTelemetryBadge');
        const globalTitle = document.getElementById('dashGlobalTitle');
        const totalUnit = document.getElementById('dashTotalUnit');
        const slaLbl = document.getElementById('dashSlaLabel');
        const riskLbl = document.getElementById('dashRiskLabel');
        const overLbl = document.getElementById('dashOverdueLabel');
        const docsLbl = document.getElementById('dashDocsLabel');

        if (targetConsultant) {
            if (drawerTitle) drawerTitle.textContent = isSuper ? `Resumen Operativo // ${targetConsultant}` : `Mi Resumen Operativo // ${localAuthor}`;
            if (sectionTitle) sectionTitle.textContent = isSuper ? `Rendimiento de ${targetConsultant}` : 'Mi Rendimiento & Carga de Trabajo';
            if (telemetryBadge) telemetryBadge.textContent = '● RESUMEN PERSONAL';
            if (globalTitle) globalTitle.textContent = isSuper ? `Avance de ${targetConsultant}` : 'Mi Avance Ponderado Personal';
            if (totalUnit) totalUnit.textContent = 'MIS PROY';
            if (slaLbl) slaLbl.textContent = 'Mi SLA en Plazo';
            if (riskLbl) riskLbl.textContent = 'Mis Proyectos ≤ 72h';
            if (overLbl) overLbl.textContent = 'Mis Vencidos';
            if (docsLbl) docsLbl.textContent = 'Mis Docs Validados';
        } else {
            if (drawerTitle) drawerTitle.textContent = 'Centro de Control // SICOM';
            if (sectionTitle) sectionTitle.textContent = 'Métricas Ejecutivas & KPIs';
            if (telemetryBadge) telemetryBadge.textContent = '● LIVE TELEMETRY';
            if (globalTitle) globalTitle.textContent = 'Avance Ponderado Global';
            if (totalUnit) totalUnit.textContent = 'PROY';
            if (slaLbl) slaLbl.textContent = 'SLA en Plazo';
            if (riskLbl) riskLbl.textContent = 'Riesgo ≤ 72h';
            if (overLbl) overLbl.textContent = 'Vencidos';
            if (docsLbl) docsLbl.textContent = 'Docs Normativos';
        }

        let t = 0, c = 0, p = 0, pend = 0, noIni = 0, o = 0, totalProg = 0;
        let withDeadline = 0;
        let riskCount = 0;
        let totalDocsRequired = 0, totalDocsChecked = 0;
        let consStats = {};
        let moduleStats = [];
        let myProjects = [];
        let myTasks = [];

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
            const projCons = getProjectConsultants(proj);
            const isAssignedToTarget = targetConsultant ? projCons.includes(targetConsultant) : true;
            
            if (targetConsultant && !isAssignedToTarget) return;

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

            if (targetConsultant) {
                myProjects.push(proj);
                if (Array.isArray(proj.tasks)) {
                    proj.tasks.forEach(task => {
                        if (!task.done && (task.assignee === targetConsultant || (!task.assignee && projCons.includes(targetConsultant)))) {
                            myTasks.push({ proj, task });
                        }
                    });
                }
            } else {
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
            }
        };

        (appData.directProjects || []).forEach(proj => { proj.pType = 'direct-project'; proj.parentName = appData.directHub ? appData.directHub.name : 'Directos'; tally(proj); }); 
        (appData.modules || []).forEach(m => (m.projects || []).forEach(proj => { proj.pType = 'project'; proj.parentName = m.name; tally(proj); }));

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
            if (slaRate >= 85) { elSlaSub.textContent = 'Excelente ritmo'; elSlaSub.className = 'font-mono text-[10px] text-[#a0ca92] uppercase truncate'; }
            else if (slaRate >= 70) { elSlaSub.textContent = 'En margen regular'; elSlaSub.className = 'font-mono text-[10px] text-[#ee6018] uppercase truncate'; }
            else { elSlaSub.textContent = 'Atención requerida'; elSlaSub.className = 'font-mono text-[10px] text-[#ee6018] uppercase truncate'; }
        }

        const elRiskCount = document.getElementById('dashRiskCount'); if (elRiskCount) elRiskCount.textContent = riskCount;
        const elRiskSub = document.getElementById('dashRiskSub'); if (elRiskSub) elRiskSub.textContent = riskCount === 1 ? '1 en riesgo' : `${riskCount} en riesgo`;

        const elDocsRate = document.getElementById('dashDocsRate'); if (elDocsRate) elDocsRate.textContent = `${docsRate}%`;
        const elDocsSub = document.getElementById('dashDocsSub'); if (elDocsSub) elDocsSub.textContent = `${totalDocsChecked} de ${totalDocsRequired} validados`;

        const elGlobalBar = document.getElementById('dashGlobalBar'); if (elGlobalBar) elGlobalBar.style.width = `${avgGlobal}%`;
        const elGlobalText = document.getElementById('dashGlobalText'); if (elGlobalText) elGlobalText.textContent = `${avgGlobal}%`;

        const chartsCont = document.getElementById('dashChartsContainer');
        const consCont = document.getElementById('dashConsultantContainer');

        if (targetConsultant) {
            if (chartsCont) chartsCont.classList.add('hidden');
            if (consCont) consCont.classList.remove('hidden');

            // Renderizar Mis Proyectos
            const pList = document.getElementById('dashMyProjectsList');
            const pBadge = document.getElementById('dashMyProjectsBadge');
            if (pBadge) pBadge.textContent = `${myProjects.length} PROYECTO${myProjects.length === 1 ? '' : 'S'}`;
            if (pList) {
                if (myProjects.length === 0) {
                    pList.innerHTML = `<div class="p-4 rounded-[6px] border border-[#3d3a39] bg-[#1d1a18] text-center font-mono text-xs text-[#8a8380] uppercase">No hay proyectos asignados</div>`;
                } else {
                    myProjects.sort((a, b) => {
                        const aOver = isOver(a) ? 1 : 0;
                        const bOver = isOver(b) ? 1 : 0;
                        if (bOver !== aOver) return bOver - aOver;
                        return (a.progress || 0) - (b.progress || 0);
                    });
                    pList.innerHTML = myProjects.map(proj => {
                        const over = isOver(proj);
                        const statusCol = proj.status === 'Completado' ? '#a0ca92' : (over ? '#ee6018' : '#eeeeee');
                        const sIco = proj.status === 'Completado' ? '✅' : (proj.status === 'En Progreso' ? '🚀' : (proj.status === 'No Iniciado' ? '⏸️' : '⏳'));
                        return `<div class="bg-[#1d1a18] border ${over ? 'border-[#ee6018]/60' : 'border-[#3d3a39]'} hover:border-[#eeeeee] rounded-[8px] p-3 transition flex items-center justify-between gap-3 cursor-pointer group" onclick="window.closeConfigDrawer(); window.showInfoCard('${proj.pType}', '${proj.id}')">
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${statusCol}"></span>
                                    <h5 class="text-xs font-normal text-[#eeeeee] group-hover:text-[#fafafa] truncate">${over ? '⚠️ ' : ''}${escapeHtml(proj.name)}</h5>
                                </div>
                                <div class="flex items-center gap-2 font-mono text-[9px] uppercase text-[#8a8380]">
                                    <span>📦 ${escapeHtml(proj.parentName || 'Directo')}</span>
                                    <span>•</span>
                                    <span>${sIco} ${proj.status || 'Pendiente'} (${proj.progress || 0}%)</span>
                                    ${proj.deadline ? `<span>•</span><span class="${over ? 'text-[#ee6018]' : ''}">📅 ${proj.deadline}</span>` : ''}
                                </div>
                            </div>
                            <div class="shrink-0 flex items-center gap-2">
                                <span class="font-mono text-xs text-[#eeeeee]">${proj.progress || 0}%</span>
                                <svg class="w-4 h-4 text-[#8a8380] group-hover:text-[#eeeeee] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 5l7 7-7 7"/></svg>
                            </div>
                        </div>`;
                    }).join('');
                }
            }

            // Renderizar Mis Tareas
            const tList = document.getElementById('dashMyTasksList');
            const tBadge = document.getElementById('dashMyTasksBadge');
            if (tBadge) tBadge.textContent = `${myTasks.length} PENDIENTE${myTasks.length === 1 ? '' : 'S'}`;
            if (tList) {
                if (myTasks.length === 0) {
                    tList.innerHTML = `<div class="p-4 rounded-[6px] border border-[#3d3a39] bg-[#1d1a18] text-center font-mono text-xs text-[#a0ca92] uppercase">✓ Todas tus tareas están al día</div>`;
                } else {
                    tList.innerHTML = myTasks.map(({ proj, task }) => {
                        return `<div class="bg-[#1d1a18] border border-[#3d3a39] rounded-[8px] p-2.5 flex items-start gap-2.5">
                            <input type="checkbox" onchange="window.toggleTaskFromDashboard('${proj.pType}', '${proj.id}', '${task.id}')" class="mt-0.5 rounded-[2px] border-[#3d3a39] bg-[#101010] text-[#a0ca92] focus:ring-[#a0ca92] h-3.5 w-3.5 cursor-pointer shrink-0">
                            <div class="flex-1 min-w-0">
                                <p class="text-xs text-[#eeeeee] leading-tight">${escapeHtml(task.text)}</p>
                                <div class="flex items-center gap-2 font-mono text-[9px] uppercase text-[#8a8380] mt-1">
                                    <span class="truncate cursor-pointer hover:text-[#eeeeee]" onclick="window.closeConfigDrawer(); window.showInfoCard('${proj.pType}', '${proj.id}')">📁 ${escapeHtml(proj.name)}</span>
                                    ${task.deadline ? `<span>•</span><span>📅 ${task.deadline}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
                    }).join('');
                }
            }
        } else {
            if (chartsCont) chartsCont.classList.remove('hidden');
            if (consCont) consCont.classList.add('hidden');

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
                            { label: 'Completados', data: dataDone, backgroundColor: '#a0ca92', borderRadius: 2, stack: 'carga' },
                            { label: 'En Tiempo', data: dataProg, backgroundColor: '#eeeeee', borderRadius: 2, stack: 'carga' },
                            { label: 'Vencidos', data: dataOver, backgroundColor: '#ee6018', borderRadius: 2, stack: 'carga' }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#b8b3b0', font: { size: 9, family: "'Geist Mono', monospace" }, boxWidth: 8, padding: 8 } }
                        },
                        scales: {
                            x: { stacked: true, ticks: { color: '#8a8380', font: { size: 9, family: "'Geist Mono', monospace" } }, grid: { display: false } },
                            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, color: '#8a8380', font: { size: 9, family: "'Geist Mono', monospace" } }, grid: { color: '#1d1a18' } }
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
                const mColors = moduleStats.map(m => m.color || '#ee6018');

                window.moduleChartInstance = new Chart(ctxMod, {
                    type: 'bar',
                    data: {
                        labels: mLabels,
                        datasets: [{
                            label: 'Avance %',
                            data: mData,
                            backgroundColor: mColors,
                            borderRadius: 2
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
                            x: { min: 0, max: 100, ticks: { callback: v => v + '%', color: '#8a8380', font: { size: 9, family: "'Geist Mono', monospace" } }, grid: { color: '#1d1a18' } },
                            y: { ticks: { color: '#eeeeee', font: { size: 9.5, family: "'Geist Mono', monospace" } }, grid: { display: false } }
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
                            backgroundColor: ['#a0ca92', '#eeeeee', '#8a8380', '#4d4947', '#ee6018'],
                            borderWidth: 0,
                            hoverOffset: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#b8b3b0', font: { size: 9, family: "'Geist Mono', monospace" }, boxWidth: 8, padding: 8 } }
                        },
                        cutout: '74%'
                    }
                });
            }
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
      if (currentUserRole !== 'Supremo') {
        window.showToast("🔒 Solo el perfil Supremo puede importar respaldos.", true);
        return;
      }
      const file = event.target.files[0]; if (!file) return;
      if (!file.name.toLowerCase().endsWith('.json')) {
        window.showToast("⚠️ Solo se permiten archivos con extensión .json", true);
        event.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        window.showToast("⚠️ El archivo excede el límite de seguridad (10 MB)", true);
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if(imported && typeof imported === 'object' && imported.appData && Array.isArray(imported.appData.modules) && imported.consultants && typeof imported.consultants === 'object') {
            appData = imported.appData; consultants = imported.consultants; if(Array.isArray(imported.globalDocs)) globalDocs = imported.globalDocs;
            ensureDataStructure(); window.saveData(true); refreshUI();
            window.showToast("Datos importados y verificados con éxito");
          } else {
            window.showToast("⚠️ Estructura de respaldo inválida", true);
          }
        } catch (err) { window.showToast("Error al importar archivo JSON", true); }
        event.target.value = '';
      };
      reader.readAsText(file);
    };

    // Inicialización directa

// === LÓGICA DE ACTIVIDADES DIARIAS ===
window.toggleDailyDrawer = function() {
        const btnDaily = document.getElementById('btnDailyTasks');
        const btnManual = document.getElementById('btnManual');
        const btnZoom = document.getElementById('canvasZoomWidget');

        if(isDailyDrawerOpen) {
            document.getElementById('dailyDrawer').classList.add('-translate-x-full');
            isDailyDrawerOpen = false;
            
            // Restaurar botones al cerrar
            if (btnDaily) btnDaily.classList.remove('hidden');
            if (btnManual) btnManual.classList.remove('hidden');
            if (btnZoom) btnZoom.classList.remove('hidden');
        } else {
            if(isDrawerOpen) window.closeConfigDrawer();
            if(isPriorityDrawerOpen) window.closePriorityDrawer();
            if (window.innerWidth < 768) window.closeInfoCardSafe();
            document.getElementById('dailyDrawer').classList.remove('-translate-x-full');
            isDailyDrawerOpen = true;
            
            // Ocultar botones para limpiar la interfaz
            if (btnDaily) btnDaily.classList.add('hidden');
            if (btnManual) btnManual.classList.add('hidden');
            if (btnZoom) btnZoom.classList.add('hidden');

            window.populateDailyAssignee();
            window.renderDailyTasks();
        }
    };

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
        const formDetails = document.getElementById('dailyTaskFormDetails');
        if (formDetails) formDetails.open = false;
        logActivity('daily', 'Actividades Diarias', `Asignó tarea diaria a ${assignee}: "${text}" (Asignada: ${assignDate} ${assignTime})`, localAuthor);
        window.saveData(false);
    };

// NUEVAS FUNCIONES PARA EL SPEED DIAL DE ACTIVIDAD DIARIA
    window.openFastDailyTaskModal = function() {
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
        
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
                }
            } else if (t.done === 'pending') {
                if (isSuper || isAssigner) {
                    t.done = true;
                    t.validatedDate = valDate; t.validatedTime = valTime; t.validatedBy = localAuthor;
                    const timeTrace = t.assignDate ? ` [Asignada: ${t.assignDate} ${t.assignTime||''} ➔ Validada: ${valDate} ${valTime}]` : '';
                    logActivity('daily', 'Actividades Diarias', `Validó tarea diaria de ${t.assignee||'consultor'}: "${t.text}"${timeTrace}`, localAuthor);
                    window.saveData(false);
                    window.triggerCelebration();
                } else if (t.assignee === localAuthor) {
                    t.done = false; delete t.feedback;
                    logActivity('daily', 'Actividades Diarias', `Canceló envío a validación: "${t.text}"`, localAuthor);
                    window.saveData(false);
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
    const formSection = document.getElementById('dailyTaskFormSection');
    if (formSection) {
        // Solo mostrar la sección de creación rápida en la pestaña de pendientes y si no es rol Lector
        if (currentNotifTab === 'pending' && currentUserRole !== 'Lector') {
            formSection.classList.remove('hidden');
        } else {
            formSection.classList.add('hidden');
        }
    }

    const activeThemes = {
        alerts: 'bg-[#ee6018]/15 border-[#ee6018] text-[#eeeeee] font-medium shadow-none',
        pending: 'bg-[#eeeeee] border-[#eeeeee] text-[#101010] font-medium shadow-none',
        validation: 'bg-[#ee6018]/15 border-[#ee6018] text-[#eeeeee] font-medium shadow-none',
        completed: 'bg-[#a0ca92]/15 border-[#a0ca92] text-[#eeeeee] font-medium shadow-none'
    };
    const activeBadgeThemes = {
        alerts: 'bg-[#ee6018] text-[#fafafa] border-[#ee6018]',
        pending: 'bg-[#101010] text-[#eeeeee] border-[#101010]',
        validation: 'bg-[#ee6018] text-[#fafafa] border-[#ee6018]',
        completed: 'bg-[#a0ca92] text-[#101010] border-[#a0ca92]'
    };
    const inactiveTheme = 'bg-transparent border-transparent text-[#8a8380] hover:text-[#eeeeee] hover:bg-[#1d1a18]';
    const inactiveBadgeTheme = 'bg-[#101010] text-[#8a8380] border-[#3d3a39]';
    const baseClasses = 'py-1.5 px-1 rounded-[2px] font-mono text-[10px] uppercase flex items-center justify-center gap-1 transition border cursor-pointer';

    ['alerts', 'pending', 'validation', 'completed'].forEach(t => {
        const btn = document.getElementById(`notifTabBtn-${t}`);
        const badgeEl = document.getElementById(`notifTabCount-${t}`);
        if (!btn) return;
        const isActive = (t === currentNotifTab);
        btn.className = `${baseClasses} ${isActive ? activeThemes[t] : inactiveTheme}`;
        if (badgeEl) {
            badgeEl.className = `text-[9px] font-mono px-1 py-0.2 rounded-[2px] border ${isActive ? activeBadgeThemes[t] : inactiveBadgeTheme}`;
        }
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
            <div class="flex flex-col items-center justify-center py-14 px-4 text-center bg-[#101010] border border-[#3d3a39] rounded-[10px]">
                <div class="w-10 h-10 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center justify-center font-mono text-sm text-[#a0ca92] mb-3">✓</div>
                <h3 class="font-mono text-xs uppercase text-[#eeeeee]">Sistema al día</h3>
                <p class="text-xs text-[#8a8380] mt-1 max-w-[240px] leading-relaxed">No hay proyectos vencidos ni alertas pendientes de atención.</p>
            </div>`;
            return;
        }

        const style = { 
            danger: ['text-[#ee6018]', 'bg-[#101010]', 'border-[#ee6018]/60'], 
            warning: ['text-[#ee6018]', 'bg-[#101010]', 'border-[#ee6018]/40'], 
            info: ['text-[#a0ca92]', 'bg-[#101010]', 'border-[#3d3a39]'],
            mention: ['text-[#eeeeee]', 'bg-[#101010]', 'border-[#eeeeee]/50']
        };

        container.innerHTML = `
        <div class="space-y-2.5 pb-6">
            <p class="font-mono text-[10px] text-[#8a8380] uppercase px-1">Alertamientos del Sistema (${alertsList.length})</p>
            ${alertsList.map(a => {
                const [txt, bg, br] = style[a.alertType] || style.info;
                const users = (a.users && a.users.length > 0) ? (Array.isArray(a.users) ? a.users.join(', ') : a.users) : 'Sin asignar';
                const canOpen = a.pType && a.pType !== 'global';
                const click = canOpen ? ` onclick="window.selectNode('${jsArg(a.pType)}', '${jsArg(a.id)}'); window.toggleDailyDrawer();"` : '';
                return `
                <div class="${bg} border ${br} rounded-[10px] p-3.5 ${canOpen ? 'cursor-pointer hover:border-[#eeeeee]' : 'cursor-default'} transition" ${click} title="${canOpen ? 'Clic para ir al proyecto' : ''}">
                    <div class="flex items-start gap-2.5">
                        <span class="text-base leading-none mt-0.5">${a.icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2">
                                <h4 class="text-xs font-normal ${txt} leading-tight truncate">${escapeHtml(a.name)}</h4>
                                ${canOpen ? `<span class="font-mono text-[9px] bg-[#1d1a18] text-[#b8b3b0] px-1.5 py-0.5 rounded-[2px] border border-[#3d3a39] shrink-0 uppercase">Mapa ↗</span>` : ''}
                            </div>
                            <p class="font-mono text-[9px] text-[#8a8380] uppercase truncate mt-0.5">└ ${escapeHtml(a.parentName || 'Proyectos')}</p>
                            <p class="text-[11px] ${txt} mt-2 leading-snug break-words">${escapeHtml(a.reason)}</p>
                            <div class="flex items-center gap-2 mt-2 flex-wrap text-[9px] text-[#b8b3b0] font-mono">
                                <span class="bg-[#1d1a18] px-2 py-0.5 rounded-[2px] border border-[#3d3a39]">👤 ${escapeHtml(users)}</span>
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
            <div class="flex flex-col items-center justify-center py-14 px-4 text-center bg-[#101010] border border-[#3d3a39] rounded-[10px]">
                <div class="w-10 h-10 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center justify-center font-mono text-sm text-[#eeeeee] mb-3">00</div>
                <h3 class="font-mono text-xs uppercase text-[#eeeeee]">Bandeja despejada</h3>
                <p class="text-xs text-[#8a8380] mt-1 max-w-[240px] leading-relaxed">No tienes tareas pendientes asignadas en este momento.</p>
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

        container.innerHTML = `<div class="space-y-2.5 pb-6">${sortedConsultants.map(cons => {
            const tasks = grouped[cons].sort((a, b) => (parseInt(b.id.split('_')[1]) || 0) - (parseInt(a.id.split('_')[1]) || 0));
            const cData = consultants[cons] || { color: '#8a8380' };
            const isMe = cons === localAuthor;

            return `
            <details open class="group bg-[#101010] border border-[#3d3a39] rounded-[10px] overflow-hidden transition">
                <summary class="flex justify-between items-center cursor-pointer p-3 select-none hover:bg-[#1d1a18] transition list-none [&::-webkit-details-marker]:hidden">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cData.color}"></span>
                        <span class="font-mono text-[11px] uppercase text-[#eeeeee] truncate">${escapeHtml(cons)} ${isMe ? '(Mis Tareas)' : ''}</span>
                        <span class="font-mono text-[9px] bg-[#1d1a18] text-[#b8b3b0] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px] shrink-0">${tasks.length} PDTES</span>
                    </div>
                    <svg class="w-4 h-4 text-[#8a8380] group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <div class="p-2.5 space-y-2 border-t border-[#3d3a39]">
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

                        let srcColor = t.sourceType === 'daily' ? 'text-[#b8b3b0]' : (t.sourceType === 'global' ? 'text-[#a0ca92]' : 'text-[#ee6018]');

                        return `
                        <div class="flex items-start gap-2.5 bg-[#1d1a18] p-2.5 rounded-[10px] border border-[#3d3a39] hover:border-[#4d4947] group transition" onclick="if(!event.target.closest('input') && !event.target.closest('button') && '${openAction}'!=='') { ${openAction} }">
                            <input type="checkbox" onchange="${t.sourceType === 'global' ? `completeGlobalTask('${t.id}')` : toggleAction}" class="rounded-[2px] border-[#3d3a39] bg-[#101010] accent-[#ee6018] h-4 w-4 shrink-0 mt-0.5 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}" ${!canEdit ? 'disabled' : ''} title="Marcar para completar">
                            <div class="flex flex-col flex-1 min-w-0 ${openAction !== '' ? 'cursor-pointer' : ''}">
                                <span class="text-xs text-[#eeeeee] break-words leading-snug">${escapeHtml(t.text)}</span>
                                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span class="font-mono text-[9px] uppercase ${srcColor}">${escapeHtml(t.pName)}</span>
                                    ${(t.assignDate || t.date) ? `<span class="text-[9px] text-[#8a8380] font-mono">📅 ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                                    ${t.deadline ? `<span class="text-[9px] text-[#ee6018] font-mono">⏱ Límite: ${escapeHtml(t.deadline)}</span>` : ''}
                                    ${t.assignedBy && t.assignedBy !== t.assignee ? `<span class="font-mono text-[9px] bg-[#101010] text-[#8a8380] px-1.5 py-0.5 rounded-[2px] border border-[#3d3a39]">De: ${escapeHtml(t.assignedBy)}</span>` : ''}
                                </div>
                            </div>
                            ${canDel ? `<button onclick="deleteDailyTask('${t.id}')" class="text-[#8a8380] hover:text-[#ee6018] opacity-0 group-hover:opacity-100 transition p-1 shrink-0" title="Borrar tarea"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : ''}
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
            <div class="flex flex-col items-center justify-center py-14 px-4 text-center bg-[#101010] border border-[#3d3a39] rounded-[10px]">
                <div class="w-10 h-10 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center justify-center font-mono text-sm text-[#b8b3b0] mb-3">⏳</div>
                <h3 class="font-mono text-xs uppercase text-[#eeeeee]">Sin entregas pendientes</h3>
                <p class="text-xs text-[#8a8380] mt-1 max-w-[240px] leading-relaxed">No hay tareas esperando revisión o visto bueno de jefatura.</p>
            </div>`;
            return;
        }

        container.innerHTML = `
        <div class="space-y-2.5 pb-6">
            <p class="font-mono text-[10px] text-[#8a8380] uppercase px-1">Esperando Aprobación (${validationTasks.length})</p>
            ${validationTasks.map(t => {
                const isAssigner = t.assignedBy === localAuthor;
                const canApprove = isSuper || isAssigner;
                const isMyTask = t.assignee === localAuthor;

                let srcColor = t.sourceType === 'daily' ? 'text-[#b8b3b0]' : (t.sourceType === 'global' ? 'text-[#a0ca92]' : 'text-[#ee6018]');

                return `
                <div class="bg-[#101010] border border-[#ee6018]/60 rounded-[10px] p-3.5">
                    <div class="flex items-start justify-between gap-2">
                        <span class="text-xs text-[#eeeeee] font-normal break-words">${escapeHtml(t.text)}</span>
                        <span class="font-mono text-[8px] bg-[#ee6018]/15 text-[#ee6018] border border-[#ee6018]/40 px-1.5 py-0.5 rounded-[2px] uppercase shrink-0">⏳ Validación</span>
                    </div>

                    <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span class="font-mono text-[9px] uppercase ${srcColor}">${escapeHtml(t.pName)}</span>
                        <span class="text-[9px] text-[#eeeeee] font-mono bg-[#1d1a18] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">👤 ${escapeHtml(t.assignee || 'Sin asignar')}</span>
                        ${(t.assignDate || t.date) ? `<span class="text-[9px] text-[#8a8380] font-mono bg-[#1d1a18] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">📅 ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                        ${t.submittedDate ? `<span class="text-[9px] text-[#ee6018] font-mono bg-[#1d1a18] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">🚀 Entregada: ${escapeHtml(t.submittedDate)}${t.submittedTime ? ' ' + escapeHtml(t.submittedTime) : ''}</span>` : ''}
                        ${t.assignedBy ? `<span class="text-[9px] text-[#8a8380] font-mono bg-[#1d1a18] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">Asignó: ${escapeHtml(t.assignedBy)}</span>` : ''}
                    </div>

                    ${t.feedback ? `<div class="mt-2.5 text-[10px] text-[#eeeeee] bg-[#1d1a18] border border-[#3d3a39] p-2.5 rounded-[3px] break-words">💬 <b>Evidencia:</b> ${escapeHtml(t.feedback)}</div>` : ''}

                    <div class="mt-3 pt-2.5 border-t border-[#3d3a39] flex items-center justify-between gap-2">
                        ${canApprove ? `
                            <div class="flex gap-2 w-full">
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', true)" class="flex-1 py-1.5 px-3 bg-[#a0ca92]/15 hover:bg-[#a0ca92] text-[#a0ca92] hover:text-[#101010] border border-[#a0ca92]/40 font-mono uppercase text-[10px] rounded-[3px] transition flex items-center justify-center gap-1">
                                    ✓ Aprobar
                                </button>
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)" class="flex-1 py-1.5 px-3 bg-[#ee6018]/15 hover:bg-[#ee6018] text-[#ee6018] hover:text-[#fafafa] border border-[#ee6018]/40 font-mono uppercase text-[10px] rounded-[3px] transition flex items-center justify-center gap-1">
                                    ✕ Rechazar
                                </button>
                            </div>
                        ` : (isMyTask ? `
                            <div class="flex items-center justify-between w-full">
                                <span class="text-[10px] text-[#8a8380]">Esperando revisión de supervisión...</span>
                                <button onclick="validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)" class="py-1 px-2.5 bg-[#1d1a18] hover:border-[#eeeeee] text-[#b8b3b0] hover:text-[#eeeeee] border border-[#3d3a39] font-mono uppercase text-[9px] rounded-[3px] transition">Cancelar envío</button>
                            </div>
                        ` : '<span class="font-mono text-[9px] text-[#8a8380] uppercase">Pendiente de revisión</span>')}
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
            <div class="flex flex-col items-center justify-center py-14 px-4 text-center bg-[#101010] border border-[#3d3a39] rounded-[10px]">
                <div class="w-10 h-10 rounded-[3px] bg-[#1d1a18] border border-[#3d3a39] flex items-center justify-center font-mono text-sm text-[#a0ca92] mb-3">✓</div>
                <h3 class="font-mono text-xs uppercase text-[#eeeeee]">Sin historial reciente</h3>
                <p class="text-xs text-[#8a8380] mt-1 max-w-[240px] leading-relaxed">Las tareas completadas y validadas aparecerán organizadas aquí.</p>
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

        container.innerHTML = `<div class="space-y-2.5 pb-6">${sortedConsultants.map(cons => {
            const tasks = grouped[cons].sort((a, b) => (parseInt(b.id.split('_')[1]) || 0) - (parseInt(a.id.split('_')[1]) || 0));
            const cData = consultants[cons] || { color: '#8a8380' };

            return `
            <details class="group bg-[#101010] border border-[#3d3a39] rounded-[10px] overflow-hidden transition">
                <summary class="flex justify-between items-center cursor-pointer p-3 select-none hover:bg-[#1d1a18] transition list-none [&::-webkit-details-marker]:hidden">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cData.color}"></span>
                        <span class="font-mono text-[11px] uppercase text-[#eeeeee] truncate">${escapeHtml(cons)}</span>
                        <span class="font-mono text-[9px] bg-[#a0ca92]/15 text-[#a0ca92] border border-[#a0ca92]/40 px-1.5 py-0.5 rounded-[2px] shrink-0">${tasks.length} HECHAS ✓</span>
                    </div>
                    <svg class="w-4 h-4 text-[#8a8380] group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 9l-7 7-7-7"/></svg>
                </summary>
                <div class="p-2.5 space-y-2 border-t border-[#3d3a39]">
                    ${tasks.map(t => {
                        const canRevert = isSuper || t.assignedBy === localAuthor;
                        return `
                        <div class="flex items-start gap-2.5 bg-[#1d1a18] p-2.5 rounded-[10px] border border-[#3d3a39] opacity-80 hover:opacity-100 transition">
                            <input type="checkbox" checked onchange="${canRevert ? `validateAnyTask('${t.sourceType}', '${t.strictType||''}', '${t.projectId||''}', '${t.id}', false)` : ''}" class="rounded-[2px] border-[#a0ca92] bg-[#101010] accent-[#a0ca92] h-4 w-4 shrink-0 mt-0.5 ${canRevert ? 'cursor-pointer' : 'cursor-not-allowed'}" ${!canRevert ? 'disabled' : ''} title="${canRevert ? 'Click para reabrir tarea' : 'Completada'}">
                            <div class="flex flex-col flex-1 min-w-0">
                                <span class="text-xs text-[#8a8380] line-through break-words">${escapeHtml(t.text)}</span>
                                <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span class="font-mono text-[9px] uppercase text-[#b8b3b0]">${escapeHtml(t.pName)}</span>
                                    ${(t.assignDate || t.date) ? `<span class="text-[9px] text-[#8a8380] font-mono bg-[#101010] border border-[#3d3a39] px-1.5 py-0.5 rounded-[2px]">📅 ${escapeHtml(t.assignDate || t.date)}${t.assignTime ? ' ' + escapeHtml(t.assignTime) : ''}</span>` : ''}
                                    <span class="text-[9px] text-[#a0ca92] font-mono bg-[#a0ca92]/10 border border-[#a0ca92]/30 px-1.5 py-0.5 rounded-[2px]">✓ ${escapeHtml(t.validatedDate || t.date || 'S/F')}${t.validatedTime ? ' ' + escapeHtml(t.validatedTime) : ''}${t.validatedBy ? ' por ' + escapeHtml(t.validatedBy) : ''}</span>
                                </div>
                                ${t.feedback ? `<div class="mt-1.5 text-[10px] text-[#b8b3b0] bg-[#101010] p-2 rounded-[3px] border border-[#3d3a39]">💬 ${escapeHtml(t.feedback)}</div>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </details>`;
        }).join('')}</div>`;
        return;
    }
};


// === LÓGICA DE FILTROS AVANZADOS Y MODO ENFOQUE ===
    window.focusFilteredMindMap = function() {
        if (!svgElem || !canvasGroup) return;
        const b = window._lastFilteredBounds;
        if (!b || b.count === 0) {
            window.recenterCanvas();
            return;
        }
        const rect = svgElem.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 768;
        const isSmallScreen = window.innerWidth < 640 || window.innerHeight < 520;
        let availW = rect.width;
        let availH = rect.height;
        if (isDesktop && isFilterDrawerOpen) {
            availW = Math.max(320, rect.width - 400);
        }
        const padX = isSmallScreen ? 28 : 80;
        const padY = isSmallScreen ? 36 : 90;
        const bW = Math.max(320, b.maxX - b.minX);
        const bH = Math.max(240, b.maxY - b.minY);
        const sX = (availW - padX * 2) / bW;
        const sY = (availH - padY * 2) / bH;
        const minAllowed = window.getMinZoomLimit ? window.getMinZoomLimit() : 0.18;
        const targetScale = Math.max(minAllowed, Math.min(1.05, Math.min(sX, sY)));
        const centerX = (b.minX + b.maxX) / 2;
        const centerY = (b.minY + b.maxY) / 2;
        const targetTx = (availW / 2) - (centerX * targetScale);
        const targetTy = (availH / 2) - (centerY * targetScale);
        window.animateCameraTo(targetTx, targetTy, targetScale, 520);
    };

    window.toggleFilterDrawer = function() {
        if(isFilterDrawerOpen) {
            document.getElementById('filterDrawer').classList.add('translate-x-full');
            isFilterDrawerOpen = false;
            if (window._lastFilteredBounds) {
                setTimeout(() => window.focusFilteredMindMap(), 60);
            }
        } else {
            if(isDrawerOpen) window.closeConfigDrawer();
            if(isPriorityDrawerOpen) window.closePriorityDrawer();
            document.getElementById('filterDrawer').classList.remove('translate-x-full');
            isFilterDrawerOpen = true;
            window.populateAdvFilters();
            if (window._lastFilteredBounds) {
                setTimeout(() => window.focusFilteredMindMap(), 60);
            }
        }
    };

    window.setModuleFilterMode = function(mode) {
        moduleFilterMode = mode;
        window.renderFilterChips();
        window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
        setTimeout(() => window.focusFilteredMindMap(), 40);
    };

    window.setConsultantFilterMode = function(mode) {
        consultantFilterMode = mode;
        window.renderFilterChips();
        window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
        setTimeout(() => window.focusFilteredMindMap(), 40);
    };

    // === CÁLCULO EN CASCADA DE PROYECTOS CORRELACIONADOS EN FILTROS AVANZADOS ===
    window.getFilteredProjectsScope = function(excludeCategory = null) {
        const allProjs = (appData.directProjects || []).concat((appData.modules || []).flatMap(m => m.projects || []));
        
        const isModAll = activeFilterModules.includes('ALL') || activeFilterModules.length === 0;
        const selectedNormMods = new Set(activeFilterModules.filter(x => x !== 'ALL').map(normModId));
        
        const isConsAll = activeFilterConsultants.includes('ALL') || activeFilterConsultants.length === 0;
        const isCompAll = activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0;
        const isStatusAll = activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0;
        
        const q = (activeSearchQuery || '').toLowerCase().trim();
        
        return allProjs.filter(p => {
            if (!p) return false;
            
            // 1. Filtro de Módulos
            if (excludeCategory !== 'module' && !isModAll) {
                const pContainerMod = normModId(p._modId);
                const pSecs = (Array.isArray(p.secondaryModules) ? p.secondaryModules : []).map(normModId);
                const matchesMod = selectedNormMods.has(pContainerMod) || pSecs.some(sm => selectedNormMods.has(sm));
                if (!matchesMod) return false;
            }
            
            // 2. Filtro de Consultores
            if (excludeCategory !== 'consultant' && !isConsAll) {
                const pCons = getProjectConsultants(p);
                if (consultantFilterMode === 'ALL_SELECTED' && activeFilterConsultants.length >= 2) {
                    if (!activeFilterConsultants.every(c => pCons.includes(c))) return false;
                } else {
                    if (!pCons.some(c => activeFilterConsultants.includes(c))) return false;
                }
            }
            
            // 3. Filtro de Empresas
            if (excludeCategory !== 'company' && !isCompAll) {
                const pComps = window.getProjectCompanies(p);
                if (!pComps.some(c => activeFilterCompanies.includes(c))) return false;
            }
            
            // 4. Filtro de Estatus
            if (excludeCategory !== 'status' && !isStatusAll) {
                if (!activeFilterStatuses.includes(p.status)) return false;
            }
            
            // 5. Filtros complementarios
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
        });
    };

    // === CHIPS DE MULTISELECCIÓN EN FILTROS AVANZADOS ===
    window.renderFilterChips = function() {
        const isModAll = activeFilterModules.includes('ALL') || activeFilterModules.length === 0;
        const isConsAll = activeFilterConsultants.includes('ALL') || activeFilterConsultants.length === 0;
        const isCompAll = activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0;
        const isStatusAll = activeFilterStatuses.includes('ALL') || activeFilterStatuses.length === 0;

        // 0. Módulos / Agrupadores (Multiselección + Correlación)
        const modContainer = document.getElementById('advFilterModuleChips');
        if (modContainer) {
            const projsForMod = window.getFilteredProjectsScope('module');
            const hasNonModFilters = (!isConsAll || !isCompAll || !isStatusAll || activeFilterUrgency !== 'ALL' || activeFilterPriority !== 'ALL' || activeFilterBottleneck !== 'ALL');
            let html = '';

            // Selector de modo cuando hay 2 o más módulos seleccionados
            if (!isModAll && activeFilterModules.length >= 2) {
                html += `
                <div class="w-full flex items-center gap-1.5 p-1 bg-[#101010] border border-[#3d3a39] rounded-[10px] mb-2">
                    <button type="button" onclick="setModuleFilterMode('ANY')" class="flex-1 py-1.5 px-2 rounded-[3px] font-mono uppercase text-[9px] transition text-center ${moduleFilterMode === 'ANY' ? 'bg-[#eeeeee] text-[#101010]' : 'text-[#8a8380] hover:text-[#eeeeee]'}">
                        🔗 Todos y su correlación
                    </button>
                    <button type="button" onclick="setModuleFilterMode('CORRELATED')" class="flex-1 py-1.5 px-2 rounded-[3px] font-mono uppercase text-[9px] transition text-center ${moduleFilterMode === 'CORRELATED' ? 'bg-[#ee6018] text-[#fafafa]' : 'text-[#8a8380] hover:text-[#eeeeee]'}">
                        🤝 Solo correlacionados entre sí
                    </button>
                </div>`;
            }

            html += `<button type="button" onclick="toggleFilterChip('module', 'ALL', false)" class="filter-chip ${isModAll ? 'active' : ''}">
                📦 Todos <span class="chip-count">${projsForMod.length}</span>
            </button>`;

            const directColor = (appData.directHub && appData.directHub.color) ? appData.directHub.color : '#ee6018';
            const directName = (appData.directHub && appData.directHub.name) ? appData.directHub.name : 'Proyectos Directos';
            const isDirectAct = !isModAll && activeFilterModules.includes('direct-hub');
            const dirCnt = projsForMod.filter(p => normModId(p._modId) === 'hub-direct' || (p.secondaryModules || []).map(normModId).includes('hub-direct')).length;
            const isDirBlocked = hasNonModFilters && dirCnt === 0;

            html += `<button type="button" onclick="toggleFilterChip('module', 'direct-hub', ${isDirBlocked})" class="filter-chip ${isDirectAct ? 'active' : ''} ${isDirBlocked ? 'blocked' : ''}" title="${isDirBlocked ? 'Sin proyectos en esta selección' : ''}">
                <span class="w-2 h-2 rounded-full inline-block shrink-0" style="background-color: ${directColor};"></span>
                <span>⚡ ${escapeHtml(directName)}</span>
                <span class="chip-count">${dirCnt}</span>
            </button>`;

            (appData.modules || []).forEach(m => {
                const isAct = !isModAll && activeFilterModules.includes(m.id);
                const mColor = m.color || '#0071e3';
                const mNorm = normModId(m.id);
                const mCnt = projsForMod.filter(p => normModId(p._modId) === mNorm || (p.secondaryModules || []).map(normModId).includes(mNorm)).length;
                const isBlocked = hasNonModFilters && mCnt === 0;

                html += `<button type="button" onclick="toggleFilterChip('module', '${jsArg(m.id)}', ${isBlocked})" class="filter-chip ${isAct ? 'active' : ''} ${isBlocked ? 'blocked' : ''}" title="${isBlocked ? 'Sin proyectos en esta selección' : ''}">
                    <span class="w-2 h-2 rounded-full inline-block shrink-0" style="background-color: ${mColor};"></span>
                    <span>${escapeHtml(m.name)}</span>
                    <span class="chip-count">${mCnt}</span>
                </button>`;
            });
            modContainer.innerHTML = html;
        }

        // 1. Consultores
        const consContainer = document.getElementById('advFilterConsultantChips');
        if (consContainer) {
            const allC = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector');
            const isAllSelected = activeFilterConsultants.includes('ALL') || activeFilterConsultants.length === 0;
            const projsForCons = window.getFilteredProjectsScope('consultant');
            const hasNonConsFilters = (!isModAll || !isCompAll || !isStatusAll || activeFilterUrgency !== 'ALL' || activeFilterPriority !== 'ALL' || activeFilterBottleneck !== 'ALL');
            
            let html = '';

            // Selector de modo cuando hay 2 o más consultores seleccionados
            if (!isAllSelected && activeFilterConsultants.length >= 2) {
                html += `
                <div class="w-full flex items-center gap-1.5 p-1 bg-[#101010] border border-[#3d3a39] rounded-[10px] mb-2">
                    <button type="button" onclick="setConsultantFilterMode('ANY')" class="flex-1 py-1.5 px-2 rounded-[3px] font-mono uppercase text-[9px] transition text-center ${consultantFilterMode === 'ANY' ? 'bg-[#eeeeee] text-[#101010]' : 'text-[#8a8380] hover:text-[#eeeeee]'}">
                        🔗 Individuales y juntos
                    </button>
                    <button type="button" onclick="setConsultantFilterMode('ALL_SELECTED')" class="flex-1 py-1.5 px-2 rounded-[3px] font-mono uppercase text-[9px] transition text-center ${consultantFilterMode === 'ALL_SELECTED' ? 'bg-[#ee6018] text-[#fafafa]' : 'text-[#8a8380] hover:text-[#eeeeee]'}">
                        🤝 Solo colaborando juntos
                    </button>
                </div>`;
            }

            html += `<button type="button" onclick="toggleFilterChip('consultant', 'ALL', false)" class="filter-chip ${isAllSelected ? 'active' : ''}">👥 Todos <span class="chip-count">${projsForCons.length}</span></button>`;
            
            allC.forEach(name => {
                const isAct = !isAllSelected && activeFilterConsultants.includes(name);
                const cColor = consultants[name]?.color || '#ee6018';
                const cCnt = projsForCons.filter(p => getProjectConsultants(p).includes(name)).length;
                const isBlocked = hasNonConsFilters && cCnt === 0;

                html += `<button type="button" onclick="toggleFilterChip('consultant', '${jsArg(name)}', ${isBlocked})" class="filter-chip ${isAct ? 'active' : ''} ${isBlocked ? 'blocked' : ''}" title="${isBlocked ? 'Sin proyectos en esta selección' : ''}">
                    <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${cColor};"></span>
                    <span>${escapeHtml(name)}</span>
                    <span class="chip-count">${cCnt}</span>
                </button>`;
            });
            consContainer.innerHTML = html;
        }

        // 2. Empresas Destino
        const compContainer = document.getElementById('advFilterCompanyChips');
        if (compContainer) {
            const allComps = window.getAllKnownCompanies ? window.getAllKnownCompanies() : ['AFR', 'AVM', 'TEO', 'TNO', 'ZIN', 'GENERAL'];
            const isAllSelected = activeFilterCompanies.includes('ALL') || activeFilterCompanies.length === 0;
            const projsForComp = window.getFilteredProjectsScope('company');
            const hasNonCompFilters = (!isModAll || !isConsAll || !isStatusAll || activeFilterUrgency !== 'ALL' || activeFilterPriority !== 'ALL' || activeFilterBottleneck !== 'ALL');

            let html = `<button type="button" onclick="toggleFilterChip('company', 'ALL', false)" class="filter-chip ${isAllSelected ? 'active' : ''}">🏢 Todas <span class="chip-count">${projsForComp.length}</span></button>`;

            allComps.forEach(comp => {
                const isAct = !isAllSelected && activeFilterCompanies.includes(comp);
                const compCnt = projsForComp.filter(p => window.getProjectCompanies(p).includes(comp)).length;
                const isBlocked = hasNonCompFilters && compCnt === 0;

                html += `<button type="button" onclick="toggleFilterChip('company', '${jsArg(comp)}', ${isBlocked})" class="filter-chip ${isAct ? 'active' : ''} ${isBlocked ? 'blocked' : ''}" title="${isBlocked ? 'Sin proyectos en esta selección' : ''}">
                    <span>${escapeHtml(comp)}</span>
                    <span class="chip-count">${compCnt}</span>
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
            const projsForStatus = window.getFilteredProjectsScope('status');
            const hasNonStatusFilters = (!isModAll || !isConsAll || !isCompAll || activeFilterUrgency !== 'ALL' || activeFilterPriority !== 'ALL' || activeFilterBottleneck !== 'ALL');

            let html = '';
            statuses.forEach(st => {
                const isAct = (st.id === 'ALL' && isAllSelected) || (!isAllSelected && activeFilterStatuses.includes(st.id));
                const sCnt = st.id === 'ALL' ? projsForStatus.length : projsForStatus.filter(p => p.status === st.id).length;
                const isBlocked = st.id !== 'ALL' && hasNonStatusFilters && sCnt === 0;

                html += `<button type="button" onclick="toggleFilterChip('status', '${jsArg(st.id)}', ${isBlocked})" class="filter-chip ${isAct ? 'active' : ''} ${isBlocked ? 'blocked' : ''}" title="${isBlocked ? 'Sin proyectos en esta selección' : ''}">
                    <span>${escapeHtml(st.label)}</span>
                    <span class="chip-count">${sCnt}</span>
                </button>`;
            });
            statusContainer.innerHTML = html;
        }
    };

    window.toggleFilterChip = function(type, val, isBlocked) {
        if (isBlocked && val !== 'ALL') {
            const labels = { module: 'módulo', consultant: 'consultor', company: 'empresa', status: 'estatus' };
            window.showToast(`⚠️ Este ${labels[type] || 'elemento'} no tiene proyectos con los filtros actuales`, true);
            return;
        }
        if (type === 'module') {
            if (val === 'ALL') {
                activeFilterModules = ['ALL'];
            } else {
                activeFilterModules = activeFilterModules.filter(x => x !== 'ALL');
                if (activeFilterModules.includes(val)) {
                    activeFilterModules = activeFilterModules.filter(x => x !== val);
                    if (activeFilterModules.length === 0) activeFilterModules = ['ALL'];
                } else {
                    activeFilterModules.push(val);
                }
            }
            activeFilterModule = activeFilterModules[0] || 'ALL';
            
            // Autolimpiar consultores y empresas si ya no tienen proyectos bajo la nueva selección de módulos
            if (!activeFilterModules.includes('ALL')) {
                const projsForCons = window.getFilteredProjectsScope('consultant');
                activeFilterConsultants = activeFilterConsultants.filter(c => c === 'ALL' || projsForCons.some(p => getProjectConsultants(p).includes(c)));
                if (activeFilterConsultants.length === 0) activeFilterConsultants = ['ALL'];
                
                const projsForComp = window.getFilteredProjectsScope('company');
                activeFilterCompanies = activeFilterCompanies.filter(comp => comp === 'ALL' || projsForComp.some(p => window.getProjectCompanies(p).includes(comp)));
                if (activeFilterCompanies.length === 0) activeFilterCompanies = ['ALL'];
            }
        } else if (type === 'consultant') {
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
        const urgSel = document.getElementById('advFilterUrgency');
        if (urgSel) urgSel.value = activeFilterUrgency;
        const prioSel = document.getElementById('advFilterPriority');
        if (prioSel) prioSel.value = activeFilterPriority;
        const botSel = document.getElementById('advFilterBottleneck');
        if (botSel) botSel.value = activeFilterBottleneck;

        window.renderFilterChips();
        if (typeof window.updateSecondaryLinksBtnUI === 'function') window.updateSecondaryLinksBtnUI();
    };

    window.handleAdvFilter = function() {
        const urgSel = document.getElementById('advFilterUrgency');
        if (urgSel) activeFilterUrgency = urgSel.value;
        const prioSel = document.getElementById('advFilterPriority');
        if (prioSel) activeFilterPriority = prioSel.value;
        const botSel = document.getElementById('advFilterBottleneck');
        if (botSel) activeFilterBottleneck = botSel.value;
        
        let c = 0;
        if (!activeFilterModules.includes('ALL') && activeFilterModules.length > 0) c += activeFilterModules.length;
        if (!activeFilterConsultants.includes('ALL') && activeFilterConsultants.length > 0) c += activeFilterConsultants.length;
        if (!activeFilterStatuses.includes('ALL') && activeFilterStatuses.length > 0) c += activeFilterStatuses.length;
        if (!activeFilterCompanies.includes('ALL') && activeFilterCompanies.length > 0) c += activeFilterCompanies.length;
        if (activeFilterUrgency !== 'ALL') c++;
        if (activeFilterPriority !== 'ALL') c++;
        if (activeFilterBottleneck !== 'ALL') c++;
        if (showAllSecondaryLinks) c++;
        
        const badge = document.getElementById('activeFiltersBadge');
        if (badge) {
            if (c > 0) { badge.textContent = c; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }
        }
        
        if (isFocusMode) window.toggleFocusMode(); // Si usas filtros manuales, apaga el enfoque
        else window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
        setTimeout(() => window.focusFilteredMindMap(), 40);
    };

    window.resetAdvFilters = function() {
        activeFilterModule = 'ALL';
        activeFilterModules = ['ALL'];
        moduleFilterMode = 'ANY';
        activeFilterConsultants = ['ALL'];
        activeFilterStatuses = ['ALL'];
        activeFilterCompanies = ['ALL'];
        activeFilterConsultant = 'ALL';
        activeFilterStatus = 'ALL';
        activeFilterCompany = 'ALL';
        activeFilterUrgency = 'ALL';
        activeFilterPriority = 'ALL';
        activeFilterBottleneck = 'ALL';
        consultantFilterMode = 'ANY';
        showAllSecondaryLinks = false;
        document.body.classList.remove('show-all-sec-links');
        if (typeof window.updateSecondaryLinksBtnUI === 'function') window.updateSecondaryLinksBtnUI();
        
        const badge = document.getElementById('activeFiltersBadge');
        if (badge) badge.classList.add('hidden');
        
        // Apaga el Modo Enfoque si estaba encendido al limpiar filtros
        if (isFocusMode) {
            isFocusMode = false;
            const btn = document.getElementById('btnFocusMode');
            if (btn) {
                btn.classList.remove('bg-[#101010]', 'border-[#ee6018]', 'text-[#ee6018]', 'bg-[#bf5af2]/20', 'border-[#bf5af2]/50', 'text-[#bf5af2]');
                btn.classList.add('bg-[#1d1a18]', 'border-[#3d3a39]', 'text-[#b8b3b0]');
            }
        }
        
        window.populateAdvFilters(); 
        window.renderMindMap();
        if (isPriorityDrawerOpen) window.renderPriorityDrawer();
        setTimeout(() => window.recenterCanvas(), 40);
    };

    // === GESTIÓN DE COLAPSO Y EXPANSIÓN INTELIGENTE DE MÓDULOS ===
    let isCollapsingAnim = false;

    window.toggleModuleCollapse = function(modId) {
        if (isCollapsingAnim) return;

        if (collapsedModules.has(modId)) {
            collapsedModules.delete(modId);
            lastExpandedModuleId = modId;
            window.updateCollapseAllButtonState();
            window.renderMindMap();
        } else {
            const projs = canvasGroup.querySelectorAll('.mindmap-project-node[data-parent-mod="' + modId + '"]');
            const conns = canvasGroup.querySelectorAll('.mindmap-connector[data-parent-mod="' + modId + '"]');
            projs.forEach(el => {
                el.classList.remove('proj-animate-in');
                el.style.animationDelay = '0ms';
                el.classList.add('proj-animate-out');
            });
            conns.forEach(el => {
                el.classList.remove('connector-animate-in');
                el.style.animationDelay = '0ms';
                el.classList.add('connector-animate-out');
            });
            isCollapsingAnim = true;
            setTimeout(() => {
                collapsedModules.add(modId);
                isCollapsingAnim = false;
                window.updateCollapseAllButtonState();
                window.renderMindMap();
            }, 270);
        }
    };

    window.collapseAllModules = function() {
        const allModIds = ['hub-direct', ...(appData.modules || []).map(m => m.id)];
        allModIds.forEach(id => collapsedModules.add(id));
        window.updateCollapseAllButtonState();
        window.renderMindMap();
        setTimeout(() => {
            window.recenterCanvas(480);
        }, 50);
        window.showToast('Módulos colapsados para vista panorámica');
    };

    window.expandAllModules = function() {
        collapsedModules.clear();
        window.updateCollapseAllButtonState();
        window.renderMindMap();
        setTimeout(() => {
            window.recenterCanvas(520);
        }, 50);
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
            btn.classList.add('bg-[#101010]', 'border-[#ee6018]', 'text-[#ee6018]');
            btn.classList.remove('bg-[#1d1a18]', 'border-[#3d3a39]', 'text-[#b8b3b0]', 'bg-white/5', 'border-white/10', 'text-gray-400');
            window.showToast("Modo Enfoque: Mostrando Riesgos", false);
        } else {
            btn.classList.remove('bg-[#101010]', 'border-[#ee6018]', 'text-[#ee6018]', 'bg-[#bf5af2]/20', 'border-[#bf5af2]/50', 'text-[#bf5af2]');
            btn.classList.add('bg-[#1d1a18]', 'border-[#3d3a39]', 'text-[#b8b3b0]');
        }
        window.renderMindMap();
        setTimeout(() => { if (typeof window.focusFilteredMindMap === 'function') window.focusFilteredMindMap(); }, 40);
    };

    window.toggleSecondaryLinks = function() {
        showAllSecondaryLinks = !showAllSecondaryLinks;
        document.body.classList.toggle('show-all-sec-links', showAllSecondaryLinks);
        window.updateSecondaryLinksBtnUI();
        if (showAllSecondaryLinks) {
            window.showToast("🔗 Mostrando todos los vínculos multimódulo", false);
        } else {
            window.showToast("🔗 Vínculos en modo inteligente (hover/selección)", false);
        }
        if (typeof window.handleAdvFilter === 'function') {
            window.handleAdvFilter();
        } else {
            window.renderMindMap();
        }
    };

    window.updateSecondaryLinksBtnUI = function() {
        const btn = document.getElementById('advFilterToggleLinksBtn');
        if (btn) {
            if (showAllSecondaryLinks) {
                btn.className = "shrink-0 px-3 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-wider transition border border-[#ee6018] bg-[#ee6018] text-[#fafafa]";
                btn.textContent = "Activo";
            } else {
                btn.className = "shrink-0 px-3 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-wider transition border border-[#3d3a39] bg-[#101010] text-[#8a8380] hover:text-[#eeeeee]";
                btn.textContent = "Inactivo";
            }
        }
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
