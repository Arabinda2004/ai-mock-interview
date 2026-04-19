#!/usr/bin/env powershell
[CmdletBinding()]
param(
    [switch]$StartFrontend
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$mlServiceDir = Join-Path $backendDir 'ml-service'

function Resolve-PythonExe {
    param(
        [string[]]$Candidates
    )

    foreach ($candidate in $Candidates) {
        if ($candidate -eq 'python') {
            $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
            if ($pythonCmd) {
                return $pythonCmd.Source
            }
            continue
        }

        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    throw 'Python executable not found. Create a venv at /.venv or install Python on PATH.'
}

function Test-ArtifactSet {
    param(
        [string]$ArtifactDir
    )

    $classifierConfig = Join-Path $ArtifactDir 'classifier/config.json'
    $regressorConfig = Join-Path $ArtifactDir 'regressor/config.json'

    return (Test-Path $classifierConfig) -and (Test-Path $regressorConfig)
}

function Is-PortListening {
    param(
        [int]$Port
    )

    try {
        $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return [bool]$listeners
    } catch {
        return $false
    }
}

$backendEnvFile = Join-Path $backendDir '.env'
if (-not (Test-Path $backendEnvFile)) {
    $backendEnvExample = Join-Path $backendDir '.env.example'
    if (Test-Path $backendEnvExample) {
        Copy-Item $backendEnvExample $backendEnvFile
        Write-Host 'Created backend/.env from backend/.env.example'
    } else {
        Write-Warning 'backend/.env is missing and backend/.env.example was not found.'
    }
}

$pythonExe = Resolve-PythonExe -Candidates @(
    (Join-Path $repoRoot '.venv/Scripts/python.exe'),
    (Join-Path $mlServiceDir '.venv/Scripts/python.exe'),
    'python'
)

$artifactCandidates = @(
    (Join-Path $mlServiceDir 'artifacts'),
    (Join-Path $mlServiceDir 'artifacts-smoke')
)

$artifactDir = $null
foreach ($candidate in $artifactCandidates) {
    if (Test-ArtifactSet -ArtifactDir $candidate) {
        $artifactDir = (Resolve-Path $candidate).Path
        break
    }
}

if (-not $artifactDir) {
    $artifactDir = Join-Path $mlServiceDir 'artifacts'
    Write-Warning "No trained artifacts found under 'artifacts' or 'artifacts-smoke'. ML service will fallback to heuristics."
}

if (Is-PortListening -Port 8000) {
    Write-Host 'ML service already appears to be running on port 8000. Skipping ML launch.'
} else {
    $classifierDir = Join-Path $artifactDir 'classifier'
    $regressorDir = Join-Path $artifactDir 'regressor'

    $mlCommand = @"
Set-Location '$mlServiceDir'
`$env:ML_INFERENCE_MODE = 'model'
`$env:ML_ARTIFACTS_DIR = '$artifactDir'
`$env:ML_CLASSIFIER_DIR = '$classifierDir'
`$env:ML_REGRESSOR_DIR = '$regressorDir'
& '$pythonExe' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"@

    $encodedMlCommand = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($mlCommand))
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-EncodedCommand', $encodedMlCommand | Out-Null

    Write-Host "Started ML service on http://localhost:8000 (artifacts: $artifactDir)"
}

if ($StartFrontend) {
    $frontendCommand = @"
Set-Location '$frontendDir'
npm start
"@

    $encodedFrontendCommand = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($frontendCommand))
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-EncodedCommand', $encodedFrontendCommand | Out-Null

    Write-Host 'Started frontend in a new terminal on http://localhost:3000'
}

Set-Location $backendDir
Write-Host 'Starting backend API with npm run dev...'
npm run dev
