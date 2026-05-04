param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Username = "admin",
    [string]$Password = "admin",
    [string]$LogementId,
    [string]$Photo1,
    [string]$Photo2,
    [switch]$DoPost,
    [string]$Output = "$(Join-Path $PSScriptRoot 'report.html')"
)

$ErrorActionPreference = "Stop"

function Invoke-Curl {
    param(
        [string[]]$CurlArgs
    )

    if (-not $CurlArgs -or $CurlArgs.Count -eq 0) {
        throw "Invoke-Curl requires non-empty arguments."
    }

    $bodyFile = [System.IO.Path]::GetTempFileName()
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $status = & curl.exe -s -w "%{http_code}" -o $bodyFile @CurlArgs
    } catch {
        $stopwatch.Stop()
        $body = $_.Exception.Message
        Remove-Item $bodyFile -ErrorAction SilentlyContinue
        return @{ Status = "ERR"; Body = $body; Ms = $stopwatch.ElapsedMilliseconds }
    }
    $stopwatch.Stop()
    $body = Get-Content $bodyFile -Raw
    Remove-Item $bodyFile -ErrorAction SilentlyContinue

    return @{ Status = $status; Body = $body; Ms = $stopwatch.ElapsedMilliseconds }
}

$auth = "$Username`:$Password"
$results = [ordered]@{}
$results.Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$results.BaseUrl = $BaseUrl
$results.User = $Username

if ($DoPost.IsPresent) {
    if (-not $LogementId) {
        throw "LogementId is required when -DoPost is used."
    }
    if (-not $Photo1 -or -not (Test-Path $Photo1)) {
        throw "Photo1 path is missing or invalid."
    }
    if (-not $Photo2 -or -not (Test-Path $Photo2)) {
        throw "Photo2 path is missing or invalid."
    }

    $postArgs = @(
        "-u", $auth,
        "-X", "POST",
        "--url", "$BaseUrl/api/annonces/publier",
        "-F", "logementId=$LogementId",
        "-F", "titre=Studio Test",
        "-F", "description=Appartement meuble test",
        "-F", "loyer=500",
        "-F", "chargesIncluses=true",
        "-F", "contacts[0].plateforme=TELEPHONE",
        "-F", "contacts[0].valeur=0612345678",
        "-F", "photos=@$Photo1",
        "-F", "photos=@$Photo2"
    )

    $results.Post = Invoke-Curl -CurlArgs $postArgs
}

$results.Get = Invoke-Curl -CurlArgs @("-u", $auth, "--url", "$BaseUrl/api/annonces/recherche")

$annoncesCount = $null
try {
    $json = $results.Get.Body | ConvertFrom-Json
    if ($json -is [array]) {
        $annoncesCount = $json.Count
    } elseif ($null -ne $json) {
        $annoncesCount = 1
    }
} catch {
    $annoncesCount = $null
}

Add-Type -AssemblyName System.Web
$encode = [System.Web.HttpUtility]::HtmlEncode

$postStatus = if ($results.Contains("Post")) { $results.Post.Status } else { "SKIPPED" }
$postMs = if ($results.Contains("Post")) { $results.Post.Ms } else { "" }
$postBody = if ($results.Contains("Post")) { $encode.Invoke($results.Post.Body) } else { "" }
$getStatus = $results.Get.Status
$getMs = $results.Get.Ms
$getBody = $encode.Invoke($results.Get.Body)

$report = @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UniHome API Demo Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #f7f7f7; }
    h1 { margin-bottom: 6px; }
    .box { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .label { font-weight: bold; }
    pre { background: #f2f2f2; padding: 12px; overflow: auto; }
  </style>
</head>
<body>
  <h1>UniHome API Demo Report</h1>
  <div class="box">
    <div><span class="label">Timestamp:</span> $($results.Timestamp)</div>
    <div><span class="label">Base URL:</span> $($results.BaseUrl)</div>
    <div><span class="label">User:</span> $($results.User)</div>
    <div><span class="label">Annonces count:</span> $annoncesCount</div>
  </div>

  <div class="box">
    <h2>POST /api/annonces/publier</h2>
    <div><span class="label">Status:</span> $postStatus</div>
    <div><span class="label">Time (ms):</span> $postMs</div>
    <pre>$postBody</pre>
  </div>

  <div class="box">
    <h2>GET /api/annonces/recherche</h2>
    <div><span class="label">Status:</span> $getStatus</div>
    <div><span class="label">Time (ms):</span> $getMs</div>
    <pre>$getBody</pre>
  </div>
</body>
</html>
"@

$report | Set-Content -Path $Output -Encoding UTF8
Write-Host "Report generated: $Output"

