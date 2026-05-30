import { state, loadLocal, saveLocal, syncToCloud } from './db.js';
import { setupAuth } from './auth.js';
import { getToday } from './utils/helpers.js';
import { setupUI } from './modules/ui.js';
import { renderExercises, setupWorkoutButtons, setupExerciseManagement } from './modules/workouts.js';
import { renderFoodList, setupNutritionButtons, showWeightModal } from './modules/nutrition.js';
import { updateProgressChart, updateMaxChart, updateFoodCharts, updateWeightChart, setupChartListeners } from './modules/charts.js';
import { renderWorkoutHistory, renderFoodHistory, setupCaloriesEdit } from './modules/history.js';

window.showWeightModal = showWeightModal;

export function renderAll() {
    renderExercises();
    renderFoodList();
    renderWorkoutHistory();
    renderFoodHistory();
    updateProgressChart();
    updateMaxChart();
    updateFoodCharts();
    updateWeightChart();
    updateWeightHistoryList();
}

function updateWeightHistoryList() {
    let container = document.getElementById('weightHistoryList');
    if (!container) return;
    container.innerHTML = '';
    [...state.bodyWeightHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(w => {
        let div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px; border-bottom:1px solid #2a2f40;';
        div.innerHTML = `<span>${formatDateToDMY(w.date)}</span><span>${w.weight} кг</span><button class="round-delete" data-date="${w.date}">✕</button>`;
        container.appendChild(div);
    });
    document.querySelectorAll('#weightHistoryList .round-delete').forEach(btn => btn.addEventListener('click', async () => {
        let d = btn.dataset.date;
        state.bodyWeightHistory = state.bodyWeightHistory.filter(w => w.date !== d);
        updateWeightHistoryList(); updateWeightChart(); saveLocal(); await syncToCloud();
    }));
}

function formatDateToDMY(d) { 
    if (!d) return ""; 
    let p = d.split('-'); 
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d; 
}

document.addEventListener('DOMContentLoaded', () => {
    loadLocal();
    document.getElementById('mainTabs').style.display = 'none';
    document.getElementById('foodDate').value = getToday();
    document.getElementById('workoutDate').value = getToday();
    
    setupAuth();
    setupUI();
    setupWorkoutButtons();
    setupExerciseManagement();
    setupNutritionButtons();
    setupChartListeners();
    setupCaloriesEdit();
    
    document.getElementById('addWeightBtn')?.addEventListener('click', async () => {
        let date = document.getElementById('weightDateInput').value;
        let weight = parseFloat(document.getElementById('weightValueInput').value);
        if (date && weight) {
            let existing = state.bodyWeightHistory.find(w => w.date === date);
            if (existing) existing.weight = weight;
            else state.bodyWeightHistory.push({ date, weight });
            updateWeightHistoryList(); updateWeightChart(); saveLocal(); await syncToCloud();
            document.getElementById('weightValueInput').value = '';
        } else alert('Введите дату и вес');
    });
    
    updateWeightChart();
});
