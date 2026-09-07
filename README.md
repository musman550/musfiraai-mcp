# musfiraai-mcp

MCP server for Musfiraai — request free custom tools, automations, AI agents, and n8n workflows directly from Claude Desktop, Claude Code, or any MCP-compatible client.

## Tools

- **request_free_build** — submit a free build request (name, email, type, description)
- **check_request_status** — look up all requests made with a given email

## Connect it

```json
{
  "mcpServers": {
    "musfiraai": {
      "command": "npx",
      "args": ["-y", "musfiraai-mcp"]
    }
  }
}
```
