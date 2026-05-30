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
                data: { 
                    labels: labels, 
                    datasets: [
                        { label: 'Белки', data: proteinData, backgroundColor: '#2ecc71' }, 
                        { label: 'Жиры', data: fatData, backgroundColor: '#f1c40f' }, 
                        { label: 'Углеводы', data: carbsData, backgroundColor: '#3498db' }
                    ] 
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}
