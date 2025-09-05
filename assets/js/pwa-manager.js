/**
 * PWA Manager
 * Handles service worker registration, app installation, and PWA features
 */

class PWAManager {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.swRegistration = null;
        this.init();
    }

    /**
     * Initialize PWA functionality
     */
    async init() {
        console.log('📱 PWA Manager initializing...');
        
        // Wait for external scripts to load before registering service worker
        await this.waitForExternalScripts();
        
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupAppUpdate();
        this.setupOfflineDetection();
        this.setupPushNotifications();
        
        console.log('✅ PWA Manager initialized');
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        // Check if service worker is disabled by service worker manager
        if (window.serviceWorkerManager && window.serviceWorkerManager.isDevelopment) {
            console.log('🔧 Service worker registration skipped in development mode');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered:', this.swRegistration);
                
                // Handle service worker updates
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.warn('⚠️ Service Worker not supported');
        }
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 Install prompt triggered');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show install button
            this.showInstallButton();
        });

        // Handle successful installation
        window.addEventListener('appinstalled', (e) => {
            console.log('📱 App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.deferredPrompt = null;
            
            // Track installation
            this.trackInstallation();
        });
    }

    /**
     * Show install button
     */
    showInstallButton() {
        // Create install button if it doesn't exist
        let installBtn = document.getElementById('pwa-install-btn');
        
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn';
            installBtn.className = 'action-button primary';
            installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInUp 0.3s ease;
            `;
            
            installBtn.addEventListener('click', () => this.installApp());
            document.body.appendChild(installBtn);
        }
        
        installBtn.style.display = 'flex';
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    /**
     * Install app
     */
    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ No install prompt available');
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('📱 User response to install prompt:', outcome);
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            
            // Hide the install button
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Install failed:', error);
        }
    }

    /**
     * Setup app update notifications
     */
    setupAppUpdate() {
        if (this.swRegistration) {
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
        }
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        const updateDiv = document.createElement('div');
        updateDiv.id = 'pwa-update-notification';
        updateDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            background: #3182ce;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 9999;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        updateDiv.innerHTML = `
            <div>
                <strong>Update Available</strong>
                <p style="margin: 4px 0 0 0; font-size: 14px;">A new version is available. Refresh to update.</p>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="pwa-update-refresh" class="action-button secondary" style="background: white; color: #3182ce; border: none; padding: 8px 16px; border-radius: 4px; font-size: 14px;">
                    Refresh
                </button>
                <button id="pwa-update-dismiss" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(updateDiv);
        
        // Add event listeners
        document.getElementById('pwa-update-refresh').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('pwa-update-dismiss').addEventListener('click', () => {
            updateDiv.remove();
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (updateDiv.parentNode) {
                updateDiv.remove();
            }
        }, 10000);
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online');
            this.hideOfflineNotification();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Gone offline');
            this.showOfflineNotification();
        });
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        let offlineDiv = document.getElementById('pwa-offline-notification');
        
        if (!offlineDiv) {
            offlineDiv = document.createElement('div');
            offlineDiv.id = 'pwa-offline-notification';
            offlineDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #e53e3e;
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 9999;
                text-align: center;
                font-weight: 500;
            `;
            document.body.appendChild(offlineDiv);
        }
        
        offlineDiv.textContent = 'You are offline. Some features may be limited.';
    }

    /**
     * Hide offline notification
     */
    hideOfflineNotification() {
        const offlineDiv = document.getElementById('pwa-offline-notification');
        if (offlineDiv) {
            offlineDiv.remove();
        }
    }

    /**
     * Sync offline data
     */
    async syncOfflineData() {
        if (this.swRegistration && this.swRegistration.sync) {
            try {
                await this.swRegistration.sync.register('background-sync');
                console.log('🔄 Background sync registered');
            } catch (error) {
                console.error('❌ Background sync failed:', error);
            }
        }
    }

                    /**
                 * Wait for external scripts to load
                 */
                async waitForExternalScripts() {
                    const requiredScripts = [
                        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
                    ];
                    
                    // Only wait for Chart.js if it's actually needed on this page
                    const chartScripts = document.querySelectorAll('script[src*="chart.js"]');
                    if (chartScripts.length > 0) {
                        requiredScripts.push('https://cdn.jsdelivr.net/npm/chart.js');
                    }
                    
                    for (const scriptUrl of requiredScripts) {
                        try {
                            await this.waitForScript(scriptUrl);
                            console.log(`✅ Script loaded: ${scriptUrl}`);
                        } catch (error) {
                            console.warn(`⚠️ Script failed to load: ${scriptUrl}`, error);
                        }
                    }
                }
    
                    /**
                 * Wait for a specific script to load
                 */
                waitForScript(scriptUrl) {
                    return new Promise((resolve, reject) => {
                        const script = document.querySelector(`script[src="${scriptUrl}"]`);
                        if (script && script.complete) {
                            resolve();
                            return;
                        }
                        
                        // Check if script is already loaded
                        if (scriptUrl.includes('chart.js') && typeof Chart !== 'undefined') {
                            resolve();
                            return;
                        }
                        
                        if (scriptUrl.includes('supabase') && typeof supabase !== 'undefined') {
                            resolve();
                            return;
                        }
                        
                        // For Chart.js, be more lenient since it might not be needed
                        if (scriptUrl.includes('chart.js')) {
                            console.log('📊 Chart.js not found, but continuing...');
                            resolve(); // Don't fail if Chart.js isn't loaded
                            return;
                        }
                        
                        // Wait a bit and check again
                        setTimeout(() => {
                            if (scriptUrl.includes('chart.js') && typeof Chart !== 'undefined') {
                                resolve();
                            } else if (scriptUrl.includes('supabase') && typeof supabase !== 'undefined') {
                                resolve();
                            } else if (scriptUrl.includes('chart.js')) {
                                console.log('📊 Chart.js not loaded after timeout, but continuing...');
                                resolve(); // Don't fail for Chart.js
                            } else {
                                reject(new Error(`Script not loaded: ${scriptUrl}`));
                            }
                        }, 2000);
                    });
                }
    
    /**
     * Setup push notifications
     */
    setupPushNotifications() {
        if ('Notification' in window) {
            // Only request permission on user interaction
            // Don't auto-request on page load
            console.log('📱 Push notifications available, waiting for user interaction');
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            console.log('📱 Notification permission:', permission);
            
            if (permission === 'granted') {
                this.subscribeToPushNotifications();
            }
        } catch (error) {
            console.error('❌ Notification permission failed:', error);
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
            
            console.log('📱 Push subscription:', subscription);
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
        } catch (error) {
            console.error('❌ Push subscription failed:', error);
        }
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('❌ Failed to send subscription to server:', error);
        }
    }

    /**
     * Convert VAPID key
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Track installation
     */
    trackInstallation() {
        // Send analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install', {
                event_category: 'engagement',
                event_label: 'app_install'
            });
        }
        
        // Store in localStorage
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_install_date', new Date().toISOString());
    }

    /**
     * Get PWA status
     */
    getStatus() {
        return {
            isInstalled: this.isInstalled,
            isOnline: navigator.onLine,
            swRegistration: !!this.swRegistration,
            notificationPermission: Notification.permission,
            deferredPrompt: !!this.deferredPrompt
        };
    }

    /**
     * Check if app is installed
     */
    isAppInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    /**
     * Add to home screen
     */
    addToHomeScreen() {
        if (this.deferredPrompt) {
            this.installApp();
        } else {
            this.showManualInstallInstructions();
        }
    }

    /**
     * Show manual install instructions
     */
    showManualInstallInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'pwa-install-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        `;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        instructions.innerHTML = `
            <h3>Install App</h3>
            <p>${isIOS ? 
                'Tap the Share button and select "Add to Home Screen"' :
                'Tap the menu button and select "Add to Home Screen"'
            }</p>
            <button onclick="this.parentElement.remove()" class="action-button primary" style="margin-top: 16px;">
                Got it
            </button>
        `;
        
        document.body.appendChild(instructions);
    }
}

// Initialize PWA Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

// Export for use in other scripts
window.PWAManager = PWAManager; 