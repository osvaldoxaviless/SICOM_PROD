const consultants = {
  'Carlos Islas': { color: '#ff453a', role: 'Consultor' },
  'Ricardo Lira': { color: '#ff375f', role: 'Consultor' },
  'Osvaldo Avilés': { color: '#0071e3', role: 'Supremo' }
};

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

console.log('Mention @Carlos Islas:', extractMentionsFromText('Favor de revisar @Carlos Islas'));
console.log('Mention @Rodrigo (unregistered):', extractMentionsFromText('Favor de revisar @Rodrigo'));
