# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Tujjar, please send an email to [INSERT EMAIL]. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity, typically within 2 weeks

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations and data destruction
- Only interact with accounts you own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report vulnerabilities promptly

We will not pursue legal action for accidental, good-faith violations of this policy.

## Security Best Practices

When deploying Tujjar in production:

1. **Environment Variables**: Never commit `.env` files. Use strong, unique secrets.
2. **HTTPS**: Always use HTTPS in production.
3. **Database**: Use strong passwords and restrict network access.
4. **Updates**: Keep dependencies updated (enable Dependabot).
5. **Docker**: Use production Docker Compose (`docker-compose.prod.yml`).

## Dependencies

We use Dependabot to monitor dependencies for known vulnerabilities. Security updates are automatically created as pull requests.
