const escapeHtml = (u) => { if (!u) return ''; return u.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    
    let appId, db, auth, isFirebaseReady = false, unsubscribeSnapshot = null;
    let globalDoc, globalSetDoc;
    let isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    let svgElem, canvasGroup, svgDefs;
    let translateX = 0, translateY = 0, scale = 1;
    let isPanning = false, startX, startY;
    let initialPinchDistance = null;
    let isDrawerOpen = false, isPriorityDrawerOpen = false, isAlertsDrawerOpen = false, isDailyDrawerOpen = false, isFilterDrawerOpen = false;
    let activeSearchQuery = '';
    let activeFilterModule = 'ALL', activeFilterConsultant = 'ALL', activeFilterStatus = 'ALL';
    let activeFilterUrgency = 'ALL', activeFilterPriority = 'ALL', activeFilterBottleneck = 'ALL', isFocusMode = false;    let currentSelection = { type: null, id: null };
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

    let appData = {}; 
    let consultants = JSON.parse(JSON.stringify(fallbackConsultants));
    let globalDocs = [];

    Chart.defaults.color = '#8e8e93'; Chart.defaults.borderColor = 'rgba(255,255,255,0.05)'; Chart.defaults.font.family = 'Inter';

    const defaultTestingData = {
      core: { id: 'sicom', name: 'SICOM' },
      secondaryCore: { id: 'sucom', name: 'SUCOM', active: false },
      directHub: { id: 'hub-direct', name: 'PROYECTOS DIRECTOS SICOM', color: '#f59e0b' },
      directProjects: [],
      modules: [],
      history: []
    };

    async function initData() {
        window.populateLoginDropdown(); 

        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js");
            const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js");
            const { getFirestore, doc, setDoc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js");
            
            globalDoc = doc; globalSetDoc = setDoc;

            const firebaseConfig = {
                apiKey: "AIzaSyD5_UtypfJg5qsFDdv-MBamP18IZ_vZhVE",
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
                        appData = data.appData || {};
                        
                        if(data.consultants && Object.keys(data.consultants).length > 2) {
                            consultants = data.consultants;
                            if (consultants["Osvaldo Avilés"]) consultants["Osvaldo Avilés"].role = "Supremo";
                            if (consultants["Rafael Romero"]) consultants["Rafael Romero"].role = "Supervisor";
                            if (!consultants["Miguel Barbosa"]) consultants["Miguel Barbosa"] = {"color": "#30d158", "role": "Supervisor"};
                            if (!consultants["Lector (Jefatura)"]) consultants["Lector (Jefatura)"] = {"color": "#8e8e93", "role": "Lector"};
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
        
        if (taskType === 'global') {
            const t = appData.globalTasks.find(x => x.id === taskId);
            if (t) {
                t.done = finalStatus;
                t.feedback = feedback;
                logActivity('global', 'General', isSuper ? `Validó tarea general: ${t.text}` : `Envió tarea a validación: ${t.text}`, localAuthor);
                window.saveData(false);
                window.renderAlerts();
            }
        } else if (taskType === 'daily') {
            const t = appData.dailyTasks.find(x => x.id === taskId);
            if (t) {
                t.done = finalStatus;
                t.feedback = feedback;
                logActivity('daily', 'Actividades Diarias', isSuper ? `Validó tarea diaria: ${t.text}` : `Envió tarea diaria a validación: ${t.text}`, localAuthor);
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
                    logActivity(item.id, item.name, isSuper ? 'Validó una tarea' : 'Envió tarea a validación', localAuthor); 
                    window.saveData(false); 
                    window.renderTasksQuick(item); 
                    window.renderAlerts();
                }
            }
        }
        
        window.showToast("Enviado correctamente");
        window.closeTaskFeedbackModal();
    };

    
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobileMenuDropdown');
        if (menu.classList.contains('opacity-0')) {
            menu.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
        } else {
            menu.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            menu.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        }
    };
    
    // Close mobile menu if clicked outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('mobileMenuDropdown');
        const btn = document.getElementById('mobileMenuBtn');
        if (menu && btn && !menu.classList.contains('opacity-0') && !menu.contains(e.target) && !btn.contains(e.target)) {
            window.toggleMobileMenu();
        }
    });

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
        
        const content = document.getElementById('manualContent');
        if (currentUserRole === 'Supremo') {
            content.innerHTML = `
            <h3 class="text-lg font-bold text-[#ff453a] mb-2">Supremo (Administración Total)</h3>
            <p class="text-xs text-gray-300 mb-4 leading-relaxed">Como Supremo, tienes el control absoluto de la arquitectura, usuarios y datos críticos del Panel de Control SICOM.</p>
            <ul class="text-xs space-y-4 text-gray-300 list-disc pl-4 leading-relaxed">
                <li><strong class="text-white">Gestión de Usuarios y Contraseñas:</strong> En el menú <strong>Panel > Equipo</strong>, puedes dar de alta nuevos consultores o modificar los existentes. Haz clic en el ícono de la llave (🔑) para asignar o resetear la contraseña privada de cualquier usuario, o cambia sus niveles de acceso al instante.</li>
                <li><strong class="text-white">Estructura del Sistema:</strong> Eres el único con la capacidad de crear nuevos "Módulos" (agrupadores visuales). Además, al editar un proyecto o módulo, verás un botón rojo de "Eliminar" que borra los datos permanentemente de la base de datos.</li>
                <li><strong class="text-white">Auditoría y Validación de Tareas:</strong> Las tareas que terminan los consultores entrarán en estado ⏳ En Validación. Desde tu campana de alertas (🔔) puedes <strong>✅ Aprobarlas</strong> o <strong>❌ Rechazarlas</strong>. Si tú completas una tarea manualmente desde el proyecto, se validará de inmediato.</li>
                <li><strong class="text-white">Documentación Base (Estandarización):</strong> En Panel > <strong>Docs Base</strong>, defines los requisitos globales que todo proyecto debe cumplir. El avance automático (0 a 100%) se calcula matemáticamente según cuántos de estos documentos han sido palomeados o marcados como N/A (validado) en cada proyecto.</li>
                <li><strong class="text-white">Auditoría Global y Respaldos:</strong> El sistema registra silenciosamente cada movimiento. En la pestaña <strong>Historial</strong> puedes auditar quién hizo qué modificación y a qué hora. Al final del Panel, tienes controles para exportar a Excel (CSV), respaldar en JSON o forzar una sincronización con la nube (Firebase).</li>
            </ul>`;
        } else if (currentUserRole === 'Supervisor') {
            content.innerHTML = `
            <h3 class="text-lg font-bold text-[#ff9f0a] mb-2">Supervisor (Coordinador)</h3>
            <p class="text-xs text-gray-300 mb-4 leading-relaxed">Como Supervisor, eres responsable de la calidad del trabajo, la auditoría de tareas y el control de tiempos del equipo.</p>
            <ul class="text-xs space-y-4 text-gray-300 list-disc pl-4 leading-relaxed">
                <li><strong class="text-white">Auditoría y Validación:</strong> Cuando un consultor termina una tarea, recibirás una alerta. Abre la campana (🔔) y verás la tarea en color naranja. Tendrás dos opciones: <span class="text-[#30d158] font-bold">✅ Aprobar</span> (la tarea se marca como completada verde y suma al historial) o <span class="text-[#ff453a] font-bold">❌ Rechazar</span> (se devuelve al consultor como pendiente).</li>
                <li><strong class="text-white">Edición de Proyectos:</strong> Tienes permisos para modificar los detalles de cualquier proyecto. Selecciónalo en el mapa y abre el <strong>Panel > Editar</strong>. Podrás cambiar su estatus, ajustar fechas de entrega, actualizar el porcentaje de avance y pegar los enlaces oficiales de Drive e Invgate.</li>
                <li><strong class="text-white">Asignación de Tareas:</strong> Usa el botón verde "Asignar Tarea" en el menú superior para delegar actividades. Puedes asignarlas a un proyecto específico o crear "Tareas Generales" independientes. Tú decides la fecha límite y el responsable.</li>
                <li><strong class="text-white">Radiografía Operativa:</strong> Entra al <strong>Panel > Tablero</strong>. Al final, encontrarás una tabla analítica que mide en tiempo real la carga de proyectos activos por consultor, su avance promedio y, lo más importante, cuántos <strong>Atrasos (🚨)</strong> tiene acumulados por incumplimiento de fechas límite.</li>
            </ul>`;
        } else if (currentUserRole === 'Lector') {
            content.innerHTML = `
            <h3 class="text-lg font-bold text-gray-400 mb-2">Lector (Solo Vista)</h3>
            <p class="text-xs text-gray-300 mb-4 leading-relaxed">Como Lector, tienes acceso de auditoría visual a todo el sistema, sin riesgo de modificar o alterar los datos operativos.</p>
            <ul class="text-xs space-y-4 text-gray-300 list-disc pl-4 leading-relaxed">
                <li><strong class="text-white">Exploración de Proyectos:</strong> Puedes navegar libremente por el mapa mental, buscar proyectos por nombre usando la Lupa, o filtrar por consultor y estatus para evaluar el rendimiento de áreas específicas.</li>
                <li><strong class="text-white">Auditoría Transparente:</strong> Al hacer clic en cualquier proyecto, podrás inspeccionar su tarjeta de información. Verás su estatus exacto, fechas de entrega, tareas pendientes y completadas, así como el desglose de documentos que justifican su nivel de avance matemático.</li>
                <li><strong class="text-white">Accesos Directos (Drive e Invgate):</strong> Si los coordinadores han enlazado documentación o tickets oficiales, los botones azules (Drive) y verdes (Invgate) estarán activos para que puedas revisarlos directamente.</li>
                <li><strong class="text-white">Historial y Tablero:</strong> En el menú <strong>Panel</strong>, tienes acceso al Tablero para revisar métricas generales y la Radiografía Operativa de todo el equipo, y a la pestaña <strong>Historial</strong> para trazar cada movimiento realizado por los operadores.</li>
            </ul>`;
        } else {
            content.innerHTML = `
            <h3 class="text-lg font-bold text-brand-accent mb-2">Consultor Operativo</h3>
            <p class="text-xs text-gray-300 mb-4 leading-relaxed">Como Consultor, tu objetivo principal es ejecutar y reportar el progreso de tus asignaciones con precisión.</p>
            <ul class="text-xs space-y-4 text-gray-300 list-disc pl-4 leading-relaxed">
                <li><strong class="text-white">Navegación y Búsqueda:</strong> Utiliza el mapa arrastrando con el ratón o el dedo. En la barra superior, usa la Lupa para buscar proyectos específicos por nombre, o utiliza el filtro de "Consultor" para ver únicamente tu carga de trabajo.</li>
                <li><strong class="text-white">Gestión de Tareas:</strong> Haz clic en cualquier proyecto que tengas asignado para abrir su tarjeta. Al hacer clic en la casilla de una tarea pendiente, esta cambiará a color naranja (<span class="text-[#ff9f0a] font-bold">⏳ En Validación</span>). Esto notificará automáticamente a tus supervisores para que auditen tu trabajo. Si te equivocaste, haz clic de nuevo para cancelar el envío.</li>
                <li><strong class="text-white">Enlaces Rápidos (Drive e Invgate):</strong> Dentro de la tarjeta de tu proyecto, si el equipo configuró enlaces, verás los botones <strong class="text-[#0071e3]">📁 Drive</strong> o <strong class="text-[#30d158]">🎫 Invgate</strong> para abrir directamente la documentación o el ticket oficial en una pestaña nueva sin perder tu trabajo.</li>
                <li><strong class="text-white">Alertas (Campanita):</strong> Revisa la campana (🔔) en la parte superior derecha. El sistema te notificará automáticamente si te han asignado tareas nuevas o si alguno de tus proyectos está próximo a vencer o ya venció (<span class="text-[#ff453a]">🚨</span>).</li>
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
                        reason: `Nuevo proyecto asignado`,
                        users: pConsArray
                    });
                } else if (canSeeAll) {
                    myAlerts.push({ 
                        id: p.id, name: p.name || 'Sin nombre', pType, parentName: pParent, 
                        alertType: 'info', icon: '📦',
                        reason: `Proyecto sin iniciar`,
                        users: pConsArray
                    });
                }
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
        
        if(myAlerts.length > 0) {
            if (badge) {
                badge.textContent = myAlerts.length;
                badge.classList.remove('hidden');
            }
            
            if (container) {
                container.innerHTML = myAlerts.map(a => {
                    const isDanger = a.alertType === 'danger';
                    const isWarning = a.alertType === 'warning';
                    const colorClassText = isDanger ? 'text-[#ff453a]' : (isWarning ? 'text-[#ff9f0a]' : 'text-brand-accent');
                    const colorClassBg = isDanger ? 'bg-[#ff453a]/10' : (isWarning ? 'bg-[#ff9f0a]/10' : 'bg-brand-accent/10');
                    const colorClassBorder = isDanger ? 'border-[#ff453a]/30' : (isWarning ? 'border-[#ff9f0a]/30' : 'border-brand-accent/30');
                    const colorClassBadgeBg = isDanger ? 'bg-[#ff453a]/20' : (isWarning ? 'bg-[#ff9f0a]/20' : 'bg-brand-accent/20');
                    
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
    
    function generateJointGradient(consultantNames) {
      if (!consultantNames || consultantNames.length === 0) return '#48484a';
      if (consultantNames.length === 1) return consultants[consultantNames[0]] ? consultants[consultantNames[0]].color : '#48484a';
      const validColors = consultantNames.map(name => consultants[name] ? consultants[name].color : null).filter(c => c);
      if (validColors.length === 0) return '#48484a';
      if (validColors.length === 1) return validColors[0];
      const gradId = `grad-${validColors.map(c => c.replace('#','')).join('-')}`;
      if (!document.getElementById(gradId) && svgDefs) {
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', gradId); linearGradient.setAttribute('x1', '0%'); linearGradient.setAttribute('y1', '0%'); linearGradient.setAttribute('x2', '100%'); linearGradient.setAttribute('y2', '100%');
        validColors.forEach((color, i) => { const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop'); stop.setAttribute('offset', `${(i / (validColors.length - 1)) * 100}%`); stop.setAttribute('stop-color', color); linearGradient.appendChild(stop); });
        svgDefs.appendChild(linearGradient);
      }
      return `url(#${gradId})`;
    }

    window.addProjectNote = function(source) {
        if (currentUserRole === 'Lector') return;
        if (!currentSelection.id) return;
        const input = document.getElementById(source === 'info' ? 'infoNoteInput' : 'editNotes');
        if (!input) return;
        const noteText = input.value.trim();
        if (!noteText) return;

        let item = getSelectedItem();
        if (item) {
            // Retrocompatibilidad: convierte texto viejo a bloque de foro
            if (typeof item.notes === 'string') {
                const oldNote = item.notes.trim();
                item.notes = [];
                if (oldNote) item.notes.push({ id: 'n_legacy', text: oldNote, by: 'Sistema/Anterior', date: new Date().toLocaleString('es-MX', {hour12:false}) });
            }
            if (!Array.isArray(item.notes)) item.notes = [];
            
            const newNoteId = 'n_' + Date.now();
            item.notes.push({ id: newNoteId, text: noteText, by: localAuthor, date: new Date().toLocaleString('es-MX', {hour12:false}) });
            input.value = '';
            
            logActivity(item.id, item.name, 'Añadió un comentario al foro', localAuthor);
            window.saveData(false);
            window.renderNotesHistory(item.notes, 'editNotesHistory');
            window.renderNotesHistory(item.notes, 'infoNotes');
        }
    };

    window.renderNotesHistory = function(notesData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let arr = [];
        if (typeof notesData === 'string') { if (notesData.trim()) arr = [{ id: 'legacy', text: notesData, by: 'Sistema', date: '' }]; } 
        else if (Array.isArray(notesData)) { arr = notesData; }

        if (arr.length === 0) { container.classList.add('hidden'); return; }
        
        const isSupremo = currentUserRole === 'Supremo';
        
        container.classList.remove('hidden');
        container.innerHTML = arr.map(n => {
            const col = consultants[n.by] ? consultants[n.by].color : '#8e8e93';
            // Renderiza botón de basura SOLO para Supremo y SOLO en el panel de edición
            const delBtn = (isSupremo && containerId === 'editNotesHistory') ? `<button type="button" onclick="deleteProjectNote('${n.id}')" class="text-gray-500 hover:text-[#ff453a] transition p-1 ml-auto" title="Forzar borrado (Supremo)"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : `<span class="text-[8px] text-gray-500 ml-auto">${escapeHtml(n.date || '')}</span>`;
            const dateDisplay = (isSupremo && containerId === 'editNotesHistory') ? `<span class="text-[8px] text-gray-500 mr-2">${escapeHtml(n.date || '')}</span>` : '';

            return `<div class="flex flex-col gap-1 bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner group">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_${col}]" style="background-color: ${col}"></span>
                    <span class="text-[10px] font-bold text-white tracking-wide">${escapeHtml(n.by)}</span>
                    ${dateDisplay}
                    ${delBtn}
                </div>
                <p class="text-xs text-gray-300 pl-4 whitespace-pre-wrap">${escapeHtml(n.text)}</p>
            </div>`;
        }).join('');
        setTimeout(() => container.scrollTop = container.scrollHeight, 50);
    };

    window.deleteProjectNote = function(noteId) {
        if (currentUserRole !== 'Supremo') return; // Seguridad estricta
        let item = getSelectedItem();
        if (item && Array.isArray(item.notes)) {
            const noteToDelete = item.notes.find(n => n.id === noteId);
            if (noteToDelete) {
                item.notes = item.notes.filter(n => n.id !== noteId);
                // Auditoría: Registra que un Supremo intervino y de quién era el mensaje
                logActivity(item.id, item.name, `Forzó borrado de comentario de ${noteToDelete.by}`, localAuthor);
                window.saveData(false);
                window.renderNotesHistory(item.notes, 'editNotesHistory');
            }
        }
    };

    window.ensureDomReferences = function() { svgElem = document.getElementById('mindmapCanvas'); canvasGroup = document.getElementById('canvasGroup'); svgDefs = document.getElementById('svgDefs'); }
    
    window.updateCanvasTransform = function() {
        if(!canvasGroup) return; 
        const limit = 4000; translateX = Math.max(-limit, Math.min(limit, translateX)); translateY = Math.max(-limit, Math.min(limit, translateY));
        
        // FIX MAESTRO: Forzamos el transform nativo de SVG en vez del de CSS.
        // Esto recalcula el área sólida del mapa y permite dar clic sin importar qué tan a la orilla esté.
        canvasGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
        if(svgElem) svgElem.style.overflow = 'visible';
    }

    let animationFrameId = null;
    const ws = document.getElementById('workspace');
    if(ws) {
        ws.addEventListener('touchstart', (e) => {
            if(e.target.closest('.interactive-node') || isDrawerOpen || isPriorityDrawerOpen || isAlertsDrawerOpen || e.target.closest('#infoCard')) return;
            if(e.touches.length === 1) { 
                isPanning = true; 
                startX = e.touches[0].clientX - translateX; 
                startY = e.touches[0].clientY - translateY; 
                ws.classList.add('is-panning');
            } else if (e.touches.length===2) { 
                isPanning = false; 
                initialPinchDistance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); 
            }
        }, {passive: true});
        ws.addEventListener('touchmove', (e) => {
            if(e.target.closest('#infoCard') || isDrawerOpen || isPriorityDrawerOpen || isAlertsDrawerOpen) return;
            if (e.touches.length === 1 && isPanning) { 
                translateX = e.touches[0].clientX - startX; 
                translateY = e.touches[0].clientY - startY; 
                if(!animationFrameId) { animationFrameId = requestAnimationFrame(() => { window.updateCanvasTransform(); animationFrameId = null; }); }
            } else if (e.touches.length===2) { 
                const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); 
                if(initialPinchDistance) { 
                    const delta = (currentDist - initialPinchDistance)*0.005; 
                    window.zoomCanvas(delta, (e.touches[0].clientX+e.touches[1].clientX)/2, (e.touches[0].clientY+e.touches[1].clientY)/2); 
                    initialPinchDistance = currentDist; 
                } 
            }
        }, {passive: true});
        ws.addEventListener('touchend', () => { 
            isPanning = false; 
            initialPinchDistance = null; 
            ws.classList.remove('is-panning');
        });
        ws.addEventListener('mousedown', (e) => { 
            if(e.target.closest('.interactive-node') || e.target.closest('#infoCard') || isDrawerOpen || isPriorityDrawerOpen || isAlertsDrawerOpen) return; 
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
            if(isDrawerOpen || isPriorityDrawerOpen || isAlertsDrawerOpen || e.target.closest('#infoCard')) return; 
            e.preventDefault(); 
            window.zoomCanvas(-e.deltaY * 0.001, e.clientX, e.clientY); 
        }, {passive: false});
    }

    window.zoomCanvas = function(delta, mx = window.innerWidth/2, my = window.innerHeight/2) {
      if(!svgElem) window.ensureDomReferences();
      const newScale = Math.min(Math.max(0.1, 2.5), scale + delta);
      const rect = svgElem.getBoundingClientRect(); const x = mx - rect.left, y = my - rect.top;
      translateX = x - (x - translateX) * (newScale / scale); translateY = y - (y - translateY) * (newScale / scale);
      scale = newScale; window.updateCanvasTransform();
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
            if (!document.getElementById('infoCard').classList.contains('hidden')) availableHeight -= 350;
        }
        
        const targetScale = 1.05; // Acercamiento óptimo
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
            const padding = window.innerWidth < 640 ? 20 : 60; // Reducido drásticamente el padding
            
            // Calculamos la escala ideal para que el mapa ocupe toda la pantalla
            const sX = (rect.width - padding*2) / bbox.width;
            const sY = (rect.height - padding*2) / bbox.height;
            
            // Incrementamos significativamente el tope máximo de escala (zoom out)
            // de 0.95 a 1.25 para asegurar que los elementos se vean grandes y legibles.
            scale = Math.min(sX, sY, 1.25);
            
            // Si después del cálculo matemático la escala sigue siendo muy pequeña (alejada)
            // por la forma del BBox, forzamos un mínimo de zoom.
            if(window.innerWidth >= 768 && scale < 0.85) {
                scale = 0.85;
            }
            
            translateX = (rect.width / 2) - ((bbox.x + bbox.width / 2) * scale); 
            translateY = (rect.height / 2) - ((bbox.y + bbox.height / 2) * scale);
        } catch(e) { 
            translateX = rect.width / 2; 
            translateY = rect.height / 2; 
            scale = window.innerWidth < 640 ? 0.8 : 1.1; 
        }
        window.updateCanvasTransform();
    }

    window.toggleConfigDrawer = function() { isDrawerOpen ? window.closeConfigDrawer() : window.openConfigDrawer(); }
    window.openConfigDrawer = function() { if (isPriorityDrawerOpen) window.closePriorityDrawer(); if(isAlertsDrawerOpen) window.toggleAlertsDrawer(); document.getElementById('configDrawer').classList.remove('translate-x-full'); isDrawerOpen = true; window.populateGlobalEditSelector(); }
    window.closeConfigDrawer = function() { document.getElementById('configDrawer').classList.add('translate-x-full'); isDrawerOpen = false; }
    window.togglePriorityDrawer = function() { isPriorityDrawerOpen ? window.closePriorityDrawer() : window.openPriorityDrawer(); }
    window.openPriorityDrawer = function() { if(isDrawerOpen) window.closeConfigDrawer(); if(isAlertsDrawerOpen) window.toggleAlertsDrawer(); document.getElementById('priorityDrawer').classList.remove('translate-x-full'); isPriorityDrawerOpen = true; window.renderPriorityDrawer(); }
    window.closePriorityDrawer = function() { document.getElementById('priorityDrawer').classList.add('translate-x-full'); isPriorityDrawerOpen = false; }
    window.openFastCreateProject = function() { window.openConfigDrawer(); window.switchTab('new'); window.setCreateType('project'); setTimeout(() => document.getElementById('newProjName').focus(), 300); }
    
    window.switchTab = function(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => { el.classList.remove('bg-white/10','text-white','shadow-sm','text-gray-400'); el.classList.add('text-gray-400'); });
      document.getElementById(`tab-${tabId}`).classList.remove('hidden');
      const btn = document.getElementById(`tabBtn-${tabId}`); btn.classList.remove('text-gray-400'); btn.classList.add('bg-white/10','text-white','shadow-sm');
      if(tabId === 'edit') window.populateGlobalEditSelector(); if(tabId === 'new') window.populateNewProjectLocationSelect(); if(tabId === 'dashboard') window.renderDashboard();
    }

    window.setCreateType = function(type) {
       currentCreateType = type; const btnP = document.getElementById('btnCreateTypeProject'), btnM = document.getElementById('btnCreateTypeModule'), formP = document.getElementById('createProjectForm'), formM = document.getElementById('createModuleForm');
       if(type === 'project') { btnP.classList.add('bg-white/10','text-white'); btnP.classList.remove('text-gray-400','border-transparent'); btnM.classList.remove('bg-white/10','text-white'); btnM.classList.add('text-gray-400','border-transparent'); formP.classList.remove('hidden'); formM.classList.add('hidden'); } 
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
    window.handleFilterChange = function() { activeFilterConsultant = document.getElementById('consultantFilter').value; activeFilterStatus = document.getElementById('statusFilter').value; window.renderMindMap(); window.closeInfoCardSafe(); if(isPriorityDrawerOpen) window.renderPriorityDrawer(); }

    function hasUnvalidatedNA(prefix) { return globalDocs.some(d => { const na = document.getElementById(`${prefix}Na${d.id}`), val = document.getElementById(`${prefix}NaValidated${d.id}`); return (na && na.checked && val && val.value !== "true"); }); }
    window.closeInfoCardSafe = function() { if(hasUnvalidatedNA('quick')) { window.showToast("⚠️ Tienes N/A sin validar.", true); return; } document.getElementById('infoCard').classList.add('opacity-0'); setTimeout(() => document.getElementById('infoCard').classList.add('hidden'), 400); }

    
    // === LÓGICA DE TAREA GLOBAL ===
    window.openGlobalTaskModal = function() {
        if (isDrawerOpen) window.closeConfigDrawer();
        if (isPriorityDrawerOpen) window.closePriorityDrawer();
        if (isAlertsDrawerOpen) window.toggleAlertsDrawer();
        
        const projSelect = document.getElementById('gtProject');
        projSelect.innerHTML = '<option value="" class="bg-black text-gray-400">-- Ninguno (Tarea General) --</option>';
        appData.directProjects.forEach(p => {
            projSelect.innerHTML += `<option value="direct-project|${p.id}" class="bg-black text-white">⚡ ${escapeHtml(p.name)}</option>`;
        });
        appData.modules.forEach(m => {
            (m.projects||[]).forEach(p => {
                projSelect.innerHTML += `<option value="project|${p.id}" class="bg-black text-white">📦 ${escapeHtml(p.name)} (${escapeHtml(m.name)})</option>`;
            });
        });
        
        const assSelect = document.getElementById('gtAssignee');
        assSelect.innerHTML = '<option value="" class="bg-black text-gray-400">-- Nadie --</option>';
        Object.keys(consultants).filter(k => consultants[k].role !== 'Lector').sort().forEach(c => {
            assSelect.innerHTML += `<option value="${escapeHtml(c)}" class="bg-black text-white">${escapeHtml(c)}</option>`;
        });
        
        document.getElementById('gtDescription').value = '';
        document.getElementById('gtDate').value = '';
        
        document.getElementById('globalTaskModal').classList.remove('hidden');
        setTimeout(() => document.getElementById('globalTaskModal').classList.remove('opacity-0'), 10);
    }

    window.closeGlobalTaskModal = function() {
        document.getElementById('globalTaskModal').classList.add('opacity-0');
        setTimeout(() => document.getElementById('globalTaskModal').classList.add('hidden'), 400);
    }

    window.saveGlobalTask = function() { if (currentUserRole === 'Lector') return;
        const projVal = document.getElementById('gtProject').value;
        const text = document.getElementById('gtDescription').value.trim();
        const assignee = document.getElementById('gtAssignee').value;
        const deadline = document.getElementById('gtDate').value;
        
        if(!text) {
            window.showToast("La descripción es obligatoria", true);
            return;
        }
        
        const now = new Date();
        const assignDate = now.toLocaleDateString('es-MX');
        const assignTime = now.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
        
        if(!projVal) {
            appData.globalTasks = appData.globalTasks || [];
            appData.globalTasks.push({ id: 'gt_'+Date.now(), text, deadline, assignee, assignedBy: localAuthor, assignDate, assignTime, done: false });
            logActivity('global', 'General', `Asignó tarea general a ${assignee || 'equipo'}`, localAuthor);
            window.saveData(true);
            window.closeGlobalTaskModal();
            window.renderAlerts();
            return;
        }
        
        const parts = projVal.split('|');
        const pType = parts[0];
        const pId = parts[1];
        let item = null;
        if (pType === 'direct-project') {
            item = appData.directProjects.find(p => p.id === pId);
        } else {
            appData.modules.forEach(m => {
                const p = (m.projects||[]).find(proj => proj.id === pId);
                if(p) item = p;
            });
        }
        
        if(item) {
            item.tasks = item.tasks || [];
            item.tasks.push({ id: 't_'+Date.now(), text, deadline, assignee, assignedBy: localAuthor, assignDate, assignTime, done: false });
            logActivity(item.id, item.name, `Asignó tarea a ${assignee || 'equipo'}`, localAuthor);
            window.saveData(true);
            window.closeGlobalTaskModal();
            window.renderAlerts(); 
            if(currentSelection.id === item.id) {
                window.renderTasksQuick(item);
            }
        }
    }
    
    window.completeGlobalTask = function(taskId) {
        window.openTaskFeedbackModal(taskId, 'global');
    };
    window.validateGlobalTask = function(taskId, approve) {
        if(!appData.globalTasks) return;
        const t = appData.globalTasks.find(x => x.id === taskId);
        if(t) {
            t.done = approve ? true : false;
            logActivity('global', 'General', approve ? `Aprobó tarea general: ${t.text}` : `Rechazó tarea general: ${t.text}`, localAuthor);
            window.saveData(false);
            window.renderAlerts();
        }
    };
    window.validateProjectTask = function(pType, pId, taskId, approve) {
        let item = null;
        if (pType === 'direct-project') { item = appData.directProjects.find(p => p.id === pId); } 
        else { appData.modules.forEach(m => { const p = (m.projects||[]).find(proj => proj.id === pId); if(p) item = p; }); }
        if (item && item.tasks) {
            const t = item.tasks.find(x => x.id === taskId);
            if(t) {
                t.done = approve ? true : false;
                logActivity(item.id, item.name, approve ? `Aprobó tarea: ${t.text}` : `Rechazó tarea: ${t.text}`, localAuthor);
                window.saveData(false);
                window.renderAlerts();
                if(currentSelection.id === item.id) window.renderTasksQuick(item);
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
            logActivity(item.id, item.name, 'Agregó nueva tarea', localAuthor); window.saveData(false); window.renderTasksQuick(item);
        }
    };

    window.toggleQuickTask = function(taskId) {
        let item = getSelectedItem();
        if(item && item.tasks) {
            const t = item.tasks.find(x => x.id === taskId);
            if(t) {
                const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
                if (t.done === true) {
                    // Desmarcar
                    if (isSuper) {
                        t.done = false;
                        delete t.feedback;
                        logActivity(item.id, item.name, 'Desmarcó una tarea', localAuthor); 
                        window.saveData(false); window.renderTasksQuick(item); window.renderAlerts();
                    }
                } else if (t.done === 'pending') {
                    // Supervisor aprueba o Consultor cancela envío
                    if (isSuper) {
                        t.done = true;
                        logActivity(item.id, item.name, 'Validó una tarea', localAuthor); 
                        window.saveData(false); window.renderTasksQuick(item); window.renderAlerts();
                    } else {
                        t.done = false;
                        delete t.feedback;
                        logActivity(item.id, item.name, 'Canceló envío a validación', localAuthor); 
                        window.saveData(false); window.renderTasksQuick(item); window.renderAlerts();
                    }
                } else {
                    // Completar / Enviar a validar (abre modal)
                    // If unchecked -> check/pending
                    // Instead of doing it directly, open feedback modal
                    window.openTaskFeedbackModal(taskId, 'project', item.id);
                    // The UI checkbox will temporarily toggle, but we will handle the state inside the modal submit.
                    // To prevent UI mismatch if user cancels modal, we re-render immediately.
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
            c.innerHTML = '<p class="text-[10px] text-gray-500 italic">No hay tareas específicas.</p>'; 
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
                    <div class="flex items-center gap-2 mt-1.5">
                        ${t.deadline ? `<span class="text-[9px] ${dateColor}">📅 ${t.deadline}</span>` : ''}
                        ${t.assignee ? `<span class="text-[8px] bg-white/10 text-gray-300 border border-white/10 px-1.5 py-0.5 rounded shadow-inner truncate max-w-[100px]">👤 ${escapeHtml(t.assignee)}</span>` : ''}
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

    window.saveEditChanges = function() { if (currentUserRole === 'Lector') return;
      if (!currentSelection.id) return; if(hasUnvalidatedNA('edit')) { window.showToast("⚠️ N/A sin validar.", true); return; }
      const newName = document.getElementById('editName').value.trim(); if (!newName) return;
      const { type, id } = currentSelection; let item = null;
      if (type === 'core') { appData.core.name = newName; logActivity('core', newName, 'Renombró el núcleo central', localAuthor); } 
      else if (type === 'direct-hub') { appData.directHub.name = newName; appData.directHub.color = document.getElementById('editModuleColor').value; logActivity('hub', newName, 'Editó el agrupador principal', localAuthor); } 
      else if (type === 'module') { item = appData.modules.find(m => m.id === id); if (item) { item.name = newName; item.color = document.getElementById('editModuleColor').value; logActivity(item.id, item.name, 'Editó diseño del módulo', localAuthor); } } 
      else {
        if (type === 'direct-project') item = appData.directProjects.find(p => p.id === id); else appData.modules.forEach(m => { const p = (m.projects || []).find(proj => proj.id === id); if (p) item = p; });
        if (item) {
          const oldStatus = item.status; const oldProg = item.progress;
          item.name = newName; item.priority = parseFloat(document.getElementById('editPriority').value || 1); 
          item.driveLink = document.getElementById('editDriveLink').value.trim(); 
          item.invgateLink = document.getElementById('editInvgateLink').value.trim(); 
          item.status = document.getElementById('editStatus').value; item.deadline = document.getElementById('editDeadline').value; 
          item.clientDeliveryDate = document.getElementById('editDeliveryDate').value; item.clientReturnDate = document.getElementById('editReturnDate').value; 
          item.progress = parseInt(document.getElementById('editProgress').value);
          item.docs = {}; globalDocs.forEach(d => { item.docs[d.id] = { checked: document.getElementById(`editDoc${d.id}`)?.checked||false, obs: document.getElementById(`editObs${d.id}`)?.value||'', na: document.getElementById(`editNa${d.id}`)?.checked||false, naValidated: document.getElementById(`editNaValidated${d.id}`)?.value==="true" }; });
          item.consultants = Array.from(document.querySelectorAll('.editProjCons-chk:checked')).map(cb => cb.value);
          
          if(oldStatus !== item.status) logActivity(item.id, item.name, `Actualizó estado a [${item.status}]`, localAuthor);
          else if(oldProg !== item.progress) logActivity(item.id, item.name, `Actualizó avance a ${item.progress}%`, localAuthor);
          else logActivity(item.id, item.name, `Editó detalles internos`, localAuthor);
        }
      }
      window.saveData(true); window.populateGlobalEditSelector(); window.updateDatalist(); window.renderMindMap(); window.showInfoCard(type, id);
    }

    window.showInfoCard = function(type, id) {
      const card = document.getElementById('infoCard'); let item = null;
      document.getElementById('infoQuickEditContainer').classList.add('hidden'); document.getElementById('btnFullEditInfoCard').classList.add('hidden');
      document.getElementById('infoNotesContainer').classList.add('hidden');
      card.dataset.notesSig = '';
      document.getElementById('infoRelativeTime').classList.add('hidden');
      document.getElementById('infoDriveBtn').classList.add('hidden');
      document.getElementById('infoInvgateBtn').classList.add('hidden');
      
      if (type === 'core') { item = appData.core; document.getElementById('infoType').textContent = 'NÚCLEO'; document.getElementById('infoMetricLabel').textContent = 'MÓDULOS'; document.getElementById('infoMetricValue').innerHTML = appData.modules.length; } else if (type === 'direct-hub' || type === 'module') { item = type === 'module' ? appData.modules.find(m => m.id === id) : appData.directHub; document.getElementById('infoType').textContent = type==='module'?'MÓDULO':'AGRUPADOR'; document.getElementById('infoMetricLabel').textContent = 'PROYECTOS'; document.getElementById('infoMetricValue').innerHTML = (item.projects||appData.directProjects).length; } else {
        if (type === 'direct-project') item = appData.directProjects.find(p => p.id === id); else appData.modules.forEach(m => { const p = (m.projects||[]).find(proj => proj.id === id); if(p) item = p; }); if(!item) return;
        document.getElementById('infoType').textContent = 'PROYECTO';
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
        } else {
            notesCont.classList.add('hidden');
        }
        // Un borrador escrito en un proyecto nunca debe aparecer en otro
        const noteInput = document.getElementById('infoNoteInput');
        if (noteInput && noteInput.dataset.pid !== String(id)) { noteInput.value = ''; noteInput.dataset.pid = String(id); }
      }
      document.getElementById('infoTitle').textContent = item.name; card.classList.remove('hidden'); setTimeout(() => card.classList.remove('opacity-0'), 10);
    }
    window.editFromInfoCard = function() { window.closeInfoCardSafe(); if(currentSelection.id) window.selectNodeAndOpenConfig(currentSelection.type, currentSelection.id); }

    window.selectNode = function(type, id) {
      currentSelection = { type, id };
      document.getElementById('editEmptyState').classList.add('hidden'); document.getElementById('editFormArea').classList.remove('hidden');
      document.getElementById('editProjectFields').classList.add('hidden'); document.getElementById('editModuleFields').classList.add('hidden');
      let item = null, isProject = false, isModule = false;
      const btnDel = document.getElementById('btnDeleteElement');
      
      if (type === 'core') { item = appData.core; document.getElementById('editTypeBadge').textContent='NÚCLEO'; if(btnDel) btnDel.classList.add('hidden'); } else if (type === 'direct-hub') { item = appData.directHub; isModule = true; document.getElementById('editTypeBadge').textContent='AGRUPADOR'; if(btnDel) btnDel.classList.add('hidden'); } else if (type === 'module') { item = appData.modules.find(m => m.id === id); isModule = true; document.getElementById('editTypeBadge').textContent='MÓDULO'; if(btnDel && currentUserRole==='Supremo') btnDel.classList.remove('hidden'); } else if (type === 'direct-project') { item = appData.directProjects.find(p => p.id === id); isProject = true; document.getElementById('editTypeBadge').textContent='PROYECTO'; if(btnDel && currentUserRole==='Supremo') btnDel.classList.remove('hidden'); } else if (type === 'project') { appData.modules.forEach(m => { const p = (m.projects || []).find(proj => proj.id === id); if (p) item = p; }); isProject = true; document.getElementById('editTypeBadge').textContent='PROYECTO'; if(btnDel && currentUserRole==='Supremo') btnDel.classList.remove('hidden'); }
      if (!item) return; document.getElementById('editName').value = item.name;
      if (isProject) {
        document.getElementById('editProjectFields').classList.remove('hidden'); document.getElementById('editPriority').value = item.priority; document.getElementById('editNotes').value = ''; document.getElementById('editStatus').value = item.status || 'Pendiente';
        window.renderNotesHistory(item.notes, 'editNotesHistory'); document.getElementById('editDeadline').value = item.deadline || '';
        document.getElementById('editDriveLink').value = item.driveLink || '';
        document.getElementById('editInvgateLink').value = item.invgateLink || '';
        document.getElementById('editDeliveryDate').value = item.clientDeliveryDate || ''; document.getElementById('editReturnDate').value = item.clientReturnDate || ''; 
        window.renderDocChecklists('edit', item.docs||{}); window.calculateEditProgress(); document.getElementById('editSlider').value = item.progress || 0;
        const consultNames = getProjectConsultants(item); document.querySelectorAll('.editProjCons-chk').forEach(chk => chk.checked = consultNames.includes(chk.value));
      }
      if (isModule) { document.getElementById('editModuleFields').classList.remove('hidden'); document.getElementById('editModuleColor').value = item.color || '#0071e3'; document.getElementById('editModuleColorHex').value = item.color || '#0071e3'; document.getElementById('editModuleColor').onchange = function() { document.getElementById('editModuleColorHex').value = this.value; }; }
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
       else if(itemToDelete.category === 'consultant') { const name = itemToDelete.id; appData.directProjects.forEach(p => { p.consultants = p.consultants.filter(c => c !== name); }); appData.modules.forEach(m => { (m.projects || []).forEach(p => { p.consultants = p.consultants.filter(c => c !== name); }); }); delete consultants[name]; if (activeFilterConsultant === name) activeFilterConsultant = 'ALL'; if (localAuthor === name) { localAuthor = ''; localStorage.removeItem('sicom_author'); location.reload(); } window.saveData(true); window.populateConsultantSelects(); window.renderRegisteredConsultantsList(); if(isDrawerOpen && currentSelection.id) window.handleGlobalEditSelectionChange(); window.renderMindMap(); }
       window.closeDeleteModal(); window.updateDatalist();
    }

    window.openRenameModal = function(oldName) { document.getElementById('renameOldName').value = oldName; document.getElementById('renameNewName').value = oldName; document.getElementById('renameModal').classList.remove('hidden'); setTimeout(() => document.getElementById('renameModal').classList.remove('opacity-0'), 10); }
    window.closeRenameModal = function() { document.getElementById('renameModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('renameModal').classList.add('hidden'), 400); }
    window.confirmRenameConsultant = function() { if (currentUserRole === 'Lector') return;
        const oldName = document.getElementById('renameOldName').value; const newName = document.getElementById('renameNewName').value.trim();
        if (!newName || newName === oldName || consultants[newName]) { window.closeRenameModal(); return; }
        consultants[newName] = consultants[oldName]; delete consultants[oldName];
        appData.directProjects.forEach(p => { let idx = p.consultants.indexOf(oldName); if (idx !== -1) p.consultants[idx] = newName; }); appData.modules.forEach(m => { (m.projects || []).forEach(p => { let idx = p.consultants.indexOf(oldName); if (idx !== -1) p.consultants[idx] = newName; }); });
        if (activeFilterConsultant === oldName) activeFilterConsultant = newName; if (localAuthor === oldName) { localAuthor = newName; localStorage.setItem('sicom_author', newName); }
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

    window.createNewProject = function() { if (currentUserRole === 'Lector') return;
       const name = document.getElementById('newProjName').value.trim(); if(!name) return;
       const loc = document.getElementById('newProjLocation').value, prio = parseFloat(document.getElementById('newProjPriority').value||1), cons = Array.from(document.querySelectorAll('.newProjCons-chk:checked')).map(cb => cb.value);
       const driveLink = document.getElementById('newProjDrive').value.trim();
       const invgateLink = document.getElementById('newProjInvgate').value.trim();
       const np = { id: 'p_'+Date.now(), name, priority: prio, consultants: cons, notes: '', driveLink, invgateLink, tasks: [], status: 'No Iniciado', deadline: '', progress: 0, docs: {}, clientDeliveryDate: "", clientReturnDate: "" };
       if (loc === 'DIRECT') appData.directProjects.push(np); else { const mod = appData.modules.find(m => m.id === loc); if(mod) { if(!mod.projects) mod.projects=[]; mod.projects.push(np); } }
       document.getElementById('newProjName').value = ''; document.getElementById('newProjDrive').value = ''; document.getElementById('newProjInvgate').value = ''; document.querySelectorAll('.newProjCons-chk').forEach(cb => cb.checked = false); logActivity(np.id, np.name, 'Creó el proyecto', localAuthor); window.saveData(true); window.populateGlobalEditSelector(); window.updateDatalist(); window.renderMindMap();
    }
    window.createNewModule = function() { if (currentUserRole === 'Lector') return; const name = document.getElementById('newModName').value.trim(); if(!name) return; const newId = 'm_'+Date.now(); appData.modules.push({ id: newId, name, color: document.getElementById('newModColor').value, projects: [] }); document.getElementById('newModName').value = ''; logActivity(newId, name, 'Creó el módulo', localAuthor); window.saveData(true); window.populateGlobalEditSelector(); window.populateNewProjectLocationSelect(); window.updateDatalist(); window.renderMindMap(); }
    
    window.registerConsultant = function() { if (currentUserRole === 'Lector') return; 
        const n = document.getElementById('newConsultantName').value.trim();
        const c = document.getElementById('newConsultantColor').value; 
        const r = document.getElementById('newConsultantRole').value; 
        if (!n || consultants[n]) return; 
        consultants[n] = { color: c, role: r }; 
        document.getElementById('newConsultantName').value = ''; 
        window.saveData(false); window.populateConsultantSelects(); window.renderRegisteredConsultantsList(); window.renderMindMap(); 
    }
    window.handleUpdateExistingConsultantColor = function(name, newColor) { if(consultants[name]) { consultants[name].color = newColor; window.saveData(false); window.renderRegisteredConsultantsList(); window.renderMindMap(); if(currentSelection.id) window.showInfoCard(currentSelection.type, currentSelection.id); } }
    window.updateConsultantRole = function(name, newRole) { if(consultants[name]) { consultants[name].role = newRole; window.saveData(false); } }
    window.requestDeleteConsultant = function(name) { itemToDelete = { category: 'consultant', id: name }; document.getElementById('deleteModalTitle').textContent = `¿Eliminar a ${name}?`; document.getElementById('deleteConfirmModal').classList.remove('hidden'); setTimeout(() => document.getElementById('deleteConfirmModal').classList.remove('opacity-0'), 10); }

    window.populateGlobalEditSelector = function() {
      const s = document.getElementById('globalEditSelector'); if(!s) return;
      s.innerHTML = `<option value="" class="bg-black text-gray-400">-- Selecciona en el mapa --</option><optgroup label="Núcleo" class="text-white bg-white/10"><option value="core|sicom" class="bg-black text-white">🌐 SICOM</option><option value="direct-hub|hub-direct" class="bg-black text-white">⚡ ${escapeHtml(appData.directHub.name)}</option></optgroup>`;
      if(appData.directProjects.length > 0) s.innerHTML += `<optgroup label="Directos" class="bg-black text-gray-300">${appData.directProjects.map(p => `<option value="direct-project|${p.id}" class="bg-black text-white">└ ${escapeHtml(p.name)}</option>`).join('')}</optgroup>`;
      appData.modules.forEach(m => { s.innerHTML += `<option value="module|${m.id}" class="bg-white/10 text-white font-bold">📦 ${escapeHtml(m.name)}</option>`; if(m.projects?.length > 0) s.innerHTML += `<optgroup label="Proyectos: ${escapeHtml(m.name)}" class="bg-black text-gray-400">${m.projects.map(p => `<option value="project|${p.id}" class="bg-black text-white">└ ${escapeHtml(p.name)}</option>`).join('')}</optgroup>`; });
      if(currentSelection.id) s.value = `${currentSelection.type}|${currentSelection.id}`;
    }
    window.populateNewProjectLocationSelect = function() { const s = document.getElementById('newProjLocation'); if(!s) return; s.innerHTML = `<option value="DIRECT" class="bg-black text-white">⚡ Directo (${escapeHtml(appData.directHub.name)})</option>` + appData.modules.map(m => `<option value="${m.id}" class="bg-black text-white">📦 Módulo: ${escapeHtml(m.name)}</option>`).join(''); }
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
                          <input type="color" value="${cData.color}" onchange="handleUpdateExistingConsultantColor('${escapeHtml(n)}', this.value)" class="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0">
                       </div>
                       <div class="flex-1 min-w-0"><span class="text-sm text-white font-bold block truncate">${escapeHtml(n)}</span><span class="text-[10px] text-gray-500 font-medium tracking-widest block mt-0.5">${cnt} proyectos</span></div>
                       <button onclick="openPasswordModal('${escapeHtml(n)}')" class="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition shrink-0" title="Cambiar Contraseña"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg></button>
                       <button onclick="openRenameModal('${escapeHtml(n)}')" class="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition shrink-0" title="Renombrar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                       <button onclick="requestDeleteConsultant('${escapeHtml(n)}')" class="p-2 hover:bg-[#ff453a]/20 text-gray-400 hover:text-[#ff453a] rounded-xl transition shrink-0"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                   </div>
                   <div class="flex items-center gap-2 border-t border-white/5 pt-2 mt-1">
                       <span class="text-[9px] text-gray-500 uppercase tracking-widest">Rol asignado:</span>
                       <select onchange="updateConsultantRole('${escapeHtml(n)}', this.value)" class="bg-transparent text-[10px] text-gray-300 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer">
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
        const all = activeFilterConsultant === 'ALL' ? Object.keys(consultants) : [activeFilterConsultant];
        let has = false; let h = '';
        all.forEach(cons => {
            const cData = consultants[cons]; let projs = [];
            appData.directProjects.forEach(p => { if(getProjectConsultants(p).includes(cons) && (activeFilterStatus==='ALL' || p.status===activeFilterStatus)) projs.push({...p, parentName: appData.directHub.name, pType: 'direct-project'}); });
            appData.modules.forEach(m => { (m.projects||[]).forEach(p => { if(getProjectConsultants(p).includes(cons) && (activeFilterStatus==='ALL' || p.status===activeFilterStatus)) projs.push({...p, parentName: m.name, pType: 'project'}); }); });
            if(projs.length === 0) return; has = true; projs.sort((a,b) => parseFloat(a.priority||0) - parseFloat(b.priority||0));
            h += `<div class="mb-8"><h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style="color: ${cData.color}"><span class="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_${cData.color}] border border-white/20" style="background-color: ${cData.color}"></span>${escapeHtml(cons)}<span class="bg-white/10 text-white px-2.5 py-0.5 rounded-full text-[9px] ml-auto border border-white/5 shadow-inner">${projs.length} proy.</span></h3><div class="space-y-4">`;
            projs.forEach(p => {
                let sIco = p.status==='En Progreso'?'🚀':(p.status==='Completado'?'✅':(p.status==='No Iniciado'?'⏸️':'⏳'));
                let over = false; if(p.deadline && p.status !== 'Completado') { const [y,m,d] = p.deadline.split('-'); if(new Date(y,m-1,d) < new Date(new Date().setHours(0,0,0,0))) over=true; }
                h += `<div class="bg-black/40 border border-white/10 rounded-[1.5rem] p-5 flex gap-4 hover:bg-white/10 transition-all cursor-pointer group shadow-inner ${over?'border-[#ff453a]/50 bg-[#ff453a]/5':''}" onclick="window.selectNodeAndOpenConfig('${p.pType}', '${p.id}')"><div class="text-xl font-bold mt-1.5 shrink-0 w-8 text-center drop-shadow-md" style="color: ${cData.color}">*${p.priority}</div><div class="flex-1 min-w-0"><h4 class="text-sm font-semibold text-white leading-tight group-hover:text-brand-accent transition truncate">${over?'⚠️ ':''}${escapeHtml(p.name)}</h4><p class="text-[9px] text-gray-500 mt-1.5 uppercase tracking-widest truncate">└ ${escapeHtml(p.parentName)}</p><div class="flex flex-wrap items-center gap-2 mt-3"><span class="text-[9px] font-bold px-2.5 py-1 rounded-md bg-black/40 border border-white/5 text-gray-300 shadow-inner">${sIco} ${p.status||'Pendiente'} (${p.progress||0}%)</span>${p.deadline ? `<span class="text-[9px] font-mono font-bold text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20 px-2.5 py-1 rounded-md">📅 ${p.deadline}</span>` : ''}</div></div></div>`;
            }); h += `</div></div>`;
        });
        c.innerHTML = has ? h : `<div class="flex flex-col items-center justify-center py-20 text-center opacity-50"><svg class="w-16 h-16 text-gray-500 mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg><p class="text-gray-300 text-sm font-medium tracking-wide">No hay coincidencias.</p></div>`;
    }

    window.renderMindMap = function() {
      if (!canvasGroup) return; canvasGroup.innerHTML = '';
      const q = activeSearchQuery.toLowerCase();
      
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

          if (activeFilterModule !== 'ALL' && p._modId !== activeFilterModule) return false;
          if (activeFilterStatus !== 'ALL' && p.status !== activeFilterStatus) return false;
          if (activeFilterConsultant !== 'ALL' && !getProjectConsultants(p).includes(activeFilterConsultant)) return false;
          
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

          if (q && !p.name.toLowerCase().includes(q) && !getProjectConsultants(p).some(c => c.toLowerCase().includes(q))) return false;
          return true;
      };

      const isDefaultState = !isFocusMode && activeFilterModule === 'ALL' && activeFilterStatus === 'ALL' && activeFilterConsultant === 'ALL' && activeFilterUrgency === 'ALL' && activeFilterPriority === 'ALL' && activeFilterBottleneck === 'ALL' && !q;
      
      const visDir = appData.directProjects || [];
      const activeMods = appData.modules || [];
      
      let lNodes = [], rNodes = [], lSlots = 0, rSlots = 0;
      
      // PARCHE: Contabilizamos el peso real del Agrupador Directo para balancear el mapa
      const directLen = Math.max(1, visDir.length);
      lNodes.push({ type: 'direct-hub', item: appData.directHub, projects: visDir });
      lSlots += directLen; 
      
      activeMods.forEach(m => {
          const modData = { type: 'module', item: m, projects: m.projects || [] };
          const pLength = Math.max(1, modData.projects.length);
          if (lSlots <= rSlots) { lNodes.push(modData); lSlots += pLength; } 
          else { rNodes.push(modData); rSlots += pLength; }
      });

      const slotH = 75, mOffX = 380, pOffX = 840; 
      function procSide(nodes, totalSlots, isLeft) {
          const mx = isLeft ? -mOffX : mOffX, px = isLeft ? -pOffX : pOffX;
          let cy = -(totalSlots * slotH / 2) + (slotH / 2);
          nodes.forEach(n => {
              const pCount = n.projects.length; let sy = cy, ey = cy;
              if (pCount > 0) {
                  n.projects.forEach(p => { 
                      const cN = getProjectConsultants(p); const col = generateJointGradient(cN);
                      
                      // EL FIX ESTÁ AQUÍ: Inyectamos explícitamente y bloqueamos las propiedades del render
                      // asegurándonos de que JavaScript asigne variables nuevas por ciclo y no por referencia global.
                      const strictType = n.type === 'direct-hub' ? 'direct-project' : 'project';
                      p._modId = n.type === 'direct-hub' ? 'direct-hub' : n.item.id;
                      p._renderData = { x: px, y: cy, color: col, type: strictType, realId: p.id }; 
                      ey = cy; cy += slotH;
                  });
              } else { ey = cy; cy += slotH; }
              const my = (sy + ey) / 2; n._renderData = { x: mx, y: my, isLeft };

              // PARCHE: Evaluación estricta de módulos y ghosting de líneas
              const modMatches = isDefaultState || n.projects.some(p => isFiltered(p)) || (q !== '' && n.item.name && n.item.name.toLowerCase().includes(q));
              const lineOpacity = modMatches ? '1' : '0.15';

              const pC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              pC.setAttribute('d', `M ${isLeft?-60:60} 0 C ${isLeft?-120:120} 0, ${isLeft?mx+170:mx-170} ${my}, ${isLeft?mx+110:mx-110} ${my}`);
              pC.setAttribute('fill', 'none'); pC.setAttribute('stroke', n.type==='direct-hub'?n.item.color:'rgba(255,255,255,0.15)'); pC.setAttribute('stroke-width', '2');
              pC.setAttribute('opacity', lineOpacity);
              canvasGroup.appendChild(pC);

              if (pCount > 0) n.projects.forEach(p => {
                  const pMatches = isDefaultState || isFiltered(p);
                  const pP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  const solidColor = (getProjectConsultants(p).length > 0 && consultants[getProjectConsultants(p)[0]]) ? consultants[getProjectConsultants(p)[0]].color : '#48484a';
                  const startX = isLeft ? mx - 110 : mx + 110;
                  const endX = isLeft ? p._renderData.x + 160 : p._renderData.x - 160;
                  const cp1X = isLeft ? mx - 50 : mx + 50;
                  const cp2X = isLeft ? endX + 80 : endX - 80;
                  
                  pP.setAttribute('d', `M ${startX} ${my} C ${cp1X} ${my}, ${cp2X} ${p._renderData.y}, ${endX} ${p._renderData.y}`);
                  pP.setAttribute('fill', 'none'); pP.setAttribute('stroke', solidColor); pP.setAttribute('stroke-width', '1.5'); 
                  pP.setAttribute('opacity', pMatches ? '0.7' : '0.1'); 
                  canvasGroup.appendChild(pP);
              });
          });
      }
      procSide(lNodes, lSlots, true); procSide(rNodes, rSlots, false);

      [...lNodes, ...rNodes].forEach(n => {
        n.projects.forEach(p => {
          // EL FIX CONTINÚA AQUÍ: Extraemos strictType y realId
          const { x, y, color, type: strictType, realId } = p._renderData; 
          const isSel = currentSelection.id === realId;
          const pMatches = isDefaultState || isFiltered(p);
          
          let isOver = false; if(p.deadline && p.status !== 'Completado') { const [dy, dm, dd] = p.deadline.split('-'); if(new Date(dy, dm-1, dd) < new Date(new Date().setHours(0,0,0,0))) isOver = true; }
          const sCol = p.status==='En Progreso'?'#0071e3':(p.status==='Completado'?'#30d158':(p.status==='No Iniciado'?'#48484a':'#8e8e93'));

          // 1. CREACIÓN DEL CONTENEDOR PRINCIPAL
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', `translate(${x - 160}, ${y - 28})`);
          
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
              if(isOver) g.setAttribute('filter', 'drop-shadow(0 0 8px rgba(255, 69, 58, 0.4))'); // Indicador estático de vencido
          }

          // 2. CONGELAMIENTO LÉXICO (Cierre Perfecto)
          const currentNodeType = strictType;
          const currentNodeId = realId;
          
          g.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              try { window.selectNode(currentNodeType, currentNodeId); } catch (err) { console.error('No se pudo abrir el proyecto:', p, err); window.showToast('⚠️ No se pudo abrir "' + p.name + '": ' + err.message, true); }
          }, false);

           // El false es vital para evitar el bubbling inverso

          // 3. CAPA VISUAL (Sin interferencia de eventos)
          const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          r.setAttribute('width', '320'); r.setAttribute('height', '56'); r.setAttribute('rx', '16'); 
          r.setAttribute('fill', 'rgba(20, 20, 22, 0.9)'); 
          r.setAttribute('stroke', isOver ? '#ff453a' : color); 
          r.setAttribute('stroke-width', isSel ? '2' : '1');
          r.style.pointerEvents = 'none'; // Los hijos no deben capturar clics
          if(isSel || (!isDefaultState && pMatches)) r.setAttribute('filter', 'url(#glow)'); 
          g.appendChild(r);

          const sC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          sC.setAttribute('cx', '18'); sC.setAttribute('cy', '18'); sC.setAttribute('r', '4'); sC.setAttribute('fill', sCol); 
          sC.style.pointerEvents = 'none';
          if(pMatches) sC.setAttribute('filter', `drop-shadow(0 0 5px ${sCol})`); 
          g.appendChild(sC);

          const nT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          nT.setAttribute('x', '34'); nT.setAttribute('y', '22'); nT.setAttribute('fill', '#ffffff'); nT.classList.add('svg-text', 'svg-text-bold');
          let fullText = (isOver ? "⚠️ " : "") + p.name;
          let fontSize = fullText.length > 35 ? 9 : (fullText.length > 25 ? 10 : 12);
          nT.setAttribute('style', `font-size: ${fontSize}px; pointer-events: none;`);
          nT.textContent = fullText.length > 55 ? fullText.substring(0, 52)+'...' : fullText;
          g.appendChild(nT);
          
          if(p.progress > 0) {
             const pbBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); pbBg.setAttribute('x', '34'); pbBg.setAttribute('y', '38'); pbBg.setAttribute('width', '265'); pbBg.setAttribute('height', '3'); pbBg.setAttribute('rx', '1.5'); pbBg.setAttribute('fill', 'rgba(255,255,255,0.1)'); pbBg.style.pointerEvents = 'none'; g.appendChild(pbBg);
             const pb = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); pb.setAttribute('x', '34'); pb.setAttribute('y', '38'); pb.setAttribute('width', 265 * (p.progress/100)); pb.setAttribute('height', '3'); pb.setAttribute('rx', '1.5'); pb.setAttribute('fill', sCol); pb.style.pointerEvents = 'none';
             if(pMatches) pb.setAttribute('filter', `drop-shadow(0 0 3px ${sCol})`); g.appendChild(pb);
          }

          // 4. CAPA DE INTERCEPCIÓN (Caja invisible final)
          const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          hitBox.setAttribute('width', '320'); hitBox.setAttribute('height', '56'); hitBox.setAttribute('rx', '16');
          hitBox.setAttribute('fill', 'transparent');
          hitBox.style.cursor = 'pointer';
          g.appendChild(hitBox);
          
          canvasGroup.appendChild(g);
        });

        // PARCHE: Evaluación estricta de módulos y ghosting de bloques
        const modMatches = isDefaultState || n.projects.some(p => isFiltered(p)) || (q !== '' && n.item.name && n.item.name.toLowerCase().includes(q));
        const { x, y } = n._renderData, isSel = currentSelection.id === n.item.id;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${x - 110}, ${y - 24})`);
        
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
        const currentModId = n.item.id;
        
        g.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.selectNode(currentModType, currentModId);
        }, false);

        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('width', '220'); r.setAttribute('height', '48'); r.setAttribute('rx', '24'); 
        r.setAttribute('fill', n.type==='direct-hub'?'rgba(0,0,0,0.8)':'rgba(30, 30, 30, 0.9)');
        r.setAttribute('stroke', n.item.color); r.setAttribute('stroke-width', isSel ? '2.5' : '1');
        r.style.pointerEvents = 'none'; // Importante para que no capture clics
        if(n.type==='direct-hub') r.setAttribute('stroke-dasharray', '5,5'); 
        if(isSel || (!isDefaultState && modMatches)) r.setAttribute('filter', 'url(#glow)'); 
        g.appendChild(r);
        
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); 
        t.setAttribute('x', '110'); t.setAttribute('y', '28'); 
        t.setAttribute('fill', '#ffffff'); t.setAttribute('text-anchor', 'middle'); 
        t.classList.add('svg-text', 'svg-text-bold'); 
        t.style.pointerEvents = 'none'; // Importante para que no capture clics
        
        let mFontSize = n.item.name.length > 20 ? 10 : 12;
        t.setAttribute('style', `font-size: ${mFontSize}px; pointer-events: none;`);
        t.textContent = n.item.name; 
        g.appendChild(t);

        // Capa invisible para módulos
        const hitBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hitBox.setAttribute('width', '220'); hitBox.setAttribute('height', '48'); hitBox.setAttribute('rx', '24');
        hitBox.setAttribute('fill', 'transparent');
        hitBox.style.cursor = 'pointer';
        g.appendChild(hitBox);

        canvasGroup.appendChild(g);
      });

      const coreG = document.createElementNS('http://www.w3.org/2000/svg', 'g'); coreG.setAttribute('transform', `translate(-60, -60)`); coreG.classList.add('interactive-node'); coreG.onclick = (e) => { e.stopPropagation(); window.selectNode('core', 'sicom'); };
      const cc = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); cc.setAttribute('cx', '60'); cc.setAttribute('cy', '60'); cc.setAttribute('r', '60'); cc.setAttribute('fill', 'rgba(10, 10, 12, 1)'); cc.setAttribute('stroke', '#0071e3'); cc.setAttribute('stroke-width', '2'); cc.setAttribute('filter', 'url(#glow-intense)'); coreG.appendChild(cc);
      const ct = document.createElementNS('http://www.w3.org/2000/svg', 'text'); ct.setAttribute('x', '60'); ct.setAttribute('y', '65'); ct.setAttribute('fill', 'white'); ct.setAttribute('text-anchor', 'middle'); ct.classList.add('svg-text', 'svg-text-base', 'svg-text-bold'); ct.textContent = 'SICOM'; coreG.appendChild(ct);
      canvasGroup.appendChild(coreG);
      
      if(appData.secondaryCore && appData.secondaryCore.active) {
          const sucomG = document.createElementNS('http://www.w3.org/2000/svg', 'g'); sucomG.setAttribute('transform', `translate(-60, 100)`); sucomG.classList.add('interactive-node');
          const scc = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); scc.setAttribute('cx', '60'); scc.setAttribute('cy', '60'); scc.setAttribute('r', '60'); scc.setAttribute('fill', 'rgba(10, 10, 12, 1)'); scc.setAttribute('stroke', '#ff9f0a'); scc.setAttribute('stroke-width', '2'); scc.setAttribute('stroke-dasharray', '5,5'); sucomG.appendChild(scc);
          const sct = document.createElementNS('http://www.w3.org/2000/svg', 'text'); sct.setAttribute('x', '60'); sct.setAttribute('y', '65'); sct.setAttribute('fill', 'white'); sct.setAttribute('text-anchor', 'middle'); sct.classList.add('svg-text', 'svg-text-base', 'svg-text-bold'); sct.textContent = 'SUCOM'; sucomG.appendChild(sct);
          canvasGroup.appendChild(sucomG);
      }
    };

    window.renderHistory = function() {
        const c = document.getElementById('historyListContainer'), e = document.getElementById('historyEmptyState');
        if(!appData.history || appData.history.length === 0) { c.innerHTML = ''; e.classList.remove('hidden'); return; }
        
        const dateInput = document.getElementById('historyDateFilter');
        let selectedDateStr = dateInput ? dateInput.value : ''; // Format yyyy-mm-dd
        
        // Si no hay fecha seleccionada en el input, por defecto mostramos el día de hoy (formato dd/mm/yyyy o similar que viene en timestamp)
        // El timestamp es de la forma "6/10/2026, 22:47:07" o "DD/MM/YYYY, HH:MM:SS" (toLocaleDateString('es-MX'))
        let filtered = appData.history.filter(log => {
            if (!log.timestamp) return false;
            // log.timestamp empieza con "D/M/YYYY" o "DD/MM/YYYY"
            const datePart = log.timestamp.split(',')[0].trim(); // "6/10/2026" o "16/10/2026"
            const parts = datePart.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                const logFormatted = `${year}-${month}-${day}`;
                
                if (selectedDateStr) {
                    return logFormatted === selectedDateStr;
                } else {
                    // Por defecto: mostrar solo los del día de hoy
                    const today = new Date();
                    const tDay = String(today.getDate()).padStart(2, '0');
                    const tMonth = String(today.getMonth() + 1).padStart(2, '0');
                    const tYear = today.getFullYear();
                    const todayFormatted = `${tYear}-${tMonth}-${tDay}`;
                    return logFormatted === todayFormatted;
                }
            }
            return false;
        });

        if(filtered.length === 0) { 
            c.innerHTML = ''; 
            e.classList.remove('hidden'); 
            return; 
        }
        
        e.classList.add('hidden');
        c.innerHTML = filtered.map(log => {
            const col = consultants[log.by] ? consultants[log.by].color : '#8e8e93';
            return `<div class="bg-black/30 border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-inner"><div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style="background-color: ${col}"></div><div class="flex justify-between items-start mb-2"><span class="text-[10px] text-gray-500 font-mono tracking-widest pl-1">${log.timestamp}</span><span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/5 uppercase" style="color: ${col}">${escapeHtml(log.by)}</span></div><p class="text-xs font-semibold text-white mb-1 leading-tight pl-1">${escapeHtml(log.projectName)}</p><p class="text-[11px] text-gray-400 pl-1">${escapeHtml(log.action)}</p></div>`}).join('');
    }

    window.renderDashboard = function() {
        let t = 0, c = 0, p = 0, pend = 0, noIni = 0, o = 0, totalProg = 0; let consCounts = {};
        const isOver = (proj) => { if(!proj.deadline || proj.status === 'Completado') return false; const [y,m,d] = proj.deadline.split('-'); return new Date(y, m-1, d) < new Date(new Date().setHours(0,0,0,0)); };
        const tally = (proj) => { t++; totalProg += (proj.progress || 0); if(proj.status === 'Completado') c++; else if(proj.status === 'En Progreso') p++; else if(proj.status === 'No Iniciado') noIni++; else pend++; if(isOver(proj)) o++; getProjectConsultants(proj).forEach(cons => { consCounts[cons] = (consCounts[cons] || 0) + 1; }); };
        appData.directProjects.forEach(tally); appData.modules.forEach(m => (m.projects||[]).forEach(tally));
        
        document.getElementById('dashTotal').textContent = t; document.getElementById('dashCompleted').textContent = c; document.getElementById('dashProgress').textContent = p; document.getElementById('dashOverdue').textContent = o;
        const avg = t > 0 ? Math.round(totalProg / t) : 0; document.getElementById('dashGlobalBar').style.width = `${avg}%`; document.getElementById('dashGlobalText').textContent = `${avg}%`;

        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        if(window.statusChartInstance) window.statusChartInstance.destroy();
        window.statusChartInstance = new Chart(ctxStatus, { type: 'doughnut', data: { labels: ['Completados', 'En Progreso', 'Pendientes', 'No Iniciados'], datasets: [{ data: [c, p, pend, noIni], backgroundColor: ['#30d158', '#0071e3', '#ff9f0a', '#48484a'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8e8e93', font: {size: 10, family: 'Inter'} } } }, cutout: '75%' } });

        const ctxCons = document.getElementById('consultantChart').getContext('2d');
        if(window.consultantChartInstance) window.consultantChartInstance.destroy();
        let cLabels = Object.keys(consCounts).sort((a,b) => consCounts[b] - consCounts[a]), cData = cLabels.map(l => consCounts[l]), cColors = cLabels.map(l => consultants[l] ? consultants[l].color : '#48484a');
        window.consultantChartInstance = new Chart(ctxCons, { type: 'bar', data: { labels: cLabels, datasets: [{ label: 'Proyectos', data: cData, backgroundColor: cColors, borderRadius: 100 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#636366' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#8e8e93', font: {size: 10} }, grid: { display: false } } } } });
    }

    window.exportCSV = function() {
        let csv = "Tipo,Módulo,Proyecto,Estado,Avance(%),Prioridad,Fecha Límite,Envío Propuesta,Autorización,Drive,Invgate,Consultores\n";
        const addRow = (t, m, p) => { csv += `"${t}","${m}","${p.name}","${p.status||'Pendiente'}","${p.progress||0}","${p.priority||1}","${p.deadline||''}","${p.clientDeliveryDate||''}","${p.clientReturnDate||''}","${p.driveLink||''}","${p.invgateLink||''}","${getProjectConsultants(p).join(', ')}"\n`; };
        appData.directProjects.forEach(p => addRow('Directo', appData.directHub.name, p)); appData.modules.forEach(m => (m.projects||[]).forEach(p => addRow('Módulo', m.name, p)));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `sicom_reporte_${new Date().toISOString().slice(0,10)}.csv`; link.click();
    }
    
    window.exportData = function() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ appData, consultants, globalDocs }));
      const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `sicom_backup_${new Date().toISOString().slice(0,10)}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    }

    window.importData = function(event) {
      const file = event.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if(imported.appData && imported.consultants) {
            appData = imported.appData; consultants = imported.consultants; if(imported.globalDocs) globalDocs = imported.globalDocs;
            ensureDataStructure(); window.saveData(true); refreshUI();
          }
        } catch (err) { window.showToast("Error al importar", true); }
      };
      reader.readAsText(file);
    }

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
        
        appData.dailyTasks = appData.dailyTasks || [];
        appData.dailyTasks.push({ id: 'dt_' + Date.now(), text: text, assignee: assignee, assignedBy: localAuthor, date: new Date().toLocaleDateString('es-MX'), done: false });
        input.value = ''; logActivity('daily', 'Actividades Diarias', `Añadió tarea diaria para ${assignee}`, localAuthor);
        window.saveData(false);
    };

window.toggleDailyTask = function(taskId) {
        if (currentUserRole === 'Lector') return;
        const t = appData.dailyTasks.find(x => x.id === taskId);
        if (t) {
            const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';
            const isAssigner = t.assignedBy === localAuthor;
            
            if (t.done === true) {
                if (isSuper || isAssigner) {
                    t.done = false; delete t.feedback;
                    logActivity('daily', 'Actividades Diarias', `Desmarcó tarea: ${t.text}`, localAuthor);
                    window.saveData(false);
                }
            } else if (t.done === 'pending') {
                if (isSuper || isAssigner) {
                    t.done = true;
                    logActivity('daily', 'Actividades Diarias', `Validó tarea: ${t.text}`, localAuthor);
                    window.saveData(false);
                } else if (t.assignee === localAuthor) {
                    t.done = false; delete t.feedback;
                    logActivity('daily', 'Actividades Diarias', `Canceló envío a validación`, localAuthor);
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
        if (currentUserRole !== 'Supremo' && currentUserRole !== 'Supervisor' && t.assignedBy !== localAuthor) { 
            window.showToast("Solo quien asignó la tarea puede eliminarla", true); return; 
        }
        appData.dailyTasks = appData.dailyTasks.filter(x => x.id !== taskId); 
        logActivity('daily', 'Actividades Diarias', `Borró tarea: ${t.text}`, localAuthor);
        window.saveData(false);
    };

window.renderDailyTasks = function() {
        const container = document.getElementById('dailyTasksContainer'); 
        const badge = document.getElementById('dailyAlertsBadge');
        
        let alertCount = 0;
        const isSuper = currentUserRole === 'Supremo' || currentUserRole === 'Supervisor';

        if (!appData.dailyTasks || appData.dailyTasks.length === 0) { 
            if(badge) badge.classList.add('hidden');
            if(container) container.innerHTML = `<div class="text-center py-20 opacity-50"><span class="text-4xl block mb-4">📋</span><p class="text-xs text-gray-300">No hay actividades diarias registradas.</p></div>`; 
            return; 
        }
        
        let grouped = {};
        appData.dailyTasks.forEach(t => {
            // Lógica para agrupar
            if (isSuper || t.assignee === localAuthor || t.assignedBy === localAuthor) {
                if (!grouped[t.assignee]) grouped[t.assignee] = [];
                grouped[t.assignee].push(t);
            }
            
            // Lógica matemática para el Badge de Alerta
            if (t.done === 'pending' && (isSuper || t.assignedBy === localAuthor)) {
                alertCount++; // Validaciones pendientes para los jefes
            } else if (t.done === false && t.assignee === localAuthor) {
                alertCount++; // Tareas nuevas/pendientes para el consultor
            }
        });

        if(badge) {
            if (alertCount > 0) {
                badge.textContent = alertCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        if (Object.keys(grouped).length === 0) { 
            if(container) container.innerHTML = `<div class="text-center py-20 opacity-50"><span class="text-4xl block mb-4">📋</span><p class="text-xs text-gray-300">No tienes actividades asignadas hoy.</p></div>`; 
            return; 
        }

        const sorted = Object.keys(grouped).sort((a, b) => { if (a === localAuthor) return -1; if (b === localAuthor) return 1; return a.localeCompare(b); });
        
        if(container) container.innerHTML = sorted.map(cons => {
            const tasks = grouped[cons].sort((a, b) => b.id.localeCompare(a.id));
            const cData = consultants[cons] || { color: '#8e8e93' };
            const pCount = tasks.filter(t => t.done !== true).length;
            
            return `<div class="mb-2">
                <h3 class="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style="color: ${cData.color}">
                    <span class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_${cData.color}] border border-white/20" style="background-color: ${cData.color}"></span>${escapeHtml(cons)}
                    ${pCount === 0 ? `<span class="bg-[#30d158]/20 text-[#30d158] px-2 py-0.5 rounded border border-[#30d158]/30 shadow-inner ml-auto">Al Día ✅</span>` : `<span class="bg-white/10 text-white px-2 py-0.5 rounded border border-white/5 shadow-inner ml-auto">${pCount} pdtes.</span>`}
                </h3>
                <div class="space-y-2">
                ${tasks.map(t => {
                    const isMyTask = t.assignee === localAuthor;
                    const isAssigner = t.assignedBy === localAuthor;
                    const canEdit = isSuper || isMyTask || isAssigner;
                    const canDel = isSuper || isAssigner;
                    
                    let statusBadge = '';
                    let boxUI = '';
                    
                    if (t.done === 'pending') {
                        statusBadge = `<span class="text-[8px] bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 px-1.5 py-0.5 rounded font-bold uppercase shadow-inner ml-2 shrink-0 mt-0.5">⏳ En Validación</span>`;
                        if (isSuper || isAssigner) {
                            boxUI = `<button onclick="toggleDailyTask('${t.id}')" class="h-4 w-4 rounded border border-[#ff9f0a] bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center shrink-0 mt-0.5 hover:bg-[#ff9f0a]/40 transition" title="Haz clic para aprobar"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></button>`;
                        } else {
                            boxUI = `<input type="checkbox" checked onchange="toggleDailyTask('${t.id}')" class="rounded border-[#ff9f0a] bg-[#ff9f0a]/20 text-[#ff9f0a] focus:ring-[#ff9f0a] h-4 w-4 shrink-0 cursor-pointer mt-0.5" title="Click para cancelar envío">`;
                        }
                    } else if (t.done === true) {
                        statusBadge = `<span class="text-[8px] bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 px-1.5 py-0.5 rounded font-bold uppercase shadow-inner ml-2 shrink-0 mt-0.5">✅ Validada</span>`;
                        boxUI = `<input type="checkbox" checked onchange="toggleDailyTask('${t.id}')" class="rounded border-[#30d158] bg-[#30d158]/20 text-[#30d158] focus:ring-[#30d158] h-4 w-4 shrink-0 cursor-pointer mt-0.5" ${!(isSuper || isAssigner) ? 'disabled class="... opacity-50 cursor-not-allowed"' : ''}>`;
                    } else {
                        boxUI = `<input type="checkbox" onchange="toggleDailyTask('${t.id}')" class="rounded border-white/20 bg-black/40 text-brand-accent focus:ring-brand-accent h-4 w-4 shrink-0 mt-0.5 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}" ${!canEdit ? 'disabled' : ''}>`;
                    }

                    return `
                    <div class="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5 group transition ${t.done === true ? 'opacity-50' : (t.done === 'pending' ? 'border-[#ff9f0a]/30 bg-[#ff9f0a]/5' : 'shadow-inner')}">
                        ${boxUI}
                        <div class="flex flex-col flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                                <span class="text-xs text-white break-words pr-2 ${t.done === true ? 'line-through text-gray-400' : ''}">${escapeHtml(t.text)}</span>${statusBadge}
                            </div>
                            <div class="flex items-center gap-2 mt-1.5">
                                <span class="text-[9px] text-gray-500">📅 ${escapeHtml(t.date)}</span>${t.assignedBy !== t.assignee ? `<span class="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded shadow-inner">De: ${escapeHtml(t.assignedBy)}</span>` : ''}
                            </div>
                            ${t.feedback ? `<div class="mt-2 text-[9px] text-gray-300 bg-black/60 border border-white/10 p-2 rounded shadow-inner">💬 <b>Evidencia:</b> ${escapeHtml(t.feedback)}</div>` : ''}
                        </div>
                        ${canDel ? `<button onclick="deleteDailyTask('${t.id}')" class="text-gray-500 hover:text-[#ff453a] opacity-0 group-hover:opacity-100 transition p-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : ''}
                    </div>`
                }).join('')}
                </div></div>`;
        }).join('');
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

    window.populateAdvFilters = function() {
        const modSel = document.getElementById('advFilterModule');
        const consSel = document.getElementById('advFilterConsultant');
        if(!modSel || !consSel) return;
        
        modSel.innerHTML = `<option value="ALL">Todos los módulos</option><option value="direct-hub">⚡ ${escapeHtml(appData.directHub.name)}</option>` + appData.modules.map(m => `<option value="${m.id}">📦 ${escapeHtml(m.name)}</option>`).join('');
        modSel.value = activeFilterModule;
        
        const allC = Object.keys(consultants).filter(k => consultants[k].role !== 'Lector');
        consSel.innerHTML = `<option value="ALL">Todos los consultores</option>` + allC.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
        consSel.value = activeFilterConsultant;
        
        document.getElementById('advFilterStatus').value = activeFilterStatus;
        document.getElementById('advFilterUrgency').value = activeFilterUrgency;
        document.getElementById('advFilterPriority').value = activeFilterPriority;
        document.getElementById('advFilterBottleneck').value = activeFilterBottleneck;
    };

    window.handleAdvFilter = function() {
        activeFilterModule = document.getElementById('advFilterModule').value;
        activeFilterConsultant = document.getElementById('advFilterConsultant').value;
        activeFilterStatus = document.getElementById('advFilterStatus').value;
        activeFilterUrgency = document.getElementById('advFilterUrgency').value;
        activeFilterPriority = document.getElementById('advFilterPriority').value;
        activeFilterBottleneck = document.getElementById('advFilterBottleneck').value;
        
        let c = 0;
        if(activeFilterModule !== 'ALL') c++; if(activeFilterConsultant !== 'ALL') c++; if(activeFilterStatus !== 'ALL') c++;
        if(activeFilterUrgency !== 'ALL') c++; if(activeFilterPriority !== 'ALL') c++; if(activeFilterBottleneck !== 'ALL') c++;
        const badge = document.getElementById('activeFiltersBadge');
        if(c > 0) { badge.textContent = c; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); }
        
        if(isFocusMode) window.toggleFocusMode(); // Si usas filtros manuales, apaga el enfoque
        else window.renderMindMap();
    };

    window.resetAdvFilters = function() {
        activeFilterModule = 'ALL'; activeFilterConsultant = 'ALL'; activeFilterStatus = 'ALL';
        activeFilterUrgency = 'ALL'; activeFilterPriority = 'ALL'; activeFilterBottleneck = 'ALL';
        document.getElementById('activeFiltersBadge').classList.add('hidden');
        
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

    initData();
