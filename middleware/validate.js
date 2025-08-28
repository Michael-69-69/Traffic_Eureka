module.exports = (req, res, next) => {
  // Only validate if the request has a body (POST/PUT/PATCH)
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const { lat, lng, cause, severity, notes, timestamp } = req.body || {};

    if (!lat || !lng || !cause || !severity || !notes || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
  }

  next();
};
