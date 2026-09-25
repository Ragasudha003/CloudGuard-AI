import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!loggedIn) {
    return (
      <Login
        onLogin={() => setLoggedIn(true)}
      />
    );
  }

  return (
    <div className="app-shell">

      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={() => {
          setLoggedIn(false);
          setPage("dashboard");
        }}
      />

      <div className="main-area">

        <Header />

        {page === "dashboard" && (
          <Dashboard setPage={setPage} />
        )}

        {page === "projects" && (
          <ProjectsPage />
        )}

        {page === "deployments" && (
          <DeploymentsPage setPage={setPage} />
        )}

        {page === "pipeline" && (
          <BuildPage />
        )}

        {page === "security" && (
          <SecurityPage />
        )}

        {page === "monitoring" && (
          <MonitoringPage />
        )}

        {page === "logs" && (
          <LogsPage />
        )}

        {page === "alerts" && (
          <AlertsPage />
        )}

      </div>
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submitLogin(event) {
    event.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password.");
      return;
    }

    onLogin();
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-icon">
          ☁
        </div>

        <h1>CloudGuard AI</h1>

        <p className="login-subtitle">
          Intelligent DevSecOps Platform
        </p>

        <form onSubmit={submitLogin}>

          <div className="field">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

          </div>

          <div className="field">

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

          </div>

          <button
            type="submit"
            className="button primary full"
          >
            Login
          </button>

        </form>

        <p className="login-footer">
          Secure Cloud Deployment & Monitoring
        </p>

      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  page,
  setPage,
  onLogout,
}) {
  const items = [
    ["dashboard", "📊", "Dashboard"],
    ["projects", "📁", "Projects"],
    ["deployments", "🚀", "Deployments"],
    ["pipeline", "⚙️", "CI/CD Pipeline"],
    ["security", "🔐", "Security"],
    ["monitoring", "📈", "Monitoring"],
    ["logs", "📋", "Logs"],
    ["alerts", "🔔", "Alerts"],
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        <span>☁</span>
        <span>CloudGuard</span>
      </div>

      <nav className="sidebar-menu">

        {items.map(([id, icon, label]) => (
          <button
            key={id}
            className={
              page === id
                ? "sidebar-button selected"
                : "sidebar-button"
            }
            onClick={() => setPage(id)}
          >
            <span className="sidebar-icon">
              {icon}
            </span>

            <span>{label}</span>
          </button>
        ))}

        <button
          className="sidebar-button logout"
          onClick={onLogout}
        >
          <span className="sidebar-icon">
            🚪
          </span>

          <span>Logout</span>
        </button>

      </nav>
    </aside>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header() {
  return (
    <header className="header">

      <div>
        <h1>CloudGuard AI</h1>

        <p>
          Intelligent DevSecOps Platform
        </p>
      </div>

      <div className="profile">

        <div className="avatar">
          S
        </div>

        <div>
          <strong>Admin</strong>

          <span>
            DevOps Engineer
          </span>
        </div>

      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ setPage }) {
  const [projectCount, setProjectCount] = useState(0);
  const [securityCount, setSecurityCount] = useState(0);
  const [securityRisk, setSecurityRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const projectsResponse = await fetch(
        `${API_URL}/projects`
      );

      if (projectsResponse.ok) {
        const data =
          await projectsResponse.json();

        setProjectCount(
          data.total_projects || 0
        );
      }

      const securityResponse = await fetch(
        `${API_URL}/security`
      );

      if (securityResponse.ok) {
        const data =
          await securityResponse.json();

        setSecurityCount(
          data.security_issues || 0
        );

        setSecurityRisk(
          data.risk_score
        );
      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  }

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>Dashboard</h2>

          <p>
            Welcome to CloudGuard AI
          </p>

        </div>

        <span className="connection">
          ● Backend Connected
        </span>

      </div>

      <div className="stat-grid">

        <StatCard
          icon="📁"
          title="Total Projects"
          value={
            loading
              ? "..."
              : projectCount
          }
        />

        <StatCard
          icon="🚀"
          title="Deployments"
          value="0"
        />

        <StatCard
          icon="🔐"
          title="Security Issues"
          value={
            loading
              ? "..."
              : securityCount
          }
        />

        <StatCard
          icon="☁️"
          title="Applications"
          value="0"
        />

      </div>

      <div className="two-column">

        <section className="card">

          <div className="card-header">

            <h3>
              Application Status
            </h3>

            <span className="muted">
              No active applications
            </span>

          </div>

          <div className="empty">

            <div className="empty-icon">
              ☁️
            </div>

            <h3>
              No applications deployed
            </h3>

            <p>
              Build and deploy a project to see
              its live status here.
            </p>

            <button
              className="button primary"
              onClick={() =>
                setPage("pipeline")
              }
            >
              ⚙️ Go to Build
            </button>

          </div>

        </section>

        <section className="risk-card">

          <h3>
            Security Risk
          </h3>

          <div className="risk-circle">
            {securityRisk === null
              ? "—"
              : securityRisk}
          </div>

          <h4>
            {securityRisk === null
              ? "NOT SCANNED"
              : `${securityRisk}/100`}
          </h4>

          <p>
            Current security risk from the
            latest scan.
          </p>

        </section>

      </div>

      <div className="two-column">

        <section className="card">

          <div className="card-header">

            <h3>
              System Monitoring
            </h3>

            <span className="muted">
              Waiting
            </span>

          </div>

          <div className="empty small">

            <div className="empty-icon">
              📈
            </div>

            <p>
              No deployed application to monitor.
            </p>

          </div>

        </section>

        <section className="card">

          <div className="card-header">

            <h3>
              Recent Deployments
            </h3>

            <span className="badge">
              0
            </span>

          </div>

          <div className="empty small">

            <div className="empty-icon">
              🚀
            </div>

            <p>
              No deployments yet.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-title">
        {title}
      </div>

      <div className="stat-value">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   PROJECTS
========================================================= */

function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [environment, setEnvironment] =
    useState("Development");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {

      const response = await fetch(
        `${API_URL}/projects`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load projects."
        );
      }

      const data =
        await response.json();

      setProjects(
        data.projects || []
      );

    } catch (error) {

      console.error(error);

      setError(error.message);

    }
  }

  async function createProject(event) {

    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Project name is required."
      );
      return;
    }

    if (!repository.trim()) {
      setError(
        "GitHub repository is required."
      );
      return;
    }

    if (!branch.trim()) {
      setError(
        "Branch is required."
      );
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            repository:
              repository.trim(),
            branch:
              branch.trim(),
            environment,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Project creation failed."
        );
      }

      setSuccess(
        "Project created successfully."
      );

      setName("");
      setRepository("");
      setBranch("main");
      setEnvironment("Development");

      await loadProjects();

    } catch (error) {

      console.error(error);

      setError(error.message);

    } finally {

      setLoading(false);

    }
  }

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>Projects</h2>

          <p>
            Create and manage your applications
          </p>

        </div>

      </div>

      <section className="card">

        <h3>
          Create New Project
        </h3>

        <p className="muted description">
          Add a GitHub repository to CloudGuard.
        </p>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

        {success && (
          <div className="message success">
            {success}
          </div>
        )}

        <form
          className="project-form"
          onSubmit={createProject}
        >

          <div className="field">

            <label>
              Project Name
            </label>

            <input
              type="text"
              placeholder="My Application"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              GitHub Repository
            </label>

            <input
              type="text"
              placeholder="https://github.com/username/repository"
              value={repository}
              onChange={(event) =>
                setRepository(
                  event.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Branch
            </label>

            <input
              type="text"
              placeholder="main"
              value={branch}
              onChange={(event) =>
                setBranch(
                  event.target.value
                )
              }
            />

          </div>

          <div className="field">

            <label>
              Environment
            </label>

            <select
              value={environment}
              onChange={(event) =>
                setEnvironment(
                  event.target.value
                )
              }
            >

              <option value="Development">
                Development
              </option>

              <option value="Testing">
                Testing
              </option>

              <option value="Staging">
                Staging
              </option>

              <option value="Production">
                Production
              </option>

            </select>

          </div>

          <button
            type="submit"
            className="button primary create-button"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "+ Create Project"}
          </button>

        </form>

      </section>

      <section className="card">

        <div className="card-header">

          <h3>
            Your Projects
          </h3>

          <span className="badge">
            {projects.length} Projects
          </span>

        </div>

        {projects.length === 0 ? (

          <div className="empty">

            <div className="empty-icon">
              📁
            </div>

            <h3>
              No projects created
            </h3>

            <p>
              Create your first project above.
            </p>

          </div>

        ) : (

          <div>

            {projects.map((project) => (

              <div
                className="project-row"
                key={project.id}
              >

                <div className="project-box-icon">
                  📦
                </div>

                <div className="project-details">

                  <h3>
                    {project.name}
                  </h3>

                  <p>
                    {project.repository}
                  </p>

                  <span>
                    Branch: {project.branch}
                    {" • "}
                    Environment:
                    {" "}
                    {project.environment}
                  </span>

                </div>

                <div className="project-status">
                  ● {project.status}
                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}

/* =========================================================
   SECURITY PAGE
========================================================= */

function SecurityPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] =
    useState(null);
  const [security, setSecurity] = useState(null);

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {

    try {

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load projects."
        );
      }

      const data =
        await response.json();

      const list =
        data.projects || [];

      setProjects(list);

      if (list.length > 0) {

        const first =
          list[0];

        setSelectedProject(first);

        await loadSecurity(
          first.id
        );
      }

    } catch (error) {

      console.error(error);

      setError(error.message);

    } finally {

      setLoading(false);

    }
  }

  async function loadSecurity(projectId) {

    try {

      const response = await fetch(
        `${API_URL}/projects/${projectId}/security`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load security results."
        );
      }

      const data =
        await response.json();

      setSecurity(data);

    } catch (error) {

      console.error(error);

      setSecurity(null);

      setError(error.message);

    }
  }

  async function handleProjectChange(event) {

    const projectId =
      Number(event.target.value);

    const project =
      projects.find(
        (item) =>
          item.id === projectId
      );

    if (!project) {
      return;
    }

    setSelectedProject(project);

    await loadSecurity(
      project.id
    );
  }

  async function runScan() {

    if (!selectedProject) {
      return;
    }

    try {

      setScanning(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${selectedProject.id}/scan`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Security scan failed."
        );
      }

      await loadSecurity(
        selectedProject.id
      );

      await loadProjects();

    } catch (error) {

      console.error(error);

      setError(error.message);

    } finally {

      setScanning(false);

    }
  }

  if (loading) {

    return (
      <main className="page">

        <div className="empty">

          <div className="empty-icon">
            🔄
          </div>

          <h3>
            Loading security data...
          </h3>

        </div>

      </main>
    );
  }

  if (projects.length === 0) {

    return (
      <main className="page">

        <div className="page-heading">

          <div>

            <h2>
              Security
            </h2>

            <p>
              Analyze application security
            </p>

          </div>

        </div>

        <section className="card">

          <div className="empty">

            <div className="empty-icon">
              🔐
            </div>

            <h3>
              No projects available
            </h3>

            <p>
              Create a project before running
              a security scan.
            </p>

          </div>

        </section>

      </main>
    );
  }

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            Security
          </h2>

          <p>
            Analyze application security
          </p>

        </div>

      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      <section className="card">

        <div className="field">

          <label>
            Select Project
          </label>

          <select
            value={
              selectedProject?.id || ""
            }
            onChange={
              handleProjectChange
            }
          >

            {projects.map(
              (project) => (

                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>

              )
            )}

          </select>

        </div>

      </section>

      {selectedProject && (

        <section className="card">

          <div className="card-header">

            <div>

              <h3>
                {selectedProject.name}
              </h3>

              <p className="muted">
                {selectedProject.repository}
              </p>

            </div>

            <span className="badge">
              {selectedProject.environment}
            </span>

          </div>

          <div className="security-project-info">

            <div>

              <strong>
                Branch
              </strong>

              <span>
                {selectedProject.branch}
              </span>

            </div>

            <div>

              <strong>
                Status
              </strong>

              <span>
                {selectedProject.status}
              </span>

            </div>

          </div>

        </section>
      )}

      <div className="stat-grid">

        <StatCard
          icon="📄"
          title="Files Scanned"
          value={
            security?.scanned
              ? security.scan.files_scanned
              : "—"
          }
        />

        <StatCard
          icon="⚠️"
          title="Findings"
          value={
            security?.scanned
              ? security.scan.findings_count
              : "—"
          }
        />

        <StatCard
          icon="🛡️"
          title="Risk Score"
          value={
            security?.scanned
              ? `${security.scan.risk_score}/100`
              : "—"
          }
        />

        <StatCard
          icon="🔐"
          title="Risk Level"
          value={
            security?.scanned
              ? security.scan.risk_level
              : "NOT SCANNED"
          }
        />

      </div>

      <section className="card">

        {!security?.scanned ? (

          <div className="empty">

            <div className="empty-icon">
              🔍
            </div>

            <h3>
              Security scan not performed
            </h3>

            <p>
              Scan the selected repository
              to analyze potential issues.
            </p>

            <button
              className="button primary"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning
                ? "Scanning..."
                : "🔍 Run Security Scan"}
            </button>

          </div>

        ) : (

          <div>

            <div className="card-header">

              <div>

                <h3>
                  Security Analysis
                </h3>

                <p className="muted">
                  Scan completed successfully
                </p>

              </div>

              <span
                className={
                  security.scan.risk_level ===
                  "LOW"
                    ? "security-low"
                    : "security-warning"
                }
              >
                {security.scan.risk_level}
              </span>

            </div>

            {security.scan.findings_count === 0 ? (

              <div className="security-success">

                <div className="security-success-icon">
                  ✓
                </div>

                <div>

                  <h3>
                    No security findings detected
                  </h3>

                  <p>
                    The current basic scan did not
                    identify potential exposed
                    credentials or secrets.
                  </p>

                </div>

              </div>

            ) : (

              <div className="security-findings">

                <h3>
                  Security Findings
                </h3>

                {security.scan.findings.map(
                  (finding, index) => (

                    <div
                      className="finding"
                      key={index}
                    >

                      <div>

                        <strong>
                          {finding.type}
                        </strong>

                        <p>
                          {finding.message}
                        </p>

                        <small>
                          File: {finding.file}
                        </small>

                      </div>

                      <span className="finding-severity">
                        {finding.severity}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

            <button
              className="button primary"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning
                ? "Scanning..."
                : "🔄 Run Scan Again"}
            </button>

          </div>

        )}

      </section>

    </main>
  );
}

/* =========================================================
   BUILD + CI/CD PAGE
========================================================= */

function BuildPage() {
  const [projects, setProjects] =
    useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [buildResult, setBuildResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {

    try {

      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load projects."
        );
      }

      const data =
        await response.json();

      const list =
        data.projects || [];

      setProjects(list);

      if (list.length > 0) {

        setSelectedProject(
          list[0]
        );

      }

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }

  async function handleProjectChange(event) {

    const projectId =
      Number(event.target.value);

    const project =
      projects.find(
        (item) =>
          item.id === projectId
      );

    if (!project) {
      return;
    }

    setSelectedProject(project);
    setBuildResult(null);
    setError("");
  }

  async function runBuildCheck() {

    if (!selectedProject) {
      return;
    }

    try {

      setChecking(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${selectedProject.id}/build-check`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Build check failed."
        );
      }

      setBuildResult(data);

      // Refresh project status
      await loadProjects();

      setSelectedProject(
        (current) =>
          current
            ? {
                ...current,
                status: data.status,
              }
            : current
      );

    } catch (error) {

      console.error(
        "Build check error:",
        error
      );

      setError(
        error.message
      );

    } finally {

      setChecking(false);

    }
  }

  if (loading) {

    return (
      <main className="page">

        <div className="empty">

          <div className="empty-icon">
            🔄
          </div>

          <h3>
            Loading build system...
          </h3>

        </div>

      </main>
    );
  }

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            CI/CD Pipeline
          </h2>

          <p>
            Build and prepare your application
            for deployment
          </p>

        </div>

      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {projects.length === 0 ? (

        <section className="card">

          <div className="empty">

            <div className="empty-icon">
              🏗️
            </div>

            <h3>
              No projects available
            </h3>

            <p>
              Create a project before checking
              build readiness.
            </p>

          </div>

        </section>

      ) : (

        <>
          {/* PROJECT */}

          <section className="card">

            <div className="field">

              <label>
                Select Project
              </label>

              <select
                value={
                  selectedProject?.id || ""
                }
                onChange={
                  handleProjectChange
                }
              >

                {projects.map(
                  (project) => (

                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>

                  )
                )}

              </select>

            </div>

            {selectedProject && (

              <div className="build-project">

                <div>

                  <h3>
                    {selectedProject.name}
                  </h3>

                  <p>
                    {selectedProject.repository}
                  </p>

                </div>

                <span className="badge">
                  {selectedProject.status}
                </span>

              </div>

            )}

          </section>

          {/* PIPELINE */}

          <section className="card">

            <h3 className="pipeline-title">
              Development Pipeline
            </h3>

            <div className="pipeline">

              <PipelineStage
                number="1"
                title="Source"
                description="GitHub Repository"
                status="READY"
              />

              <PipelineStage
                number="2"
                title="Security"
                description="Security Analysis"
                status={
                  selectedProject?.status ===
                  "Security Scanned"
                    ? "COMPLETED"
                    : "PENDING"
                }
              />

              <PipelineStage
                number="3"
                title="Build"
                description="Build Readiness"
                status={
                  buildResult?.build_ready ||
                  selectedProject?.status ===
                    "Build Ready"
                    ? "READY"
                    : "PENDING"
                }
              />

              <PipelineStage
                number="4"
                title="Docker"
                description="Container Build"
                status={
                  buildResult?.docker_available
                    ? "AVAILABLE"
                    : "PENDING"
                }
              />

              <PipelineStage
                number="5"
                title="Deploy"
                description="Cloud Deployment"
                status="PENDING"
              />

              <PipelineStage
                number="6"
                title="Monitor"
                description="Application Monitoring"
                status="PENDING"
              />

            </div>

          </section>

          {/* BUILD CHECK */}

          <section className="card">

            <div className="card-header">

              <div>

                <h3>
                  Build Readiness
                </h3>

                <p className="muted">
                  Check whether the repository
                  can be prepared for building.
                </p>

              </div>

              <button
                className="button primary"
                onClick={runBuildCheck}
                disabled={checking}
              >
                {checking
                  ? "Checking..."
                  : "🏗️ Check Build"}
              </button>

            </div>

            {!buildResult ? (

              <div className="empty small">

                <div className="empty-icon">
                  🏗️
                </div>

                <h3>
                  Build check not run in this session
                </h3>

                <p>
                  Click "Check Build" to analyze
                  the current GitHub repository.
                </p>

              </div>

            ) : (

              <div>

                <div className="build-summary">

                  <div className="build-status-box">

                    <span>
                      Build Status
                    </span>

                    <strong
                      className={
                        buildResult.build_ready
                          ? "status-success"
                          : "status-failed"
                      }
                    >
                      {buildResult.build_ready
                        ? "✓ Build Ready"
                        : "✕ Not Ready"}
                    </strong>

                  </div>

                  <div className="build-status-box">

                    <span>
                      Total Files
                    </span>

                    <strong>
                      {buildResult.total_files}
                    </strong>

                  </div>

                  <div className="build-status-box">

                    <span>
                      Frontend
                    </span>

                    <strong>
                      {buildResult.frontend_detected
                        ? "✓ Detected"
                        : "Not detected"}
                    </strong>

                  </div>

                  <div className="build-status-box">

                    <span>
                      Backend
                    </span>

                    <strong>
                      {buildResult.backend_detected
                        ? "✓ Detected"
                        : "Not detected"}
                    </strong>

                  </div>

                  <div className="build-status-box">

                    <span>
                      Docker
                    </span>

                    <strong>
                      {buildResult.docker_available
                        ? "✓ Available"
                        : "Not configured"}
                    </strong>

                  </div>

                </div>

                <div className="build-section">

                  <h3>
                    Detected Technologies
                  </h3>

                  <div className="technology-list">

                    {buildResult.project_types.map(
                      (technology) => (

                        <span
                          className="technology-tag"
                          key={technology}
                        >
                          {technology}
                        </span>

                      )
                    )}

                  </div>

                </div>

                <div className="build-section">

                  <h3>
                    Detected Files
                  </h3>

                  <div className="detected-files">

                    {buildResult.detected_files.map(
                      (file) => (

                        <div
                          key={file}
                          className="file-item"
                        >
                          📄 {file}
                        </div>

                      )
                    )}

                  </div>

                </div>

                <div className="next-stage">

                  <div>

                    <strong>
                      Next Stage
                    </strong>

                    <p>
                      Docker containerization is the
                      next step before deployment.
                    </p>

                  </div>

                  <span
                    className={
                      buildResult.docker_available
                        ? "status-success"
                        : "status-pending"
                    }
                  >
                    {buildResult.docker_available
                      ? "Docker Available"
                      : "Docker Not Configured"}
                  </span>

                </div>

              </div>

            )}

          </section>

        </>
      )}

    </main>
  );
}

/* =========================================================
   PIPELINE STAGE
========================================================= */

function PipelineStage({
  number,
  title,
  description,
  status,
}) {
  let className =
    "pipeline-stage";

  if (status === "COMPLETED") {
    className += " completed";
  }

  if (status === "READY") {
    className += " ready";
  }

  return (
    <div className={className}>

      <div className="pipeline-number">
        {number}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <span className="pipeline-status">
        {status}
      </span>

    </div>
  );
}

/* =========================================================
   DEPLOYMENTS
========================================================= */

function DeploymentsPage({ setPage }) {

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            Deployments
          </h2>

          <p>
            Deploy your created projects
          </p>

        </div>

      </div>

      <section className="card">

        <div className="card-header">

          <div>

            <h3>
              New Deployment
            </h3>

            <p className="muted">
              Docker and CI/CD must be completed
              before deployment.
            </p>

          </div>

          <button
            className="button primary"
            onClick={() =>
              setPage("pipeline")
            }
          >
            ⚙️ Go to Pipeline
          </button>

        </div>

        <div className="empty">

          <div className="empty-icon">
            🚀
          </div>

          <h3>
            Deployment not available yet
          </h3>

          <p>
            Complete Build and Docker stages
            before deploying.
          </p>

        </div>

      </section>

      <section className="card">

        <div className="card-header">

          <h3>
            Deployment History
          </h3>

          <span className="badge">
            0 Deployments
          </span>

        </div>

        <div className="empty small">

          <div className="empty-icon">
            📋
          </div>

          <p>
            No deployment history yet.
          </p>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   MONITORING
========================================================= */

function MonitoringPage() {

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            Monitoring
          </h2>

          <p>
            Monitor deployed applications
          </p>

        </div>

      </div>

      <div className="stat-grid">

        <StatCard
          icon="💻"
          title="CPU"
          value="—"
        />

        <StatCard
          icon="🧠"
          title="Memory"
          value="—"
        />

        <StatCard
          icon="💾"
          title="Storage"
          value="—"
        />

        <StatCard
          icon="❤️"
          title="Health"
          value="—"
        />

      </div>

      <section className="card">

        <div className="empty">

          <div className="empty-icon">
            📈
          </div>

          <h3>
            No application to monitor
          </h3>

          <p>
            Monitoring will begin after a
            successful deployment.
          </p>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   LOGS
========================================================= */

function LogsPage() {

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            Logs
          </h2>

          <p>
            Application and deployment activity
          </p>

        </div>

      </div>

      <section className="card">

        <div className="empty">

          <div className="empty-icon">
            📋
          </div>

          <h3>
            No logs available
          </h3>

          <p>
            Logs will appear after builds and
            deployments are implemented.
          </p>

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   ALERTS
========================================================= */

function AlertsPage() {

  return (
    <main className="page">

      <div className="page-heading">

        <div>

          <h2>
            Alerts
          </h2>

          <p>
            Security, deployment and system alerts
          </p>

        </div>

      </div>

      <section className="card">

        <div className="empty">

          <div className="empty-icon">
            🔔
          </div>

          <h3>
            No alerts
          </h3>

          <p>
            Alerts will appear when CloudGuard
            detects an issue.
          </p>

        </div>

      </section>

    </main>
  );
}

export default App;