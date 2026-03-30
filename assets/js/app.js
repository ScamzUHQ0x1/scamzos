const { ipcRenderer } = require('electron');

let currentTab = 'dashboard';
const API_URL = "http://localhost:3000";

function windowControl(action) {
    ipcRenderer.send(`window-${action}`);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active', 'text-white', 'bg-white/5'));
    
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.remove('hidden');
    
    event.currentTarget.classList.add('active', 'text-white', 'bg-white/5');
    currentTab = tabId;
}

async function log(message, type = 'info') {
    const terminal = document.getElementById('terminal');
    const entry = document.createElement('p');
    const time = new Date().toLocaleTimeString();
    entry.className = type === 'error' ? 'text-red-400' : 'text-slate-400';
    entry.innerHTML = `<span class="text-slate-600">[${time}]</span> ${message}`;
    terminal.prepend(entry);
}

document.getElementById('login-btn').addEventListener('click', async () => {
    const token = document.getElementById('token-input').value;
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (data.success) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('bot-name').innerText = data.user.username;
            document.getElementById('connection-status').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> CONNECTÉ`;
            document.getElementById('connection-status').classList.replace('text-slate-500', 'text-emerald-500');
            log(`Connecté en tant que ${data.user.username}`);
            loadGuilds();
        } else {
            alert("Token invalide");
        }
    } catch (err) {
        log("Erreur de connexion au serveur local", "error");
    }
});

async function loadGuilds() {
    try {
        const res = await fetch(`${API_URL}/guilds`);
        const guilds = await res.json();
        const select = document.getElementById('guild-select');
        document.getElementById('guild-count').innerText = guilds.length;
        
        select.innerHTML = guilds.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        log(`${guilds.length} serveurs récupérés`);
    } catch (err) {
        log("Erreur chargement serveurs", "error");
    }
}

document.getElementById('send-msg-btn').addEventListener('click', async () => {
    const channelId = document.getElementById('channel-select').value;
    const content = document.getElementById('message-content').value;

    if (!channelId || !content) return;

    try {
        const res = await fetch(`${API_URL}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId, content })
        });
        
        if (res.ok) {
            log("Message envoyé avec succès");
            document.getElementById('message-content').value = '';
        }
    } catch (err) {
        log("Erreur lors de l'envoi", "error");
    }
});