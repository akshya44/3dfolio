# Bash Scripting Suite for System Maintenance

**Bash Scripting Suite for System Maintenance**

This suite automates common maintenance tasks on Linux systems:
- Automated backups (configurable sources, retention).
- System updates and cleanup (supports `apt`, `dnf`, and `pacman`).
- Log monitoring with keyword alerts (cron/systemd friendly).
- A simple interactive menu to run tasks on demand.

> Tested on Ubuntu/Debian, Fedora/RHEL, and Arch-based systems. Requires Bash 4+.

## Quick Start

```bash
cd BashMaintenanceSuite
cp .env.example .env
# Edit .env to match your system
chmod +x *.sh
./menu.sh
```

## Scripts

- `backup.sh`: Archives specified directories into timestamped `.tar.gz` files, prunes old archives by retention days.
- `update_cleanup.sh`: Runs safe system updates and cleans caches/logs. Auto-detects package manager.
- `log_monitor.sh`: Scans logs for keywords within the last N minutes (default 15). Writes alerts and returns non-zero on findings.
- `menu.sh`: Interactive launcher for the suite.
- `install.sh`: Optional helper to install cron jobs and a systemd timer for log monitoring.
- `utils.sh`: Common helpers used by other scripts (env loading, logging, sudo checks, pkg manager detection).

## Cron Examples

See `crontab.example` for a sample schedule. Apply with:

```bash
crontab crontab.example
```


