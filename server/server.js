const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_BASE = "https://discord.com/api/v10";

let BOT_TOKEN = null;

app.post('/login', async (req, res) => {
    const { token } = req.body;

    try {
        const response = await fetch(`${API_BASE}/users/@me`, {
            headers: { Authorization: `Bot ${token}` }
        });

        if (!response.ok) throw new Error("Token invalide");

        const user = await response.json();
        BOT_TOKEN = token;

        res.json({ success: true, user });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

app.get('/guilds', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE}/users/@me/guilds`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Erreur guilds" });
    }
});

app.post('/send-message', async (req, res) => {
    const { channelId, content } = req.body;

    try {
        const response = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        res.json(await response.json());
    } catch (err) {
        res.status(500).json({ error: "Erreur message" });
    }
});

app.listen(3000, () => console.log("Backend lancé sur http://localhost:3000"));