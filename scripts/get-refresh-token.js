// Genera GOOGLE_REFRESH_TOKEN. Corre local: node scripts/get-refresh-token.js
const http = require('http');
const { google } = require('googleapis');
const url = require('url');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.argv[2];
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.argv[3];
const REDIRECT = 'http://localhost:3000/api/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Falta CLIENT_ID / CLIENT_SECRET. Uso: node scripts/get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

console.log('\n1. Abre este link en tu navegador:\n');
console.log(authUrl);
console.log('\n2. Autoriza. Esperando callback en http://localhost:3000 ...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/api/auth/callback')) {
    res.writeHead(404); res.end(); return;
  }
  const q = url.parse(req.url, true).query;
  if (q.error) { res.end('Error: ' + q.error); return; }
  try {
    const { tokens } = await oauth2.getToken(q.code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>Listo. Vuelve a la terminal, copia el refresh token.</h2>');
    console.log('\n==================== COPIA ESTO ====================\n');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n====================================================\n');
    server.close();
    process.exit(0);
  } catch (e) {
    res.end('Error: ' + e.message);
    console.error(e);
  }
});

server.listen(3000);
