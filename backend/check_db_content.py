
import os
from supabase import create_client

SUPABASE_URL = "https://mikrcsxkyggxjeaqyfaw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pa3Jjc3hreWdneGplYXF5ZmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjQ1OCwiZXhwIjoyMDg2MDAyNDU4fQ.pX3hcJJUQwJa0YC88iy8NUhORDZbB44fgTojvbZZO7A"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("--- Checking 'github' table (Top 5) ---")
try:
    res = supabase.table("github").select("id, full_name, owner, repo").limit(5).execute()
    for row in res.data:
        print(row)
except Exception as e:
    print(e)
    
print("\n--- Checking 'commits' table (Top 5) ---")
try:
    res = supabase.table("commits").select("id, sha, author, github_id").limit(5).execute()
    for row in res.data:
        print(row)
except Exception as e:
    print(e)

print("\n--- Checking 'pull_requests' table (Top 5) ---")
try:
    res = supabase.table("pull_requests").select("id, pr_number, author, github_id").limit(5).execute()
    for row in res.data:
        print(row)
except Exception as e:
    print(e)
