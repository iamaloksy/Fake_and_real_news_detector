// Screen Management
const screens = {
    home: document.getElementById('homeScreen'),
    analyze: document.getElementById('analyzeScreen'),
    processing: document.getElementById('processingScreen'),
    result: document.getElementById('resultScreen'),
    history: document.getElementById('historyScreen'),
    about: document.getElementById('aboutScreen')
};

let currentScreen = 'home';

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
    currentScreen = screenName;
    
    // Refresh history if showing history screen
    if (screenName === 'history') {
        renderHistory();
    }
}

// Navigation
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const closeMenuBtn = document.getElementById('closeMenuBtn');

function openMenu() {
    sideMenu.classList.add('active');
    overlay.classList.add('active');
}

function closeMenu() {
    sideMenu.classList.remove('active');
    overlay.classList.remove('active');
}

menuBtn.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// Menu Items
document.getElementById('menuHomeBtn').addEventListener('click', () => {
    showScreen('home');
    closeMenu();
});

document.getElementById('menuHistoryBtn').addEventListener('click', () => {
    showScreen('history');
    closeMenu();
});

document.getElementById('menuAboutBtn').addEventListener('click', () => {
    showScreen('about');
    closeMenu();
});

// Button Actions
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const backToAnalyzeBtn = document.getElementById('backToAnalyzeBtn');
const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
const historyBtn = document.getElementById('historyBtn');
const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
const backFromAboutBtn = document.getElementById('backFromAboutBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

startBtn.addEventListener('click', () => showScreen('analyze'));
backBtn.addEventListener('click', () => showScreen('home'));
backToAnalyzeBtn.addEventListener('click', () => showScreen('analyze'));
analyzeAnotherBtn.addEventListener('click', () => {
    document.getElementById('newsInput').value = '';
    showScreen('analyze');
});

historyBtn.addEventListener('click', () => showScreen('history'));
backFromHistoryBtn.addEventListener('click', () => showScreen('home'));
backFromAboutBtn.addEventListener('click', () => showScreen('home'));

clearBtn.addEventListener('click', () => {
    document.getElementById('newsInput').value = '';
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your analysis history?')) {
        localStorage.removeItem('truthlens_history');
        renderHistory();
    }
});

// Analyze Function
analyzeBtn.addEventListener('click', async () => {
    const newsInput = document.getElementById('newsInput').value.trim();
    
    if (!newsInput) {
        alert('Please enter some text to analyze');
        return;
    }

    // Show processing screen
    showScreen('processing');
    createNeuralNetwork();

    try {
        // Call the Python backend API
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: newsInput })
        });

        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (response.ok) {
            const data = await response.json();
            displayResult(data.label, data.confidence, newsInput);
            saveToHistory(newsInput, data.label, data.confidence);
        } else {
            // Fallback: simulate result for demo
            simulateAnalysis(newsInput);
        }
    } catch (error) {
        console.log('Backend not available, using simulation mode');
        // Simulate analysis for demo purposes
        simulateAnalysis(newsInput);
    }
});

// Simulate analysis (for demo when backend is not connected)
function simulateAnalysis(text) {
    // Simple heuristic for demo
    const fakeKeywords = ['shocking', 'unbelievable', 'you won\'t believe', 'secret', 'they don\'t want you to know'];
    const isFake = fakeKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const confidence = Math.random() * 0.2 + (isFake ? 0.7 : 0.8);
    
    const label = isFake ? 'FAKE' : 'REAL';
    displayResult(label, confidence, text);
    saveToHistory(text, label, confidence);
}

// History Management
function saveToHistory(text, label, confidence) {
    const historyItem = {
        text: text,
        label: label,
        confidence: confidence,
        date: new Date().toISOString()
    };

    let history = JSON.parse(localStorage.getItem('truthlens_history') || '[]');
    history.unshift(historyItem); // Add to beginning
    
    // Keep only last 50 items
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    localStorage.setItem('truthlens_history', JSON.stringify(history));
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('truthlens_history') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <p>No analysis history yet.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item ${item.label.toLowerCase()}" onclick="viewHistoryItem('${item.text.replace(/'/g, "\\'")}', '${item.label}', ${item.confidence})">
            <div class="history-header">
                <span class="history-badge ${item.label.toLowerCase()}">${item.label === 'REAL' ? 'Real News' : 'Fake News'}</span>
                <span class="history-date">${new Date(item.date).toLocaleDateString()}</span>
            </div>
            <p class="history-text">${item.text}</p>
        </div>
    `).join('');
}

// Global function to view history item
window.viewHistoryItem = function(text, label, confidence) {
    displayResult(label, confidence, text);
};

// Display Result
function displayResult(label, confidence, originalText) {
    const resultCard = document.getElementById('resultCard');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const confidenceValue = document.getElementById('confidenceValue');
    const excerptText = document.getElementById('excerptText');

    // Update result card styling
    resultCard.className = 'result-card';
    resultIcon.className = 'result-icon';
    
    if (label === 'REAL') {
        resultCard.classList.add('success');
        resultIcon.classList.add('success');
        resultIcon.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        resultTitle.textContent = 'REAL NEWS';
    } else {
        resultCard.classList.add('danger');
        resultIcon.classList.add('danger');
        resultIcon.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        resultTitle.textContent = 'FAKE NEWS DETECTED';
    }

    confidenceValue.textContent = `${(confidence * 100).toFixed(0)}%`;
    
    // Show excerpt (truncate if too long)
    const maxLength = 150;
    excerptText.textContent = originalText.length > maxLength 
        ? originalText.substring(0, maxLength) + '...'
        : originalText;

    showScreen('result');
}

// Neural Network Animation
function createNeuralNetwork() {
    const container = document.getElementById('neuralNetwork');
    container.innerHTML = '';

    const numNodes = 20;
    const nodes = [];

    // Create nodes
    for (let i = 0; i < numNodes; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        
        const angle = (i / numNodes) * Math.PI * 2;
        const radius = 100;
        const x = Math.cos(angle) * radius + 150;
        const y = Math.sin(angle) * radius + 150;
        
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.animationDelay = `${i * 0.1}s`;
        
        container.appendChild(node);
        nodes.push({ element: node, x, y });
    }

    // Create connections
    for (let i = 0; i < numNodes; i++) {
        const node1 = nodes[i];
        const node2 = nodes[(i + 1) % numNodes];
        
        const connection = document.createElement('div');
        connection.className = 'connection';
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        connection.style.width = `${length}px`;
        connection.style.left = `${node1.x}px`;
        connection.style.top = `${node1.y}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.animationDelay = `${i * 0.1}s`;
        
        container.appendChild(connection);
    }

    // Add some random connections
    for (let i = 0; i < 10; i++) {
        const idx1 = Math.floor(Math.random() * numNodes);
        const idx2 = Math.floor(Math.random() * numNodes);
        
        if (idx1 !== idx2) {
            const node1 = nodes[idx1];
            const node2 = nodes[idx2];
            
            const connection = document.createElement('div');
            connection.className = 'connection';
            
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            connection.style.width = `${length}px`;
            connection.style.left = `${node1.x}px`;
            connection.style.top = `${node1.y}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            connection.style.opacity = '0.2';
            connection.style.animationDelay = `${i * 0.15}s`;
            
            container.appendChild(connection);
        }
    }
}

// Circuit Background Animation
function createCircuitPattern() {
    const circuitBg = document.getElementById('circuitBg');
    if (!circuitBg) return;

    // Add animated circuit lines
    for (let i = 0; i < 5; i++) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.height = '2px';
        line.style.background = `linear-gradient(90deg, transparent, ${i % 2 ? '#4facfe' : '#9b51e0'}, transparent)`;
        line.style.width = `${Math.random() * 200 + 100}px`;
        line.style.top = `${Math.random() * 100}%`;
        line.style.left = `${Math.random() * 100}%`;
        line.style.opacity = '0.3';
        line.style.animation = `float ${3 + Math.random() * 2}s ease-in-out infinite`;
        line.style.animationDelay = `${Math.random() * 2}s`;
        circuitBg.appendChild(line);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createCircuitPattern();
});

// Read Source Button (placeholder)
document.getElementById('readSourceBtn')?.addEventListener('click', () => {
    alert('This would open the original article source in a new tab');
});



// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to go back
    if (e.key === 'Escape') {
        if (currentScreen === 'analyze') {
            showScreen('home');
        } else if (currentScreen === 'result') {
            showScreen('analyze');
        }
        closeMenu();
    }
    
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentScreen === 'analyze') {
            analyzeBtn.click();
        }
    }
});
