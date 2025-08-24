const express = require('express');
const router = express.Router();
const Incident = require('../models/incident');
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

router.get('/', async (req, res) => {
  try {
      const incidents = await Incident.getAll();
      res.json({ success: true, incidents });
  } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({ success: false, message: 'Error fetching incidents' });
  }
});

router.post('/', (req, res) => {
  upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: 'Multer error: ' + err.message });
      } else if (err) {
          return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
      }

      const { lat, lng, description, type, impact, timestamp, verified } = req.body;
      if (!lat || !lng || !description || !type || !impact || !timestamp) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const incidentData = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          description,
          type,
          impact: parseInt(impact),
          timestamp,
          verified: verified || false
      };

      if (req.file) {
          incidentData.image = req.file;
      }

      try {
          const incident = await Incident.create(incidentData);
          res.json({ success: true, incident });
      } catch (error) {
          console.error('Error creating incident:', error);
          res.status(500).json({ success: false, message: 'Error creating incident' });
      }
  });
});

module.exports = router;