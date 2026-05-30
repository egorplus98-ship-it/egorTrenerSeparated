import { state, saveLocal, syncToCloud } from '../db.js';
import { getToday } from '../utils/helpers.js';
import { updateFoodCharts } from './charts.js';

const builtinProducts = {
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

let currentMeal = 'breakfast';

function getAllProducts() { 
    return { ...builtinProducts, ...state.customProducts }; 
}

function findProductInDatabase(query) {
    var lowerQuery = query.toLowerCase().trim();
    var allProducts = getAllProducts();
    var results = [];
    for (var product in allProducts) {
        if (product.toLowerCase().includes(lowerQuery)) {
            results.push({ name: product, nutrition: allProducts[product], source: builtinProducts[product] ? 'builtin' : 'custom' });
        }
    }
    return results;
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
    updateFoodCharts(); 
    saveLocal(); 
    await syncToCloud();
}

export function renderMeals() {
    var date = document.getElementById('foodDate').value || getToday();
    var dayEntries = state.foodEntries.filter(function(f) { return f.date === date; });
    
    var meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    var mealNames = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack' };
    
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
            updateFoodCharts();
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
    
    document.getElementById('goalKcal').textContent = Math.round(total.kcal) + '/' + goals.kcal;
    document.getElementById('goalProtein').textContent = total.protein.toFixed(1) + '/' + goals.protein;
    document.getElementById('goalFat').textContent = total.fat.toFixed(1) + '/' + goals.fat;
    document.getElementById('goalCarbs').textContent = total.carbs.toFixed(1) + '/' + goals.carbs;
    
    document.getElementById('kcalProgress').style.width = Math.min(100, (total.kcal / goals.kcal) * 100) + '%';
    document.getElementById('proteinProgress').style.width = Math.min(100, (total.protein / goals.protein) * 100) + '%';
    document.getElementById('fatProgress').style.width = Math.min(100, (total.fat / goals.fat) * 100) + '%';
    document.getElementById('carbsProgress').style.width = Math.min(100, (total.carbs / goals.carbs) * 100) + '%';
    
    // Уведомление о достижении целей
    if (total.kcal >= goals.kcal && goals.kcal > 0) {
        document.getElementById('kcalProgress').style.background = '#2ecc71';
    }
}

export function setupNutritionButtons() {
    currentMeal = 'breakfast';
    
    document.querySelectorAll('.add-to-meal-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            currentMeal = btn.dataset.meal;
            document.getElementById('productSearchInput').focus();
        });
    });
    
    document.getElementById('searchProductBtn')?.addEventListener('click', function() {
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
    
    document.getElementById('confirmWeightBtn')?.addEventListener('click', async function() {
        var w = parseFloat(document.getElementById('selectedWeight').value);
        if (w > 0 && window._selectedNutrition && window._selectedProduct) {
            await addFoodItem(window._selectedProduct, w, window._selectedNutrition, currentMeal);
            document.getElementById('weightModal').style.display = 'none';
        }
    });
    
    // Цели
    document.getElementById('editGoalsBtn')?.addEventListener('click', function() {
        var goals = state.nutritionGoals || { kcal: 2500, protein: 150, fat: 70, carbs: 300 };
        document.getElementById('goalKcalInput').value = goals.kcal;
        document.getElementById('goalProteinInput').value = goals.protein;
        document.getElementById('goalFatInput').value = goals.fat;
        document.getElementById('goalCarbsInput').value = goals.carbs;
        document.getElementById('goalsModal').style.display = 'flex';
    });
    
    document.getElementById('saveGoalsBtn')?.addEventListener('click', async function() {
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
    
    document.getElementById('closeGoalsBtn')?.addEventListener('click', function() {
        document.getElementById('goalsModal').style.display = 'none';
    });
    
    document.getElementById('foodDate')?.addEventListener('change', function() { renderMeals(); });
    
    // Закрытие модалок
    ['closeAddFoodModal', 'closeAddToBaseModal', 'closeWeightModal', 'closeProductManagerBtn'].forEach(function(id) {
        var btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function() {
                var modalId = id.replace('close', '').replace('Btn', '');
                modalId = modalId.charAt(0).toLowerCase() + modalId.slice(1);
                var modal = document.getElementById(modalId + 'Modal');
                if (modal) modal.style.display = 'none';
            });
        }
    });
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
            div.className = 'product-item';
            div.innerHTML = '<div><div class="product-name">' + name + '</div><div class="product-nutrition">Б:' + nutrition.protein + ' Ж:' + nutrition.fat + ' У:' + nutrition.carbs + ' Ккал:' + nutrition.kcal + '</div></div><span style="font-size:11px;color:#9ba1bc;">📦</span>';
            builtinContainer.appendChild(div);
        }
    }
    
    var customContainer = document.getElementById('custom-products-container');
    if (customContainer) {
        customContainer.innerHTML = '';
        for (var name in state.customProducts) {
            var nutrition = state.customProducts[name];
            var div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = '<div><div class="product-name">' + name + '</div><div class="product-nutrition">Б:' + nutrition.protein + ' Ж:' + nutrition.fat + ' У:' + nutrition.carbs + ' Ккал:' + nutrition.kcal + '</div></div><div class="action-buttons"><button class="round-delete delete-custom-product" data-name="' + name + '">✕</button></div>';
            customContainer.appendChild(div);
        }
    }
}
