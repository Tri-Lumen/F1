# ============================================================================
#  Delta Dashboard — Windows Bootstrapper
#
#  Downloads and installs the latest Delta Dashboard release from GitHub.
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
    Write-Host '  Delta Dashboard — Windows Installer'      -ForegroundColor Cyan
    Write-Host '========================================' -ForegroundColor Cyan
    Write-Host ''
}

function Get-LatestRelease {
    Write-Host '[INFO]  Fetching latest release info...' -ForegroundColor Cyan
    try {
        $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ 'User-Agent' = 'Delta-Dashboard-Installer' }
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

function Get-ExpectedSha512 {
    # electron-builder's latest.yml lists each artifact as:
    #   files:
    #     - url: Delta-Dashboard-Setup.exe
    #       sha512: <base64>
    #       size: <bytes>
    # Parsed line-by-line (no YAML parser dependency) by tracking the most
    # recently seen "url:" and pairing it with the "sha512:" line that follows.
    param(
        [Parameter(Mandatory)][string]$ManifestPath,
        [Parameter(Mandatory)][string]$AssetName
    )
    $currentUrl = $null
    foreach ($line in Get-Content -Path $ManifestPath) {
        if ($line -match '^\s*-?\s*url:\s*(.+?)\s*$') {
            $currentUrl = $matches[1].Trim('"').Trim("'")
        }
        elseif ($line -match '^\s*sha512:\s*(.+?)\s*$') {
            $sha = $matches[1].Trim('"').Trim("'")
            if ($currentUrl -eq $AssetName) {
                return $sha
            }
        }
    }
    return $null
}

function Test-AssetChecksum {
    # Downloads the release's latest.yml manifest and verifies $AssetPath's
    # SHA-512 matches the entry for $AssetName. Exits the script on any
    # mismatch or missing data — never install an unverified download.
    param(
        [Parameter(Mandatory)]$Release,
        [Parameter(Mandatory)][string]$AssetPath,
        [Parameter(Mandatory)][string]$AssetName,
        [Parameter(Mandatory)][string]$TempDir
    )

    $manifestAsset = $Release.assets | Where-Object { $_.name -eq 'latest.yml' } | Select-Object -First 1
    if (-not $manifestAsset) {
        Write-Host '[ERROR] Release has no latest.yml manifest — cannot verify download integrity. Aborting.' -ForegroundColor Red
        exit 1
    }

    Write-Host '[INFO]  Verifying checksum against latest.yml...' -ForegroundColor Cyan
    $manifestPath = Join-Path $TempDir 'latest.yml'
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $manifestAsset.browser_download_url -OutFile $manifestPath -UseBasicParsing
    }
    catch {
        Write-Host "[ERROR] Failed to download latest.yml for checksum verification: $_" -ForegroundColor Red
        exit 1
    }

    $expectedSha512 = Get-ExpectedSha512 -ManifestPath $manifestPath -AssetName $AssetName
    if (-not $expectedSha512) {
        Write-Host "[ERROR] Could not find a sha512 entry for $AssetName in latest.yml. Aborting — refusing to install an unverified download." -ForegroundColor Red
        exit 1
    }

    # Get-FileHash reports hex; electron-builder's manifest uses base64, so
    # convert before comparing rather than trusting a string-format match.
    $hexHash = (Get-FileHash -Path $AssetPath -Algorithm SHA512).Hash
    $bytes = [byte[]]::new($hexHash.Length / 2)
    for ($i = 0; $i -lt $hexHash.Length; $i += 2) {
        $bytes[$i / 2] = [Convert]::ToByte($hexHash.Substring($i, 2), 16)
    }
    $actualSha512 = [Convert]::ToBase64String($bytes)

    if ($actualSha512 -ne $expectedSha512) {
        Write-Host "[ERROR] Checksum verification FAILED for $AssetName." -ForegroundColor Red
        Write-Host "        Expected: $expectedSha512" -ForegroundColor Red
        Write-Host "        Actual:   $actualSha512" -ForegroundColor Red
        Write-Host '        The download may be corrupted or tampered with. Aborting.' -ForegroundColor Red
        exit 1
    }

    Write-Host "[OK]    Checksum verified ($AssetName matches latest.yml)" -ForegroundColor Green
}

function Install-DeltaDashboard {
    Write-Banner

    $release = Get-LatestRelease
    $asset   = Find-WindowsAsset $release
    $version = $release.tag_name

    Write-Host "[INFO]  Latest version: $version" -ForegroundColor Cyan
    Write-Host "[INFO]  Downloading $($asset.name) ($([math]::Round($asset.size / 1MB, 1)) MB)..." -ForegroundColor Cyan

    $tempDir  = Join-Path $env:TEMP 'Delta-Dashboard-Install'
    $tempFile = Join-Path $tempDir $asset.name

    # Clean up any previous partial download
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    try {
        # Use BITS for reliable large downloads with progress, fall back to Invoke-WebRequest
        try {
            Import-Module BitsTransfer -ErrorAction Stop
            Start-BitsTransfer -Source $asset.browser_download_url -Destination $tempFile -Description "Downloading Delta Dashboard $version"
        }
        catch {
            Write-Host '[INFO]  BITS unavailable, using direct download...' -ForegroundColor Cyan
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $ProgressPreference = 'SilentlyContinue'  # Dramatically speeds up Invoke-WebRequest
            Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tempFile -UseBasicParsing
        }

        Write-Host '[OK]    Download complete' -ForegroundColor Green

        Test-AssetChecksum -Release $release -AssetPath $tempFile -AssetName $asset.name -TempDir $tempDir

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
        Write-Host '[INFO]  Delta Dashboard should now be available in your Start Menu.' -ForegroundColor Cyan
        Write-Host '[INFO]  Future updates will be applied automatically via the app.' -ForegroundColor Cyan
        Write-Host ''
    }
    finally {
        # Clean up temp files
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

Install-DeltaDashboard
