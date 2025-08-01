const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle search request
app.post('/search', (req, res) => {
    const searchText = req.body.searchText;
    if (searchText) {
        res.json({ message: `Searching for: ${searchText}`, status: 'success' });
    } else {
        res.json({ message: 'No search text provided', status: 'error' });
    }
});

// Handle control selections
app.post('/controls', (req, res) => {
    const { city, district, road } = req.body;
    res.json({
        message: `Selected: City=${city}, District=${district}, Road=${road}`,
        status: 'success'
    });
});

// Handle camera selection
app.post('/camera', (req, res) => {
    const { camera } = req.body;
    res.json({
        message: `Selected Camera: ${camera}`,
        status: 'success'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});