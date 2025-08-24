const express = require('express');
const axios = require('axios');
const router = express.Router();

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:10000';

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

// Route for today's vehicle counts (proxied from history)
router.get('/today-counts', async (req, res) => {
    try {
        console.log("\n--- Handling /today-counts request ---");
        const history = await fetchFromBackend('/history-densities');
        console.log("Backend response for /history-densities:", JSON.stringify(history, null, 2));
        const cameras = {};
        if (history && history.records && history.records.length > 0) {
            const latestRecord = history.records[history.records.length - 1];
            Object.keys(latestRecord.cameras).forEach(camId => {
                cameras[camId] = {
                    name: latestRecord.cameras[camId].n,
                    counts: history.records.map(rec => ({
                        timestamp: rec.cameras[camId]?.t,
                        vehicle_count: rec.cameras[camId]?.v,
                        density: rec.cameras[camId]?.d,
                    })).filter(r => r.timestamp)
                };
            });
        }
        res.json({
            success: true,
            cameras,
            date: new Date().toDateString(),
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for forecast - returns empty as backend does not support it
router.get('/forecast/:cameraId', async (req, res) => {
    console.log("\n--- Handling /forecast/:cameraId request ---");
    console.log("Returning empty forecast as it's not supported by the backend.");
    res.json({
        success: true,
        forecasts: {
            [req.params.cameraId]: []
        },
        metadata: {
            message: "Forecasting is not supported by the current backend."
        }
    });
});

// Route for historical data - returns only today's data from the backend
router.get('/historical/:cameraId', async (req, res) => {
    try {
        console.log("\n--- Handling /historical/:cameraId request ---");
        const { cameraId } = req.params;
        const history = await fetchFromBackend('/history-densities');
        console.log("Backend response for /history-densities:", JSON.stringify(history, null, 2));
        let historicalData = [];
        if (history && history.records) {
            historicalData = history.records.map(rec => {
                const camData = rec.cameras[cameraId];
                if (!camData) return null;
                const timestamp = new Date(camData.t);
                return {
                    timestamp: camData.t,
                    vehicle_count: camData.v,
                    density: camData.d,
                    estimated_speed: camData.estimated_speed || 0,
                    traffic_level: camData.traffic_level || 'Unknown',
                    hour: timestamp.getHours(),
                    day_of_week: timestamp.getDay(),
                    is_weekend: [0, 6].includes(timestamp.getDay())
                };
            }).filter(Boolean);
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
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


module.exports = router;