import { state, saveLocal, syncToCloud } from '../db.js';
import { parseCalories, generateRepOptions, generateEffortOptions } from '../utils/helpers.js';

export function renderExercises() {
    let container = document.getElementById('exercisesContainer');
    if (!container) return;
    container.innerHTML = '';
    
    let exercisesToShow = state.workoutExercisesOrder.filter(ex => state.currentWorkout[ex] && state.currentWorkout[ex].length > 0);
    
    exercisesToShow.forEach((exercise, idx) => {
        let sets = state.currentWorkout[exercise];
        let block = document.createElement('div'); 
        block.className = 'exercise-block';
        block.innerHTML = `
            <div class="exercise-header">
                <div><span class="order-number" data-exercise="${exercise}">${idx + 1}</span><b>${exercise}</b></div>
                <div class="action-buttons"><button class="round-delete delete-exercise-btn" data-exercise="${exercise}">✕</button></div>
            </div>
            <div class="exercise-sets">
                <div class="set-header"><span>№</span><span>Вес</span><span>Тип</span><span>Повт</span><span>Усил</span><span></span></div>
                ${sets.map((s, i) => `
                    <div class="set-row">
                        <span>${i + 1}</span>
                        ${s.type === 'bw' ? 
                            '<div class="weight-display own-weight">—</div>' : 
                            `<input class="set-input weight-value" value="${s.weight}" data-exercise="${exercise}" data-set-idx="${i}" data-field="weight" style="text-align:center;">`}
                        <select class="weight-type-select" data-exercise="${exercise}" data-set-idx="${i}" data-field="type">
                            <option value="kg" ${s.type === 'kg' ? 'selected' : ''}>кг</option>
                            <option value="bw" ${s.type === 'bw' ? 'selected' : ''}>Свой вес</option>
                        </select>
                        <select class="set-input" data-exercise="${exercise}" data-set-idx="${i}" data-field="reps">${generateRepOptions(s.reps)}</select>
                        <select class="set-input" data-exercise="${exercise}" data-set-idx="${i}" data-field="effort">${generateEffortOptions(s.effort)}</select>
                        <button class="delete-set-btn" data-exercise="${exercise}" data-set-idx="${i}">✕</button>
                    </div>
                `).join('')}
                <button class="add-set-btn secondary" data-exercise="${exercise}">+ Подход</button>
            </div>`;
        container.appendChild(block);
    });
    
    if (exercisesToShow.length === 0) container.innerHTML = '<div style="padding:20px;text-align:center;">➕ Упр.</div>';
    
    setupWorkoutEventListeners();
}

function setupWorkoutEventListeners() {
    document.querySelectorAll('.order-number').forEach(el => el.addEventListener('click', () => { 
        state.currentOrderExercise = el.dataset.exercise; 
        document.getElementById('orderExerciseName').innerText = state.currentOrderExercise; 
        document.getElementById('orderNumberInput').value = ''; 
        document.getElementById('orderModal').style.display = 'flex'; 
    }));
    
    document.querySelectorAll('.add-set-btn').forEach(btn => btn.addEventListener('click', () => { 
        let ex = btn.dataset.exercise; 
        if (!state.currentWorkout[ex]) state.currentWorkout[ex] = []; 
        state.currentWorkout[ex].push({ weight: 60, type: 'kg', reps: 8, effort: 7 }); 
        renderExercises(); saveLocal(); syncToCloud(); 
    }));
    
    document.querySelectorAll('.set-input').forEach(inp => inp.addEventListener('change', function() { 
        let exercise = this.dataset.exercise, idx = parseInt(this.dataset.setIdx), field = this.dataset.field; 
        if (state.currentWorkout[exercise] && state.currentWorkout[exercise][idx]) { 
            let value = (field === 'reps' || field === 'effort') ? parseInt(this.value) : parseFloat(this.value); 
            state.currentWorkout[exercise][idx][field] = value; 
            saveLocal(); syncToCloud(); 
        } 
    }));
    
    document.querySelectorAll('.weight-type-select').forEach(sel => sel.addEventListener('change', function() { 
        let exercise = this.dataset.exercise, idx = parseInt(this.dataset.setIdx); 
        if (state.currentWorkout[exercise] && state.currentWorkout[exercise][idx]) { 
            state.currentWorkout[exercise][idx].type = this.value; 
            renderExercises(); saveLocal(); syncToCloud(); 
        } 
    }));
    
    document.querySelectorAll('.delete-set-btn').forEach(btn => btn.addEventListener('click', function() { 
        let exercise = this.dataset.exercise, idx = parseInt(this.dataset.setIdx); 
        if (state.currentWorkout[exercise]) { 
            state.currentWorkout[exercise].splice(idx, 1); 
            if (state.currentWorkout[exercise].length === 0) state.workoutExercisesOrder = state.workoutExercisesOrder.filter(e => e !== exercise); 
            renderExercises(); saveLocal(); syncToCloud(); 
        } 
    }));
    
    document.querySelectorAll('.delete-exercise-btn').forEach(btn => btn.addEventListener('click', function() { 
        let exercise = this.dataset.exercise; 
        if (exercise) { 
            state.currentWorkout[exercise] = []; 
            state.workoutExercisesOrder = state.workoutExercisesOrder.filter(e => e !== exercise); 
            renderExercises(); saveLocal(); syncToCloud(); 
        } 
    }));
}

export function setupWorkoutButtons() {
    document.getElementById('saveAllWorkoutsBtn')?.addEventListener('click', async () => {
        let date = document.getElementById('workoutDate').value;
        if (!date) { alert('Выберите дату'); return; }
        let saved = 0;
        let caloriesValue = parseCalories(document.getElementById('caloriesInput').value);
        for (let ex of state.workoutExercisesOrder) {
            let sets = state.currentWorkout[ex];
            if (sets && sets.length) {
                state.trainingHistory.push({ 
                    id: state.nextId++, date, exercise: ex, 
                    sets: sets.map(s => ({ weight: s.weight, weightType: s.type || 'kg', reps: s.reps, effort: s.effort || 7 })), 
                    calories: caloriesValue 
                });
                saved++;
                state.currentWorkout[ex] = [];
            }
        }
        state.workoutExercisesOrder = [];
        if (saved) { renderExercises(); saveLocal(); await syncToCloud(); document.getElementById('caloriesInput').value = ''; alert(`Сохранено ${saved} упражнений`); }
        else alert('Нет подходов');
    });
}

export function setupExerciseManagement() {
    document.getElementById('showExercisePickerBtn')?.addEventListener('click', () => {
        let container = document.getElementById('exercisePickerList');
        container.innerHTML = '';
        state.customExercises.forEach(ex => { 
            let div = document.createElement('div'); div.className = 'compact-exercise-item'; 
            div.innerHTML = `<span>${ex}</span><button class="small-plus" data-ex="${ex}">+</button>`; 
            container.appendChild(div); 
        });
        document.querySelectorAll('#exercisePickerList .small-plus').forEach(btn => btn.addEventListener('click', () => {
            let exercise = btn.dataset.ex;
            if (!state.currentWorkout[exercise]) state.currentWorkout[exercise] = [];
            if (state.currentWorkout[exercise].length === 0) state.currentWorkout[exercise].push({ weight: 60, type: 'kg', reps: 8, effort: 7 });
            if (!state.workoutExercisesOrder.includes(exercise)) state.workoutExercisesOrder.push(exercise);
            renderExercises(); document.getElementById('exercisePickerModal').style.display = 'none'; saveLocal(); syncToCloud();
        }));
        document.getElementById('exercisePickerModal').style.display = 'flex';
    });

    document.getElementById('confirmOrderBtn')?.addEventListener('click', () => {
        let newPos = parseInt(document.getElementById('orderNumberInput').value);
        if (!state.currentOrderExercise || isNaN(newPos)) { alert('Введите номер'); return; }
        let oldIdx = state.workoutExercisesOrder.indexOf(state.currentOrderExercise);
        if (oldIdx === -1) { document.getElementById('orderModal').style.display = 'none'; return; }
        let newIdx = newPos - 1;
        if (newIdx < 0 || newIdx >= state.workoutExercisesOrder.length) { alert(`Введите число от 1 до ${state.workoutExercisesOrder.length}`); return; }
        if (oldIdx !== newIdx) {
            let moved = state.workoutExercisesOrder[oldIdx];
            state.workoutExercisesOrder.splice(oldIdx, 1);
            state.workoutExercisesOrder.splice(newIdx, 0, moved);
            renderExercises(); saveLocal(); syncToCloud();
        }
        document.getElementById('orderModal').style.display = 'none';
    });
}