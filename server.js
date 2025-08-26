// server.js (host on Netlify, Render, or Heroku)
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// In-memory store for pending codes
// Structure: { code: { discord_id, mc_ign, expires } }
const pending = {};

// Endpoint for bot to add a code
app.post("/api/add_code", (req, res) => {
    const { code, discord_id, mc_ign, expires } = req.body;
    if (!code || !discord_id || !mc_ign || !expires) {
        return res.status(400).json({ ok: false, error: "Missing fields" });
    }
    pending[code] = { discord_id, mc_ign, expires };
    console.log(`Added code ${code} for ${mc_ign} (Discord ID ${discord_id})`);
    return res.json({ ok: true });
});

// Endpoint for Skript to check code
app.get("/api/check/:code", (req, res) => {
    const code = req.params.code.toUpperCase();
    const entry = pending[code];

    if (!entry) return res.json({ valid: false, reason: "not_found" });
    if (Date.now() / 1000 > entry.expires) {
        delete pending[code];
        return res.json({ valid: false, reason: "expired" });
    }

    res.json({ valid: true, discord_id: entry.discord_id, mc_ign: entry.mc_ign });
});

// Endpoint for Skript to consume code (mark as used)
app.post("/api/consume", (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

    const entry = pending[code.toUpperCase()];
    if (!entry) return res.json({ ok: false, reason: "invalid" });

    delete pending[code.toUpperCase()];
    return res.json({ ok: true, discord_id: entry.discord_id, mc_ign: entry.mc_ign });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DuckLink middleman API running on port ${PORT}`);
});
