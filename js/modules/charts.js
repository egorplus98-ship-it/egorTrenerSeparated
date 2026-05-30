// js/modules/charts.js

import { state } from '../db.js';
import { formatDateToDMY, calculate1RM } from '../utils/helpers.js';

let charts = {};

export function updateProgressChart() {
    let select = document.getElementById('chartExerciseSelect');
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(ex => { 
        let opt = document.createElement('option'); 
        opt.value = ex; 
        opt.textContent = ex; 
        select.appendChild(opt); 
    });
    if (previousValue && state.customExercises.includes(previousValue)) select.value = previousValue;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    let exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    let filtered = state.trainingHistory
        .filter(e => e.exercise === exercise)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let labels = filtered.map(e => formatDateToDMY(e.date));
    let data = filtered.map(e => Math.max(...e.sets.map(s => calculate1RM(s.weight, s.reps, s.effort))));
    
    let canvas = document.getElementById('progressChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    
    if (charts.progress) charts.progress.destroy();
    
    if (labels.length) {
        charts.progress = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels, 
                datasets: [{ 
                    label: `1ПМ ${exercise}`, 
                    data, 
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
                    legend: { 
                        labels: { color: '#eef2ff' } 
                    } 
                }, 
                scales: { 
                    x: { 
                        ticks: { color: '#c4c9e0' }, 
                        grid: { color: 'rgba(255,255,255,0.06)' } 
                    }, 
                    y: { 
                        ticks: { color: '#c4c9e0' }, 
                        grid: { color: 'rgba(255,255,255,0.06)' } 
                    } 
                } 
            } 
        });
    }
}

export function updateMaxChart() {
    let select = document.getElementById('maxChartExerciseSelect');
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(ex => { 
        let opt = document.createElement('option'); 
        opt.value = ex; 
        opt.textContent = ex; 
        select.appendChild(opt); 
    });
    if (previousValue && state.customExercises.includes(previousValue)) select.value = previousValue;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    let exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    let filtered = state.trainingHistory
        .filter(e => e.exercise === exercise)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Группируем по датам с максимальным весом
    let dateMap = new Map();
    filtered.forEach(e => {
        let maxSet = { weight: 0, reps: 0, effort: 0 };
        e.sets.forEach(s => { 
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
    
    let sorted = Array.from(dateMap.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
    let labels = sorted.map(s => formatDateToDMY(s[0]));
    let data = sorted.map(s => s[1].weight);
    let tooltipData = sorted.map(s => s[1]);
    
    let canvas = document.getElementById('maxChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    
    if (charts.max) charts.max.destroy();
    
    if (labels.length && data.some(d => d > 0)) {
        charts.max = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels, 
                datasets: [{ 
                    label: `Макс. вес ${exercise} (кг)`, 
                    data, 
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
                    legend: { 
                        labels: { color: '#eef2ff' } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let idx = context.dataIndex;
                                let d = tooltipData[idx];
                                if (d) {
                                    return `${d.weight} кг × ${d.reps} повт (💪${d.effort})`;
                                }
                                return context.raw + ' кг';
                            }
                        }
                    }
                }, 
                scales: { 
                    x: { 
                        ticks: { color: '#c4c9e0' }, 
                        grid: { color: 'rgba(255,255,255,0.06)' } 
                    }, 
                    y: { 
                        ticks: { color: '#c4c9e0' }, 
                        grid: { color: 'rgba(255,255,255,0.06)' } 
                    } 
                } 
            } 
        });
    }
}

export function updateFoodCharts() {
    let grouped = {};
    state.foodEntries.forEach(f => { 
        if (!grouped[f.date]) grouped[f.date] = { kcal: 0, protein: 0, fat: 0, carbs: 0 }; 
        grouped[f.date].kcal += f.kcal; 
        grouped[f.date].protein += f.protein; 
        grouped[f.date].fat += f.fat; 
        grouped[f.date].carbs += f.carbs; 
    });
    
    let dates = Object.keys(grouped).sort();
    let labels = dates.map(d => formatDateToDMY(d));
    let kcalData = dates.map(d => grouped[d].kcal);
    let proteinData = dates.map(d => grouped[d].protein);
    let fatData = dates.map(d => grouped[d].fat);
    let carbsData = dates.map(d => grouped[d].carbs);
    
    // Уничтожаем старые графики
    if (charts.kcal) charts.kcal.destroy(); 
    if (charts.protein) charts.protein.destroy(); 
    if (charts.fat) charts.fat.destroy(); 
    if (charts.carbs) charts.carbs.destroy(); 
    if (charts.bju) charts.bju.destroy();
    
    if (labels.length) {
        let kcalCanvas = document.getElementById('kcalChart');
        let proteinCanvas = document.getElementById('proteinChart');
        let fatCanvas = document.getElementById('fatChart');
        let carbsCanvas = document.getElementById('carbsChart');
        let bjuCanvas = document.getElementById('bjuChart');
        
        if (kcalCanvas) {
            charts.kcal = new Chart(kcalCanvas, { 
                type: 'line', 
                data: { 
                    labels, 
                    datasets: [{ 
                        label: 'Калории (ккал)', 
                        data: kcalData, 
                        borderColor: '#ff7b2c', 
                        fill: false 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false 
                }
            });
        }
        
        if (proteinCanvas) {
            charts.protein = new Chart(proteinCanvas, { 
                type: 'line', 
                data: { 
                    labels, 
                    datasets: [{ 
                        label: 'Белки (г)', 
                        data: proteinData, 
                        borderColor: '#2ecc71', 
                        fill: false 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false 
                }
            });
        }
        
        if (fatCanvas) {
            charts.fat = new Chart(fatCanvas, { 
                type: 'line', 
                data: { 
                    labels, 
                    datasets: [{ 
                        label: 'Жиры (г)', 
                        data: fatData, 
                        borderColor: '#f1c40f', 
                        fill: false 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false 
                }
            });
        }
        
        if (carbsCanvas) {
            charts.carbs = new Chart(carbsCanvas, { 
                type: 'line', 
                data: { 
                    labels, 
                    datasets: [{ 
                        label: 'Углеводы (г)', 
                        data: carbsData, 
                        borderColor: '#3498db', 
                        fill: false 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false 
                }
            });
        }
        
        if (bjuCanvas) {
            charts.bju = new Chart(bjuCanvas, { 
                type: 'bar', 
                data: { 
                    labels, 
                    datasets: [
                        { label: 'Белки', data: proteinData, backgroundColor: '#2ecc71' }, 
                        { label: 'Жиры', data: fatData, backgroundColor: '#f1c40f' }, 
                        { label: 'Углеводы', data: carbsData, backgroundColor: '#3498db' }
                    ] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false 
                }
            });
        }
    }
}

export let weightChart = null;

export function updateWeightChart() {
    let sorted = [...state.bodyWeightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    let ctx = document.getElementById('weightChart')?.getContext('2d');
    if (!ctx) return;
    
    if (weightChart) weightChart.destroy();
    
    if (sorted.length) { 
        weightChart = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: sorted.map(w => formatDateToDMY(w.date)), 
                datasets: [{ 
                    label: 'Вес (кг)', 
                    data: sorted.map(w => w.weight), 
                    borderColor: '#4c9aff', 
                    fill: false 
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false 
            }
        }); 
    }
}

export function setupChartListeners() {
    document.getElementById('chartExerciseSelect')?.addEventListener('change', () => { 
        updateProgressChart(); 
    });
    document.getElementById('maxChartExerciseSelect')?.addEventListener('change', () => { 
        updateMaxChart(); 
    });
}
