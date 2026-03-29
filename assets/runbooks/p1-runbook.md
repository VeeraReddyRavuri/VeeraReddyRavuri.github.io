# P1 — Linux Reliability Toolkit Runbook

## Service: reliability-toolkit (systemd)
**Owner:** Veera Reddy Ravuri | **SLA Target:** 99.9% | **Escalation:** N/A (solo project)

---

## Symptoms
- Alerts stop firing despite known threshold breaches
- Target services stay down after expected auto-restart
- Logs show "Permission denied" or no restart attempts
- Webhook notifications not reaching Slack/email

## Impact Assessment
| Severity | Description |
|----------|-------------|
| **High** | Tool is down → no monitoring → silent service failures |
| **Medium** | Alerts fire but restarts fail → manual intervention needed |
| **Low** | Threshold misconfiguration → false positives or missed alerts |

## Immediate Checks
```bash
# 1. Check toolkit status
systemctl status reliability-toolkit

# 2. Review recent logs
journalctl -u reliability-toolkit --since "30 min ago" --no-pager

# 3. Verify privilege level
whoami  # Should be root or user with restart permissions

# 4. Check target services
systemctl list-units --state=failed

# 5. Test webhook connectivity
curl -s -o /dev/null -w "%{http_code}" https://hooks.slack.com/services/YOUR_WEBHOOK
```

## Mitigation Steps
1. **If toolkit is stopped:** `sudo systemctl restart reliability-toolkit`
2. **If permission denied:** Check service file runs as root: `cat /etc/systemd/system/reliability-toolkit.service`
3. **If webhook fails:** Verify network connectivity and webhook URL in `config.yaml`
4. **If thresholds wrong:** Edit `config.yaml` and restart toolkit

## Postmortem Checklist
- [ ] Root cause identified and documented
- [ ] Fix applied and tested
- [ ] Prevention measure added (self-check, alert, config)
- [ ] Runbook updated with new learnings
- [ ] Incident note committed to repo

## Rollback Steps
1. Stop current version: `sudo systemctl stop reliability-toolkit`
2. Check out previous version: `git checkout <previous-sha>`
3. Reinstall: `pip install -e .`
4. Restart: `sudo systemctl start reliability-toolkit`
5. Verify: `journalctl -u reliability-toolkit -f`
