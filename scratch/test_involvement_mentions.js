const fs = require('fs');

global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};
global.escapeHtml = (s) => s;
global.consultants = {
  'Carlos': { color: '#0071e3' },
  'María': { color: '#ff2d55' },
  'Juan': { color: '#30d158' }
};
global.getProjectConsultants = (p) => Array.isArray(p.consultants) ? p.consultants : [];

const extractMentionsFromText = (text) => {
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

const isUserMentionedInText = (text, userName) => {
    if (!text || !userName) return false;
    const escaped = userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`@${escaped}\\b`, 'i');
    return regex.test(text);
};

const isUserInvolvedInProject = (proj, userName) => {
    if (!proj || !userName) return false;
    const u = userName.trim().toLowerCase();
    const cons = getProjectConsultants(proj);
    if (cons.some(c => c && c.trim().toLowerCase() === u)) return true;
    if (Array.isArray(proj.tasks) && proj.tasks.some(t => t.assignee && t.assignee.trim().toLowerCase() === u)) return true;
    return false;
};

const shouldShowProjectForumBadge = (proj, userName, userRole) => {
    if (!proj || !userName) return false;
    if (!Array.isArray(proj.notes) || proj.notes.length === 0) return false;
    const unreadNotes = proj.notes.filter(n => {
        if (!n) return false;
        if (!Array.isArray(n.readBy)) return n.by !== userName;
        return !n.readBy.some(r => (typeof r === 'string' ? r : (r && r.user)) === userName);
    });
    if (unreadNotes.length === 0) return false;
    if (unreadNotes.some(n => isUserMentionedInText(n.text, userName))) return true;
    if (isUserInvolvedInProject(proj, userName)) return true;
    if (userRole === 'Supremo') return unreadNotes.some(n => n.tag === 'bloqueo');
    return false;
};

// Case 1: Carlos is assigned to project P1. Maria writes a note.
const p1 = {
  id: 'p1',
  name: 'Proyecto Alpha',
  consultants: ['Carlos'],
  tasks: [],
  notes: [{ id: 'n1', text: 'Nota de avance', by: 'María', readBy: [] }]
};
console.log('Test 1 (Carlos involved):', shouldShowProjectForumBadge(p1, 'Carlos', 'Consultor') === true ? 'PASS' : 'FAIL');
console.log('Test 2 (Juan NOT involved, no mention):', shouldShowProjectForumBadge(p1, 'Juan', 'Consultor') === false ? 'PASS' : 'FAIL');

// Case 2: Juan is mentioned in note on P1
p1.notes.push({ id: 'n2', text: 'Favor de revisar @Juan los accesos', by: 'María', readBy: [] });
console.log('Test 3 (Juan NOT assigned BUT mentioned):', shouldShowProjectForumBadge(p1, 'Juan', 'Consultor') === true ? 'PASS' : 'FAIL');

// Case 3: Juan confirms reading note n2
p1.notes[1].readBy.push({ user: 'Juan', at: 'today' });
console.log('Test 4 (Juan read mention, note 1 remains unread but he is not assigned to project):', shouldShowProjectForumBadge(p1, 'Juan', 'Consultor') === false ? 'PASS' : 'FAIL');

// Case 4: Supremo sees unread bloqueo even if not assigned
const p2 = {
  id: 'p2',
  name: 'Proyecto Beta',
  consultants: ['Carlos'],
  notes: [{ id: 'n3', text: 'Bloqueo crítico de servidor', by: 'Carlos', tag: 'bloqueo', readBy: [] }]
};
console.log('Test 5 (Supremo sees blocker):', shouldShowProjectForumBadge(p2, 'Director', 'Supremo') === true ? 'PASS' : 'FAIL');
console.log('Test 6 (Juan Consultor does NOT see blocker of unassigned project):', shouldShowProjectForumBadge(p2, 'Juan', 'Consultor') === false ? 'PASS' : 'FAIL');
