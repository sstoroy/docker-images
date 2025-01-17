if (!(docker --version 2> $null)) { 
  Write-Host "Docker not installed! Aborting..."
  exit 1
}

Set-Location -Path $PSScriptRoot
if (!(docker build -t {{ filename }} . )) {
    Write-Host "Failed to build image! Aborting..."
    exit 1
}

docker run -p 8080:8080 {{ filename }}