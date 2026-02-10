
import os
from supabase import create_client, Client

# Hardcoded for demo/hackathon convenience
SUPABASE_URL = "https://mikrcsxkyggxjeaqyfaw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pa3Jjc3hreWdneGplYXF5ZmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQyNjQ1OCwiZXhwIjoyMDg2MDAyNDU4fQ.pX3hcJJUQwJa0YC88iy8NUhORDZbB44fgTojvbZZO7A"

supabase: Client = None

try:
    print(f"Initializing Supabase client with URL: {SUPABASE_URL}...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized.")
except Exception as e:
    print(f"Error initializing Supabase client: {e}")
    supabase = None
