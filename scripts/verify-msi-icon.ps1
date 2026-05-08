param (
    [Parameter(Mandatory=$true)]
    [string]$MsiPath,
    [Parameter(Mandatory=$true)]
    [string]$ExpectedVersion
)

if (-not (Test-Path $MsiPath)) {
    Write-Error "MSI file not found at $MsiPath"
    exit 1
}

try {
    Write-Host "Performing integrity check on MSI database..."
    $windowsInstaller = New-Object -ComObject WindowsInstaller.Installer
    $database = $windowsInstaller.OpenDatabase($MsiPath, 0) # 0 = msiOpenDatabaseModeReadOnly
    
    # Query the Icon table to see if our brand assets were bundled
    $view = $database.OpenView("SELECT `Name` FROM `Icon`")
    $view.Execute()
    
    $foundIcon = $false
    while ($record = $view.Fetch()) {
        $iconName = $record.StringData(1)
        # Tauri usually bundles the primary application icon as 'icon.ico' in the MSI tables
        if ($iconName -like "*icon.ico*") {
            Write-Host "[SUCCESS] Unique icon resource found in MSI Icon table: $iconName"
            $foundIcon = $true
            break
        }
    }
    
    if (-not $foundIcon) {
        Write-Error "[FAILURE] Unique Pulse-Bolt icon not found in MSI resources. Build might have reverted to default assets."
        exit 1
    }

    # Verification for WebView2 Bootstrapper (Institutional Grade requirement)
    # This ensures 'downloadBootstrapper' mode is correctly baked into the installer
    Write-Host "Verifying MSI resources for WebView2 Bootstrapper..."
    $binaryView = $database.OpenView("SELECT `Name` FROM `Binary`")
    $binaryView.Execute()

    $foundBootstrapper = $false
    while ($binRecord = $binaryView.Fetch()) {
        $binaryName = $binRecord.StringData(1)
        # Tauri/WiX typically names the bootstrapper binary 'Microsoft.Web.WebView2.EXE'
        if ($binaryName -like "*WebView2*" -or $binaryName -eq "Microsoft.Web.WebView2.EXE") {
            Write-Host "[SUCCESS] WebView2 Bootstrapper found in MSI Binary table: $binaryName"
            $foundBootstrapper = $true
            break
        }
    }

    if (-not $foundBootstrapper) {
        Write-Error "[FAILURE] WebView2 Bootstrapper not found in MSI resources. Ensure webviewInstallMode is set to 'downloadBootstrapper'."
        exit 1
    }

    # Verification for Property table (Institutional Identity)
    Write-Host "Verifying MSI Property table for institutional identity..."
    $propertyView = $database.OpenView("SELECT `Property`, `Value` FROM `Property`")
    $propertyView.Execute()

    $foundManufacturer = $false
    $foundProductName = $false
    $foundProductVersion = $false

    while ($propRecord = $propertyView.Fetch()) {
        $propName = $propRecord.StringData(1)
        $propValue = $propRecord.StringData(2)

        if ($propName -eq "Manufacturer") {
            if ($propValue -eq "Allbright") {
                Write-Host "[SUCCESS] Manufacturer verified: $propValue"
                $foundManufacturer = $true
            } else {
                Write-Error "[FAILURE] Unexpected Manufacturer: $propValue (Expected: Allbright)"
                exit 1
            }
        }
        if ($propName -eq "ProductName") {
            if ($propValue -eq "Allbright-Desktop") {
                Write-Host "[SUCCESS] Product Name verified: $propValue"
                $foundProductName = $true
            } else {
                Write-Error "[FAILURE] Unexpected Product Name: $propValue (Expected: Allbright-Desktop)"
                exit 1
            }
        }
        if ($propName -eq "ProductVersion") {
            if ($propValue -eq $ExpectedVersion) {
                Write-Host "[SUCCESS] Product Version verified: $propValue"
                $foundProductVersion = $true
            } else {
                Write-Error "[FAILURE] Unexpected Product Version: $propValue (Expected: $ExpectedVersion)"
                exit 1
            }
        }
    }

    if (-not $foundManufacturer) { Write-Error "[FAILURE] Manufacturer property not found."; exit 1 }
    if (-not $foundProductName) { Write-Error "[FAILURE] ProductName property not found."; exit 1 }
    if (-not $foundProductVersion) { Write-Error "[FAILURE] ProductVersion property not found."; exit 1 }
} catch {
    Write-Error "Failed to verify MSI resources: $($_.Exception.Message)"
    exit 1
} finally {
    if ($propertyView) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($propertyView) | Out-Null }
    if ($binaryView) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($binaryView) | Out-Null }
    if ($view) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($view) | Out-Null }
    if ($database) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($database) | Out-Null }
    if ($windowsInstaller) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($windowsInstaller) | Out-Null }
}