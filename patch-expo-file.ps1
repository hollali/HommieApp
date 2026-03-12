# Patch Expo externals.ts to fix Windows node:sea issue
$filePath = "node_modules\expo\node_modules\@expo\cli\src\start\server\metro\externals.ts"

Write-Host "Looking for Expo externals.ts file..." -ForegroundColor Yellow

if (Test-Path $filePath) {
    Write-Host "Found file at: $filePath" -ForegroundColor Green
    
    $backupPath = "$filePath.backup"
    Copy-Item $filePath $backupPath -Force
    Write-Host "Backup created: $backupPath" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    $patchedContent = $content -replace "'node:sea'", "'node_sea'"
    $patchedContent = $patchedContent -replace '`node:sea`', '`node_sea`'
    $patchedContent = $patchedContent -replace "node:sea", "node_sea"
    
    if ($patchedContent -ne $content) {
        Set-Content -Path $filePath -Value $patchedContent -NoNewline
        Write-Host "`n✓ File patched successfully!" -ForegroundColor Green
        Write-Host "You can now run: npm run start:go" -ForegroundColor Cyan
    } else {
        Write-Host "No changes needed" -ForegroundColor Yellow
    }
} else {
    Write-Host "File not found. Searching..." -ForegroundColor Yellow
    $foundFiles = Get-ChildItem -Recurse -Filter "externals.ts" -Path "node_modules" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*metro*externals.ts" }
    
    if ($foundFiles) {
        $file = $foundFiles[0]
        Write-Host "Found at: $($file.FullName)" -ForegroundColor Green
        
        Copy-Item $file.FullName "$($file.FullName).backup" -Force
        $content = Get-Content $file.FullName -Raw
        $patchedContent = $content -replace "'node:sea'", "'node_sea'"
        $patchedContent = $patchedContent -replace '`node:sea`', '`node_sea`'
        $patchedContent = $patchedContent -replace "node:sea", "node_sea"
        
        Set-Content -Path $file.FullName -Value $patchedContent -NoNewline
        Write-Host "`n✓ File patched successfully!" -ForegroundColor Green
        Write-Host "You can now run: npm run start:go" -ForegroundColor Cyan
    } else {
        Write-Host "Could not find externals.ts file" -ForegroundColor Red
    }
}
