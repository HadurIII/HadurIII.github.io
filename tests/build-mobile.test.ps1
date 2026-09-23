$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$scriptPath = Join-Path $root "scripts/build-mobile.ps1"
$outputPath = Join-Path $root "mobile.html"

if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
}

& $scriptPath

if (-not (Test-Path $outputPath)) {
    throw "mobile.html was not generated."
}

$html = Get-Content -Path $outputPath -Raw -Encoding UTF8

if ($html -match '<link\s+[^>]*rel=["'']stylesheet["'']') {
    throw "mobile.html still references an external stylesheet."
}

if ($html -match '<script\s+[^>]*src=') {
    throw "mobile.html still references an external script."
}

if ($html -notmatch '<style>') {
    throw "mobile.html does not contain inline CSS."
}

if ($html -notmatch 'HolidayOptimizer') {
    throw "mobile.html does not contain the optimizer JavaScript."
}

if ($html -notmatch 'build-mobile.ps1') {
    throw "mobile.html does not contain the generator marker."
}

if (-not $html.Contains('tooltip-toggle')) {
    throw "mobile.html does not contain tooltip buttons for metric explanations."
}

if ((-not $html.Contains('lost-days-help')) -or (-not $html.Contains('folga/feriado'))) {
    throw "mobile.html does not explain lost days."
}

if ((-not $html.Contains('gained-days-help')) -or (-not $html.Contains('descanso'))) {
    throw "mobile.html does not explain gained days."
}

Write-Host "ok - mobile.html is self-contained"



