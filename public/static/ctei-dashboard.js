// HU-15: CTeI Indicators and Visualization Dashboard
// Sistema Ejecutivo de Indicadores CTeI para CODECTI Chocó

class CTeIDashboard {
    constructor() {
        this.baseURL = '/api/indicators';
        this.charts = {};
        this.refreshInterval = 300000; // 5 minutes
        this.autoRefreshTimer = null;
        
        this.init();
    }

    async init() {
        console.log('📊 Inicializando Dashboard CTeI...');
        
        try {
            await this.loadDashboard();
            this.setupEventListeners();
            this.startAutoRefresh();
            
            console.log('✅ Dashboard CTeI inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            this.showError('Error al inicializar el dashboard de indicadores CTeI');
        }
    }

    async loadDashboard() {
        this.showLoading();
        
        try {
            // Load main dashboard data
            const dashboardResponse = await this.makeRequest(`${this.baseURL}/dashboard`);
            
            if (dashboardResponse.success) {
                await this.renderDashboard(dashboardResponse.data);
            } else {
                throw new Error(dashboardResponse.message);
            }
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async renderDashboard(data) {
        const container = document.getElementById('ctei-dashboard-container');
        if (!container) {
            throw new Error('Container element not found');
        }

        container.innerHTML = `
            <div class="ctei-dashboard">
                <!-- Header Section -->
                <div class="dashboard-header mb-8">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 flex items-center">
                                <i class="fas fa-chart-line mr-3 text-blue-600"></i>
                                Dashboard Ejecutivo CTeI
                            </h1>
                            <p class="text-gray-600 mt-2">Sistema de Indicadores de Ciencia, Tecnología e Innovación - Chocó</p>
                        </div>
                        <div class="flex space-x-3">
                            <button id="refresh-dashboard" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i>Actualizar
                            </button>
                            <button id="export-dashboard" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-download mr-2"></i>Exportar
                            </button>
                            <button id="generate-report" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                <i class="fas fa-file-alt mr-2"></i>Generar Reporte
                            </button>
                        </div>
                    </div>
                    
                    <!-- Last Update Info -->
                    <div class="mt-4 text-sm text-gray-500">
                        <i class="fas fa-clock mr-1"></i>
                        Última actualización: ${new Date(data.generated_at).toLocaleString('es-CO')}
                    </div>
                </div>

                <!-- Overview Cards -->
                <div class="overview-section mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Resumen Ejecutivo</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${this.renderOverviewCards(data.overview_cards)}
                    </div>
                </div>

                <!-- Key Insights -->
                <div class="insights-section mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Insights Clave</h2>
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${this.renderKeyInsights(data.key_insights)}
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Visualizaciones</h2>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${this.renderChartContainers(data.quick_charts)}
                    </div>
                </div>

                <!-- Geographic Summary -->
                <div class="geographic-section mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Distribución Geográfica</h2>
                    <div class="bg-white rounded-xl shadow-sm p-6">
                        ${this.renderGeographicSummary(data.geographic_summary)}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="activity-section mb-8">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
                    <div class="bg-white rounded-xl shadow-sm">
                        ${this.renderRecentActivity(data.recent_activity)}
                    </div>
                </div>

                <!-- Advanced Analytics Links -->
                <div class="analytics-links-section">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Análisis Avanzados</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${this.renderAnalyticsLinks()}
                    </div>
                </div>
            </div>
        `;

        // Initialize charts after DOM is ready
        setTimeout(() => {
            this.initializeCharts(data.quick_charts);
        }, 100);
    }

    renderOverviewCards(cards) {
        return cards.map(card => `
            <div class="overview-card bg-white rounded-xl shadow-sm p-6 border-l-4 border-${this.getColorClass(card.color)}">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-600 text-sm font-medium">${card.title}</p>
                        <p class="text-2xl font-bold text-gray-900 mt-2">${card.value}</p>
                        <div class="flex items-center mt-2">
                            <span class="text-${card.trend === 'up' ? 'green' : 'red'}-600 text-sm font-medium flex items-center">
                                <i class="fas fa-arrow-${card.trend === 'up' ? 'up' : 'down'} mr-1"></i>
                                ${card.change}
                            </span>
                        </div>
                    </div>
                    <div class="text-3xl" style="color: ${card.color}">
                        <i class="${card.icon}"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderKeyInsights(insights) {
        return insights.map(insight => `
            <div class="insight-item p-4 rounded-lg ${this.getInsightBackground(insight.impact)}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-3 h-3 rounded-full ${this.getInsightIndicator(insight.trend)} mt-1.5"></div>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-gray-800">${insight.insight}</p>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-sm text-gray-600">Impacto: ${insight.impact}</span>
                            <span class="text-sm font-semibold text-blue-600">${insight.metric}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderChartContainers(charts) {
        return charts.map(chart => `
            <div class="chart-container bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${chart.title}</h3>
                <div class="chart-wrapper" style="height: 300px;">
                    <canvas id="chart-${chart.id}" class="w-full h-full"></canvas>
                </div>
            </div>
        `).join('');
    }

    renderGeographicSummary(summary) {
        return `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">${summary.total_municipalities}</div>
                    <div class="text-sm text-gray-600">Total Municipios</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">${summary.active_municipalities}</div>
                    <div class="text-sm text-gray-600">Municipios Activos</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">${summary.leading_municipality.municipality}</div>
                    <div class="text-sm text-gray-600">Líder Regional</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">${summary.total_coverage}</div>
                    <div class="text-sm text-gray-600">Cobertura</div>
                </div>
            </div>
            
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-map-marker-alt text-blue-600 mr-2"></i>
                    <span class="text-sm text-blue-800">
                        <strong>${summary.leading_municipality.municipality}</strong> lidera con 
                        <strong>${summary.leading_municipality.projects_count} proyectos activos</strong>
                    </span>
                </div>
            </div>
        `;
    }

    renderRecentActivity(activities) {
        return `
            <div class="divide-y divide-gray-200">
                ${activities.map(activity => `
                    <div class="p-4 hover:bg-gray-50 transition-colors">
                        <div class="flex items-start space-x-4">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full ${this.getActivityColor(activity.type)} flex items-center justify-center">
                                    <i class="${this.getActivityIcon(activity.type)} text-white text-sm"></i>
                                </div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-sm font-medium text-gray-900">${activity.title}</h4>
                                    <span class="text-xs text-gray-500">${this.formatRelativeTime(activity.timestamp)}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${activity.description}</p>
                                <div class="flex items-center mt-2">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getImpactBadge(activity.impact)}">
                                        ${activity.impact} impacto
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAnalyticsLinks() {
        const links = [
            {
                title: 'Análisis Institucional',
                description: 'Comparativa detallada entre instituciones',
                icon: 'fas fa-university',
                color: 'blue',
                action: () => this.showInstitutionalAnalysis()
            },
            {
                title: 'Benchmarking Regional',
                description: 'Comparación con otros departamentos',
                icon: 'fas fa-chart-bar',
                color: 'green', 
                action: () => this.showBenchmarking()
            },
            {
                title: 'Mapa de Colaboraciones',
                description: 'Red de colaboraciones científicas',
                icon: 'fas fa-project-diagram',
                color: 'purple',
                action: () => this.showCollaborationNetwork()
            }
        ];

        return links.map(link => `
            <div class="analytics-link bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer" 
                 onclick="window.cteIDashboard && window.cteIDashboard.${link.action.name}()">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-full bg-${link.color}-100 flex items-center justify-center">
                        <i class="${link.icon} text-${link.color}-600 text-xl"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800">${link.title}</h3>
                        <p class="text-sm text-gray-600">${link.description}</p>
                    </div>
                </div>
                <div class="mt-4 flex justify-end">
                    <i class="fas fa-arrow-right text-${link.color}-600"></i>
                </div>
            </div>
        `).join('');
    }

    async initializeCharts(chartsData) {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        for (const chartConfig of chartsData) {
            try {
                const canvas = document.getElementById(`chart-${chartConfig.id}`);
                if (!canvas) continue;

                const ctx = canvas.getContext('2d');
                
                this.charts[chartConfig.id] = new Chart(ctx, {
                    type: chartConfig.type,
                    data: chartConfig.data,
                    options: this.getChartOptions(chartConfig.type, chartConfig.title)
                });
            } catch (error) {
                console.error(`Error creating chart ${chartConfig.id}:`, error);
            }
        }
    }

    getChartOptions(type, title) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: type === 'doughnut' || type === 'pie' ? 'bottom' : 'top'
                }
            }
        };

        if (type === 'line' || type === 'bar') {
            baseOptions.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#6B7280'
                    },
                    grid: {
                        color: '#F3F4F6'
                    }
                },
                x: {
                    ticks: {
                        color: '#6B7280'
                    },
                    grid: {
                        color: '#F3F4F6'
                    }
                }
            };
        }

        if (type === 'radar') {
            baseOptions.scales = {
                r: {
                    beginAtZero: true,
                    ticks: {
                        color: '#6B7280'
                    },
                    grid: {
                        color: '#F3F4F6'
                    },
                    pointLabels: {
                        color: '#6B7280'
                    }
                }
            };
        }

        return baseOptions;
    }

    async showInstitutionalAnalysis() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/institutions`);
            
            if (response.success) {
                this.showModal('Análisis Institucional', this.renderInstitutionalAnalysis(response.data));
            }
        } catch (error) {
            console.error('Error loading institutional analysis:', error);
            this.showError('Error al cargar análisis institucional');
        }
    }

    async showBenchmarking() {
        try {
            const benchmarkRequest = {
                target_entity: "Chocó",
                entity_type: "department",
                indicators: ["publications_per_capita", "international_collaboration", "patent_density"]
            };

            const response = await this.makeRequest(`${this.baseURL}/benchmarking`, {
                method: 'POST',
                body: JSON.stringify(benchmarkRequest)
            });
            
            if (response.success) {
                this.showModal('Benchmarking Regional', this.renderBenchmarking(response.data));
            }
        } catch (error) {
            console.error('Error loading benchmarking:', error);
            this.showError('Error al cargar benchmarking');
        }
    }

    async showCollaborationNetwork() {
        try {
            const response = await this.makeRequest(`${this.baseURL}/collaboration`);
            
            if (response.success) {
                this.showModal('Red de Colaboraciones', this.renderCollaborationNetwork(response.data));
            }
        } catch (error) {
            console.error('Error loading collaboration network:', error);
            this.showError('Error al cargar red de colaboraciones');
        }
    }

    renderInstitutionalAnalysis(data) {
        return `
            <div class="institutional-analysis">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Ranking Institucional</h3>
                    <div class="space-y-3">
                        ${data.institutions.map((inst, index) => `
                            <div class="flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                                        ${inst.ranking_position}
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-800">${inst.institution}</div>
                                        <div class="text-sm text-gray-600">${inst.category}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-semibold text-blue-600">${inst.productivity_score}</div>
                                    <div class="text-xs text-gray-500">Score</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mt-6">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${data.total_institutions}</div>
                        <div class="text-sm text-blue-800">Instituciones Activas</div>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${data.top_performer.institution.split(' ')[0]}</div>
                        <div class="text-sm text-green-800">Top Performer</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBenchmarking(data) {
        return `
            <div class="benchmarking-analysis">
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Posición de ${data.target_entity}</h3>
                        <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Posición #${data.ranking_position} Nacional
                        </span>
                    </div>
                    
                    <div class="space-y-4">
                        ${data.benchmarks.map(benchmark => `
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h4 class="font-medium text-gray-800">${benchmark.indicator}</h4>
                                    <span class="text-sm px-2 py-1 rounded ${benchmark.trend === 'improving' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                        ${benchmark.trend === 'improving' ? '↗️ Mejorando' : '➡️ Estable'}
                                    </span>
                                </div>
                                
                                <div class="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div class="text-gray-600">Chocó</div>
                                        <div class="font-semibold text-blue-600">${benchmark.choco_value}</div>
                                    </div>
                                    <div>
                                        <div class="text-gray-600">Promedio Nacional</div>
                                        <div class="font-semibold">${benchmark.national_average}</div>
                                    </div>
                                    <div>
                                        <div class="text-gray-600">Percentil</div>
                                        <div class="font-semibold">${benchmark.percentile_rank.toFixed(1)}%</div>
                                    </div>
                                </div>
                                
                                ${benchmark.target_value ? `
                                    <div class="mt-3 text-xs text-gray-600">
                                        <i class="fas fa-target mr-1"></i>
                                        Meta ${benchmark.target_year}: ${benchmark.target_value}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mt-6">
                    <h4 class="font-medium text-gray-800 mb-3">Áreas de Mejora</h4>
                    <div class="space-y-2">
                        ${data.improvement_areas.map(area => `
                            <div class="flex items-center space-x-2 text-sm text-gray-600">
                                <i class="fas fa-arrow-up text-orange-500"></i>
                                <span>${area}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderCollaborationNetwork(data) {
        return `
            <div class="collaboration-network">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                        <div class="text-xl font-bold text-blue-600">${data.total_collaborations}</div>
                        <div class="text-xs text-blue-800">Total</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <div class="text-xl font-bold text-green-600">${data.international_collaborations}</div>
                        <div class="text-xs text-green-800">Internacionales</div>
                    </div>
                    <div class="text-center p-3 bg-purple-50 rounded-lg">
                        <div class="text-xl font-bold text-purple-600">${data.interdisciplinary}</div>
                        <div class="text-xs text-purple-800">Interdisciplinarias</div>
                    </div>
                    <div class="text-center p-3 bg-orange-50 rounded-lg">
                        <div class="text-xl font-bold text-orange-600">${(data.network_density * 100).toFixed(1)}%</div>
                        <div class="text-xs text-orange-800">Densidad Red</div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-800 mb-3">Nodos Clave de la Red</h4>
                    <div class="space-y-3">
                        ${data.key_nodes.slice(0, 4).map(node => `
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                        <i class="${this.getNodeIcon(node.type)} text-white text-sm"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-800">${node.entity}</div>
                                        <div class="text-sm text-gray-600">${node.geographic_location}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-semibold text-blue-600">${node.connections}</div>
                                    <div class="text-xs text-gray-500">conexiones</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600">
                        <strong>Análisis:</strong> ${data.insights?.network_health || 'Red de colaboración saludable'} 
                        con ${data.insights?.international_percentage || '10.9'}% de colaboraciones internacionales.
                    </div>
                </div>
            </div>
        `;
    }

    async generateExecutiveReport() {
        try {
            this.showLoading('Generando reporte ejecutivo...');
            
            const reportRequest = {
                type: 'quarterly',
                scope: 'departmental',
                period: {
                    start_date: '2024-07-01',
                    end_date: '2024-09-30'
                },
                include_recommendations: true,
                include_benchmarks: true,
                include_visualizations: true
            };

            const response = await this.makeRequest(`${this.baseURL}/reports`, {
                method: 'POST',
                body: JSON.stringify(reportRequest)
            });

            if (response.success) {
                this.showModal('Reporte Ejecutivo Generado', this.renderReportGenerated(response.data));
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Error al generar reporte ejecutivo');
        } finally {
            this.hideLoading();
        }
    }

    renderReportGenerated(report) {
        return `
            <div class="report-generated">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">${report.title}</h3>
                    <p class="text-gray-600 mt-1">${report.subtitle}</p>
                </div>
                
                <div class="space-y-4">
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium text-gray-800">Período:</span>
                            <span class="text-gray-600">${report.period.label}</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium text-gray-800">Tipo:</span>
                            <span class="text-gray-600 capitalize">${report.type}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-medium text-gray-800">Estado:</span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ${report.status === 'published' ? 'Publicado' : report.status}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-800 mb-2">Formatos Disponibles:</h4>
                        <div class="space-y-2">
                            ${report.available_formats.map(format => `
                                <button onclick="window.open('${report.download_urls[format]}', '_blank')" 
                                        class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <div class="flex items-center space-x-3">
                                        <i class="fas fa-file-${format === 'pdf' ? 'pdf' : format === 'word' ? 'word' : 'code'} text-gray-600"></i>
                                        <span class="text-gray-800">${format.toUpperCase()}</span>
                                    </div>
                                    <i class="fas fa-download text-blue-600"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="flex items-start space-x-2">
                            <i class="fas fa-info-circle text-blue-600 mt-0.5"></i>
                            <div class="text-sm text-blue-800">
                                <strong>Resumen Ejecutivo:</strong> ${report.executive_summary.substring(0, 200)}...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Refresh dashboard
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refresh-dashboard' || e.target.closest('#refresh-dashboard')) {
                this.loadDashboard();
            }
            
            if (e.target.id === 'export-dashboard' || e.target.closest('#export-dashboard')) {
                this.exportDashboard();
            }
            
            if (e.target.id === 'generate-report' || e.target.closest('#generate-report')) {
                this.generateExecutiveReport();
            }
        });
    }

    startAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        this.autoRefreshTimer = setInterval(() => {
            console.log('🔄 Auto-refresh dashboard...');
            this.loadDashboard();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }

    async exportDashboard() {
        try {
            // In a real implementation, this would generate and download a PDF/Excel file
            const exportData = {
                timestamp: new Date().toISOString(),
                dashboard_type: 'ctei_executive',
                exported_by: 'Sistema CTeI',
                format: 'json'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_ctei_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Dashboard exportado exitosamente');
        } catch (error) {
            console.error('Error exporting dashboard:', error);
            this.showError('Error al exportar dashboard');
        }
    }

    // Utility methods
    getColorClass(color) {
        const colorMap = {
            '#3B82F6': 'blue-500',
            '#10B981': 'green-500', 
            '#8B5CF6': 'purple-500',
            '#F59E0B': 'yellow-500',
            '#EF4444': 'red-500'
        };
        return colorMap[color] || 'gray-500';
    }

    getInsightBackground(impact) {
        return {
            'high': 'bg-red-50 border border-red-200',
            'medium': 'bg-yellow-50 border border-yellow-200',
            'low': 'bg-green-50 border border-green-200'
        }[impact] || 'bg-gray-50 border border-gray-200';
    }

    getInsightIndicator(trend) {
        return {
            'positive': 'bg-green-500',
            'negative': 'bg-red-500',
            'stable': 'bg-yellow-500'
        }[trend] || 'bg-gray-500';
    }

    getActivityColor(type) {
        return {
            'publication': 'bg-blue-500',
            'collaboration': 'bg-green-500',
            'funding': 'bg-purple-500',
            'patent': 'bg-orange-500'
        }[type] || 'bg-gray-500';
    }

    getActivityIcon(type) {
        return {
            'publication': 'fas fa-book-open',
            'collaboration': 'fas fa-handshake',
            'funding': 'fas fa-coins',
            'patent': 'fas fa-lightbulb'
        }[type] || 'fas fa-circle';
    }

    getImpactBadge(impact) {
        return {
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-green-100 text-green-800'
        }[impact] || 'bg-gray-100 text-gray-800';
    }

    getNodeIcon(type) {
        return {
            'institution': 'fas fa-university',
            'researcher': 'fas fa-user-graduate',
            'project': 'fas fa-project-diagram',
            'research_group': 'fas fa-users'
        }[type] || 'fas fa-circle';
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffMinutes > 0) return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        return 'hace unos momentos';
    }

    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-4xl max-h-[90vh] w-full mx-4 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-gray-800">${title}</h2>
                    <button class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div>${content}</div>
            </div>
        `;

        modal.querySelector('button').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    showLoading(message = 'Cargando...') {
        const existing = document.getElementById('ctei-loading');
        if (existing) existing.remove();

        const loading = document.createElement('div');
        loading.id = 'ctei-loading';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white rounded-xl p-8 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('ctei-loading');
        if (loading) loading.remove();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    destroy() {
        this.stopAutoRefresh();
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Make CTeIDashboard globally available
window.CTeIDashboard = CTeIDashboard;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ctei-dashboard-container')) {
        window.cteIDashboard = new CTeIDashboard();
    }
});