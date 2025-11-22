import { createServer } from 'https';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = resolve(__dirname, 'dist');

// Check if SSL certificates exist
const certPath = join(__dirname, 'certs', 'cert.pem');
const keyPath = join(__dirname, 'certs', 'key.pem');

if (!existsSync(certPath) || !existsSync(keyPath)) {
  console.error('❌ SSL certificates not found!');
  console.error('Run ./setup-ssl.sh to generate certificates');
  process.exit(1);
}

const options = {
  key: readFileSync(keyPath),
  cert: readFileSync(certPath),
};

const server = createServer(options, async (req, res) => {
  const { default: handler } = await import('serve-handler');
  return handler(req, res, {
    public: DIST_DIR,
    cleanUrls: true,
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at https://localhost:${PORT}`);
  console.log(`📱 Access from other devices: https://<your-ip>:${PORT}`);
  console.log('');
  console.log('⚠️  Note: You will need to accept the self-signed certificate warning in your browser');
});
