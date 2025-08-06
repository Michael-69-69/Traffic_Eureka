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

// Custom validation middleware for hazards and incidents only
const validateHazardIncident = (req, res, next) => {
    const { lat, lng, timestamp } = req.body;
    
    // For hazards
    if (req.originalUrl.includes('/hazards')) {
        const { cause, severity, notes } = req.body;
        if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
            return res.status(400).json({ success: false, message: 'Missing required fields for hazard' });
        }
    }
    
    // For incidents
    if (req.originalUrl.includes('/incidents')) {
        const { description, type, impact } = req.body;
        if (!lat || !lng || !description || !type || !impact || !timestamp) {
            return res.status(400).json({ success: false, message: 'Missing required fields for incident' });
        }
    }
    
    next();
};

// Routes
app.use('/api/hazards', validateHazardIncident, upload.single('image'), hazardRoutes);
app.use('/api/incidents', validateHazardIncident, upload.single('image'), incidentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/controls', controlRoutes);
app.use('/api/cameras', cameraRoutes); // Updated to use the new camera feeds route
app.use('/api/camera', cameraRoutes); // Keep backwards compatibility

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log(`  GET  /                    - Main application`);
    console.log(`  GET  /api/cameras         - Get all cameras`);
    console.log(`  GET  /api/cameras/:id     - Get specific camera`);
    console.log(`  GET  /api/cameras/:id/feed - Get camera feed URL`);
    console.log(`  GET  /api/cameras/:id/data - Get camera analytics`);
    console.log(`  GET  /api/hazards         - Get all hazards`);
    console.log(`  POST /api/hazards         - Report new hazard`);
    console.log(`  GET  /api/incidents       - Get all incidents`);
    console.log(`  POST /api/incidents       - Report new incident`);
    console.log(`  GET  /api/search          - Search locations`);
    console.log(`  GET  /health              - Health check`);
});