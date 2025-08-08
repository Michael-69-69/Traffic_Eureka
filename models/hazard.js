const express = require('express');
const router = express.Router();
const Hazard = require('../models/hazard');

router.get('/', (req, res) => {
    try {
        const hazards = Hazard.getAll();
        res.json({ success: true, hazards });
    } catch (error) {
        console.error('Error getting hazards:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving hazards' 
        });
    }
});

router.post('/', (req, res) => {
    console.log('POST /api/hazards - Request body:', req.body);
    console.log('POST /api/hazards - File:', req.file);
    
    try {
        const { lat, lng, cause, severity, notes, timestamp } = req.body;
        const image = req.file;
        
        // Validate required fields
        if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: lat, lng, cause, severity, notes, timestamp' 
            });
        }
        
        // Convert string values to appropriate types
        const hazardData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            cause: cause.toString(),
            severity: parseInt(severity),
            notes: notes.toString(),
            timestamp: timestamp.toString()
        };
        
        // Add image if provided
        if (image) {
            hazardData.imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        }
        
        console.log('Creating hazard with data:', hazardData);
        const hazard = Hazard.create(hazardData);
        
        console.log('Hazard created successfully:', hazard);
        res.json({ success: true, hazard });
        
    } catch (error) {
        console.error('Error creating hazard:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating hazard: ' + error.message 
        });
    }
});

module.exports = router;