import { state, saveLocal, syncToCloud } from '../db.js';
import { getToday } from '../utils/helpers.js';

var builtinProducts = {
    "рис": { protein: 2.7, fat: 0.3, carbs: 28, kcal: 130 },
    "гречка": { protein: 12.6, fat: 3.3, carbs: 62, kcal: 313 },
    "куриная грудка": { protein: 31, fat: 3.6, carbs: 0, kcal: 165 },
    "говядина": { protein: 26, fat: 15, carbs: 0, kcal: 250 },
    "творог 5%": { protein: 17, fat: 5, carbs: 3, kcal: 121 },
    "яйцо": { protein: 13, fat: 11, carbs: 0.7, kcal: 155 },
    "банан": { protein: 1.1, fat: 0.3, carbs: 23, kcal: 96 },
    "овсянка": { protein: 12, fat: 6, carbs: 62, kcal: 350 },
    "макароны": { protein: 5, fat: 1, carbs: 30, kcal: 150 }
};

var currentMeal = 'breakfast';

function getAllProducts() { 
    var result = {};
    for (var key in builtinProducts) result[key] = builtinProducts[key];
    for (var key in state.customProducts) result[key] = state.customProducts[key];
    return result;
}

function findProductInDatabase(query) {
    var lowerQuery = query.toLowerCase().trim();
    var allProducts = getAllProducts();
    var results = [];
    for (var product in allProducts) {
        if (product.toLowerCase().indexOf(lowerQuery) !== -1) {
            results.push({ name: product, nutrition: allProducts[product], source: builtinProducts[product] ? 'builtin' : 'custom' });
        }
    }
    return results;
}

function callUpdateFoodCharts() {
    if (window.updateFoodCharts) window.updateFoodCharts();
}

export async function addFoodItem(name, weight, nutrition, meal) {
    var date = document.getElementById('foodDate').value || getToday();
    var ratio = weight / 100;
    state.foodEntries.push({ 
        id: Date.now(), 
        date: date, 
        meal: meal || currentMeal,
        name: name, 
        weight: weight, 
        protein: nutrition.protein * ratio, 
        fat: nutrition.fat * ratio, 
        carbs: nutrition.carbs * ratio, 
        kcal: nutrition.kcal * ratio 
    });
    renderMeals(); 
    updateGoals();
    callUpdateFoodCharts(); 
    saveLocal(); 
    await syncToCloud();
}

export function renderMeals() {
    var date = document.getElementById('foodDate').value || getToday();
    var dayEntries = state.foodEntries.filter(function(f) { return f.date === date; });
    
    var meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    meals.forEach(function(mealType) {
        var listEl = document.getElementById(mealType + 'List');
        var kcalEl = document.getElementById(mealType + 'Kcal');
        if (!listEl || !kcalEl) return;
        
        var mealFoods = dayEntries.filter(function(f) { return f.meal === mealType; });
        listEl.innerHTML = '';
        var totalKcal = 0;
        
        mealFoods.forEach(function(food) {
            totalKcal += food.kcal;
            var div = document.createElement('div');
            div.className = 'meal-item';
            div.innerHTML = '<div><b>' + food.name + '</b> ' + food.weight + 'г' +
                '<div style="font-size:10px;color:#9ba1bc;">Б:' + food.protein.toFixed(1) + ' Ж:' + food.fat.toFixed(1) + ' У:' + food.carbs.toFixed(1) + '</div></div>' +
                '<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:11px;">' + Math.round(food.kcal) + ' ккал</span>' +
                '<button class="round-delete remove-food-btn" data-id="' + food.id + '">✕</button></div>';
            listEl.appendChild(div);
        });
        
        kcalEl.textContent = Math.round(totalKcal) + ' ккал';
    });
    
    document.querySelectorAll('.remove-food-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var id = parseInt(btn.dataset.id);
            state.foodEntries = state.foodEntries.filter(function(f) { return f.id !== id; });
            renderMeals();
            updateGoals();
            callUpdateFoodCharts();
            saveLocal();
            await syncToCloud();
        });
    });
    
    updateGoals();
}

function updateGoals() {
    var date = document.getElementById('foodDate').value || getToday();
    var dayEntries = state.foodEntries.filter(function(f) { return f.date === date; });
    
    var total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    dayEntries.forEach(function(f) { 
        total.kcal += f.kcal; 
        total.protein += f.protein; 
        total.fat += f.fat; 
        total.carbs += f.carbs; 
    });
    
    var goals = state.nutritionGoals || { kcal: 2500, protein: 150, fat: 70, carbs: 300 };
    
    var gk = document.getElementById('goalKcal');
    var gp = document.getElementById('goalProtein');
    var gf = document.getElementById('goalFat');
    var gc = document.getElementById('goalCarbs');
    var kp = document.getElementById('kcalProgress');
    var pp = document.getElementById('proteinProgress');
    var fp = document.getElementById('fatProgress');
    var cp = document.getElementById('carbsProgress');
    
    if (gk) gk.textContent = Math.round(total.kcal) + '/' + goals.kcal;
    if (gp) gp.textContent = total.protein.toFixed(1) + '/' + goals.protein;
    if (gf) gf.textContent = total.fat.toFixed(1) + '/' + goals.fat;
    if (gc) gc.textContent = total.carbs.toFixed(1) + '/' + goals.carbs;
    
    if (kp) kp.style.width = Math.min(100, (total.kcal / goals.kcal) * 100) + '%';
    if (pp) pp.style.width = Math.min(100, (total.protein / goals.protein) * 100) + '%';
    if (fp) fp.style.width = Math.min(100, (total.fat / goals.fat) * 100) + '%';
    if (cp) cp.style.width = Math.min(100, (total.carbs / goals.carbs) * 100) + '%';
}

export function setupNutritionButtons() {
    currentMeal = 'breakfast';
    
    document.querySelectorAll('.add-to-meal-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            currentMeal = btn.dataset.meal;
            // Убираем подсветку со всех
            document.querySelectorAll('.add-to-meal-btn').forEach(function(b) { 
                b.style.background = '#ff7b2c'; 
                b.classList.remove('active-meal');
            });
            // Подсвечиваем выбранный
            btn.style.background = '#2ecc71';
            btn.classList.add('active-meal');
            var searchInput = document.getElementById('productSearchInput');
            if (searchInput) searchInput.focus();
        });
    });
    
    var searchBtn = document.getElementById('searchProductBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            var query = document.getElementById('productSearchInput').value.trim();
            if (!query) return;
            var results = findProductInDatabase(query);
            var container = document.getElementById('searchResults');
            container.innerHTML = '';
            if (results.length === 0) { 
                container.innerHTML = '<div style="padding:12px;text-align:center;">❌ Ничего не найдено</div>'; 
                return; 
            }
            results.forEach(function(result) {
                var div = document.createElement('div');
                div.className = 'compact-exercise-item';
                div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;background:#1e2332;padding:10px 14px;border-radius:14px;';
                div.innerHTML = '<span>' + result.name + '</span><button class="small-plus select-product-btn" data-name="' + result.name + '" data-protein="' + result.nutrition.protein + '" data-fat="' + result.nutrition.fat + '" data-carbs="' + result.nutrition.carbs + '" data-kcal="' + result.nutrition.kcal + '">+</button>';
                container.appendChild(div);
            });
            document.querySelectorAll('.select-product-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var name = btn.dataset.name;
                    var nutrition = { 
                        protein: parseFloat(btn.dataset.protein), 
                        fat: parseFloat(btn.dataset.fat), 
                        carbs: parseFloat(btn.dataset.carbs), 
                        kcal: parseFloat(btn.dataset.kcal) 
                    };
                    showWeightModal(name, nutrition);
                    container.innerHTML = '';
                });
            });
        });
    }
    
    var confirmWeightBtn = document.getElementById('confirmWeightBtn');
    if (confirmWeightBtn) {
        confirmWeightBtn.addEventListener('click', async function() {
            var w = parseFloat(document.getElementById('selectedWeight').value);
            if (w > 0 && window._selectedNutrition && window._selectedProduct) {
                await addFoodItem(window._selectedProduct, w, window._selectedNutrition, currentMeal);
                document.getElementById('weightModal').style.display = 'none';
            }
        });
    }
    
    var editGoalsBtn = document.getElementById('editGoalsBtn');
    if (editGoalsBtn) {
        editGoalsBtn.addEventListener('click', function() {
            var goals = state.nutritionGoals || { kcal: 2500, protein: 150, fat: 70, carbs: 300 };
            document.getElementById('goalKcalInput').value = goals.kcal;
            document.getElementById('goalProteinInput').value = goals.protein;
            document.getElementById('goalFatInput').value = goals.fat;
            document.getElementById('goalCarbsInput').value = goals.carbs;
            document.getElementById('goalsModal').style.display = 'flex';
        });
    }
    
    var saveGoalsBtn = document.getElementById('saveGoalsBtn');
    if (saveGoalsBtn) {
        saveGoalsBtn.addEventListener('click', async function() {
            state.nutritionGoals = {
                kcal: parseInt(document.getElementById('goalKcalInput').value) || 2500,
                protein: parseInt(document.getElementById('goalProteinInput').value) || 150,
                fat: parseInt(document.getElementById('goalFatInput').value) || 70,
                carbs: parseInt(document.getElementById('goalCarbsInput').value) || 300
            };
            saveLocal();
            await syncToCloud();
            document.getElementById('goalsModal').style.display = 'none';
            renderMeals();
        });
    }
    
    var foodDateEl = document.getElementById('foodDate');
    if (foodDateEl) foodDateEl.addEventListener('change', function() { renderMeals(); });
}

export function showWeightModal(productName, nutrition) {
    document.getElementById('weightProductName').innerText = productName;
    document.getElementById('selectedWeight').value = 100;
    window._selectedNutrition = nutrition;
    window._selectedProduct = productName;
    document.getElementById('weightModal').style.display = 'flex';
}

export function renderProductManagerLists() {
    var builtinContainer = document.getElementById('builtin-products-container');
    if (builtinContainer) {
        builtinContainer.innerHTML = '';
        for (var name in builtinProducts) {
            var nutrition = builtinProducts[name];
            var div = document.createElement('div');
            div.style.cssText = 'background:#1e2332;padding:10px;border-radius:12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
            div.innerHTML = '<div><b>' + name + '</b><div style="font-size:11px;color:#9ba1bc;">Б:' + nutrition.protein + ' Ж:' + nutrition.fat + ' У:' + nutrition.carbs + ' Ккал:' + nutrition.kcal + '</div></div><span style="font-size:11px;color:#9ba1bc;">📦</span>';
            builtinContainer.appendChild(div);
        }
    }
    
    var customContainer = document.getElementById('custom-products-container');
    if (customContainer) {
        customContainer.innerHTML = '';
        for (var name in state.customProducts) {
            var nutrition = state.customProducts[name];
            var div = document.createElement('div');
            div.style.cssText = 'background:#1e2332;padding:10px;border-radius:12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
            div.innerHTML = '<div><b>' + name + '</b><div style="font-size:11px;color:#9ba1bc;">Б:' + nutrition.protein + ' Ж:' + nutrition.fat + ' У:' + nutrition.carbs + ' Ккал:' + nutrition.kcal + '</div></div><button class="round-delete" data-name="' + name + '">✕</button>';
            customContainer.appendChild(div);
        }
        document.querySelectorAll('#custom-products-container .round-delete').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var name = btn.dataset.name;
                if (confirm('Удалить "' + name + '"?')) {
                    delete state.customProducts[name];
                    saveLocal();
                    await syncToCloud();
                    renderProductManagerLists();
                }
            });
        });
    }
}
