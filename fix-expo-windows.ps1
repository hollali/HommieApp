# Fix for Expo Windows node:sea error
# This script patches the Expo CLI to handle Windows path issues

Write-Host "Attempting to fix Expo Windows path issue..." -ForegroundColor Yellow

$expoCliPath = "node_modules\expo\node_modules\@expo\cli\src\start\server\metro\externals.ts"

if (Test-Path $expoCliPath) {
    Write-Host "Found Expo CLI file, creating backup..." -ForegroundColor Green
    Copy-Item $expoCliPath "$expoCliPath.backup"
    
    $content = Get-Content $expoCliPath -Raw
    
    # Replace the problematic mkdir call with a Windows-safe version
    $content = $content -replace "mkdir\(path\.join\(externalsDir, 'node:sea'\)\)", "mkdir(path.join(externalsDir, 'node_sea'), { recursive: true })"
    $content = $content -replace "'node:sea'", "'node_sea'"
    
    Set-Content -Path $expoCliPath -Value $content -NoNewline
    Write-Host "Patch applied! Try running 'npm start' again." -ForegroundColor Green
} else {
    Write-Host "Expo CLI file not found. Trying alternative location..." -ForegroundColor Yellow
    
    # Try alternative path
    $altPath = "node_modules\@expo\cli\src\start\server\metro\externals.ts"
    if (Test-Path $altPath) {
        Copy-Item $altPath "$altPath.backup"
        $content = Get-Content $altPath -Raw
        $content = $content -replace "mkdir\(path\.join\(externalsDir, 'node:sea'\)\)", "mkdir(path.join(externalsDir, 'node_sea'), { recursive: true })"
        $content = $content -replace "'node:sea'", "'node_sea'"
        Set-Content -Path $altPath -Value $content -NoNewline
        Write-Host "Patch applied to alternative location!" -ForegroundColor Green
    } else {
        Write-Host "Could not find Expo CLI file. Please run 'npm install' first." -ForegroundColor Red
    }
}

Write-Host "`nTo restore original file, use the .backup file created." -ForegroundColor Cyan

