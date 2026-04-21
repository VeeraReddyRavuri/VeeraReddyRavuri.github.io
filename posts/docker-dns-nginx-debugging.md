---
title: "Docker DNS Debugging: Why Nginx Cached Stale Container IPs"
date: "2026-03-20"
excerpt: "When I scaled my FastAPI app to 2 replicas, all traffic went to one container. The root cause: Nginx resolves DNS at startup and caches it. Here's the full debugging process and the 5-second fix."
tags: ["Docker", "Nginx", "DNS", "Networking", "Debugging"]
---

## TL;DR

Scaled a containerized API to 2 replicas. Traffic went to one. Root cause: Nginx caches DNS at startup. Fix: `resolver 127.0.0.11 valid=5s`. This is a common production issue that catches many engineers off guard.

---

## The Setup

I had a FastAPI bug tracker running in Docker Compose with:
- 2 FastAPI replicas behind Nginx
- PostgreSQL with a named volume
- Custom bridge network (`app-net`)

The architecture looked correct. The Nginx config pointed to `api:8000` as the upstream. Docker Compose's `--scale api=2` created two containers. Everything *should* have worked.

## The Symptom

```bash
for i in $(seq 1 10); do curl -s localhost:8080/api/whoami; done
```

Every response showed `api-1`. Zero requests reached `api-2`.

I checked `docker compose logs api-2` and saw zero access log entries. The container was running, healthy, and could respond to direct requests on its internal IP.

## The Investigation

### Step 1: Verify both containers exist on the network
```bash
docker network inspect app-net
```
Both containers had IPs: `172.18.0.3` (api-1) and `172.18.0.5` (api-2). ✓

### Step 2: Check Nginx upstream configuration
```bash
docker compose exec nginx cat /etc/nginx/nginx.conf
```
Upstream pointed to `api:8000`. Correct. But Nginx resolves this hostname **once at startup**.

### Step 3: Dig into Docker DNS
```bash
docker compose exec nginx nslookup api
```
Returned **both** IPs. Docker's embedded DNS (`127.0.0.11`) correctly returns all container IPs for a service name.

The problem wasn't Docker DNS. It was **Nginx caching the first resolution and never re-querying**.

## The Root Cause

Nginx resolves upstream DNS at startup and caches it indefinitely. When api-2 came up after api-1, Nginx already had api-1's IP cached and never re-queried.

This is a well-known behavior in production Nginx deployments, usually solved with:
1. `resolver` directive pointing to a DNS server
2. `valid=Ns` to set a TTL
3. Variables in `proxy_pass` to force runtime resolution

## The Fix

```nginx
upstream api {
    server api:8000;
}

server {
    resolver 127.0.0.11 valid=5s;
    # ...
}
```

Adding `resolver 127.0.0.11 valid=5s` tells Nginx to re-query Docker's DNS every 5 seconds. After applying this and reloading (`nginx -s reload`), traffic distributed evenly.

## What I Learned

1. **DNS caching is invisible.** Containers looked healthy, the network was correct, but Nginx silently ignored the second replica.
2. **Docker DNS is not the same as host DNS.** `127.0.0.11` is Docker's embedded DNS server, not the system resolver.
3. **Production debugging requires layer-by-layer verification.** I had to check the network, DNS, and Nginx config independently before finding the issue.

## Prevention

Added to the project runbook:
- After any `docker-compose scale`, verify load distribution before marking the operation as successful
- Always include `resolver` directive in Nginx configs for containerized environments
