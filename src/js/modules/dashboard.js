export class DashboardManager {
    constructor() {
        this.stats = {
            newOrders: 0,
            totalClients: 0,
            activeCampaigns: 0,
            totalServices: 0
        };
    }

    async init() {
        await this.loadStats();
        this.updateStatsDisplay();
    }

    async loadStats() {
        try {
            // Load new orders count
            const { count: ordersCount, error: ordersError } = await window.app.dbClient
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            
            if (!ordersError) {
                this.stats.newOrders = ordersCount || 0;
            }

            // Load total clients count
            const { count: clientsCount, error: clientsError } = await window.app.dbClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'client');
            
            if (!clientsError) {
                this.stats.totalClients = clientsCount || 0;
            }

            // Load active campaigns count
            const { count: campaignsCount, error: campaignsError } = await window.app.dbClient
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            
            if (!campaignsError) {
                this.stats.activeCampaigns = campaignsCount || 0;
            }

            // Load total services count
            const { count: servicesCount, error: servicesError } = await window.app.dbClient
                .from('services')
                .select('*', { count: 'exact', head: true });
            
            if (!servicesError) {
                this.stats.totalServices = servicesCount || 0;
            }

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    updateStatsDisplay() {
        document.getElementById('new-orders-stat').textContent = this.stats.newOrders;
        document.getElementById('total-clients-stat').textContent = this.stats.totalClients;
        document.getElementById('active-campaigns-stat').textContent = this.stats.activeCampaigns;
        document.getElementById('total-services-stat').textContent = this.stats.totalServices;
    }

    async refreshStats() {
        await this.loadStats();
        this.updateStatsDisplay();
    }

    onSectionShow() {
        this.refreshStats();
    }
}