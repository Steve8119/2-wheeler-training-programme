
import { useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
  useLocation,
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

// Browser prototype limits. A real deployment should use secure
// file storage instead of storing identity documents in localStorage.
const MAX_FILE_SIZE = 500 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const documentTypes = [
  {
    key: "nationalId",
    label: "National ID",
    description: "Upload the front or scanned copy of your National ID.",
    required: true,
  },
  {
    key: "kcseCertificate",
    label: "KCSE certificate",
    description: "Upload your KCSE certificate or the accepted result document.",
    required: true,
  },
  {
    key: "supportingDocument",
    label: "Other supporting document",
    description: "Optional: upload any additional supporting document.",
    required: false,
  },
];

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(
      new Error(`Could not read ${file.name}. Please try again.`)
    );

    reader.readAsDataURL(file);
  });
}

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

// PAGE 1: Home page.
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            YOUR FUTURE STARTS HERE
          </span>

          <h1>
            Opportunity begins
            <br />
            with <span>one application.</span>
          </h1>

          <p>
            Apply for student sponsorship and take the next
            step towards Industrial Training and a brighter
            professional future.
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
            <span className="hero-note-dot" />
            Three centres. One opportunity to grow.
          </div>
        </div>
      </section>

      <section className="home-intro">
        <div className="home-intro-heading">
          <span className="eyebrow">GET STARTED</span>
          <h2>Your journey to new opportunities starts here.</h2>
          <p>
            Choose your training centre, complete the application
            form, and upload the required documents for consideration.
          </p>
        </div>

        <div className="home-features">
          <article className="home-feature">
            <span className="feature-icon">01</span>
            <h3>Choose your centre</h3>
            <p>
              Select NITA Mombasa, NITA Kisumu, or E-Waka Mobility
              Nairobi.
            </p>
          </article>

          <article className="home-feature">
            <span className="feature-icon">02</span>
            <h3>Complete your details</h3>
            <p>
              Provide accurate personal information for your
              sponsorship application.
            </p>
          </article>

          <article className="home-feature">
            <span className="feature-icon">03</span>
            <h3>Upload documents</h3>
            <p>
              Attach your National ID and KCSE certificate, plus
              any additional supporting documents.
            </p>
          </article>
        </div>
      </section>

      <footer>
        <div>
          <strong>Student Sponsorship Portal</strong>
          <span>Empowering future professionals</span>
        </div>

        <Link to="/apply" className="footer-apply">
          Start your application →
        </Link>
      </footer>
    </>
  );
}

// PAGE 2: Select one of the three centres.
function SelectCentre() {
  const centreDetails = [
    {
      name: "NITA Mombasa",
      location: "Mombasa",
      number: "01",
    },
    {
      name: "NITA Kisumu",
      location: "Kisumu",
      number: "02",
    },
    {
      name: "E-Waka Mobility Nairobi",
      location: "Nairobi",
      number: "03",
    },
  ];

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
          {centreDetails.map((item) => (
            <article className="centre-card" key={item.name}>
              <span className="centre-number">{item.number}</span>

              <div className="centre-location">
                <span className="centre-location-dot" />
                {item.location}
              </div>

              <h3>{item.name}</h3>

              <p>
                Submit your sponsorship application for this centre.
              </p>

              <Link
                to={`/apply/form?centre=${encodeURIComponent(item.name)}`}
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

  const [documents, setDocuments] = useState({
    nationalId: null,
    kcseCertificate: null,
    supportingDocument: null,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function updateDocument(event, documentKey) {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setDocuments((previous) => ({
        ...previous,
        [documentKey]: null,
      }));
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        "Please upload PDF, JPG, or PNG documents only."
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `${file.name} is too large. Each document must be 500 KB or less in this browser prototype.`
      );
      event.target.value = "";
      return;
    }

    setDocuments((previous) => ({
      ...previous,
      [documentKey]: file,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (saving) return;

    if (!centres.includes(selectedCentre)) {
      setError("Please select a valid training centre.");
      return;
    }

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 16 || age > 100) {
      setError("Please enter a valid age between 16 and 100.");
      return;
    }

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.replace(/\D/g, "");

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (phone.length < 9 || phone.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!form.county || !form.gender || !form.technicalBackground) {
      setError("Please complete all required fields.");
      return;
    }

    // Required document checks.
    if (!documents.nationalId) {
      setError("Please upload your National ID.");
      return;
    }

    if (!documents.kcseCertificate) {
      setError("Please upload your KCSE certificate.");
      return;
    }

    const selectedFiles = Object.values(documents).filter(Boolean);
    const totalFileSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    if (totalFileSize > 1200 * 1024) {
      setError(
        "Your documents are too large in total. Please reduce their sizes and try again."
      );
      return;
    }

    setSaving(true);

    try {
      let applications = [];

      try {
        applications = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        );

        if (!Array.isArray(applications)) {
          applications = [];
        }
      } catch {
        setError(
          "Unable to read saved applications. Please try again."
        );
        setSaving(false);
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
        setSaving(false);
        return;
      }

      // Convert the selected files into data URLs for this local
      // prototype. This is not recommended for production identity data.
      const savedDocuments = {};

      for (const documentType of documentTypes) {
        const file = documents[documentType.key];

        if (!file) {
          savedDocuments[documentType.key] = null;
          continue;
        }

        savedDocuments[documentType.key] = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: await readFileAsDataURL(file),
        };
      }

      const application = {
        id:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,

        centre: selectedCentre,
        fullName,
        email,
        phone,
        gender: form.gender,
        age,
        county: form.county,
        technicalBackground: form.technicalBackground,
        documents: savedDocuments,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      };

      applications.push(application);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
      );

      navigate("/success", {
        state: { centre: selectedCentre },
      });
    } catch {
      setError(
        "Your application or documents could not be saved in this browser. Please reduce the document sizes or try another browser."
      );
    } finally {
      setSaving(false);
    }
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

      <div className="form-card application-card">
        <span className="eyebrow">STEP 2 OF 2</span>
        <h1>Student application</h1>

        <p className="muted">
          Complete your details and upload the required documents.
          All fields marked with * are required.
        </p>

        <div className="notice centre-notice">
          Applying to: <strong>{selectedCentre}</strong>
        </div>

        {error && (
          <div className="notice error-notice" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Personal information</h2>
              <p>Provide your correct contact details.</p>
            </div>
          </div>

          <label htmlFor="fullName">Full name *</label>
          <input
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={update}
            placeholder="Enter your full name as shown on your ID"
            autoComplete="name"
            maxLength={100}
            required
          />

          <div className="form-grid">
            <div>
              <label htmlFor="email">Email address *</label>
              <input
                id="email"
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
              <label htmlFor="phone">Phone number *</label>
              <input
                id="phone"
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
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
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
              <label htmlFor="age">Age *</label>
              <input
                id="age"
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

          <label htmlFor="county">County of residence *</label>
          <select
            id="county"
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

          <label htmlFor="industrialBackground">
            Do you have any industrial background? *
          </label>
          <select
            id="industrialBackground"
            name="industrialBackground"
            value={form.industrialBackground}
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

          <div className="form-section-heading document-heading">
            <span>02</span>
            <div>
              <h2>Required documents</h2>
              <p>
                Upload clear, readable copies of your documents.
              </p>
            </div>
          </div>

          <div className="document-guidance">
            <strong>Accepted formats: PDF, JPG, and PNG</strong>
            <span>
              Maximum 500 KB per file in this browser prototype.
            </span>
          </div>

          <div className="document-grid">
            {documentTypes.map((documentType) => {
              const file = documents[documentType.key];

              return (
                <div className="document-card" key={documentType.key}>
                  <div className="document-card-top">
                    <span className="document-icon">↑</span>

                    <span
                      className={
                        documentType.required
                          ? "required-tag"
                          : "optional-tag"
                      }
                    >
                      {documentType.required ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>

                  <label htmlFor={documentType.key}>
                    {documentType.label}
                    {documentType.required ? " *" : ""}
                  </label>

                  <p>{documentType.description}</p>

                  <input
                    id={documentType.key}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) =>
                      updateDocument(event, documentType.key)
                    }
                    required={documentType.required}
                  />

                  {file ? (
                    <div className="selected-file">
                      <span className="file-check">✓</span>
                      <span className="selected-file-name">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="remove-file"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => {
                          setDocuments((previous) => ({
                            ...previous,
                            [documentType.key]: null,
                          }));

                          const input = document.getElementById(
                            documentType.key
                          );

                          if (input) input.value = "";
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="file-hint">
                      No file selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="document-privacy-note">
            <strong>Important:</strong> Upload genuine, readable
            documents. In this browser-only prototype, files are stored
            locally in the browser and are not securely uploaded to a
            central server. Do not use real sensitive documents in a
            public deployment until secure storage is configured.
          </div>

          <button
            type="submit"
            className="button primary submit-button"
            disabled={saving}
          >
            {saving ? "Saving application..." : "Submit application →"}
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
          <label htmlFor="adminCentre">Training centre *</label>
          <select
            id="adminCentre"
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

          <label htmlFor="adminCode">Centre access code *</label>
          <input
            id="adminCode"
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
            <div className="notice error-notice" role="alert">
              {error}
            </div>
          )}

          <button
            className="button primary submit-button"
            type="submit"
          >
            Sign in →
          </button>

          <p className="privacy-note">
            Each access code selects the dashboard for its own centre.
            These browser-only codes are not secure production
            authentication.
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

  const withDocuments = applications.filter(
    (application) =>
      application.documents?.nationalId &&
      application.documents?.kcseCertificate
  ).length;

  return (
    <main className="page-wrap dashboard-page">
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

      <div className="form-card dashboard-card">
        <span className="eyebrow">ADMINISTRATOR DASHBOARD</span>
        <h1>{centre}</h1>

        <p className="muted">
          Applications saved in this browser for your selected centre.
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

          <div className="stat-card">
            <strong>{withDocuments}</strong>
            <span>With required documents</span>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            ↻ Refresh list
          </button>
        </div>

        {total === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">▤</span>
            <h2>No applications yet</h2>
            <p>
              No applications have been submitted for {centre} in
              this browser.
            </p>
          </div>
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
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => {
                  const uploadedDocuments = [
                    {
                      key: "nationalId",
                      label: "National ID",
                    },
                    {
                      key: "kcseCertificate",
                      label: "KCSE certificate",
                    },
                    {
                      key: "supportingDocument",
                      label: "Supporting document",
                    },
                  ];

                  return (
                    <tr key={application.id}>
                      <td>{application.fullName}</td>
                      <td>{application.email}</td>
                      <td>{application.phone}</td>
                      <td>{application.gender}</td>
                      <td>{application.age}</td>
                      <td>{application.county}</td>
                      <td>{application.technicalBackground}</td>

                      <td>
                        <div className="admin-document-list">
                          {uploadedDocuments.map((document) => {
                            const file =
                              application.documents?.[document.key];

                            if (!file) {
                              return (
                                <span
                                  className="missing-document"
                                  key={document.key}
                                >
                                  {document.label}: Not uploaded
                                </span>
                              );
                            }

                            return (
                              <a
                                key={document.key}
                                className="document-download"
                                href={file.dataUrl}
                                download={file.name}
                                title={`Download ${file.name}`}
                              >
                                ↓ {document.label}
                              </a>
                            );
                          })}
                        </div>
                      </td>

                      <td>
                        <span className="status-pill">
                          {application.status}
                        </span>
                      </td>

                      <td>
                        {application.submittedAt
                          ? new Date(
                              application.submittedAt
                            ).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="privacy-note dashboard-warning">
          Browser prototype only: applications and documents are
          stored on the browser that submitted them. Other devices
          and browsers cannot access these records.
        </p>
      </div>
    </main>
  );
}

// PAGE 6: Application success.
function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const centre = location.state?.centre || "";

  return (
    <main className="page-wrap">
      <div className="form-card success-card">
        <div className="success-icon">✓</div>

        <span className="eyebrow">APPLICATION RECEIVED</span>
        <h1>Thank you for applying!</h1>

        <p className="muted">
          Your application and selected documents have been saved
          in this browser prototype.
        </p>

        {centre && (
          <p>
            <strong>Centre:</strong> {centre}
          </p>
        )}

        <div className="success-reminder">
          Please keep your original documents available if they
          are requested during the selection process.
        </div>

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

// APP ROUTES.
export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<SelectCentre />} />
        <Route path="/apply/form" element={<ApplicationForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
        <Route path="/success" element={<Success />} />
      </Routes>
    </>
  );
}
