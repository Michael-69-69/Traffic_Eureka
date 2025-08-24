class DashboardManager {
    constructor() {
        this.densityService = new TrafficDensityService();
        this.cameraData = {};
        this.todayVehicleCounts = {};
        this.forecasts = {};
        this.selectedRoad = null;
        this.selectedTimeframe = 'Last Hour';
        this.isLoadingDensity = false;
        this.refreshInterval = null;
        this.chartInstance = null;
        
        // Initialize dashboard
        this.initializeDashboard();
    }

    async initializeDashboard() {
        console.log('Initializing dashboard...');
        
        // Create dashboard elements
        this.createDashboardUI();
        
        // Fetch initial data
        await this.fetchLiveDensities();
        await this.fetchTodayVehicleCounts();
        
        // Set up auto-refresh
        this.startAutoRefresh();
        
        // Setup event listeners
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
                    <!-- Road Selector -->
                    <div class="road-selector" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Select Road:</label>
                        <select id="road-selector" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; background: white;">
                            <option value="">Choose a road...</option>
                        </select>
                    </div>

                    <!-- Road Details -->
                    <div id="road-details" style="display: none; margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1976d2;">
                        <h3 id="road-name" style="margin: 0 0 12px 0; color: #1976d2; font-size: 18px;"></h3>
                        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Vehicle Count (5-min bin)</div>
                                <div id="vehicle-count" style="font-size: 20px; font-weight: bold; color: #1976d2;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Density</div>
                                <div id="density" style="font-size: 20px; font-weight: bold; color: #ff9800;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Estimated Speed</div>
                                <div id="estimated-speed" style="font-size: 20px; font-weight: bold; color: #4caf50;">-</div>
                            </div>
                            <div class="metric-item" style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Traffic Level</div>
                                <div id="traffic-level" style="font-size: 16px; font-weight: bold;">-</div>
                            </div>
                        </div>
                        
                        <!-- LSTM Forecast -->
                        <div class="forecast-section" style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <h4 style="margin: 0 0 12px 0; color: #333; display: flex; align-items: center; gap: 8px;">
                                🧠 LSTM Forecast
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
                                <div>
                                    <div style="font-size: 12px; color: #666;">5-min</div>
                                    <div id="forecast-5min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #666;">15-min</div>
                                    <div id="forecast-15min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #666;">30-min</div>
                                    <div id="forecast-30min" style="font-size: 18px; font-weight: bold; color: #2196f3;">-</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Timeframe and Export -->
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <select id="timeframe-selector" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="Last Hour">Last Hour</option>
                                <option value="Last Day">Last Day</option>
                            </select>
                            <button id="export-report" style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">📊 Export Report</button>
                            <button id="export-graph" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">📈 Export Graph</button>
                        </div>
                    </div>

                    <!-- Chart Container -->
                    <div id="chart-container" style="display: none; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; height: 400px; overflow: hidden;">
                        <h3 style="margin: 0 0 16px 0; color: #333;">Traffic History</h3>
                        <canvas id="traffic-chart" style="max-height: 300px !important; max-width: 100% !important;"></canvas>
                    </div>

                    <!-- Road List -->
                    <div class="road-list-section">
                        <h3 style="margin: 0 0 16px 0; color: #333; display: flex; align-items: center; gap: 8px;">
                            🚗 All Roads Overview
                        </h3>
                        <div id="road-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px;">
                            <!-- Road cards will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Loading Indicator -->
                    <div id="dashboard-loading" style="display: none; text-align: center; padding: 40px; color: #666;">
                        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                        <div>Loading traffic data...</div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .dashboard-header:active {
                    cursor: grabbing;
                }
                #dashboard-container button:hover {
                    opacity: 0.8;
                    transform: translateY(-1px);
                }
                .metric-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .road-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
            </style>
        `;

        document.getElementById('map-container').insertAdjacentHTML('beforeend', dashboardHTML);
        
        // Make dashboard draggable
        this.makeDashboardDraggable();
    }

    makeDashboardDraggable() {
        const dashboard = document.getElementById('dashboard-container');
        const header = dashboard.querySelector('.dashboard-header');
        
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            
            dashboard.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    setupEventListeners() {
        // Close dashboard
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.closeDashboard();
        });

        // Refresh dashboard
        document.getElementById('refresh-dashboard').addEventListener('click', () => {
            this.refreshDashboard();
        });

        // Road selector
        document.getElementById('road-selector').addEventListener('change', (e) => {
            this.selectRoad(e.target.value);
        });

        // Timeframe selector
        document.getElementById('timeframe-selector').addEventListener('change', (e) => {
            this.selectedTimeframe = e.target.value;
            if (this.selectedRoad) {
                this.updateChart(this.selectedRoad);
            }
        });

        // Export buttons
        document.getElementById('export-report').addEventListener('click', () => {
            if (this.selectedRoad) {
                this.exportReport(this.selectedRoad);
            }
        });

        document.getElementById('export-graph').addEventListener('click', () => {
            if (this.selectedRoad) {
                this.exportGraphData(this.selectedRoad);
            }
        });
    }

    async fetchLiveDensities() {
        if (this.isLoadingDensity) return;
        
        this.isLoadingDensity = true;
        this.showLoading(true);

        try {
            const data = await this.densityService.fetchLiveDensities();
            this.cameraData = data.cameras;
            this.populateRoadSelector();
            this.updateRoadList();
            
            if (this.selectedRoad) {
                this.updateRoadDetails(this.selectedRoad);
                await this.fetchForecast(this.selectedRoad);
            }
        } catch (error) {
            console.error('Error fetching live density:', error);
            this.showError('Failed to fetch traffic data');
        } finally {
            this.isLoadingDensity = false;
            this.showLoading(false);
        }
    }

    async fetchTodayVehicleCounts() {
        try {
            const data = await this.densityService.getTodayVehicleCounts();
            this.todayVehicleCounts = data.cameras;
        } catch (error) {
            console.error('Error fetching today vehicle counts:', error);
        }
    }

    async fetchForecast(cameraId) {
        try {
            const forecasts = await this.densityService.fetchDensityForecast(cameraId, 120);
            this.forecasts[cameraId] = forecasts[cameraId] || [];
            this.updateForecastDisplay(cameraId);
        } catch (error) {
            console.error('Error fetching forecast:', error);
        }
    }

    populateRoadSelector() {
        const selector = document.getElementById('road-selector');
        const currentValue = selector.value;
        
        // Clear existing options except the first one
        while (selector.children.length > 1) {
            selector.removeChild(selector.lastChild);
        }
        
        Object.entries(this.cameraData).forEach(([roadId, data]) => {
            const option = document.createElement('option');
            option.value = roadId;
            option.textContent = data.name || roadId;
            selector.appendChild(option);
        });
        
        // Restore selection if possible
        if (currentValue && this.cameraData[currentValue]) {
            selector.value = currentValue;
        }
    }

    selectRoad(roadId) {
        if (!roadId || !this.cameraData[roadId]) {
            this.selectedRoad = null;
            document.getElementById('road-details').style.display = 'none';
            document.getElementById('chart-container').style.display = 'none';
            return;
        }

        this.selectedRoad = roadId;
        this.updateRoadDetails(roadId);
        this.fetchForecast(roadId);
        this.updateChart(roadId);
        
        // Center map on selected road
        if (window.map && this.cameraData[roadId].coordinates) {
            const coords = this.cameraData[roadId].coordinates;
            window.map.setCenter(coords);
            window.map.setZoom(16);
        }
    }

    updateRoadDetails(roadId) {
        const data = this.cameraData[roadId];
        if (!data) return;

        document.getElementById('road-details').style.display = 'block';
        document.getElementById('road-name').textContent = data.name || roadId;
        
        // Update metrics
        document.getElementById('vehicle-count').textContent = 
            data.vehicle_count;
        document.getElementById('density').textContent = 
            `${data.density?.toFixed(1) || '0.0'}%`;
        document.getElementById('estimated-speed').textContent = 
            `${data.estimated_speed?.toFixed(1) || '0.0'} km/h`;
        
        const trafficLevel = document.getElementById('traffic-level');
        trafficLevel.textContent = data.traffic_level || 'No Traffic';
        trafficLevel.style.color = this.getTrafficLevelColor(data.traffic_level);
    }

    updateForecastDisplay(cameraId) {
        const forecast = this.forecasts[cameraId] || [];
        if (forecast.length === 0) return;

        const forecast5min = forecast.slice(0, 20);
        const forecast15min = forecast.slice(20, 60);
        const forecast30min = forecast.slice(60, 120);

        document.getElementById('forecast-5min').textContent = 
            `${this.average(forecast5min)?.toFixed(1) || 'N/A'}%`;
        document.getElementById('forecast-15min').textContent = 
            `${this.average(forecast15min)?.toFixed(1) || 'N/A'}%`;
        document.getElementById('forecast-30min').textContent = 
            `${this.average(forecast30min)?.toFixed(1) || 'N/A'}%`;
    }

    updateRoadList() {
        const container = document.getElementById('road-list');
        container.innerHTML = '';

        Object.entries(this.cameraData).forEach(([roadId, data]) => {
            const card = document.createElement('div');
            card.className = 'road-card';
            card.style.cssText = `
                background: white; 
                padding: 16px; 
                border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                cursor: pointer; 
                transition: all 0.3s ease;
                border-left: 4px solid ${this.getTrafficLevelColor(data.traffic_level)};
            `;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #333; font-size: 16px;">${data.name || roadId}</h4>
                    <span style="background: ${this.getTrafficLevelColor(data.traffic_level)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ${data.traffic_level || 'Unknown'}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; color: #666;">
                    <div>Density: <strong>${data.density?.toFixed(1) || '0.0'}%</strong></div>
                    <div>Speed: <strong>${data.estimated_speed?.toFixed(1) || '0.0'} km/h</strong></div>
                    <div>Vehicles: <strong>${data.vehicle_count}</strong></div>
                    <div>Weather: <strong>${data.weather || 'Unknown'}</strong></div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                document.getElementById('road-selector').value = roadId;
                this.selectRoad(roadId);
            });
            
            container.appendChild(card);
        });
    }

    updateChart(roadId) {
        const chartContainer = document.getElementById('chart-container');
        const canvas = document.getElementById('traffic-chart');
        
        if (!this.todayVehicleCounts[roadId]) {
            chartContainer.style.display = 'none';
            return;
        }

        chartContainer.style.display = 'block';
        
        // Destroy existing chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }

        const data = this.processGraphData(roadId, this.selectedTimeframe);
        if (data.length === 0) {
            canvas.style.display = 'none';
            chartContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No data available for the selected timeframe.</div>';
            return;
        }

        // Reset canvas and container styling
        canvas.style.display = 'block';
        canvas.style.height = '300px'; // Fixed height
        canvas.style.width = '100%';
        
        // Set fixed dimensions on canvas element
        canvas.height = 300;
        canvas.width = canvas.offsetWidth;
        
        const ctx = canvas.getContext('2d');
        
        const labels = data.map((item, index) => {
            const time = new Date(item.timestamp);
            return this.selectedTimeframe === 'Last Hour' 
                ? `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`
                : `${Math.floor(index * (24 / data.length))}h`;
        });

        const vehicleCounts = data.map(item => item.vehicle_count);
        const density = data.map(item => item.density);

        // Find reasonable max values to prevent infinite scaling
        const maxVehicles = Math.max(...vehicleCounts) * 1.2; // Add 20% padding
        const maxDensity = Math.max(100, Math.max(...density) * 1.2); // At least 100% or 20% padding

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vehicle Count',
                    data: vehicleCounts,
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Density (%)',
                    data: density,
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important: allows fixed height
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 300 // Reduce animation time to improve performance
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: maxVehicles,
                        title: {
                            display: true,
                            text: 'Vehicle Count'
                        },
                        ticks: {
                            stepSize: Math.ceil(maxVehicles / 10) // Reasonable step size
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: maxDensity,
                        title: {
                            display: true,
                            text: 'Density (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            stepSize: Math.ceil(maxDensity / 10) // Reasonable step size
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        ticks: {
                            maxRotation: 45 // Prevent label overlap
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `Traffic History - ${this.selectedTimeframe}`
                    }
                }
            }
        });
    }

    processGraphData(cameraId, timeframe) {
        const counts = this.todayVehicleCounts[cameraId]?.counts || [];
        if (counts.length === 0) return [];

        const now = new Date();
        const duration = timeframe === 'Last Hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const startTime = new Date(now.getTime() - duration);

        const filteredCounts = counts.filter(entry => {
            const timestamp = new Date(entry.timestamp);
            return timestamp >= startTime;
        });

        if (filteredCounts.length === 0) return [];

        // Group data into segments (max 7 for readability)
        const segmentCount = Math.min(filteredCounts.length, 7);
        const segmentSize = Math.ceil(filteredCounts.length / segmentCount);
        const segments = [];

        for (let i = 0; i < segmentCount; i++) {
            const start = i * segmentSize;
            const end = Math.min(start + segmentSize, filteredCounts.length);
            const segmentData = filteredCounts.slice(start, end);
            
            if (segmentData.length > 0) {
                const avgVehicleCount = this.average(segmentData.map(d => d.vehicle_count));
                const avgDensity = this.average(segmentData.map(d => d.density));
                const timestamp = new Date(segmentData[Math.floor(segmentData.length / 2)].timestamp);
                
                segments.push({
                    timestamp: timestamp.toISOString(),
                    vehicle_count: avgVehicleCount,
                    density: avgDensity
                });
            }
        }

        return segments;
    }

    getTrafficLevelColor(level) {
        switch (level) {
            case 'Free Flow': return '#4caf50';
            case 'Light Traffic': return '#ffeb3b';
            case 'Moderate Traffic': return '#ff9800';
            case 'Heavy Traffic': return '#f44336';
            case 'Congested': return '#9c27b0';
            default: return '#9e9e9e';
        }
    }

    average(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    showLoading(show) {
        const loading = document.getElementById('dashboard-loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        // Create a simple error notification
        const error = document.createElement('div');
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        }, 5000);
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.fetchLiveDensities();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshDashboard() {
        await this.fetchLiveDensities();
        await this.fetchTodayVehicleCounts();
        
        if (this.selectedRoad) {
            this.updateChart(this.selectedRoad);
        }
    }

    openDashboard() {
        const dashboard = document.getElementById('dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'block';
            this.refreshDashboard();
        }
    }

    closeDashboard() {
        const dashboard = document.getElementById('dashboard-container');
        if (dashboard) {
            dashboard.style.display = 'none';
        }
        this.stopAutoRefresh();
    }

    exportReport(cameraId) {
        const data = this.cameraData[cameraId];
        if (!data) return;

        const forecast = this.forecasts[cameraId] || [];
        const reportData = {
            road: data.name || cameraId,
            timestamp: new Date().toISOString(),
            metrics: {
                vehicleCount: data.vehicle_count,
                density: data.density?.toFixed(1) || '0.0',
                estimatedSpeed: data.estimated_speed?.toFixed(1) || '0.0',
                trafficLevel: data.traffic_level || 'Unknown',
                weather: data.weather || 'Unknown'
            },
            forecast: {
                '5min': this.average(forecast.slice(0, 20))?.toFixed(1) || 'N/A',
                '15min': this.average(forecast.slice(20, 60))?.toFixed(1) || 'N/A',
                '30min': this.average(forecast.slice(60, 120))?.toFixed(1) || 'N/A'
            }
        };

        // Create CSV content
        const csvContent = this.generateReportCSV(reportData);
        this.downloadFile(csvContent, `traffic_report_${cameraId}_${Date.now()}.csv`, 'text/csv');
        
        // Show success message
        this.showSuccess('Report exported successfully!');
    }

    exportGraphData(cameraId) {
        const data = this.processGraphData(cameraId, this.selectedTimeframe);
        if (data.length === 0) {
            this.showError('No data available to export');
            return;
        }

        // Create CSV content for graph data
        let csvContent = 'Time,Vehicle Count,Density (%)\n';
        data.forEach(item => {
            const time = new Date(item.timestamp);
            const timeStr = this.selectedTimeframe === 'Last Hour' 
                ? `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`
                : time.toLocaleDateString();
            csvContent += `${timeStr},${item.vehicle_count.toFixed(1)},${item.density.toFixed(1)}\n`;
        });

        this.downloadFile(csvContent, `traffic_graph_${cameraId}_${this.selectedTimeframe}_${Date.now()}.csv`, 'text/csv');
        this.showSuccess('Graph data exported successfully!');
    }

    generateReportCSV(reportData) {
        let csv = 'Traffic Report\n';
        csv += `Road,${reportData.road}\n`;
        csv += `Generated,${new Date(reportData.timestamp).toLocaleString()}\n\n`;
        csv += 'Metric,Value\n';
        csv += `Vehicle Count,${reportData.metrics.vehicleCount}\n`;
        csv += `Density,${reportData.metrics.density}%\n`;
        csv += `Estimated Speed,${reportData.metrics.estimatedSpeed} km/h\n`;
        csv += `Traffic Level,${reportData.metrics.trafficLevel}\n`;
        csv += `Weather,${reportData.metrics.weather}\n\n`;
        csv += 'LSTM Forecast,Density (%)\n';
        csv += `5-minute,${reportData.forecast['5min']}\n`;
        csv += `15-minute,${reportData.forecast['15min']}\n`;
        csv += `30-minute,${reportData.forecast['30min']}\n`;
        return csv;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showSuccess(message) {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        success.textContent = message;
        document.body.appendChild(success);
        
        setTimeout(() => {
            if (success.parentNode) {
                success.parentNode.removeChild(success);
            }
        }, 3000);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
} else {
    window.DashboardManager = DashboardManager;
}