# update_quantities.ps1
# Reads burden_scryfall.csv and lore_scryfall.csv, queries the Scryfall API
# for each row that has a valid scryfall_text, and writes "quantity" and
# "percentile" columns back to each file.
#
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts/update_quantities.ps1

$ApiBase  = "https://api.scryfall.com/cards/search"
$DelayMin = 800
$DelayMax = 1500

function Update-CsvWithQuantities {
    param([string]$CsvPath)

    $label = Split-Path $CsvPath -Leaf
    Write-Host ""
    Write-Host "=== $label ===" -ForegroundColor Cyan

    $rows  = Import-Csv -Path $CsvPath -Encoding UTF8
    $total = $rows.Count
    Write-Host "Processing $total criteria..."

    for ($i = 0; $i -lt $rows.Count; $i++) {
        $row   = $rows[$i]
        $title = if ($row.PSObject.Properties['Title']) { $row.Title } else { $row.Function }
        $query = $row.scryfall_text

        if ([string]::IsNullOrWhiteSpace($query) -or $query -eq 'N/A' -or $query -eq 'NA') {
            Write-Host "  [$($i+1)/$total] $title - skipped (no query)"
            $row | Add-Member -NotePropertyName quantity   -NotePropertyValue "N/A" -Force
            $row | Add-Member -NotePropertyName percentile -NotePropertyValue "N/A" -Force
            continue
        }

        try {
            $encoded  = [Uri]::EscapeDataString($query)
            $url      = $ApiBase + "?q=" + $encoded
            $headers  = @{ "User-Agent" = "mtg-quest-updater/1.0"; "Accept" = "application/json" }
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
    Write-Host "  Saved: $(Resolve-Path $CsvPath)"
}

Update-CsvWithQuantities -CsvPath "$PSScriptRoot\..\assets\files\criteria\burden_scryfall.csv"
Update-CsvWithQuantities -CsvPath "$PSScriptRoot\..\assets\files\criteria\lore_scryfall.csv"

Write-Host ""
Write-Host "All done!" -ForegroundColor Green
