import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
    currentEditWorkoutId: null,
    workoutTemplates: [],
    nutritionGoals: { kcal: 2500, protein: 150, fat: 70, carbs: 300 }
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
        customProducts: state.customProducts,
        workoutTemplates: state.workoutTemplates,
        nutritionGoals: state.nutritionGoals
    })); 
}

export function loadLocal() { 
    var s = localStorage.getItem('fitness_data'); 
    if (s) { 
        var d = JSON.parse(s); 
        state.foodEntries = d.foodEntries || []; 
        state.trainingHistory = d.trainingHistory || []; 
        state.customExercises = d.customExercises || state.customExercises; 
        state.bodyWeightHistory = d.bodyWeightHistory || []; 
        state.nextId = d.nextId || 1; 
        state.workoutExercisesOrder = d.workoutExercisesOrder || []; 
        state.currentWorkout = d.currentWorkout || {}; 
        state.customProducts = d.customProducts || {};
        state.workoutTemplates = d.workoutTemplates || [];
        state.nutritionGoals = d.nutritionGoals || { kcal: 2500, protein: 150, fat: 70, carbs: 300 };
    } 
}

export async function syncToCloud() {
    if (!state.currentUser) return;
    try {
        var db = window.db;
        var userDocRef = doc(db, "users", state.currentUser.uid);
        await setDoc(userDocRef, {
            foodEntries: state.foodEntries,
            trainingHistory: state.trainingHistory,
            customExercises: state.customExercises,
            bodyWeightHistory: state.bodyWeightHistory,
            nextId: state.nextId,
            workoutExercisesOrder: state.workoutExercisesOrder,
            currentWorkout: state.currentWorkout,
            customProducts: state.customProducts,
            workoutTemplates: state.workoutTemplates,
            nutritionGoals: state.nutritionGoals,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (e) { console.error("Sync error:", e); }
}

export async function loadFromCloud() {
    if (!state.currentUser) return;
    try {
        var db = window.db;
        var userDocRef = doc(db, "users", state.currentUser.uid);
        var docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            var data = docSnap.data();
            state.foodEntries = data.foodEntries || [];
            state.trainingHistory = data.trainingHistory || [];
            state.customExercises = data.customExercises || state.customExercises;
            state.bodyWeightHistory = data.bodyWeightHistory || [];
            state.nextId = data.nextId || 1;
            state.workoutExercisesOrder = data.workoutExercisesOrder || [];
            state.currentWorkout = data.currentWorkout || {};
            state.customProducts = data.customProducts || {};
            state.workoutTemplates = data.workoutTemplates || [];
            state.nutritionGoals = data.nutritionGoals || { kcal: 2500, protein: 150, fat: 70, carbs: 300 };
        }
    } catch (e) { console.error("Load error:", e); }
}
