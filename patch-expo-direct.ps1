# Direct patch for Expo node:sea issue
$basePath = "C:\Users\LAP\Documents\HommieApp"
$filePath = Join-Path $basePath "node_modules\expo\node_modules\@expo\cli\src\start\server\metro\externals.ts"

Write-Host "Attempting to patch Expo file..." -ForegroundColor Yellow

if (Test-Path $filePath) {
    Write-Host "File found! Creating backup..." -ForegroundColor Green
    
    # Backup
    $backupPath = "$filePath.backup"
    Copy-Item $filePath $backupPath -Force
    
    # Read and patch
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $original = $content
    
    # Replace all variations of node:sea
    $content = $content -replace "'node:sea'", "'node_sea'"
    $content = $content -replace '`node:sea`', '`node_sea`'
    $content = $content -replace '"node:sea"', '"node_sea"'
    $content = $content -replace 'node:sea', 'node_sea'
    
    if ($content -ne $original) {
        Set-Content -Path $filePath -Value $content -NoNewline -Encoding UTF8
        Write-Host "`n✓ SUCCESS! File patched." -ForegroundColor Green
        Write-Host "Backup saved to: $backupPath" -ForegroundColor Cyan
        Write-Host "`nNow run: npm run start:go" -ForegroundColor Yellow
    } else {
        Write-Host "No changes made (already patched?)" -ForegroundColor Yellow
    }
} else {
    Write-Host "File not found at: $filePath" -ForegroundColor Red
    Write-Host "`nThe file might be bundled. The best solution is:" -ForegroundColor Yellow
    Write-Host "1. Install Node.js 20.x LTS from nodejs.org" -ForegroundColor Cyan
    Write-Host "2. Restart terminal" -ForegroundColor Cyan
    Write-Host "3. Run: npm run start:go" -ForegroundColor Cyan
}

