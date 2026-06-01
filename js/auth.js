import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth } from './config.js';
import { state, loadFromCloud } from './db.js';
import { getToday } from './utils/helpers.js';
import { renderAll } from './app.js';

export function setupAuth() {
    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() { 
            var email = document.getElementById('loginEmail').value; 
            var password = document.getElementById('loginPassword').value; 
            if (email && password) handleLogin(email, password); 
            else alert('Введите email и пароль'); 
        });
    }

    onAuthStateChanged(auth, function(user) {
        if (user && !state.currentUser) {
            state.currentUser = user;
            document.getElementById('login-page').classList.remove('active-page');
            document.getElementById('app-page').classList.add('active-page');
            document.getElementById('mainTabs').style.display = 'flex';
            loadFromCloud().then(function() { 
                renderAll(); 
                document.getElementById('workoutDate').value = getToday(); 
                document.getElementById('foodDate').value = getToday(); 
            });
        } else if (!user && state.currentUser !== null) {
            state.currentUser = null;
            document.getElementById('login-page').classList.add('active-page');
            document.getElementById('app-page').classList.remove('active-page');
            document.getElementById('mainTabs').style.display = 'none';
        }
    });
}

async function handleLogin(email, password) {
    try {
        var userCredential = await signInWithEmailAndPassword(auth, email, password);
        state.currentUser = userCredential.user;
        document.getElementById('login-page').classList.remove('active-page');
        document.getElementById('app-page').classList.add('active-page');
        document.getElementById('mainTabs').style.display = 'flex';
        await loadFromCloud();
        renderAll();
        document.getElementById('workoutDate').value = getToday();
        document.getElementById('foodDate').value = getToday();
    } catch (error) { alert('Ошибка входа: ' + error.message); }
}
