import sys
import os
from pathlib import Path

# Add the project root (backend directory) to sys.path so 'app' module can be found
#featherless_api_key = rc_3a397e668b06eae8d8e477e2f5434b97dc9f3ffd8bf0856563a6d1cd9941fcac
# when running this script directly.
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from fastapi import FastAPI
import uvicorn
from backend_app.api.routes import router as risk_router
from backend_app.api.planning_routes import router as planning_router
from backend_app.api.strategic_routes import router as strategic_router
from backend_app.api.risk_analysis import router as risk_analysis_router

app = FastAPI(title="Tribal Knowledge Risk Index", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def startup_event():
    print("Application startup complete. Routes registered.")
    for route in app.routes:
        if hasattr(route, "path"):
           print(f"Route: {route.methods} {route.path}")
    print("\n[READY] Server is listening at port 8001. Please send a POST request to http://127.0.0.1:8001/analyze/risk now.")

app.include_router(risk_router)
app.include_router(planning_router)
app.include_router(strategic_router)
app.include_router(risk_analysis_router)

@app.get("/")
def root():
    return {"message": "Service is running. Use /load_data or /analyze/risk."}

if __name__ == "__main__":
    # When running directly, use uvicorn to serve the app
    # reload=True allows auto-restart on code changes (dev mode)
    uvicorn.run("backend_app.main:app", host="127.0.0.1", port=8001, reload=True)
