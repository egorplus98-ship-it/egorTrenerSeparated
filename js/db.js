import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { db } from './config.js';

// Состояние приложения
export let state = {
    currentUser: null,
    foodEntries: [],
    trainingHistory: [],
    customExercises: ["Жим лёжа", "Присед", "Становая тяга", "Тяга штанги", "Жим стоя"],
    currentWorkout: {},
    bodyWeightHistory: [],
    nextId: 1,
    workoutExercisesOrder: [],
    customProducts: {},
    openWorkoutDays: new Set(),
    openFoodDays: new Set(),
    currentOrderExercise: null,
    currentEditWorkoutId: null
};

export function saveLocal() { 
    localStorage.setItem('fitness_data', JSON.stringify({ 
        foodEntries: state.foodEntries, 
        trainingHistory: state.trainingHistory, 
        customExercises: state.customExercises, 
        bodyWeightHistory: state.bodyWeightHistory, 
        nextId: state.nextId, 
        workoutExercisesOrder: state.workoutExercisesOrder, 
        currentWorkout: state.currentWorkout, 
        customProducts: state.customProducts 
    })); 
}

export function loadLocal() { 
    let s = localStorage.getItem('fitness_data'); 
    if (s) { 
        let d = JSON.parse(s); 
        state.foodEntries = d.foodEntries || []; 
        state.trainingHistory = d.trainingHistory || []; 
        state.customExercises = d.customExercises || state.customExercises; 
        state.bodyWeightHistory = d.bodyWeightHistory || []; 
        state.nextId = d.nextId || 1; 
        state.workoutExercisesOrder = d.workoutExercisesOrder || []; 
        state.currentWorkout = d.currentWorkout || {}; 
        state.customProducts = d.customProducts || {}; 
    } 
}

export async function syncToCloud() {
    if (!state.currentUser) return;
    try {
        const userDocRef = doc(db, "users", state.currentUser.uid);
        await setDoc(userDocRef, {
            foodEntries: state.foodEntries,
            trainingHistory: state.trainingHistory,
            customExercises: state.customExercises,
            bodyWeightHistory: state.bodyWeightHistory,
            nextId: state.nextId,
            workoutExercisesOrder: state.workoutExercisesOrder,
            currentWorkout: state.currentWorkout,
            customProducts: state.customProducts,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (e) { console.error("Sync error:", e); }
}

export async function loadFromCloud() {
    if (!state.currentUser) return;
    try {
        const userDocRef = doc(db, "users", state.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            state.foodEntries = data.foodEntries || [];
            state.trainingHistory = data.trainingHistory || [];
            state.customExercises = data.customExercises || state.customExercises;
            state.bodyWeightHistory = data.bodyWeightHistory || [];
            state.nextId = data.nextId || 1;
            state.workoutExercisesOrder = data.workoutExercisesOrder || [];
            state.currentWorkout = data.currentWorkout || {};
            state.customProducts = data.customProducts || {};
        }
    } catch (e) { console.error("Load error:", e); }
}