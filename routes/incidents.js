const express = require('express');
const router = express.Router();
const Incident = require('../models/incident');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('image');

// GET all incidents
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/incidents - Fetching all incidents');
        const incidents = await Incident.getAll();
        console.log(`Successfully fetched ${incidents.length} incidents`);
        res.json({ success: true, incidents });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching incidents',
            error: error.message 
        });
    }
});

// GET incident by ID
router.get('/:id', async (req, res) => {
    try {
        const incidentId = req.params.id;
        console.log(`GET /api/incidents/${incidentId} - Fetching incident by ID`);
        
        if (!incidentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid incident ID' 
            });
        }

        const incident = await Incident.getById(incidentId);
        
        if (!incident) {
            return res.status(404).json({ 
                success: false, 
                message: 'Incident not found' 
            });
        }

        res.json({ success: true, incident });
    } catch (error) {
        console.error('Error fetching incident by ID:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching incident',
            error: error.message 
        });
    }
});

// Accept incident
router.put('/:id/accept', async (req, res) => {
    console.log('PUT /api/incidents/:id/accept received:', {
        params: req.params,
        body: req.body,
        timestamp: new Date().toISOString()
    });
    
    try {
        const incidentId = req.params.id;
        
        if (!incidentId) {
            console.log('Invalid incident ID provided');
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid incident ID' 
            });
        }

        // Use the Incident model's updateStatus method
        const updatedIncident = await Incident.updateStatus(incidentId, 'accepted', true);
        
        if (!updatedIncident) {
            console.log('Incident not found for acceptance');
            return res.status(404).json({ 
                success: false, 
                message: 'Incident not found' 
            });
        }

        console.log('Incident accepted successfully:', updatedIncident);
        res.json({ 
            success: true, 
            message: 'Incident accepted successfully', 
            incident: updatedIncident 
        });
    } catch (error) {
        console.error('Error accepting incident:', error);
        res.status(500).json({ 
            success: false, 
            message: `Error accepting incident: ${error.message}`,
            error: error.message
        });
    }
});

// Reject incident
router.put('/:id/reject', async (req, res) => {
    console.log('PUT /api/incidents/:id/reject received:', {
        params: req.params,
        body: req.body,
        timestamp: new Date().toISOString()
    });
    
    try {
        const incidentId = req.params.id;
        
        if (!incidentId) {
            console.log('Invalid incident ID provided');
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid incident ID' 
            });
        }

        // Use the Incident model's updateStatus method
        const updatedIncident = await Incident.updateStatus(incidentId, 'rejected', false);
        
        if (!updatedIncident) {
            console.log('Incident not found for rejection');
            return res.status(404).json({ 
                success: false, 
                message: 'Incident not found' 
            });
        }

        console.log('Incident rejected successfully:', updatedIncident);
        res.json({ 
            success: true, 
            message: 'Incident rejected successfully', 
            incident: updatedIncident 
        });
    } catch (error) {
        console.error('Error rejecting incident:', error);
        res.status(500).json({ 
            success: false, 
            message: `Error rejecting incident: ${error.message}`,
            error: error.message
        });
    }
});

// Update incident (general update endpoint)
router.put('/:id', async (req, res) => {
    try {
        const incidentId = req.params.id;
        const updateData = req.body;
        
        console.log(`PUT /api/incidents/${incidentId} - Updating incident:`, updateData);
        
        if (!incidentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid incident ID' 
            });
        }

        const updatedIncident = await Incident.update(incidentId, updateData);
        
        if (!updatedIncident) {
            return res.status(404).json({ 
                success: false, 
                message: 'Incident not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Incident updated successfully', 
            incident: updatedIncident 
        });
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({ 
            success: false, 
            message: `Error updating incident: ${error.message}`,
            error: error.message
        });
    }
});

// Delete incident
router.delete('/:id', async (req, res) => {
    try {
        const incidentId = req.params.id;
        console.log(`DELETE /api/incidents/${incidentId} - Deleting incident`);
        
        if (!incidentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid incident ID' 
            });
        }

        const deletedIncident = await Incident.delete(incidentId);
        
        if (!deletedIncident) {
            return res.status(404).json({ 
                success: false, 
                message: 'Incident not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Incident deleted successfully', 
            incident: deletedIncident 
        });
    } catch (error) {
        console.error('Error deleting incident:', error);
        res.status(500).json({ 
            success: false, 
            message: `Error deleting incident: ${error.message}`,
            error: error.message
        });
    }
});

// Create new incident
router.post('/', (req, res) => {
    console.log('POST /api/incidents - Creating new incident');
    
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                success: false, 
                message: 'File upload error: ' + err.message 
            });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Server error during upload: ' + err.message 
            });
        }

        // Log received data for debugging
        console.log('Received form data:', {
            body: req.body,
            file: req.file ? {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file'
        });

        const { lat, lng, description, type, impact, timestamp, verified, status } = req.body;
        
        // Validate required fields
        const missingFields = [];
        if (!lat) missingFields.push('lat');
        if (!lng) missingFields.push('lng');
        if (!description) missingFields.push('description');
        if (!type) missingFields.push('type');
        if (!impact) missingFields.push('impact');
        if (!timestamp) missingFields.push('timestamp');
        
        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}`,
                receivedFields: Object.keys(req.body),
                missingFields
            });
        }

        // Prepare incident data
        const incidentData = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            description: description.trim(),
            type: type.trim(),
            impact: parseInt(impact),
            timestamp: timestamp,
            verified: verified === 'true' || verified === true || false,
            status: status || 'pending'
        };

        // Validate parsed data
        if (isNaN(incidentData.lat) || isNaN(incidentData.lng)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid latitude or longitude values' 
            });
        }

        if (isNaN(incidentData.impact) || incidentData.impact < 1 || incidentData.impact > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Impact must be a number between 1 and 5' 
            });
        }

        // Add image file if provided
        if (req.file) {
            console.log('Image file attached:', req.file.originalname);
            incidentData.image = req.file;
        }

        try {
            console.log('Creating incident with processed data:', {
                ...incidentData,
                image: incidentData.image ? 'File attached' : 'No file'
            });
            
            const incident = await Incident.create(incidentData);
            
            console.log('Incident created successfully:', {
                id: incident.id,
                lat: incident.lat,
                lng: incident.lng,
                type: incident.type,
                status: incident.status
            });
            
            res.status(201).json({ 
                success: true, 
                message: 'Incident created successfully',
                incident 
            });
        } catch (error) {
            console.error('Error creating incident:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating incident: ' + error.message,
                error: error.message
            });
        }
    });
});

module.exports = router;