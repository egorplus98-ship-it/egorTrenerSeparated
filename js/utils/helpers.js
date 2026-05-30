export function getToday() { 
    return new Date().toISOString().slice(0, 10); 
}

export function formatDateToDMY(d) { 
    if (!d) return ""; 
    let p = d.split('-'); 
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d; 
}

export function parseCalories(input) {
    if (!input || input.toString().trim() === "") return null;
    let str = input.toString().trim();
    
    if (str.includes('+') || str.includes('-')) {
        str = str.replace(/,/g, '.');
        str = str.replace(/[^0-9.+\-]/g, '');
        if (str === "") return null;
        try {
            let result = Function('"use strict"; return (' + str + ')')();
            return Math.round(result);
        } catch(e) { return null; }
    }
    
    str = str.replace(/[^0-9]/g, '');
    let num = parseInt(str);
    return isNaN(num) ? null : num;
}

export function calculate1RM(w, r, e) { 
    return Math.round(w * (1 + r / 30) * (0.7 + (e / 10) * 0.3)); 
}

export function generateRepOptions(s) { 
    let o = ''; 
    for (let i = 1; i <= 50; i++) o += `<option value="${i}" ${s == i ? 'selected' : ''}>${i}</option>`; 
    return o; 
}

export function generateEffortOptions(s) { 
    let o = ''; 
    for (let i = 1; i <= 10; i++) o += `<option value="${i}" ${s == i ? 'selected' : ''}>${i}</option>`; 
    return o; 
}