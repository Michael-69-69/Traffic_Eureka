// routes/density.js
const express = require('express');
const router = express.Router();

// Mock data for Vietnamese traffic cameras
const vietnamCameras = {
    'A': {
        name: 'Lý Thái Tổ - Nguyễn Đình Chiểu',
        coordinates: { lat: 10.7831, lng: 106.6954 },
        district: 'District 1'
    },
    'B': {
        name: '3/2 - Sư Vạn Hạnh',
        coordinates: { lat: 10.7892, lng: 106.6638 },
        district: 'District 10'
    },
    'C': {
        name: 'Ngã sáu Cộng Hòa',
        coordinates: { lat: 10.8010, lng: 106.6527 },
        district: 'Tan Binh'
    },
    'D': {
        name: 'Lý Thái Tổ - Sư Vạn Hạnh',
        coordinates: { lat: 10.7825, lng: 106.6823 },
        district: 'District 10'
    },
    'E': {
        name: 'Võ Văn Tần - Nam Kỳ Khởi Nghĩa',
        coordinates: { lat: 10.7780, lng: 106.6990 },
        district: 'District 3'
    },
    'F': {
        name: 'Điện Biên Phủ - Pasteur',
        coordinates: { lat: 10.7750, lng: 106.6950 },
        district: 'District 1'
    },
    'G': {
        name: 'Lê Lợi - Pasteur',
        coordinates: { lat: 10.7730, lng: 106.7010 },
        district: 'District 1'
    },
    'H': {
        name: 'Nguyễn Huệ - Lê Thánh Tôn',
        coordinates: { lat: 10.7740, lng: 106.7020 },
        district: 'District 1'
    },
    'I': {
        name: 'Trần Hưng Đạo - Nguyễn Du',
        coordinates: { lat: 10.7650, lng: 106.6980 },
        district: 'District 1'
    },
    'J': {
        name: 'Cách Mạng Tháng 8 - Hoàng Văn Thụ',
        coordinates: { lat: 10.7800, lng: 106.6600 },
        district: 'District 10'
    },
    'K': {
        name: 'Cống Quỳnh - Trần Quang Khải',
        coordinates: { lat: 10.7600, lng: 106.6900 },
        district: 'District 1'
    },
    'L': {
        name: 'Hai Bà Trưng - Đinh Tiên Hoàng',
        coordinates: { lat: 10.7680, lng: 106.6920 },
        district: 'District 1'
    }
};

// Helper functions
function getCurrentHour() {
    return new Date().getHours();
}

function getTrafficMultiplier() {
    const hour = getCurrentHour();
    
    // Morning rush (7-9 AM)
    if (hour >= 7 && hour <= 9) return 1.8;
    // Evening rush (5-7 PM)  
    if (hour >= 17 && hour <= 19) return 2.0;
    // Lunch time (11 AM - 2 PM)
    if (hour >= 11 && hour <= 14) return 1.3;
    // Late night (11 PM - 5 AM)
    if (hour >= 23 || hour <= 5) return 0.3;
    // Regular hours
    return 1.0;
}

function getTrafficLevel(density) {
    if (density < 20) return 'Free Flow';
    if (density < 40) return 'Light Traffic';
    if (density < 60) return 'Moderate Traffic';
    if (density < 80) return 'Heavy Traffic';
    return 'Congested';
}

function getWeatherCondition() {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain'];
    const weights = [0.4, 0.25, 0.2, 0.1, 0.05]; // Weighted probability
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < conditions.length; i++) {
        cumulativeWeight += weights[i];
        if (random <= cumulativeWeight) {
            return conditions[i];
        }
    }
    
    return conditions[0]; // fallback
}

function generateRealisticDensity(baseMultiplier = 1) {
    const trafficMultiplier = getTrafficMultiplier();
    const weatherFactor = getWeatherCondition() === 'Heavy Rain' ? 1.4 : 1.0;
    const randomVariation = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
    
    let density = 25 * trafficMultiplier * weatherFactor * randomVariation * baseMultiplier;
    
    // Cap density at 100%
    density = Math.min(100, Math.max(0, density));
    
    return density;
}

function generateVehicleCount(density) {
    // Estimate vehicle count based on density
    // Assuming roughly 50 vehicles = 100% density for a camera view
    const maxVehicles = 50;
    const baseCount = (density / 100) * maxVehicles;
    const variation = (Math.random() - 0.5) * 10; // ±5 vehicles
    
    return Math.max(0, Math.floor(baseCount + variation));
}

function estimateSpeed(density) {
    // Speed estimation based on density (inverse relationship)
    let baseSpeed = 60; // km/h free flow speed
    
    if (density < 20) baseSpeed = 55 + Math.random() * 10; // 55-65 km/h
    else if (density < 40) baseSpeed = 40 + Math.random() * 15; // 40-55 km/h  
    else if (density < 60) baseSpeed = 25 + Math.random() * 15; // 25-40 km/h
    else if (density < 80) baseSpeed = 10 + Math.random() * 15; // 10-25 km/h
    else baseSpeed = 5 + Math.random() * 10; // 5-15 km/h
    
    return Math.round(baseSpeed * 10) / 10; // Round to 1 decimal
}

// API Routes

// GET /api/density/live - Get live traffic density for all cameras
router.get('/live', async (req, res) => {
    try {
        const cameras = {};
        
        Object.entries(vietnamCameras).forEach(([cameraId, info]) => {
            // Add some variation to different cameras
            const locationMultiplier = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            const density = generateRealisticDensity(locationMultiplier);
            const vehicleCount = generateVehicleCount(density);
            const estimatedSpeed = estimateSpeed(density);
            const trafficLevel = getTrafficLevel(density);
            const weather = getWeatherCondition();
            
            cameras[cameraId] = {
                name: info.name,
                coordinates: info.coordinates,
                district: info.district,
                density: Math.round(density * 10) / 10,
                vehicle_count: vehicleCount,
                estimated_speed: estimatedSpeed,
                traffic_level: trafficLevel,
                weather: weather,
                timestamp: new Date().toISOString(),
                last_updated: Date.now()
            };
        });
        
        res.json({
            success: true,
            cameras: cameras,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching live densities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch live traffic data',
            error: error.message
        });
    }
});

// GET /api/density/forecast/:cameraId - Get LSTM forecast for specific camera
router.get('/forecast/:cameraId', async (req, res) => {
    try {
        const { cameraId } = req.params;
        const timePoints = parseInt(req.query.points) || 120; // Default 2 hours
        
        if (!vietnamCameras[cameraId]) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }
        
        // Generate realistic forecast data
        const forecast = [];
        const currentHour = getCurrentHour();
        const baseMultiplier = getTrafficMultiplier();
        
        for (let i = 0; i < timePoints; i++) {
            const futureHour = (currentHour + (i / 60)) % 24;
            let hourMultiplier = 1.0;
            
            // Predict traffic patterns
            if (futureHour >= 7 && futureHour <= 9) hourMultiplier = 1.8;
            else if (futureHour >= 17 && futureHour <= 19) hourMultiplier = 2.0;
            else if (futureHour >= 11 && futureHour <= 14) hourMultiplier = 1.3;
            else if (futureHour >= 23 || futureHour <= 5) hourMultiplier = 0.3;
            
            // Add some randomness and smoothing
            const noise = (Math.random() - 0.5) * 15;
            const trendFactor = 0.95 + (Math.random() * 0.1); // Slight trend variation
            
            let density = (25 * hourMultiplier * trendFactor) + noise;
            density = Math.max(0, Math.min(100, density));
            
            forecast.push(Math.round(density * 10) / 10);
        }
        
        res.json({
            success: true,
            forecasts: {
                [cameraId]: forecast
            },
            metadata: {
                camera_name: vietnamCameras[cameraId].name,
                time_points: timePoints,
                interval_minutes: 1,
                generated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error generating forecast:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate traffic forecast',
            error: error.message
        });
    }
});

// GET /api/density/today-counts - Get today's hourly vehicle counts
router.get('/today-counts', async (req, res) => {
    try {
        const cameras = {};
        
        Object.entries(vietnamCameras).forEach(([cameraId, info]) => {
            const counts = [];
            const now = new Date();
            
            // Generate hourly data for the past 24 hours
            for (let i = 23; i >= 0; i--) {
                const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
                const hour = timestamp.getHours();
                
                // Generate realistic hourly patterns
                let baseCount = 12;
                let densityBase = 30;
                
                // Rush hour patterns
                if (hour >= 7 && hour <= 9) {
                    baseCount = 35;
                    densityBase = 70;
                } else if (hour >= 17 && hour <= 19) {
                    baseCount = 42;
                    densityBase = 85;
                } else if (hour >= 11 && hour <= 14) {
                    baseCount = 25;
                    densityBase = 50;
                } else if (hour >= 22 || hour <= 5) {
                    baseCount = 3;
                    densityBase = 8;
                }
                
                // Add camera-specific variation
                const locationFactor = cameraId.charCodeAt(0) / 80; // A=0.8125, B=0.8375, etc.
                const vehicleCount = Math.max(0, baseCount * (0.7 + locationFactor * 0.6) + (Math.random() - 0.5) * 8);
                const density = Math.max(0, densityBase * (0.7 + locationFactor * 0.6) + (Math.random() - 0.5) * 20);
                
                counts.push({
                    timestamp: timestamp.toISOString(),
                    vehicle_count: Math.round(vehicleCount * 10) / 10,
                    density: Math.round(density * 10) / 10,
                    hour: hour
                });
            }
            
            cameras[cameraId] = {
                name: info.name,
                counts: counts
            };
        });
        
        res.json({
            success: true,
            cameras: cameras,
            date: new Date().toDateString(),
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching today counts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle count data',
            error: error.message
        });
    }
});

// GET /api/density/historical/:cameraId - Get historical data for specific camera
router.get('/historical/:cameraId', async (req, res) => {
    try {
        const { cameraId } = req.params;
        const days = parseInt(req.query.days) || 7;
        
        if (!vietnamCameras[cameraId]) {
            return res.status(404).json({
                success: false,
                message: 'Camera not found'
            });
        }
        
        const historicalData = [];
        const now = new Date();
        
        // Generate historical data for the requested number of days
        for (let d = days - 1; d >= 0; d--) {
            for (let h = 0; h < 24; h++) {
                const timestamp = new Date(now.getTime() - (d * 24 * 60 * 60 * 1000) + (h * 60 * 60 * 1000));
                
                // Generate realistic patterns with some day-to-day variation
                const dayOfWeek = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const weekendFactor = isWeekend ? 0.7 : 1.0;
                
                let baseCount = 12 * weekendFactor;
                let densityBase = 30 * weekendFactor;
                
                if (h >= 7 && h <= 9 && !isWeekend) {
                    baseCount = 35;
                    densityBase = 70;
                } else if (h >= 17 && h <= 19 && !isWeekend) {
                    baseCount = 42;
                    densityBase = 85;
                } else if (h >= 11 && h <= 14) {
                    baseCount = 25 * weekendFactor;
                    densityBase = 50 * weekendFactor;
                } else if (h >= 22 || h <= 5) {
                    baseCount = 3;
                    densityBase = 8;
                }
                
                // Add camera-specific and random variation
                const locationFactor = cameraId.charCodeAt(0) / 80;
                const vehicleCount = Math.max(0, baseCount * (0.7 + locationFactor * 0.6) + (Math.random() - 0.5) * 8);
                const density = Math.max(0, densityBase * (0.7 + locationFactor * 0.6) + (Math.random() - 0.5) * 20);
                
                historicalData.push({
                    timestamp: timestamp.toISOString(),
                    vehicle_count: Math.round(vehicleCount * 10) / 10,
                    density: Math.round(density * 10) / 10,
                    estimated_speed: estimateSpeed(density),
                    traffic_level: getTrafficLevel(density),
                    hour: h,
                    day_of_week: dayOfWeek,
                    is_weekend: isWeekend
                });
            }
        }
        
        res.json({
            success: true,
            camera_id: cameraId,
            camera_name: vietnamCameras[cameraId].name,
            historical_data: historicalData,
            days_requested: days,
            total_data_points: historicalData.length,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch historical data',
            error: error.message
        });
    }
});

// GET /api/density/summary - Get overall traffic summary
router.get('/summary', async (req, res) => {
    try {
        const cameras = {};
        let totalVehicles = 0;
        let totalDensity = 0;
        let trafficLevelCounts = {
            'Free Flow': 0,
            'Light Traffic': 0,
            'Moderate Traffic': 0,
            'Heavy Traffic': 0,
            'Congested': 0
        };
        
        Object.entries(vietnamCameras).forEach(([cameraId, info]) => {
            const locationMultiplier = 0.8 + (Math.random() * 0.4);
            const density = generateRealisticDensity(locationMultiplier);
            const vehicleCount = generateVehicleCount(density);
            const trafficLevel = getTrafficLevel(density);
            
            cameras[cameraId] = {
                name: info.name,
                density: Math.round(density * 10) / 10,
                vehicle_count: vehicleCount,
                traffic_level: trafficLevel
            };
            
            totalVehicles += vehicleCount;
            totalDensity += density;
            trafficLevelCounts[trafficLevel]++;
        });
        
        const averageDensity = totalDensity / Object.keys(cameras).length;
        
        res.json({
            success: true,
            summary: {
                total_cameras: Object.keys(cameras).length,
                total_vehicles: totalVehicles,
                average_density: Math.round(averageDensity * 10) / 10,
                overall_traffic_level: getTrafficLevel(averageDensity),
                traffic_level_distribution: trafficLevelCounts,
                current_time: new Date().toISOString(),
                weather_condition: getWeatherCondition()
            },
            cameras: cameras,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch traffic summary',
            error: error.message
        });
    }
});

module.exports = router;