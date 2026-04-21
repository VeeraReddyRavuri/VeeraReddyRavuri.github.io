---
title: "Terraform State Drift: How a Manual Console Change Broke My Infrastructure"
date: "2026-03-25"
excerpt: "I deleted a security group rule in the AWS console 'just to test something'. The next terraform plan wanted to recreate the entire resource. Here's how I recovered and what I changed to prevent it."
tags: ["Terraform", "AWS", "IaC", "State Management", "Incident"]
---

## TL;DR

Manual AWS console change caused Terraform state drift. Recovery: `terraform apply -refresh-only` + `apply`. Prevention: hard rule, never touch the console for Terraform-managed resources. This is the most common mistake teams make with IaC.

---

## What Happened

I was working on P3, my AWS infrastructure project with 14 Terraform-managed resources (VPC, subnets, EC2, security groups, NAT instance, IAM roles).

I wanted to test something quickly, so I deleted a security group rule directly in the AWS console. Forgot to revert it.

Next day, I ran `terraform plan`.

## The Symptom

```
terraform plan

~ aws_security_group.app_sg will be updated in-place
  - ingress rule deleted (port 8080)

-/+ aws_security_group_rule.app_ingress must be replaced
```

Terraform wanted to **recreate** the security group rule, a destructive action that would temporarily remove all rules from the group, potentially exposing or blocking traffic.

## Why This Is Dangerous

In production, recreating a security group can:
1. **Temporarily expose services** to the internet (if rules are removed)
2. **Block all traffic** during the recreation window
3. **Cascade to dependent resources** (EC2 instances attached to the SG)

This isn't hypothetical. AWS recreates security groups by destroying the old one and creating a new one, which means for a brief moment, the attached EC2 instances have no security group.

## The Root Cause

Terraform state held the original configuration (with the rule). The AWS console change deleted the rule in reality but didn't update the state file. Terraform's state and AWS reality diverged. This is **state drift**.

When Terraform planned, it compared its state (rule exists) with reality (rule doesn't exist) and decided to recreate it.

## The Recovery

### Step 1: Sync state with reality
```bash
terraform apply -refresh-only
```
This updates Terraform's state file to match what's actually in AWS. Now Terraform knows the rule is missing.

### Step 2: Plan again
```bash
terraform plan
```
Now the plan shows a clean add (not a destructive recreate). It will simply add the missing rule back.

### Step 3: Apply
```bash
terraform apply
```
Rule added back. Total recovery time: under 5 minutes once I understood the root cause.

## What I Changed

### Hard rule added to runbook:
> **Never touch the AWS console for any resource managed by Terraform.** If an emergency requires a manual change, immediately run `terraform apply -refresh-only` and `terraform import` to sync state, then commit the change to the Terraform config.

### Added to CI/CD plan (P4):
- `terraform plan` runs on every PR so drift is detected before merge
- `terraform plan -detailed-exitcode` in CI returns exit code 2 if changes exist
- Scheduled daily `terraform plan` to detect overnight drift

## NAT Instance Decision (Bonus Trade-off)

While building this infrastructure, I chose a NAT instance ($8/mo) over NAT Gateway ($32/mo + data fees). This was a deliberate learning decision:

| Factor | NAT Instance | NAT Gateway |
|--------|-------------|-------------|
| Cost | $8/mo (t3.micro) | $32/mo + $0.045/GB |
| HA | Single AZ, manual failover | Multi-AZ, AWS-managed |
| Maintenance | Patch OS, monitor health | Zero maintenance |
| Learning value | High: teaches routing, SGs, source/dest check | Low: managed service |

In production, I'd recommend NAT Gateway. For learning networking fundamentals, the NAT instance taught me more in a week than any tutorial.

## Key Takeaway

State drift is the most common IaC failure mode. It's not a bug; it's a process failure. The fix isn't technical (refresh/import are straightforward). The fix is **discipline**: never bypass the code path.
