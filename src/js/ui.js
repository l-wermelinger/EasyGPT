/**
 * EasyAI UI Controller - High-Performance Interface Management
 * Optimized DOM manipulation and smooth user interactions
 */

class EasyAIUI {
    constructor(aiCore) {
        this.aiCore = aiCore;
        this.elements = {};
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Performance optimizations
        this.messagePool = []; // Reuse message elements
        this.maxPoolSize = 50;
        this.scrollThrottle = 16; // ~60fps
        this.lastScrollUpdate = 0;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupPerformanceOptimizations();
        this.loadChatHistory();
    }

    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            typingIndicator: document.getElementById('typing-indicator'),
            statusArea: document.getElementById('status-area')
        };

        // Validate required elements
        const required = ['chatMessages', 'messageInput', 'sendButton'];
        for (const key of required) {
            if (!this.elements[key]) {
                console.error(`Required element not found: ${key}`);
            }
        }
    }

    setupEventListeners() {
        // Send button
        this.elements.sendButton?.addEventListener('click', this.handleSendMessage.bind(this));
        
        // Enter key handling
        this.elements.messageInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        this.elements.messageInput?.addEventListener('input', this.handleInputResize.bind(this));

        // Scroll optimization
        this.elements.chatMessages?.addEventListener('scroll', this.throttledScrollHandler.bind(this));
    }

    setupPerformanceOptimizations() {
        // Intersection Observer for message visibility
        this.messageObserver = new IntersectionObserver(
            this.handleMessageVisibility.bind(this),
            { threshold: 0.1 }
        );

        // Virtual scrolling for large conversations
        this.virtualScrollEnabled = false;
        this.visibleMessageRange = { start: 0, end: 50 };
        
        // Storage monitoring UI
        this.setupStorageMonitoring();
    }

    setupStorageMonitoring() {
        // Create storage monitor if in development mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.createStorageMonitor();
        }
        
        // Update storage info periodically
        this.storageUpdateInterval = setInterval(() => {
            this.updateStorageDisplay();
        }, 10000); // Update every 10 seconds
    }

    createStorageMonitor() {
        // Create floating storage monitor
        const monitor = document.createElement('div');
        monitor.id = 'storage-monitor';
        monitor.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        monitor.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🧹 Storage Monitor</div>
            <div id="storage-usage">Loading...</div>
            <div id="storage-messages">Messages: 0</div>
            <div id="storage-status">Status: Active</div>
            <button id="manual-cleanup" style="
                background: #FF8C00;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                margin-top: 5px;
                cursor: pointer;
            ">Manual Cleanup</button>
        `;
        
        document.body.appendChild(monitor);
        
        // Add manual cleanup button functionality
        document.getElementById('manual-cleanup').addEventListener('click', () => {
            this.aiCore.performStorageCleanup();
            this.updateStorageDisplay();
        });
        
        // Make it draggable
        this.makeElementDraggable(monitor);
        
        // Initial update
        this.updateStorageDisplay();
    }

    makeElementDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        element.addEventListener('mousedown', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                element.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'grab';
        });
    }

    updateStorageDisplay() {
        const monitor = document.getElementById('storage-monitor');
        if (!monitor) return;
        
        const metrics = this.aiCore.getPerformanceMetrics();
        const storage = metrics.storage;
        
        const usageElement = document.getElementById('storage-usage');
        const messagesElement = document.getElementById('storage-messages');
        const statusElement = document.getElementById('storage-status');
        
        if (usageElement) {
            const usageColor = storage.usage > 80 ? '#ff4444' : storage.usage > 60 ? '#ffaa00' : '#44ff44';
            usageElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 50px; height: 8px; background: #333; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${storage.usage}%; height: 100%; background: ${usageColor}; transition: all 0.3s;"></div>
                    </div>
                    <span>${storage.usage.toFixed(1)}%</span>
                </div>
                <div style="font-size: 10px; opacity: 0.7;">
                    ${this.formatBytes(storage.totalSize)} / ${this.formatBytes(storage.available + storage.totalSize)}
                </div>
            `;
        }
        
        if (messagesElement) {
            messagesElement.textContent = `Messages: ${metrics.historySize}`;
        }
        
        if (statusElement) {
            const status = storage.usage > 90 ? '🚨 Critical' : 
                          storage.usage > 80 ? '⚠️ High' : 
                          storage.usage > 60 ? '📊 Moderate' : '✅ Good';
            statusElement.textContent = `Status: ${status}`;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Optimized message handling
    async handleSendMessage() {
        const userInput = this.elements.messageInput?.value?.trim();
        if (!userInput || this.aiCore.isWaitingForAI) return;

        // Add user message immediately to UI
        this.addMessage('user', userInput);
        
        // Clear input and show loading state
        this.elements.messageInput.value = '';
        this.setLoadingState(true);

        // Prepare AI response container
        let aiMessageElement = null;

        try {
            await this.aiCore.sendMessage(
                userInput,
                // Stream update callback
                (text, isFirstChunk, isFinal) => {
                    if (isFirstChunk) {
                        aiMessageElement = this.addMessage('ai', '', true);
                    }
                    if (aiMessageElement) {
                        this.updateMessageContent(aiMessageElement, text, isFinal);
                    }
                },
                // Complete callback
                (finalText) => {
                    if (aiMessageElement) {
                        aiMessageElement.classList.remove('typing');
                    }
                    this.setLoadingState(false);
                },
                // Error callback
                (error) => {
                    const errorMsg = "Sorry, I encountered an error. Please try again.";
                    if (aiMessageElement) {
                        this.updateMessageContent(aiMessageElement, errorMsg, true);
                        aiMessageElement.classList.remove('typing');
                    } else {
                        this.addMessage('ai', errorMsg);
                    }
                    this.setLoadingState(false);
                }
            );
        } catch (error) {
            console.error('Send message error:', error);
            this.setLoadingState(false);
        }
    }

    // Optimized message creation
    addMessage(sender, text, isStreaming = false) {
        const messageElement = this.createMessageElement(sender, text, isStreaming);
        
        // Add to DOM with animation
        this.elements.chatMessages.appendChild(messageElement);
        
        // Smooth scroll to bottom
        this.smoothScrollToBottom();
        
        // Setup intersection observer
        this.messageObserver.observe(messageElement);
        
        return messageElement;
    }

    createMessageElement(sender, text, isStreaming = false) {
        // Try to reuse from pool
        let messageDiv = this.messagePool.pop();
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            messageDiv.appendChild(contentDiv);
        }

        // Configure element
        messageDiv.className = `message ${sender}${isStreaming ? ' typing' : ''}`;
        const contentDiv = messageDiv.querySelector('.message-content');
        
        // Set content efficiently
        if (sender === 'ai' && text) {
            contentDiv.innerHTML = this.aiCore.renderMarkdown(text);
        } else {
            contentDiv.textContent = text;
        }

        // Add animation class
        messageDiv.classList.add('slide-up');
        
        return messageDiv;
    }

    updateMessageContent(messageElement, text, isFinal = false) {
        const contentDiv = messageElement.querySelector('.message-content');
        if (!contentDiv) return;

        // Update content with markdown rendering for AI messages
        if (messageElement.classList.contains('ai')) {
            contentDiv.innerHTML = this.aiCore.renderMarkdown(text);
        } else {
            contentDiv.textContent = text;
        }

        // Smooth scroll if needed
        if (this.shouldAutoScroll()) {
            this.smoothScrollToBottom();
        }

        // Final cleanup
        if (isFinal) {
            messageElement.classList.remove('typing');
        }
    }

    // Performance-optimized scrolling
    smoothScrollToBottom() {
        const now = performance.now();
        if (now - this.lastScrollUpdate >= this.scrollThrottle) {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
            this.lastScrollUpdate = now;
        } else {
            requestAnimationFrame(() => {
                this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
                this.lastScrollUpdate = performance.now();
            });
        }
    }

    shouldAutoScroll() {
        const container = this.elements.chatMessages;
        const threshold = 100; // pixels from bottom
        return (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold;
    }

    throttledScrollHandler() {
        const now = performance.now();
        if (now - this.lastScrollUpdate >= this.scrollThrottle) {
            this.handleScroll();
            this.lastScrollUpdate = now;
        }
    }

    handleScroll() {
        // Virtual scrolling logic for performance with large conversations
        if (this.virtualScrollEnabled) {
            this.updateVisibleMessages();
        }
    }

    // UI State Management
    setLoadingState(isLoading) {
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = isLoading;
        }
        if (this.elements.messageInput) {
            this.elements.messageInput.disabled = isLoading;
        }
        
        this.showTypingIndicator(isLoading);
        
        if (!isLoading && this.elements.messageInput) {
            this.elements.messageInput.focus();
        }
    }

    showTypingIndicator(show) {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    handleInputResize() {
        const input = this.elements.messageInput;
        if (!input) return;

        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    // Load chat history efficiently
    loadChatHistory() {
        const history = this.aiCore.loadChatHistory();
        
        // Use document fragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        
        history.forEach(message => {
            const messageElement = this.createMessageElement(message.sender, message.text);
            fragment.appendChild(messageElement);
        });
        
        if (this.elements.chatMessages) {
            this.elements.chatMessages.appendChild(fragment);
            this.smoothScrollToBottom();
        }
    }

    // Message visibility optimization
    handleMessageVisibility(entries) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                // Message is out of view - could optimize here
                entry.target.classList.add('out-of-view');
            } else {
                entry.target.classList.remove('out-of-view');
            }
        });
    }

    // Cleanup and memory management
    cleanup() {
        this.messageObserver?.disconnect();
        
        // Clear storage monitoring interval
        if (this.storageUpdateInterval) {
            clearInterval(this.storageUpdateInterval);
        }
        
        // Remove storage monitor
        const monitor = document.getElementById('storage-monitor');
        if (monitor) {
            monitor.remove();
        }
        
        // Return elements to pool
        const messages = this.elements.chatMessages?.querySelectorAll('.message');
        messages?.forEach(msg => {
            if (this.messagePool.length < this.maxPoolSize) {
                this.messagePool.push(msg);
            }
        });
        
        console.log('🧹 UI cleanup complete');
    }

    // Performance monitoring
    getPerformanceMetrics() {
        return {
            messageCount: this.elements.chatMessages?.children.length || 0,
            poolSize: this.messagePool.length,
            virtualScrollEnabled: this.virtualScrollEnabled,
            lastScrollUpdate: this.lastScrollUpdate
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyAIUI;
}

// Global access
window.EasyAIUI = EasyAIUI; 