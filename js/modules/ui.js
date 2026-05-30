import { state, saveLocal, syncToCloud } from '../db.js';
import { renderExercises } from './workouts.js';
import { updateProgressChart, updateMaxChart, updateFoodCharts, updateWeightChart } from './charts.js';
import { renderWorkoutHistory, renderFoodHistory } from './history.js';
import { renderFoodList, renderProductManagerLists } from './nutrition.js';
import { getToday } from '../utils/helpers.js';

// Эта функция будет установлена из app.js
let renderAllFn = null;
export function setRenderAll(fn) { renderAllFn = fn; }

export function setupUI() {
    setupTabs();
    setupChartTabs();
    setupHistoryTabs();
    setupModals();
    setupImportExport();
    setupProfile();
    setupProductManager();
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('#app-page .page').forEach(p => p.classList.remove('active-page'));
            document.getElementById(`${btn.dataset.tab}-page`).classList.add('active-page');
            if (btn.dataset.tab === 'stats') { updateProgressChart(); updateMaxChart(); updateFoodCharts(); }
            if (btn.dataset.tab === 'history') { renderWorkoutHistory(); renderFoodHistory(); }
            if (btn.dataset.tab === 'food') renderFoodList();
        });
    });
}

function setupChartTabs() {
    document.querySelectorAll('.chart-group-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-group-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            let group = btn.dataset.group;
            document.getElementById('train-charts').style.display = group === 'train' ? 'block' : 'none';
            document.getElementById('food-charts').style.display = group === 'food' ? 'block' : 'none';
            if (group === 'train') { updateProgressChart(); updateMaxChart(); }
            else updateFoodCharts();
        });
    });

    document.querySelectorAll('.chart-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            let parent = btn.closest('.chart-group');
            if (!parent) return;
            parent.querySelectorAll('.chart-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            let chartType = btn.dataset.chart;
            parent.querySelectorAll('.chart-container').forEach(c => c.classList.remove('active'));
            if (chartType === 'progress') { parent.querySelector('#progress-chart-container').classList.add('active'); setTimeout(() => updateProgressChart(), 0); }
            else if (chartType === 'max') { parent.querySelector('#max-chart-container').classList.add('active'); setTimeout(() => updateMaxChart(), 0); }
            else if (chartType === 'kcal') parent.querySelector('#kcal-chart-container').classList.add('active');
            else if (chartType === 'protein') parent.querySelector('#protein-chart-container').classList.add('active');
            else if (chartType === 'fat') parent.querySelector('#fat-chart-container').classList.add('active');
            else if (chartType === 'carbs') parent.querySelector('#carbs-chart-container').classList.add('active');
            else if (chartType === 'bju') parent.querySelector('#bju-chart-container').classList.add('active');
        });
    });
}

function setupHistoryTabs() {
    document.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.history-content').forEach(c => c.classList.remove('active'));
            if (btn.dataset.history === 'workout') { document.getElementById('workout-history-container').classList.add('active'); renderWorkoutHistory(); }
            else { document.getElementById('food-history-container').classList.add('active'); renderFoodHistory(); }
        });
    });
}

function setupModals() {
    // Закрытие модальных окон по клику на оверлей
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    });

    // Закрытие по кнопкам
    document.getElementById('closePickerBtn')?.addEventListener('click', () => document.getElementById('exercisePickerModal').style.display = 'none');
    document.getElementById('closeOrderBtn')?.addEventListener('click', () => document.getElementById('orderModal').style.display = 'none');
    document.getElementById('closeAddFoodModal')?.addEventListener('click', () => document.getElementById('addFoodModal').style.display = 'none');
    document.getElementById('closeAddToBaseModal')?.addEventListener('click', () => document.getElementById('addToBaseModal').style.display = 'none');
    document.getElementById('closeWeightModal')?.addEventListener('click', () => document.getElementById('weightModal').style.display = 'none');
    document.getElementById('closeProductManagerBtn')?.addEventListener('click', () => document.getElementById('productManagerModal').style.display = 'none');
    document.getElementById('closeEditProductModal')?.addEventListener('click', () => document.getElementById('editCustomProductModal').style.display = 'none');
    document.getElementById('closeCaloriesModal')?.addEventListener('click', () => document.getElementById('editCaloriesModal').style.display = 'none');
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => document.getElementById('profileModal').style.display = 'none');
}

function setupImportExport() {
    document.getElementById('copyJsonBtn')?.addEventListener('click', () => { 
        const exportData = { 
            foodEntries: state.foodEntries, 
            trainingHistory: state.trainingHistory, 
            customExercises: state.customExercises, 
            bodyWeightHistory: state.bodyWeightHistory, 
            customProducts: state.customProducts 
        }; 
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => alert('JSON скопирован')); 
    });
    
    document.getElementById('importJsonBtn')?.addEventListener('click', () => { 
        document.getElementById('importFileInput').click(); 
    });
    
    document.getElementById('importFileInput')?.addEventListener('change', (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (event) => { 
            try { 
                const data = JSON.parse(event.target.result); 
                if (data.foodEntries) state.foodEntries = data.foodEntries; 
                if (data.trainingHistory) state.trainingHistory = data.trainingHistory; 
                if (data.customExercises) state.customExercises = data.customExercises; 
                if (data.bodyWeightHistory) state.bodyWeightHistory = data.bodyWeightHistory; 
                if (data.customProducts) state.customProducts = data.customProducts; 
                saveLocal(); 
                if (renderAllFn) renderAllFn(); 
                alert('Данные импортированы!'); 
                syncToCloud(); 
            } catch(e) { 
                alert('Ошибка импорта: ' + e.message); 
            } 
        }; 
        reader.readAsText(file); 
    });
}

function setupProfile() {
    document.getElementById('syncCloudBtn')?.addEventListener('click', async () => { 
        await syncToCloud(); 
        alert('Синхронизация завершена!'); 
    });
    
    document.getElementById('profileIcon')?.addEventListener('click', () => { 
        if (state.currentUser) {
            document.getElementById('profileModal').style.display = 'flex';
            updateWeightHistoryList();
        } else {
            alert('Сначала войдите в аккаунт');
        }
    });
    
    document.getElementById('bicepIcon')?.addEventListener('click', () => { 
        let icon = document.getElementById('bicepIcon'); 
        icon.style.animation = 'none'; 
        setTimeout(() => icon.style.animation = 'flexBicep 2s ease-in-out infinite', 10); 
    });
    
    document.getElementById('smartAdviceBtn')?.addEventListener('click', showSmartAdvice);
}

function setupProductManager() {
    document.getElementById('manageProductsBtn')?.addEventListener('click', () => {
        renderProductManagerLists();
        document.getElementById('productManagerModal').style.display = 'flex';
    });
}

function showSmartAdvice() {
    let last = {};
    state.trainingHistory.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(w => { 
        if (!last[w.exercise]) last[w.exercise] = w; 
    });
    let text = '📊 Рекомендации:\n';
    for (let ex in last) {
        let w = last[ex];
        let lastSet = w.sets[w.sets.length - 1];
        text += `\n🏋️ ${ex} (${formatDateToDMY(w.date)}): ${lastSet.weightType === 'bw' ? 'Свой вес' : lastSet.weight + ' кг'} × ${lastSet.reps} (💪${lastSet.effort})\n`;
        if (lastSet.reps >= 10) text += `   → Добавь +2.5-5 кг, делай 6-8 повторов\n`;
        else if (lastSet.reps >= 6) text += `   → Можно добавить +2.5 кг или +1 повтор\n`;
        else text += `   → Снизь вес на 5-10%, работай 8-12 повторов\n`;
    }
    const adviceOutput = document.getElementById('adviceOutput');
    if (adviceOutput) adviceOutput.innerHTML = text || 'Нет данных';
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
        updateWeightHistoryList(); 
        updateWeightChart(); 
        saveLocal(); 
        await syncToCloud();
    }));
}

function formatDateToDMY(d) { 
    if (!d) return ""; 
    let p = d.split('-'); 
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d; 
}
