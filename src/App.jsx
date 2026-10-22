
import { useState, useEffect } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabase";

const centres = [
  "NITA Mombasa",
  "NITA Kisumu",
  "E-Waka Mobility Nairobi",
];

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

const MAX_FILE_SIZE = 500 * 1024;
const MAX_TOTAL_SIZE = 1200 * 1024;

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
    description: "Upload your KCSE certificate or accepted result document.",
    required: true,
  },
  {
    key: "supportingDocument",
    label: "Other supporting document",
    description: "Optional: upload any additional supporting document.",
    required: false,
  },
];

// HEADER
function Header() {
  return (
    <header className="header">
      <Link to="/" className="brand">
        <span className="brand-icon">S</span>
        <span>
          <strong>Training Sponsorship</strong>
          <small>APPLICATION PORTAL</small>
        </span>
      </Link>

      <Link to="/admin" className="admin-link">
        Admin Login ↗
      </Link>
    </header>
  );
}

// PAGE 1: HOME
function Home() {
  return (
    <>
      <section
        className="hero"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(8,24,38,.92) 0%, rgba(8,24,38,.72) 52%, rgba(8,24,38,.30) 100%), url('/image.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="hero-content">
          <span className="eyebrow">YOUR FUTURE STARTS HERE</span>

          <h1>
            Opportunity begins
            <br />
            with <span>one application.</span>
          </h1>

          <p>
            Apply for training sponsorship and take the next
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
          <strong>Training Sponsorship Portal</strong>
          <span>Empowering future professionals</span>
        </div>

        <Link to="/apply" className="footer-apply">
          Start your application →
        </Link>
      </footer>
    </>
  );
}

// PAGE 2: CENTRE SELECTION
function SelectCentre() {
  const centreDetails = [
    { name: "NITA Mombasa", location: "Mombasa", number: "01" },
    { name: "NITA Kisumu", location: "Kisumu", number: "02" },
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
              <p>Submit your sponsorship application for this centre.</p>

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

// PAGE 3: APPLICATION FORM
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
    industrialBackground: "",
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
      setError("Please upload PDF, JPG, or PNG documents only.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is too large. Each document must be 500 KB or less.`);
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
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.replace(/\D/g, "");

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (phone.length < 9 || phone.length > 15) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!Number.isInteger(age) || age < 16 || age > 100) {
      setError("Please enter a valid age between 16 and 100.");
      return;
    }

    if (!form.gender || !form.county || !form.industrialBackground) {
      setError("Please complete all required fields.");
      return;
    }

    if (!documents.nationalId || !documents.kcseCertificate) {
      setError("Please upload your National ID and KCSE certificate.");
      return;
    }

    const selectedFiles = Object.values(documents).filter(Boolean);
    const totalFileSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    if (totalFileSize > MAX_TOTAL_SIZE) {
      setError("Your documents exceed the combined 1.2 MB size limit.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();

      payload.append("centre", selectedCentre);
      payload.append("fullName", fullName);
      payload.append("email", email);
      payload.append("phone", phone);
      payload.append("gender", form.gender);
      payload.append("age", String(age));
      payload.append("county", form.county);
      payload.append("industrialBackground", form.industrialBackground);

      if (documents.nationalId) {
        payload.append("nationalId", documents.nationalId);
      }

      if (documents.kcseCertificate) {
        payload.append("kcseCertificate", documents.kcseCertificate);
      }

      if (documents.supportingDocument) {
        payload.append("supportingDocument", documents.supportingDocument);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-application`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: payload,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to submit your application. Please try again."
        );
      }

      navigate("/success", {
        state: {
          centre: selectedCentre,
          applicationId: result.applicationId,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your application. Please try again."
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
        <h1>Trainee application</h1>

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
                <option value="Other">Other</option>
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
          </select>

          <div className="form-section-heading document-heading">
            <span>02</span>
            <div>
              <h2>Required documents</h2>
              <p>Upload clear, readable copies of your documents.</p>
            </div>
          </div>

          <div className="document-guidance">
            <strong>Accepted formats: PDF, JPG, and PNG</strong>
            <span>Maximum 500 KB per file.</span>
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
                        documentType.required ? "required-tag" : "optional-tag"
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
                      <span className="selected-file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file"
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
                    <span className="file-hint">No file selected</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="button primary submit-button"
            disabled={saving}
          >
            {saving ? "Submitting application..." : "Submit application →"}
          </button>

          <p className="privacy-note">
            Your application and uploaded documents will be submitted
            securely to the sponsorship portal.
          </p>
        </form>
      </div>
    </main>
  );
}

// PAGE 4: SUPABASE ADMIN LOGIN
function Admin() {
  const navigate = useNavigate();

  const [centre, setCentre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function login(event) {
    event.preventDefault();
    setError("");

    if (!centres.includes(centre)) {
      setError("Please select a valid training centre.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError || !data.user) {
        throw new Error("Invalid email or password.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("centre, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (
        profileError ||
        !profile ||
        profile.role !== "centre_admin"
      ) {
        await supabase.auth.signOut();
        throw new Error(
          "This account is not configured as a centre administrator."
        );
      }

      if (profile.centre !== centre) {
        await supabase.auth.signOut();
        throw new Error(
          "Your account is not assigned to the selected centre."
        );
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in."
      );
    } finally {
      setSaving(false);
    }
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
          Select your centre and sign in with your administrator account.
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

          <label htmlFor="adminEmail">Email address *</label>
          <input
            id="adminEmail"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            autoComplete="username"
            required
          />

          <label htmlFor="adminPassword">Password *</label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
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
            disabled={saving}
          >
            {saving ? "Signing in..." : "Sign in →"}
          </button>
        </form>
      </div>
    </main>
  );
}

// PAGE 5: CENTRE ADMIN DASHBOARD
function AdminDashboard() {
  const navigate = useNavigate();

  const [centre, setCentre] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  }

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          navigate("/admin", { replace: true });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("admin_profiles")
          .select("centre, role")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile ||
          profile.role !== "centre_admin" ||
          !centres.includes(profile.centre)
        ) {
          await supabase.auth.signOut();
          navigate("/admin", { replace: true });
          return;
        }

        if (active) setCentre(profile.centre);

        // RLS must restrict this query to the administrator's centre.
        const { data, error: applicationsError } = await supabase
          .from("applications")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (applicationsError) throw applicationsError;

        const rows = await Promise.all(
          (data || []).map(async (application) => {
            const documentPaths = [
              ["nationalId", application.national_id_path],
              ["kcseCertificate", application.kcse_certificate_path],
              ["supportingDocument", application.supporting_document_path],
            ];

            const documents = {};

            for (const [key, path] of documentPaths) {
              if (!path) {
                documents[key] = null;
                continue;
              }

              const { data: signedData, error: signedError } =
                await supabase.storage
                  .from("sponsorship-documents")
                  .createSignedUrl(path, 300);

              documents[key] =
                signedError || !signedData?.signedUrl
                  ? null
                  : {
                      name: key,
                      url: signedData.signedUrl,
                    };
            }

            return {
              ...application,
              fullName: application.full_name,
              industrialBackground: application.industrial_background,
              submittedAt: application.submitted_at,
              documents,
            };
          })
        );

        if (active) setApplications(rows);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load applications."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, [navigate, refreshKey]);

  if (loading) {
    return (
      <main className="page-wrap">
        <div className="form-card">
          <h1>Loading applications...</h1>
          <p className="muted">Connecting securely to Supabase.</p>
        </div>
      </main>
    );
  }

  if (!centre) {
    return (
      <main className="page-wrap">
        <div className="form-card">
          <h1>Admin session required</h1>
          <p className="muted">Please sign in to continue.</p>
          <Link to="/admin" className="button primary">
            Go to admin login →
          </Link>
        </div>
      </main>
    );
  }

  const total = applications.length;

  const pending = applications.filter(
    (application) => application.status === "Pending"
  ).length;

  const withDocuments = applications.filter(
    (application) =>
      application.national_id_path &&
      application.kcse_certificate_path
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
          Applications stored in the Supabase database for your centre.
        </p>

        {error && (
          <div className="notice error-notice" role="alert">
            {error}
          </div>
        )}

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
            <p>No applications are currently available for {centre}.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>County</th>
                  <th>Industrial background</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => {
                  const uploadedDocuments = [
                    { key: "nationalId", label: "National ID" },
                    { key: "kcseCertificate", label: "KCSE certificate" },
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
                      <td>{application.industrialBackground}</td>

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
                                  {document.label}: Not available
                                </span>
                              );
                            }

                            return (
                              <a
                                key={document.key}
                                className="document-download"
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
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
          Application access depends on Supabase authentication and
          row-level security. Private document links expire after five minutes.
        </p>
      </div>
    </main>
  );
}

// PAGE 6: SUCCESS
function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const centre = location.state?.centre || "";
  const applicationId = location.state?.applicationId || "";

  return (
    <main className="page-wrap">
      <div className="form-card success-card">
        <div className="success-icon">✓</div>

        <span className="eyebrow">APPLICATION RECEIVED</span>
        <h1>Thank you for applying!</h1>

        <p className="muted">
          Your application has been submitted successfully.
          Please keep your original documents available if they
          are requested during the selection process.
        </p>

        {centre && (
          <p>
            <strong>Centre:</strong> {centre}
          </p>
        )}

        {applicationId && (
          <p>
            <strong>Application reference:</strong> {applicationId}
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

// SIGN OUT WHEN NAVIGATING OUTSIDE ADMIN ROUTES
function AdminAutoLogout() {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      supabase.auth.signOut();
    }
  }, [location.pathname]);

  return null;
}

// APP ROUTES
export default function App() {
  return (
    <>
      <AdminAutoLogout />
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
