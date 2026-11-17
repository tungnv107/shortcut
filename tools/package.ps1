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
    Copy-Item -LiteralPath (Join-Path $taskRoot 'artifacts/native-live-results.json') -Destination (Join-Path $taskDist 'NATIVE-LIVE-RESULTS.json')
    $taskNames = @('Media-Saver.unsigned.shortcut', 'workflow.json', 'HUONG-DAN-IPHONE.md', 'KIEM-THU.md', 'NATIVE-LIVE-RESULTS.json')
    $taskSignedPath = Join-Path $taskDist 'Media-Saver.shortcut'
    if (Test-Path -LiteralPath $taskSignedPath) {
        $taskReportPath = Join-Path $taskRoot 'artifacts/signing/verification.json'
        $taskReport = Get-Content -LiteralPath $taskReportPath -Raw | ConvertFrom-Json
        $taskInputHash = (Get-FileHash -LiteralPath (Join-Path $taskDist 'Media-Saver.unsigned.shortcut') -Algorithm SHA256).Hash.ToLowerInvariant()
        $taskSignedHash = (Get-FileHash -LiteralPath $taskSignedPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($taskReport.inputSHA256 -ne $taskInputHash -or $taskReport.outputSHA256 -ne $taskSignedHash) {
            throw 'Signed shortcut is stale or changed. Sign the current source before packaging.'
        }
        Copy-Item -LiteralPath $taskReportPath -Destination (Join-Path $taskDist 'SIGNING-VERIFICATION.json')
        $taskNames += @('Media-Saver.shortcut', 'SIGNING-VERIFICATION.json')
    }
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
