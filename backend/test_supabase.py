
import os
from supabase import create_client

SUPABASE_URL = "https://mikrcsxkyggxjeaqyfaw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pa3Jjc3hreWdneGplYXF5ZmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjQ1OCwiZXhwIjoyMDg2MDAyNDU4fQ.pX3hcJJUQwJa0YC88iy8NUhORDZbB44fgTojvbZZO7A"

print(f"1. Connecting to {SUPABASE_URL}...")
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("   Connection object created.")
except Exception as e:
    print(f"   Connection FAILED: {e}")
    exit(1)

print("\n2. Testing Fetch (Pull Requests)...")
try:
    # Fetch just ONE row to test connectivity
    res = supabase.table("pull_requests").select("count", count="exact").limit(1).execute()
    print("   Success! Result:", res)
    if res.data:
        print(f"   Found data: {res.data[0]}")
    else:
        print("   Connection successful but returned NO data.")
except Exception as e:
    print(f"   Fetch FAILED: {e}")

print("\n3. Testing Fetch (Commits)...")
try:
    # Fetch just ONE row
    res = supabase.table("commits").select("count", count="exact").limit(1).execute()
    print("   Success! Result:", res)
except Exception as e:
    print(f"   Fetch FAILED: {e}")
