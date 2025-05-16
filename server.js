const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Server Error: ' + err.message);
});

// Handle 404s
app.use((req, res) => {
    res.status(404).send('File not found');
});

const PORT = 5679;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 