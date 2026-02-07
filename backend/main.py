from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from supabase_client import supabase
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ✅ Config: Generic Engineering Intelligence
ALLOWED_TABLES = {
    "github": {
        "description": "GitHub repositories and project metadata",
        "keywords": ["github", "repo", "repository", "project", "code", "stats", "activity", "git"],
        "user_scoped": True
    },
    "commits": {
        "description": "GitHub commits and code changes",
        "keywords": ["commit", "commits", "changes", "code update", "push", "history"],
        "user_scoped": True
    },
    "contributors": {
        "description": "Repository contributors and contribution counts",
        "keywords": ["contributor", "contributors", "team", "collaborators", "who"],
        "user_scoped": True
    },
    "issues": {
        "description": "GitHub issues and bug tracking",
        "keywords": ["issue", "issues", "bug", "bugs", "problem", "ticket"],
        "user_scoped": True
    },
    "pull_requests": {
        "description": "Pull requests and code reviews",
        "keywords": ["pull request", "pr", "merge", "review", "proposal"],
        "user_scoped": True
    },
    "jira_data": {
        "description": "Jira tickets, sprints, and project planning",
        "keywords": ["jira", "ticket", "task", "sprint", "backlog", "progress", "health", "velocity"],
        "user_scoped": True
    }
}

# 🧪 DEV SETTINGS: Demo Fallback (Handles UID mismatches during testing)
DEMO_MODE = True
FALLBACK_UID = "JDfZoVuGJhdLBEvR7rVCQKBG9r02"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    firebase_id: str
    history: List[dict] = []

@app.get("/")
async def root():
    return {"status": "online", "message": "EntelliGen AI Backend is active"}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    msg = req.message.lower()
    uid = req.firebase_id 

    found_context = []
    
    # 1️⃣ Dynamic Data Retrieval (Keyword Routing)
    for table, cfg in ALLOWED_TABLES.items():
        if any(keyword in msg for keyword in cfg["keywords"]):
            try:
                # Primary Query: Get data for CURRENT user
                q = supabase.table(table).select("*").eq("firebase_id", uid)
                res = q.execute()
                data = res.data
                
                # 🧪 DEMO Fallback: If current user is empty, try the demo ID
                if not data and DEMO_MODE:
                    q_fallback = supabase.table(table).select("*").eq("firebase_id", FALLBACK_UID)
                    res_fallback = q_fallback.execute()
                    data = res_fallback.data
                
                if data:
                    found_context.append(f"DATABASE_RECORDS_{table.upper()}: {data}")
            except Exception as e:
                print(f"Database Error ({table}): {e}")

    # 2️⃣ Groq LLM Generation
    try:
        context_str = "\n".join(found_context) if found_context else "No specific database records matching this request were found in the connected tables."
        
        system_prompt = f"""
        You are 'EntelliGen AI', a high-end Engineering Operations Consultant.
        
        STRICT NARRATIVE GUIDELINES:
        - Communicate in a FLUID, ANALYTICAL, and NATURAL manner.
        - DO NOT present data in mechanical "Key: Value" lists or ASCII tables unless explicitly requested.
        - Instead of saying "PR Count: 5", say "Your project currently has five active pull requests awaiting review."
        - Provide narrative insights based on the available data.
        - If data is missing for a specific category, explain it gracefully in a natural sentence.
        - Keep responses professional, encouraging, and under 150 words.
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        # Inject memory safely
        if req.history:
            recent_history = list(req.history[-6:])
            messages.extend(recent_history)
        
        # Current message with context
        messages.append({
            "role": "user", 
            "content": f"DATA CONTEXT:\n{context_str}\n\nUSER QUESTION: {req.message}"
        })

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.35,
            max_tokens=600,
        )

        return {
            "response": completion.choices[0].message.content,
            "context_used": len(found_context) > 0
        }

    except Exception as e:
        print(f"Groq/LLM Error: {e}")
        return {"response": f"### ⚠️ AI Processing Delay\nI encountered a technical hiccup while analyzing the data. Details: {str(e)}", "context_used": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
