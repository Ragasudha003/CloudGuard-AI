from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sqlite3
import subprocess
import tempfile
import os
import re
import json
from pathlib import Path
from datetime import datetime


# =========================================================
# CLOUDGUARD AI
# =========================================================

app = FastAPI(
    title="CloudGuard AI API",
    version="5.0.0",
    description="Cloud-Based Intelligent DevSecOps Platform",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

    # -----------------------------------------------------
    # PROJECTS
    # -----------------------------------------------------
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            repository TEXT NOT NULL,
            branch TEXT NOT NULL,
            environment TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    # -----------------------------------------------------
    # SECURITY SCANS
    # -----------------------------------------------------
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS security_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            risk_score INTEGER,
            risk_level TEXT,
            files_scanned INTEGER,
            findings_count INTEGER,
            findings TEXT,
            scanned_at TEXT NOT NULL,
            FOREIGN KEY(project_id)
                REFERENCES projects(id)
        )
        """
    )

    connection.commit()
    connection.close()


initialize_database()


# =========================================================
# REQUEST MODELS
# =========================================================

class ProjectCreate(BaseModel):
    name: str
    repository: str
    branch: str = "main"
    environment: str = "Development"


# =========================================================
# CONSTANTS
# =========================================================

IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build",
    ".idea",
    ".vscode",
    ".pytest_cache",
    ".next",
    "coverage",
    ".gradle",
    "target",
    "__pypackages__",
}


TEXT_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".kt",
    ".dart",
    ".php",
    ".html",
    ".css",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".properties",
    ".env",
    ".txt",
    ".md",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
    ".toml",
    ".ini",
    ".cfg",
}


DEPENDENCY_FILES = {
    "package.json",
    "package-lock.json",
    "requirements.txt",
    "pyproject.toml",
    "poetry.lock",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
}


DOCKER_FILES = {
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
}


SENSITIVE_FILENAMES = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    "credentials.json",
    "secrets.json",
    "secret.json",
}


# =========================================================
# SECURITY PATTERNS
# =========================================================

SECRET_PATTERNS = [
    (
        "AWS Access Key",
        "HIGH",
        re.compile(
            r"\bAKIA[0-9A-Z]{16}\b"
        ),
    ),
    (
        "Private Key",
        "HIGH",
        re.compile(
            r"-----BEGIN "
            r"(RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----"
        ),
    ),
    (
        "GitHub Token",
        "HIGH",
        re.compile(
            r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"
        ),
    ),
    (
        "Generic API Key",
        "HIGH",
        re.compile(
            r"(?i)"
            r"\b(api[_-]?key)"
            r"\s*[:=]"
            r"\s*[\"'][^\"'\n]+[\"']"
        ),
    ),
    (
        "Password",
        "HIGH",
        re.compile(
            r"(?i)"
            r"\b(password)"
            r"\s*[:=]"
            r"\s*[\"'][^\"'\n]+[\"']"
        ),
    ),
    (
        "Secret",
        "HIGH",
        re.compile(
            r"(?i)"
            r"\b(secret)"
            r"\s*[:=]"
            r"\s*[\"'][^\"'\n]+[\"']"
        ),
    ),
    (
        "Bearer Token",
        "HIGH",
        re.compile(
            r"(?i)"
            r"\bbearer\s+[A-Za-z0-9._~+/=-]{20,}"
        ),
    ),
]


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to CloudGuard AI API",
        "version": "5.0.0",
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "CloudGuard AI Backend",
    }


# =========================================================
# NORMALIZE GITHUB URL
# =========================================================

def normalize_repository_url(repository: str) -> str:

    value = repository.strip()

    if not value:
        return value

    if value.startswith("github.com/"):
        value = "https://" + value

    value = value.rstrip("/")

    if value.endswith(".git"):
        value = value[:-4]

    return value


# =========================================================
# GET ALL PROJECTS
# =========================================================

@app.get("/projects")
def get_projects():

    connection = get_connection()

    rows = connection.execute(
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
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    projects = [
        dict(row)
        for row in rows
    ]

    return {
        "total_projects": len(projects),
        "projects": projects,
    }


# =========================================================
# CREATE PROJECT
# =========================================================

@app.post("/projects")
def create_project(project: ProjectCreate):

    name = project.name.strip()
    repository = normalize_repository_url(
        project.repository
    )
    branch = project.branch.strip()
    environment = project.environment.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Project name is required.",
        )

    if not repository:
        raise HTTPException(
            status_code=400,
            detail="Repository URL is required.",
        )

    if not branch:
        raise HTTPException(
            status_code=400,
            detail="Branch is required.",
        )

    if not repository.startswith(
        "https://github.com/"
    ):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid GitHub repository URL.",
        )

    connection = get_connection()

    existing = connection.execute(
        """
        SELECT id
        FROM projects
        WHERE LOWER(repository) = LOWER(?)
        """,
        (repository,),
    ).fetchone()

    if existing:
        connection.close()

        raise HTTPException(
            status_code=409,
            detail="This repository is already added.",
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
            name,
            repository,
            branch,
            environment,
            "Created",
            created_at,
        ),
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
        (project_id,),
    ).fetchone()

    connection.close()

    return {
        "message": "Project created successfully.",
        "project": dict(row),
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
        (project_id,),
    ).fetchone()

    connection.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    return {
        "project": dict(row)
    }


# =========================================================
# CLONE REPOSITORY
# =========================================================

def clone_repository(
    repository_url: str,
    branch: str,
    target_path: str,
):
    command = [
        "git",
        "clone",
        "--depth",
        "1",
        "--branch",
        branch,
        repository_url,
        target_path,
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120,
        )

    except subprocess.TimeoutExpired:
        raise RuntimeError(
            "Repository clone timed out."
        )

    except FileNotFoundError:
        raise RuntimeError(
            "Git was not found on this computer."
        )

    if result.returncode != 0:
        error_message = (
            result.stderr.strip()
            or result.stdout.strip()
            or "Repository clone failed."
        )

        raise RuntimeError(error_message)


# =========================================================
# SECURITY SCANNER
# =========================================================

def scan_repository(
    repository_url: str,
    branch: str,
):

    findings = []
    files_scanned = 0

    with tempfile.TemporaryDirectory() as temp_dir:

        repository_path = os.path.join(
            temp_dir,
            "repository",
        )

        clone_repository(
            repository_url,
            branch,
            repository_path,
        )

        for root, directories, files in os.walk(
            repository_path
        ):

            directories[:] = [
                directory
                for directory in directories
                if directory not in IGNORED_DIRECTORIES
            ]

            for filename in files:

                file_path = Path(root) / filename

                try:
                    relative_path = (
                        file_path.relative_to(
                            repository_path
                        )
                    )
                except ValueError:
                    continue

                relative_path_string = str(
                    relative_path
                )

                # Sensitive filenames
                if filename.lower() in {
                    item.lower()
                    for item in SENSITIVE_FILENAMES
                }:
                    findings.append(
                        {
                            "type": "Sensitive File",
                            "severity": "HIGH",
                            "file": relative_path_string,
                            "message": (
                                "Sensitive configuration "
                                "file detected."
                            ),
                        }
                    )

                extension = (
                    file_path.suffix.lower()
                )

                if extension not in TEXT_EXTENSIONS:
                    continue

                try:
                    file_size = file_path.stat().st_size

                    if file_size > 1_000_000:
                        continue

                    content = file_path.read_text(
                        encoding="utf-8",
                        errors="ignore",
                    )

                    files_scanned += 1

                except Exception:
                    continue

                for (
                    finding_type,
                    severity,
                    pattern,
                ) in SECRET_PATTERNS:

                    if pattern.search(content):

                        findings.append(
                            {
                                "type": finding_type,
                                "severity": severity,
                                "file": relative_path_string,
                                "message": (
                                    "Potential credential "
                                    "or secret detected."
                                ),
                            }
                        )

    # Remove duplicate findings
    unique_findings = []
    seen = set()

    for finding in findings:

        key = (
            finding["type"],
            finding["severity"],
            finding["file"],
        )

        if key not in seen:
            seen.add(key)
            unique_findings.append(finding)

    findings = unique_findings

    high_count = sum(
        1
        for item in findings
        if item["severity"] == "HIGH"
    )

    medium_count = sum(
        1
        for item in findings
        if item["severity"] == "MEDIUM"
    )

    low_count = sum(
        1
        for item in findings
        if item["severity"] == "LOW"
    )

    risk_score = (
        high_count * 25
        + medium_count * 10
        + low_count * 2
    )

    risk_score = min(
        risk_score,
        100,
    )

    if risk_score == 0:
        risk_level = "LOW"
    elif risk_score < 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "files_scanned": files_scanned,
        "findings_count": len(findings),
        "findings": findings,
        "risk_score": risk_score,
        "risk_level": risk_level,
    }


# =========================================================
# RUN SECURITY SCAN
# =========================================================

@app.post("/projects/{project_id}/scan")
def run_security_scan(project_id: int):

    connection = get_connection()

    project = connection.execute(
        """
        SELECT
            id,
            name,
            repository,
            branch,
            environment
        FROM projects
        WHERE id = ?
        """,
        (project_id,),
    ).fetchone()

    if project is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    connection.execute(
        """
        UPDATE projects
        SET status = ?
        WHERE id = ?
        """,
        (
            "Security Scanning",
            project_id,
        ),
    )

    connection.commit()

    try:

        result = scan_repository(
            project["repository"],
            project["branch"],
        )

        scanned_at = datetime.now().isoformat()

        connection.execute(
            """
            DELETE FROM security_scans
            WHERE project_id = ?
            """,
            (project_id,),
        )

        connection.execute(
            """
            INSERT INTO security_scans
            (
                project_id,
                status,
                risk_score,
                risk_level,
                files_scanned,
                findings_count,
                findings,
                scanned_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                "Completed",
                result["risk_score"],
                result["risk_level"],
                result["files_scanned"],
                result["findings_count"],
                json.dumps(
                    result["findings"]
                ),
                scanned_at,
            ),
        )

        connection.execute(
            """
            UPDATE projects
            SET status = ?
            WHERE id = ?
            """,
            (
                "Security Scanned",
                project_id,
            ),
        )

        connection.commit()

        return {
            "message": "Security scan completed.",
            "project_id": project_id,
            "project_name": project["name"],
            "repository": project["repository"],
            "branch": project["branch"],
            "status": "Completed",
            **result,
            "scanned_at": scanned_at,
        }

    except Exception as error:

        connection.execute(
            """
            UPDATE projects
            SET status = ?
            WHERE id = ?
            """,
            (
                "Security Scan Failed",
                project_id,
            ),
        )

        connection.commit()

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    finally:
        connection.close()


# =========================================================
# GET PROJECT SECURITY
# =========================================================

@app.get("/projects/{project_id}/security")
def get_project_security(project_id: int):

    connection = get_connection()

    project = connection.execute(
        """
        SELECT
            id,
            name,
            repository,
            branch,
            environment,
            status
        FROM projects
        WHERE id = ?
        """,
        (project_id,),
    ).fetchone()

    if project is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    scan = connection.execute(
        """
        SELECT
            id,
            status,
            risk_score,
            risk_level,
            files_scanned,
            findings_count,
            findings,
            scanned_at
        FROM security_scans
        WHERE project_id = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        (project_id,),
    ).fetchone()

    connection.close()

    if scan is None:

        return {
            "project": dict(project),
            "scanned": False,
            "message": (
                "Security scan has not been performed."
            ),
        }

    try:
        findings = json.loads(
            scan["findings"]
        )
    except Exception:
        findings = []

    return {
        "project": dict(project),
        "scanned": True,
        "scan": {
            "id": scan["id"],
            "status": scan["status"],
            "risk_score": scan["risk_score"],
            "risk_level": scan["risk_level"],
            "files_scanned": scan["files_scanned"],
            "findings_count": scan["findings_count"],
            "findings": findings,
            "scanned_at": scan["scanned_at"],
        },
    }


# =========================================================
# SECURITY SUMMARY
# =========================================================

@app.get("/security")
def security_summary():

    connection = get_connection()

    result = connection.execute(
        """
        SELECT
            COUNT(*) AS total_scans,
            COALESCE(
                SUM(findings_count),
                0
            ) AS total_findings,
            MAX(risk_score) AS highest_risk
        FROM security_scans
        """
    ).fetchone()

    connection.close()

    total_scans = (
        result["total_scans"] or 0
    )

    total_findings = (
        result["total_findings"] or 0
    )

    highest_risk = result["highest_risk"]

    if highest_risk is None:
        risk_level = "NOT_SCANNED"
    elif highest_risk == 0:
        risk_level = "LOW"
    elif highest_risk < 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "total_scans": total_scans,
        "security_issues": total_findings,
        "risk_score": highest_risk,
        "risk_level": risk_level,
    }


# =========================================================
# BUILD READINESS CHECK
# =========================================================

@app.post("/projects/{project_id}/build-check")
def build_check(project_id: int):

    connection = get_connection()

    project = connection.execute(
        """
        SELECT
            id,
            name,
            repository,
            branch,
            environment,
            status
        FROM projects
        WHERE id = ?
        """,
        (project_id,),
    ).fetchone()

    if project is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    try:

        with tempfile.TemporaryDirectory() as temp_dir:

            repository_path = os.path.join(
                temp_dir,
                "repository",
            )

            # -------------------------------------------------
            # CLONE FULL REPOSITORY
            # -------------------------------------------------

            clone_repository(
                project["repository"],
                project["branch"],
                repository_path,
            )

            # -------------------------------------------------
            # DETECT PROJECT TYPES
            # -------------------------------------------------

            project_types = set()

            detected_files = []

            docker_files = []

            important_files = {
                "package.json",
                "package-lock.json",
                "requirements.txt",
                "pyproject.toml",
                "poetry.lock",
                "pom.xml",
                "build.gradle",
                "build.gradle.kts",
                "Dockerfile",
                "docker-compose.yml",
                "docker-compose.yaml",
                "README.md",
                ".gitignore",
            }

            total_files = 0

            frontend_detected = False
            backend_detected = False

            # -------------------------------------------------
            # WALK THROUGH ENTIRE REPOSITORY
            # -------------------------------------------------

            for root, directories, files in os.walk(
                repository_path
            ):

                directories[:] = [
                    directory
                    for directory in directories
                    if directory not in IGNORED_DIRECTORIES
                ]

                for filename in files:

                    total_files += 1

                    file_path = (
                        Path(root) / filename
                    )

                    try:
                        relative_path = (
                            file_path.relative_to(
                                repository_path
                            )
                        )
                    except ValueError:
                        continue

                    relative_string = str(
                        relative_path
                    )

                    # -----------------------------------------
                    # IMPORTANT FILE
                    # -----------------------------------------

                    if filename in important_files:

                        detected_files.append(
                            relative_string
                        )

                    # -----------------------------------------
                    # DOCKER FILE
                    # -----------------------------------------

                    if filename in DOCKER_FILES:

                        docker_files.append(
                            relative_string
                        )

                    # -----------------------------------------
                    # CHECK FRONTEND / BACKEND DIRECTORIES
                    # -----------------------------------------

                    path_parts = set(
                        relative_path.parts
                    )

                    if "frontend" in path_parts:

                        frontend_detected = True

                    if "backend" in path_parts:

                        backend_detected = True

                    # -----------------------------------------
                    # NODE.JS / REACT
                    # -----------------------------------------

                    if filename == "package.json":

                        project_types.add(
                            "Node.js"
                        )

                        try:

                            package_content = (
                                file_path.read_text(
                                    encoding="utf-8",
                                    errors="ignore",
                                )
                            )

                            package_data = json.loads(
                                package_content
                            )

                            dependencies = {}

                            dependencies.update(
                                package_data.get(
                                    "dependencies",
                                    {}
                                )
                            )

                            dependencies.update(
                                package_data.get(
                                    "devDependencies",
                                    {}
                                )
                            )

                            if "react" in dependencies:

                                project_types.add(
                                    "React"
                                )

                            if "vite" in dependencies:

                                project_types.add(
                                    "Vite"
                                )

                        except Exception:
                            pass

                    # -----------------------------------------
                    # PYTHON
                    # -----------------------------------------

                    if filename in {
                        "requirements.txt",
                        "pyproject.toml",
                        "poetry.lock",
                    }:

                        project_types.add(
                            "Python"
                        )

                    if file_path.suffix.lower() == ".py":

                        project_types.add(
                            "Python"
                        )

                    # -----------------------------------------
                    # JAVASCRIPT / TYPESCRIPT
                    # -----------------------------------------

                    if file_path.suffix.lower() in {
                        ".js",
                        ".jsx",
                        ".ts",
                        ".tsx",
                    }:

                        project_types.add(
                            "JavaScript"
                        )

            # -------------------------------------------------
            # ADD ARCHITECTURE TYPES
            # -------------------------------------------------

            if frontend_detected:

                project_types.add(
                    "Frontend Application"
                )

            if backend_detected:

                project_types.add(
                    "Backend Application"
                )

            # -------------------------------------------------
            # DOCKER
            # -------------------------------------------------

            docker_available = (
                len(docker_files) > 0
            )

            # -------------------------------------------------
            # BUILD READINESS
            # -------------------------------------------------

            build_ready = (
                len(project_types) > 0
                and total_files > 0
            )

            if build_ready:

                new_status = "Build Ready"

            else:

                new_status = "Build Not Ready"

            # -------------------------------------------------
            # UPDATE DATABASE
            # -------------------------------------------------

            connection.execute(
                """
                UPDATE projects
                SET status = ?
                WHERE id = ?
                """,
                (
                    new_status,
                    project_id,
                ),
            )

            connection.commit()

            return {
                "message":
                    "Build readiness check completed.",

                "project_id":
                    project["id"],

                "project_name":
                    project["name"],

                "repository":
                    project["repository"],

                "branch":
                    project["branch"],

                "environment":
                    project["environment"],

                "project_types":
                    sorted(project_types),

                "build_ready":
                    build_ready,

                "docker_available":
                    docker_available,

                "docker_files":
                    sorted(docker_files),

                "detected_files":
                    sorted(detected_files),

                "total_files":
                    total_files,

                "frontend_detected":
                    frontend_detected,

                "backend_detected":
                    backend_detected,

                "status":
                    new_status,
            }

    except Exception as error:

        connection.execute(
            """
            UPDATE projects
            SET status = ?
            WHERE id = ?
            """,
            (
                "Build Check Failed",
                project_id,
            ),
        )

        connection.commit()

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    finally:
        connection.close()


# =========================================================
# DEPLOYMENTS
# =========================================================
# Real deployment will be added after Build + Docker.

@app.get("/deployments")
def get_deployments():

    return {
        "total_deployments": 0,
        "successful": 0,
        "failed": 0,
    }


# =========================================================
# MONITORING
# =========================================================

@app.get("/monitoring")
def get_monitoring():

    return {
        "cpu_usage": None,
        "memory_usage": None,
        "storage_usage": None,
        "health": None,
        "status": "NO_DEPLOYMENT",
    }


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    print("")
    print("============================================")
    print("         CloudGuard AI Backend")
    print("============================================")
    print("API  : http://127.0.0.1:8000")
    print("Docs : http://127.0.0.1:8000/docs")
    print("DB   : cloudguard.db")
    print("============================================")
    print("")