const express = require('express');
const axios = require('axios');
const router = express.Router();

// Nominatim API Configuration (Free OpenStreetMap service)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY = 1100; // Respect rate limit (1 req/sec)
let lastRequestTime = Date.now() - 60000;

// Ho Chi Minh City bounds for filtering results
const HCMC_BOUNDS = {
    northeast: { lat: 11.2000, lng: 107.1000 },
    southwest: { lat: 10.3000, lng: 106.3000 }
};

// Rate limiting function
async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < REQUEST_DELAY) {
        const waitTime = REQUEST_DELAY - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
}

// Function to check if coordinates are within Ho Chi Minh City bounds
function isWithinHCMC(lat, lng) {
    return lat >= HCMC_BOUNDS.southwest.lat && 
           lat <= HCMC_BOUNDS.northeast.lat && 
           lng >= HCMC_BOUNDS.southwest.lng && 
           lng <= HCMC_BOUNDS.northeast.lng;
}

// NominatimPlace class equivalent
class NominatimPlace {
    constructor(data) {
        const address = data.address || {};
        
        // Extract name from display_name or use the first part
        let name = data.name || '';
        if (!name) {
            const displayParts = data.display_name?.split(',') || [];
            name = displayParts.length > 0 ? displayParts[0].trim() : 'Unknown Place';
        }

        this.placeId = data.place_id?.toString() || '';
        this.displayName = data.display_name?.toString() || '';
        this.name = name;
        this.type = data.type?.toString() || '';
        this.coordinates = {
            lat: parseFloat(data.lat) || 0.0,
            lng: parseFloat(data.lon) || 0.0
        };
        this.houseNumber = address.house_number?.toString();
        this.road = address.road?.toString();
        this.suburb = address.suburb?.toString() || address.neighbourhood?.toString();
        this.city = address.city?.toString() || address.town?.toString() || address.village?.toString();
        this.state = address.state?.toString();
        this.country = address.country?.toString();
        this.postcode = address.postcode?.toString();
        this.importance = parseFloat(data.importance) || 0.0;
    }

    get formattedAddress() {
        const parts = [];

        if (this.houseNumber && this.road) {
            parts.push(`${this.houseNumber} ${this.road}`);
        } else if (this.road) {
            parts.push(this.road);
        }

        if (this.suburb) parts.push(this.suburb);
        if (this.city) parts.push(this.city);
        if (this.state) parts.push(this.state);
        if (this.country) parts.push(this.country);

        return parts.join(', ');
    }

    get shortAddress() {
        const parts = [];

        if (this.road) parts.push(this.road);
        if (this.city) parts.push(this.city);

        return parts.join(', ');
    }

    get placeTypes() {
        // Convert Nominatim types to our standardized types
        switch (this.type.toLowerCase()) {
            case 'restaurant':
            case 'fast_food':
            case 'cafe':
                return ['restaurant', 'food'];
            case 'fuel':
            case 'gas_station':
                return ['gas_station'];
            case 'hospital':
            case 'clinic':
                return ['hospital', 'health'];
            case 'school':
            case 'university':
            case 'college':
                return ['school', 'education'];
            case 'bank':
            case 'atm':
                return ['bank', 'finance'];
            case 'shop':
            case 'supermarket':
            case 'shopping_mall':
                return ['shopping', 'store'];
            case 'tourism':
            case 'attraction':
            case 'museum':
                return ['tourist_attraction'];
            case 'place_of_worship':
            case 'church':
            case 'temple':
                return ['place_of_worship'];
            case 'park':
            case 'garden':
                return ['park'];
            case 'bus_station':
            case 'railway_station':
                return ['transit_station'];
            case 'hotel':
            case 'motel':
                return ['lodging'];
            default:
                if (this.road) return ['street'];
                if (this.city) return ['locality'];
                return ['place'];
        }
    }

    // Convert to response format
    toResponseFormat() {
        return {
            name: this.name,
            displayName: this.displayName,
            lat: this.coordinates.lat,
            lng: this.coordinates.lng,
            type: this.placeTypes[0] || 'place',
            placeTypes: this.placeTypes,
            score: Math.round(this.importance * 100), // Convert importance to score
            matchType: 'nominatim',
            fullAddress: this.formattedAddress,
            shortAddress: this.shortAddress,
            placeId: this.placeId,
            district: this.getDistrictFromAddress(),
            area: this.suburb,
            source: 'nominatim',
            houseNumber: this.houseNumber,
            road: this.road,
            suburb: this.suburb,
            city: this.city,
            state: this.state,
            country: this.country,
            postcode: this.postcode,
            importance: this.importance,
            icon: NominatimPlace.getPlaceIcon(this.placeTypes),
            color: NominatimPlace.getPlaceColor(this.placeTypes)
        };
    }

    getDistrictFromAddress() {
        // Extract district information from city or suburb
        if (this.city && this.city.toLowerCase().includes('district')) {
            return this.city;
        }
        if (this.suburb && this.suburb.toLowerCase().includes('district')) {
            return this.suburb;
        }
        return this.city || this.suburb || '';
    }

    // Get place icon based on type
    static getPlaceIcon(types) {
        if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
        if (types.includes('gas_station')) return 'local_gas_station';
        if (types.includes('hospital') || types.includes('health')) return 'local_hospital';
        if (types.includes('school') || types.includes('education')) return 'school';
        if (types.includes('bank') || types.includes('finance')) return 'account_balance';
        if (types.includes('shopping') || types.includes('store')) return 'shopping_cart';
        if (types.includes('tourist_attraction')) return 'attractions';
        if (types.includes('place_of_worship')) return 'place';
        if (types.includes('park')) return 'park';
        if (types.includes('transit_station')) return 'train';
        if (types.includes('lodging')) return 'hotel';
        if (types.includes('street')) return 'route';
        if (types.includes('locality')) return 'location_city';
        return 'location_on';
    }

    // Get place color based on type
    static getPlaceColor(types) {
        if (types.includes('restaurant') || types.includes('food')) return '#FF9800';
        if (types.includes('gas_station')) return '#2196F3';
        if (types.includes('hospital') || types.includes('health')) return '#F44336';
        if (types.includes('school') || types.includes('education')) return '#4CAF50';
        if (types.includes('bank') || types.includes('finance')) return '#3F51B5';
        if (types.includes('shopping') || types.includes('store')) return '#9C27B0';
        if (types.includes('tourist_attraction')) return '#795548';
        if (types.includes('place_of_worship')) return '#673AB7';
        if (types.includes('park')) return '#8BC34A';
        if (types.includes('transit_station')) return '#009688';
        if (types.includes('lodging')) return '#E91E63';
        if (types.includes('street')) return '#616161';
        if (types.includes('locality')) return '#607D8B';
        return '#2196F3';
    }
}

// Nominatim geocoding service
class NominatimGeocodingService {
    static async searchPlaces(query, location = null, limit = 10, countryCode = 'vn') {
        if (!query.trim()) return [];

        await enforceRateLimit();

        try {
            const queryParams = {
                q: query.trim(),
                format: 'jsonv2',
                addressdetails: '1',
                limit: limit.toString(),
                dedupe: '1', // Remove duplicates
                namedetails: '1',
                extratags: '1'
            };

            // Add country restriction if specified
            if (countryCode) {
                queryParams.countrycodes = countryCode;
            }

            // Add location bias if provided (prioritize results near this location)
            if (location) {
                const lat = location.lat;
                const lng = location.lng;
                const offset = 0.45; // Roughly 50km in degrees

                queryParams.viewbox = `${lng - offset},${lat + offset},${lng + offset},${lat - offset}`;
                queryParams.bounded = '1';
            } else {
                // Default to Ho Chi Minh City area
                queryParams.viewbox = `${HCMC_BOUNDS.southwest.lng},${HCMC_BOUNDS.northeast.lat},${HCMC_BOUNDS.northeast.lng},${HCMC_BOUNDS.southwest.lat}`;
                queryParams.bounded = '1';
            }

            const url = `${NOMINATIM_BASE_URL}/search`;
            console.log('🔍 Nominatim search URL:', url);
            console.log('📋 Query params:', queryParams);

            const response = await axios.get(url, {
                params: queryParams,
                headers: {
                    'User-Agent': 'VietnamTrafficApp/1.0 (contact@example.com)' // Required by Nominatim
                },
                timeout: 10000
            });

            if (response.status === 200) {
                const data = response.data;
                console.log(`🎯 Found ${data.length} raw results from Nominatim`);

                const places = data
                    .map(item => new NominatimPlace(item))
                    .filter(place => this.isValidPlace(place))
                    .filter(place => isWithinHCMC(place.coordinates.lat, place.coordinates.lng)); // Filter to HCMC area

                // Sort by importance (Nominatim's relevance score)
                places.sort((a, b) => b.importance - a.importance);

                console.log(`✨ Returning ${places.length} valid results within HCMC bounds`);
                return places;
            } else {
                console.log('❌ Nominatim error:', response.status, response.data);
                return [];
            }
        } catch (error) {
            console.error('💥 Error searching places:', error.message);
            if (error.response) {
                console.error('- Response status:', error.response.status);
                console.error('- Response data:', error.response.data);
            }
            return [];
        }
    }

    static isValidPlace(place) {
        // Filter out very generic or invalid results
        if (place.name.length < 2) return false;
        if (place.coordinates.lat === 0 && place.coordinates.lng === 0) return false;

        // Filter out some unwanted types
        const lowercaseName = place.name.toLowerCase();
        if (lowercaseName.includes('unnamed') ||
            lowercaseName.includes('unknown') ||
            lowercaseName.startsWith('way ') ||
            lowercaseName.startsWith('node ')) {
            return false;
        }

        return true;
    }

    static async reverseGeocode(location) {
        await enforceRateLimit();

        try {
            const queryParams = {
                lat: location.lat.toString(),
                lon: location.lng.toString(),
                format: 'jsonv2',
                addressdetails: '1',
                namedetails: '1',
                zoom: '18' // High detail level
            };

            const url = `${NOMINATIM_BASE_URL}/reverse`;
            console.log('🔄 Nominatim reverse geocoding:', url);

            const response = await axios.get(url, {
                params: queryParams,
                headers: {
                    'User-Agent': 'VietnamTrafficApp/1.0 (contact@example.com)'
                },
                timeout: 10000
            });

            if (response.status === 200) {
                const data = response.data;
                return new NominatimPlace(data);
            } else {
                console.log('❌ Nominatim reverse geocode error:', response.status);
                return null;
            }
        } catch (error) {
            console.error('💥 Error in reverse geocoding:', error.message);
            return null;
        }
    }
}

// Main search endpoint using only Nominatim
router.get('/', async (req, res) => {
    const query = req.query.query;
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'No search query provided'
        });
    }

    console.log('🔍 Search query:', query);
    if (lat && lng) {
        console.log('📍 Location bias:', { lat, lng });
    }

    try {
        const location = (lat && lng) ? { lat, lng } : null;
        const places = await NominatimGeocodingService.searchPlaces(query, location, limit);

        if (places.length > 0) {
            const results = places.map(place => place.toResponseFormat());
            
            res.json({
                success: true,
                message: `Found ${results.length} result(s) for: ${query}`,
                results: results,
                searchTerm: query,
                source: 'nominatim',
                bounds: HCMC_BOUNDS,
                locationBias: location
            });
        } else {
            res.json({
                success: false,
                message: `No results found for "${query}" in Ho Chi Minh City area`,
                results: [],
                searchTerm: query,
                source: 'nominatim',
                bounds: HCMC_BOUNDS
            });
        }
    } catch (error) {
        console.error('💥 Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search service error',
            error: error.message,
            searchTerm: query
        });
    }
});

// Suggestions endpoint for autocomplete using Nominatim
router.get('/suggestions', async (req, res) => {
    const query = req.query.q;
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng ? parseFloat(req.query.lng) : null;

    if (!query || query.length < 2) {
        return res.json({ 
            success: true, 
            suggestions: [],
            message: 'Query too short for suggestions'
        });
    }

    try {
        const location = (lat && lng) ? { lat, lng } : null;
        const places = await NominatimGeocodingService.searchPlaces(query, location, 8); // Limit to 8 for suggestions

        const suggestions = places.map(place => ({
            name: place.name,
            displayName: place.displayName,
            shortAddress: place.shortAddress,
            type: place.placeTypes[0] || 'place',
            placeTypes: place.placeTypes,
            lat: place.coordinates.lat,
            lng: place.coordinates.lng,
            importance: place.importance,
            icon: NominatimPlace.getPlaceIcon(place.placeTypes),
            color: NominatimPlace.getPlaceColor(place.placeTypes),
            source: 'nominatim'
        }));

        res.json({
            success: true,
            suggestions: suggestions,
            query: query,
            source: 'nominatim'
        });
    } catch (error) {
        console.error('💥 Suggestions error:', error);
        res.json({
            success: false,
            suggestions: [],
            query: query,
            error: 'Suggestions service error'
        });
    }
});

// Place details endpoint using place ID
router.get('/place/:placeId', async (req, res) => {
    const placeId = req.params.placeId;

    if (!placeId) {
        return res.status(400).json({
            success: false,
            message: 'Place ID is required'
        });
    }

    try {
        await enforceRateLimit();

        const queryParams = {
            place_id: placeId,
            format: 'jsonv2',
            addressdetails: '1',
            namedetails: '1',
            extratags: '1'
        };

        const url = `${NOMINATIM_BASE_URL}/lookup`;
        
        const response = await axios.get(url, {
            params: queryParams,
            headers: {
                'User-Agent': 'VietnamTrafficApp/1.0 (contact@example.com)'
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data.length > 0) {
            const place = new NominatimPlace(response.data[0]);
            
            res.json({
                success: true,
                place: place.toResponseFormat(),
                source: 'nominatim'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Place not found',
                placeId: placeId
            });
        }
    } catch (error) {
        console.error('💥 Place details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching place details',
            error: error.message,
            placeId: placeId
        });
    }
});

// Reverse geocoding endpoint (coordinates to address)
router.get('/reverse', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Check if coordinates are within HCMC bounds
    if (!isWithinHCMC(latitude, longitude)) {
        return res.status(400).json({
            success: false,
            message: 'Coordinates are outside Ho Chi Minh City area',
            bounds: HCMC_BOUNDS,
            coordinates: { lat: latitude, lng: longitude }
        });
    }

    try {
        const place = await NominatimGeocodingService.reverseGeocode({ lat: latitude, lng: longitude });
        
        if (place) {
            res.json({
                success: true,
                address: place.formattedAddress,
                place: place.toResponseFormat(),
                coordinates: { lat: latitude, lng: longitude },
                source: 'nominatim'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No address found for these coordinates',
                coordinates: { lat: latitude, lng: longitude }
            });
        }
    } catch (error) {
        console.error('💥 Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            message: 'Reverse geocoding service error',
            error: error.message,
            coordinates: { lat: latitude, lng: longitude }
        });
    }
});

// Test endpoint to check Nominatim API connection
router.get('/test-api', async (req, res) => {
    try {
        console.log('🧪 Testing Nominatim API...');
        
        const testQuery = 'Ben Thanh Market, Ho Chi Minh City';
        const places = await NominatimGeocodingService.searchPlaces(testQuery, null, 5);
        
        res.json({
            success: true,
            message: 'Nominatim API test successful',
            testQuery: testQuery,
            results: places.length,
            sampleResults: places.slice(0, 2).map(p => p.toResponseFormat()),
            service: 'Nominatim (OpenStreetMap)',
            baseUrl: NOMINATIM_BASE_URL,
            rateLimit: `${REQUEST_DELAY}ms between requests`
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Nominatim API test failed',
            error: error.message,
            service: 'Nominatim (OpenStreetMap)',
            baseUrl: NOMINATIM_BASE_URL
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Search service is healthy',
        service: 'Nominatim Geocoding Service',
        baseUrl: NOMINATIM_BASE_URL,
        bounds: HCMC_BOUNDS,
        rateLimit: `${REQUEST_DELAY}ms`,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;