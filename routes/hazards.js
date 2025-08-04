const express = require('express');
const router = express.Router();
const Hazard = require('../models/hazard');

router.get('/', (req, res) => {
    res.json({ success: true, hazards: Hazard.getAll() });
});

router.post('/', (req, res) => {
    const { lat, lng, cause, severity, notes, timestamp } = req.body;
    const image = req.file;
    if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    let imageUrl = null;
    if (image) {
        imageUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    }
    const hazard = Hazard.create({ lat: parseFloat(lat), lng: parseFloat(lng), cause, severity: parseInt(severity), notes, timestamp, imageUrl });
    res.json({ success: true, hazard });
});

module.exports = router;