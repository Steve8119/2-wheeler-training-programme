import { useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

const centres = [
  "NITA Mombasa",
  "NITA Kisumu",
  "E-Waka Mobility Nairobi",
];

const ACCESS_CODES = {
  "NITA Mombasa": "mom2002",
  "NITA Kisumu": "kis2000",
  "E-Waka Mobility Nairobi": "nai2010",
};

const counties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet",
  "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
  "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga",
  "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
  "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
  "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
  "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu",
  "Vihiga", "Wajir", "West Pokot",
];

const STORAGE_KEY = "sponsorship_applications";
const SESSION_KEY = "sponsorship_admin_session";

function Header() {
  return (
    <header className="header">
      <Link to="/" className="brand">
        <span className="brand-icon">S</span>
        <span>
          <strong>Student Sponsorship</strong>
          <small>APPLICATION PORTAL</small>
        </span>
      </Link>
      <Link to="/admin" className="admin-link">
        Admin Login ↗
      </Link>
    </header>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">YOUR FUTURE STARTS HERE</span>

        <h1>
          Opportunity begins
          <br />
          with <span>one application.</span>
        </h1>

        <p>
          Apply for student sponsorship and take the next
          step towards your technical education and career.
        </p>

        <div className="hero-actions">
          <Link to="/apply" className="button primary">
            Apply for Sponsorship →
          </Link>

          <Link to="/admin" className="button secondary">
            Administrator Login
          </Link>
        </div>

        <div className="hero-note">
          Three centres. One opportunity to grow.
        </div>
      </section>

      <footer>
        Student Sponsorship Portal · Empowering future professionals
      </footer>
    </>
  );
}

// PAGE 2: Select one of the three centres.
function SelectCentre() {
  return (
    <main className="page-wrap">
      <Link to="/" className="back-link">
        ← Back to home
      </Link>

      <div className="form-card">
        <span className="eyebrow">STEP 1 OF 2</span>
        <h1>Select your centre</h1>

        <p className="muted">
          Choose the training centre where you wish to be
          considered for sponsorship.
        </p>

        <div className="centre-grid">
          {centres.map((centre, index) => (
            <article className="centre-card" key={centre}>
              <span className="centre-number">
                0{index + 1}
              </span>

              <h3>{centre}</h3>

              <p>
                Submit your sponsorship application for this centre.
              </p>

              <Link
                to={`/apply/form?centre=${encodeURIComponent(centre)}`}
                className="button primary"
              >
                Choose centre →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

// PAGE 3: Student application form.
function ApplicationForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedCentre = searchParams.get("centre") || "";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    age: "",
    county: "",
    technicalBackground: "",
  });

  const [error, setError] = useState("");

  function update(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setError("");
  }

  function submit(event) {
    event.preventDefault();
    setError("");

    if (!centres.includes(selectedCentre)) {
      setError("Please select a valid training centre.");
      return;
    }

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 16 || age > 100) {
      setError("Please enter a valid age between 16 and 100.");
      return;
    }

    const email = form.email.trim().toLowerCase();
    const phone = form.phone.replace(/\D/g, "");

    if (phone.length < 9 || phone.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    let applications = [];

    try {
      applications = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(applications)) {
        applications = [];
      }
    } catch {
      setError("Unable to read saved applications. Please try again.");
      return;
    }

    // Reject duplicate email OR duplicate phone number.
    const duplicate = applications.some((application) => {
      const savedEmail = String(application.email || "")
        .trim()
        .toLowerCase();

      const savedPhone = String(application.phone || "")
        .replace(/\D/g, "");

      return savedEmail === email || savedPhone === phone;
    });

    if (duplicate) {
      setError(
        "An application already exists with this email address or phone number. Please use your original application instead of applying again."
      );
      return;
    }

    const application = {
      id: crypto.randomUUID(),
      centre: selectedCentre,
      fullName: form.fullName.trim(),
      email,
      phone,
      gender: form.gender,
      age,
      county: form.county,
      technicalBackground: form.technicalBackground,
      status: "Pending",
      submittedAt: new Date().toISOString(),
    };

    try {
      applications.push(application);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
      );
    } catch {
      setError(
        "Your application could not be saved in this browser. Please try again."
      );
      return;
    }

    navigate("/success", {
      state: { centre: selectedCentre },
    });
  }

  if (!centres.includes(selectedCentre)) {
    return (
      <main className="page-wrap">
        <div className="form-card">
          <h1>Select a centre first</h1>
          <p className="muted">
            Choose your preferred training centre before completing
            the application form.
          </p>
          <Link to="/apply" className="button primary">
            Select centre →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <Link to="/apply" className="back-link">
        ← Change centre
      </Link>

      <div className="form-card">
        <span className="eyebrow">STEP 2 OF 2</span>
        <h1>Student application</h1>

        <p className="muted">
          Complete your details below. All fields are required.
        </p>

        <div className="notice">
          Applying to: <strong>{selectedCentre}</strong>
        </div>

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label>Full name *</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={update}
            placeholder="Enter your full name"
            autoComplete="name"
            maxLength={100}
            required
          />

          <div className="form-grid">
            <div>
              <label>Email address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                required
              />
            </div>

            <div>
              <label>Phone number *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                placeholder="0712345678"
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label>Gender *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={update}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </div>

            <div>
              <label>Age *</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={update}
                min="16"
                max="100"
                step="1"
                placeholder="Enter your age"
                required
              />
            </div>
          </div>

          <label>County of residence *</label>
          <select
            name="county"
            value={form.county}
            onChange={update}
            required
          >
            <option value="">Select your county</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>

          <label>
            Do you have any technical background? *
          </label>
          <select
            name="technicalBackground"
            value={form.technicalBackground}
            onChange={update}
            required
          >
            <option value="">Select an answer</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Some experience">
              Some experience
            </option>
          </select>

          <button
            type="submit"
            className="button primary submit-button"
          >
            Submit application →
          </button>

          <p className="privacy-note">
            Submit only once. Duplicate email addresses and phone
            numbers are rejected by this browser prototype.
          </p>
        </form>
      </div>
    </main>
  );
}

// PAGE 4: Admin login with centre-specific access codes.
function Admin() {
  const navigate = useNavigate();

  const [centre, setCentre] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function login(event) {
    event.preventDefault();
    setError("");

    if (!centres.includes(centre)) {
      setError("Please select a valid training centre.");
      return;
    }

    const expectedCode = ACCESS_CODES[centre];

    if (!expectedCode || code.trim() !== expectedCode) {
      setError(
        "Invalid access code for the selected centre. Please try again."
      );
      return;
    }

    // Store a centre-scoped admin session in this browser.
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          centre,
          loginAt: new Date().toISOString(),
        })
      );
    } catch {
      setError(
        "Unable to start an admin session in this browser. Please try again."
      );
      return;
    }

    navigate("/admin/dashboard");
  }

  return (
    <main className="page-wrap">
      <Link to="/" className="back-link">
        ← Back to home
      </Link>

      <div className="form-card admin-card">
        <span className="eyebrow">RESTRICTED AREA</span>
        <h1>Administrator login</h1>

        <p className="muted">
          Select your assigned centre and enter its access code.
        </p>

        <form onSubmit={login}>
          <label>Training centre *</label>
          <select
            value={centre}
            onChange={(event) => {
              setCentre(event.target.value);
              setError("");
            }}
            required
          >
            <option value="">Choose your centre</option>
            {centres.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label>Centre access code *</label>
          <input
            type="password"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError("");
            }}
            placeholder="Enter access code"
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="notice" role="alert">
              {error}
            </div>
          )}

          <button className="button primary submit-button" type="submit">
            Sign in →
          </button>

          <p className="privacy-note">
            Each access code only unlocks the dashboard and
            applications for its own centre.
          </p>
        </form>
      </div>
    </main>
  );
}

// PAGE 5: Centre-specific admin dashboard.
function AdminDashboard() {
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  // Read the admin session from this browser.
  let session = null;

  try {
    session = JSON.parse(
      sessionStorage.getItem(SESSION_KEY) || "null"
    );
  } catch {
    session = null;
  }

  const centre =
    session && centres.includes(session.centre)
      ? session.centre
      : "";

  function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage errors on logout.
    }

    navigate("/admin");
  }

  if (!centre) {
    return (
      <main className="page-wrap">
        <div className="form-card">
          <h1>Admin session required</h1>
          <p className="muted">
            Please sign in with your centre access code to view
            applications.
          </p>
          <Link to="/admin" className="button primary">
            Go to admin login →
          </Link>
        </div>
      </main>
    );
  }

  // Load applications for the signed-in centre only.
  let applications = [];

  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (Array.isArray(stored)) {
      applications = stored.filter(
        (application) => application.centre === centre
      );
    }
  } catch {
    applications = [];
  }

  const total = applications.length;

  const pending = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  return (
    <main className="page-wrap">
      <div className="dashboard-topbar">
        <Link to="/" className="back-link">
          ← Back to home
        </Link>

        <button
          className="button secondary"
          type="button"
          onClick={logout}
        >
          Sign out
        </button>
      </div>

      <div className="form-card">
        <span className="eyebrow">ADMINISTRATOR DASHBOARD</span>
        <h1>{centre}</h1>

        <p className="muted">
          Applications submitted for this centre in this browser.
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{total}</strong>
            <span>Total applications</span>
          </div>

          <div className="stat-card">
            <strong>{pending}</strong>
            <span>Pending review</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Refresh list
          </button>
        </div>

        {total === 0 ? (
          <p className="muted">
            No applications have been submitted for {centre} yet.
          </p>
        ) : (
          <div className="table-wrap" key={refreshKey}>
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>County</th>
                  <th>Technical background</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.fullName}</td>
                    <td>{application.email}</td>
                    <td>{application.phone}</td>
                    <td>{application.gender}</td>
                    <td>{application.age}</td>
                    <td>{application.county}</td>
                    <td>{application.technicalBackground}</td>
                    <td>
                      <span className="status-pill">
                        {application.status}
                      </span>
                    </td>
                    <td>
                      {new Date(
                        application.submittedAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationState = window.history.state?.usr;
  const centre = locationState?.centre || "";

  return (
    <main className="page-wrap">
      <div className="form-card success-card">
        <div className="success-icon">✓</div>
        <span className="eyebrow">APPLICATION RECEIVED</span>
        <h1>Thank you for applying!</h1>

        <p className="muted">
          Your application has been saved in this browser prototype.
        </p>

        {centre && <p><strong>Centre:</strong> {centre}</p>}

        <button
          className="button primary"
          onClick={() => navigate("/")}
        >
          Return home
        </button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<SelectCentre />} />
        <Route path="/apply/form" element={<ApplicationForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </>
  );
}