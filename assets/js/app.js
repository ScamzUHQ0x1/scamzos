const API_URL = "https://pulse-os-backend.onrender.com";
const { ipcRenderer } = require('electron');

let currentTab = 'dashboard';

function windowControl(action) {
    ipcRenderer.send(`window-${action}`);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active', 'text-white', 'bg-white/5'));
    
    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.remove('hidden');
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active', 'text-white', 'bg-white/5');
    }
    currentTab = tabId;
}

async function log(message, type = 'info') {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    const entry = document.createElement('p');
    const time = new Date().toLocaleTimeString();
    entry.className = type === 'error' ? 'text-red-400' : 'text-slate-400';
    entry.innerHTML = `<span class="text-slate-600">[${time}]</span> ${message}`;
    terminal.prepend(entry);
}

// GESTION DU LOGIN
document.getElementById('login-btn').addEventListener('click', async () => {
    const tokenInput = document.getElementById('token-input');
    const token = tokenInput.value;

    if (!token) {
        alert("Veuillez entrer un token");
        return;
    }

    console.log("Tentative de login avec le serveur...");
    
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
            log(`Connecté : ${data.user.username}`);
            loadGuilds();
        } else {
            alert("Token invalide");
        }
    } catch (err) {
        console.error("Erreur Fetch:", err);
        alert("Erreur de liaison avec le serveur Render. Vérifiez qu'il est bien 'Live'.");
    }
});

async function loadGuilds() {
    try {
        const res = await fetch(`${API_URL}/guilds`);
        const guilds = await res.json();
        
        document.getElementById('guild-count').innerText = guilds.length;
        const container = document.getElementById('tab-serveurs');
        
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                ${guilds.map(g => `
                    <div class="bg-[#0d1117] border border-white/5 rounded-2xl p-6 flex flex-col items-center group hover:border-purple-500/50 transition-all">
                        <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-20 h-20 rounded-2xl mb-4 shadow-2xl group-hover:scale-105 transition-transform">
                        <h3 class="text-white font-bold text-lg mb-1">${g.name}</h3>
                        <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-4">ID: ${g.id}</p>
                        <button onclick="openServerEditor('${g.id}', '${g.name.replace(/'/g, "\\'")}')" class="w-full py-3 bg-white/5 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all uppercase tracking-tighter">
                            Ouvrir l'Éditeur
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        log("Erreur serveurs", "error");
    }
}

async function openServerEditor(guildId, guildName) {
    const container = document.getElementById('tab-serveurs');
    container.innerHTML = `<div class="p-8 text-center text-purple-500">Chargement...</div>`;

    try {
        const res = await fetch(`${API_URL}/guilds/${guildId}/data`);
        const data = await res.json();

        container.innerHTML = `
            <div class="p-8 space-y-8">
                <div class="flex items-center gap-4 mb-8">
                    <button onclick="loadGuilds()" class="p-2 hover:text-purple-500 transition-colors"><i class="fa-solid fa-arrow-left"></i> Retour</button>
                    <h2 class="text-2xl font-black text-white uppercase tracking-tighter">${guildName}</h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-[#0d1117] rounded-2xl border border-white/5 p-6">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Salons Textuels</h3>
                        <div class="space-y-3">
                            ${data.channels.map(c => `
                                <div class="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span class="text-white font-medium text-sm"># ${c.name}</span>
                                    <div class="flex gap-2">
                                        <button onclick="renameChannel('${c.id}')" class="p-2 hover:text-purple-400 transition-colors"><i class="fa-solid fa-pen"></i></button>
                                        <button onclick="deleteChannel('${c.id}', '${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="p-2 hover:text-red-400 transition-colors"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bg-[#0d1117] rounded-2xl border border-white/5 p-6">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Rôles</h3>
                        <div class="space-y-2">
                            ${data.roles.map(r => `
                                <div class="flex items-center gap-3 bg-white/5 p-3 rounded-lg border-l-4" style="border-left-color: ${r.color ? '#' + r.color.toString(16).padStart(6, '0') : '#475569'}">
                                    <span class="text-sm text-white">${r.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (err) {
        console.error(err);
    }
}

async function renameChannel(id) {
    const newName = prompt("Nouveau nom du salon :");
    if (!newName) return;
    await fetch(`${API_URL}/channels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
    });
    alert("Action effectuée.");
}

async function deleteChannel(id, guildId, guildName) {
    if (!confirm("Voulez-vous supprimer ce salon ?")) return;
    await fetch(`${API_URL}/channels/${id}`, { method: 'DELETE' });
    openServerEditor(guildId, guildName);
}