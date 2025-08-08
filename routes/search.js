const express = require('express');
const router = express.Router();

// Vietnam cities and places database (you can expand this)
const vietnamPlaces = {
    // Ho Chi Minh City
    'ho chi minh city': { lat: 10.7769, lng: 106.7009, type: 'city' },
    'saigon': { lat: 10.7769, lng: 106.7009, type: 'city' },
    'district 1': { lat: 10.7767, lng: 106.7009, type: 'district' },
    'district 3': { lat: 10.7839, lng: 106.6918, type: 'district' },
    'binh thanh': { lat: 10.8013, lng: 106.7111, type: 'district' },
    'thu duc': { lat: 10.8491, lng: 106.7663, type: 'district' },
    'tan binh': { lat: 10.8009, lng: 106.6529, type: 'district' },
    
    // Popular streets in HCMC
    'nguyen hue': { lat: 10.7748, lng: 106.7020, type: 'street' },
    'le loi': { lat: 10.7697, lng: 106.6969, type: 'street' },
    'dong khoi': { lat: 10.7771, lng: 106.7020, type: 'street' },
    'tran hung dao': { lat: 10.7573, lng: 106.6885, type: 'street' },
    'ly thai to': { lat: 10.7831, lng: 106.6954, type: 'street' },
    'ba thang hai': { lat: 10.7892, lng: 106.6638, type: 'street' },
    'su van hanh': { lat: 10.7825, lng: 106.6823, type: 'street' },
    
    // Landmarks
    'ben thanh market': { lat: 10.7729, lng: 106.6980, type: 'landmark' },
    'reunification palace': { lat: 10.7769, lng: 106.6955, type: 'landmark' },
    'notre dame cathedral': { lat: 10.7798, lng: 106.6990, type: 'landmark' },
    'central post office': { lat: 10.7799, lng: 106.6991, type: 'landmark' },
    'bitexco tower': { lat: 10.7717, lng: 106.7045, type: 'landmark' },
    'landmark 81': { lat: 10.7941, lng: 106.7210, type: 'landmark' },
    
    // Other major cities
    'hanoi': { lat: 21.0285, lng: 105.8542, type: 'city' },
    'da nang': { lat: 16.0544, lng: 108.2022, type: 'city' },
    'can tho': { lat: 10.0452, lng: 105.7469, type: 'city' },
    'hue': { lat: 16.4637, lng: 107.5909, type: 'city' },
    'nha trang': { lat: 12.2388, lng: 109.1967, type: 'city' },
    'vung tau': { lat: 10.4113, lng: 107.1365, type: 'city' }
};

// Search function
router.get('/', (req, res) => {
    const query = req.query.query;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: 'No search query provided' 
        });
    }
    
    const searchTerm = query.toLowerCase().trim();
    console.log('Search query:', searchTerm);
    
    // Search in our local database first
    const results = [];
    
    // Exact match
    if (vietnamPlaces[searchTerm]) {
        results.push({
            name: searchTerm,
            ...vietnamPlaces[searchTerm],
            matchType: 'exact'
        });
    }
    
    // Partial matches
    Object.keys(vietnamPlaces).forEach(place => {
        if (place.includes(searchTerm) && place !== searchTerm) {
            results.push({
                name: place,
                ...vietnamPlaces[place],
                matchType: 'partial'
            });
        }
    });
    
    // Also search for keywords in place names
    if (results.length === 0) {
        Object.keys(vietnamPlaces).forEach(place => {
            const words = searchTerm.split(' ');
            const placeWords = place.split(' ');
            
            const hasMatch = words.some(word => 
                placeWords.some(placeWord => 
                    placeWord.includes(word) || word.includes(placeWord)
                )
            );
            
            if (hasMatch) {
                results.push({
                    name: place,
                    ...vietnamPlaces[place],
                    matchType: 'keyword'
                });
            }
        });
    }
    
    // Sort results by relevance (exact > partial > keyword)
    results.sort((a, b) => {
        const order = { exact: 0, partial: 1, keyword: 2 };
        return order[a.matchType] - order[b.matchType];
    });
    
    // Limit results to top 5
    const limitedResults = results.slice(0, 5);
    
    if (limitedResults.length > 0) {
        res.json({ 
            success: true, 
            message: `Found ${limitedResults.length} result(s) for: ${query}`,
            results: limitedResults,
            searchTerm: query
        });
    } else {
        // Fallback message for using Google Maps geocoding
        res.json({ 
            success: true, 
            message: `No local results found for "${query}". Trying Google Maps geocoding...`,
            results: [],
            useGeocoding: true,
            searchTerm: query
        });
    }
});

// Get suggestions for autocomplete (optional enhancement)
router.get('/suggestions', (req, res) => {
    const query = req.query.q;
    
    if (!query || query.length < 2) {
        return res.json({ success: true, suggestions: [] });
    }
    
    const searchTerm = query.toLowerCase().trim();
    const suggestions = [];
    
    Object.keys(vietnamPlaces).forEach(place => {
        if (place.startsWith(searchTerm) || place.includes(searchTerm)) {
            suggestions.push({
                name: place,
                type: vietnamPlaces[place].type
            });
        }
    });
    
    // Limit to 10 suggestions
    res.json({ 
        success: true, 
        suggestions: suggestions.slice(0, 10)
    });
});

module.exports = router;