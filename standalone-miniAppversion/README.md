# 🧠 BrainWave - Standalone AI Chat

A **completely standalone** AI chat application powered by free [Puter.js](https://puter.com) APIs. No backend, no API keys, no complex setup required!

![BrainWave Demo](https://img.shields.io/badge/AI-GPT--4o%20%7C%20Claude%20%7C%20Llama-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## ✨ Features

- 🚀 **GPT-4o Powered**: Uses OpenAI's most advanced AI model
- 📝 **OpenAI Formatting**: Full support for markdown formatting (bold, italic, headers, code, lists)
- 🔥 **Zero Setup**: No API keys, no backend, no database required
- ⚡ **Instant Start**: Single HTML file + automatic launcher
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 📱 **Responsive**: Works perfectly on desktop and mobile
- 🌐 **Cross-Platform**: Windows, macOS, and Linux support
- 🔒 **Privacy Focused**: All processing happens through Puter.js

## 🚀 Quick Start

### Windows (Recommended)

1. **Download**: Clone or download this repository
2. **Run**: Double-click `start.bat`
3. **Chat**: The application will open automatically in your browser!

```bash
git clone https://github.com/yourusername/brainwave-standalone.git
cd brainwave-standalone
start.bat
```

### macOS/Linux

1. **Download the repository**
2. **Start a local server** (choose one):

```bash
# Option 1: Python (most common)
python3 -m http.server 8080

# Option 2: Node.js
npx http-server -p 8080

# Option 3: PHP
php -S localhost:8080
```

3. **Open**: Navigate to `http://localhost:8080/standalone-chat.html`

## 📋 Prerequisites

The `start.bat` launcher will automatically detect and use any of these:

- ✅ **Python 3.x** (Recommended - usually pre-installed)
- ✅ **Node.js** (Automatic dependency management)
- ✅ **PHP** (Built-in server)
- ✅ **PowerShell** (Windows 10+ fallback)

**No prerequisites?** The launcher will guide you through installing Python or Node.js.

## 🎯 How It Works

### Simple Architecture

```
standalone-chat.html (Single File)
├── HTML Structure
├── CSS Styling  
├── JavaScript Logic
└── Puter.js Integration ──► Free AI APIs
```

### Puter.js Integration

The app uses [Puter.js](https://puter.com) for serverless AI access:

```javascript
// Load Puter.js
<script src="https://js.puter.com/v2/"></script>

// Send AI requests
const response = await window.puter.ai.chat(message, {
    model: 'gpt-4o'  // or 'claude-3-5-sonnet', 'llama-3.1-70b'
});
```

**Why Puter.js?**
- 🆓 **Completely free** for developers
- 🚫 **No API keys** required
- 🌐 **Multiple AI models** in one service
- 🔒 **Secure** and privacy-focused

## 🤖 Available AI Models

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| 🚀 **GPT-4o** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Complex tasks, analysis, coding |
| ⚡ **GPT-4o Mini** | ⚡⚡⚡ | ⭐⭐⭐⭐ | Fast responses, general chat |
| 🧠 **Claude 3.5 Sonnet** | ⚡⚡ | ⭐⭐⭐⭐⭐ | Reasoning, creative writing |
| 🦙 **Llama 3.1 70B** | ⚡ | ⭐⭐⭐⭐ | Open source, detailed responses |

## 🛠️ Technical Details

### File Structure
```
brainwave-standalone/
├── standalone-chat.html    # Complete single-file app
├── start.bat              # Windows launcher
└── README.md             # This file
```

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Security Requirements
- 📡 **HTTP/HTTPS Protocol**: Must be served via web server (not file://)
- 🌐 **Internet Connection**: Required for Puter.js API access
- 🔒 **Modern Browser**: For ES6+ features and security

## 🚀 Deployment Options

### 1. GitHub Pages (Free Hosting)
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Access via: `https://yourusername.github.io/brainwave-standalone/standalone-chat.html`

### 2. Netlify/Vercel (Free Hosting)
1. Connect your GitHub repository
2. Deploy the `standalone-chat.html` file
3. Access via your custom domain

### 3. Local Development
Use the provided `start.bat` for instant local development.

## 🎨 Customization

### Modify Styling
Edit the `<style>` section in `standalone-chat.html`:

```css
/* Change theme colors */
body {
    background: linear-gradient(135deg, #your-color1, #your-color2);
}

/* Modify message bubbles */
.message.user .message-content {
    background: linear-gradient(135deg, #your-accent1, #your-accent2);
}
```

### Add Custom Models
Extend the models object in the JavaScript section:

```javascript
this.models = {
    'gpt-4o': 'gpt-4o',
    'your-custom-model': 'your-puter-model-id'
};
```

## 🐛 Troubleshooting

### Common Issues

**❌ "Unsupported Protocol" Error**
- **Cause**: Opening HTML file directly (file:// protocol)
- **Solution**: Use `start.bat` or any web server

**❌ "Puter.js failed to load"**
- **Cause**: Internet connection or firewall issues
- **Solution**: Check internet connection and firewall settings

**❌ "No suitable web server found"**
- **Cause**: No Python, Node.js, or PHP installed
- **Solution**: Install Python from [python.org](https://python.org)

### Getting Help

1. 📖 Check this README
2. 🐛 [Open an issue](https://github.com/yourusername/brainwave-standalone/issues)
3. 💬 Ask in [Discussions](https://github.com/yourusername/brainwave-standalone/discussions)

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Setup
```bash
git clone https://github.com/yourusername/brainwave-standalone.git
cd brainwave-standalone
start.bat  # Windows
# or python3 -m http.server 8080  # macOS/Linux
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🚀 [Puter.js](https://puter.com) for providing free AI APIs
- 🤖 OpenAI, Anthropic, and Meta for the AI models
- 🎨 Design inspired by modern chat interfaces

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/brainwave-standalone)
![GitHub forks](https://img.shields.io/github/forks/yourusername/brainwave-standalone)
![GitHub issues](https://img.shields.io/github/issues/yourusername/brainwave-standalone)

---

**Made with ❤️ for the developer community**

**⭐ Star this repo if you find it useful!** 