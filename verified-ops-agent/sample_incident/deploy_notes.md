# Deploy notes

## 2025-11-01

- Started schema migration on the orders database.
- Temporarily lowered `db.pool_size` from 50 to 5 in `config/app.yaml` so the
  migration has headroom. **Remember to restore it afterwards.**

## 2025-11-02

- 09:40 — schema migration finished and verified.
- 14:02 — released v2.41.0 to production (unrelated API changes).
- Note: config changes require an app restart to take effect
  (`sudo systemctl restart orders-api`).
