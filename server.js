const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const validateHazardIncident = require('./middleware/validate');
const hazardRoutes = require('./routes/hazards');
const incidentRoutes = require('./routes/incidents');
const searchRoutes = require('./routes/search');
const controlRoutes = require('./routes/controls');
const cameraRoutes = require('./routes/cameras');
const densityRoutes = require('./routes/density');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger);

const uploadMiddleware = (req, res, next) => {
    if (req.method === 'POST') {
        upload.single('image')(req, res, (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            }
            next();
        });
    } else {
        next();
    }
};

// Routes
app.use('/api/hazards', uploadMiddleware, validateHazardIncident, hazardRoutes);
app.use('/api/incidents', uploadMiddleware, validateHazardIncident, incidentRoutes);

app.use('/api/search', searchRoutes);
app.use('/api/controls', controlRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/density', densityRoutes);

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET / - Main application',
            'GET /api/cameras - Get all cameras',
            'GET /api/cameras/:id - Get specific camera',
            'GET /api/cameras/:id/image - Get camera image',
            'GET /api/cameras/:id/data - Get camera analytics',
            'GET /api/hazards - Get all hazards',
            'POST /api/hazards - Report new hazard',
            'GET /api/incidents - Get all incidents',
            'POST /api/incidents - Report new incident',
            'GET /api/search - Search locations',
            'GET /health - Health check'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    console.error('Error stack:', err.stack);
    
    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
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
    console.log(`  GET  /api/cameras/:id/image - Get camera image`);
    console.log(`  GET  /api/cameras/:id/data - Get camera analytics`);
    console.log(`  GET  /api/hazards         - Get all hazards`);
    console.log(`  POST /api/hazards         - Report new hazard`);
    console.log(`  GET  /api/incidents       - Get all incidents`);
    console.log(`  POST /api/incidents       - Report new incident`);
    console.log(`  GET  /api/search          - Search locations`);
    console.log(`  GET  /health              - Health check`);
});