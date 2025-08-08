// Supabase Configuration
const supabaseUrl = 'https://kcnsubwxwynckntemfqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbnN1Ynd4d3luY2tudGVtZnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTQyNDUsImV4cCI6MjA2OTU3MDI0NX0.RBiOLn9cJkf_JOyLs54NHRmllfPTZM1UAFBanZkBYk8';

// Initialize Supabase client
const { createClient } = supabase;
const dbClient = createClient(supabaseUrl, supabaseAnonKey);

// Import modules
import { NavigationManager } from './modules/navigation.js';
import { DashboardManager } from './modules/dashboard.js';
import { ChatbotManager } from './modules/chatbot.js';
import { OrdersManager } from './modules/orders.js';
import { ClientsManager } from './modules/clients.js';
import { CampaignsManager } from './modules/campaigns.js';
import { ServicesManager } from './modules/services.js';
import { ModalManager } from './modules/modal.js';

// Global app state
window.app = {
    dbClient,
    currentSection: 'dashboard'
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Replace feather icons
        feather.replace();
        
        // Initialize managers
        const navigationManager = new NavigationManager();
        const dashboardManager = new DashboardManager();
        const chatbotManager = new ChatbotManager();
        const ordersManager = new OrdersManager();
        const clientsManager = new ClientsManager();
        const campaignsManager = new CampaignsManager();
        const servicesManager = new ServicesManager();
        const modalManager = new ModalManager();
        
        // Store managers globally for access
        window.app.managers = {
            navigation: navigationManager,
            dashboard: dashboardManager,
            chatbot: chatbotManager,
            orders: ordersManager,
            clients: clientsManager,
            campaigns: campaignsManager,
            services: servicesManager,
            modal: modalManager
        };
        
        // Initialize all managers
        await navigationManager.init();
        await dashboardManager.init();
        await chatbotManager.init();
        await ordersManager.init();
        await clientsManager.init();
        await campaignsManager.init();
        await servicesManager.init();
        modalManager.init();
        
        console.log('✅ Application initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        showNotification('حدث خطأ في تحميل التطبيق', 'error');
    }
});

// Utility functions
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 90px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 3000;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            }
            .notification-success { background: #4caf50; }
            .notification-error { background: #f44336; }
            .notification-warning { background: #ff9800; }
            .notification-info { background: #2196f3; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP'
    }).format(amount);
};