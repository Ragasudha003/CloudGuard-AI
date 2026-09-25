import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   APP
========================================================= */

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
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

        {page === "projects" && <ProjectsPage />}

        {page === "deployments" && (
          <DeploymentsPage setPage={setPage} />
        )}

        {page === "pipeline" && <PipelinePage />}

        {page === "security" && <SecurityPage />}

        {page === "monitoring" && <MonitoringPage />}

        {page === "logs" && <LogsPage />}

        {page === "alerts" && <AlertsPage />}
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

  function submitLogin(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password.");
      return;
    }

    onLogin();
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">☁</div>

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
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

function Sidebar({ page, setPage, onLogout }) {
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
            className={`sidebar-button ${
              page === id ? "selected" : ""
            }`}
            onClick={() => setPage(id)}
          >
            <span className="sidebar-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}

        <button
          className="sidebar-button logout"
          onClick={onLogout}
        >
          <span className="sidebar-icon">🚪</span>
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
        <p>Intelligent DevSecOps Platform</p>
      </div>

      <div className="profile">
        <div className="avatar">S</div>

        <div>
          <strong>Admin</strong>
          <span>DevOps Engineer</span>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectCount();
  }, []);

  async function loadProjectCount() {
    try {
      const response = await fetch(`${API_URL}/projects`);

      if (!response.ok) {
        throw new Error("Project API unavailable");
      }

      const data = await response.json();

      setProjectCount(data.total_projects || 0);
    } catch (error) {
      console.error(error);
      setProjectCount(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome to CloudGuard AI</p>
        </div>

        <span className="connection">
          ● Backend Connected
        </span>
      </div>

      <div className="stat-grid">
        <StatCard
          icon="📁"
          title="Total Projects"
          value={loading ? "..." : projectCount}
        />

        <StatCard
          icon="🚀"
          title="Deployments"
          value="0"
        />

        <StatCard
          icon="🔐"
          title="Security Issues"
          value="0"
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
            <h3>Application Status</h3>
            <span className="muted">No active applications</span>
          </div>

          <div className="empty">
            <div className="empty-icon">☁️</div>

            <h3>No applications deployed</h3>

            <p>
              Create a project and deploy it to see
              application status here.
            </p>

            <button
              className="button primary"
              onClick={() => setPage("projects")}
            >
              Go to Projects
            </button>
          </div>
        </section>

        <section className="card risk-card">
          <h3>Deployment Risk</h3>

          <div className="risk-circle">—</div>

          <h4>NOT SCANNED</h4>

          <p>
            Risk analysis will appear after a project
            is scanned.
          </p>
        </section>
      </div>

      <div className="two-column">
        <section className="card">
          <div className="card-header">
            <h3>System Monitoring</h3>
            <span className="muted">Waiting</span>
          </div>

          <div className="empty small">
            <div className="empty-icon">📈</div>
            <p>No deployed application to monitor.</p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3>Recent Deployments</h3>
            <span className="badge">0</span>
          </div>

          <div className="empty small">
            <div className="empty-icon">🚀</div>
            <p>No deployments yet.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>
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
        throw new Error("Could not load projects.");
      }

      const data = await response.json();

      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
      setError("Could not load projects.");
    }
  }

  async function createProject(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!repository.trim()) {
      setError("GitHub repository is required.");
      return;
    }

    if (!branch.trim()) {
      setError("Branch is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            repository: repository.trim(),
            branch: branch.trim(),
            environment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Project creation failed."
        );
      }

      setSuccess("Project created successfully.");

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
          <p>Create and manage your applications</p>
        </div>
      </div>

      <section className="card">
        <h3>Create New Project</h3>

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
            <label>Project Name</label>

            <input
              type="text"
              placeholder="My Application"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>GitHub Repository</label>

            <input
              type="text"
              placeholder="https://github.com/username/repository"
              value={repository}
              onChange={(e) =>
                setRepository(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Branch</label>

            <input
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) =>
                setBranch(e.target.value)
              }
            />
          </div>

          <div className="field">
            <label>Environment</label>

            <select
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value)
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
          <h3>Your Projects</h3>

          <span className="badge">
            {projects.length} Projects
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📁</div>

            <h3>No projects created</h3>

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
                  <h3>{project.name}</h3>

                  <p>{project.repository}</p>

                  <span>
                    Branch: {project.branch}
                    {" • "}
                    Environment:{" "}
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
   DEPLOYMENTS
========================================================= */

function DeploymentsPage({ setPage }) {
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h2>Deployments</h2>
          <p>Deploy your created projects</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>New Deployment</h3>

            <p className="muted">
              Create a project first.
            </p>
          </div>

          <button
            className="button primary"
            onClick={() => setPage("projects")}
          >
            📁 Go to Projects
          </button>
        </div>

        <div className="empty">
          <div className="empty-icon">🚀</div>

          <h3>
            No projects available for deployment
          </h3>

          <p>
            After creating a project, we will connect
            the real deployment workflow here.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Deployment History</h3>

          <span className="badge">
            0 Deployments
          </span>
        </div>

        <div className="empty small">
          <div className="empty-icon">📋</div>
          <p>No deployment history yet.</p>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PIPELINE
========================================================= */

function PipelinePage() {
  const stages = [
    ["1", "Source", "Repository"],
    ["2", "Security", "Security analysis"],
    ["3", "Build", "Application build"],
    ["4", "Test", "Automated tests"],
    ["5", "Docker", "Container build"],
    ["6", "Deploy", "Cloud deployment"],
  ];

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h2>CI/CD Pipeline</h2>
          <p>Automated software delivery workflow</p>
        </div>
      </div>

      <section className="card">
        <div className="pipeline">
          {stages.map(
            ([number, title, description]) => (
              <div
                className="pipeline-stage"
                key={number}
              >
                <div className="pipeline-number">
                  {number}
                </div>

                <h3>{title}</h3>

                <p>{description}</p>

                <span className="not-started">
                  Not started
                </span>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecurityPage() {
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <h2>Security</h2>
          <p>Application security analysis</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon="🔎"
          title="Scans"
          value="0"
        />

        <StatCard
          icon="⚠️"
          title="Vulnerabilities"
          value="0"
        />

        <StatCard
          icon="🛡️"
          title="Risk Score"
          value="—"
        />

        <StatCard
          icon="🔑"
          title="Secrets Found"
          value="0"
        />
      </div>

      <section className="card">
        <div className="empty">
          <div className="empty-icon">🔐</div>

          <h3>No security scan available</h3>

          <p>
            Security analysis will begin after a
            project is created.
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
          <h2>Monitoring</h2>
          <p>Monitor deployed applications</p>
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
          <div className="empty-icon">📈</div>

          <h3>No application to monitor</h3>

          <p>
            Monitoring will begin after a successful
            deployment.
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
          <h2>Logs</h2>
          <p>Application and deployment activity</p>
        </div>
      </div>

      <section className="card">
        <div className="empty">
          <div className="empty-icon">📋</div>

          <h3>No logs available</h3>

          <p>
            Logs will appear after a project is built
            or deployed.
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
          <h2>Alerts</h2>
          <p>Security, deployment and system alerts</p>
        </div>
      </div>

      <section className="card">
        <div className="empty">
          <div className="empty-icon">🔔</div>

          <h3>No alerts</h3>

          <p>
            Alerts will appear when CloudGuard detects
            an issue.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;