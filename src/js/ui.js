/**
 * EasyAI UI Controller - High-Performance Interface Management
 * Optimized DOM manipulation and smooth user interactions
 */

class EasyAIUI {
    constructor(aiCore) {
        this.aiCore = aiCore;
        this.elements = {};
        
        // Simplified scroll management
        this.isAutoScrolling = false;
        this.userScrolledUp = false;
        this.lastScrollPosition = 0;
        
        // Streaming state
        this.isAITyping = false;
        this.currentStreamingMessage = null;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupStorageMonitoring();
        this.loadChatHistory();
    }

    cacheElements() {
        this.elements = {
            chatMessages: document.getElementById('chat-messages'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            statusArea: document.getElementById('status-area'),
            fileInput: document.getElementById('file-input'),
            fileUploadButton: document.getElementById('file-upload-button')
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
        
        // File upload button
        this.elements.fileUploadButton?.addEventListener('click', this.handleFileUploadClick.bind(this));
        
        // File input change
        this.elements.fileInput?.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Enter key handling
        this.elements.messageInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        this.elements.messageInput?.addEventListener('input', this.handleInputResize.bind(this));

        // Simple scroll handling
        this.elements.chatMessages?.addEventListener('scroll', this.handleUserScroll.bind(this));
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
        const storageUsage = document.getElementById('storage-usage');
        const storageMessages = document.getElementById('storage-messages');
        const storageStatus = document.getElementById('storage-status');

        if (storageUsage) {
            const usage = metrics.storage.usage;
            const color = usage > 80 ? '#ff4444' : usage > 60 ? '#ffaa00' : '#44ff44';
            storageUsage.innerHTML = `Usage: <span style="color: ${color}">${usage}%</span> (${this.formatBytes(metrics.storage.totalSize)})`;
        }

        if (storageMessages) {
            storageMessages.textContent = `Messages: ${metrics.historySize}`;
        }

        if (storageStatus) {
            storageStatus.textContent = `Status: ${metrics.isWaiting ? 'Processing...' : 'Ready'}`;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleSendMessage() {
        const userInput = this.elements.messageInput?.value?.trim();
        if (!userInput || this.aiCore.isWaitingForAI) return;

        // Add user message immediately to UI
        this.addMessage('user', userInput);
        
        // Clear input and show loading state
        this.elements.messageInput.value = '';
        this.setLoadingState(true);

        // Reset scroll state for new conversation
        this.userScrolledUp = false;

        // Prepare AI response container
        let aiMessageElement = null;

        try {
            await this.aiCore.sendMessage(
                userInput,
                // Stream update callback
                (text, isFirstChunk, isFinal) => {
                    if (isFirstChunk) {
                        this.isAITyping = true;
                        aiMessageElement = this.addMessage('ai', '', true);
                        this.currentStreamingMessage = aiMessageElement;
                    }
                    if (aiMessageElement) {
                        this.updateMessageContent(aiMessageElement, text, isFinal);
                    }
                },
                // Complete callback
                (finalText) => {
                    this.isAITyping = false;
                    this.currentStreamingMessage = null;
                    
                    if (aiMessageElement) {
                        aiMessageElement.classList.remove('typing');
                    }
                    this.setLoadingState(false);
                    
                    // Final scroll to bottom
                    this.scrollToBottom();
                },
                // Error callback
                (error) => {
                    this.isAITyping = false;
                    this.currentStreamingMessage = null;
                    
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
            this.isAITyping = false;
            this.currentStreamingMessage = null;
            this.setLoadingState(false);
        }
    }

    // File Upload Handling
    handleFileUploadClick() {
        if (this.elements.fileInput) {
            this.elements.fileInput.click();
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            this.showStatus('Please select a PDF file.', 'error');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showStatus('File size must be less than 10MB.', 'error');
            return;
        }

        try {
            // Show processing state
            this.setFileUploadState(true);
            this.showStatus('Processing PDF...', 'info');

            // Extract text from PDF
            const text = await this.extractTextFromPDF(file);
            
            if (!text || text.trim().length === 0) {
                this.showStatus('No text found in PDF. The PDF might be image-based or encrypted.', 'error');
                return;
            }

            // Add extracted text to input
            const currentInput = this.elements.messageInput.value;
            const separator = currentInput ? '\n\n' : '';
            const pdfText = `📄 PDF Content:\n${text}`;
            
            this.elements.messageInput.value = currentInput + separator + pdfText;
            this.handleInputResize();
            
            // Focus on input
            this.elements.messageInput.focus();
            
            this.showStatus(`PDF processed successfully! ${text.length} characters extracted.`, 'success');
            
        } catch (error) {
            console.error('PDF processing error:', error);
            this.showStatus('Failed to process PDF. Please try again.', 'error');
        } finally {
            this.setFileUploadState(false);
            // Clear file input
            event.target.value = '';
        }
    }

    async extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async function() {
                try {
                    // Configure PDF.js worker
                    if (typeof pdfjsLib !== 'undefined') {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }

                    const typedarray = new Uint8Array(this.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    
                    let fullText = '';
                    
                    // Extract text from each page
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        
                        if (pageText) {
                            fullText += `\n\nPage ${pageNum}:\n${pageText}`;
                        }
                    }
                    
                    resolve(fullText.trim());
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            fileReader.onerror = () => reject(new Error('Failed to read file'));
            fileReader.readAsArrayBuffer(file);
        });
    }

    setFileUploadState(isProcessing) {
        if (this.elements.fileUploadButton) {
            this.elements.fileUploadButton.disabled = isProcessing;
            if (isProcessing) {
                this.elements.fileUploadButton.classList.add('processing');
            } else {
                this.elements.fileUploadButton.classList.remove('processing');
            }
        }
    }

    showStatus(message, type = 'info') {
        if (!this.elements.statusArea) return;
        
        this.elements.statusArea.innerHTML = `<div class="status ${type}">${message}</div>`;
        
        // Auto-hide after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (this.elements.statusArea) {
                    this.elements.statusArea.innerHTML = '';
                }
            }, 5000);
        }
    }

    // Simplified message creation
    addMessage(sender, text, isStreaming = false) {
        const messageElement = this.createMessageElement(sender, text, isStreaming);
        
        // Check if user was at bottom before adding
        const wasAtBottom = this.isAtBottom();
        
        // Add to DOM
        this.elements.chatMessages.appendChild(messageElement);
        
        // Auto-scroll if user was at bottom or it's AI typing
        if (wasAtBottom || this.isAITyping) {
            this.scrollToBottom();
        }
        
        return messageElement;
    }

    createMessageElement(sender, text, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}${isStreaming ? ' typing' : ''}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Set content efficiently
        if (sender === 'ai' && text) {
            contentDiv.innerHTML = this.aiCore.renderMarkdown(text);
        } else {
            contentDiv.textContent = text;
        }
        
        messageDiv.appendChild(contentDiv);
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

        // Auto-scroll during AI typing if user hasn't scrolled up
        if (this.isAITyping && !this.userScrolledUp) {
            this.scrollToBottom();
        }

        // Final cleanup
        if (isFinal) {
            messageElement.classList.remove('typing');
        }
    }

    // Simplified scroll handling
    handleUserScroll() {
        const container = this.elements.chatMessages;
        const currentScrollTop = container.scrollTop;
        
        // Detect if user scrolled up
        if (currentScrollTop < this.lastScrollPosition && !this.isAutoScrolling) {
            this.userScrolledUp = true;
        } else if (this.isAtBottom()) {
            this.userScrolledUp = false;
        }
        
        this.lastScrollPosition = currentScrollTop;
    }

    isAtBottom(threshold = 50) {
        const container = this.elements.chatMessages;
        return (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold;
    }

    scrollToBottom() {
        if (this.userScrolledUp && !this.isAITyping) {
            return; // Don't auto-scroll if user scrolled up (unless AI is typing)
        }
        
        const container = this.elements.chatMessages;
        this.isAutoScrolling = true;
        
        // Simple, immediate scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Reset auto-scrolling flag
        setTimeout(() => {
            this.isAutoScrolling = false;
        }, 100);
    }

    // UI State Management
    setLoadingState(isLoading) {
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = isLoading;
        }
        if (this.elements.messageInput) {
            this.elements.messageInput.disabled = isLoading;
        }
        
        if (!isLoading && this.elements.messageInput) {
            this.elements.messageInput.focus();
        }
    }

    handleInputResize() {
        const input = this.elements.messageInput;
        if (!input) return;

        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';

        // Maintain scroll position if at bottom
        if (this.isAtBottom()) {
            this.scrollToBottom();
        }
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
            this.scrollToBottom();
        }
    }

    // Cleanup and memory management
    cleanup() {
        // Clear storage monitoring interval
        if (this.storageUpdateInterval) {
            clearInterval(this.storageUpdateInterval);
        }
        
        // Remove storage monitor
        const monitor = document.getElementById('storage-monitor');
        if (monitor) {
            monitor.remove();
        }
        
        console.log('🧹 UI cleanup complete');
    }

    // Performance monitoring
    getPerformanceMetrics() {
        return {
            messageCount: this.elements.chatMessages?.children.length || 0,
            isAITyping: this.isAITyping,
            userScrolledUp: this.userScrolledUp,
            lastScrollPosition: this.lastScrollPosition
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyAIUI;
}

// Global access
window.EasyAIUI = EasyAIUI; 