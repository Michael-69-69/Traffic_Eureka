const express = require('express');
const https = require('https');
const http = require('http');

const cameraRouter = express.Router();

// Camera data with actual Ho Chi Minh City traffic camera locations
const cameraData = {
    '63ae763bbfd3d90017e8f0c4': {
        id: '63ae763bbfd3d90017e8f0c4',
        name: 'Lý Thái Tổ - Nguyễn Đình Chiểu',
        location: 'Lý Thái Tổ - Nguyễn Đình Chiểu',
        lat: 10.7831,
        lng: 106.6954,
        originalUrl: 'https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=63ae763bbfd3d90017e8f0c4&camLocation=L%C3%BD%20Th%C3%A1i%20T%E1%BB%95%20-%20Nguy%E1%BB%85n%20%C4%90%C3%ACnh%20Chi%E1%BB%83u&camMode=camera',
        imageUrl: 'https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=63ae763bbfd3d90017e8f0c4',
        status: 'active',
        data: {
            density: '45%',
            weather: 'Sunny',
            traffic: 'Moderate',
            vehicles: 23,
            avgSpeed: '25 km/h'
        }
    },
    '63ae7a50bfd3d90017e8f2b2': {
        id: '63ae7a50bfd3d90017e8f2b2',
        name: '3/2 - Sư Vạn Hạnh',
        location: 'Ba Tháng Hai – Sư Vạn Hạnh',
        lat: 10.7892,
        lng: 106.6638,
        originalUrl: 'https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=63ae7a50bfd3d90017e8f2b2&camLocation=Ba%20Th%C3%A1ng%20Hai%20%E2%80%93%20S%C6%B0%20V%E1%BA%A1n%20H%E1%BA%A1nh&camMode=camera',
        imageUrl: 'https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=63ae7a50bfd3d90017e8f2b2',
        status: 'active',
        data: {
            density: '60%',
            weather: 'Cloudy',
            traffic: 'Heavy',
            vehicles: 41,
            avgSpeed: '15 km/h'
        }
    },
    '5deb576d1dc17d7c5515acf6': {
        id: '5deb576d1dc17d7c5515acf6',
        name: 'Nút giao Ngã sáu Cộng Hòa',
        location: 'Nút giao Ngã sáu Cộng Hòa',
        lat: 10.8010,
        lng: 106.6527,
        originalUrl: 'https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=5deb576d1dc17d7c5515acf6&camLocation=N%C3%BAt%20giao%20Ng%C3%A3%20s%C3%A1u%20C%E1%BB%99ng%20H%C3%B2a&camMode=camera',
        imageUrl: 'https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=5deb576d1dc17d7c5515acf6',
        status: 'active',
        data: {
            density: '75%',
            weather: 'Rainy',
            traffic: 'Congested',
            vehicles: 67,
            avgSpeed: '8 km/h'
        }
    },
    '6623e7076f998a001b2523ea': {
        id: '6623e7076f998a001b2523ea',
        name: 'Lý Thái Tổ - Sư Vạn Hạnh',
        location: 'Lý Thái Tổ - Sư Vạn Hạnh',
        lat: 10.7825,
        lng: 106.6823,
        originalUrl: 'https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=6623e7076f998a001b2523ea&camLocation=L%C3%BD%20Th%C3%A1i%20T%E1%BB%95%20-%20S%C6%B0%20V%E1%BA%A1n%20H%E1%BA%A1nh&camMode=camera',
        imageUrl: 'https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=6623e7076f998a001b2523ea',
        status: 'active',
        data: {
            density: '35%',
            weather: 'Sunny',
            traffic: 'Free Flow',
            vehicles: 12,
            avgSpeed: '35 km/h'
        }
    }
};

// Get all cameras
cameraRouter.get('/', (req, res) => {
    res.json({
        success: true,
        cameras: cameraData,
        count: Object.keys(cameraData).length
    });
});

// Get specific camera by ID
cameraRouter.get('/:cameraId', (req, res) => {
    const { cameraId } = req.params;
    const camera = cameraData[cameraId];
    
    if (!camera) {
        return res.status(404).json({
            success: false,
            message: 'Camera not found'
        });
    }
    
    res.json({
        success: true,
        camera: camera
    });
});

// Get camera image - proxy to avoid CORS issues
cameraRouter.get('/:cameraId/image', async (req, res) => {
    const { cameraId } = req.params;
    const camera = cameraData[cameraId];
    
    if (!camera) {
        return res.status(404).json({
            success: false,
            message: 'Camera not found'
        });
    }

    try {
        // Add cache control headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // Fetch image from the camera URL
        const imageUrl = camera.imageUrl + '&t=' + Date.now(); // Add timestamp to prevent caching
        
        const protocol = imageUrl.startsWith('https:') ? https : http;
        
        const request = protocol.get(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://giaothong.hochiminhcity.gov.vn/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        }, (response) => {
            if (response.statusCode === 200) {
                // Set appropriate content type
                res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
                
                // Pipe the image data to the response
                response.pipe(res);
            } else {
                res.status(response.statusCode || 500).json({
                    success: false,
                    message: 'Failed to fetch camera image'
                });
            }
        });

        request.on('error', (error) => {
            console.error('Error fetching camera image:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching camera image',
                error: error.message
            });
        });

        request.setTimeout(10000, () => {
            request.destroy();
            res.status(408).json({
                success: false,
                message: 'Camera image request timeout'
            });
        });

    } catch (error) {
        console.error('Error in camera image route:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get camera data/analytics
cameraRouter.get('/:cameraId/data', (req, res) => {
    const { cameraId } = req.params;
    const camera = cameraData[cameraId];
    
    if (!camera) {
        return res.status(404).json({
            success: false,
            message: 'Camera not found'
        });
    }
    
    // Simulate real-time data updates with slight variations
    const baseData = camera.data;
    const updatedData = {
        ...baseData,
        vehicles: baseData.vehicles + Math.floor(Math.random() * 10 - 5), // ±5 variation
        density: baseData.density, // Keep density stable
        timestamp: new Date().toISOString(),
        lastUpdate: Date.now()
    };
    
    res.json({
        success: true,
        cameraId: cameraId,
        name: camera.name,
        data: updatedData
    });
});

// Select camera (for backwards compatibility)
cameraRouter.post('/', (req, res) => {
    const { camera } = req.body;
    const selectedCamera = cameraData[camera];
    
    if (!selectedCamera) {
        return res.status(404).json({
            success: false,
            message: 'Camera not found'
        });
    }
    
    res.json({
        success: true,
        message: `Selected Camera: ${selectedCamera.name}`,
        camera: selectedCamera
    });
});

module.exports = cameraRouter;