const express = require('express');
const router = express.Router();
const Incident = require('../models/incident');

router.get('/', (req, res) => {
    try {
        const incidents = Incident.getAll();
        res.json({ success: true, incidents });
    } catch (error) {
        console.error('Error getting incidents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving incidents' 
        });
    }
});

router.post('/', (req, res) => {
    console.log('POST /api/incidents - Request body:', req.body);
    console.log('POST /api/incidents - File:', req.file);
    
    try {
        const { lat, lng, description, type, impact, timestamp, verified } = req.body;
        const image = req.file;
        
        // Validate required fields
        if (!lat || !lng || !description || !type || !impact || !timestamp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: lat, lng, description, type, impact, timestamp' 
            });
        }
        
        // Convert string values to appropriate types
        const incidentData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            description: description.toString(),
            type: type.toString(),
            impact: parseInt(impact),
            timestamp: timestamp.toString(),
            verified: verified === 'true' || verified === true || false
        };
        
        // Add image if provided
        if (image) {
            incidentData.imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        }
        
        console.log('Creating incident with data:', incidentData);
        const incident = Incident.create(incidentData);
        
        console.log('Incident created successfully:', incident);
        res.json({ success: true, incident });
        
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating incident: ' + error.message 
        });
    }
});

module.exports = router;