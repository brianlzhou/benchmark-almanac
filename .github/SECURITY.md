# Security

Report a vulnerability privately through GitHub: open the repository's **Security** tab and choose
**Report a vulnerability**. Do not open a public issue for it.

The site is static, so most reports concern the GitHub Actions workflows. `submission.yml` reads text
from public issues, and `discover.yml` and `sync.yml` push to branches and open pull requests.
