$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskDist = Join-Path $taskRoot 'dist'
Push-Location $taskRoot
try {
    & node tools/build.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    foreach ($taskDoc in @('HUONG-DAN-IPHONE.md', 'KIEM-THU.md')) {
        Copy-Item -LiteralPath (Join-Path $taskRoot $taskDoc) -Destination (Join-Path $taskDist $taskDoc)
    }
    $taskNames = @('Safari-Media-Saver.txt', 'Safari-Media-Saver.js', 'Media-Saver.unsigned.shortcut', 'HUONG-DAN-IPHONE.md', 'KIEM-THU.md')
    $taskFiles = $taskNames | ForEach-Object { Join-Path $taskDist $_ }
    Compress-Archive -LiteralPath $taskFiles -DestinationPath (Join-Path $taskRoot 'Media-Saver-iPhone.zip') -Force
    $taskReleaseFiles = @((Join-Path $taskRoot 'Media-Saver-iPhone.zip')) + $taskFiles
    $taskSums = foreach ($taskFile in $taskReleaseFiles) {
        $taskHash = (Get-FileHash -LiteralPath $taskFile -Algorithm SHA256).Hash.ToLowerInvariant()
        $taskHash + '  ' + [System.IO.Path]::GetFileName($taskFile)
    }
    [System.IO.File]::WriteAllText((Join-Path $taskDist 'SHA256SUMS.txt'), ($taskSums -join "`n") + "`n", [System.Text.UTF8Encoding]::new($false))
    Write-Output 'Created Media-Saver-iPhone.zip and dist/SHA256SUMS.txt.'
} finally {
    Pop-Location
}
