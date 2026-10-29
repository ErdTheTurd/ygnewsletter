# Hostinger

Deploy records land in `site.json` after a successful Node deploy to a free subdomain.

Until Hostinger MCP/API auth is available on this agent:

1. Connect Hostinger in the Cursor MCP connector, or set `HOSTINGER_API_TOKEN`.
2. Confirm an active web hosting plan: https://www.hostinger.com/web-hosting
3. Re-run the agent (or ask it to deploy) so it can generate a free subdomain, deploy this app as Node.js (`server.js` / `npm start`), set `EDIT_PASSPHRASE`, and write `site.json`.
