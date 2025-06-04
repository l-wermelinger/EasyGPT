# Project Structure Documentation

## Overview

EasyAI is organized with a clean, professional structure that separates concerns and makes the project easy to navigate and maintain.

## Directory Structure

```
EasyAI/
├── 📄 README.md                   # Main project documentation
├── 📄 LICENSE                     # MIT License
├── 📄 .gitignore                  # Git ignore rules
├── 🏠 index.html                  # Landing page (GitHub Pages main)
├── ⚙️ start.bat                   # Windows launcher script
├── 📁 src/                        # Additional source files
│   └── 💬 standalone-chat.html    # Chat application
├── 📁 assets/                     # Static assets
│   ├── 🎬 Videoprojekt56789.mp4   # Demo video
│   ├── 🔧 html5.svg               # HTML5 technology icon
│   ├── 🎨 css.svg                 # CSS3 technology icon
│   └── ⚡ javascript.svg          # JavaScript technology icon
└── 📁 docs/                       # Documentation
    └── 📖 STRUCTURE.md             # This file
```

## File Descriptions

### Root Level Files

- **`README.md`**: Comprehensive project documentation with installation, usage, and contribution guidelines
- **`LICENSE`**: MIT license for open source usage
- **`.gitignore`**: Ignores system files, IDE files, and temporary files
- **`index.html`**: Main landing page with professional design, hero section, video mockup, and technology showcase
- **`start.bat`**: Automated Windows launcher that detects and starts appropriate web server

### Source Code (`src/`)

- **`standalone-chat.html`**: 
  - Full AI chat application
  - Puter.js integration for GPT-4o access
  - Modern chat interface
  - Message formatting and history

### Assets (`assets/`)

- **`Videoprojekt56789.mp4`**: Custom demo video showcasing the application
- **`html5.svg`**: HTML5 technology icon for the landing page
- **`css.svg`**: CSS3 technology icon for the landing page  
- **`javascript.svg`**: JavaScript technology icon for the landing page

### Documentation (`docs/`)

- **`STRUCTURE.md`**: This file explaining the project organization

## Design Principles

### 1. **Separation of Concerns**
- Source code separated from assets
- Documentation in dedicated folder
- Clear file naming conventions

### 2. **Professional Organization**
- Logical folder hierarchy
- Consistent naming patterns
- Clean directory structure

### 3. **Easy Navigation**
- Root redirect for seamless access
- Intuitive folder names
- Clear file purposes

### 4. **Maintainability**
- Modular structure
- Self-documenting organization
- Easy to extend

## File Relationships

```
index.html (root - main landing page)
    ↓ links to
src/standalone-chat.html (chat application)
    ↓ uses assets from
assets/[video, icons]
```

## Development Workflow

1. **Landing Page**: Edit `index.html` for homepage changes
2. **Chat App**: Modify `src/standalone-chat.html` for chat functionality
3. **Assets**: Add new media files to `assets/` folder
4. **Documentation**: Update docs in `docs/` folder
5. **Launcher**: Modify `start.bat` for deployment changes

## Path References

When referencing assets from source files:
- From root `index.html` to `assets/`: Use `assets/filename`
- From `src/` to `assets/`: Use `../assets/filename`
- From root to `src/`: Use `src/filename`

## Best Practices

1. **Keep assets organized**: All media files in `assets/`
2. **Document changes**: Update README when adding features
3. **Maintain structure**: Don't create unnecessary nested folders
4. **Use semantic names**: File names should indicate their purpose
5. **Keep root clean**: Only essential files in project root 