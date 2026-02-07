# Tribal Knowledge Risk Index & Auto-Correct Planning Engine

A FastAPI service to analyze knowledge concentration (bus factor) and auto-correct sprint plans based on reality gaps.

## Setup

1.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Ensure Data is present**:
    Place JSON files in `data/`.
    -   GitHub Dummy Data: `prs.json`, `reviews.json`, `commits.json`, `modules.json`
    -   Jira Dummy Data: `jira_sprints.json`, `jira_issues.json`, `jira_issue_events.json`

## Running the Service

Start the server:
```bash
python app/main.py
```
Or:
```bash
uvicorn app.main:app --reload
```
API: `http://127.0.0.1:8000`

## API Endpoints

### 1. Source System Loading (Run First)
-   `POST /load_data`: Load GitHub data.
-   `POST /planning/load_jira_dummy`: Load Jira data.

### 2. Computation
-   `POST /compute`: Compute Tribal Knowledge Risks.
-   `POST /planning/compute_autocorrect`: Compute Reality Gaps & Plan Corrections.

### 3. Features

**Tribal Knowledge**:
-   `GET /modules`: List modules by risk.
-   `GET /modules/{id}`: Detailed knowledge metrics.

**Auto-Correct Planning**:
-   `GET /planning/sprints`: List sprints with reality gaps and predictions.
-   `GET /planning/sprints/{id}`: Detailed sprint metrics.
-   `GET /planning/autocorrect/rules`: Learned historical correction rules.

## Example Flow

```bash
# 1. Load All Data
curl -X POST http://127.0.0.1:8000/load_data
curl -X POST http://127.0.0.1:8000/planning/load_jira_dummy

# 2. Compute Insights
curl -X POST http://127.0.0.1:8000/compute
curl -X POST http://127.0.0.1:8000/planning/compute_autocorrect

# 3. Check "Auto-Correct" Insights
# See the reality gap for the current sprint
curl http://127.0.0.1:8000/planning/sprints
```
