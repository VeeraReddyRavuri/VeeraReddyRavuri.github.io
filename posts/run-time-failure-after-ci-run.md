---
title: "Incident Report — Runtime Failure After a Perfect CI Run"
date: "2026-04-21"
excerpt: "A deployment passed CI, rolled out via canary, and still failed in production. This post walks through how runtime validation, failure-rate detection, and automated rollback caught what tests and health checks missed."
tags: ["AWS", "CI/CD", "Canary Deployment", "SRE", "Observability", "GitOps", "Reliability"]
---

## Context

I'm a software engineer transitioning from working on production systems 
into DevOps and Cloud infrastructure. I've been building production-pattern systems from scratch and
deliberately breaking them to understand failure behavior.

This project is a CI/CD pipeline with canary deployments, ALB-based 
traffic shifting, and automated rollback. The goal was not just to 
make deployments work, it was to make failures recoverable without 
human intervention.

This incident was one of those deliberate breaks. The failure was 
injected. The detection and recovery were not.

---

**Date:** 2026-04-21
**Time:** 19:12 IST
**Severity:** Medium
**Resolution Time:** ~2 minutes
**Status:** Resolved — Automatic Rollback

---

## TL;DR

Pipeline passed all CI checks. Image was built, scanned, and pushed successfully. The canary deployment began with a 90/10 traffic split. ALB health checks continued to pass. Three minutes later, the validation loop detected a 15% failure rate on Green. Automatic rollback triggered — traffic returned to Blue, manifest repo reverted.

The failure only existed at runtime. Nothing in the build, test, or scan stages could have caught it.

---

## Timeline

| Time | Event |
|---|---|
| 19:12 | Pipeline triggered on push to `main` |
| 19:12 | Lint, test, build, scan — all passed |
| 19:13 | Image pushed to DockerHub with commit SHA tag |
| 19:13 | Manifest repo updated with new SHA |
| 19:14 | Green container deployed on EC2 port 8081 |
| 19:14 | ALB shifted to 90% Blue / 10% Green |
| 19:15 | Validation loop started — failures detected |
| 19:16 | Failure rate reached 15% threshold — rollback triggered |
| 19:16 | ALB returned to 100% Blue |
| 19:16 | Manifest repo reverted via `git revert` |
| 19:17 | System restored to last known good state |

---

## Environment

- Single EC2 instance running two containers on separate ports
- Blue → port `8080` (stable version)
- Green → port `8081` (new version)
- No autoscaling, no orchestration layer
- Intentionally minimal to isolate deployment behavior

---

## The Failure

The deployed version contained an intentional fault introduced for failure injection testing:

```python
@app.get("/")
def read_root():
    return Response(content="failure", status_code=500)
```

Everything before runtime validated successfully. CI passed. Trivy passed. The `/health` endpoint continued to return `200` — ALB health checks never flagged it. The failure only appeared when real traffic hit the application's root endpoint.

---

## Detection

### First Signal — Validation Log Drift

```
Attempt 1  --> Status: 200
Attempt 2  --> Status: 200
Attempt 3  --> Status: 200
Attempt 4  --> Status: 502
Attempt 5  --> Status: 200
Attempt 6  --> Status: 200
Attempt 7  --> Status: 200
Attempt 8  --> Status: 200
Attempt 9  --> Status: 502
Attempt 10 --> Status: 502
```

Three failures in ten requests. The pattern aligned with the canary traffic split — failures appearing at roughly the frequency Green was receiving traffic, not uniformly. This indicated the issue was isolated to the new version, not the infrastructure.

### Bypassing the ALB

To confirm, the Green container was queried directly:

```bash
curl http://localhost:8081
```

Response:

```
failure
```

Consistent. No variance. The application itself was returning `500`.

### Controlled Sampling Through the Real Path

One request is noise. A pattern is signal. The validation loop ran 20 requests through the ALB — the same path users take:

```bash
FAILURES=0
TOTAL=20

for i in {1..20}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS)
  echo "Attempt $i --> Status: $STATUS"

  if [ "$STATUS" -ne 200 ]; then
    FAILURES=$((FAILURES+1))
  fi

  sleep 2
done

FAILURE_RATE=$((FAILURES * 100 / TOTAL))
```

The pattern held. Failures appeared consistently in proportion to traffic hitting Green.

---

## Why 502 Appeared Instead of 500

The application returned `500`. The ALB surfaced `502` intermittently due to upstream connection handling behavior — this can occur when targets respond unexpectedly or connections are disrupted at the ALB layer. ALB access logs were not enabled in this setup to keep the environment simple. With access logs enabled, failures could be correlated with specific targets and response timing.

---

## Rollback Threshold

```bash
if [ "$FAILURE_RATE" -ge 15 ]; then
  failed=true
fi
```

15% corresponds to 3 failures in a 20-request sample. This threshold filters transient noise while still reacting to consistent failure patterns. A single 502 from a transient connection issue would not trigger rollback. A consistent pattern aligned with the canary split would.

---

## Validation Timing

| Phase | Duration |
|---|---|
| Stabilization window (post-deploy) | ~60 seconds |
| Validation window (20 requests, 2s apart) | ~40 seconds |
| Total time to rollback decision | ~90–120 seconds |

---

## Rollback Sequence

**Step 1 — Traffic rollback (immediate)**

```
Blue  → 100%
Green → 0%
```

Requests stopped hitting the broken version. In-flight requests drained via connection draining (30–60s).

**Step 2 — State rollback (GitOps consistency)**

```bash
git revert HEAD
git push origin main
```

The manifest repo reverted to the previous image SHA. The pipeline redeployed the last known good version based on the reverted state. No partial state. No manual cleanup.

---

## Root Cause

The deployed version contained a hardcoded `500` response on the root endpoint, introduced intentionally for failure injection testing. The fault passed all pre-deploy checks because:

- Lint checks code style, not behavior
- Unit tests did not cover the root endpoint failure case
- Trivy scans packages for CVEs, not application logic
- ALB health checks only verified `/health` — not the failing endpoint

The failure lived in the gap between deployment success and runtime behavior under real traffic.

---

## What This Exposed

| Layer | What it checks | What it missed |
|---|---|---|
| Lint | Code style | Runtime behavior |
| Unit tests | Logic correctness | Endpoint-level failures not covered by tests |
| Trivy | Package CVEs | Application logic |
| ALB health check | Process liveness (`/health`) | Correctness of other endpoints |
| Canary validation | Real traffic failure rate | Nothing — this caught it |

The canary validation loop was the only layer that observed behavior as users would experience it.

---

## What Changed After This

- Validation moved into the deployment flow — requests go through the ALB, not directly to the container
- Failure rate became the signal that drives rollback decisions
- Canary rollout limits exposure and creates a detection window before full promotion
- Rollback remains split: traffic rollback for immediate containment, state rollback for GitOps consistency

---

## Operational Impact

**Without automated rollback**, the recovery process would have required:

1. Noticing the failure pattern in logs or user reports
2. Verifying it was not transient
3. Tracing it back to the deployment
4. Manually shifting ALB traffic
5. Reverting the manifest repo
6. Redeploying

That process takes significant time even when executed cleanly.

**With automated rollback**, the system reversed itself in under two minutes. No escalation. No guesswork. No manual intervention.

---

## Principles This Confirmed

**A passing health check is a liveness signal, not a correctness signal.**
`/health` returning `200` means the process is alive. It says nothing 
about whether the application behaves correctly under real traffic. 
These are fundamentally different things and should never be conflated.

**CI validates build conditions. Runtime validates behavior.**
Lint, tests, and security scans operate on static artifacts. They 
cannot observe how an application responds to live requests. The gap 
between a green pipeline and correct production behavior is where most 
real failures live.

**Canary exposure is a detection mechanism, not just a safety measure.**
The 10% traffic split did not prevent failure — it created a window 
to observe it before it reached 100% of users. The value of canary 
is not risk reduction alone. It is the deliberate creation of a 
signal you can act on.

**Rollback must be two actions, not one.**
Shifting ALB traffic stops user impact. Reverting the manifest repo 
maintains Git as the source of truth. Doing only one leaves the 
system in a state where the next deploy can silently reintroduce 
the same failure. Both actions are always required.

**Automation removes the human from the recovery path — 
and that is the point.**
Manual recovery requires someone to notice, diagnose, decide, 
and act — under pressure, at any hour. Each step introduces 
delay and error. A system that recovers itself in 90 seconds 
is not a convenience. It is a reliability property.

---

## Related Files

- [`pipeline.yml`](https://github.com/VeeraReddyRavuri/secure-cicd-gitops-pipeline/blob/main/.github/workflows/ci.yml) — validation loop and rollback logic
- [`manifests/deployment.yml`](https://github.com/VeeraReddyRavuri/app-manifest-repo/blob/main/k8s/deployment.yaml) — state that was reverted
- [`ARCHITECTURE.md`](https://github.com/VeeraReddyRavuri/secure-cicd-gitops-pipeline/blob/main/docs/architecture.md) — full system design and rollback strategy