/**
 * Service Worker Manager
 * Handles service worker registration and unregistration for development
 */

class ServiceWorkerManager {
    constructor() {
        this.isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.port === '8000';
    }

    /**
     * Initialize service worker management
     */
    async init() {
        console.log('🔧 Service Worker Manager initializing...');
        console.log('🔧 Environment:', this.isDevelopment ? 'Development' : 'Production');
        
        if (this.isDevelopment) {
            await this.handleDevelopmentMode();
        } else {
            await this.handleProductionMode();
        }
    }

    /**
     * Handle development mode
     */
    async handleDevelopmentMode() {
        console.log('🔧 Development mode detected');
        
        // Unregister any existing service workers
        await this.unregisterServiceWorkers();
        
        // Disable service worker for development
        this.disableServiceWorker();
        
        console.log('🔧 Service worker disabled for development');
    }

    /**
     * Handle production mode
     */
    async handleProductionMode() {
        console.log('🔧 Production mode detected');
        
        // Let PWA manager handle service worker registration
        console.log('🔧 Service worker will be managed by PWA Manager');
    }

    /**
     * Unregister all service workers
     */
    async unregisterServiceWorkers() {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('🔧 Unregistered service worker:', registration.scope);
                }
                
                console.log('🔧 All service workers unregistered');
            } catch (error) {
                console.error('❌ Failed to unregister service workers:', error);
            }
        }
    }

    /**
     * Disable service worker by preventing registration
     */
    disableServiceWorker() {
        // Override service worker registration
        if ('serviceWorker' in navigator) {
            const originalRegister = navigator.serviceWorker.register;
            
            navigator.serviceWorker.register = function(script, options) {
                console.log('🔧 Service worker registration blocked in development mode');
                console.log('🔧 Attempted to register:', script);
                
                // Return a fake registration promise
                return Promise.resolve({
                    scope: '/',
                    active: null,
                    installing: null,
                    waiting: null,
                    updateViaCache: 'all',
                    unregister: () => Promise.resolve(true),
                    update: () => Promise.resolve(),
                    addEventListener: () => {},
                    removeEventListener: () => {}
                });
            };
            
            console.log('🔧 Service worker registration disabled');
        }
    }

    /**
     * Re-enable service worker (for testing)
     */
    enableServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Restore original registration if available
            if (navigator.serviceWorker._originalRegister) {
                navigator.serviceWorker.register = navigator.serviceWorker._originalRegister;
                console.log('🔧 Service worker registration re-enabled');
            }
        }
    }

    /**
     * Check if service worker is active
     */
    isServiceWorkerActive() {
        return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    }

    /**
     * Get service worker status
     */
    getStatus() {
        return {
            isDevelopment: this.isDevelopment,
            serviceWorkerSupported: 'serviceWorker' in navigator,
            serviceWorkerActive: this.isServiceWorkerActive(),
            registrations: navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : Promise.resolve([])
        };
    }
}

// Initialize service worker manager immediately
const serviceWorkerManager = new ServiceWorkerManager();
serviceWorkerManager.init();

// Export for use in other scripts
window.ServiceWorkerManager = ServiceWorkerManager; 