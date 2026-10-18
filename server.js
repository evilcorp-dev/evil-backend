const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const LOG_FILE = './ips.json';

function getLogs() {
    if (!fs.existsSync(LOG_FILE)) return [];
    const data = fs.readFileSync(LOG_FILE);
    return JSON.parse(data);
}

function saveLog(ip, userAgent) {
    const logs = getLogs();
    const lastLog = logs[logs.length - 1];
    if (lastLog && lastLog.ip === ip && (Date.now() - lastLog.timestamp < 60000)) return;

    logs.push({
        ip: ip,
        userAgent: userAgent,
        timestamp: Date.now()
    });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

app.post('/api/log-ip', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    saveLog(ip, userAgent);
    res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
    res.json(getLogs());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));