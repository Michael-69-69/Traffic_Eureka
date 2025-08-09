const express = require('express');
const router = express.Router();

// Enhanced Ho Chi Minh City places database with comprehensive street and landmark data
const vietnamPlaces = {
    // Districts in HCMC
    'district 1': { lat: 10.7767, lng: 106.7009, type: 'district', fullName: 'District 1, Ho Chi Minh City' },
    'district 2': { lat: 10.7948, lng: 106.7297, type: 'district', fullName: 'District 2, Ho Chi Minh City' },
    'district 3': { lat: 10.7839, lng: 106.6918, type: 'district', fullName: 'District 3, Ho Chi Minh City' },
    'district 4': { lat: 10.7570, lng: 106.7036, type: 'district', fullName: 'District 4, Ho Chi Minh City' },
    'district 5': { lat: 10.7594, lng: 106.6672, type: 'district', fullName: 'District 5, Ho Chi Minh City' },
    'district 6': { lat: 10.7504, lng: 106.6345, type: 'district', fullName: 'District 6, Ho Chi Minh City' },
    'district 7': { lat: 10.7378, lng: 106.7219, type: 'district', fullName: 'District 7, Ho Chi Minh City' },
    'district 8': { lat: 10.7420, lng: 106.6793, type: 'district', fullName: 'District 8, Ho Chi Minh City' },
    'district 10': { lat: 10.7727, lng: 106.6685, type: 'district', fullName: 'District 10, Ho Chi Minh City' },
    'district 11': { lat: 10.7628, lng: 106.6503, type: 'district', fullName: 'District 11, Ho Chi Minh City' },
    'district 12': { lat: 10.8639, lng: 106.6659, type: 'district', fullName: 'District 12, Ho Chi Minh City' },
    'binh thanh': { lat: 10.8013, lng: 106.7111, type: 'district', fullName: 'Binh Thanh District, Ho Chi Minh City' },
    'tan binh': { lat: 10.8009, lng: 106.6529, type: 'district', fullName: 'Tan Binh District, Ho Chi Minh City' },
    'tan phu': { lat: 10.7886, lng: 106.6282, type: 'district', fullName: 'Tan Phu District, Ho Chi Minh City' },
    'go vap': { lat: 10.8376, lng: 106.6765, type: 'district', fullName: 'Go Vap District, Ho Chi Minh City' },
    'phu nhuan': { lat: 10.7968, lng: 106.6835, type: 'district', fullName: 'Phu Nhuan District, Ho Chi Minh City' },
    'thu duc': { lat: 10.8491, lng: 106.7663, type: 'district', fullName: 'Thu Duc District, Ho Chi Minh City' },
    
    // Major Streets and Roads in HCMC
    'nguyen hue': { lat: 10.7748, lng: 106.7020, type: 'street', fullName: 'Nguyen Hue Street, District 1' },
    'le loi': { lat: 10.7697, lng: 106.6969, type: 'street', fullName: 'Le Loi Street, District 1' },
    'dong khoi': { lat: 10.7771, lng: 106.7020, type: 'street', fullName: 'Dong Khoi Street, District 1' },
    'tran hung dao': { lat: 10.7573, lng: 106.6885, type: 'street', fullName: 'Tran Hung Dao Street, District 1' },
    'ly thai to': { lat: 10.7831, lng: 106.6954, type: 'street', fullName: 'Ly Thai To Street, District 1' },
    'ba thang hai': { lat: 10.7892, lng: 106.6638, type: 'street', fullName: 'Ba Thang Hai Street, District 10' },
    'su van hanh': { lat: 10.7825, lng: 106.6823, type: 'street', fullName: 'Su Van Hanh Street, District 10' },
    'cong hoa': { lat: 10.8010, lng: 106.6527, type: 'street', fullName: 'Cong Hoa Street, Tan Binh' },
    'nguyen thi minh khai': { lat: 10.7894, lng: 106.6947, type: 'street', fullName: 'Nguyen Thi Minh Khai Street, District 1' },
    'ham nghi': { lat: 10.7691, lng: 106.6954, type: 'street', fullName: 'Ham Nghi Street, District 1' },
    'vo van tan': { lat: 10.7851, lng: 106.6930, type: 'street', fullName: 'Vo Van Tan Street, District 3' },
    'nam ky khoi nghia': { lat: 10.7833, lng: 106.6897, type: 'street', fullName: 'Nam Ky Khoi Nghia Street, District 1' },
    'truong dinh': { lat: 10.7835, lng: 106.6892, type: 'street', fullName: 'Truong Dinh Street, District 3' },
    'dien bien phu': { lat: 10.7813, lng: 106.6916, type: 'street', fullName: 'Dien Bien Phu Street, District 1' },
    'nguyen du': { lat: 10.7920, lng: 106.6954, type: 'street', fullName: 'Nguyen Du Street, District 1' },
    'vo thi sau': { lat: 10.7900, lng: 106.6944, type: 'street', fullName: 'Vo Thi Sau Street, District 3' },
    'cao thang': { lat: 10.7874, lng: 106.6885, type: 'street', fullName: 'Cao Thang Street, District 3' },
    'bach dang': { lat: 10.7724, lng: 106.7067, type: 'street', fullName: 'Bach Dang Street, District 1' },
    'ton duc thang': { lat: 10.7706, lng: 106.7075, type: 'street', fullName: 'Ton Duc Thang Street, District 1' },
    'hai ba trung': { lat: 10.7886, lng: 106.6999, type: 'street', fullName: 'Hai Ba Trung Street, District 1' },
    'pasteur': { lat: 10.7780, lng: 106.6943, type: 'street', fullName: 'Pasteur Street, District 1' },
    'le thanh ton': { lat: 10.7813, lng: 106.6974, type: 'street', fullName: 'Le Thanh Ton Street, District 1' },
    'mac thi buoi': { lat: 10.7782, lng: 106.6987, type: 'street', fullName: 'Mac Thi Buoi Street, District 1' },
    'nguyen an ninh': { lat: 10.7948, lng: 106.6936, type: 'street', fullName: 'Nguyen An Ninh Street, District 1' },
    'le van sy': { lat: 10.7979, lng: 106.6851, type: 'street', fullName: 'Le Van Sy Street, Phu Nhuan' },
    'phan xich long': { lat: 10.7962, lng: 106.6825, type: 'street', fullName: 'Phan Xich Long Street, Phu Nhuan' },
    'cmt8': { lat: 10.7654, lng: 106.6611, type: 'street', fullName: 'Cach Mang Thang Tam Street, District 10' },
    'cach mang thang tam': { lat: 10.7654, lng: 106.6611, type: 'street', fullName: 'Cach Mang Thang Tam Street, District 10' },
    'nguyen dinh chieu': { lat: 10.7831, lng: 106.6954, type: 'street', fullName: 'Nguyen Dinh Chieu Street, District 3' },
    'vo van kiet': { lat: 10.7565, lng: 106.6938, type: 'street', fullName: 'Vo Van Kiet Boulevard, District 1' },
    'nguyen trai': { lat: 10.7585, lng: 106.6724, type: 'street', fullName: 'Nguyen Trai Street, District 5' },
    'tran phu': { lat: 10.7579, lng: 106.6683, type: 'street', fullName: 'Tran Phu Street, District 5' },
    'an duong vuong': { lat: 10.7537, lng: 106.6429, type: 'street', fullName: 'An Duong Vuong Street, District 5' },
    'pham ngu lao': { lat: 10.7676, lng: 106.6918, type: 'street', fullName: 'Pham Ngu Lao Street, District 1' },
    'de tham': { lat: 10.7665, lng: 106.6919, type: 'street', fullName: 'De Tham Street, District 1' },
    'bui vien': { lat: 10.7671, lng: 106.6925, type: 'street', fullName: 'Bui Vien Street, District 1' },
    'xuan thuy': { lat: 10.8460, lng: 106.7740, type: 'street', fullName: 'Xuan Thuy Street, Thu Duc' },
    'vo nguyen giap': { lat: 10.8511, lng: 106.7663, type: 'street', fullName: 'Vo Nguyen Giap Street, Thu Duc' },
    'nguyen van linh': { lat: 10.7378, lng: 106.7219, type: 'street', fullName: 'Nguyen Van Linh Parkway, District 7' },
    'nguyen huu tho': { lat: 10.7302, lng: 106.7205, type: 'street', fullName: 'Nguyen Huu Tho Street, District 7' },
    'hoang sa': { lat: 10.7928, lng: 106.7052, type: 'street', fullName: 'Hoang Sa Street, District 1' },
    'truong sa': { lat: 10.7948, lng: 106.7085, type: 'street', fullName: 'Truong Sa Street, District 1' },
    
    // Major Highways and Expressways
    'highway 1a': { lat: 10.7769, lng: 106.7009, type: 'highway', fullName: 'National Highway 1A' },
    'ring road 2': { lat: 10.8200, lng: 106.6800, type: 'highway', fullName: 'Ring Road 2 (Dai Lo Vo Van Kiet)' },
    'east west highway': { lat: 10.7600, lng: 106.7200, type: 'highway', fullName: 'East-West Highway' },
    'saigon bridge': { lat: 10.7724, lng: 106.7067, type: 'bridge', fullName: 'Saigon Bridge' },
    'thu thiem bridge': { lat: 10.7865, lng: 106.7145, type: 'bridge', fullName: 'Thu Thiem Bridge' },
    'phu my bridge': { lat: 10.7378, lng: 106.7319, type: 'bridge', fullName: 'Phu My Bridge' },
    
    // Popular Landmarks and Areas
    'ben thanh market': { lat: 10.7729, lng: 106.6980, type: 'landmark', fullName: 'Ben Thanh Market, District 1' },
    'reunification palace': { lat: 10.7769, lng: 106.6955, type: 'landmark', fullName: 'Reunification Palace, District 1' },
    'independence palace': { lat: 10.7769, lng: 106.6955, type: 'landmark', fullName: 'Independence Palace, District 1' },
    'notre dame cathedral': { lat: 10.7798, lng: 106.6990, type: 'landmark', fullName: 'Notre Dame Cathedral, District 1' },
    'central post office': { lat: 10.7799, lng: 106.6991, type: 'landmark', fullName: 'Central Post Office, District 1' },
    'bitexco tower': { lat: 10.7717, lng: 106.7045, type: 'landmark', fullName: 'Bitexco Financial Tower, District 1' },
    'landmark 81': { lat: 10.7941, lng: 106.7210, type: 'landmark', fullName: 'Landmark 81, Binh Thanh District' },
    'ho chi minh city hall': { lat: 10.7766, lng: 106.7009, type: 'landmark', fullName: 'Ho Chi Minh City Hall, District 1' },
    'war remnants museum': { lat: 10.7797, lng: 106.6919, type: 'landmark', fullName: 'War Remnants Museum, District 3' },
    'jade emperor pagoda': { lat: 10.7919, lng: 106.6954, type: 'landmark', fullName: 'Jade Emperor Pagoda, District 1' },
    'cao dai temple': { lat: 10.7594, lng: 106.6672, type: 'landmark', fullName: 'Cao Dai Temple, District 5' },
    'giac lam pagoda': { lat: 10.7886, lng: 106.6282, type: 'landmark', fullName: 'Giac Lam Pagoda, Tan Phu District' },
    'tan son nhat airport': { lat: 10.8187, lng: 106.6525, type: 'landmark', fullName: 'Tan Son Nhat International Airport' },
    'saigon skydeck': { lat: 10.7717, lng: 106.7045, type: 'landmark', fullName: 'Saigon Skydeck, Bitexco Tower' },
    'diamond plaza': { lat: 10.7783, lng: 106.6987, type: 'landmark', fullName: 'Diamond Plaza, District 1' },
    'vincom center': { lat: 10.7748, lng: 106.7020, type: 'landmark', fullName: 'Vincom Center, District 1' },
    'takashimaya': { lat: 10.7748, lng: 106.7020, type: 'landmark', fullName: 'Takashimaya Department Store, District 1' },
    'saigon centre': { lat: 10.7783, lng: 106.6987, type: 'landmark', fullName: 'Saigon Centre, District 1' },
    
    // Universities and Schools
    'university of economics': { lat: 10.7734, lng: 106.6879, type: 'university', fullName: 'University of Economics Ho Chi Minh City' },
    'rmit university': { lat: 10.7291, lng: 106.6958, type: 'university', fullName: 'RMIT University Vietnam, District 7' },
    'ton duc thang university': { lat: 10.7706, lng: 106.7075, type: 'university', fullName: 'Ton Duc Thang University, District 1' },
    'banking university': { lat: 10.8509, lng: 106.7717, type: 'university', fullName: 'Banking University of Ho Chi Minh City' },
    
    // Parks and Recreation
    'tao dan park': { lat: 10.7827, lng: 106.6953, type: 'park', fullName: 'Tao Dan Park, District 1' },
    'le van tam park': { lat: 10.7901, lng: 106.6954, type: 'park', fullName: 'Le Van Tam Park, District 1' },
    'september 23 park': { lat: 10.7766, lng: 106.7009, type: 'park', fullName: 'September 23 Park, District 1' },
    'van thanh park': { lat: 10.8013, lng: 106.7111, type: 'park', fullName: 'Van Thanh Park, Binh Thanh' },
    'gia dinh park': { lat: 10.8200, lng: 106.6800, type: 'park', fullName: 'Gia Dinh Park, Phu Nhuan' },
    
    // Markets and Commercial Areas
    'saigon square': { lat: 10.7748, lng: 106.7020, type: 'market', fullName: 'Saigon Square, District 1' },
    'russian market': { lat: 10.7911, lng: 106.6954, type: 'market', fullName: 'Russian Market, District 1' },
    'cho lon': { lat: 10.7594, lng: 106.6672, type: 'area', fullName: 'Cho Lon (Chinatown), District 5' },
    'chinatown': { lat: 10.7594, lng: 106.6672, type: 'area', fullName: 'Chinatown (Cho Lon), District 5' },
    'japanese town': { lat: 10.7291, lng: 106.6958, type: 'area', fullName: 'Japanese Town, District 7' },
    'korean town': { lat: 10.8009, lng: 106.6529, type: 'area', fullName: 'Korean Town, Tan Binh' },
    
    // Transportation Hubs
    'ben xe mien dong': { lat: 10.8147, lng: 106.7197, type: 'transport', fullName: 'Mien Dong Bus Station, Binh Thanh' },
    'ben xe mien tay': { lat: 10.7420, lng: 106.6193, type: 'transport', fullName: 'Mien Tay Bus Station, An Lac' },
    'saigon railway station': { lat: 10.7827, lng: 106.6766, type: 'transport', fullName: 'Saigon Railway Station, District 3' },
    'cat lai port': { lat: 10.7948, lng: 106.7597, type: 'transport', fullName: 'Cat Lai Port, District 2' },
    
    // Hospitals and Medical Centers
    'cho ray hospital': { lat: 10.7594, lng: 106.6672, type: 'hospital', fullName: 'Cho Ray Hospital, District 5' },
    'university medical center': { lat: 10.7634, lng: 106.6672, type: 'hospital', fullName: 'University Medical Center, District 5' },
    'fv hospital': { lat: 10.7291, lng: 106.6958, type: 'hospital', fullName: 'FV Hospital, District 7' },
    'international hospital': { lat: 10.7886, lng: 106.6999, type: 'hospital', fullName: 'International Hospital, District 1' },
    
    // Popular Areas and Neighborhoods
    'pham ngu lao': { lat: 10.7676, lng: 106.6918, type: 'area', fullName: 'Pham Ngu Lao Backpacker Area, District 1' },
    'bui vien': { lat: 10.7671, lng: 106.6925, type: 'street', fullName: 'Bui Vien Street (Backpacker Street), District 1' },
    'thao dien': { lat: 10.8033, lng: 106.7297, type: 'area', fullName: 'Thao Dien, District 2' },
    'an phu': { lat: 10.7948, lng: 106.7397, type: 'area', fullName: 'An Phu, District 2' },
    'phu my hung': { lat: 10.7291, lng: 106.6958, type: 'area', fullName: 'Phu My Hung, District 7' },
    'crescent mall': { lat: 10.7291, lng: 106.6958, type: 'landmark', fullName: 'Crescent Mall, District 7' },
    
    // Common abbreviations and alternative names
    'q1': { lat: 10.7767, lng: 106.7009, type: 'district', fullName: 'District 1 (Q1), Ho Chi Minh City' },
    'q3': { lat: 10.7839, lng: 106.6918, type: 'district', fullName: 'District 3 (Q3), Ho Chi Minh City' },
    'bt': { lat: 10.8013, lng: 106.7111, type: 'district', fullName: 'Binh Thanh District (BT), Ho Chi Minh City' },
    'tb': { lat: 10.8009, lng: 106.6529, type: 'district', fullName: 'Tan Binh District (TB), Ho Chi Minh City' },
    'hcmc': { lat: 10.7769, lng: 106.7009, type: 'city', fullName: 'Ho Chi Minh City (HCMC)' },
    'saigon': { lat: 10.7769, lng: 106.7009, type: 'city', fullName: 'Saigon (Ho Chi Minh City)' },
    'tp hcm': { lat: 10.7769, lng: 106.7009, type: 'city', fullName: 'TP Ho Chi Minh (Ho Chi Minh City)' },
    
    // Common intersections
    'nga tu ben thanh': { lat: 10.7729, lng: 106.6980, type: 'intersection', fullName: 'Ben Thanh Market Intersection' },
    'nga tu hang xanh': { lat: 10.8013, lng: 106.7111, type: 'intersection', fullName: 'Hang Xanh Intersection, Binh Thanh' },
    'nga sau cong hoa': { lat: 10.8010, lng: 106.6527, type: 'intersection', fullName: 'Cong Hoa Six-way Intersection' },
    'nga ba dien bien phu': { lat: 10.7813, lng: 106.6916, type: 'intersection', fullName: 'Dien Bien Phu Three-way Intersection' }
};

// Enhanced search function with better matching
function searchPlaces(query) {
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    // Score-based matching for better relevance
    Object.keys(vietnamPlaces).forEach(place => {
        const placeData = vietnamPlaces[place];
        let score = 0;
        let matchType = '';
        
        // Exact match (highest score)
        if (place === searchTerm) {
            score = 100;
            matchType = 'exact';
        }
        // Starts with query (high score)
        else if (place.startsWith(searchTerm)) {
            score = 80;
            matchType = 'prefix';
        }
        // Contains all words from query (medium score)
        else if (containsAllWords(place, searchTerm)) {
            score = 60;
            matchType = 'all-words';
        }
        // Contains any word from query (lower score)
        else if (containsAnyWord(place, searchTerm)) {
            score = 40;
            matchType = 'partial';
        }
        // Similar/fuzzy match (lowest score)
        else if (isSimilar(place, searchTerm)) {
            score = 20;
            matchType = 'similar';
        }
        
        if (score > 0) {
            results.push({
                name: place,
                displayName: placeData.fullName || place,
                lat: placeData.lat,
                lng: placeData.lng,
                type: placeData.type,
                score: score,
                matchType: matchType
            });
        }
    });
    
    // Sort by score (highest first), then by name length (shorter first)
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.length - b.name.length;
    });
    
    return results;
}

// Helper functions for matching
function containsAllWords(text, query) {
    const queryWords = query.split(' ').filter(word => word.length > 0);
    return queryWords.every(word => text.includes(word));
}

function containsAnyWord(text, query) {
    const queryWords = query.split(' ').filter(word => word.length > 1); // Only consider words > 1 char
    return queryWords.some(word => text.includes(word));
}

function isSimilar(text, query) {
    // Simple similarity check - can be enhanced with more sophisticated algorithms
    const similarity = calculateSimilarity(text, query);
    return similarity > 0.6; // 60% similarity threshold
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Main search endpoint
router.get('/', (req, res) => {
    const query = req.query.query;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: 'No search query provided' 
        });
    }
    
    console.log('Search query:', query);
    
    // Search in our enhanced HCMC database
    const results = searchPlaces(query);
    
    // Limit results to top 10
    const limitedResults = results.slice(0, 10);
    
    if (limitedResults.length > 0) {
        res.json({ 
            success: true, 
            message: `Found ${limitedResults.length} result(s) for: ${query}`,
            results: limitedResults,
            searchTerm: query,
            useGeocoding: false // Our database has results, don't use geocoding
        });
    } else {
        // Fallback to Google Maps geocoding for places not in our database
        res.json({ 
            success: true, 
            message: `No local results found for "${query}". Trying Google Maps geocoding...`,
            results: [],
            useGeocoding: true,
            searchTerm: query
        });
    }
});

// Enhanced suggestions endpoint for autocomplete
router.get('/suggestions', (req, res) => {
    const query = req.query.q;
    
    if (!query || query.length < 1) {
        return res.json({ success: true, suggestions: [] });
    }
    
    const searchTerm = query.toLowerCase().trim();
    const suggestions = [];
    
    // Get all matching places with scores
    const matches = searchPlaces(searchTerm);
    
    // Convert to suggestion format
    matches.slice(0, 8).forEach(match => { // Limit to 8 suggestions
        suggestions.push({
            name: match.name,
            displayName: match.displayName,
            type: match.type,
            score: match.score,
            matchType: match.matchType
        });
    });
    
    res.json({ 
        success: true, 
        suggestions: suggestions,
        query: query
    });
});

// Additional endpoint for getting place details
router.get('/place/:placeName', (req, res) => {
    const placeName = req.params.placeName.toLowerCase();
    const place = vietnamPlaces[placeName];
    
    if (place) {
        res.json({
            success: true,
            place: {
                name: placeName,
                displayName: place.fullName || placeName,
                lat: place.lat,
                lng: place.lng,
                type: place.type
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Place not found'
        });
    }
});

module.exports = router;