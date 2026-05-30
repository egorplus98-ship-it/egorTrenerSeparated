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
    
    // Группируем по датам и считаем тоннаж
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

export function setupChartListeners() {
    document.getElementById('chartExerciseSelect')?.addEventListener('change', function() { updateProgressChart(); });
    document.getElementById('maxChartExerciseSelect')?.addEventListener('change', function() { updateMaxChart(); });
    document.getElementById('tonnageChartExerciseSelect')?.addEventListener('change', function() { updateTonnageChart(); });
}
