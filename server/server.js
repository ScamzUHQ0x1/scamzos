const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let BOT_TOKEN = null;

app.post('/login', async (req, res) => {
    const { token } = req.body;
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${token}` }
        });
        if (response.ok) {
            BOT_TOKEN = token;
            const user = await response.json();
            return res.json({ success: true, user });
        }
        res.status(401).json({ success: false });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get('/guilds', async (req, res) => {
    if (!BOT_TOKEN) return res.status(401).json({ error: "No token" });
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        const guilds = await response.json();
        res.json(guilds);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/guilds/:id/data', async (req, res) => {
    if (!BOT_TOKEN) return res.status(401).json({ error: "No token" });
    try {
        const [cRes, rRes] = await Promise.all([
            fetch(`https://discord.com/api/v10/guilds/${req.params.id}/channels`, { headers: { Authorization: `Bot ${BOT_TOKEN}` } }),
            fetch(`https://discord.com/api/v10/guilds/${req.params.id}/roles`, { headers: { Authorization: `Bot ${BOT_TOKEN}` } })
        ]);

        const channels = await cRes.json();
        const roles = await rRes.json();

        // On renvoie les données même si c'est vide pour éviter le chargement infini
        res.json({
            channels: Array.isArray(channels) ? channels.filter(c => c.type === 0) : [],
            roles: Array.isArray(roles) ? roles : []
        });
    } catch (err) {
        res.status(500).json({ channels: [], roles: [] });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));