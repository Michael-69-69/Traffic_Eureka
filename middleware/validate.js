module.exports = (req, res, next) => {
    const { lat, lng, cause, severity, notes, timestamp } = req.body;
    if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    next();
};