# update_burden_quantities.ps1
# Reads burden_scryfall.csv, queries the Scryfall API for each row,
# and writes a "quantity" and "percentile" column back to the file.
#
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts/update_burden_quantities.ps1

$CsvPath  = "$PSScriptRoot\..\assets\files\criteria\burden_scryfall.csv"
$ApiBase  = "https://api.scryfall.com/cards/search"
$DelayMin = 800
$DelayMax = 1500

$rows  = Import-Csv -Path $CsvPath -Encoding UTF8
$total = $rows.Count
Write-Host "Processing $total criteria..."

for ($i = 0; $i -lt $rows.Count; $i++) {
    $row   = $rows[$i]
    $title = $row.Title
    $query = $row.scryfall_text

    if ([string]::IsNullOrWhiteSpace($query)) {
        Write-Host "  [$($i+1)/$total] $title - skipped (no query)"
        $row | Add-Member -NotePropertyName quantity   -NotePropertyValue "" -Force
        $row | Add-Member -NotePropertyName percentile -NotePropertyValue "" -Force
        continue
    }

    try {
        $encoded  = [Uri]::EscapeDataString($query)
        $url      = $ApiBase + "?q=" + $encoded
        $headers  = @{ "User-Agent" = "mtg-quest-burden-updater/1.0"; "Accept" = "application/json" }
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        if ($response.object -eq "error") {
            $count = 0
        } else {
            $count = [int]$response.total_cards
        }
        Write-Host "  [$($i+1)/$total] $title -> $count"
    } catch {
        $count = "ERROR"
        Write-Host "  [$($i+1)/$total] $title -> ERROR: $($_.Exception.Message)"
    }

    $row | Add-Member -NotePropertyName quantity   -NotePropertyValue $count -Force
    $row | Add-Member -NotePropertyName percentile -NotePropertyValue ""     -Force

    if ($i -lt $rows.Count - 1) {
        Start-Sleep -Milliseconds (Get-Random -Minimum $DelayMin -Maximum $DelayMax)
    }
}

$numericQtys = $rows |
    Where-Object { $_.quantity -match '^\d+$' } |
    ForEach-Object { [int]$_.quantity } |
    Sort-Object

$n = $numericQtys.Count

if ($n -ge 2) {
    foreach ($row in $rows) {
        if ($row.quantity -notmatch '^\d+$') { continue }
        $val   = [int]$row.quantity
        $below = ($numericQtys | Where-Object { $_ -lt $val }).Count
        $row.percentile = [math]::Round($below / ($n - 1) * 100, 1)
    }
}

$rows | Export-Csv -Path $CsvPath -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "Done! Updated CSV saved to:"
Write-Host "  $(Resolve-Path $CsvPath)"
