from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from datetime import datetime

# =========================================================
# CLOUDGUARD AI BACKEND
# =========================================================

app = FastAPI(
    title="CloudGuard AI API",
    version="2.0.0",
    description="CloudGuard AI DevSecOps Platform Backend"
)

# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# DATABASE
# =========================================================

DATABASE = "cloudguard.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            repository TEXT NOT NULL,
            branch TEXT NOT NULL,
            environment TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


initialize_database()


# =========================================================
# REQUEST MODEL
# =========================================================

class ProjectCreate(BaseModel):
    name: str
    repository: str
    branch: str = "main"
    environment: str = "Development"


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to CloudGuard AI API"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "CloudGuard AI Backend"
    }


# =========================================================
# GET PROJECTS
# =========================================================

@app.get("/projects")
def get_projects():

    connection = get_connection()

    rows = connection.execute("""
        SELECT
            id,
            name,
            repository,
            branch,
            environment,
            status,
            created_at
        FROM projects
        ORDER BY id DESC
    """).fetchall()

    connection.close()

    projects = [dict(row) for row in rows]

    return {
        "total_projects": len(projects),
        "projects": projects
    }


# =========================================================
# CREATE PROJECT
# =========================================================

@app.post("/projects")
def create_project(project: ProjectCreate):

    if not project.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Project name is required"
        )

    if not project.repository.strip():
        raise HTTPException(
            status_code=400,
            detail="Repository URL is required"
        )

    connection = get_connection()

    # Check duplicate repository
    existing = connection.execute(
        """
        SELECT id
        FROM projects
        WHERE repository = ?
        """,
        (project.repository.strip(),)
    ).fetchone()

    if existing:
        connection.close()

        raise HTTPException(
            status_code=409,
            detail="This repository is already added"
        )

    created_at = datetime.now().isoformat()

    cursor = connection.execute(
        """
        INSERT INTO projects
        (
            name,
            repository,
            branch,
            environment,
            status,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            project.name.strip(),
            project.repository.strip(),
            project.branch.strip(),
            project.environment.strip(),
            "Created",
            created_at
        )
    )

    connection.commit()

    project_id = cursor.lastrowid

    row = connection.execute(
        """
        SELECT
            id,
            name,
            repository,
            branch,
            environment,
            status,
            created_at
        FROM projects
        WHERE id = ?
        """,
        (project_id,)
    ).fetchone()

    connection.close()

    return {
        "message": "Project created successfully",
        "project": dict(row)
    }


# =========================================================
# GET SINGLE PROJECT
# =========================================================

@app.get("/projects/{project_id}")
def get_project(project_id: int):

    connection = get_connection()

    row = connection.execute(
        """
        SELECT
            id,
            name,
            repository,
            branch,
            environment,
            status,
            created_at
        FROM projects
        WHERE id = ?
        """,
        (project_id,)
    ).fetchone()

    connection.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return {
        "project": dict(row)
    }


# =========================================================
# DEPLOYMENT SUMMARY
# =========================================================
# Currently zero because we have not deployed anything yet.
# We will replace this with real deployment data in Phase 3.

@app.get("/deployments")
def get_deployments():

    return {
        "total_deployments": 0,
        "successful": 0,
        "failed": 0
    }


# =========================================================
# SECURITY SUMMARY
# =========================================================
# No scans have been performed yet.

@app.get("/security")
def get_security():

    return {
        "security_issues": 0,
        "risk_score": None,
        "risk_level": "NOT_SCANNED"
    }


# =========================================================
# MONITORING
# =========================================================
# No deployed application exists yet.

@app.get("/monitoring")
def get_monitoring():

    return {
        "cpu_usage": None,
        "memory_usage": None,
        "storage_usage": None,
        "status": "NO_DEPLOYMENT"
    }


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    print("----------------------------------------")
    print(" CloudGuard AI Backend")
    print("----------------------------------------")
    print("API:  http://127.0.0.1:8000")
    print("Docs: http://127.0.0.1:8000/docs")
    print("DB:   cloudguard.db")
    print("----------------------------------------")