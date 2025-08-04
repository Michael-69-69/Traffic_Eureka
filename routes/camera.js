const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { camera } = req.body;
    res.json({
        success: true,
        message: `Selected Camera: ${camera}`
    });
});

module.exports = router;