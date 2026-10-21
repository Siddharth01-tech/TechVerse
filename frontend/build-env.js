const fs = require('fs');
const path = require('path');

// Read BACKEND_URL from environment variables (e.g. Vercel dashboard) or local .env
let backendUrl = (process.env.BACKEND_URL || '').trim();

const envFile = path.join(__dirname, '.env');
if (!backendUrl && fs.existsSync(envFile)) {
  const raw = fs.readFileSync(envFile, 'utf8');
  const match = raw.match(/^\s*BACKEND_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match && match[1]) {
    backendUrl = match[1].trim();
  }
}

// Fallback to deployed Render backend if not specified
if (!backendUrl) {
  backendUrl = 'https://techverse-backend-l29o.onrender.com';
}

// Clean trailing slashes if present
if (backendUrl) {
  backendUrl = backendUrl.replace(/\/+$/, '');
}

const jsContent = `// Auto-generated runtime environment configuration
window.BACKEND_URL = "${backendUrl}";
`;

fs.writeFileSync(path.join(__dirname, 'env.js'), jsContent);
console.log('Successfully generated frontend/env.js with BACKEND_URL:', backendUrl || '(relative /api)');
