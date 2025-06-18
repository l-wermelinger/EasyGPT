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
        
        // Debug Puter status
        this.checkPuterStatus();
    }

    setupPerformanceOptimizations() {
        // Preload markdown processor with proper configuration
        if (typeof markdownit !== 'undefined') {
            this.md = markdownit({
                html: true,
                linkify: true,
                typographer: true,
                breaks: true // Convert line breaks to <br>
            });
        } else {
            console.warn('Markdown-it library not available, using fallback renderer');
            this.md = null;
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

        // Build context efficiently with length limits
        const contextParts = ['Previous conversation:'];
        const MAX_CONTEXT_LENGTH = 30000; // Conservative limit for context
        const MAX_MESSAGE_LENGTH = 2000; // Max length per individual message in context
        
        // Only include last few messages for optimal performance
        const recentHistory = this.chatHistory.slice(-5); // Reduced from 10 to 5
        
        console.log('🔍 Building context from', recentHistory.length, 'recent messages');
        
        for (const message of recentHistory) {
            const role = message.sender === 'user' ? 'User' : 'Assistant';
            
            // Truncate individual messages if they're too long
            let messageText = message.text;
            if (messageText.length > MAX_MESSAGE_LENGTH) {
                messageText = messageText.substring(0, MAX_MESSAGE_LENGTH) + '... [truncated]';
                console.log(`📝 Truncated ${role} message from ${message.text.length} to ${messageText.length} chars`);
            }
            
            const contextLine = `${role}: ${messageText}`;
            
            // Check if adding this message would exceed the context limit
            const potentialContext = contextParts.join('\n') + '\n' + contextLine + `\n\nUser: ${newUserMessage}`;
            if (potentialContext.length > MAX_CONTEXT_LENGTH) {
                console.log('⚠️ Context would be too long, stopping here');
                break;
            }
            
            contextParts.push(contextLine);
        }
        
        contextParts.push(`\nUser: ${newUserMessage}`);
        const finalContext = contextParts.join('\n');
        
        console.log('📊 Final context length:', finalContext.length, 'chars');
        
        return finalContext;
    }

    // High-performance streaming AI communication
    async sendMessage(userInput, onStreamUpdate, onComplete, onError) {
        if (!userInput?.trim() || this.isWaitingForAI) {
            return;
        }

        this.isWaitingForAI = true;
        
        // Save user message first
        this.saveChatMessage('user', userInput);
        
        try {
            // Detailed debugging
            console.log('🔍 Starting sendMessage debug...');
            console.log('🔍 window.puter exists:', !!window.puter);
            console.log('🔍 window.puter.ai exists:', !!(window.puter && window.puter.ai));
            console.log('🔍 Current URL:', window.location.href);
            console.log('🔍 Protocol:', window.location.protocol);
            
            // Check if Puter is available
            if (!window.puter) {
                console.error('❌ window.puter is not defined');
                throw new Error('Puter.js library is not loaded. Please ensure the Puter script is included and the page is served over HTTPS.');
            }

            if (!window.puter.ai) {
                console.error('❌ window.puter.ai is not defined');
                console.log('🔍 Available puter properties:', Object.keys(window.puter));
                throw new Error('Puter AI service is not available. Please check your internet connection and try again.');
            }

            // Build context message
            const messageWithContext = this.buildContextMessage(userInput);
            
            console.log('🤖 Sending message to AI:', { 
                model: this.selectedModel, 
                messageLength: messageWithContext.length,
                puterAiType: typeof window.puter.ai.chat
            });

            // Check if message is too long (Puter.js might have limits)
            const MAX_MESSAGE_LENGTH = 50000; // Conservative limit
            if (messageWithContext.length > MAX_MESSAGE_LENGTH) {
                console.warn(`⚠️ Message too long (${messageWithContext.length} chars), truncating to ${MAX_MESSAGE_LENGTH} chars`);
                const truncatedMessage = messageWithContext.substring(0, MAX_MESSAGE_LENGTH) + '\n\n[Message truncated due to length]';
                console.log('📝 Using truncated message:', truncatedMessage.length, 'chars');
            }

            const finalMessage = messageWithContext.length > MAX_MESSAGE_LENGTH ? 
                messageWithContext.substring(0, MAX_MESSAGE_LENGTH) + '\n\n[Message truncated due to length]' : 
                messageWithContext;

            // Initialize streaming with better error handling
            let stream;
            try {
                console.log('🔄 Calling window.puter.ai.chat...');
                stream = await window.puter.ai.chat(finalMessage, {
                    model: this.selectedModel,
                    stream: true
                });
                console.log('✅ Stream created successfully:', typeof stream);
            } catch (apiError) {
                console.error('❌ Puter API Error details:', {
                    error: apiError,
                    message: apiError.message,
                    stack: apiError.stack,
                    name: apiError.name,
                    code: apiError.code,
                    status: apiError.status,
                    response: apiError.response,
                    toString: apiError.toString()
                });
                
                // Log the full error object
                console.error('❌ Full error object:', apiError);
                
                // Try to extract more meaningful error information
                let errorMessage = 'Unable to connect to AI service';
                if (apiError.message) {
                    errorMessage = apiError.message;
                } else if (apiError.toString && typeof apiError.toString === 'function') {
                    errorMessage = apiError.toString();
                } else if (apiError.error && apiError.error.message) {
                    errorMessage = apiError.error.message;
                }
                
                throw new Error(`AI service error: ${errorMessage}`);
            }

            let aiResponseText = '';
            let isFirstChunk = true;
            let hasReceivedData = false;

            // Process stream with performance optimization
            try {
                for await (const part of stream) {
                    hasReceivedData = true;
                    
                    if (part.error) {
                        console.error(`AI Stream Error:`, part.error);
                        onError?.(new Error(`AI Error: ${part.error}`));
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
            } catch (streamError) {
                console.error('Stream processing error:', streamError);
                throw new Error(`Stream error: ${streamError.message || 'Failed to process AI response'}`);
            }

            // Check if we received any data
            if (!hasReceivedData) {
                throw new Error('No response received from AI service. Please try again.');
            }

            // Final update and save AI response
            if (aiResponseText.trim()) {
                onStreamUpdate?.(aiResponseText, false, true); // Final update
                this.saveChatMessage('ai', aiResponseText);
                console.log('✅ AI response received and saved');
            } else {
                throw new Error('Empty response received from AI service.');
            }

            onComplete?.(aiResponseText);

        } catch (error) {
            console.error('AI Communication Error:', error);
            
            // Provide user-friendly error messages
            let userMessage = 'Sorry, I encountered an error. Please try again.';
            
            if (error.message.includes('Puter.js library is not loaded')) {
                userMessage = 'AI service is not available. Please refresh the page and ensure you have an internet connection.';
            } else if (error.message.includes('AI service error')) {
                userMessage = 'Unable to connect to AI service. Please check your internet connection and try again.';
            } else if (error.message.includes('No response received')) {
                userMessage = 'No response received from AI. Please try sending your message again.';
            } else if (error.message.includes('Empty response')) {
                userMessage = 'Received an empty response. Please try rephrasing your question.';
            }
            
            onError?.(new Error(userMessage));
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

    // Enhanced markdown rendering with fallback
    renderMarkdown(text) {
        if (!text) return '';
        
        // If markdown-it is available, use it
        if (this.md) {
            try {
                return this.md.render(text);
            } catch (error) {
                console.warn('Markdown rendering error:', error);
                return this.fallbackMarkdownRender(text);
            }
        }
        
        // Fallback markdown rendering
        return this.fallbackMarkdownRender(text);
    }

    // Fallback markdown renderer for when markdown-it isn't available
    fallbackMarkdownRender(text) {
        return text
            // Convert double line breaks to paragraphs
            .replace(/\n\n+/g, '</p><p>')
            // Convert single line breaks to <br>
            .replace(/\n/g, '<br>')
            // Wrap in paragraph tags
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            // Handle bold text **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Handle italic text *text*
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Handle inline code `code`
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Handle code blocks ```code```
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Handle headers # Header
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Handle lists - * item
            .replace(/^\* (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // Handle numbered lists 1. item
            .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            .replace(/<p>\s*<\/p>/g, '');
    }

    // Debug function to check Puter status
    checkPuterStatus() {
        const status = {
            puterLoaded: !!window.puter,
            aiServiceAvailable: !!(window.puter && window.puter.ai),
            currentUrl: window.location.href,
            protocol: window.location.protocol,
            isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
        };
        
        console.log('🔍 Puter Status Check:', status);
        
        if (!status.puterLoaded) {
            console.warn('⚠️ Puter.js is not loaded. Check if the script tag is present and loading correctly.');
        }
        
        if (!status.isSecure && window.location.hostname !== 'localhost') {
            console.warn('⚠️ Puter.js requires HTTPS or localhost. Current protocol:', status.protocol);
        }
        
        return status;
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

    // Test function for debugging AI connection
    async testAIConnection() {
        console.log('🧪 Testing AI connection...');
        
        const status = this.checkPuterStatus();
        if (!status.aiServiceAvailable) {
            console.error('❌ AI service not available');
            return false;
        }

        // Check authentication first
        if (!window.puter.auth.isSignedIn()) {
            console.warn('⚠️ User not authenticated, triggering sign-in...');
            try {
                await window.puter.auth.signIn();
                console.log('✅ Authentication successful for test');
            } catch (error) {
                console.error('❌ Authentication failed during test:', error);
                return false;
            }
        }
        
        try {
            const testMessage = "Hello, this is a test message.";
            console.log('📤 Sending test message:', testMessage);
            
            const stream = await window.puter.ai.chat(testMessage, {
                model: this.selectedModel,
                stream: true
            });
            
            let response = '';
            for await (const part of stream) {
                if (part.error) {
                    console.error('❌ Test failed with error:', part.error);
                    return false;
                }
                if (part.text) {
                    response += part.text;
                }
            }
            
            console.log('✅ Test successful! Response received:', response.substring(0, 100) + '...');
            return true;
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            return false;
        }
    }

    // Test Puter authentication specifically
    async testPuterAuth() {
        console.log('🔐 Testing Puter authentication...');
        
        try {
            // Check if Puter is loaded
            if (!window.puter) {
                console.error('❌ Puter not loaded');
                return false;
            }

            // Check if auth service is available
            if (!window.puter.auth) {
                console.error('❌ Puter auth service not available');
                return false;
            }

            // Check current authentication status
            const isSignedIn = window.puter.auth.isSignedIn();
            console.log('🔍 Current sign-in status:', isSignedIn);

            if (isSignedIn) {
                try {
                    const user = await window.puter.auth.getUser();
                    console.log('✅ User authenticated:', user.username);
                    return true;
                } catch (error) {
                    console.error('❌ Failed to get user info:', error);
                    return false;
                }
            } else {
                console.log('ℹ️ User not signed in');
                return false;
            }

        } catch (error) {
            console.error('❌ Authentication test failed:', error);
            return false;
        }
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