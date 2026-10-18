const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Agora o banco fica na memória e não apaga toda hora no Render
let logsDB = []; 

function saveLog(ip, userAgent) {
    // BLINDAGEM: Ignora o IP do Rnzzk para não sujar o log
    if (ip === "189.63.226.218") return; 

    // Evita encher a lista salvando o mesmo IP toda hora
    const lastLog = logsDB[logsDB.length - 1];
    if (lastLog && lastLog.ip === ip && (Date.now() - lastLog.timestamp < 60000)) return;

    logsDB.push({ ip, userAgent, timestamp: Date.now() });
    
    // Opcional: manter só os últimos 1000 logs pra não estourar a memória
    if (logsDB.length > 1000) logsDB.shift(); 
}

app.post('/api/log-ip', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    const realIp = ip.split(',')[0].trim();

    saveLog(realIp, userAgent);
    res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
    res.json(logsDB);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
