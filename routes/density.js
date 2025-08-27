const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

// Helper to fetch from backend
async function fetchFromBackend(endpoint, params = {}) {
    console.log(`[PROXY] Requesting data from backend: ${BACKEND_API_URL}${endpoint}`);
    try {
        const response = await axios.get(`${BACKEND_API_URL}${endpoint}`, { params });
        console.log(`[PROXY] Successfully fetched data from ${endpoint}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[PROXY] Error fetching from ${BACKEND_API_URL}${endpoint}: ${errorMessage}`);
        throw new Error(`Failed to fetch data from backend: ${errorMessage}`);
    }
}

// Route to proxy live densities
router.get('/live', async (req, res) => {
    try {
        console.log("\n--- Handling /live request ---");
        const data = await fetchFromBackend('/live-densities');
        console.log("Backend response for /live-densities:", JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for today's vehicle counts
router.get('/today-counts', async (req, res) => {
    try {
        console.log("\n--- Handling /today-counts request ---");
        const data = await fetchFromBackend('/today-vehicle-counts');
        console.log("Backend response for /today-vehicle-counts:", JSON.stringify(data, null, 2));
        res.json({
            success: true,
            ...data,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for forecast
router.get('/forecast', async (req, res) => {
    try {
        console.log("\n--- Handling /forecast request ---");
        const { camera, minutes } = req.query;
        if (!camera) {
            return res.status(400).json({ success: false, message: 'Camera ID is required' });
        }

        const forecastMinutes = parseInt(minutes, 10) || 60; // Default to 60 minutes
        const SECONDS_PER_FRAME = 15;
        const frames = (forecastMinutes * 60) / SECONDS_PER_FRAME;

        console.log(`[PROXY] Request for ${forecastMinutes} minutes, calculated as ${frames} frames.`);

        const data = await fetchFromBackend('/forecast', { camera, frames });
        console.log("Backend response for /forecast:", JSON.stringify(data, null, 2));
        res.json({
            success: true,
            ...data,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for historical data
router.get('/historical/:cameraId', async (req, res) => {
    try {
        console.log("\n--- Handling /historical/:cameraId request ---");
        const { cameraId } = req.params;
        const history = await fetchFromBackend('/live-densities'); // Using live-densities for historical context
        console.log("Backend response for /live-densities:", JSON.stringify(history, null, 2));
        let historicalData = [];
        if (history && history.cameras) {
            const camData = history.cameras[cameraId] || {};
            historicalData = (camData.density_history || []).map((density, index) => {
                const timestamp = new Date(history.timestamp).getTime() - (history.cameras[cameraId].density_history.length - 1 - index) * 15000;
                return {
                    timestamp: new Date(timestamp).toISOString(),
                    vehicle_count: camData.vehicle_count || 0,
                    density: density,
                    estimated_speed: camData.estimated_speed || 0,
                    traffic_level: camData.traffic_level || 'Unknown',
                    hour: new Date(timestamp).getHours(),
                    day_of_week: new Date(timestamp).getDay(),
                    is_weekend: [0, 6].includes(new Date(timestamp).getDay())
                };
            });
        }

        res.json({
            success: true,
            camera_id: cameraId,
            historical_data: historicalData,
            days_requested: 1,
            total_data_points: historicalData.length,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for summary
router.get('/summary', async (req, res) => {
    try {
        console.log("\n--- Handling /summary request ---");
        const data = await fetchFromBackend('/densities');
        console.log("Backend response for /densities:", JSON.stringify(data, null, 2));
        let totalVehicles = 0;
        let totalDensity = 0;
        const trafficLevelCounts = {
            'Free Flow': 0,
            'Light Traffic': 0,
            'Moderate Traffic': 0,
            'Heavy Traffic': 0,
            'Congested': 0,
            'No Traffic': 0,
            'No Image': 0,
            'Unknown': 0,
        };

        const cameraCount = Object.keys(data).length;
        Object.values(data).forEach(camData => {
            totalVehicles += camData.vehicle_count;
            totalDensity += camData.density;
            if (trafficLevelCounts[camData.traffic_level] !== undefined) {
                trafficLevelCounts[camData.traffic_level]++;
            } else {
                trafficLevelCounts['Unknown']++;
            }
        });

        const averageDensity = cameraCount > 0 ? totalDensity / cameraCount : 0;

        function getTrafficLevel(density) {
            if (density < 20) return 'Free Flow';
            if (density < 40) return 'Light Traffic';
            if (density < 60) return 'Moderate Traffic';
            if (density < 80) return 'Heavy Traffic';
            return 'Congested';
        }

        res.json({
            success: true,
            summary: {
                total_cameras: cameraCount,
                total_vehicles: totalVehicles,
                average_density: Math.round(averageDensity * 10) / 10,
                overall_traffic_level: getTrafficLevel(averageDensity),
                traffic_level_distribution: trafficLevelCounts,
                current_time: new Date().toISOString(),
            },
            cameras: data,
            predicted_densities: Object.fromEntries(
                Object.entries(data).map(([camId, camData]) => [camId, camData.predicted_density || camData.density])
            ),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for yesterday's vehicle counts
router.get('/yesterday-counts', async (req, res) => {
    try {
        console.log("\n--- Handling /yesterday-counts request ---");
        const data = await fetchFromBackend('/yesterday-vehicle-counts');
        console.log("Backend response for /yesterday-vehicle-counts:", JSON.stringify(data, null, 2));
        res.json({
            success: true,
            ...data,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for critical vehicle counts
router.get('/critical-counts', async (req, res) => {
    try {
        console.log("\n--- Handling /critical-counts request ---");
        const data = await fetchFromBackend('/critical-vehicle-counts');
        console.log("Backend response for /critical-vehicle-counts:", JSON.stringify(data, null, 2));
        res.json({
            success: true,
            ...data,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for fallback critical vehicle counts
router.get('/fallback-critical-counts', async (req, res) => {
    try {
        console.log("\n--- Handling /fallback-critical-counts request ---");
        const data = await fetchFromBackend('/fallback-critical-vehicle-counts');
        console.log("Backend response for /fallback-critical-vehicle-counts:", JSON.stringify(data, null, 2));
        res.json({
            success: true,
            ...data,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;