// js/modules/charts.js

import { state } from '../db.js';
import { formatDateToDMY, calculate1RM } from '../utils/helpers.js';

var charts = {};

export function updateProgressChart() {
    var select = document.getElementById('chartExerciseSelect');
    if (!select) return;
    var previousValue = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var opt = document.createElement('option'); 
        opt.value = ex; 
        opt.textContent = ex; 
        select.appendChild(opt); 
    });
    if (previousValue && state.customExercises.indexOf(previousValue) !== -1) select.value = previousValue;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { return e.exercise === exercise; })
        .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    
    var labels = filtered.map(function(e) { return formatDateToDMY(e.date); });
    var data = filtered.map(function(e) { return Math.max.apply(null, e.sets.map(function(s) { return calculate1RM(s.weight, s.reps, s.effort); })); });
    
    var canvas = document.getElementById('progressChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    
    if (charts.progress) charts.progress.destroy();
    
    if (labels.length) {
        charts.progress = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: '1ПМ ' + exercise, 
                    data: data, 
                    borderColor: '#ff7b2c', 
                    backgroundColor: 'rgba(255,123,44,0.15)', 
                    fill: false, 
                    tension: 0.25 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { labels: { color: '#eef2ff' } } }, 
                scales: { 
                    x: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } }, 
                    y: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } } 
                } 
            } 
        });
    }
}

export function updateMaxChart() {
    var select = document.getElementById('maxChartExerciseSelect');
    if (!select) return;
    var previousValue = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var opt = document.createElement('option'); 
        opt.value = ex; 
        opt.textContent = ex; 
        select.appendChild(opt); 
    });
    if (previousValue && state.customExercises.indexOf(previousValue) !== -1) select.value = previousValue;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { return e.exercise === exercise; })
        .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    
    var dateMap = new Map();
    filtered.forEach(function(e) {
        var maxSet = { weight: 0, reps: 0, effort: 0 };
        e.sets.forEach(function(s) { 
            if (s.weightType !== 'bw' && s.weight > maxSet.weight) {
                maxSet = { weight: s.weight, reps: s.reps, effort: s.effort || 0 };
            }
        });
        if (maxSet.weight > 0) {
            if (!dateMap.has(e.date) || dateMap.get(e.date).weight < maxSet.weight) {
                dateMap.set(e.date, maxSet);
            }
        }
    });
    
    var sorted = Array.from(dateMap.entries()).sort(function(a, b) { return new Date(a[0]) - new Date(b[0]); });
    var labels = sorted.map(function(s) { return formatDateToDMY(s[0]); });
    var data = sorted.map(function(s) { return s[1].weight; });
    var tooltipData = sorted.map(function(s) { return s[1]; });
    
    var canvas = document.getElementById('maxChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    
    if (charts.max) charts.max.destroy();
    
    if (labels.length && data.some(function(d) { return d > 0; })) {
        charts.max = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Макс. вес ' + exercise + ' (кг)', 
                    data: data, 
                    borderColor: '#ff7b2c', 
                    backgroundColor: 'rgba(255,123,44,0.15)', 
                    fill: false, 
                    tension: 0.25 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { labels: { color: '#eef2ff' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var idx = context.dataIndex;
                                var d = tooltipData[idx];
                                if (d) return d.weight + ' кг × ' + d.reps + ' повт (💪' + d.effort + ')';
                                return context.raw + ' кг';
                            }
                        }
                    }
                }, 
                scales: { 
                    x: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } }, 
                    y: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } } 
                } 
            } 
        });
    }
}

export function updateTonnageChart() {
    var select = document.getElementById('tonnageChartExerciseSelect');
    if (!select) return;
    
    var previousValue = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var opt = document.createElement('option'); 
        opt.value = ex; 
        opt.textContent = ex; 
        select.appendChild(opt); 
    });
    
    if (previousValue && state.customExercises.indexOf(previousValue) !== -1) select.value = previousValue;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { return e.exercise === exercise; })
        .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    
    var dateMap = new Map();
    filtered.forEach(function(e) {
        var tonnage = e.sets.reduce(function(total, s) {
            if (s.weightType === 'bw') return total;
            return total + (s.weight * s.reps);
        }, 0);
        
        if (!dateMap.has(e.date)) dateMap.set(e.date, 0);
        dateMap.set(e.date, dateMap.get(e.date) + tonnage);
    });
    
    var sorted = Array.from(dateMap.entries()).sort(function(a, b) { return new Date(a[0]) - new Date(b[0]); });
    var labels = sorted.map(function(s) { return formatDateToDMY(s[0]); });
    var data = sorted.map(function(s) { return s[1]; });
    
    var canvas = document.getElementById('tonnageChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    
    if (charts.tonnage) charts.tonnage.destroy();
    
    if (labels.length && data.some(function(d) { return d > 0; })) {
        charts.tonnage = new Chart(ctx, { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Тоннаж ' + exercise + ' (кг)', 
                    data: data, 
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: '#2ecc71',
                    borderWidth: 1
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { labels: { color: '#eef2ff' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + ' кг общий тоннаж';
                            }
                        }
                    }
                }, 
                scales: { 
                    x: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } }, 
                    y: { ticks: { color: '#c4c9e0' }, grid: { color: 'rgba(255,255,255,0.06)' } } 
                } 
            } 
        });
    }
}

export function updateFoodCharts() {
    var grouped = {};
    state.foodEntries.forEach(function(f) { 
        if (!grouped[f.date]) grouped[f.date] = { kcal: 0, protein: 0, fat: 0, carbs: 0 }; 
        grouped[f.date].kcal += f.kcal; 
        grouped[f.date].protein += f.protein; 
        grouped[f.date].fat += f.fat; 
        grouped[f.date].carbs += f.carbs; 
    });
    
    var dates = Object.keys(grouped).sort();
    var labels = dates.map(function(d) { return formatDateToDMY(d); });
    var kcalData = dates.map(function(d) { return grouped[d].kcal; });
    var proteinData = dates.map(function(d) { return grouped[d].protein; });
    var fatData = dates.map(function(d) { return grouped[d].fat; });
    var carbsData = dates.map(function(d) { return grouped[d].carbs; });
    
    if (charts.kcal) charts.kcal.destroy(); 
    if (charts.protein) charts.protein.destroy(); 
    if (charts.fat) charts.fat.destroy(); 
    if (charts.carbs) charts.carbs.destroy(); 
    if (charts.bju) charts.bju.destroy();
    
    if (labels.length) {
        var kcalCanvas = document.getElementById('kcalChart');
        var proteinCanvas = document.getElementById('proteinChart');
        var fatCanvas = document.getElementById('fatChart');
        var carbsCanvas = document.getElementById('carbsChart');
        var bjuCanvas = document.getElementById('bjuChart');
        
        if (kcalCanvas) {
            charts.kcal = new Chart(kcalCanvas, { 
                type: 'line', 
                data: { labels: labels, datasets: [{ label: 'Калории (ккал)', data: kcalData, borderColor: '#ff7b2c', fill: false }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        if (proteinCanvas) {
            charts.protein = new Chart(proteinCanvas, { 
                type: 'line', 
                data: { labels: labels, datasets: [{ label: 'Белки (г)', data: proteinData, borderColor: '#2ecc71', fill: false }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        if (fatCanvas) {
            charts.fat = new Chart(fatCanvas, { 
                type: 'line', 
                data: { labels: labels, datasets: [{ label: 'Жиры (г)', data: fatData, borderColor: '#f1c40f', fill: false }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        if (carbsCanvas) {
            charts.carbs = new Chart(carbsCanvas, { 
                type: 'line', 
                data: { labels: labels, datasets: [{ label: 'Углеводы (г)', data: carbsData, borderColor: '#3498db', fill: false }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        if (bjuCanvas) {
            charts.bju = new Chart(bjuCanvas, { 
                type: 'bar', 
                data: { labels: labels, datasets: [
                    { label: 'Белки', data: proteinData, backgroundColor: '#2ecc71' }, 
                    { label: 'Жиры', data: fatData, backgroundColor: '#f1c40f' }, 
                    { label: 'Углеводы', data: carbsData, backgroundColor: '#3498db' }
                ]},
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}

export var weightChart = null;

export function updateWeightChart() {
    var sorted = [].concat(state.bodyWeightHistory).sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var ctx = document.getElementById('weightChart')?.getContext('2d');
    if (!ctx) return;
    
    if (weightChart) weightChart.destroy();
    
    if (sorted.length) { 
        weightChart = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: sorted.map(function(w) { return formatDateToDMY(w.date); }), 
                datasets: [{ label: 'Вес (кг)', data: sorted.map(function(w) { return w.weight; }), borderColor: '#4c9aff', fill: false }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        }); 
    }
}

export function setupChartListeners() {
    document.getElementById('chartExerciseSelect')?.addEventListener('change', function() { updateProgressChart(); });
    document.getElementById('maxChartExerciseSelect')?.addEventListener('change', function() { updateMaxChart(); });
    document.getElementById('tonnageChartExerciseSelect')?.addEventListener('change', function() { updateTonnageChart(); });
}
