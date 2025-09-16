import './style.css';
import WordCloud from 'wordcloud';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};
firebase.initializeApp(firebaseConfig);

function getCssVariables(variableNames) {
    const rootStyles = getComputedStyle(document.documentElement);
    return variableNames.map(name => rootStyles.getPropertyValue(name).trim());
}

function drawWordCloud(wordList) {
    const canvas = document.getElementById('wordcloud-canvas');
    const submissionView = document.getElementById('submission-view');
    const wordcloudView = document.getElementById('wordcloud-view');

    submissionView.classList.add('hidden');
    wordcloudView.classList.remove('hidden');

    if (wordList && wordList.length > 0) {
        const brandColors = getCssVariables(['--wc-color1', '--wc-color2', '--wc-color3', '--wc-color4']);
        WordCloud(canvas, {
            list: wordList,
            fontFamily: 'EB Garamond, serif',
            weightFactor: 12,
            color: function (word, weight) {
              return brandColors[Math.floor(Math.random() * brandColors.length)];
            },
            backgroundColor: 'transparent',
            minRotation: 0,
            maxRotation: 0,
            shuffle: true
        });
    }
}

const submissionForm = document.getElementById('submission-form');
const userInput = document.getElementById('user-input');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const mainContainer = document.getElementById('container');

const API_BASE_URL = 'https://us-central1-lesago.cloudfunctions.net';

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

auth.onAuthStateChanged(async (user) => {
    if (user) {
        userInfo.classList.remove('hidden');
        loginButton.classList.add('hidden');
        userName.textContent = `Selamat datang, ${user.displayName}`;

        const storedWordCloud = sessionStorage.getItem('wordCloudData');
        if (storedWordCloud) {
            drawWordCloud(JSON.parse(storedWordCloud));
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch(`${API_BASE_URL}/getMySubmission`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                userInput.value = data.text || '';
            }
        } catch (error) {
            console.error("Could not fetch last submission:", error);
        }
        
        mainContainer.classList.remove('hidden');

    } else {
        userInfo.classList.add('hidden');
        loginButton.classList.remove('hidden');
        userName.textContent = '';
        mainContainer.classList.add('hidden');
        userInput.value = '';
    }
});

loginButton.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error("Authentication failed:", error);
        });
});

logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('wordCloudData');
    auth.signOut();
});

submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) {
        alert("Kamu harus login untuk mencoba.");
        return;
    }

    const submitButton = submissionForm.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';

        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/addSubmission`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error('Failed to submit and get word cloud data');
        }

        const wordList = await response.json();
        sessionStorage.setItem('wordCloudData', JSON.stringify(wordList));
        drawWordCloud(wordList);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Tampilkan';
    }
});