const express = require('express');
const router = express.Router();
const Hazard = require('../models/hazard');
const fs = require('fs');
const path = require('path');

router.get('/', async (req, res) => {
  try {
      const hazards = await Hazard.getAll();
      res.json({ success: true, hazards });
  } catch (error) {
      console.error('Error fetching hazards:', error);
      res.status(500).json({ success: false, message: 'Error fetching hazards' });
  }
});

router.post('/', async (req, res) => {
  const { lat, lng, cause, severity, notes, timestamp } = req.body;
  if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const hazardData = {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    cause,
    severity: parseInt(severity),
    notes,
    timestamp,
    image: req.file // 👈 pass file directly if exists
  };

  try {
    const hazard = await Hazard.create(hazardData);
    res.json({ success: true, hazard });
  } catch (error) {
    console.error('Error creating hazard:', error);
    res.status(500).json({ success: false, message: 'Error creating hazard' });
  }
});

module.exports = router;
