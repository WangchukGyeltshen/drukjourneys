# DrukJourneys backup (NFR-10): database dump + encrypted uploads archive.
#
# Run from anywhere:   powershell -File server\scripts\backup-db.ps1
# Schedule it daily (see RECOVERY.md) to meet RPO <= 24 hours.
#
# Output goes to <repo>\backups\ (git-ignored, contains personal data):
#   drukjourneys-<timestamp>.dump   PostgreSQL custom-format dump
#   uploads-<timestamp>.zip         document files (already AES-256-GCM encrypted)
#
# The document encryption key (DOCUMENT_ENCRYPTION_KEY) is NOT backed up
# here on purpose. Store it separately, or the uploads archive is unreadable.

param(
  [string]$Container = 'drukjourneys-db',
  [string]$DbUser = 'drukjourneys',
  [string]$DbName = 'drukjourneys',
  [int]$KeepDays = 14
)

$ErrorActionPreference = 'Stop'

$repoRoot  = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backupDir = Join-Path $repoRoot 'backups'
$uploadsDir = Join-Path $repoRoot 'server\uploads'
$stamp     = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpFile  = Join-Path $backupDir "drukjourneys-$stamp.dump"
$zipFile   = Join-Path $backupDir "uploads-$stamp.zip"
$tmpInContainer = "/tmp/drukjourneys-$stamp.dump"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# 1. Dump inside the container, copy it out, remove the temp copy.
docker exec $Container pg_dump -U $DbUser -d $DbName -Fc -f $tmpInContainer
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
docker cp "${Container}:$tmpInContainer" $dumpFile
if ($LASTEXITCODE -ne 0) { throw 'docker cp failed' }
docker exec $Container rm -f $tmpInContainer | Out-Null

# 2. A zero-byte or missing dump must never count as a backup.
if (-not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -lt 1024) {
  throw "Dump file is missing or suspiciously small: $dumpFile"
}

# 3. Verify the dump is readable by listing its contents.
docker cp $dumpFile "${Container}:$tmpInContainer"
docker exec $Container pg_restore --list $tmpInContainer | Out-Null
$restoreCheck = $LASTEXITCODE
docker exec $Container rm -f $tmpInContainer | Out-Null
if ($restoreCheck -ne 0) { throw 'Dump failed verification (pg_restore --list)' }

# 4. Archive uploaded documents (skip if nothing has been uploaded yet).
if ((Test-Path $uploadsDir) -and (Get-ChildItem $uploadsDir -File -ErrorAction SilentlyContinue)) {
  Compress-Archive -Path (Join-Path $uploadsDir '*') -DestinationPath $zipFile
} else {
  Write-Host 'No uploaded documents to archive.'
}

# 5. Retention: delete backups older than $KeepDays days.
Get-ChildItem $backupDir -File |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
  Remove-Item -Force

$sizeKb = [math]::Round((Get-Item $dumpFile).Length / 1KB, 1)
Write-Host "Backup OK: $dumpFile ($sizeKb KB)"
if (Test-Path $zipFile) { Write-Host "Uploads archive: $zipFile" }
