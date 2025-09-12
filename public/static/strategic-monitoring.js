// Extensión de Monitoreo Estratégico para CTeI-Manager

// Extender el estado global con datos de monitoreo
if (typeof DashboardState !== 'undefined') {
    DashboardState.actionLines = [];
    DashboardState.timeline = [];
    DashboardState.alerts = [];
    DashboardState.monitoringStats = {};
    DashboardState.milestones = {};
}

// ===== FUNCIONES DE CARGA DE DATOS DE MONITOREO =====

// Cargar datos de monitoreo estratégico
async function loadMonitoringData() {
    try {
        const isAdmin = DashboardState.user.role === 'ADMIN';
        
        // Cargar líneas de acción
        const actionLinesEndpoint = isAdmin 
            ? `${API_BASE}/admin/action-lines`
            : `${API_BASE}/private/action-lines`;
            
        const actionLinesResponse = await axios.get(actionLinesEndpoint);
        if (actionLinesResponse.data.success) {
            DashboardState.actionLines = actionLinesResponse.data.data.action_lines || actionLinesResponse.data.data;
        }
        
        // Cargar timeline personal/global
        const timelineResponse = await axios.get(`${API_BASE}/private/timeline?limit=10`);
        if (timelineResponse.data.success) {
            DashboardState.timeline = timelineResponse.data.data.timeline;
        }
        
        // Cargar alertas
        const alertsResponse = await axios.get(`${API_BASE}/private/alerts?only_unresolved=true&limit=5`);
        if (alertsResponse.data.success) {
            DashboardState.alerts = alertsResponse.data.data.alerts;
        }

        // Cargar estadísticas de monitoreo
        if (isAdmin) {
            const monitoringResponse = await axios.get(`${API_BASE}/admin/monitoring/overview`);
            if (monitoringResponse.data.success) {
                DashboardState.monitoringStats = monitoringResponse.data.data;
            }
        }
        
    } catch (error) {
        console.error('Error cargando datos de monitoreo:', error);
    }
}

// ===== FUNCIONES DE RENDERIZADO MEJORADAS =====

// Renderizar estadísticas mejoradas con monitoreo
function renderEnhancedStats(isAdmin, stats) {
    return `
        <!-- Estadísticas MEJORADAS CON MONITOREO -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isAdmin ? '6' : '5'} gap-6 mb-8">
            ${isAdmin ? `
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-primary/10 rounded-lg">
                        <i class="fas fa-users text-primary text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${stats.users?.total_users || 0}</p>
                        <p class="text-muted-foreground">Usuarios Total</p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-2/10 rounded-lg">
                        <i class="fas fa-project-diagram text-chart-2 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.projects?.total_projects || stats.projects?.total || 0) : (stats.projects?.total || 0)}</p>
                        <p class="text-muted-foreground">${isAdmin ? 'Proyectos Totales' : 'Mis Proyectos'}</p>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-3/10 rounded-lg">
                        <i class="fas fa-cubes text-chart-3 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.products?.total_products || stats.products?.total || 0) : (stats.products?.total || 0)}</p>
                        <p class="text-muted-foreground">${isAdmin ? 'Productos Totales' : 'Mis Productos'}</p>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-4/10 rounded-lg">
                        <i class="fas fa-eye text-chart-4 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.projects?.public_projects || stats.projects?.public || 0) : (stats.projects?.public || 0)}</p>
                        <p class="text-muted-foreground">Proyectos Públicos</p>
                    </div>
                </div>
            </div>
            
            <!-- NUEVAS ESTADÍSTICAS DE MONITOREO -->
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-orange-500/10 rounded-lg">
                        <i class="fas fa-tasks text-orange-500 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${stats.milestones?.total || 0}</p>
                        <p class="text-muted-foreground">Milestones</p>
                        <p class="text-xs text-orange-600">${stats.milestones?.overdue || 0} vencidos</p>
                    </div>
                </div>
            </div>
            
            ${!isAdmin ? `
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-red-500/10 rounded-lg">
                        <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${stats.alerts?.unresolved || 0}</p>
                        <p class="text-muted-foreground">Alertas</p>
                        <p class="text-xs text-red-600">Sin resolver</p>
                    </div>
                </div>
            </div>
            ` : `
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-green-500/10 rounded-lg">
                        <i class="fas fa-percentage text-green-500 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${stats.projects?.avg_progress || 0}%</p>
                        <p class="text-muted-foreground">Progreso Promedio</p>
                    </div>
                </div>
            </div>
            `}
        </div>
    `;
}

// Renderizar elementos del timeline
function renderTimelineItems(timelineItems) {
    if (!timelineItems || timelineItems.length === 0) {
        return '<p class="text-muted-foreground">No hay actividad reciente</p>';
    }
    
    return timelineItems.map(item => `
        <div class="flex items-start space-x-3 py-2">
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                item.event_type === 'project' ? 'bg-blue-100 text-blue-600' :
                item.event_type === 'milestone' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
            }">
                <i class="fas fa-${item.event_type === 'project' ? 'project-diagram' : 'flag'} text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground">${item.event_title}</p>
                <p class="text-xs text-muted-foreground">${item.event_description}</p>
                <p class="text-xs text-muted-foreground mt-1">
                    <i class="fas fa-clock mr-1"></i>
                    ${formatDate(item.event_date)}
                </p>
            </div>
        </div>
    `).join('');
}

// Renderizar secciones adicionales del dashboard
function renderMonitoringSections(isAdmin) {
    return `
        <!-- Resumen de Líneas de Acción -->
        ${DashboardState.actionLines.length > 0 ? `
        <div class="card p-6 mb-8">
            <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-road mr-2"></i>
                Líneas de Acción Estratégicas
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${DashboardState.actionLines.slice(0, 6).map(line => `
                    <div class="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center mb-2">
                            <div class="w-4 h-4 rounded-full mr-2" style="background-color: ${line.color_code}"></div>
                            <span class="text-xs font-medium text-muted-foreground">${line.code}</span>
                        </div>
                        <h4 class="font-medium text-sm mb-1">${line.name}</h4>
                        <p class="text-xs text-muted-foreground">${line.description.substring(0, 100)}...</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Timeline de Actividad Reciente y Proyectos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="fas fa-clock mr-2"></i>
                    Actividad Reciente
                </h3>
                <div id="recentTimeline">
                    ${renderTimelineItems(DashboardState.timeline.slice(0, 5))}
                </div>
                <div class="mt-4 text-center">
                    <button onclick="showView('timeline')" class="text-primary hover:text-primary/80 text-sm">
                        Ver timeline completo <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
            
            <div class="card p-6">
                <h3 class="text-lg font-semibold mb-4">
                    <i class="fas fa-project-diagram mr-2"></i>
                    ${isAdmin ? 'Proyectos del Sistema' : 'Mis Proyectos'}
                </h3>
                <div id="recentProjects">
                    ${renderEnhancedProjectsList()}
                </div>
            </div>
        </div>
        
        <!-- Alertas y Notificaciones -->
        ${DashboardState.alerts.length > 0 ? `
        <div class="card p-6">
            <h3 class="text-lg font-semibold mb-4 text-red-600">
                <i class="fas fa-bell mr-2"></i>
                Alertas Activas (${DashboardState.alerts.length})
            </h3>
            <div class="space-y-3">
                ${DashboardState.alerts.map(alert => `
                    <div class="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div class="flex-1">
                            <p class="font-medium text-red-800">${alert.message}</p>
                            <p class="text-sm text-red-600 mt-1">
                                <i class="fas fa-calendar mr-1"></i>
                                ${formatDate(alert.created_at)}
                            </p>
                        </div>
                        <button 
                            onclick="resolveAlert(${alert.id})"
                            class="text-red-600 hover:text-red-800 ml-4"
                            title="Marcar como resuelto"
                        >
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
}

// Renderizar lista mejorada de proyectos con monitoreo
function renderEnhancedProjectsList() {
    const projects = DashboardState.projects.slice(0, 5);
    
    if (projects.length === 0) {
        return '<p class="text-muted-foreground">No hay proyectos para mostrar</p>';
    }
    
    return projects.map(project => `
        <div class="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <div class="flex-1">
                <h4 class="font-medium">${project.title}</h4>
                <p class="text-sm text-muted-foreground mt-1">${project.abstract.substring(0, 80)}...</p>
                <div class="flex items-center mt-2 text-xs text-muted-foreground">
                    <span class="mr-3">
                        <i class="fas fa-calendar mr-1"></i>
                        ${formatDate(project.created_at)}
                    </span>
                    ${project.progress_percentage !== undefined ? `
                    <span class="mr-3">
                        <i class="fas fa-chart-line mr-1"></i>
                        ${project.progress_percentage}%
                    </span>
                    ` : ''}
                    ${project.risk_level ? `
                    <span class="px-2 py-1 rounded text-xs ${
                        project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                    }">
                        ${project.risk_level.toLowerCase()}
                    </span>
                    ` : ''}
                    <span class="px-2 py-1 rounded ${project.is_public ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">
                        ${project.is_public ? 'Público' : 'Privado'}
                    </span>
                </div>
            </div>
            <button 
                onclick="viewProject(${project.id})"
                class="ml-4 text-primary hover:text-primary/80"
            >
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `).join('');
}

// ===== NUEVAS VISTAS DE MONITOREO ESTRATÉGICO =====

// Vista de Timeline
function renderTimelineView() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold mb-2">Timeline de Actividad</h2>
            <p class="text-muted-foreground">
                Seguimiento cronológico de proyectos, milestones y actividades
            </p>
        </div>

        <div class="card p-6">
            <div class="space-y-4" id="fullTimeline">
                ${renderTimelineItems(DashboardState.timeline)}
            </div>
            
            ${DashboardState.timeline.length === 0 ? `
            <div class="text-center py-8">
                <i class="fas fa-clock text-4xl text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">No hay actividad registrada</p>
            </div>
            ` : ''}
        </div>
    `;
}

// Vista de Monitoreo (Usuario)
function renderMonitoringView() {
    const content = document.getElementById('content');
    
    const userProjects = DashboardState.projects.filter(p => p.action_line_id);
    
    content.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold mb-2">Monitoreo de Proyectos</h2>
            <p class="text-muted-foreground">
                Estado y progreso de tus proyectos con líneas de acción asignadas
            </p>
        </div>

        <!-- Resumen por líneas de acción -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            ${DashboardState.actionLines.map(line => {
                const lineProjects = userProjects.filter(p => p.action_line_id === line.id);
                const avgProgress = lineProjects.length > 0 
                    ? Math.round(lineProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / lineProjects.length)
                    : 0;
                
                return `
                    <div class="card p-6">
                        <div class="flex items-center mb-4">
                            <div class="w-4 h-4 rounded-full mr-3" style="background-color: ${line.color_code}"></div>
                            <h3 class="font-semibold text-lg">${line.name}</h3>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-muted-foreground">Proyectos</span>
                                <span class="font-medium">${lineProjects.length}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-muted-foreground">Progreso Promedio</span>
                                <span class="font-medium">${avgProgress}%</span>
                            </div>
                            <div class="w-full bg-muted rounded-full h-2">
                                <div class="h-2 rounded-full" style="width: ${avgProgress}%; background-color: ${line.color_code}"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Proyectos con monitoreo -->
        <div class="card p-6">
            <h3 class="text-lg font-semibold mb-4">Proyectos con Monitoreo Activo</h3>
            <div class="space-y-4">
                ${userProjects.length === 0 ? `
                    <p class="text-muted-foreground text-center py-8">No tienes proyectos con líneas de acción asignadas</p>
                ` : userProjects.map(project => `
                    <div class="border border-border rounded-lg p-4">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-medium">${project.title}</h4>
                                <p class="text-sm text-muted-foreground mt-1">
                                    ${project.action_line_name} • ${project.risk_level ? project.risk_level.toLowerCase() : 'bajo'} riesgo
                                </p>
                            </div>
                            <span class="px-2 py-1 rounded text-xs ${
                                project.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                project.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                project.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }">
                                ${project.risk_level || 'LOW'}
                            </span>
                        </div>
                        
                        <div class="flex items-center justify-between text-sm mb-2">
                            <span class="text-muted-foreground">Progreso</span>
                            <span class="font-medium">${project.progress_percentage || 0}%</span>
                        </div>
                        <div class="w-full bg-muted rounded-full h-3 mb-3">
                            <div class="h-3 rounded-full" style="width: ${project.progress_percentage || 0}%; background-color: ${project.action_line_color}"></div>
                        </div>
                        
                        ${project.next_milestone_date ? `
                        <div class="text-xs text-muted-foreground mb-3">
                            <i class="fas fa-flag mr-1"></i>
                            Próximo milestone: ${project.next_milestone_description} (${formatDate(project.next_milestone_date)})
                        </div>
                        ` : ''}
                        
                        <div class="flex space-x-2">
                            <button 
                                onclick="viewProjectMilestones(${project.id})"
                                class="flex-1 bg-secondary text-secondary-foreground py-2 px-3 rounded text-sm hover:opacity-90"
                            >
                                <i class="fas fa-tasks mr-1"></i>
                                Milestones
                            </button>
                            <button 
                                onclick="updateProjectMonitoring(${project.id})"
                                class="flex-1 bg-primary text-primary-foreground py-2 px-3 rounded text-sm hover:opacity-90"
                            >
                                <i class="fas fa-edit mr-1"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ===== FUNCIONES DE INTERACCIÓN =====

// Resolver una alerta
async function resolveAlert(alertId) {
    try {
        const response = await axios.put(`${API_BASE}/admin/alerts/${alertId}/resolve`);
        if (response.data.success) {
            showToast('Alerta marcada como resuelta', 'success');
            // Remover de la lista local
            DashboardState.alerts = DashboardState.alerts.filter(a => a.id !== alertId);
            // Volver a renderizar si estamos en dashboard
            if (DashboardState.currentView === 'dashboard') {
                renderMainDashboard();
            }
        } else {
            showToast(response.data.error || 'Error al resolver alerta', 'error');
        }
    } catch (error) {
        console.error('Error resolviendo alerta:', error);
        showToast('Error al resolver alerta', 'error');
    }
}

// Ver milestones de un proyecto
async function viewProjectMilestones(projectId) {
    try {
        const response = await axios.get(`${API_BASE}/private/projects/${projectId}/milestones`);
        if (response.data.success) {
            const milestones = response.data.data.milestones;
            showMilestonesModal(projectId, milestones);
        } else {
            showToast(response.data.error || 'Error cargando milestones', 'error');
        }
    } catch (error) {
        console.error('Error cargando milestones:', error);
        showToast('Error cargando milestones', 'error');
    }
}

// Modal de milestones
function showMilestonesModal(projectId, milestones) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold">Milestones del Proyecto</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4 mb-6">
                    ${milestones.length === 0 ? `
                        <p class="text-muted-foreground text-center py-8">No hay milestones definidos</p>
                    ` : milestones.map(milestone => `
                        <div class="border border-border rounded-lg p-4 ${
                            milestone.is_completed ? 'bg-green-50 border-green-200' : 
                            new Date(milestone.due_date) < new Date() ? 'bg-red-50 border-red-200' : ''
                        }">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-medium">${milestone.name || milestone.milestone_title}</h4>
                                <button 
                                    onclick="toggleMilestone(${projectId}, ${milestone.id}, ${!milestone.is_completed})"
                                    class="text-sm px-3 py-1 rounded ${
                                        milestone.is_completed 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }"
                                >
                                    <i class="fas fa-${milestone.is_completed ? 'check' : 'circle'} mr-1"></i>
                                    ${milestone.is_completed ? 'Completado' : 'Marcar como completado'}
                                </button>
                            </div>
                            ${milestone.description || milestone.milestone_description ? `
                                <p class="text-sm text-muted-foreground mb-2">${milestone.description || milestone.milestone_description}</p>
                            ` : ''}
                            <div class="text-xs text-muted-foreground">
                                <i class="fas fa-calendar mr-1"></i>
                                Fecha límite: ${formatDate(milestone.target_date || milestone.due_date)}
                                ${milestone.completed_date || milestone.completion_date ? ` • Completado: ${formatDate(milestone.completed_date || milestone.completion_date)}` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button 
                    onclick="showCreateMilestoneModal(${projectId})"
                    class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Milestone
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Toggle estado de milestone
async function toggleMilestone(projectId, milestoneId, completed) {
    try {
        const response = await axios.put(
            `${API_BASE}/private/projects/${projectId}/milestones/${milestoneId}/complete`,
            { is_completed: completed }
        );
        
        if (response.data.success) {
            showToast(response.data.message, 'success');
            // Recargar datos y vista
            await loadDashboardData();
            if (DashboardState.currentView === 'monitoring') {
                renderMonitoringView();
            }
            // Cerrar modal y reabrir
            document.querySelector('.fixed').remove();
            viewProjectMilestones(projectId);
        } else {
            showToast(response.data.error || 'Error actualizando milestone', 'error');
        }
    } catch (error) {
        console.error('Error actualizando milestone:', error);
        showToast('Error actualizando milestone', 'error');
    }
}

// Actualizar monitoreo de proyecto
function updateProjectMonitoring(projectId) {
    const project = DashboardState.projects.find(p => p.id === projectId);
    if (!project) return;
    
    showUpdateMonitoringModal(project);
}

// Modal para actualizar monitoreo
function showUpdateMonitoringModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold">Actualizar Monitoreo</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="updateMonitoring(event, ${project.id})">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Línea de Acción</label>
                            <select id="actionLineSelect" class="w-full px-3 py-2 border border-border rounded-lg">
                                <option value="">Sin línea de acción</option>
                                ${DashboardState.actionLines.map(line => `
                                    <option value="${line.id}" ${project.action_line_id === line.id ? 'selected' : ''}>
                                        ${line.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Progreso (%)</label>
                            <input 
                                type="number" 
                                id="progressInput" 
                                min="0" 
                                max="100" 
                                value="${project.progress_percentage || 0}"
                                class="w-full px-3 py-2 border border-border rounded-lg"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Nivel de Riesgo</label>
                            <select id="riskLevelSelect" class="w-full px-3 py-2 border border-border rounded-lg">
                                <option value="LOW" ${(project.risk_level || 'LOW') === 'LOW' ? 'selected' : ''}>Bajo</option>
                                <option value="MEDIUM" ${project.risk_level === 'MEDIUM' ? 'selected' : ''}>Medio</option>
                                <option value="HIGH" ${project.risk_level === 'HIGH' ? 'selected' : ''}>Alto</option>
                                <option value="CRITICAL" ${project.risk_level === 'CRITICAL' ? 'selected' : ''}>Crítico</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button 
                            type="button" 
                            onclick="this.closest('.fixed').remove()"
                            class="flex-1 bg-muted text-muted-foreground py-2 rounded-lg hover:opacity-90"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90"
                        >
                            Actualizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Procesar actualización de monitoreo
async function updateMonitoring(event, projectId) {
    event.preventDefault();
    
    const actionLineId = document.getElementById('actionLineSelect').value;
    const progress = parseInt(document.getElementById('progressInput').value);
    const riskLevel = document.getElementById('riskLevelSelect').value;
    
    try {
        const response = await axios.put(
            `${API_BASE}/private/projects/${projectId}/monitoring`,
            {
                action_line_id: actionLineId || null,
                progress_percentage: progress,
                risk_level: riskLevel
            }
        );
        
        if (response.data.success) {
            showToast('Monitoreo actualizado exitosamente', 'success');
            document.querySelector('.fixed').remove();
            
            // Recargar datos y vista
            await loadDashboardData();
            if (DashboardState.currentView === 'monitoring') {
                renderMonitoringView();
            }
        } else {
            showToast(response.data.error || 'Error actualizando monitoreo', 'error');
        }
    } catch (error) {
        console.error('Error actualizando monitoreo:', error);
        showToast('Error actualizando monitoreo', 'error');
    }
}

// Extender la función de navegación para incluir las nuevas vistas
if (typeof window !== 'undefined' && window.showView) {
    const originalShowView = window.showView;
    window.showView = function(view) {
        DashboardState.currentView = view;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-primary', 'text-primary-foreground');
            item.classList.add('text-foreground');
        });
        
        const activeItem = document.querySelector(`[onclick="showView('${view}')"]`);
        if (activeItem) {
            activeItem.classList.add('bg-primary', 'text-primary-foreground');
            activeItem.classList.remove('text-foreground');
        }
        
        // Renderizar vistas de monitoreo o usar función original
        switch (view) {
            case 'timeline':
                renderTimelineView();
                break;
            case 'monitoring':
                renderMonitoringView();
                break;
            default:
                originalShowView(view);
        }
    };
}

// Inicializar carga de datos de monitoreo cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    if (DashboardState.token) {
        // Cargar datos después de que el dashboard principal se inicialice
        setTimeout(loadMonitoringData, 1000);
    }
});

console.log('Strategic Monitoring Extension loaded successfully');