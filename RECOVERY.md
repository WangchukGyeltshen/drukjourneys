# DrukJourneys backup and recovery

Covers SRS NFR-3 (availability) and NFR-10 (daily backups, RPO of 24 hours or less, RTO of 4 hours or less).

## What is protected

| Asset | Where it lives | Backed up by |
|---|---|---|
| Database (users, bookings, payments, notifications, etc.) | PostgreSQL 16 in Docker container `drukjourneys-db`, volume `postgres_data` | `server/scripts/backup-db.ps1` (custom-format `pg_dump`) |
| Uploaded documents (passport and ID scans) | `server/uploads/`, each file AES-256-GCM encrypted | Same script, as `uploads-<timestamp>.zip` |
| Document encryption key | `DOCUMENT_ENCRYPTION_KEY` in `server/.env` | **Not backed up by the script, on purpose** |
| Other secrets (`JWT_SECRET`, Stripe keys, Gmail app password) | `server/.env` | Not backed up by the script |

**The encryption key must be stored somewhere separate from the backups** (for example a password manager). Backups and key kept together defeat the encryption. Without the key, the uploads archive cannot be read and the documents are lost for good. Keep a copy of the rest of `.env` there too, since the server will not start without it.

## Taking a backup

```
powershell -File server\scripts\backup-db.ps1
```

Output goes to `backups\` (git-ignored, contains personal data):

- `drukjourneys-<timestamp>.dump`: database dump, verified with `pg_restore --list` before the script reports success.
- `uploads-<timestamp>.zip`: document files.

The script fails loudly if the dump is missing or tiny, and deletes backups older than 14 days.

### Schedule it daily

Docker Desktop must be running and the computer on at the scheduled time. Run once in PowerShell to create a 02:00 daily task:

```
schtasks /Create /SC DAILY /ST 02:00 /TN "DrukJourneys Backup" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\lenov\Desktop\drukjourneys\server\scripts\backup-db.ps1"
```

Check it with `schtasks /Query /TN "DrukJourneys Backup"`. Daily backups give an RPO of at most 24 hours, as long as the task actually runs.

## Restoring

1. **Stop the API** (Ctrl+C on `npm run dev`) so nothing writes during recovery.
2. **Make sure the database container is up**: `docker ps` should list `drukjourneys-db`. If the container or volume is gone, run `docker compose up -d` from the repo root first.
3. **Restore the database over the live one** (destroys current contents):
   ```
   powershell -File server\scripts\restore-db.ps1 -DumpFile backups\drukjourneys-<timestamp>.dump -TargetDb drukjourneys -Force
   ```
4. **Restore the documents** (only if `server\uploads` was lost) by adding `-UploadsZip backups\uploads-<timestamp>.zip` to the command above.
5. **Check `server\.env`** has the original `DOCUMENT_ENCRYPTION_KEY`, then start the API with `npm run dev`.
6. **Verify**: `Invoke-RestMethod http://localhost:3000/health` should report `ok`, the row counts printed by the script should look right, and one document download should open correctly.

To test a backup without risk, run step 3 without `-TargetDb` and `-Force`. It restores into a scratch database called `drukjourneys_restore_test` and leaves the live data alone. Remove the scratch database afterwards with:

```
docker exec drukjourneys-db psql -U drukjourneys -d postgres -c "DROP DATABASE drukjourneys_restore_test;"
```

## Restore drill

| Date | Backup | Result |
|---|---|---|
| 2026-10-07 | 46 KB dump (13 users, 4 packages, 10 bookings, 4 payments, 3 documents, 11 notifications) | Restored into the scratch database in 0.9 seconds. User count matched the live database (13). |

## Monitoring

`GET /health` returns 200 with `{"status":"ok","database":"up"}` when the API can reach the database, and 503 when it cannot (the database check times out after 2 seconds). It is public and reveals nothing else. Point any uptime monitor or load balancer at it. The 503 case has not been exercised in a drill yet.

## Objectives and honest limits

- **RPO 24 hours or less:** met only if the scheduled task runs every day. The task `DrukJourneys Backup` was created on 2026-10-07 (first run 2026-10-08 02:00). It only runs while the computer is on and Docker Desktop is running, and nothing alerts anyone if a run is missed, so check `backups\` for a fresh file now and then.
- **RTO 4 hours or less:** the database restore itself took under a second on this small dataset. In practice the time is dominated by getting a working machine, Docker and the `.env` secrets back, so the 4 hour target depends on the key and secrets being stored safely elsewhere. A restore on a larger production database will take longer and should be re-timed.
- **Backups sit on the same computer as the data.** A lost disk or stolen laptop would take the backups with it. Copy `backups\` to a second location (an external drive or cloud storage, encrypted) regularly. Off-site copies are a required follow-up before real traveler data is stored.
- **Document files are not versioned or deleted.** A deleted or corrupted upload can only be recovered from the most recent archive.
- **NFR-3 (99.9% uptime) is not proven by anything here.** `/health` gives monitoring a signal, but real uptime needs hosting with restarts, redundancy and a monitor, which belongs to the deployment phase.
