param(
    [Parameter(Mandatory = $true)]
    [string]$PluginDirectory,
    [string]$OutputDirectory = "artifacts",
    [switch]$Development
)

$arguments = @("scripts/package-plugin.mjs", $PluginDirectory, $OutputDirectory)
if ($Development) {
    $arguments += "--development"
}

& node @arguments
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
