import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 4001;
const app = express();

app.use(cors());
app.use(express.json());

let clients = [];

// Rota SSE para os clients (DevDash)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar heartbeat inicial
  res.write(': heartbeat\n\n');

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };

  clients.push(newClient);
  console.log(`[SSE] Client connected: ${clientId}. Total clients: ${clients.length}`);

  req.on('close', () => {
    console.log(`[SSE] Client disconnected: ${clientId}`);
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Endpoint para outros microservices publicarem eventos
app.post('/publish', (req, res) => {
  const eventData = req.body;
  
  if (!eventData || !eventData.type) {
    return res.status(400).json({ error: 'Payload deve conter "type"' });
  }

  const payload = `data: ${JSON.stringify(eventData)}\n\n`;

  clients.forEach(c => c.res.write(payload));
  console.log(`[SSE] Event published: ${eventData.type} to ${clients.length} clients.`);

  res.json({ ok: true, clientsNotified: clients.length });
});

// Heartbeat a cada 30 segundos
setInterval(() => {
  clients.forEach(c => c.res.write(': heartbeat\n\n'));
}, 30000);

app.listen(PORT, () => {
  console.log(`SSE Hub listening on http://localhost:${PORT}`);
});
