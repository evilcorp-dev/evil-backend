const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const LOG_FILE = './ips.json';

// BLACKLIST DE IPS
// O IP do Rnzzk está bloqueado. O do ASHFORD vai ser salvo normal.
const IP_BLACKLIST = [
    "127.0.0.1",         // Localhost
    "189.63.226.218"     // IP do Rnzzk (Admin)
];

function getLogs() {
    if (!fs.existsSync(LOG_FILE)) return [];
    const data = fs.readFileSync(LOG_FILE);
    return JSON.parse(data);
}

function saveLog(ip, userAgent) {
    // Se o IP tiver na blacklist, ele ignora e não salva
    if (IP_BLACKLIST.includes(ip)) return;

    const logs = getLogs();
    const lastLog = logs[logs.length - 1];
    // Evita salvar o mesmo IP repetidamente no mesmo minuto
    if (lastLog && lastLog.ip === ip && (Date.now() - lastLog.timestamp < 60000)) return;

    logs.push({
        ip: ip,
        userAgent: userAgent,
        timestamp: Date.now()
    });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

app.post('/api/log-ip', (req, res) => {
    // Pega o IP real, considerando o Cloudflare/Render proxy
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    
    // O x-forwarded-for pode vir com uma lista de IPs, pegamos o primeiro
    const realIp = ip.split(',')[0].trim();

    saveLog(realIp, userAgent);
    res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
    res.json(getLogs());
});

// ROTA SECRETA PRA APAGAR OS LOGS (Acesse no navegador: seu-link.onrender.com/api/clear-logs)
app.get('/api/clear-logs', (req, res) => {
    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
    }
    res.json({ success: true, message: "Logs apagados com sucesso." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
