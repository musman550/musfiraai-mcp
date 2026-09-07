#!/usr/bin/env node
/**
 * musfiraai-mcp — request free tools, automations & n8n workflows from any MCP client.
 * https://musfiraai.com
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = {
  request: "https://vfumvywhiwrgmankfqbg.supabase.co/functions/v1/request-tool",
  status: "https://vfumvywhiwrgmankfqbg.supabase.co/functions/v1/request-status"
};

const server = new McpServer({
  name: "musfiraai-mcp",
  version: "1.0.0"
});

server.registerTool(
  "request_free_build",
  {
    title: "Request a free build",
    description:
      "Submit a free request to Musfiraai for a custom tool, automation, AI agent, or n8n workflow. " +
      "There is no cost. Returns a reference ID that can be used with check_request_status.",
    inputSchema: {
      name: z.string().describe("Requester's full name"),
      email: z.string().email().describe("Requester's email address"),
      tool_type: z
        .enum(["tool", "automation", "n8n_workflow", "agent", "other"])
        .describe("Kind of build requested"),
      description: z.string().describe("What should be built, in as much detail as possible")
    }
  },
  async ({ name, email, tool_type, description }) => {
    try {
      const res = await fetch(API.request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, tool_type, description })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          content: [{ type: "text", text: `Unexpected response from server (HTTP ${res.status}).` }],
          isError: true
        };
      }
      if (!res.ok) {
        return { content: [{ type: "text", text: `Request failed: ${data.error || "unknown error"}` }], isError: true };
      }
      return {
        content: [
          {
            type: "text",
            text: `Request received. Reference ID: ${data.id}\nTrack it any time with check_request_status using ${email}.`
          }
        ]
      };
    } catch (err) {
      return { content: [{ type: "text", text: `Network error: ${err.message}` }], isError: true };
    }
  }
);

server.registerTool(
  "check_request_status",
  {
    title: "Check request status",
    description: "Look up the status of all free build requests submitted with a given email address.",
    inputSchema: {
      email: z.string().email().describe("Email address used when the request was submitted")
    }
  },
  async ({ email }) => {
    try {
      const res = await fetch(API.status, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          content: [{ type: "text", text: `Unexpected response from server (HTTP ${res.status}).` }],
          isError: true
        };
      }
      if (!res.ok) {
        return { content: [{ type: "text", text: `Lookup failed: ${data.error || "unknown error"}` }], isError: true };
      }
      if (!data.requests || !data.requests.length) {
        return { content: [{ type: "text", text: "No requests found for this email." }] };
      }
      const lines = data.requests.map(
        (r) => `[${r.status.toUpperCase()}] ${r.tool_type} — ${r.description.slice(0, 100)} (${new Date(r.created_at).toLocaleDateString()})`
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Network error: ${err.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
