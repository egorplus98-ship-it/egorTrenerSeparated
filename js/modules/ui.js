import { state, saveLocal, syncToCloud } from '../db.js';
import { updateProgressChart, updateMaxChart, updateFoodCharts, updateWeightChart, updateTonnageChart } from './charts.js';
import { renderWorkoutHistory, renderFoodHistory } from './history.js';
import { renderMeals, renderProductManagerLists } from './nutrition.js';

var renderAllFn = null;
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
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.querySelectorAll('#app-page .page').forEach(function(p) { p.classList.remove('active-page'); });
            document.getElementById(btn.dataset.tab + '-page').classList.add('active-page');
            if (btn.dataset.tab === 'stats') { updateProgressChart(); updateMaxChart(); updateTonnageChart(); updateFoodCharts(); }
            if (btn.dataset.tab === 'history') { renderWorkoutHistory(); renderFoodHistory(); }
            if (btn.dataset.tab === 'food') renderMeals();
        });
    });
}

function setupChartTabs() {
    document.querySelectorAll('.chart-group-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-group-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var group = btn.dataset.group;
            document.getElementById('train-charts').style.display = group === 'train' ? 'block' : 'none';
            document.getElementById('food-charts').style.display = group === 'food' ? 'block' : 'none';
            if (group === 'train') { updateProgressChart(); updateMaxChart(); updateTonnageChart(); }
            else updateFoodCharts();
        });
    });

    document.querySelectorAll('.chart-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var parent = btn.closest('.chart-group') || document.getElementById('train-charts');
            if (!parent) return;
            parent.querySelectorAll('.chart-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var chartType = btn.dataset.chart;
            parent.querySelectorAll('.chart-container').forEach(function(c) { c.classList.remove('active'); });
            if (chartType === 'progress') { 
                document.getElementById('progress-chart-container').classList.add('active'); 
                setTimeout(function() { updateProgressChart(); }, 0); 
            }
            else if (chartType === 'max') { 
                document.getElementById('max-chart-container').classList.add('active'); 
                setTimeout(function() { updateMaxChart(); }, 0); 
            }
            else if (chartType === 'tonnage') { 
                document.getElementById('tonnage-chart-container').classList.add('active'); 
                setTimeout(function() { updateTonnageChart(); }, 0); 
            }
            else if (chartType === 'kcal') document.getElementById('kcal-chart-container').classList.add('active');
            else if (chartType === 'protein') document.getElementById('protein-chart-container').classList.add('active');
            else if (chartType === 'fat') document.getElementById('fat-chart-container').classList.add('active');
            else if (chartType === 'carbs') document.getElementById('carbs-chart-container').classList.add('active');
            else if (chartType === 'bju') document.getElementById('bju-chart-container').classList.add('active');
        });
    });
}

function setupHistoryTabs() {
    document.querySelectorAll('.history-tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.history-tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.querySelectorAll('.history-content').forEach(function(c) { c.classList.remove('active'); });
            if (btn.dataset.history === 'workout') { 
                document.getElementById('workout-history-container').classList.add('active'); 
                renderWorkoutHistory(); 
            } else { 
                document.getElementById('food-history-container').classList.add('active'); 
                renderFoodHistory(); 
            }
        });
    });
}

function setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(function(modal) {
        modal.addEventListener('click', function(e) { 
            if (e.target === modal) modal.style.display = 'none'; 
        });
    });

    var closeButtons = {
        'closePickerBtn': 'exercisePickerModal',
        'closeOrderBtn': 'orderModal',
        'closeAddFoodModal': 'addFoodModal',
        'closeAddToBaseModal': 'addToBaseModal',
        'closeWeightModal': 'weightModal',
        'closeProductManagerBtn': 'productManagerModal',
        'closeCaloriesModal': 'editCaloriesModal',
        'closeProfileBtn': 'profileModal',
        'closeTemplatesBtn': 'templatesModal',
        'closeGoalsBtn': 'goalsModal'
    };

    for (var btnId in closeButtons) {
        (function(btnId, modalId) {
            var btn = document.getElementById(btnId);
            var modal = document.getElementById(modalId);
            if (btn && modal) {
                btn.addEventListener('click', function() { modal.style.display = 'none'; });
            }
        })(btnId, closeButtons[btnId]);
    }
}

function setupImportExport() {
    var copyBtn = document.getElementById('copyJsonBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() { 
            var exportData = { 
                foodEntries: state.foodEntries, 
                trainingHistory: state.trainingHistory, 
                customExercises: state.customExercises, 
                bodyWeightHistory: state.bodyWeightHistory, 
                customProducts: state.customProducts,
                workoutTemplates: state.workoutTemplates,
                nutritionGoals: state.nutritionGoals
            }; 
            navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(function() { 
                alert('JSON скопирован'); 
            }); 
        });
    }
    
    var importBtn = document.getElementById('importJsonBtn');
    if (importBtn) {
        importBtn.addEventListener('click', function() { 
            document.getElementById('importFileInput').click(); 
        });
    }
    
    var fileInput = document.getElementById('importFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) { 
            var file = e.target.files[0]; 
            if (!file) return; 
            var reader = new FileReader(); 
            reader.onload = function(event) { 
                try { 
                    var data = JSON.parse(event.target.result); 
                    if (data.foodEntries) state.foodEntries = data.foodEntries; 
                    if (data.trainingHistory) state.trainingHistory = data.trainingHistory; 
                    if (data.customExercises) state.customExercises = data.customExercises; 
                    if (data.bodyWeightHistory) state.bodyWeightHistory = data.bodyWeightHistory; 
                    if (data.customProducts) state.customProducts = data.customProducts; 
                    if (data.workoutTemplates) state.workoutTemplates = data.workoutTemplates;
                    if (data.nutritionGoals) state.nutritionGoals = data.nutritionGoals;
                    saveLocal(); 
                    if (renderAllFn) renderAllFn(); 
                    alert('Данные импортированы!'); 
                    syncToCloud(); 
                } catch(err) { 
                    alert('Ошибка импорта: ' + err.message); 
                } 
            }; 
            reader.readAsText(file); 
        });
    }
}

function setupProfile() {
    var syncBtn = document.getElementById('syncCloudBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', function() { 
            syncToCloud().then(function() {
                alert('Синхронизация завершена!');
            });
        });
    }
    
    var profileIcon = document.getElementById('profileIcon');
    if (profileIcon) {
        profileIcon.addEventListener('click', function() { 
            if (state.currentUser) {
                document.getElementById('profileModal').style.display = 'flex';
            } else {
                alert('Сначала войдите в аккаунт');
            }
        });
    }
    
    var bicepIcon = document.getElementById('bicepIcon');
    if (bicepIcon) {
        bicepIcon.addEventListener('click', function() { 
            bicepIcon.style.animation = 'none'; 
            setTimeout(function() { 
                bicepIcon.style.animation = 'flexBicep 2s ease-in-out infinite'; 
            }, 10); 
        });
    }
    
    var adviceBtn = document.getElementById('smartAdviceBtn');
    if (adviceBtn) {
        adviceBtn.addEventListener('click', showSmartAdvice);
    }
}

function setupProductManager() {
    var manageBtn = document.getElementById('manageProductsBtn');
    if (manageBtn) {
        manageBtn.addEventListener('click', function() {
            renderProductManagerLists();
            document.getElementById('productManagerModal').style.display = 'flex';
        });
    }
}

function showSmartAdvice() {
    var last = {};
    state.trainingHistory.slice().sort(function(a, b) { 
        return new Date(b.date) - new Date(a.date); 
    }).forEach(function(w) { 
        if (!last[w.exercise]) last[w.exercise] = w; 
    });
    
    var text = '📊 Рекомендации:\n';
    for (var ex in last) {
        var w = last[ex];
        var lastSet = w.sets[w.sets.length - 1];
        text += '\n🏋️ ' + ex + ' (' + formatDateToDMY(w.date) + '): ' + 
                (lastSet.weightType === 'bw' ? 'Свой вес' : lastSet.weight + ' кг') + 
                ' × ' + lastSet.reps + ' (💪' + lastSet.effort + ')\n';
        if (lastSet.reps >= 10) text += '   → Добавь +2.5-5 кг, делай 6-8 повторов\n';
        else if (lastSet.reps >= 6) text += '   → Можно добавить +2.5 кг или +1 повтор\n';
        else text += '   → Снизь вес на 5-10%, работай 8-12 повторов\n';
    }
    var adviceOutput = document.getElementById('adviceOutput');
    if (adviceOutput) adviceOutput.innerHTML = text || 'Нет данных';
}

function formatDateToDMY(d) { 
    if (!d) return ""; 
    var p = d.split('-'); 
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : d; 
}
