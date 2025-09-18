### 🔐 JWT Secret
We use HS256. Set a 32-byte Base64 secret in `.env`.

**Generate (choose one):**
- macOS/Linux: `openssl rand -base64 32`
- Windows (PowerShell): `[Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))`
- Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

**.env**
