Param(
    [Parameter(Position = 0)]
    [string]$Path = 'D:\huy\Model',
    [int]$PollIntervalSeconds = 2,
    [int]$SampleWindowSeconds = 30,
    [int]$IdleThresholdSeconds = 30,
    [string[]]$Extensions = @('.h5', '.hdf5', '.pt', '.pth', '.onnx', '.tflite', '.pb', '.pkl', '.joblib', '.ckpt', '.tar', '.zip', '.bin', '.model'),
    [string]$ManifestPath = $null
)

function Format-Bytes([long]$bytes) {
    if ($bytes -lt 1KB) { return "$bytes B" }
    if ($bytes -lt 1MB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    if ($bytes -lt 1GB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    return "{0:N2} GB" -f ($bytes / 1GB)
}

if (-not (Test-Path -Path $Path)) {
    Write-Error "Path not found: $Path"
    exit 2
}

# Load manifest if provided (json: [{"name":"model.h5","size":12345}, ...] or mapping {"model.h5":12345})
$expectedSizes = @{}
if ($ManifestPath) {
    if (Test-Path $ManifestPath) {
        try {
            $j = Get-Content $ManifestPath -Raw | ConvertFrom-Json
            if ($j -is [System.Collections.IEnumerable]) {
                foreach ($item in $j) {
                    if ($item.name -and $item.size) { $expectedSizes[$item.name] = [long]$item.size }
                }
            }
            else {
                foreach ($k in $j.PSObject.Properties) { $expectedSizes[$k.Name] = [long]$k.Value }
            }
        }
        catch {
            Write-Warning "Failed to parse manifest JSON: $_"
        }
    }
    else {
        Write-Warning "Manifest path not found: $ManifestPath"
    }
}

$sampleCount = [math]::Ceiling($SampleWindowSeconds / $PollIntervalSeconds)
$rates = New-Object System.Collections.Generic.Queue[double]
$lastTotal = -1
$lastChangeTime = Get-Date

Write-Host "Monitoring path:" $Path
Write-Host "Extensions:" ($Extensions -join ', ')
if ($expectedSizes.Count -gt 0) { Write-Host "Loaded manifest with $($expectedSizes.Count) expected entries." }

while ($true) {
    $files = Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $Extensions -contains $_.Extension.ToLower() }
    if (-not $files) {
        Write-Host "$(Get-Date -Format HH:mm:ss) No model files found yet in $Path. Waiting..."
        Start-Sleep -Seconds $PollIntervalSeconds
        continue
    }

    $total = ($files | Measure-Object -Property Length -Sum).Sum
    if ($null -eq $total) { $total = 0 }
    $now = Get-Date

    if ($lastTotal -ge 0) {
        $delta = $total - $lastTotal
        $rate = $delta / $PollIntervalSeconds
        $rates.Enqueue([double]$rate)
        if ($rates.Count -gt $sampleCount) { $rates.Dequeue() }
        $avgRate = [math]::Round((($rates | Measure-Object -Average).Average), 2)

        $growing = @()
        foreach ($f in $files) {
            if ($f.Length -gt 0) {
                if ((Get-Date) - $f.LastWriteTime -lt ([TimeSpan]::FromSeconds($SampleWindowSeconds))) { $growing += $f.Name }
            }
        }

        $growingText = if ($growing.Count -gt 0) { ($growing -join ', ') } else { 'none' }

        Write-Host "$(Get-Date -Format HH:mm:ss) Total: $(Format-Bytes $total)  Rate: $(Format-Bytes ([math]::Max(0,$avgRate))) /s  Growing: $growingText"

        if ($delta -ne 0) { $lastChangeTime = $now }
        $idleSec = ($now - $lastChangeTime).TotalSeconds

        if ($expectedSizes.Count -gt 0 -and $avgRate -gt 0) {
            $expectedTotal = ($expectedSizes.Values | Measure-Object -Sum).Sum
            $remaining = [math]::Max(0, $expectedTotal - $total)
            $etaSec = if ($avgRate -gt 0) { [math]::Ceiling($remaining / $avgRate) } else { $null }
            if ($etaSec) {
                $eta = (New-TimeSpan -Seconds $etaSec)
                Write-Host "Expected total: $(Format-Bytes $expectedTotal)  Remaining: $(Format-Bytes $remaining)  ETA: $($eta.ToString())"
            }
            else {
                Write-Host "Expected total: $(Format-Bytes $expectedTotal)  Remaining: $(Format-Bytes $remaining)  ETA: unknown (no rate)"
            }
        }

        if ($idleSec -ge $IdleThresholdSeconds -and $total -gt 0) {
            Write-Host "READY: files stable for $([int]$idleSec) seconds. Final total: $(Format-Bytes $total)"
            exit 0
        }
    }
    else {
        Write-Host "$(Get-Date -Format HH:mm:ss) Found $($files.Count) model file(s). Total: $(Format-Bytes $total). Starting monitoring..."
        $lastChangeTime = $now
    }

    $lastTotal = $total
    Start-Sleep -Seconds $PollIntervalSeconds
}
