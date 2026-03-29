# P2 — Bug Tracker Containerized Stack Runbook

## Service: bug-tracker (Docker Compose)
**Owner:** Veera Reddy Ravuri | **SLA Target:** 99.9% | **Escalation:** N/A (solo project)

---

## Symptoms
- API returns 502/503 errors
- Load balancing not distributing across replicas
- Database connection failures (`could not translate host name "db"`)
- Nginx returns default page instead of API responses

## Impact Assessment
| Severity | Description |
|----------|-------------|
| **High** | All replicas down → complete service outage |
| **Medium** | Uneven traffic → one replica overloaded → intermittent errors |
| **Low** | Slow responses due to missing DNS re-resolution |

## Immediate Checks
```bash
# 1. Check all container status
docker compose ps

# 2. Check API health
curl -s http://localhost:8080/health

# 3. Check DB connectivity
curl -s http://localhost:8080/api/db-check

# 4. Verify load balancing
for i in $(seq 1 10); do curl -s http://localhost:8080/api/whoami; echo; done

# 5. Check container logs
docker compose logs --tail 50 api
docker compose logs --tail 50 nginx
docker compose logs --tail 50 db

# 6. Check Nginx DNS resolution
docker compose exec nginx cat /etc/nginx/nginx.conf | grep resolver
```

## Mitigation Steps
1. **If containers are down:** `docker compose up -d`
2. **If DB unreachable:** `docker compose restart db` then `docker compose restart api`
3. **If Nginx not routing:** `docker compose exec nginx nginx -s reload`
4. **If DNS stale:** Verify `resolver 127.0.0.11 valid=5s` in Nginx config
5. **If disk full:** `docker system prune -f` to clean unused images/volumes

## Postmortem Checklist
- [ ] Root cause identified (DNS, network, resource limits, config)
- [ ] Fix applied and all containers healthy
- [ ] Load balancing verified across all replicas
- [ ] Runbook updated with new failure mode
- [ ] Incident documented in git with timeline

## Rollback Steps
1. Stop all containers: `docker compose down`
2. Check out previous working version: `git checkout <previous-sha>`
3. Rebuild: `docker compose build --no-cache`
4. Start: `docker compose up -d`
5. Verify: `curl http://localhost:8080/health`
