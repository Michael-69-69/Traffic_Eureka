class TrafficDensityService {
    constructor() {
        this.baseUrl = '/api';
    }

    async fetchLiveDensities() {
        try {
            const response = await fetch(`${this.baseUrl}/density/live`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // The backend now provides all necessary data, so we return it directly.
            return data;
        } catch (error) {
            console.error('Error fetching live densities:', error);
            // Re-throw the error to be handled by the caller
            throw error;
        }
    }

    async fetchDensityForecast(cameraId, timePoints = 120) {
        try {
            const response = await fetch(`${this.baseUrl}/density/forecast/${cameraId}?points=${timePoints}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.forecasts;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            // Re-throw the error to be handled by the caller
            throw error;
        }
    }

    async getTodayVehicleCounts() {
        try {
            const response = await fetch(`${this.baseUrl}/density/today-counts`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching today vehicle counts:', error);
            // Re-throw the error to be handled by the caller
            throw error;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficDensityService;
} else {
    window.TrafficDensityService = TrafficDensityService;
}
