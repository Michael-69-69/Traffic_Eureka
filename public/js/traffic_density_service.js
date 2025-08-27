class TrafficDensityService {
    constructor() {
        this.baseUrl = '/api/density';
    }

    async _fetch(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint, window.location.origin);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
                throw new Error(`Request to proxy failed with status ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error fetching from proxy endpoint ${endpoint}:`, error);
            throw error;
        }
    }

    getLiveDensities() {
        return this._fetch('/live');
    }

    getForecast(cameraId, minutes = 60) {
        if (!cameraId) {
            throw new Error('Camera ID is required for fetching a forecast.');
        }
        return this._fetch('/forecast', { camera: cameraId, minutes: minutes });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficDensityService;
} else {
    window.TrafficDensityService = TrafficDensityService;
}