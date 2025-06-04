/**
 * EasyAI Core - High-Performance AI Chat Engine
 * Optimized for speed and direct frontend-to-AI communication
 */

class EasyAICore {
    constructor() {
        this.selectedModel = 'gpt-4o';
        this.isWaitingForAI = false;
        this.chatHistory = [];
        this.maxContextMessages = 20;
        this.storageKey = 'easyai_chat_history';
        
        // Performance optimizations
        this.messageQueue = [];
        this.isProcessingQueue = false;
        this.streamBuffer = '';
        this.lastStreamUpdate = 0;
        this.streamThrottle = 16; // ~60fps for smooth streaming
        
        // Self-cleaning storage configuration
        this.storageConfig = {
            maxStorageSize: 5 * 1024 * 1024, // 5MB max storage
            maxMessages: 100, // Maximum messages to keep
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            cleanupInterval: 30 * 60 * 1000, // Clean every 30 minutes
            compressionThreshold: 1024, // Compress messages over 1KB
            emergencyCleanupThreshold: 0.9 // Clean when 90% full
        };
        
        this.init();
    }

    init() {
        this.loadChatHistory();
        this.setupPerformanceOptimizations();
        this.initSelfCleaningStorage();
    }

    setupPerformanceOptimizations() {
        // Preload markdown processor
        if (typeof markdownit !== 'undefined') {
            this.md = markdownit({
                html: true,
                linkify: true,
                typographer: true,
                breaks: true
            });
        }

        // Setup request animation frame for smooth streaming
        this.rafId = null;
        this.pendingStreamUpdate = false;
    }

    // Self-Cleaning Storage System
    initSelfCleaningStorage() {
        console.log('🧹 Initializing self-cleaning storage system...');
        
        // Immediate cleanup on startup
        this.performStorageCleanup();
        
        // Set up automatic cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.performStorageCleanup();
        }, this.storageConfig.cleanupInterval);
        
        // Monitor storage usage
        this.monitorStorageUsage();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.performEmergencyCleanup();
        });
        
        console.log('✅ Self-cleaning storage system active');
    }

    performStorageCleanup() {
        try {
            const startTime = performance.now();
            let cleanedItems = 0;
            
            console.log('🧹 Starting automatic storage cleanup...');
            
            // 1. Clean expired messages
            cleanedItems += this.cleanExpiredMessages();
            
            // 2. Compress large messages
            cleanedItems += this.compressLargeMessages();
            
            // 3. Remove excess messages (keep only recent ones)
            cleanedItems += this.trimExcessMessages();
            
            // 4. Clean other app data
            cleanedItems += this.cleanOtherAppData();
            
            // 5. Defragment storage
            this.defragmentStorage();
            
            const endTime = performance.now();
            const storageUsage = this.getStorageUsage();
            
            console.log(`✅ Cleanup complete in ${(endTime - startTime).toFixed(2)}ms`);
            console.log(`📊 Cleaned ${cleanedItems} items, Storage: ${storageUsage.percentage}% used`);
            
            // Emergency cleanup if still too full
            if (storageUsage.percentage > this.storageConfig.emergencyCleanupThreshold * 100) {
                this.performEmergencyCleanup();
            }
            
        } catch (error) {
            console.warn('⚠️ Storage cleanup error:', error);
        }
    }

    cleanExpiredMessages() {
        const now = Date.now();
        const maxAge = this.storageConfig.maxAge;
        const originalLength = this.chatHistory.length;
        
        this.chatHistory = this.chatHistory.filter(message => {
            return (now - message.timestamp) < maxAge;
        });
        
        const cleaned = originalLength - this.chatHistory.length;
        if (cleaned > 0) {
            console.log(`🗑️ Removed ${cleaned} expired messages`);
            this.saveToStorageSync();
        }
        
        return cleaned;
    }

    compressLargeMessages() {
        let compressed = 0;
        
        this.chatHistory.forEach(message => {
            if (message.text && message.text.length > this.storageConfig.compressionThreshold && !message.compressed) {
                // Simple compression: remove extra whitespace and compress repeated patterns
                const originalLength = message.text.length;
                message.text = this.compressText(message.text);
                message.compressed = true;
                
                if (message.text.length < originalLength) {
                    compressed++;
                }
            }
        });
        
        if (compressed > 0) {
            console.log(`🗜️ Compressed ${compressed} large messages`);
            this.saveToStorageSync();
        }
        
        return compressed;
    }

    compressText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove empty lines
            .replace(/\n\s*\n/g, '\n')
            // Trim
            .trim();
    }

    trimExcessMessages() {
        const maxMessages = this.storageConfig.maxMessages;
        const originalLength = this.chatHistory.length;
        
        if (this.chatHistory.length > maxMessages) {
            // Keep the most recent messages
            this.chatHistory = this.chatHistory.slice(-maxMessages);
            this.saveToStorageSync();
            
            const trimmed = originalLength - this.chatHistory.length;
            console.log(`✂️ Trimmed ${trimmed} excess messages`);
            return trimmed;
        }
        
        return 0;
    }

    cleanOtherAppData() {
        let cleaned = 0;
        
        // Clean up any orphaned or old app data
        const keysToCheck = [
            'easyai_temp_data',
            'easyai_cache',
            'easyai_old_history',
            'puter_temp',
            'temp_chat_data'
        ];
        
        keysToCheck.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧽 Cleaned ${cleaned} orphaned data items`);
        }
        
        return cleaned;
    }

    defragmentStorage() {
        // Rewrite the main storage to defragment
        if (this.chatHistory.length > 0) {
            const data = JSON.stringify(this.chatHistory);
            localStorage.removeItem(this.storageKey);
            localStorage.setItem(this.storageKey, data);
        }
    }

    performEmergencyCleanup() {
        console.log('🚨 Performing emergency cleanup...');
        
        // Aggressive cleanup - keep only last 20 messages
        const emergencyLimit = 20;
        if (this.chatHistory.length > emergencyLimit) {
            this.chatHistory = this.chatHistory.slice(-emergencyLimit);
        }
        
        // Remove all compressed flags to allow re-compression
        this.chatHistory.forEach(message => {
            delete message.compressed;
        });
        
        // Clear all non-essential storage
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key !== this.storageKey && key.startsWith('easyai')) {
                localStorage.removeItem(key);
            }
        });
        
        this.saveToStorageSync();
        console.log('✅ Emergency cleanup complete');
    }

    getStorageUsage() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    itemCount++;
                }
            }
            
            const percentage = (totalSize / this.storageConfig.maxStorageSize) * 100;
            
            return {
                totalSize,
                itemCount,
                percentage: Math.round(percentage * 100) / 100,
                maxSize: this.storageConfig.maxStorageSize,
                available: this.storageConfig.maxStorageSize - totalSize
            };
        } catch (error) {
            console.warn('Could not calculate storage usage:', error);
            return { totalSize: 0, itemCount: 0, percentage: 0 };
        }
    }

    monitorStorageUsage() {
        const usage = this.getStorageUsage();
        
        if (usage.percentage > 80) {
            console.warn(`⚠️ Storage usage high: ${usage.percentage}%`);
        }
        
        if (usage.percentage > this.storageConfig.emergencyCleanupThreshold * 100) {
            console.error(`🚨 Storage critical: ${usage.percentage}%`);
            this.performEmergencyCleanup();
        }
    }

    // Optimized chat history management
    loadChatHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.chatHistory = JSON.parse(stored);
                
                // Decompress messages if needed
                this.chatHistory.forEach(message => {
                    if (message.compressed) {
                        // Messages are already compressed, no need to decompress for display
                    }
                });
                
                return this.chatHistory;
            }
        } catch (error) {
            console.warn('Failed to load chat history:', error);
            this.clearChatHistory();
        }
        return [];
    }

    saveChatMessage(sender, text) {
        const message = {
            sender,
            text,
            timestamp: Date.now()
        };
        
        this.chatHistory.push(message);
        
        // Smart memory management - keep only relevant context
        if (this.chatHistory.length > this.maxContextMessages) {
            this.chatHistory = this.chatHistory.slice(-this.maxContextMessages);
        }

        // Check storage before saving
        this.monitorStorageUsage();
        
        // Async save to prevent blocking
        this.saveToStorageAsync();
    }

    async saveToStorageAsync() {
        try {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.saveToStorageSync();
                    resolve();
                }, 0);
            });
        } catch (error) {
            console.warn('Failed to save chat history:', error);
        }
    }

    saveToStorageSync() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.chatHistory));
        } catch (error) {
            console.warn('Storage full, performing emergency cleanup...');
            this.performEmergencyCleanup();
            // Try again after cleanup
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.chatHistory));
            } catch (retryError) {
                console.error('Failed to save even after cleanup:', retryError);
            }
        }
    }

    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Chat history cleared');
    }

    // Optimized context building
    buildContextMessage(newUserMessage) {
        if (this.chatHistory.length === 0) {
            return newUserMessage;
        }

        // Build context efficiently
        const contextParts = ['Previous conversation:'];
        
        // Only include last few messages for optimal performance
        const recentHistory = this.chatHistory.slice(-10);
        
        for (const message of recentHistory) {
            const role = message.sender === 'user' ? 'User' : 'Assistant';
            contextParts.push(`${role}: ${message.text}`);
        }
        
        contextParts.push(`\nUser: ${newUserMessage}`);
        return contextParts.join('\n');
    }

    // High-performance streaming AI communication
    async sendMessage(userInput, onStreamUpdate, onComplete, onError) {
        if (!userInput?.trim() || this.isWaitingForAI) {
            return;
        }

        this.isWaitingForAI = true;
        
        try {
            // Build context message
            const messageWithContext = this.buildContextMessage(userInput);
            
            // Initialize streaming
            const stream = await window.puter.ai.chat(messageWithContext, {
                model: this.selectedModel,
                stream: true
            });

            let aiResponseText = '';
            let isFirstChunk = true;

            // Process stream with performance optimization
            for await (const part of stream) {
                if (part.error) {
                    console.error(`AI Error:`, part.error);
                    onError?.(part.error);
                    break;
                }

                if (part.text) {
                    aiResponseText += part.text;
                    
                    // Throttled streaming updates for smooth performance
                    if (isFirstChunk) {
                        onStreamUpdate?.(aiResponseText, true); // First chunk
                        isFirstChunk = false;
                    } else {
                        this.throttledStreamUpdate(aiResponseText, onStreamUpdate);
                    }
                }
            }

            // Final update and save
            if (aiResponseText.trim()) {
                onStreamUpdate?.(aiResponseText, false, true); // Final update
                this.saveChatMessage('ai', aiResponseText);
            }

            onComplete?.(aiResponseText);

        } catch (error) {
            console.error('AI Communication Error:', error);
            onError?.(error);
        } finally {
            this.isWaitingForAI = false;
        }
    }

    // Throttled stream updates for smooth performance
    throttledStreamUpdate(text, callback) {
        const now = performance.now();
        
        if (now - this.lastStreamUpdate >= this.streamThrottle) {
            callback?.(text, false);
            this.lastStreamUpdate = now;
        } else if (!this.pendingStreamUpdate) {
            this.pendingStreamUpdate = true;
            requestAnimationFrame(() => {
                callback?.(text, false);
                this.lastStreamUpdate = performance.now();
                this.pendingStreamUpdate = false;
            });
        }
    }

    // Optimized markdown rendering
    renderMarkdown(text) {
        if (!this.md) return text;
        
        try {
            return this.md.render(text);
        } catch (error) {
            console.warn('Markdown rendering error:', error);
            return text;
        }
    }

    // Performance monitoring with storage metrics
    getPerformanceMetrics() {
        const storageUsage = this.getStorageUsage();
        
        return {
            historySize: this.chatHistory.length,
            isWaiting: this.isWaitingForAI,
            model: this.selectedModel,
            lastUpdate: this.lastStreamUpdate,
            storage: {
                usage: storageUsage.percentage,
                totalSize: storageUsage.totalSize,
                itemCount: storageUsage.itemCount,
                available: storageUsage.available
            }
        };
    }

    // Cleanup on destroy
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.performStorageCleanup();
        console.log('🧹 EasyAI Core destroyed and cleaned up');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyAICore;
}

// Global instance for direct usage
window.EasyAICore = EasyAICore; 