from typing import Any, Dict, List
from mcp.server.fastmcp import FastMCP
from supabase_client import supabase

# 🔒 DEV: Hardcoded Firebase ID for Datathon testing environment
TEST_FIREBASE_ID = "JDfZoVuGJhdLBEvR7rVCQKBG9r02"

# ✅ Allowed tables configuration for the MCP server
ALLOWED_TABLES = {
    "github": {"user_scoped": True},
    "jira_data": {"user_scoped": True},
    "Users": {"user_scoped": True},
    "commits": {"user_scoped": True},
    "contributors": {"user_scoped": True},
    "issues": {"user_scoped": True},
    "pull_requests": {"user_scoped": True}
}

mcp = FastMCP("EntelliGen Engineering MCP")

@mcp.tool()
async def list_available_tables() -> List[str]:
    """List all engineering tables available for analysis."""
    return list(ALLOWED_TABLES.keys())

@mcp.tool()
async def get_engineering_data(table_name: str) -> List[Dict[str, Any]]:
    """Fetch structured data from a specific engineering table (GitHub, Jira, etc.)."""
    if table_name not in ALLOWED_TABLES:
        return [{"error": f"Access to table '{table_name}' is restricted."}]

    try:
        cfg = ALLOWED_TABLES[table_name]
        q = supabase.table(table_name).select("*")
        if cfg["user_scoped"]:
            q = q.eq("firebase_id", TEST_FIREBASE_ID)

        return q.execute().data
    except Exception as e:
        return [{"error": f"Failed to retrieve data from {table_name}: {str(e)}"}]

@mcp.tool()
async def deep_repo_scan() -> Dict[str, Any]:
    """Performs a comprehensive scan across all GitHub and Jira tables for the test user."""
    results = {}
    for table, cfg in ALLOWED_TABLES.items():
        try:
            q = supabase.table(table).select("*")
            if cfg["user_scoped"]:
                q = q.eq("firebase_id", TEST_FIREBASE_ID)
            results[table] = q.execute().data
        except Exception as e:
            results[table] = [{"error": str(e)}]
    return results

if __name__ == "__main__":
    mcp.run()
