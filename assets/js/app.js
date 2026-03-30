const { ipcRenderer } = require('electron');

let BOT_TOKEN = null;
let currentGuilds = [];

const PERMISSIONS_LIST = [
    { id: 'view', name: 'Voir le salon', bit: 0x400n },
    { id: 'manage_ch', name: 'Gérer le salon', bit: 0x10n },
    { id: 'manage_perm', name: 'Gérer les permissions', bit: 0x10000000n },
    { id: 'send', name: 'Envoyer messages', bit: 0x800n },
    { id: 'embed', name: 'Intégrer des liens', bit: 0x4000n },
    { id: 'files', name: 'Joindre des fichiers', bit: 0x8000n },
    { id: 'history', name: 'Voir l\'ancienneté', bit: 0x10000n },
    { id: 'reactions', name: 'Ajouter des réactions', bit: 0x40n },
    { id: 'connect', name: 'Se connecter', bit: 0x100000n },
    { id: 'speak', name: 'Parler', bit: 0x200000n },
    { id: 'video', name: 'Vidéo / Stream', bit: 0x200n }
];

async function discordRequest(endpoint, method = 'GET', body = null) {
    const tokenToUse = BOT_TOKEN || document.getElementById('token-input')?.value.trim();
    if (!tokenToUse) return null;
    try {
        const result = await ipcRenderer.invoke('discord-request', {
            endpoint, method, body, token: tokenToUse
        });
        return result.success ? (result.data || true) : null;
    } catch (e) { return null; }
}

function initApp() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const token = document.getElementById('token-input').value.trim();
            const result = await discordRequest('/users/@me', 'GET');
            if (result) {
                BOT_TOKEN = token;
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('bot-name').innerText = result.username;
                document.getElementById('connection-status').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE`;
                loadInitialData();
            }
        });
    }
    ['dashboard', 'serveurs', 'messenger', 'promo'].forEach(id => {
        const btn = document.getElementById(`nav-${id}`);
        if (btn) btn.onclick = () => switchTab(id);
    });
    renderMessengerUI();
}

async function loadInitialData() {
    const guilds = await discordRequest('/users/@me/guilds');
    if (guilds) {
        currentGuilds = guilds;
        renderGuilds(guilds);
        updateMessengerServers(guilds);
    }
}

function renderGuilds(guilds) {
    const container = document.getElementById('tab-serveurs');
    if (!container) return;
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        ${guilds.map(g => `
            <div class="bg-[#0d1117] border border-white/5 rounded-2xl p-6 flex flex-col items-center group hover:border-purple-500/50 transition-all">
                <img src="${g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-20 h-20 rounded-2xl mb-4 shadow-2xl">
                <h3 class="text-white font-bold text-lg mb-1 text-center truncate w-full">${g.name}</h3>
                <button onclick="window.openEditor('${g.id}', '${g.name.replace(/'/g, "\\'")}')" class="w-full py-3 bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white rounded-xl text-[10px] font-black transition-all mt-4 uppercase tracking-widest">Gérer</button>
            </div>
        `).join('')}
    </div>`;
}

window.openEditor = async function(guildId, guildName) {
    const container = document.getElementById('tab-serveurs');
    container.innerHTML = `<div class="p-20 text-center animate-pulse text-[10px] font-black text-purple-500 uppercase italic">Synchronisation...</div>`;
    const [channels, roles] = await Promise.all([
        discordRequest(`/guilds/${guildId}/channels`),
        discordRequest(`/guilds/${guildId}/roles`)
    ]);

    const categories = channels.filter(c => c.type === 4).sort((a, b) => a.position - b.position);
    const orphanChannels = channels.filter(c => !c.parent_id && c.type !== 4).sort((a, b) => a.position - b.position);

    const renderChannel = (c) => `
        <div class="channel-item flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-purple-500/30 transition-all cursor-grab" draggable="true" ondragstart="window.handleDragStart(event)" data-id="${c.id}">
            <span class="text-xs font-bold text-slate-300 font-mono italic uppercase tracking-tighter">${c.type === 2 ? 'VOICE' : 'TEXT'} : ${c.name}</span>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onclick="window.showChannelModal('${guildId}', '${guildName.replace(/'/g, "\\'")}', '${c.id}')" class="p-2 text-purple-500 hover:text-purple-400"><i class="fa-solid fa-gear text-xs"></i></button>
                <button onclick="window.deleteObject('channels', '${c.id}', '${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="p-2 text-red-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="p-8 animate-in fade-in duration-500">
            <div class="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                <div class="flex items-center gap-4">
                    <button onclick="loadInitialData()" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-purple-600 transition-all text-white"><i class="fa-solid fa-chevron-left"></i></button>
                    <h2 class="text-2xl font-black uppercase italic text-white tracking-tighter">${guildName}</h2>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.showRoleModal('${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl border border-white/5 uppercase italic tracking-widest">Nouveau Rôle</button>
                    <button onclick="window.showCategoryModal('${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl border border-white/5 uppercase italic tracking-widest">Nouvelle Catégorie</button>
                    <button onclick="window.showChannelModal('${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black rounded-xl uppercase italic tracking-widest">+ Nouveau Salon</button>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div id="category-list" class="bg-black/20 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                    <div class="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar" ondragover="window.handleDragOver(event)" ondrop="window.handleCategoryGlobalDrop(event, '${guildId}', '${guildName.replace(/'/g, "\\'")}')">
                        <div class="category-group space-y-3" data-id="null" draggable="false">
                            <div class="flex justify-between items-center px-2 border-l-2 border-slate-500/30 pl-4">
                                <span class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Orphelins</span>
                            </div>
                            <div class="channel-list space-y-2 min-h-[40px]" data-parent="null" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event, '${guildId}', '${guildName.replace(/'/g, "\\'")}')">
                                ${orphanChannels.map(c => renderChannel(c)).join('')}
                            </div>
                        </div>
                        ${categories.map(cat => `
                            <div class="category-group space-y-3 cursor-move" data-id="${cat.id}" draggable="true" ondragstart="window.handleCategoryDragStart(event)">
                                <div class="flex justify-between items-center px-2 border-l-2 border-purple-500 pl-4 pointer-events-none">
                                    <span class="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] italic">${cat.name}</span>
                                    <button onclick="event.stopPropagation(); window.deleteObject('channels', '${cat.id}', '${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="text-slate-600 hover:text-red-500 transition-all pointer-events-auto"><i class="fa-solid fa-xmark text-xs"></i></button>
                                </div>
                                <div class="channel-list space-y-2 min-h-[40px]" data-parent="${cat.id}" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event, '${guildId}', '${guildName.replace(/'/g, "\\'")}')">
                                    ${channels.filter(c => c.parent_id === cat.id).sort((a,b) => a.position - b.position).map(c => renderChannel(c)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-black/20 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] italic">Rôles du serveur</span>
                        <button onclick="window.showRoleModal('${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="p-2 bg-purple-600/20 hover:bg-purple-600 text-purple-500 hover:text-white rounded-lg transition-all">
                            <i class="fa-solid fa-plus text-[10px]"></i>
                        </button>
                    </div>
                    <div id="role-list" class="space-y-3 overflow-y-auto max-h-[500px] custom-scrollbar" ondragover="window.handleDragOver(event)" ondrop="window.handleRoleDrop(event, '${guildId}', '${guildName.replace(/'/g, "\\'")}')">
                        ${roles.sort((a,b) => b.position - a.position).map(r => `
                            <div class="role-item p-4 bg-white/[0.02] rounded-2xl border-l-4 flex items-center justify-between transition-all group hover:bg-white/[0.04] cursor-move" draggable="true" ondragstart="window.handleRoleDragStart(event)" data-id="${r.id}" style="border-color: #${(r.color || 0).toString(16).padStart(6, '0')}">
                                <span class="text-[10px] font-black uppercase text-white tracking-widest italic">${r.name}</span>
                                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onclick="window.showRoleModal('${guildId}', '${guildName.replace(/'/g, "\\'")}', '${r.id}')" class="p-2 text-purple-500 hover:text-purple-400"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
                                    <button onclick="window.deleteObject('roles', '${r.id}', '${guildId}', '${guildName.replace(/'/g, "\\'")}')" class="p-2 text-red-500 hover:text-red-400"><i class="fa-solid fa-trash-can text-xs"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>`;
};

window.handleRoleDragStart = function(e) {
    e.dataTransfer.setData('type', 'role');
    e.dataTransfer.setData('id', e.currentTarget.dataset.id);
};

window.handleRoleDrop = async function(e, guildId, guildName) {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const id = e.dataTransfer.getData('id');
    if (type !== 'role') return;

    const list = e.currentTarget;
    const items = Array.from(list.querySelectorAll('.role-item'));
    
    let dropIdx = items.length;
    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            dropIdx = i;
            break;
        }
    }

    const filtered = items.filter(item => item.dataset.id !== id);
    filtered.splice(dropIdx, 0, { dataset: { id: id } });

    const totalRoles = filtered.length;
    const positions = filtered.map((item, index) => ({
        id: item.dataset.id,
        position: totalRoles - index - 1
    }));

    await discordRequest(`/guilds/${guildId}/roles`, 'PATCH', positions);
    window.openEditor(guildId, guildName);
};

window.showRoleModal = async function(guildId, guildName, roleId = null) {
    const [roles, members] = await Promise.all([
        discordRequest(`/guilds/${guildId}/roles`),
        discordRequest(`/guilds/${guildId}/members?limit=1000`)
    ]);

    const existingRole = roleId ? roles.find(r => r.id === roleId) : null;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4';
    
    modal.innerHTML = `
        <div class="bg-[#09090b] border border-white/10 w-full max-w-6xl rounded-[3rem] p-10 shadow-2xl flex flex-col max-h-[90vh]">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-3xl font-black text-white uppercase italic tracking-tighter">${existingRole ? 'Configuration Rôle' : 'Création Terminal Rôle'}</h3>
                <div class="w-12 h-12 rounded-full border-4" style="border-color: #${(existingRole?.color || 0).toString(16).padStart(6, '0')}; background: #${(existingRole?.color || 0).toString(16).padStart(6, '0')}20"></div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto pr-4 custom-scrollbar">
                <div class="space-y-8">
                    <div class="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                        <label class="text-[10px] font-black text-purple-500 uppercase mb-4 block italic tracking-widest">Identité visuelle</label>
                        <input type="text" id="role-name" value="${existingRole?.name || ''}" placeholder="NOM_DU_ROLE" class="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-purple-500 italic font-black uppercase mb-6 transition-all">
                        
                        <div class="flex items-center gap-4">
                            <div class="relative group">
                                <input type="color" id="role-color-picker" value="#${(existingRole?.color || 0).toString(16).padStart(6, '0')}" class="w-14 h-14 bg-transparent border-none cursor-pointer rounded-full overflow-hidden">
                                <div class="absolute inset-0 rounded-full border-2 border-white/10 pointer-events-none group-hover:border-purple-500 transition-all"></div>
                            </div>
                            <div class="flex-1">
                                <input type="text" id="role-color-hex" value="#${(existingRole?.color || 0).toString(16).padStart(6, '0')}" class="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-mono uppercase outline-none focus:border-purple-500">
                            </div>
                        </div>
                    </div>

                    <div class="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                        <label class="text-[10px] font-black text-purple-500 uppercase mb-4 block italic tracking-widest">Attribution Membres</label>
                        <div class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar bg-black/20 p-2 rounded-2xl border border-white/5">
                            ${members.map(m => `
                                <label class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group">
                                    <input type="checkbox" data-user="${m.user.id}" ${m.roles.includes(roleId) ? 'checked' : ''} class="role-member-checkbox sr-only peer">
                                    <div class="w-5 h-5 border-2 border-white/10 rounded-lg peer-checked:bg-purple-600 peer-checked:border-purple-600 flex items-center justify-center transition-all group-hover:border-purple-500/50">
                                        <i class="fa-solid fa-check text-[10px] text-white opacity-0 peer-checked:opacity-100"></i>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[10px] font-black text-white uppercase italic tracking-tighter">${m.nick || m.user.username}</span>
                                        <span class="text-[8px] font-bold text-slate-500 font-mono">${m.user.id}</span>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                        <label class="text-[10px] font-black text-purple-500 uppercase mb-6 block italic tracking-widest">Matrice des Permissions</label>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${PERMISSIONS_LIST.map(p => `
                                <div class="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-slate-300 uppercase italic tracking-tight">${p.name}</span>
                                        <span class="text-[7px] font-mono text-slate-600 uppercase tracking-widest">BIT_MASK: ${p.bit}</span>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" data-bit="${p.bit}" ${existingRole && (BigInt(existingRole.permissions) & BigInt(p.bit)) ? 'checked' : ''} class="role-perm-checkbox sr-only peer">
                                        <div class="w-12 h-6 bg-white/5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-4 mt-10">
                <button id="role-cancel" class="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded-2xl uppercase italic transition-all tracking-[0.3em]">Annuler</button>
                <button id="role-save" class="flex-1 py-5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black rounded-2xl uppercase italic shadow-[0_0_50px_-12px_rgba(147,51,234,0.5)] transition-all tracking-[0.3em]">Injecter Rôle</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const cp = document.getElementById('role-color-picker');
    const ch = document.getElementById('role-color-hex');
    cp.oninput = () => ch.value = cp.value.toUpperCase();
    ch.oninput = () => cp.value = ch.value;

    document.getElementById('role-cancel').onclick = () => modal.remove();
    document.getElementById('role-save').onclick = async () => {
        let permissions = 0n;
        modal.querySelectorAll('.role-perm-checkbox:checked').forEach(cb => permissions |= BigInt(cb.dataset.bit));
        
        const payload = {
            name: document.getElementById('role-name').value.trim() || 'Nouveau Rôle',
            color: parseInt(ch.value.replace('#', ''), 16),
            permissions: permissions.toString()
        };

        const res = await discordRequest(existingRole ? `/guilds/${guildId}/roles/${roleId}` : `/guilds/${guildId}/roles`, existingRole ? 'PATCH' : 'POST', payload);
        
        if (res && res.id) {
            const targetRoleId = res.id;
            const checks = modal.querySelectorAll('.role-member-checkbox');
            for (const cb of checks) {
                const userId = cb.dataset.user;
                const isChecked = cb.checked;
                const hadRole = members.find(m => m.user.id === userId)?.roles.includes(roleId);

                if (isChecked && !hadRole) {
                    await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${targetRoleId}`, 'PUT');
                } else if (!isChecked && hadRole) {
                    await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${targetRoleId}`, 'DELETE');
                }
            }
        }
        
        modal.remove();
        window.openEditor(guildId, guildName);
    };
};

window.handleDragStart = function(e) {
    e.stopPropagation();
    e.dataTransfer.setData('type', 'channel');
    e.dataTransfer.setData('id', e.currentTarget.dataset.id);
};

window.handleCategoryDragStart = function(e) {
    e.dataTransfer.setData('type', 'category');
    e.dataTransfer.setData('id', e.currentTarget.dataset.id);
};

window.handleDragOver = function(e) {
    e.preventDefault();
};

window.handleDrop = async function(e, guildId, guildName) {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    const id = e.dataTransfer.getData('id');
    if (type !== 'channel') return;

    const targetList = e.target.closest('.channel-list');
    if (!targetList || !id) return;

    const parentId = targetList.dataset.parent === 'null' ? null : targetList.dataset.parent;
    const items = Array.from(targetList.querySelectorAll('.channel-item'));
    
    let dropIdx = items.length;
    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            dropIdx = i;
            break;
        }
    }

    const filteredItems = items.filter(item => item.dataset.id !== id);
    filteredItems.splice(dropIdx, 0, { dataset: { id: id } });

    const positions = filteredItems.map((item, index) => ({
        id: item.dataset.id,
        position: index
    }));

    await discordRequest(`/channels/${id}`, 'PATCH', { parent_id: parentId });
    await discordRequest(`/guilds/${guildId}/channels`, 'PATCH', positions);
    
    window.openEditor(guildId, guildName);
};

window.handleCategoryGlobalDrop = async function(e, guildId, guildName) {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const id = e.dataTransfer.getData('id');
    if (type !== 'category') return;

    const container = e.currentTarget;
    const groups = Array.from(container.querySelectorAll('.category-group')).filter(g => g.dataset.id !== 'null');
    
    let dropIdx = groups.length;
    for (let i = 0; i < groups.length; i++) {
        const rect = groups[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            dropIdx = i;
            break;
        }
    }

    const filtered = groups.filter(g => g.dataset.id !== id);
    filtered.splice(dropIdx, 0, { dataset: { id: id } });

    const positions = filtered.map((g, index) => ({
        id: g.dataset.id,
        position: index + 1
    }));

    await discordRequest(`/guilds/${guildId}/channels`, 'PATCH', positions);
    window.openEditor(guildId, guildName);
};

window.showCategoryModal = function(guildId, guildName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-[#09090b] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 class="text-2xl font-black text-white uppercase italic mb-8 tracking-tighter">Créer une catégorie</h3>
            <div class="space-y-6">
                <div>
                    <label class="text-[10px] font-black text-purple-500 uppercase mb-2 block italic tracking-[0.2em]">Nom de la catégorie</label>
                    <input type="text" id="cat-name-input" placeholder="NOM_CATEGORIE" class="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-purple-500 uppercase italic font-black">
                </div>
                <div class="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <span class="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Catégorie privée</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="cat-private-toggle" class="sr-only peer">
                        <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>
            <div class="flex gap-4 mt-10">
                <button id="cat-cancel" class="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded-xl uppercase italic transition-all">Annuler</button>
                <button id="cat-submit" class="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black rounded-xl uppercase italic shadow-xl transition-all">Créer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cat-cancel').onclick = () => modal.remove();
    document.getElementById('cat-submit').onclick = async () => {
        const name = document.getElementById('cat-name-input').value.trim();
        const isPrivate = document.getElementById('cat-private-toggle').checked;
        if (name) {
            const payload = { name, type: 4 };
            if (isPrivate) payload.permission_overwrites = [{ id: guildId, type: 0, allow: "0", deny: "1024" }];
            await discordRequest(`/guilds/${guildId}/channels`, 'POST', payload);
            modal.remove();
            window.openEditor(guildId, guildName);
        }
    };
};

window.showChannelModal = async function(guildId, guildName, channelId = null) {
    const [channels, roles] = await Promise.all([
        discordRequest(`/guilds/${guildId}/channels`),
        discordRequest(`/guilds/${guildId}/roles`)
    ]);
    
    let existingChannel = channels.find(c => c.id === channelId);
    const categories = channels.filter(c => c.type === 4);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4';
    
    modal.innerHTML = `
        <div class="bg-[#09090b] border border-white/10 w-full max-w-6xl rounded-[3rem] p-10 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 class="text-3xl font-black text-white uppercase italic mb-8 tracking-tighter">${existingChannel ? 'Editer Salon' : 'Nouveau Salon'}</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto pr-4 custom-scrollbar">
                <div class="space-y-6">
                    <div>
                        <label class="text-[10px] font-black text-purple-500 uppercase mb-2 block italic">Paramètres globaux</label>
                        <div class="space-y-4">
                            <input type="text" id="modal-name" value="${existingChannel?.name || ''}" placeholder="NOM_DU_SALON" class="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-purple-500 italic font-black uppercase">
                            <select id="modal-parent" class="w-full bg-[#18181b] border border-white/5 rounded-xl px-5 py-3 text-sm text-white outline-none appearance-none cursor-pointer hover:border-purple-500 transition-colors italic font-black">
                                <option value="" class="bg-[#18181b]">RACINE</option>
                                ${categories.map(cat => `<option value="${cat.id}" ${existingChannel?.parent_id === cat.id ? 'selected' : ''} class="bg-[#18181b]">${cat.name.toUpperCase()}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <div class="flex items-center justify-between"><label class="text-[10px] font-black text-purple-500 uppercase italic">Contrôle des accès</label>
                        <select id="role-selector" class="bg-purple-600 text-white text-[10px] font-black rounded-lg px-4 py-2 uppercase italic outline-none appearance-none cursor-pointer">
                            ${roles.map(r => `<option value="${r.id}" class="bg-[#18181b]">${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <div id="permissions-container" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${PERMISSIONS_LIST.map(p => `
                            <div class="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <span class="text-[9px] font-black text-slate-300 uppercase italic">${p.name}</span>
                                <div class="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                    <button data-perm="${p.id}" data-bit="${p.bit}" data-type="deny" class="perm-btn w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-red-500 transition-all"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                                    <button data-perm="${p.id}" data-bit="${p.bit}" data-type="neutral" class="perm-btn active-neutral w-7 h-7 flex items-center justify-center rounded text-white bg-white/10 transition-all"><i class="fa-solid fa-slash text-[8px]"></i></button>
                                    <button data-perm="${p.id}" data-bit="${p.bit}" data-type="allow" class="perm-btn w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:text-emerald-500 transition-all"><i class="fa-solid fa-check text-[10px]"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="flex gap-4 mt-8">
                <button id="modal-cancel" class="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded-xl uppercase italic transition-all tracking-widest">Annuler</button>
                <button id="modal-save" class="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black rounded-xl uppercase italic shadow-xl transition-all tracking-widest">Sauvegarder Configuration</button>
            </div>
        </div>`;

    document.body.appendChild(modal);
    const overwrites = existingChannel?.permission_overwrites || [];
    const updatePermUI = (roleId) => {
        const ow = overwrites.find(o => o.id === roleId) || { allow: "0", deny: "0" };
        modal.querySelectorAll('.perm-btn').forEach(btn => {
            const bit = BigInt(btn.dataset.bit);
            btn.classList.remove('active-allow', 'active-deny', 'active-neutral');
            if ((BigInt(ow.allow) & bit) === bit && btn.dataset.type === 'allow') btn.classList.add('active-allow');
            else if ((BigInt(ow.deny) & bit) === bit && btn.dataset.type === 'deny') btn.classList.add('active-deny');
            else if (!((BigInt(ow.allow) & bit) === bit) && !((BigInt(ow.deny) & bit) === bit) && btn.dataset.type === 'neutral') btn.classList.add('active-neutral');
        });
    };
    modal.querySelector('#role-selector').onchange = (e) => updatePermUI(e.target.value);
    updatePermUI(roles[0].id);
    modal.querySelectorAll('.perm-btn').forEach(btn => {
        btn.onclick = () => {
            const roleId = modal.querySelector('#role-selector').value;
            let owIndex = overwrites.findIndex(o => o.id === roleId);
            if (owIndex === -1) { overwrites.push({ id: roleId, type: 0, allow: "0", deny: "0" }); owIndex = overwrites.length - 1; }
            const bit = BigInt(btn.dataset.bit);
            overwrites[owIndex].allow = (BigInt(overwrites[owIndex].allow) & ~bit).toString();
            overwrites[owIndex].deny = (BigInt(overwrites[owIndex].deny) & ~bit).toString();
            if (btn.dataset.type === 'allow') overwrites[owIndex].allow = (BigInt(overwrites[owIndex].allow) | bit).toString();
            if (btn.dataset.type === 'deny') overwrites[owIndex].deny = (BigInt(overwrites[owIndex].deny) | bit).toString();
            updatePermUI(roleId);
        };
    });
    document.getElementById('modal-cancel').onclick = () => modal.remove();
    document.getElementById('modal-save').onclick = async () => {
        const payload = { name: document.getElementById('modal-name').value.trim().toLowerCase().replace(/\s+/g, '-'), parent_id: document.getElementById('modal-parent').value || null, permission_overwrites: overwrites };
        await discordRequest(existingChannel ? `/channels/${existingChannel.id}` : `/guilds/${guildId}/channels`, existingChannel ? 'PATCH' : 'POST', payload);
        modal.remove();
        window.openEditor(guildId, guildName);
    };
};

window.deleteObject = async function(type, id, gId, gName) {
    if (confirm('Confirmer la suppression irréversible ?')) {
        await discordRequest(type === 'channels' ? `/channels/${id}` : `/guilds/${gId}/roles/${id}`, 'DELETE');
        window.openEditor(gId, gName);
    }
};

function switchTab(tabId) {
    ['dashboard', 'serveurs', 'messenger', 'promo'].forEach(t => {
        document.getElementById(`tab-${t}`)?.classList.add('hidden');
        document.getElementById(`nav-${t}`)?.classList.remove('active', 'bg-white/5', 'text-white');
    });
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
    document.getElementById(`nav-${tabId}`)?.classList.add('active', 'bg-white/5', 'text-white');
}

function renderMessengerUI() {
    const container = document.getElementById('tab-messenger');
    if (!container) return;
    container.innerHTML = `<div class="p-8 max-w-4xl mx-auto"><h2 class="text-3xl font-black text-white uppercase italic mb-8 tracking-tighter">CENTRE DE MESSAGERIE</h2>
        <div class="bg-[#0d1117] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div class="grid grid-cols-2 gap-4">
                <select id="msg-server-select" class="w-full bg-black/40 border border-white/5 rounded-xl px-6 py-4 text-white outline-none focus:border-purple-500 appearance-none italic font-black uppercase text-[11px]"></select>
                <select id="msg-channel-select" class="w-full bg-black/40 border border-white/5 rounded-xl px-6 py-4 text-white outline-none focus:border-purple-500 appearance-none italic font-black uppercase text-[11px]"></select>
            </div>
            <textarea id="msg-content" class="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none h-32 resize-none italic font-bold" placeholder="TAPER LE MESSAGE ICI..."></textarea>
            <button id="send-msg-btn" class="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl uppercase italic transition-all tracking-[0.4em] shadow-xl">DIFFUSER</button>
        </div></div>`;
    document.getElementById('msg-server-select').onchange = async (e) => {
        const channels = await discordRequest(`/guilds/${e.target.value}/channels`);
        document.getElementById('msg-channel-select').innerHTML = channels?.filter(c => c.type === 0).map(c => `<option value="${c.id}" class="bg-[#18181b]">${c.name.toUpperCase()}</option>`).join('') || '';
    };
    document.getElementById('send-msg-btn').onclick = async () => {
        const channelId = document.getElementById('msg-channel-select').value;
        const content = document.getElementById('msg-content').value.trim();
        if (channelId && content && await discordRequest(`/channels/${channelId}/messages`, 'POST', { content })) document.getElementById('msg-content').value = '';
    };
    if (currentGuilds.length > 0) updateMessengerServers(currentGuilds);
}

function updateMessengerServers(guilds) {
    const select = document.getElementById('msg-server-select');
    if (select) select.innerHTML = '<option value="" class="bg-[#18181b]">SÉLECTIONNER TERMINAL</option>' + guilds.map(g => `<option value="${g.id}" class="bg-[#18181b]">${g.name.toUpperCase()}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', initApp);