# UniHome API - DevOps

## Docker (local)

1. Build and run:

```bash
docker compose up --build
```

2. API is available at:

```
http://localhost:8080
```

## CI (GitHub Actions)

- Workflow: `.github/workflows/ci.yml`
- Runs on push/PR:
  - JDK 17 setup
  - `mvn -q -Dtest=UnihomeApiApplicationTests test`

## Notes

- Database schema is initialized from `unihome.sql` in Docker.
- Provide SMTP/Cloudinary secrets via environment variables when needed.

