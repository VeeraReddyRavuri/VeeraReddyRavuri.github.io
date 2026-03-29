# P3 — AWS Production Infrastructure Runbook

## Service: AWS VPC + EC2 + Terraform Infrastructure
**Owner:** Veera Reddy Ravuri | **SLA Target:** 99.9% | **Escalation:** N/A (solo project)

---

## Symptoms
- `terraform plan` shows unexpected changes (state drift)
- EC2 instance unreachable via SSH through bastion
- Application on private EC2 has no internet access (NAT issue)
- CloudWatch logs not appearing
- Ansible playbook fails to connect

## Impact Assessment
| Severity | Description |
|----------|-------------|
| **High** | State drift → resource recreation → potential downtime |
| **Medium** | NAT instance down → private EC2 loses internet access |
| **Low** | CloudWatch logs delayed or missing |

## Immediate Checks
```bash
# 1. Check Terraform state drift
terraform plan

# 2. Verify EC2 instances running
aws ec2 describe-instances --filters "Name=tag:Project,Values=bug-tracker" \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress]'

# 3. Test bastion SSH
ssh -i key.pem ec2-user@<bastion-public-ip>

# 4. Test NAT connectivity (from private EC2 via bastion)
ssh -J ec2-user@<bastion-ip> ec2-user@<private-ip> 'curl -s ifconfig.me'

# 5. Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# 6. Verify CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /app
```

## Mitigation Steps
1. **If state drift detected:**
   - `terraform refresh` to sync state with AWS reality
   - `terraform plan` again to verify only intended changes
   - `terraform apply` to reconcile
2. **If NAT instance is down:** `aws ec2 start-instances --instance-ids <nat-id>`
3. **If SSH fails:** Check security group allows your current IP on port 22
4. **If resource manually created:** `terraform import <resource_type>.<name> <aws-id>`

## Postmortem Checklist
- [ ] Root cause: manual console change, config error, or AWS issue?
- [ ] Terraform state reconciled with `refresh` or `import`
- [ ] Security groups reviewed — no unintended open ports
- [ ] Hard rule enforced: no console changes for Terraform resources
- [ ] Incident note committed with terraform plan diff

## Rollback Steps
1. Identify last known good state: `git log --oneline terraform/`
2. Checkout: `git checkout <good-sha> -- terraform/`
3. Plan: `terraform plan` (review carefully)
4. Apply: `terraform apply`
5. Verify: SSH to bastion → private EC2, check application
