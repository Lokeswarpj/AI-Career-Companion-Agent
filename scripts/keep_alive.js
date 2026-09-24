import https from 'https';

const PING_URL = 'https://careerpulse-ai-9q9s.onrender.com/api';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function pingServer() {
  const startTime = Date.now();
  console.log(`[Keep-Alive] 📡 Sending heartbeat ping to ${PING_URL} at ${new Date().toLocaleTimeString()}...`);

  https.get(PING_URL, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      const elapsed = Date.now() - startTime;
      console.log(`[Keep-Alive] ✅ Response received in ${elapsed}ms (Status: ${res.statusCode}) - Service is WARM.`);
    });
  }).on('error', (err) => {
    console.error(`[Keep-Alive] ⚠️ Ping encountered an error:`, err.message);
  });
}

// Initial ping immediately on startup
pingServer();

// Continuous 10-minute interval loop
setInterval(pingServer, INTERVAL_MS);
