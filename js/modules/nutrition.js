import { state, saveLocal, syncToCloud } from '../db.js';
import { getToday } from '../utils/helpers.js';
import { builtinProducts } from '../utils/constants.js';

// Импортируем updateFoodCharts из charts.js
import { updateFoodCharts } from './charts.js';

function getAllProducts() { return { ...builtinProducts, ...state.customProducts }; }

function findProductInDatabase(query) {
    const lowerQuery = query.toLowerCase().trim();
    const allProducts = getAllProducts();
    const results = [];
    for (let [product, nutrition] of Object.entries(allProducts)) {
        if (product.toLowerCase().includes(lowerQuery)) {
            results.push({ name: product, nutrition, source: builtinProducts[product] ? 'builtin' : 'custom' });
        }
    }
    return results;
}

export async function addFoodItem(name, weight, nutrition) {
    const date = document.getElementById('foodDate').value || getToday();
    const ratio = weight / 100;
    state.foodEntries.push({ id: Date.now(), date, name, weight, protein: nutrition.protein * ratio, fat: nutrition.fat * ratio, carbs: nutrition.carbs * ratio, kcal: nutrition.kcal * ratio });
    renderFoodList(); updateFoodCharts(); saveLocal(); await syncToCloud();
}

export function renderFoodList() {
    let date = document.getElementById('foodDate').value || getToday();
    let filtered = state.foodEntries.filter(f => f.date === date);
    let container = document.getElementById('foodListContainer');
    if (!filtered.length) { container.innerHTML = '<div style="padding:20px;text-align:center;">— Ничего не добавлено —</div>'; updateDailySummary(filtered); return; }
    container.innerHTML = '';
    filtered.forEach(item => {
        let div = document.createElement('div'); div.className = 'food-item';
        div.innerHTML = `<div><b>${item.name}</b><br>${item.weight}г | Б:${item.protein.toFixed(1)} Ж:${item.fat.toFixed(1)} У:${item.carbs.toFixed(1)}</div><div>${Math.round(item.kcal)} ккал</div><button class="round-delete" data-id="${item.id}">✕</button>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.food-item .round-delete').forEach(btn => btn.addEventListener('click', async () => {
        let id = parseInt(btn.dataset.id);
        state.foodEntries = state.foodEntries.filter(f => f.id !== id);
        renderFoodList(); updateFoodCharts(); saveLocal(); await syncToCloud();
    }));
    updateDailySummary(filtered);
}

function updateDailySummary(list) {
    let total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    list.forEach(f => { total.kcal += f.kcal; total.protein += f.protein; total.fat += f.fat; total.carbs += f.carbs; });
    document.getElementById('sumKcal').innerText = Math.round(total.kcal);
    document.getElementById('sumProtein').innerText = total.protein.toFixed(1);
    document.getElementById('sumFat').innerText = total.fat.toFixed(1);
    document.getElementById('sumCarbs').innerText = total.carbs.toFixed(1);
}

export function setupNutritionButtons() {
    document.getElementById('searchProductBtn')?.addEventListener('click', () => {
        let query = document.getElementById('productSearchInput').value.trim();
        if (!query) return;
        let results = findProductInDatabase(query);
        let container = document.getElementById('searchResults');
        container.innerHTML = '';
        if (results.length === 0) { container.innerHTML = '<div style="padding:12px; text-align:center;">❌ Ничего не найдено</div>'; return; }
        results.forEach(result => {
            let div = document.createElement('div');
            div.className = 'compact-exercise-item';
            div.innerHTML = `<span>${result.name}</span><button class="small-plus select-product-btn" data-name="${result.name}" data-protein="${result.nutrition.protein}" data-fat="${result.nutrition.fat}" data-carbs="${result.nutrition.carbs}" data-kcal="${result.nutrition.kcal}">+</button>`;
            container.appendChild(div);
        });
        document.querySelectorAll('.select-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const nutrition = { protein: parseFloat(btn.dataset.protein), fat: parseFloat(btn.dataset.fat), carbs: parseFloat(btn.dataset.carbs), kcal: parseFloat(btn.dataset.kcal) };
                showWeightModal(name, nutrition);
                document.getElementById('productSearchInput').value = '';
                container.innerHTML = '';
            });
        });
    });

    document.getElementById('addManualFoodBtn')?.addEventListener('click', () => { document.getElementById('addFoodModal').style.display = 'flex'; });
    document.getElementById('confirmAddFoodBtn')?.addEventListener('click', async () => {
        let name = document.getElementById('manualFoodName').value.trim();
        let w = parseFloat(document.getElementById('manualFoodWeight').value);
        let p = parseFloat(document.getElementById('manualFoodProtein').value) || 0;
        let f = parseFloat(document.getElementById('manualFoodFat').value) || 0;
        let c = parseFloat(document.getElementById('manualFoodCarbs').value) || 0;
        let kcal = parseFloat(document.getElementById('manualFoodKcal').value) || (p * 4 + f * 9 + c * 4);
        if (name && w) {
            await addFoodItem(name, w, { protein: p, fat: f, carbs: c, kcal });
            document.getElementById('addFoodModal').style.display = 'none';
        } else alert('Заполните название и вес');
    });

    document.getElementById('addToBaseBtn')?.addEventListener('click', () => { document.getElementById('addToBaseModal').style.display = 'flex'; });
    document.getElementById('confirmAddToBaseBtn')?.addEventListener('click', async () => {
        let name = document.getElementById('baseProductName').value.trim();
        let p = parseFloat(document.getElementById('baseProductProtein').value) || 0;
        let f = parseFloat(document.getElementById('baseProductFat').value) || 0;
        let c = parseFloat(document.getElementById('baseProductCarbs').value) || 0;
        let kcal = parseFloat(document.getElementById('baseProductKcal').value) || (p * 4 + f * 9 + c * 4);
        if (name) {
            state.customProducts[name] = { protein: p, fat: f, carbs: c, kcal };
            saveLocal(); await syncToCloud();
            document.getElementById('addToBaseModal').style.display = 'none';
            alert(`Продукт "${name}" добавлен в базу!`);
        } else alert('Введите название продукта');
    });
}

export function showWeightModal(productName, nutrition) {
    document.getElementById('weightProductName').innerText = productName;
    document.getElementById('selectedWeight').value = 100;
    window._selectedNutrition = nutrition;
    window._selectedProduct = productName;
    document.getElementById('weightModal').style.display = 'flex';
}
