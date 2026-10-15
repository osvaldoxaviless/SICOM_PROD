// Test unitario de las funciones clave de Layout Multicolumna, Colapso y Filtros Multiselección
const assert = require('assert');

// 1. Simulación de cálculo de distribución multicolumna
function calculatePositions(projects, isLeft, slotH = 75, sy = 0) {
    const pCount = projects.length;
    const isMulti = pCount > 6;
    const weight = isMulti ? Math.max(1, Math.ceil(pCount / 2)) : Math.max(1, pCount);
    
    const rendered = [];
    if (pCount <= 6) {
        projects.forEach((p, idx) => {
            const px = isLeft ? -820 : 820;
            const py = sy + idx * slotH;
            rendered.push({ id: p.id, x: px, y: py });
        });
    } else {
        projects.forEach((p, idx) => {
            const colIdx = idx % 2;
            const rowIdx = Math.floor(idx / 2);
            const px = colIdx === 0 ? (isLeft ? -770 : 770) : (isLeft ? -1120 : 1120);
            const py = sy + rowIdx * slotH;
            rendered.push({ id: p.id, x: px, y: py, col: colIdx, row: rowIdx });
        });
    }
    return { isMulti, weight, rendered };
}

// TEST A: Módulo COM con 18 proyectos
const mockProjects18 = Array.from({ length: 18 }, (_, i) => ({ id: `p_${i + 1}`, name: `Proyecto ${i + 1}` }));
const res18 = calculatePositions(mockProjects18, false);
console.log('TEST A (18 proyectos):', {
    isMulti: res18.isMulti,
    weight: res18.weight,
    expectedHeight: res18.weight * 75,
    oldSingleColumnHeight: 18 * 75
});
assert.strictEqual(res18.isMulti, true, 'Debe ser multicolumna');
assert.strictEqual(res18.weight, 9, 'El peso vertical debe ser 9 filas (50% de reducción)');
assert.strictEqual(res18.rendered[0].x, 770, 'Columna 0 interna en x=770');
assert.strictEqual(res18.rendered[1].x, 1120, 'Columna 1 externa en x=1120');
assert.strictEqual(res18.rendered[0].y, res18.rendered[1].y, 'Proyecto 1 y 2 comparten la fila 0');

// TEST B: Módulo pequeño con 4 proyectos
const mockProjects4 = Array.from({ length: 4 }, (_, i) => ({ id: `p_${i + 1}`, name: `Proyecto ${i + 1}` }));
const res4 = calculatePositions(mockProjects4, false);
console.log('TEST B (4 proyectos):', {
    isMulti: res4.isMulti,
    weight: res4.weight
});
assert.strictEqual(res4.isMulti, false, 'No debe ser multicolumna si <= 6');
assert.strictEqual(res4.weight, 4, 'El peso es 4');
assert.strictEqual(res4.rendered[0].x, 820, 'Columna única centrada en x=820');

// 2. Simulación de filtrado multiselección
function isFiltered(p, filters) {
    const { activeFilterConsultants, activeFilterStatuses, activeFilterCompanies } = filters;
    
    // Status
    if (activeFilterStatuses.length > 0 && !activeFilterStatuses.includes('ALL')) {
        if (!activeFilterStatuses.includes(p.status)) return false;
    }
    // Consultant
    if (activeFilterConsultants.length > 0 && !activeFilterConsultants.includes('ALL')) {
        const pCons = p.consultants || [];
        if (!pCons.some(c => activeFilterConsultants.includes(c))) return false;
    }
    // Company
    if (activeFilterCompanies.length > 0 && !activeFilterCompanies.includes('ALL')) {
        const pComps = p.companies || [];
        if (!pComps.some(c => activeFilterCompanies.includes(c))) return false;
    }
    return true;
}

const projOsvaldo = { id: 1, status: 'En Progreso', consultants: ['Osvaldo Avilés'], companies: ['AFR'] };
const projEmmanuel = { id: 2, status: 'Pendiente', consultants: ['Emmanuel Sánchez'], companies: ['AVM'] };
const projOther = { id: 3, status: 'Completado', consultants: ['Erick'], companies: ['TEO'] };

// Caso: Usuario selecciona Osvaldo Y Emmanuel al mismo tiempo
const filtersMultiCons = {
    activeFilterConsultants: ['Osvaldo Avilés', 'Emmanuel Sánchez'],
    activeFilterStatuses: ['ALL'],
    activeFilterCompanies: ['ALL']
};

assert.strictEqual(isFiltered(projOsvaldo, filtersMultiCons), true, 'Proyecto de Osvaldo debe pasar');
assert.strictEqual(isFiltered(projEmmanuel, filtersMultiCons), true, 'Proyecto de Emmanuel debe pasar');
assert.strictEqual(isFiltered(projOther, filtersMultiCons), false, 'Proyecto de Erick NO debe pasar');
console.log('TEST C: Filtro multiselección de consultores (Osvaldo + Emmanuel) OK!');

// Caso: Multiselección de empresas (AFR + AVM)
const filtersMultiComp = {
    activeFilterConsultants: ['ALL'],
    activeFilterStatuses: ['ALL'],
    activeFilterCompanies: ['AFR', 'AVM']
};

assert.strictEqual(isFiltered(projOsvaldo, filtersMultiComp), true, 'AFR debe pasar');
assert.strictEqual(isFiltered(projEmmanuel, filtersMultiComp), true, 'AVM debe pasar');
assert.strictEqual(isFiltered(projOther, filtersMultiComp), false, 'TEO NO debe pasar');
console.log('TEST D: Filtro multiselección de empresas (AFR + AVM) OK!');

// 3. Simulación de Colapso con Auto-Expansión si hay coincidencia de búsqueda/filtro
const collapsedModules = new Set(['mod_com', 'mod_rh']);
function isModuleCollapsed(modId, modProjects, isDefaultState, currentFilters) {
    if (!collapsedModules.has(modId)) return false;
    if (!isDefaultState) {
        const hasMatch = modProjects.some(p => isFiltered(p, currentFilters));
        if (hasMatch) return false; // AUTO-EXPAND!
    }
    return true;
}

// Sin filtro (default): mod_com está colapsado
const modComProjects = [projOsvaldo];
assert.strictEqual(isModuleCollapsed('mod_com', modComProjects, true, { activeFilterConsultants: ['ALL'], activeFilterStatuses: ['ALL'], activeFilterCompanies: ['ALL'] }), true, 'En estado default, debe permanecer colapsado');

// Con filtro activo por "Osvaldo Avilés": mod_com se auto-expande porque tiene el proyecto coincidente
assert.strictEqual(isModuleCollapsed('mod_com', modComProjects, false, filtersMultiCons), false, 'Con filtro activo, se auto-expande automáticamente para mostrar resultados');
console.log('TEST E: Auto-expansión inteligente de módulos colapsados OK!');

console.log('--- TODOS LOS TESTS UNITARIOS PASARON AL 100%! ---');
