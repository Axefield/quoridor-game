import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5327;

// Serve static files with correct MIME types
app.use(express.static(join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.fbx')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

// Serve node_modules with proper MIME types
app.use('/node_modules', express.static(join(__dirname, 'node_modules'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.fbx')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

// API routes (if any)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve the FBX viewer HTML
app.get('/fbx-viewer', (req, res) => {
  res.sendFile(join(__dirname, 'fbx_viewer.html'));
});

// SPA fallback: serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Serve the GLB viewer HTML
app.get('/glb-viewer', (req, res) => {
  res.sendFile(join(__dirname, 'glb_viewer.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 