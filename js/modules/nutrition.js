// js/modules/nutrition.js

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

function getAllProducts() { 
    return { ...builtinProducts, ...state.customProducts }; 
}

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
    state.foodEntries.push({ 
        id: Date.now(), 
        date, 
        name, 
        weight, 
        protein: nutrition.protein * ratio, 
        fat: nutrition.fat * ratio, 
        carbs: nutrition.carbs * ratio, 
        kcal: nutrition.kcal * ratio 
    });
    renderFoodList(); 
    updateFoodCharts(); 
    saveLocal(); 
    await syncToCloud();
}

export function renderFoodList() {
    let date = document.getElementById('foodDate').value || getToday();
    let filtered = state.foodEntries.filter(f => f.date === date);
    let container = document.getElementById('foodListContainer');
    
    if (!filtered.length) { 
        container.innerHTML = '<div style="padding:20px;text-align:center;">— Ничего не добавлено —</div>'; 
        updateDailySummary(filtered); 
        return; 
    }
    
    container.innerHTML = '';
    filtered.forEach(item => {
        let div = document.createElement('div'); 
        div.className = 'food-item';
        div.innerHTML = `<div><b>${item.name}</b><br>${item.weight}г | Б:${item.protein.toFixed(1)} Ж:${item.fat.toFixed(1)} У:${item.carbs.toFixed(1)}</div><div>${Math.round(item.kcal)} ккал</div><button class="round-delete" data-id="${item.id}">✕</button>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.food-item .round-delete').forEach(btn => btn.addEventListener('click', async () => {
        let id = parseInt(btn.dataset.id);
        state.foodEntries = state.foodEntries.filter(f => f.id !== id);
        renderFoodList(); 
        updateFoodCharts(); 
        saveLocal(); 
        await syncToCloud();
    }));
    
    updateDailySummary(filtered);
}

function updateDailySummary(list) {
    let total = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    list.forEach(f => { 
        total.kcal += f.kcal; 
        total.protein += f.protein; 
        total.fat += f.fat; 
        total.carbs += f.carbs; 
    });
    
    const sumKcal = document.getElementById('sumKcal');
    const sumProtein = document.getElementById('sumProtein');
    const sumFat = document.getElementById('sumFat');
    const sumCarbs = document.getElementById('sumCarbs');
    
    if (sumKcal) sumKcal.innerText = Math.round(total.kcal);
    if (sumProtein) sumProtein.innerText = total.protein.toFixed(1);
    if (sumFat) sumFat.innerText = total.fat.toFixed(1);
    if (sumCarbs) sumCarbs.innerText = total.carbs.toFixed(1);
}

export function setupNutritionButtons() {
    // Поиск продуктов
    document.getElementById('searchProductBtn')?.addEventListener('click', () => {
        let query = document.getElementById('productSearchInput').value.trim();
        if (!query) return;
        let results = findProductInDatabase(query);
        let container = document.getElementById('searchResults');
        container.innerHTML = '';
        if (results.length === 0) { 
            container.innerHTML = '<div style="padding:12px; text-align:center;">❌ Ничего не найдено</div>'; 
            return; 
        }
        results.forEach(result => {
            let div = document.createElement('div');
            div.className = 'compact-exercise-item';
            div.innerHTML = `<span>${result.name}</span><button class="small-plus select-product-btn" data-name="${result.name}" data-protein="${result.nutrition.protein}" data-fat="${result.nutrition.fat}" data-carbs="${result.nutrition.carbs}" data-kcal="${result.nutrition.kcal}">+</button>`;
            container.appendChild(div);
        });
        document.querySelectorAll('.select-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const nutrition = { 
                    protein: parseFloat(btn.dataset.protein), 
                    fat: parseFloat(btn.dataset.fat), 
                    carbs: parseFloat(btn.dataset.carbs), 
                    kcal: parseFloat(btn.dataset.kcal) 
                };
                showWeightModal(name, nutrition);
                document.getElementById('productSearchInput').value = '';
                container.innerHTML = '';
            });
        });
    });

    // Ручное добавление продукта в еду
    document.getElementById('addManualFoodBtn')?.addEventListener('click', () => { 
        document.getElementById('addFoodModal').style.display = 'flex'; 
    });
    
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
            document.getElementById('manualFoodName').value = '';
            document.getElementById('manualFoodWeight').value = '100';
            document.getElementById('manualFoodProtein').value = '';
            document.getElementById('manualFoodFat').value = '';
            document.getElementById('manualFoodCarbs').value = '';
            document.getElementById('manualFoodKcal').value = '';
        } else {
            alert('Заполните название и вес');
        }
    });

    // Добавление в базу продуктов
    document.getElementById('addToBaseBtn')?.addEventListener('click', () => { 
        document.getElementById('addToBaseModal').style.display = 'flex'; 
    });
    
    document.getElementById('confirmAddToBaseBtn')?.addEventListener('click', async () => {
        let name = document.getElementById('baseProductName').value.trim();
        let p = parseFloat(document.getElementById('baseProductProtein').value) || 0;
        let f = parseFloat(document.getElementById('baseProductFat').value) || 0;
        let c = parseFloat(document.getElementById('baseProductCarbs').value) || 0;
        let kcal = parseFloat(document.getElementById('baseProductKcal').value) || (p * 4 + f * 9 + c * 4);
        if (name) {
            state.customProducts[name] = { protein: p, fat: f, carbs: c, kcal };
            saveLocal(); 
            await syncToCloud();
            document.getElementById('addToBaseModal').style.display = 'none';
            document.getElementById('baseProductName').value = '';
            document.getElementById('baseProductProtein').value = '';
            document.getElementById('baseProductFat').value = '';
            document.getElementById('baseProductCarbs').value = '';
            document.getElementById('baseProductKcal').value = '';
            alert(`Продукт "${name}" добавлен в базу!`);
        } else {
            alert('Введите название продукта');
        }
    });

    // Модальное окно веса
    document.getElementById('confirmWeightBtn')?.addEventListener('click', async () => {
        let w = parseFloat(document.getElementById('selectedWeight').value);
        if (w > 0 && window._selectedNutrition && window._selectedProduct) {
            await addFoodItem(window._selectedProduct, w, window._selectedNutrition);
            document.getElementById('weightModal').style.display = 'none';
        }
    });

    // Редактирование продукта
    document.getElementById('saveEditedProductBtn')?.addEventListener('click', async () => {
        const oldName = document.getElementById('editProductOldName').value;
        const newName = document.getElementById('editProductName').value.trim();
        const protein = parseFloat(document.getElementById('editProductProtein').value) || 0;
        const fat = parseFloat(document.getElementById('editProductFat').value) || 0;
        const carbs = parseFloat(document.getElementById('editProductCarbs').value) || 0;
        const kcal = parseFloat(document.getElementById('editProductKcal').value) || (protein * 4 + fat * 9 + carbs * 4);
        
        if (newName) {
            if (builtinProducts[oldName]) {
                alert('Встроенные продукты нельзя редактировать. Скопируйте данные в свой продукт.');
            } else {
                if (oldName !== newName) delete state.customProducts[oldName];
                state.customProducts[newName] = { protein, fat, carbs, kcal };
                saveLocal(); 
                await syncToCloud();
                alert(`Продукт "${newName}" обновлён!`);
            }
            document.getElementById('editCustomProductModal').style.display = 'none';
        } else {
            alert('Введите название');
        }
    });

    // Дата в питании
    document.getElementById('foodDate')?.addEventListener('change', () => renderFoodList());
}

export function showWeightModal(productName, nutrition) {
    const weightProductName = document.getElementById('weightProductName');
    const selectedWeight = document.getElementById('selectedWeight');
    
    if (weightProductName) weightProductName.innerText = productName;
    if (selectedWeight) selectedWeight.value = 100;
    
    window._selectedNutrition = nutrition;
    window._selectedProduct = productName;
    
    document.getElementById('weightModal').style.display = 'flex';
}

export function renderProductManagerLists() {
    // Встроенные продукты
    const builtinContainer = document.getElementById('builtin-products-container');
    if (builtinContainer) {
        builtinContainer.innerHTML = '';
        for (let [name, nutrition] of Object.entries(builtinProducts)) {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div>
                    <div class="product-name">${name}</div>
                    <div class="product-nutrition">Б:${nutrition.protein} Ж:${nutrition.fat} У:${nutrition.carbs} Ккал:${nutrition.kcal}</div>
                </div>
                <div class="action-buttons">
                    <button class="round-edit edit-builtin-product" data-name="${name}" data-protein="${nutrition.protein}" data-fat="${nutrition.fat}" data-carbs="${nutrition.carbs}" data-kcal="${nutrition.kcal}">✏️</button>
                    <span style="font-size:11px; color:#9ba1bc;">📦</span>
                </div>
            `;
            builtinContainer.appendChild(div);
        }
        
        document.querySelectorAll('.edit-builtin-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                document.getElementById('editProductOldName').value = name;
                document.getElementById('editProductName').value = name;
                document.getElementById('editProductProtein').value = btn.dataset.protein;
                document.getElementById('editProductFat').value = btn.dataset.fat;
                document.getElementById('editProductCarbs').value = btn.dataset.carbs;
                document.getElementById('editProductKcal').value = btn.dataset.kcal;
                document.getElementById('editCustomProductModal').style.display = 'flex';
            });
        });
    }
    
    // Пользовательские продукты
    const customContainer = document.getElementById('custom-products-container');
    if (customContainer) {
        customContainer.innerHTML = '';
        for (let [name, nutrition] of Object.entries(state.customProducts)) {
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div>
                    <div class="product-name">${name}</div>
                    <div class="product-nutrition">Б:${nutrition.protein} Ж:${nutrition.fat} У:${nutrition.carbs} Ккал:${nutrition.kcal}</div>
                </div>
                <div class="action-buttons">
                    <button class="round-edit edit-custom-product" data-name="${name}">✏️</button>
                    <button class="round-delete delete-custom-product" data-name="${name}">✕</button>
                </div>
            `;
            customContainer.appendChild(div);
        }
        
        document.querySelectorAll('.edit-custom-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const product = state.customProducts[name];
                if (product) {
                    document.getElementById('editProductOldName').value = name;
                    document.getElementById('editProductName').value = name;
                    document.getElementById('editProductProtein').value = product.protein;
                    document.getElementById('editProductFat').value = product.fat;
                    document.getElementById('editProductCarbs').value = product.carbs;
                    document.getElementById('editProductKcal').value = product.kcal;
                    document.getElementById('editCustomProductModal').style.display = 'flex';
                }
            });
        });
        
        document.querySelectorAll('.delete-custom-product').forEach(btn => {
            btn.addEventListener('click', async () => {
                const name = btn.dataset.name;
                if (confirm(`Удалить продукт "${name}"?`)) {
                    delete state.customProducts[name];
                    saveLocal(); 
                    await syncToCloud();
                    renderProductManagerLists();
                }
            });
        });
    }
    
    // Вкладки в менеджере продуктов
    document.querySelectorAll('.products-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.products-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.productsTab;
            if (tab === 'builtin') {
                document.getElementById('builtin-products-container').style.display = 'block';
                document.getElementById('custom-products-container').style.display = 'none';
            } else {
                document.getElementById('builtin-products-container').style.display = 'none';
                document.getElementById('custom-products-container').style.display = 'block';
            }
        });
    });
}
