const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { city, district, road } = req.body;
    res.json({
        success: true,
        message: `Selected: City=${city}, District=${district}, Road=${road}`
    });
});

module.exports = router;