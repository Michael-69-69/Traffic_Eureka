const express = require('express');
const router = express.Router();
const Incident = require('../models/incident');

router.get('/', (req, res) => {
    res.json({ success: true, incidents: Incident.getAll() });
});

router.post('/', (req, res) => {
    const { lat, lng, description, type, impact, timestamp, verified } = req.body;
    const image = req.file;
    if (!lat || !lng || !description || !type || !impact || !timestamp) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (image) {
        const imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        const incident = Incident.create({ lat, lng, description, type, impact, timestamp, verified: verified || false, imageUrl });
        res.json({ success: true, incident });
    } else {
        const incident = Incident.create({ lat, lng, description, type, impact, timestamp, verified: verified || false });
        res.json({ success: true, incident });
    }
});

module.exports = router;