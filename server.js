const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const validate = require('./middleware/validate');
const hazardRoutes = require('./routes/hazards');
const incidentRoutes = require('./routes/incidents');
const searchRoutes = require('./routes/search');
const controlRoutes = require('./routes/controls');
const cameraRoutes = require('./routes/camera');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory as buffer
const upload = multer({ storage: storage });

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

// Routes
app.use('/api/hazards', validate, upload.single('image'), hazardRoutes);
app.use('/api/incidents', validate, upload.single('image'), incidentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/controls', controlRoutes);
app.use('/api/camera', cameraRoutes);

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});