import { state, loadLocal, saveLocal, syncToCloud } from './db.js';
import { setupAuth } from './auth.js';
import { getToday } from './utils/helpers.js';
import { setupUI, setRenderAll } from './modules/ui.js';
import { renderExercises, setupWorkoutButtons, setupExerciseManagement } from './modules/workouts.js';
import { renderMeals, setupNutritionButtons, showWeightModal } from './modules/nutrition.js';
import { updateProgressChart, updateMaxChart, updateFoodCharts, updateWeightChart, updateTonnageChart, setupChartListeners } from './modules/charts.js';
import { renderWorkoutHistory, renderFoodHistory, setupCaloriesEdit } from './modules/history.js';

window.showWeightModal = showWeightModal;

export function renderAll() {
    renderExercises();
    renderMeals();
    renderWorkoutHistory();
    renderFoodHistory();
    updateProgressChart();
    updateMaxChart();
    updateTonnageChart();
    updateFoodCharts();
    updateWeightChart();
    updateWeightHistoryList();
}

setRenderAll(renderAll);

function updateWeightHistoryList() {
    var container = document.getElementById('weightHistoryList');
    if (!container) return;
    container.innerHTML = '';
    
    var sortedWeights = [].concat(state.bodyWeightHistory).sort(function(a, b) { 
        return new Date(b.date) - new Date(a.date); 
    });
    
    sortedWeights.forEach(function(w) {
        var div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px; border-bottom:1px solid #2a2f40;';
        div.innerHTML = '<span>' + formatDateToDMY(w.date) + '</span><span>' + w.weight + ' кг</span><button class="round-delete" data-date="' + w.date + '">✕</button>';
        container.appendChild(div);
    });
    
    document.querySelectorAll('#weightHistoryList .round-delete').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var d = btn.dataset.date;
            state.bodyWeightHistory = state.bodyWeightHistory.filter(function(w) { return w.date !== d; });
            updateWeightHistoryList(); 
            updateWeightChart(); 
            saveLocal(); 
            syncToCloud();
        });
    });
}

function formatDateToDMY(d) { 
    if (!d) return ""; 
    var p = d.split('-'); 
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : d; 
}

document.addEventListener('DOMContentLoaded', function() {
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
    
    var addWeightBtn = document.getElementById('addWeightBtn');
    if (addWeightBtn) {
        addWeightBtn.addEventListener('click', async function() {
            var date = document.getElementById('weightDateInput').value;
            var weight = parseFloat(document.getElementById('weightValueInput').value);
            if (date && weight) {
                var existing = state.bodyWeightHistory.find(function(w) { return w.date === date; });
                if (existing) existing.weight = weight;
                else state.bodyWeightHistory.push({ date: date, weight: weight });
                updateWeightHistoryList(); 
                updateWeightChart(); 
                saveLocal(); 
                await syncToCloud();
                document.getElementById('weightValueInput').value = '';
            } else {
                alert('Введите дату и вес');
            }
        });
    }
    
    updateWeightChart();
});
