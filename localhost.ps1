param([ValidateSet('start', 'stop', 'restart')][string]$Action)

$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot
$url = 'http://localhost:5173/'
$hashBytes = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($projectDir.ToLowerInvariant()))
$projectKey = -join ($hashBytes[0..7] | ForEach-Object { $_.ToString('x2') })
$statePath = Join-Path $env:TEMP "mcreator-translator-$projectKey.json"
$outPath = Join-Path $env:TEMP "mcreator-translator-$projectKey.out.log"
$errPath = Join-Path $env:TEMP "mcreator-translator-$projectKey.err.log"

function Get-ManagedServer {
    if (!(Test-Path -LiteralPath $statePath)) { return $null }
    try {
        $saved = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        $process = Get-Process -Id ([int]$saved.pid) -ErrorAction Stop
        if ($process.ProcessName -eq 'node' -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq [string]$saved.startTicks) { return $process }
    } catch { }
    Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
    return $null
}

function Stop-ManagedServer {
    $process = Get-ManagedServer
    if (!$process) { Write-Host 'No server started by these scripts is running.'; return }
    Stop-Process -Id $process.Id -ErrorAction Stop
    Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
    Write-Host 'Local translator stopped.'
}

function Start-ManagedServer {
    if (Get-ManagedServer) { Write-Host "Local translator is already running at $url"; Start-Process $url; return }
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (!$node) { throw 'Node.js was not found. Install Node.js and try again.' }
    $needed = @('node_modules/vite/bin/vite.js', 'node_modules/react/package.json', 'node_modules/pako/package.json', 'node_modules/@tailwindcss/vite/package.json')
    $missing = @($needed | Where-Object { !(Test-Path -LiteralPath (Join-Path $projectDir $_)) })
    if ($missing.Count) {
        Write-Host 'Installing missing project dependencies...'
        $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if (!$npm) { throw 'npm was not found. Install Node.js with npm and try again.' }
        $npmCache = Join-Path $env:TEMP 'mcreator-translator-npm-cache'
        & $npm.Source install --no-package-lock --no-audit --no-fund --cache $npmCache
        if ($LASTEXITCODE -ne 0) { throw 'npm install failed. See the output above.' }
        foreach ($entry in $needed) { if (!(Test-Path -LiteralPath (Join-Path $projectDir $entry))) { throw "Dependency installation did not create $entry." } }
    }
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 5173)
    $probe.ExclusiveAddressUse = $true
    try { $probe.Start() } catch { throw 'Port 5173 is already in use. Stop the program using it and try again.' } finally { $probe.Stop() }
    $vite = Join-Path $projectDir 'node_modules/vite/bin/vite.js'
    $process = Start-Process -FilePath $node.Source -ArgumentList @("`"$vite`"", '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $projectDir -WindowStyle Hidden -RedirectStandardOutput $outPath -RedirectStandardError $errPath -PassThru
    @{ pid = $process.Id; startTicks = $process.StartTime.ToUniversalTime().Ticks.ToString() } | ConvertTo-Json | Set-Content -LiteralPath $statePath
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 250
        $process.Refresh()
        if ($process.HasExited) { break }
        try {
            $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 1
            if ($response.StatusCode -eq 200) { Write-Host "Local translator is running at $url"; Start-Process $url; return }
        } catch { }
    }
    $process.Refresh()
    if (!$process.HasExited) { Stop-Process -Id $process.Id -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $errPath) { Get-Content -LiteralPath $errPath -Tail 20 }
    throw "The local server did not start on port 5173. Check $outPath and $errPath."
}

try {
    if ($Action -eq 'stop' -or $Action -eq 'restart') { Stop-ManagedServer }
    if ($Action -eq 'start' -or $Action -eq 'restart') { Start-ManagedServer }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}
