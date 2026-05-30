import { state, saveLocal, syncToCloud } from '../db.js';
import { formatDateToDMY, parseCalories } from '../utils/helpers.js';
import { updateProgressChart, updateMaxChart, updateFoodCharts } from './charts.js';
import { renderFoodList } from './nutrition.js';

// Убираем строку с импортом updateFoodCharts из nutrition.js
// и используем напрямую из charts.js

export function renderWorkoutHistory() {
    let container = document.getElementById('workout-history-container');
    if (!container) return;
    if (!state.trainingHistory.length) { container.innerHTML = '<div style="padding:20px;text-align:center;">Нет тренировок</div>'; return; }
    let grouped = {};
    state.trainingHistory.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(w => { if (!grouped[w.date]) grouped[w.date] = []; grouped[w.date].push(w); });
    container.innerHTML = '';
    for (let date in grouped) {
        let totalCal = grouped[date].reduce((s, w) => s + (w.calories || 0), 0);
        let isOpen = state.openWorkoutDays.has(date);
        let dayDiv = document.createElement('div'); dayDiv.className = 'history-day';
        dayDiv.innerHTML = `<div class="history-day-header" data-date="${date}"><span>📅 ${formatDateToDMY(date)}</span><div class="action-buttons"><span style="font-size:12px;">🔥 ${totalCal} ккал</span><button class="round-edit edit-calories-btn" data-date="${date}">✏️</button><button class="round-delete delete-day-btn" data-date="${date}">🗑</button><span class="small-plus" style="padding:2px 8px;">${isOpen ? '▼' : '▶'}</span></div></div><div class="workout-history-content ${isOpen ? 'active' : ''}" data-date="${date}"></div>`;
        container.appendChild(dayDiv);
        const contentDiv = dayDiv.querySelector('.workout-history-content');
        grouped[date].forEach(w => {
            let setsHtml = '<div class="history-sets-list">';
            w.sets.forEach(s => { setsHtml += `<div class="history-set-item">▪️ ${s.weightType === 'bw' ? 'Свой вес' : s.weight + ' кг'} × ${s.reps} (💪${s.effort})</div>`; });
            setsHtml += '</div>';
            let exDiv = document.createElement('div'); exDiv.className = 'history-exercise';
            exDiv.innerHTML = `<div style="display:flex;justify-content:space-between;"><b>🏋️ ${w.exercise}</b><button class="round-delete delete-workout-btn" data-id="${w.id}">🗑</button></div>${setsHtml}`;
            contentDiv.appendChild(exDiv);
        });
    }
    
    setupWorkoutHistoryListeners();
}

function setupWorkoutHistoryListeners() {
    document.querySelectorAll('.history-day-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-calories-btn') || e.target.classList.contains('delete-day-btn') || e.target.classList.contains('delete-workout-btn')) return;
            const date = header.dataset.date;
            if (state.openWorkoutDays.has(date)) state.openWorkoutDays.delete(date);
            else state.openWorkoutDays.add(date);
            renderWorkoutHistory();
        });
    });
    
    document.querySelectorAll('.edit-calories-btn').forEach(btn => btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        const totalCal = state.trainingHistory.filter(w => w.date === date).reduce((s, w) => s + (w.calories || 0), 0);
        state.currentEditWorkoutId = date;
        document.getElementById('editCaloriesInput').value = totalCal || '';
        document.getElementById('editCaloriesModal').style.display = 'flex';
    }));
    
    document.querySelectorAll('.delete-day-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        if (confirm(`Удалить все тренировки за ${formatDateToDMY(date)}?`)) {
            state.trainingHistory = state.trainingHistory.filter(w => w.date !== date);
            renderWorkoutHistory(); updateProgressChart(); updateMaxChart(); saveLocal(); await syncToCloud();
        }
    }));
    
    document.querySelectorAll('.delete-workout-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (confirm('Удалить это упражнение из истории?')) {
            state.trainingHistory = state.trainingHistory.filter(w => w.id !== id);
            renderWorkoutHistory(); updateProgressChart(); updateMaxChart(); saveLocal(); await syncToCloud();
        }
    }));
}

export function setupCaloriesEdit() {
    document.getElementById('saveCaloriesBtn')?.addEventListener('click', async () => {
        if (state.currentEditWorkoutId) {
            const newCalories = parseCalories(document.getElementById('editCaloriesInput').value);
            state.trainingHistory = state.trainingHistory.map(w => { if (w.date === state.currentEditWorkoutId) return { ...w, calories: newCalories }; return w; });
            renderWorkoutHistory(); saveLocal(); await syncToCloud();
            document.getElementById('editCaloriesModal').style.display = 'none';
            state.currentEditWorkoutId = null;
        }
    });
}

export function renderFoodHistory() {
    let container = document.getElementById('food-history-container');
    if (!container) return;
    if (!state.foodEntries.length) { container.innerHTML = '<div style="padding:20px;text-align:center;">Нет записей о еде</div>'; return; }
    let grouped = {};
    state.foodEntries.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(f => { if (!grouped[f.date]) grouped[f.date] = []; grouped[f.date].push(f); });
    container.innerHTML = '';
    for (let date in grouped) {
        let totalKcal = grouped[date].reduce((s, f) => s + f.kcal, 0);
        let isOpen = state.openFoodDays.has(date);
        let dayDiv = document.createElement('div');
        dayDiv.className = 'history-day history-food-day';
        dayDiv.innerHTML = `<div class="history-food-header" data-date="${date}"><span>📅 ${formatDateToDMY(date)}</span><div class="action-buttons"><span style="font-size:12px;">🔥 ${Math.round(totalKcal)} ккал</span><button class="round-delete delete-food-day" data-date="${date}">🗑</button><span class="small-plus" style="padding:2px 8px;">${isOpen ? '▼' : '▶'}</span></div></div><div class="food-history-content ${isOpen ? 'active' : ''}" data-date="${date}"></div>`;
        container.appendChild(dayDiv);
        const contentDiv = dayDiv.querySelector('.food-history-content');
        grouped[date].forEach(f => {
            let fDiv = document.createElement('div');
            fDiv.className = 'history-exercise';
            fDiv.innerHTML = `<div style="display:flex;justify-content:space-between;"><b>🍽 ${f.name}</b><button class="round-delete delete-food" data-id="${f.id}">🗑</button></div><div class="history-set-item">${f.weight}г | Б:${f.protein.toFixed(1)} Ж:${f.fat.toFixed(1)} У:${f.carbs.toFixed(1)} — ${Math.round(f.kcal)} ккал</div>`;
            contentDiv.appendChild(fDiv);
        });
    }
    
    document.querySelectorAll('.history-food-header').forEach(header => { header.addEventListener('click', (e) => { if (e.target.classList.contains('delete-food-day')) return; const date = header.dataset.date; if (state.openFoodDays.has(date)) state.openFoodDays.delete(date); else state.openFoodDays.add(date); renderFoodHistory(); }); });
    document.querySelectorAll('.delete-food-day').forEach(btn => { btn.addEventListener('click', async (e) => { e.stopPropagation(); let date = btn.dataset.date; if (confirm(`Удалить все записи о еде за ${formatDateToDMY(date)}?`)) { state.foodEntries = state.foodEntries.filter(f => f.date !== date); state.openFoodDays.delete(date); renderFoodHistory(); renderFoodList(); updateFoodCharts(); saveLocal(); await syncToCloud(); } }); });
    document.querySelectorAll('.delete-food').forEach(btn => btn.addEventListener('click', async (e) => { e.stopPropagation(); let id = parseInt(btn.dataset.id); state.foodEntries = state.foodEntries.filter(f => f.id !== id); renderFoodHistory(); renderFoodList(); updateFoodCharts(); saveLocal(); await syncToCloud(); }));
}ы
