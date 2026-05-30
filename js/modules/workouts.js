import { state, saveLocal, syncToCloud } from '../db.js';
import { parseCalories, generateRepOptions, generateEffortOptions } from '../utils/helpers.js';

// Таймер отдыха
let restTimerInterval = null;
let restSeconds = 0;
let restTimerActive = false;

export function renderExercises() {
    var container = document.getElementById('exercisesContainer');
    if (!container) return;
    container.innerHTML = '';
    
    var exercisesToShow = state.workoutExercisesOrder.filter(function(ex) { 
        return state.currentWorkout[ex] && state.currentWorkout[ex].length > 0; 
    });
    
    exercisesToShow.forEach(function(exercise, idx) {
        var sets = state.currentWorkout[exercise];
        var block = document.createElement('div'); 
        block.className = 'exercise-block';
        
        var setsHtml = '';
        sets.forEach(function(s, i) {
            setsHtml += '<div class="set-row">' +
                '<span>' + (i + 1) + '</span>' +
                (s.type === 'bw' ? 
                    '<div class="weight-display own-weight">—</div>' : 
                    '<input class="set-input weight-value" value="' + s.weight + '" data-exercise="' + exercise + '" data-set-idx="' + i + '" data-field="weight" style="text-align:center;">') +
                '<select class="weight-type-select" data-exercise="' + exercise + '" data-set-idx="' + i + '" data-field="type">' +
                    '<option value="kg"' + (s.type === 'kg' ? ' selected' : '') + '>кг</option>' +
                    '<option value="bw"' + (s.type === 'bw' ? ' selected' : '') + '>Свой вес</option>' +
                '</select>' +
                '<select class="set-input" data-exercise="' + exercise + '" data-set-idx="' + i + '" data-field="reps">' + generateRepOptions(s.reps) + '</select>' +
                '<select class="set-input" data-exercise="' + exercise + '" data-set-idx="' + i + '" data-field="effort">' + generateEffortOptions(s.effort) + '</select>' +
                '<div style="display:flex;gap:4px;">' +
                    '<button class="delete-set-btn" data-exercise="' + exercise + '" data-set-idx="' + i + '">✕</button>' +
                    '<button class="rest-timer-btn" data-exercise="' + exercise + '" data-set-idx="' + i + '" style="background:#ff7b2c;border:none;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:10px;color:black;">⏱</button>' +
                '</div>' +
            '</div>';
        });
        
        block.innerHTML = '<div class="exercise-header">' +
            '<div><span class="order-number" data-exercise="' + exercise + '">' + (idx + 1) + '</span><b>' + exercise + '</b></div>' +
            '<div class="action-buttons"><button class="round-delete delete-exercise-btn" data-exercise="' + exercise + '">✕</button></div>' +
        '</div>' +
        '<div class="exercise-sets">' +
            '<div class="set-header"><span>№</span><span>Вес</span><span>Тип</span><span>Повт</span><span>Усил</span><span></span></div>' +
            setsHtml +
            '<button class="add-set-btn secondary" data-exercise="' + exercise + '">+ Подход</button>' +
        '</div>';
        container.appendChild(block);
    });
    
    if (exercisesToShow.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;">➕ Добавь упражнение</div>';
    }
    
    setupWorkoutEventListeners();
}

function setupWorkoutEventListeners() {
    document.querySelectorAll('.order-number').forEach(function(el) {
        el.addEventListener('click', function() { 
            state.currentOrderExercise = el.dataset.exercise; 
            document.getElementById('orderExerciseName').innerText = state.currentOrderExercise; 
            document.getElementById('orderNumberInput').value = ''; 
            document.getElementById('orderModal').style.display = 'flex'; 
        });
    });
    
    document.querySelectorAll('.add-set-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            var ex = btn.dataset.exercise; 
            if (!state.currentWorkout[ex]) state.currentWorkout[ex] = []; 
            state.currentWorkout[ex].push({ weight: 60, type: 'kg', reps: 8, effort: 7 }); 
            renderExercises(); 
            saveLocal(); 
            syncToCloud(); 
        });
    });
    
    document.querySelectorAll('.set-input').forEach(function(inp) {
        inp.addEventListener('change', function() { 
            var exercise = this.dataset.exercise;
            var idx = parseInt(this.dataset.setIdx);
            var field = this.dataset.field; 
            if (state.currentWorkout[exercise] && state.currentWorkout[exercise][idx]) { 
                var value = (field === 'reps' || field === 'effort') ? parseInt(this.value) : parseFloat(this.value); 
                state.currentWorkout[exercise][idx][field] = value; 
                saveLocal(); 
                syncToCloud(); 
            } 
        });
    });
    
    document.querySelectorAll('.weight-type-select').forEach(function(sel) {
        sel.addEventListener('change', function() { 
            var exercise = this.dataset.exercise;
            var idx = parseInt(this.dataset.setIdx); 
            if (state.currentWorkout[exercise] && state.currentWorkout[exercise][idx]) { 
                state.currentWorkout[exercise][idx].type = this.value; 
                renderExercises(); 
                saveLocal(); 
                syncToCloud(); 
            } 
        });
    });
    
    document.querySelectorAll('.delete-set-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            var exercise = this.dataset.exercise;
            var idx = parseInt(this.dataset.setIdx); 
            if (state.currentWorkout[exercise]) { 
                state.currentWorkout[exercise].splice(idx, 1); 
                if (state.currentWorkout[exercise].length === 0) {
                    state.workoutExercisesOrder = state.workoutExercisesOrder.filter(function(e) { return e !== exercise; });
                }
                renderExercises(); 
                saveLocal(); 
                syncToCloud(); 
            } 
        });
    });
    
    document.querySelectorAll('.delete-exercise-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            var exercise = this.dataset.exercise; 
            if (exercise) { 
                state.currentWorkout[exercise] = []; 
                state.workoutExercisesOrder = state.workoutExercisesOrder.filter(function(e) { return e !== exercise; }); 
                renderExercises(); 
                saveLocal(); 
                syncToCloud(); 
            } 
        });
    });
    
    // Кнопки таймера
    document.querySelectorAll('.rest-timer-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (document.getElementById('enableRestTimer').checked) {
                var duration = parseInt(document.getElementById('restTimerDuration').value) || 90;
                startRestTimer(duration);
            }
        });
    });
}

// Таймер отдыха
function startRestTimer(seconds) {
    if (restTimerActive) return;
    restTimerActive = true;
    restSeconds = seconds;
    
    var overlay = document.createElement('div');
    overlay.className = 'rest-timer-overlay';
    overlay.id = 'restTimerOverlay';
    overlay.innerHTML = '<div class="rest-timer-circle" id="restTimerCircle">' + formatTime(restSeconds) + '</div>' +
        '<button id="skipRestTimer" style="margin-top:20px;width:auto;padding:10px 30px;">Пропустить</button>';
    document.body.appendChild(overlay);
    
    document.getElementById('restTimerDisplay').style.display = 'inline';
    document.getElementById('restTimerDisplay').textContent = formatTime(restSeconds);
    
    restTimerInterval = setInterval(function() {
        restSeconds--;
        var circle = document.getElementById('restTimerCircle');
        var display = document.getElementById('restTimerDisplay');
        if (circle) circle.textContent = formatTime(restSeconds);
        if (display) display.textContent = formatTime(restSeconds);
        
        if (restSeconds <= 0) {
            stopRestTimer();
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
    }, 1000);
    
    document.getElementById('skipRestTimer').addEventListener('click', stopRestTimer);
}

function stopRestTimer() {
    restTimerActive = false;
    clearInterval(restTimerInterval);
    var overlay = document.getElementById('restTimerOverlay');
    if (overlay) overlay.remove();
    document.getElementById('restTimerDisplay').style.display = 'none';
}

function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

export function setupWorkoutButtons() {
    document.getElementById('saveAllWorkoutsBtn')?.addEventListener('click', async function() {
        var date = document.getElementById('workoutDate').value;
        if (!date) { alert('Выберите дату'); return; }
        
        var saved = 0;
        var caloriesValue = parseCalories(document.getElementById('caloriesInput').value);
        var feeling = parseInt(document.getElementById('workoutFeeling').value) || 7;
        var notes = document.getElementById('workoutNotes').value.trim();
        
        for (var i = 0; i < state.workoutExercisesOrder.length; i++) {
            var ex = state.workoutExercisesOrder[i];
            var sets = state.currentWorkout[ex];
            if (sets && sets.length) {
                state.trainingHistory.push({ 
                    id: state.nextId++, 
                    date: date, 
                    exercise: ex, 
                    sets: sets.map(function(s) { 
                        return { weight: s.weight, weightType: s.type || 'kg', reps: s.reps, effort: s.effort || 7 }; 
                    }), 
                    calories: caloriesValue,
                    feeling: feeling,
                    notes: notes
                });
                saved++;
                state.currentWorkout[ex] = [];
            }
        }
        
        state.workoutExercisesOrder = [];
        
        if (saved) { 
            renderExercises(); 
            saveLocal(); 
            await syncToCloud(); 
            document.getElementById('caloriesInput').value = ''; 
            document.getElementById('workoutNotes').value = '';
            alert('Сохранено ' + saved + ' упражнений'); 
        } else {
            alert('Нет подходов');
        }
    });
    
    // Сохранение тренировки как шаблон
    document.getElementById('saveAsTemplateBtn')?.addEventListener('click', async function() {
        var name = document.getElementById('newTemplateName').value.trim();
        if (!name) { alert('Введите название шаблона'); return; }
        
        var template = {
            name: name,
            exercises: state.workoutExercisesOrder.map(function(ex) {
                return {
                    name: ex,
                    sets: state.currentWorkout[ex] ? state.currentWorkout[ex].length : 3
                };
            })
        };
        
        if (template.exercises.length === 0) { alert('Добавьте упражнения'); return; }
        
        if (!state.workoutTemplates) state.workoutTemplates = [];
        state.workoutTemplates.push(template);
        saveLocal();
        await syncToCloud();
        document.getElementById('newTemplateName').value = '';
        renderTemplatesList();
        alert('Шаблон сохранён!');
    });
}

export function setupExerciseManagement() {
    document.getElementById('showExercisePickerBtn')?.addEventListener('click', function() {
        var container = document.getElementById('exercisePickerList');
        container.innerHTML = '';
        state.customExercises.forEach(function(ex) { 
            var div = document.createElement('div'); 
            div.className = 'compact-exercise-item'; 
            div.innerHTML = '<span>' + ex + '</span><button class="small-plus" data-ex="' + ex + '">+</button>'; 
            container.appendChild(div); 
        });
        document.querySelectorAll('#exercisePickerList .small-plus').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var exercise = btn.dataset.ex;
                if (!state.currentWorkout[exercise]) state.currentWorkout[exercise] = [];
                if (state.currentWorkout[exercise].length === 0) {
                    state.currentWorkout[exercise].push({ weight: 60, type: 'kg', reps: 8, effort: 7 });
                }
                if (state.workoutExercisesOrder.indexOf(exercise) === -1) {
                    state.workoutExercisesOrder.push(exercise);
                }
                renderExercises(); 
                document.getElementById('exercisePickerModal').style.display = 'none'; 
                saveLocal(); 
                syncToCloud();
            });
        });
        document.getElementById('exercisePickerModal').style.display = 'flex';
    });

    document.getElementById('confirmOrderBtn')?.addEventListener('click', function() {
        var newPos = parseInt(document.getElementById('orderNumberInput').value);
        if (!state.currentOrderExercise || isNaN(newPos)) { alert('Введите номер'); return; }
        var oldIdx = state.workoutExercisesOrder.indexOf(state.currentOrderExercise);
        if (oldIdx === -1) { document.getElementById('orderModal').style.display = 'none'; return; }
        var newIdx = newPos - 1;
        if (newIdx < 0 || newIdx >= state.workoutExercisesOrder.length) { 
            alert('Введите число от 1 до ' + state.workoutExercisesOrder.length); 
            return; 
        }
        if (oldIdx !== newIdx) {
            var moved = state.workoutExercisesOrder[oldIdx];
            state.workoutExercisesOrder.splice(oldIdx, 1);
            state.workoutExercisesOrder.splice(newIdx, 0, moved);
            renderExercises(); 
            saveLocal(); 
            syncToCloud();
        }
        document.getElementById('orderModal').style.display = 'none';
    });
    
    // Шаблоны
    document.getElementById('showTemplatesBtn')?.addEventListener('click', function() {
        renderTemplatesList();
        document.getElementById('templatesModal').style.display = 'flex';
    });
    
    document.getElementById('closeTemplatesBtn')?.addEventListener('click', function() {
        document.getElementById('templatesModal').style.display = 'none';
    });
}

function renderTemplatesList() {
    var container = document.getElementById('templatesList');
    if (!container) return;
    container.innerHTML = '';
    
    if (!state.workoutTemplates || state.workoutTemplates.length === 0) {
        container.innerHTML = '<div style="padding:12px;text-align:center;">Нет шаблонов</div>';
        return;
    }
    
    state.workoutTemplates.forEach(function(tmpl, index) {
        var div = document.createElement('div');
        div.className = 'compact-exercise-item';
        div.innerHTML = '<span><b>' + tmpl.name + '</b> (' + tmpl.exercises.length + ' упр.)</span>' +
            '<div class="action-buttons">' +
                '<button class="small-plus load-template-btn" data-index="' + index + '">📥</button>' +
                '<button class="round-delete delete-template-btn" data-index="' + index + '">✕</button>' +
            '</div>';
        container.appendChild(div);
    });
    
    document.querySelectorAll('.load-template-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var index = parseInt(btn.dataset.index);
            var tmpl = state.workoutTemplates[index];
            state.workoutExercisesOrder = [];
            state.currentWorkout = {};
            
            tmpl.exercises.forEach(function(ex) {
                state.workoutExercisesOrder.push(ex.name);
                state.currentWorkout[ex.name] = [];
                for (var i = 0; i < ex.sets; i++) {
                    state.currentWorkout[ex.name].push({ weight: 0, type: 'kg', reps: 0, effort: 7 });
                }
            });
            
            renderExercises();
            document.getElementById('templatesModal').style.display = 'none';
            saveLocal();
            syncToCloud();
        });
    });
    
    document.querySelectorAll('.delete-template-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var index = parseInt(btn.dataset.index);
            if (confirm('Удалить шаблон "' + state.workoutTemplates[index].name + '"?')) {
                state.workoutTemplates.splice(index, 1);
                saveLocal();
                syncToCloud();
                renderTemplatesList();
            }
        });
    });
}
