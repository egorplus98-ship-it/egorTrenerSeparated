import { state } from '../db.js';
import { formatDateToDMY, calculate1RM } from '../utils/helpers.js';

var charts = {};

export function updateProgressChart() {
    var select = document.getElementById('chartExerciseSelect');
    if (!select) return;
    var prev = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var o = document.createElement('option'); 
        o.value = ex; 
        o.textContent = ex; 
        select.appendChild(o); 
    });
    if (prev && state.customExercises.indexOf(prev) !== -1) select.value = prev;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { 
        return e.exercise === exercise; 
    }).sort(function(a, b) { 
        return new Date(a.date) - new Date(b.date); 
    });
    
    var labels = filtered.map(function(e) { return formatDateToDMY(e.date); });
    var data = filtered.map(function(e) { 
        return Math.max.apply(null, e.sets.map(function(s) { 
            return calculate1RM(s.weight, s.reps, s.effort); 
        })); 
    });
    
    var ctx = document.getElementById('progressChart')?.getContext('2d');
    if (!ctx) return;
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
                plugins: { 
                    legend: { labels: { color: '#eef2ff' } } 
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
    var select = document.getElementById('maxChartExerciseSelect');
    if (!select) return;
    var prev = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var o = document.createElement('option'); 
        o.value = ex; 
        o.textContent = ex; 
        select.appendChild(o); 
    });
    if (prev && state.customExercises.indexOf(prev) !== -1) select.value = prev;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { 
        return e.exercise === exercise; 
    }).sort(function(a, b) { 
        return new Date(a.date) - new Date(b.date); 
    });
    
    var dateMap = new Map();
    filtered.forEach(function(e) {
        var ms = { weight: 0, reps: 0, effort: 0 };
        e.sets.forEach(function(s) { 
            if (s.weightType !== 'bw' && s.weight > ms.weight) {
                ms = { weight: s.weight, reps: s.reps, effort: s.effort || 0 }; 
            }
        });
        if (ms.weight > 0 && (!dateMap.has(e.date) || dateMap.get(e.date).weight < ms.weight)) {
            dateMap.set(e.date, ms);
        }
    });
    
    var sorted = Array.from(dateMap.entries()).sort(function(a, b) { 
        return new Date(a[0]) - new Date(b[0]); 
    });
    var labels = sorted.map(function(s) { return formatDateToDMY(s[0]); });
    var data = sorted.map(function(s) { return s[1].weight; });
    var tt = sorted.map(function(s) { return s[1]; });
    
    var ctx = document.getElementById('maxChart')?.getContext('2d');
    if (!ctx) return;
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
                            label: function(ctx) { 
                                var d = tt[ctx.dataIndex]; 
                                return d ? d.weight + ' кг × ' + d.reps + ' повт (💪' + d.effort + ')' : ctx.raw + ' кг'; 
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

export function updateTonnageChart() {
    var select = document.getElementById('tonnageChartExerciseSelect');
    if (!select) return;
    var prev = select.value;
    select.innerHTML = '';
    state.customExercises.forEach(function(ex) { 
        var o = document.createElement('option'); 
        o.value = ex; 
        o.textContent = ex; 
        select.appendChild(o); 
    });
    if (prev && state.customExercises.indexOf(prev) !== -1) select.value = prev;
    else if (state.customExercises.length > 0) select.value = state.customExercises[0];
    
    var exercise = select.value;
    if (!exercise || !state.trainingHistory.length) return;
    
    var filtered = state.trainingHistory.filter(function(e) { 
        return e.exercise === exercise; 
    }).sort(function(a, b) { 
        return new Date(a.date) - new Date(b.date); 
    });
    
    var dateMap = new Map();
    filtered.forEach(function(e) {
        var ton = e.sets.reduce(function(t, s) { 
            return s.weightType === 'bw' ? t : t + (s.weight * s.reps); 
        }, 0);
        dateMap.set(e.date, (dateMap.get(e.date) || 0) + ton);
    });
    
    var sorted = Array.from(dateMap.entries()).sort(function(a, b) { 
        return new Date(a[0]) - new Date(b[0]); 
    });
    var labels = sorted.map(function(s) { return formatDateToDMY(s[0]); });
    var data = sorted.map(function(s) { return s[1]; });
    
    var ctx = document.getElementById('tonnageChart')?.getContext('2d');
    if (!ctx) return;
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
    
    if (charts.kcal) charts.kcal.destroy(); 
    if (charts.protein) charts.protein.destroy(); 
    if (charts.fat) charts.fat.destroy(); 
    if (charts.carbs) charts.carbs.destroy(); 
    if (charts.bju) charts.bju.destroy();
    
    if (labels.length) {
        var k = document.getElementById('kcalChart');
        var p = document.getElementById('proteinChart');
        var f = document.getElementById('fatChart');
        var c = document.getElementById('carbsChart');
        var b = document.getElementById('bjuChart');
        
        if (k) {
            charts.kcal = new Chart(k, { 
                type: 'line', 
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Калории', 
                        data: dates.map(function(d) { return grouped[d].kcal; }), 
                        borderColor: '#ff7b2c', 
                        fill: false 
                    }] 
                }, 
                options: { responsive: true, maintainAspectRatio: false } 
            });
        }
        if (p) {
            charts.protein = new Chart(p, { 
                type: 'line', 
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Белки', 
                        data: dates.map(function(d) { return grouped[d].protein; }), 
                        borderColor: '#2ecc71', 
                        fill: false 
                    }] 
                }, 
                options: { responsive: true, maintainAspectRatio: false } 
            });
        }
        if (f) {
            charts.fat = new Chart(f, { 
                type: 'line', 
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Жиры', 
                        data: dates.map(function(d) { return grouped[d].fat; }), 
                        borderColor: '#f1c40f', 
                        fill: false 
                    }] 
                }, 
                options: { responsive: true, maintainAspectRatio: false } 
            });
        }
        if (c) {
            charts.carbs = new Chart(c, { 
                type: 'line', 
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Углеводы', 
                        data: dates.map(function(d) { return grouped[d].carbs; }), 
                        borderColor: '#3498db', 
                        fill: false 
                    }] 
                }, 
                options: { responsive: true, maintainAspectRatio: false } 
            });
        }
        if (b) {
            charts.bju = new Chart(b, { 
                type: 'bar', 
                data: { 
                    labels: labels, 
                    datasets: [
                        { label: 'Белки', data: dates.map(function(d) { return grouped[d].protein; }), backgroundColor: '#2ecc71' }, 
                        { label: 'Жиры', data: dates.map(function(d) { return grouped[d].fat; }), backgroundColor: '#f1c40f' }, 
                        { label: 'Углеводы', data: dates.map(function(d) { return grouped[d].carbs; }), backgroundColor: '#3498db' }
                    ] 
                }, 
                options: { responsive: true, maintainAspectRatio: false } 
            });
        }
    }
}

export var weightChart = null;

export function updateWeightChart() {
    var sorted = [].concat(state.bodyWeightHistory).sort(function(a, b) { 
        return new Date(a.date) - new Date(b.date); 
    });
    var ctx = document.getElementById('weightChart')?.getContext('2d');
    if (!ctx) return;
    if (weightChart) weightChart.destroy();
    if (sorted.length) {
        weightChart = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels: sorted.map(function(w) { return formatDateToDMY(w.date); }), 
                datasets: [{ 
                    label: 'Вес (кг)', 
                    data: sorted.map(function(w) { return w.weight; }), 
                    borderColor: '#4c9aff', 
                    fill: false 
                }] 
            }, 
            options: { responsive: true, maintainAspectRatio: false } 
        });
    }
}

export function setupChartListeners() {
    document.getElementById('chartExerciseSelect')?.addEventListener('change', function() { 
        updateProgressChart(); 
    });
    document.getElementById('maxChartExerciseSelect')?.addEventListener('change', function() { 
        updateMaxChart(); 
    });
    document.getElementById('tonnageChartExerciseSelect')?.addEventListener('change', function() { 
        updateTonnageChart(); 
    });
}
