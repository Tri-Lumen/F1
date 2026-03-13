# ============================================================================
#  F1 Dashboard — Windows Bootstrapper
#
#  Downloads and installs the latest F1 Dashboard release from GitHub.
#  Re-run at any time to update to the newest version.
#
#  Usage (PowerShell):
#    irm https://raw.githubusercontent.com/Tri-Lumen/F1/main/installer/install-windows.ps1 | iex
# ============================================================================
#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

# Ensure TLS 1.2 is available for all HTTPS requests (required by GitHub).
# PowerShell 5.1 on older Windows defaults to TLS 1.0/1.1 which GitHub rejects.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repo  = 'Tri-Lumen/F1'
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"

function Write-Banner {
    Write-Host ''
    Write-Host '========================================' -ForegroundColor Cyan
    Write-Host '  F1 Dashboard — Windows Installer'      -ForegroundColor Cyan
    Write-Host '========================================' -ForegroundColor Cyan
    Write-Host ''
}

function Get-LatestRelease {
    Write-Host '[INFO]  Fetching latest release info...' -ForegroundColor Cyan
    try {
        $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ 'User-Agent' = 'F1-Dashboard-Installer' }
    }
    catch {
        Write-Host "[ERROR] Failed to reach GitHub API: $_" -ForegroundColor Red
        Write-Host '        Check your internet connection and try again.' -ForegroundColor Red
        exit 1
    }
    return $release
}

function Find-WindowsAsset {
    param($release)
    # Look for the NSIS Setup installer specifically (not the web bootstrapper, blockmap, or yml)
    $asset = $release.assets | Where-Object {
        $_.name -match 'Setup.*\.exe$' -and
        $_.name -notmatch 'blockmap'
    } | Select-Object -First 1

    if (-not $asset) {
        Write-Host '[ERROR] No Windows installer (.exe) found in the latest release.' -ForegroundColor Red
        Write-Host "        Release: $($release.tag_name)" -ForegroundColor Red
        if ($release.assets.Count -eq 0) {
            Write-Host '        The release has no assets yet — the build may still be in progress.' -ForegroundColor Yellow
            Write-Host '        Please wait a few minutes and try again.' -ForegroundColor Yellow
        } else {
            Write-Host '        Available assets:' -ForegroundColor Yellow
            $release.assets | ForEach-Object { Write-Host "          - $($_.name)" -ForegroundColor Yellow }
            Write-Host '' -ForegroundColor Yellow
            Write-Host '        The Setup installer has not been uploaded to this release.' -ForegroundColor Yellow
            Write-Host '        This is likely a CI/CD build issue — please report it or try a previous release.' -ForegroundColor Yellow
        }
        exit 1
    }
    return $asset
}

function Install-F1Dashboard {
    Write-Banner

    $release = Get-LatestRelease
    $asset   = Find-WindowsAsset $release
    $version = $release.tag_name

    Write-Host "[INFO]  Latest version: $version" -ForegroundColor Cyan
    Write-Host "[INFO]  Downloading $($asset.name) ($([math]::Round($asset.size / 1MB, 1)) MB)..." -ForegroundColor Cyan

    $tempDir  = Join-Path $env:TEMP 'F1-Dashboard-Install'
    $tempFile = Join-Path $tempDir $asset.name

    # Clean up any previous partial download
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    try {
        # Use BITS for reliable large downloads with progress, fall back to Invoke-WebRequest
        try {
            Import-Module BitsTransfer -ErrorAction Stop
            Start-BitsTransfer -Source $asset.browser_download_url -Destination $tempFile -Description "Downloading F1 Dashboard $version"
        }
        catch {
            Write-Host '[INFO]  BITS unavailable, using direct download...' -ForegroundColor Cyan
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $ProgressPreference = 'SilentlyContinue'  # Dramatically speeds up Invoke-WebRequest
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tempFile -UseBasicParsing
        }

        Write-Host '[OK]    Download complete' -ForegroundColor Green

        Write-Host '[INFO]  Launching installer...' -ForegroundColor Cyan
        $process = Start-Process -FilePath $tempFile -PassThru -Wait

        if ($process.ExitCode -ne 0) {
            Write-Host "[WARN]  Setup exited with code $($process.ExitCode)." -ForegroundColor Yellow
            exit $process.ExitCode
        }

        Write-Host ''
        Write-Host '========================================' -ForegroundColor Green
        Write-Host '  Installation complete!' -ForegroundColor Green
        Write-Host '========================================' -ForegroundColor Green
        Write-Host ''
        Write-Host '[INFO]  F1 Dashboard should now be available in your Start Menu.' -ForegroundColor Cyan
        Write-Host '[INFO]  Future updates will be applied automatically via the app.' -ForegroundColor Cyan
        Write-Host ''
    }
    finally {
        # Clean up temp files
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

Install-F1Dashboard
