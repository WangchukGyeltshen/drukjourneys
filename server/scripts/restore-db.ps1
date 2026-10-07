# DrukJourneys restore (NFR-10).
#
# Safe default: restores a dump into a SCRATCH database
# (drukjourneys_restore_test), prints row counts, then leaves it for
# inspection. Use this to prove a backup works.
#
#   powershell -File server\scripts\restore-db.ps1 -DumpFile backups\drukjourneys-<stamp>.dump
#
# Real recovery: restore over the live database. This DESTROYS the
# current contents, so it needs -TargetDb drukjourneys AND -Force.
#
#   powershell -File server\scripts\restore-db.ps1 -DumpFile <file> -TargetDb drukjourneys -Force
#
# Optionally restore the uploaded documents too:
#   ... -UploadsZip backups\uploads-<stamp>.zip
# (needs the original DOCUMENT_ENCRYPTION_KEY in server\.env to be readable)

param(
  [Parameter(Mandatory = $true)][string]$DumpFile,
  [string]$TargetDb = 'drukjourneys_restore_test',
  [string]$UploadsZip,
  [switch]$Force,
  [string]$Container = 'drukjourneys-db',
  [string]$DbUser = 'drukjourneys',
  [string]$LiveDb = 'drukjourneys'
)

$ErrorActionPreference = 'Stop'
$timer = [System.Diagnostics.Stopwatch]::StartNew()

if (-not (Test-Path $DumpFile)) { throw "Dump file not found: $DumpFile" }
$DumpFile = (Resolve-Path $DumpFile).Path

if ($TargetDb -eq $LiveDb -and -not $Force) {
  throw "Refusing to overwrite the live database '$LiveDb' without -Force."
}

$tmp = '/tmp/restore-input.dump'
docker cp $DumpFile "${Container}:$tmp"
if ($LASTEXITCODE -ne 0) { throw 'docker cp failed' }

# Recreate the target database (WITH FORCE disconnects any open sessions).
docker exec $Container psql -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS `"$TargetDb`" WITH (FORCE);"
if ($LASTEXITCODE -ne 0) { throw 'DROP DATABASE failed' }
docker exec $Container psql -U $DbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"$TargetDb`";"
if ($LASTEXITCODE -ne 0) { throw 'CREATE DATABASE failed' }

docker exec $Container pg_restore -U $DbUser -d $TargetDb --no-owner --exit-on-error $tmp
$restoreExit = $LASTEXITCODE
docker exec $Container rm -f $tmp | Out-Null
if ($restoreExit -ne 0) { throw 'pg_restore failed' }

if ($UploadsZip) {
  if (-not (Test-Path $UploadsZip)) { throw "Uploads archive not found: $UploadsZip" }
  $uploadsDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'uploads'
  New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null
  Expand-Archive -Path $UploadsZip -DestinationPath $uploadsDir -Force
  Write-Host "Uploads restored to $uploadsDir"
}

Write-Host "Restored into '$TargetDb'. Row counts:"
$sql = "SELECT 'users' AS t, count(*) FROM users UNION ALL SELECT 'packages', count(*) FROM packages UNION ALL SELECT 'bookings', count(*) FROM bookings UNION ALL SELECT 'payments', count(*) FROM payments UNION ALL SELECT 'documents', count(*) FROM documents UNION ALL SELECT 'notifications', count(*) FROM notifications;"
docker exec $Container psql -U $DbUser -d $TargetDb -c $sql

$timer.Stop()
Write-Host ("Restore finished in {0:N1} seconds." -f $timer.Elapsed.TotalSeconds)
