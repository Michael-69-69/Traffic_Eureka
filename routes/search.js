const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const query = req.query.query;
    if (query) {
        // Simulate search (replace with actual geocoding service if needed)
        res.json({ success: true, message: `Search results for: ${query}` });
    } else {
        res.json({ success: false, message: 'No search query provided' });
    }
});

module.exports = router;