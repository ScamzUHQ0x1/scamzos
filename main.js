const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1250,
        height: 850,
        minWidth: 1000,
        minHeight: 700,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: true,
            spellcheck: false
        },
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ipcMain.handle('discord-request', async (event, { endpoint, method, body, token }) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: `/api/v10${endpoint}`,
            method: method || 'GET',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'DiscordBot (https://github.com/discordjs/discord.js, 14.14.1)'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 204) return resolve({ success: true });
                try {
                    const json = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, data: json });
                    } else {
                        resolve({ success: false, status: res.statusCode, data: json });
                    }
                } catch (e) {
                    resolve({ success: false, status: res.statusCode, data: null });
                }
            });
        });

        req.on('error', (err) => resolve({ success: false, error: err.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
});

ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    app.quit();
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});