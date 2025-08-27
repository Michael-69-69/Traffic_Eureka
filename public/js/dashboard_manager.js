class DashboardManager {
    constructor() {
        this.densityService = new TrafficDensityService();
        this.cameraData = {};
        this.forecasts = {};
        this.selectedRoad = null;
        this.isLoading = false;
        this.refreshInterval = null;
        this.historicalChartInstance = null;
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        console.log('Initializing dashboard...');
        this.createDashboardUI();
        await this.refreshDashboard();
        this.startAutoRefresh();
        this.setupEventListeners();
    }

    createDashboardUI() {
        const existingDashboard = document.getElementById('dashboard-container');
        if (existingDashboard) {
            existingDashboard.remove();
        }

        const dashboardHTML = `
            <div id="dashboard-container" style="display: none; position: absolute; top: 20px; left: 20px; width: 800px; max-width: 90vw; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 15; max-height: 90vh; overflow-y: auto;">
                <div class="dashboard-header" style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 16px; border-radius: 12px 12px 0 0; cursor: grab; user-select: none;">
                    <h2 style="margin: 0; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <span>📊</span>
                        Traffic Dashboard
                    </h2>
                    <button id="close-dashboard" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 16px;">×</button>
                    <button id="refresh-dashboard" style="position: absolute; top: 12px; right: 50px; background: rgba(255,255,255,0.2); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px;">↻</button>
                </div>
                
                <div class="dashboard-content" style="padding: 20px;">
                    <div class="road-selector" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Select Road:</label>
                        <select id="road-selector" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; background: white;">
                            <option value="">Choose a road...</option>
                        </select>
                    </div>

                    <div id="road-details" style="display: none; margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1976d2;">
                        <h3 id="road-name" style="margin: 0 0 12px 0; color: #1976d2; font-size: 18px;"></h3>
                        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Vehicle Count</div>
                                <div id="vehicle-count" style="font-size: 20px; font-weight: bold; color: #1976d2;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Density</div>
                                <div id="density" style="font-size: 20px; font-weight: bold; color: #ff9800;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Est. Speed</div>
                                <div id="estimated-speed" style="font-size: 20px; font-weight: bold; color: #4caf50;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Traffic Level</div>
                                <div id="traffic-level" style="font-size: 16px; font-weight: bold;">-</div>
                            </div>
                        </div>
                        
                        <div class="forecast-section" style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 12px 0; color: #333; display: flex; align-items: center; gap: 8px;">
                                🧠 LSTM Forecast (Density %)
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                                <div>
                                    <div style="font-size: 12px; color: #666;">+15 min</div>
                                    <div id="forecast-15min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #666;">+30 min</div>
                                    <div id="forecast-30min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #666;">+60 min</div>
                                    <div id="forecast-60min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="historical-chart-container" style="display: none; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; height: 350px; overflow: hidden;">
                        <h3 style="margin: 0 0 16px 0; color: #333;">Historical Traffic Density (Last 3 Mins)</h3>
                        <canvas id="historical-chart"></canvas>
                    </div>

                    <div class="road-list-section">
                        <h3 style="margin: 0 0 16px 0; color: #333; display: flex; align-items: center; gap: 8px;">
                            🚗 All Roads Overview
                        </h3>
                        <div id="road-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
                        </div>
                    </div>
                    
                    <div id="dashboard-loading" style="display: none; text-align: center; padding: 40px; color: #666;">
                        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                        <div>Loading traffic data...</div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .dashboard-header:active { cursor: grabbing; }
                #dashboard-container button:hover { opacity: 0.8; transform: translateY(-1px); }
                .metric-item, .road-card { transition: all 0.2s ease-in-out; }
                .metric-item:hover, .road-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            </style>
        `;

        document.getElementById('map-container').insertAdjacentHTML('beforeend', dashboardHTML);
        this.makeDashboardDraggable();
    }

    makeDashboardDraggable() {
        const dashboard = document.getElementById('dashboard-container');
        const header = dashboard.querySelector('.dashboard-header');
        let isDragging = false, xOffset = 0, yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            xOffset = e.clientX - dashboard.getBoundingClientRect().left;
            yOffset = e.clientY - dashboard.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            dashboard.style.left = `${e.clientX - xOffset}px`;
            dashboard.style.top = `${e.clientY - yOffset}px`;
        });

        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    setupEventListeners() {
        document.getElementById('close-dashboard').addEventListener('click', () => this.closeDashboard());
        document.getElementById('refresh-dashboard').addEventListener('click', () => this.refreshDashboard());
        document.getElementById('road-selector').addEventListener('change', (e) => this.selectRoad(e.target.value));
    }

    async fetchLiveDensities() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.showLoading(true);

        try {
            const response = await this.densityService.getLiveDensities();
            if (!response || !response.cameras || Object.keys(response.cameras).length === 0) {
                throw new Error('No camera data received from backend');
            }
            this.cameraData = response.cameras;
            this.populateRoadSelector();
            this.updateRoadList();
            
            if (this.selectedRoad) {
                this.updateRoadDetails(this.selectedRoad);
                await this.fetchForecast(this.selectedRoad);
            }
        } catch (error) {
            console.error('Error fetching live density:', error);
            this.showError('Failed to connect to the traffic service.');
            this.cameraData = {};
            this.populateRoadSelector();
            this.updateRoadList();
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async fetchForecast(cameraId) {
        const MINUTES_TO_FORECAST = 60;

        try {
            const response = await this.densityService.getForecast(cameraId, MINUTES_TO_FORECAST);
            console.log('Forecast response:', response); // Debug log to inspect data

            if (!response || !response.forecast) {
                throw new Error('Invalid forecast data received');
            }

            const isFallbackData = (forecast, currentDensity) => {
                if (forecast.length < 20) return false;
                const firstVal = forecast[0].predicted_density;
                const midVal = forecast[Math.floor(forecast.length / 2)].predicted_density;
                const lastVal = forecast[forecast.length - 1].predicted_density;
                return firstVal === midVal && midVal === lastVal;
            };

            if (isFallbackData(response.forecast, response.current_density)) {
                console.warn(`[Dashboard] Fallback forecast data detected for camera ${cameraId}. Ignoring.`);
                this.forecasts[cameraId] = [];
            } else {
                this.forecasts[cameraId] = response.forecast;
            }
        } catch (error) {
            console.error(`Error fetching forecast for ${cameraId}:`, error);
            this.forecasts[cameraId] = [];
        } finally {
            this.updateForecastDisplay(cameraId);
            this.updateHistoricalChart(cameraId); // Updated to use new method
        }
    }

    populateRoadSelector() {
        const selector = document.getElementById('road-selector');
        const currentValue = selector.value;
        selector.innerHTML = '<option value="">Choose a road...</option>';

        if (Object.keys(this.cameraData).length > 0) {
            Object.entries(this.cameraData)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .forEach(([roadId, data]) => {
                    const option = document.createElement('option');
                    option.value = roadId;
                    option.textContent = data.name || roadId;
                    selector.appendChild(option);
                });
        }
        
        if (currentValue && this.cameraData[currentValue]) {
            selector.value = currentValue;
        }
    }

    async selectRoad(roadId) {
        if (!roadId || !this.cameraData[roadId]) {
            this.selectedRoad = null;
            document.getElementById('road-details').style.display = 'none';
            document.getElementById('historical-chart-container').style.display = 'none';
            return;
        }
        this.selectedRoad = roadId;
        this.updateRoadDetails(roadId);
        await this.fetchForecast(roadId);
    }

    updateRoadDetails(roadId) {
        const data = this.cameraData[roadId];
        if (!data) {
            document.getElementById('road-details').style.display = 'none';
            return;
        }
        document.getElementById('road-details').style.display = 'block';
        document.getElementById('road-name').textContent = data.name || roadId;
        document.getElementById('vehicle-count').textContent = data.vehicle_count >= 0 ? data.vehicle_count : 'N/A';
        document.getElementById('density').textContent = data.density >= 0 ? `${data.density.toFixed(1)}%` : 'N/A';
        document.getElementById('estimated-speed').textContent = data.estimated_speed > 0 ? `${data.estimated_speed.toFixed(1)} km/h` : 'N/A';
        
        const trafficLevelEl = document.getElementById('traffic-level');
        trafficLevelEl.textContent = data.traffic_level || 'Unknown';
        trafficLevelEl.style.color = this.getTrafficLevelColor(data.traffic_level);
    }

    updateForecastDisplay(cameraId) {
        const forecast = this.forecasts[cameraId] || [];
        const SECONDS_PER_FRAME = 15;

        const getPrediction = (minutes) => {
            const totalSeconds = minutes * 60;
            const frameIndex = Math.floor(totalSeconds / SECONDS_PER_FRAME);
            if (frameIndex < forecast.length && forecast[frameIndex]) {
                return forecast[frameIndex].predicted_density;
            }
            // If index exceeds forecast length, interpolate or use the last value
            if (frameIndex >= forecast.length && forecast.length > 0) {
                const lastIndex = forecast.length - 1;
                return forecast[lastIndex].predicted_density; // Fallback to last prediction
            }
            return null;
        };

        const forecast15 = getPrediction(15);
        const forecast30 = getPrediction(30);
        const forecast60 = getPrediction(60);

        document.getElementById('forecast-15min').textContent = forecast15 !== null ? `${forecast15.toFixed(1)}%` : 'N/A';
        document.getElementById('forecast-30min').textContent = forecast30 !== null ? `${forecast30.toFixed(1)}%` : 'N/A';
        document.getElementById('forecast-60min').textContent = forecast60 !== null ? `${forecast60.toFixed(1)}%` : 'N/A';
    }

    updateRoadList() {
        const container = document.getElementById('road-list');
        container.innerHTML = '';
        if (Object.keys(this.cameraData).length === 0) {
            container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #666; background: #f8f9fa; padding: 20px; border-radius: 8px;">No active cameras found.</div>`;
            return;
        }

        Object.entries(this.cameraData)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .forEach(([roadId, data]) => {
                const card = document.createElement('div');
                card.className = 'road-card';
                card.style.cssText = `
                    background: white; padding: 16px; border-radius: 8px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;
                    border-left: 4px solid ${this.getTrafficLevelColor(data.traffic_level)};
                `;
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: #333; font-size: 16px; max-width: 70%;">${data.name || roadId}</h4>
                        <span style="background: ${this.getTrafficLevelColor(data.traffic_level)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${data.traffic_level || 'N/A'}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; color: #666;">
                        <div>Density: <strong>${data.density >= 0 ? data.density.toFixed(1) + '%' : 'N/A'}</strong></div>
                        <div>Speed: <strong>${data.estimated_speed > 0 ? data.estimated_speed.toFixed(1) + ' km/h' : 'N/A'}</strong></div>
                        <div>Vehicles: <strong>${data.vehicle_count >= 0 ? data.vehicle_count : 'N/A'}</strong></div>
                    </div>
                `;
                card.addEventListener('click', () => {
                    document.getElementById('road-selector').value = roadId;
                    this.selectRoad(roadId);
                });
                container.appendChild(card);
            });
    }

    updateHistoricalChart(roadId) {
        const chartContainer = document.getElementById('historical-chart-container');
        const canvas = document.getElementById('historical-chart');
        const camera = this.cameraData[roadId];

        if (!camera || !camera.density_history) {
            chartContainer.style.display = 'none';
            return;
        }
        chartContainer.style.display = 'block';

        if (this.historicalChartInstance) {
            this.historicalChartInstance.destroy();
        }

        const history = camera.density_history;
        const currentDensity = camera.density;
        const historyLabels = history.map((_, i) => `-${(history.length - i) * 15}s`);

        this.historicalChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [...historyLabels, 'Now'],
                datasets: [{
                    label: 'Historical Density',
                    data: [...history, currentDensity],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: { target: 'origin', above: 'rgba(54, 162, 235, 0.2)' },
                    tension: 0.3,
                    pointRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Density (%)' } },
                    x: { title: { display: true, text: 'Time' } }
                },
                plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } }
            }
        });
    }

    getTrafficLevelColor(level) {
        switch (level) {
            case 'Free Flow': return '#4caf50';
            case 'Light Traffic': return '#ffc107';
            case 'Moderate Traffic': return '#ff9800';
            case 'Heavy Traffic': return '#f44336';
            case 'Congested': return '#9c27b0';
            case 'No Image': return '#757575';
            default: return '#9e9e9e';
        }
    }

    showLoading(show) {
        document.getElementById('dashboard-loading').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.showToast(message, '#f44336');
    }
    
    showSuccess(message) {
        this.showToast(message, '#4caf50');
    }

    showToast(message, color) {
        const toast = document.createElement('div');
        toast.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${color}; color: white; padding: 12px 20px; border-radius: 6px; z-index: 1000; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => this.fetchLiveDensities(), 15000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshDashboard() {
        await this.fetchLiveDensities();
    }

    openDashboard() {
        const dashboard = document.getElementById('dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'block';
            this.refreshDashboard();
            this.startAutoRefresh();
        }
    }

    closeDashboard() {
        const dashboard = document.getElementById('dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'none';
        }
        this.stopAutoRefresh();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
} else {
    window.DashboardManager = DashboardManager;
}