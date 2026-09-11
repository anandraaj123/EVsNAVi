const fs = require('fs');
const https = require('https');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=([^\r\n]*)/);
const key = match ? match[1].trim() : '';

console.log('----------------------------------------------------');
console.log('🤖 NaviAI - Google Gemini Key Diagnostic Test');
console.log('----------------------------------------------------');

if (!key) {
  console.log('❌ STATUS: GEMINI_API_KEY is empty in backend/.env.');
  process.exit(0);
}

const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
console.log(`🔑 Key detected (length: ${key.length} chars, starts with: ${key.substring(0, 7)}...)`);
console.log(`📡 Testing connection with model: ${model}...`);

const data = JSON.stringify({
  contents: [
    {
      parts: [
        { text: 'You are NaviAI for EVsNAVI. In one short friendly sentence, confirm you are ready to assist the EV driver.' }
      ]
    }
  ]
});

const t0 = Date.now();
const req = https.request(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + key,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 15000
  },
  (res) => {
    let body = '';
    res.on('data', chunk => (body += chunk));
    res.on('end', () => {
      const duration = Date.now() - t0;
      console.log(`HTTP Response Status: ${res.statusCode} ${res.statusMessage} (in ${duration}ms)`);
      try {
        const json = JSON.parse(body);
        if (json.error) {
          console.log('❌ Gemini API Error:', json.error.message || JSON.stringify(json.error));
        } else if (json.candidates && json.candidates.length > 0) {
          const reply = json.candidates[0]?.content?.parts?.[0]?.text?.trim();
          console.log('✅ SUCCESS! Gemini Key is verified & working properly!');
          console.log(`💬 Gemini Response: "${reply}"`);
        } else {
          console.log('Response:', body);
        }
      } catch (e) {
        console.log('Raw response:', body);
      }
      console.log('----------------------------------------------------');
      process.exit(0);
    });
  }
);

req.on('error', (err) => {
  console.log('❌ Network Connection Error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Request timed out.');
  req.destroy();
  process.exit(1);
});

req.write(data);
req.end();
