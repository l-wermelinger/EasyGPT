@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo       EasyAI - AI Chat Interface
echo ========================================
echo.
echo Starting EasyAI application...
echo.

REM Define the HTML file to open
set "HTML_FILE=index.html"
set "BACKUP_FILE=index.html"

echo.
echo Checking for web server dependencies...
echo.
echo ⚠️  Note: Internet connection required for:
echo    - Puter.js AI API access
echo    - Markdown-it library (for OpenAI formatting)
echo.

:: Set variables
set PORT=8080
set SERVER_STARTED=0

:: Check if the HTML file exists
if not exist "%HTML_FILE%" (
    echo ERROR: %HTML_FILE% not found!
    echo Please make sure you're running this from the correct directory.
    pause
    exit /b 1
)

:: Function to check if a command exists
:: Check for Python
echo [1/4] Checking for Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python found! Starting Python HTTP server...
    echo.
    echo Starting server at http://localhost:%PORT%
    echo Opening browser in 3 seconds...
    timeout /t 3 >nul
    start http://localhost:%PORT%/%HTML_FILE%
    echo.
    echo 🚀 Server is running! Press Ctrl+C to stop.
    echo.
    python -m http.server %PORT%
    set SERVER_STARTED=1
    goto :end
)
echo ❌ Python not found.

:: Check for Node.js
echo [2/4] Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js found! Installing http-server if needed...
    
    :: Check if http-server is installed globally
    call npx http-server --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ http-server available! Starting server...
    ) else (
        echo 📦 Installing http-server temporarily...
    )
    
    echo.
    echo Starting server at http://localhost:%PORT%
    echo Opening browser in 3 seconds...
    timeout /t 3 >nul
    start http://localhost:%PORT%/%HTML_FILE%
    echo.
    echo 🚀 Server is running! Press Ctrl+C to stop.
    echo.
    npx http-server -p %PORT% --cors
    set SERVER_STARTED=1
    goto :end
)
echo ❌ Node.js not found.

:: Check for PHP
echo [3/4] Checking for PHP...
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PHP found! Starting PHP built-in server...
    echo.
    echo Starting server at http://localhost:%PORT%
    echo Opening browser in 3 seconds...
    timeout /t 3 >nul
    start http://localhost:%PORT%/%HTML_FILE%
    echo.
    echo 🚀 Server is running! Press Ctrl+C to stop.
    echo.
    php -S localhost:%PORT%
    set SERVER_STARTED=1
    goto :end
)
echo ❌ PHP not found.

:: Check for PowerShell (Windows 10+)
echo [4/4] Checking for PowerShell HTTP server capability...
powershell -Command "Get-Command Start-Process" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PowerShell found! Attempting to create simple HTTP server...
    echo.
    echo Creating temporary PowerShell HTTP server...
    
    :: Create temporary PowerShell script
    (
        echo $http = [System.Net.HttpListener]::new^(^)
        echo $http.Prefixes.Add^("http://localhost:%PORT%/"^)
        echo $http.Start^(^)
        echo Write-Host "🚀 PowerShell HTTP Server started at http://localhost:%PORT%"
        echo Write-Host "Press Ctrl+C to stop the server"
        echo Start-Process "http://localhost:%PORT%/%HTML_FILE%"
        echo while ^($http.IsListening^) {
        echo     $context = $http.GetContext^(^)
        echo     $request = $context.Request
        echo     $response = $context.Response
        echo     $requestedFile = $request.Url.LocalPath.TrimStart^('/''^)
        echo     if ^($requestedFile -eq '' -or $requestedFile -eq '/'^ ^) { $requestedFile = '%HTML_FILE%' }
        echo     if ^(Test-Path $requestedFile^) {
        echo         $content = Get-Content $requestedFile -Raw -Encoding UTF8
        echo         $buffer = [System.Text.Encoding]::UTF8.GetBytes^($content^)
        echo         $response.ContentLength64 = $buffer.Length
        echo         if ^($requestedFile.EndsWith^('.html'^)^) { $response.ContentType = 'text/html; charset=utf-8' }
        echo         $response.OutputStream.Write^($buffer, 0, $buffer.Length^)
        echo     } else {
        echo         $response.StatusCode = 404
        echo         $buffer = [System.Text.Encoding]::UTF8.GetBytes^('File not found'^)
        echo         $response.OutputStream.Write^($buffer, 0, $buffer.Length^)
        echo     }
        echo     $response.Close^(^)
        echo }
    ) > temp_server.ps1
    
    echo Opening browser in 3 seconds...
    timeout /t 3 >nul
    
    echo.
    echo 🚀 Starting PowerShell HTTP server...
    echo.
    powershell -ExecutionPolicy Bypass -File temp_server.ps1
    del temp_server.ps1 >nul 2>&1
    set SERVER_STARTED=1
    goto :end
)

:: If no server found, provide instructions
echo.
echo ❌ No suitable web server found!
echo.
echo To run EasyAI Standalone App, you need one of the following:
echo.
echo 📋 OPTION 1 - Install Python (Recommended):
echo    1. Download Python from: https://www.python.org/downloads/
echo    2. During installation, check "Add Python to PATH"
echo    3. Run this script again
echo.
echo 📋 OPTION 2 - Install Node.js:
echo    1. Download Node.js from: https://nodejs.org/
echo    2. Install with default settings
echo    3. Run this script again
echo.
echo 📋 OPTION 3 - Manual Setup:
echo    1. Install any web server ^(XAMPP, WAMP, etc.^)
echo    2. Place %HTML_FILE% in the web root
echo    3. Access via http://localhost
echo.
echo 📋 OPTION 4 - Online Hosting:
echo    1. Upload %HTML_FILE% to any web hosting service
echo    2. Access via your hosted URL
echo.
echo ⚠️  IMPORTANT: The file must be served via HTTP/HTTPS protocol
echo    ^(not file:/// protocol^) for Puter.js to work properly.
echo.

:end
if %SERVER_STARTED% == 0 (
    echo.
    echo Press any key to exit...
    pause >nul
) 