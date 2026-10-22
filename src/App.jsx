import { useState, useEffect, useMemo, useRef } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabase";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  PageOrientation,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

// ============================================================
// CONFIGURATION
// ============================================================

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
const PAGE_SIZE = 10;
const EXPORT_BATCH_SIZE = 500;

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
    description: "Optional additional supporting document.",
    required: false,
  },
];

const statusOptions = ["Pending", "Approved", "Rejected"];

const statusClass = (status) =>
  String(status || "Pending").toLowerCase();

// Fetch every matching record in batches, avoiding the usual
// Supabase/PostgREST default maximum-row limit.
async function fetchAllCentreApplications(centre, columns = "*") {
  const records = [];
  let start = 0;

  while (true) {
    const end = start + EXPORT_BATCH_SIZE - 1;

    const { data, error } = await supabase
      .from("applications")
      .select(columns)
      .eq("centre", centre)
      .order("submitted_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    const batch = data || [];
    records.push(...batch);

    if (batch.length < EXPORT_BATCH_SIZE) break;

    start += EXPORT_BATCH_SIZE;
  }

  return records;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ============================================================
// SHARED HEADER
// ============================================================

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

// ============================================================
// HOME PAGE
// ============================================================

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
            step towards industrial training and a brighter
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
            form, and upload the required documents.
          </p>
        </div>

        <div className="home-features">
          <article className="home-feature">
            <span className="feature-icon">01</span>
            <h3>Choose your centre</h3>
            <p>
              Select NITA Mombasa, NITA Kisumu, or E-Waka Mobility Nairobi.
            </p>
          </article>

          <article className="home-feature">
            <span className="feature-icon">02</span>
            <h3>Complete your details</h3>
            <p>
              Provide accurate personal information for your application.
            </p>
          </article>

          <article className="home-feature">
            <span className="feature-icon">03</span>
            <h3>Upload documents</h3>
            <p>
              Attach your National ID and KCSE certificate, plus any
              additional supporting documents.
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

// ============================================================
// CENTRE SELECTION
// ============================================================

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
          Choose the training centre where you wish to apply.
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

// ============================================================
// APPLICATION FORM
// ============================================================

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
      setError(
        `${file.name} is too large. Each document must be 500 KB or less.`
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

// ============================================================
// ADMIN LOGIN
// ============================================================

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

      if (profileError || !profile || profile.role !== "centre_admin") {
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

// ============================================================
// ADMIN DASHBOARD STYLES
// These styles are scoped so they don't redesign your public pages.
// ============================================================

function AdminDashboardStyles() {
  return (
    <style>{`
      .portal-admin {
        --pa-ink: #172b3a;
        --pa-muted: #738191;
        --pa-line: #e5ebf0;
        --pa-primary: #176b68;
        --pa-primary-dark: #105552;
        --pa-bg: #f4f7fa;
        --pa-card: #ffffff;
        color: var(--pa-ink);
        background: var(--pa-bg);
        min-height: 100vh;
        margin: -1px 0 0;
        font-size: 14px;
      }
      .portal-admin * { box-sizing: border-box; }
      .portal-admin button, .portal-admin input, .portal-admin select { font: inherit; }
      .portal-admin button { cursor: pointer; }
      .portal-admin button:disabled { opacity: .55; cursor: not-allowed; }
      .pa-shell { display: grid; grid-template-columns: 248px minmax(0,1fr); min-height: calc(100vh - 1px); }
      .pa-sidebar { background: #102d40; color: #fff; padding: 25px 17px; display: flex; flex-direction: column; gap: 25px; }
      .pa-brand { display: flex; gap: 11px; align-items: center; padding: 0 7px 23px; border-bottom: 1px solid rgba(255,255,255,.12); }
      .pa-brand-mark { width: 42px; height: 42px; border-radius: 13px; background: #1b817a; display: grid; place-items: center; font-size: 21px; font-weight: 800; }
      .pa-brand strong { display: block; font-size: 13px; line-height: 1.4; }
      .pa-brand small { display: block; font-size: 9px; letter-spacing: 1.3px; color: #a9c3d0; margin-top: 4px; }
      .pa-nav-label { font-size: 10px; color: #91acba; letter-spacing: 1.5px; padding: 0 11px; margin-bottom: 7px; }
      .pa-nav { display: grid; gap: 6px; }
      .pa-nav button { border: 0; color: #c6d6de; text-align: left; padding: 12px 13px; border-radius: 9px; background: transparent; display: flex; align-items: center; gap: 11px; width: 100%; }
      .pa-nav button:hover, .pa-nav button.active { background: rgba(255,255,255,.12); color: #fff; }
      .pa-nav-icon { width: 20px; text-align: center; font-size: 17px; }
      .pa-nav-count { margin-left: auto; border-radius: 20px; padding: 3px 7px; font-size: 11px; background: rgba(255,255,255,.13); }
      .pa-sidebar-bottom { margin-top: auto; }
      .pa-centre-box { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); border-radius: 12px; padding: 13px; margin-bottom: 15px; }
      .pa-centre-box small { color: #a9c3d0; display: block; font-size: 10px; margin-bottom: 7px; }
      .pa-centre-box strong { font-size: 12px; line-height: 1.5; display: block; }
      .pa-centre-dot { width: 7px; height: 7px; background: #56d6a4; display: inline-block; border-radius: 50%; margin-right: 7px; }
      .pa-signout { border: 1px solid rgba(255,255,255,.16)!important; color: #fff!important; width: 100%; border-radius: 9px; padding: 11px!important; background: transparent!important; }
      .pa-main { min-width: 0; }
      .pa-topbar { min-height: 76px; background: #fff; border-bottom: 1px solid var(--pa-line); padding: 16px 30px; display: flex; justify-content: space-between; align-items: center; gap: 15px; }
      .pa-topbar small { color: var(--pa-muted); display: block; font-size: 11px; margin-bottom: 4px; }
      .pa-topbar strong { font-size: 14px; }
      .pa-admin-profile { display: flex; align-items: center; gap: 10px; }
      .pa-avatar { width: 38px; height: 38px; background: #dcefeb; color: #176b68; display: grid; place-items: center; border-radius: 50%; font-weight: 800; }
      .pa-profile-copy strong { font-size: 12px; display: block; }
      .pa-profile-copy small { margin: 3px 0 0; }
      .pa-content { padding: 27px 30px 38px; max-width: 1600px; margin: auto; }
      .pa-page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 24px; }
      .pa-kicker { color: var(--pa-primary); font-size: 10px; font-weight: 800; letter-spacing: 1.7px; margin-bottom: 9px; }
      .pa-page-heading h1 { font-size: clamp(23px,2.5vw,30px); line-height: 1.2; margin: 0 0 8px; letter-spacing: -.7px; }
      .pa-page-heading p { color: var(--pa-muted); margin: 0; line-height: 1.6; }
      .pa-btn { border: 1px solid var(--pa-line); background: #fff; color: var(--pa-ink); padding: 10px 13px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; text-decoration: none; white-space: nowrap; }
      .pa-btn:hover { border-color: #b8c9d1; }
      .pa-btn-primary { background: var(--pa-primary); color: #fff; border-color: var(--pa-primary); }
      .pa-btn-primary:hover { background: var(--pa-primary-dark); color: #fff; }
      .pa-btn-danger { color: #b83e48; border-color: #f0d5d7; background: #fff; }
      .pa-btn-success { color: #14744c; border-color: #cbe9da; background: #f1fbf5; }
      .pa-btn-sm { padding: 7px 9px; font-size: 11px; }
      .pa-stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 15px; margin-bottom: 23px; }
      .pa-stat { background: #fff; border: 1px solid var(--pa-line); border-radius: 13px; padding: 18px; min-width: 0; }
      .pa-stat-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
      .pa-stat-label { color: var(--pa-muted); font-size: 12px; font-weight: 600; }
      .pa-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 17px; }
      .pa-stat-number { display: block; font-size: 29px; letter-spacing: -1px; font-weight: 800; margin-top: 13px; }
      .pa-stat-note { color: var(--pa-muted); font-size: 11px; margin-top: 4px; }
      .pa-stat-all .pa-stat-icon { background: #eaf1fc; color: #4775c5; }
      .pa-stat-pending .pa-stat-icon { background: #fff3dc; color: #b67b19; }
      .pa-stat-approved .pa-stat-icon { background: #e2f6eb; color: #198251; }
      .pa-stat-rejected .pa-stat-icon { background: #fce9e9; color: #c24949; }
      .pa-panel { background: #fff; border: 1px solid var(--pa-line); border-radius: 13px; overflow: hidden; }
      .pa-panel-heading { padding: 20px 21px; display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid var(--pa-line); }
      .pa-panel-heading h2 { margin: 0 0 5px; font-size: 16px; }
      .pa-panel-heading p { margin: 0; color: var(--pa-muted); font-size: 12px; }
      .pa-panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .pa-filterbar { padding: 17px 20px; display: flex; align-items: center; justify-content: space-between; gap: 13px; flex-wrap: wrap; border-bottom: 1px solid var(--pa-line); }
      .pa-tabs { display: flex; gap: 5px; flex-wrap: wrap; }
      .pa-tab { background: transparent; border: 1px solid transparent; color: #687988; padding: 9px 11px; border-radius: 7px; font-size: 12px; font-weight: 700; }
      .pa-tab:hover { background: #f5f8fa; }
      .pa-tab.active { color: var(--pa-primary); border-color: #cfe5e1; background: #eef8f6; }
      .pa-tab-count { background: #e9eef2; border-radius: 12px; padding: 2px 6px; font-size: 10px; margin-left: 5px; }
      .pa-tab.active .pa-tab-count { background: #d5ece7; }
      .pa-search { position: relative; min-width: 230px; max-width: 100%; flex: 1; max-width: 320px; }
      .pa-search span { position: absolute; left: 12px; top: 10px; color: #8b9aa7; }
      .pa-search input { width: 100%; padding: 10px 12px 10px 35px; border: 1px solid #dfe6ec; border-radius: 8px; outline: none; background: #fff; color: var(--pa-ink); }
      .pa-search input:focus, .pa-select:focus { border-color: #6fb5ac; box-shadow: 0 0 0 3px rgba(23,107,104,.08); }
      .pa-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .pa-select { border: 1px solid #dfe6ec; background: #fff; color: var(--pa-ink); border-radius: 8px; padding: 10px 12px; outline: none; }
      .pa-table-scroll { width: 100%; overflow-x: auto; }
      .pa-table { width: 100%; border-collapse: collapse; min-width: 850px; }
      .pa-table th { background: #f9fbfc; text-align: left; font-size: 10px; color: #788897; font-weight: 800; text-transform: uppercase; letter-spacing: .65px; padding: 13px 16px; white-space: nowrap; border-bottom: 1px solid var(--pa-line); }
      .pa-table td { padding: 15px 16px; border-bottom: 1px solid #edf1f4; vertical-align: middle; font-size: 12px; }
      .pa-table tbody tr:last-child td { border-bottom: 0; }
      .pa-table tbody tr:hover { background: #fbfdfd; }
      .pa-applicant { display: flex; align-items: center; gap: 10px; min-width: 190px; }
      .pa-applicant-avatar { width: 35px; height: 35px; border-radius: 10px; background: #e8f1f3; color: #285d6b; display: grid; place-items: center; font-weight: 800; flex-shrink: 0; }
      .pa-applicant-name { font-weight: 800; color: #203645; margin-bottom: 4px; max-width: 200px; overflow-wrap: anywhere; }
      .pa-secondary-text { color: var(--pa-muted); font-size: 11px; overflow-wrap: anywhere; }
      .pa-status { display: inline-flex; align-items: center; gap: 6px; border-radius: 20px; padding: 6px 9px; font-size: 10px; font-weight: 800; white-space: nowrap; }
      .pa-status:before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      .pa-status-pending { color: #99630a; background: #fff3d9; }
      .pa-status-approved { color: #167349; background: #e3f6eb; }
      .pa-status-rejected { color: #b33d47; background: #fde9ea; }
      .pa-status-unknown { color: #566575; background: #edf1f4; }
      .pa-row-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
      .pa-icon-btn { width: 33px; height: 33px; border-radius: 8px; border: 1px solid #e0e7ec; background: #fff; color: #526777; display: grid; place-items: center; font-size: 15px; }
      .pa-icon-btn:hover { color: var(--pa-primary); border-color: #b7d8d3; }
      .pa-empty { text-align: center; padding: 50px 20px; }
      .pa-empty-icon { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 16px; background: #edf5f5; color: var(--pa-primary); margin: 0 auto 14px; font-size: 24px; }
      .pa-empty h3 { margin: 0 0 8px; font-size: 16px; }
      .pa-empty p { color: var(--pa-muted); margin: 0 auto 17px; max-width: 360px; line-height: 1.6; }
      .pa-pagination { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 15px 20px; border-top: 1px solid var(--pa-line); flex-wrap: wrap; }
      .pa-pagination-text { color: var(--pa-muted); font-size: 11px; }
      .pa-pagination-buttons { display: flex; gap: 6px; }
      .pa-page-number { min-width: 32px; height: 32px; border-radius: 7px; border: 1px solid var(--pa-line); background: #fff; color: #536677; }
      .pa-page-number.active { color: #fff; background: var(--pa-primary); border-color: var(--pa-primary); }
      .pa-page-number:disabled { opacity: .4; cursor: not-allowed; }
      .pa-notice { padding: 12px 14px; border-radius: 9px; margin-bottom: 16px; font-size: 12px; line-height: 1.5; }
      .pa-notice-error { color: #9c303a; background: #fff0f0; border: 1px solid #f2d0d2; }
      .pa-notice-success { color: #176a45; background: #eaf8ef; border: 1px solid #cbead6; }
      .pa-footer-note { padding: 17px 2px 0; color: #82919d; font-size: 11px; line-height: 1.6; }
      .pa-modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(12,29,42,.58); display: flex; justify-content: center; align-items: center; padding: 20px; }
      .pa-modal { width: min(850px,100%); max-height: 90vh; overflow-y: auto; background: #fff; border-radius: 16px; box-shadow: 0 24px 80px rgba(0,0,0,.22); }
      .pa-modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 22px 24px; border-bottom: 1px solid var(--pa-line); }
      .pa-modal-head h2 { font-size: 19px; margin: 0 0 6px; overflow-wrap: anywhere; }
      .pa-modal-head p { margin: 0; color: var(--pa-muted); font-size: 12px; }
      .pa-modal-body { padding: 23px 24px; }
      .pa-detail-section { margin-bottom: 24px; }
      .pa-detail-section h3 { margin: 0 0 13px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #52697a; }
      .pa-detail-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
      .pa-detail-field { min-width: 0; border-bottom: 1px solid #edf1f4; padding-bottom: 12px; }
      .pa-detail-field small { display: block; color: var(--pa-muted); margin-bottom: 6px; font-size: 11px; }
      .pa-detail-field strong { font-size: 13px; overflow-wrap: anywhere; line-height: 1.5; }
      .pa-doc-list { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
      .pa-doc-card { border: 1px solid var(--pa-line); border-radius: 10px; padding: 13px; min-width: 0; }
      .pa-doc-card strong { display: block; font-size: 12px; margin-bottom: 8px; }
      .pa-doc-card p { color: var(--pa-muted); font-size: 11px; margin: 0 0 12px; line-height: 1.5; }
      .pa-modal-foot { border-top: 1px solid var(--pa-line); padding: 17px 24px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: center; }
      .pa-modal-foot-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .pa-mobile-menu { display: none; }
      .pa-loading { padding: 70px 20px; text-align: center; }
      .pa-spinner { width: 31px; height: 31px; border: 3px solid #dce9e7; border-top-color: var(--pa-primary); border-radius: 50%; animation: pa-spin .8s linear infinite; margin: 0 auto 16px; }
      @keyframes pa-spin { to { transform: rotate(360deg); } }
      @media(max-width:1100px) {
        .pa-shell { grid-template-columns: 210px minmax(0,1fr); }
        .pa-content { padding: 22px 20px 30px; }
        .pa-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .pa-table th, .pa-table td { padding: 13px 12px; }
      }
      @media(max-width:760px) {
        .pa-shell { display: block; }
        .pa-sidebar { padding: 13px 15px; gap: 12px; }
        .pa-brand { border: 0; padding: 0; }
        .pa-nav-label, .pa-sidebar-bottom { display: none; }
        .pa-nav { display: flex; overflow-x: auto; padding-bottom: 2px; }
        .pa-nav button { width: auto; flex-shrink: 0; padding: 9px 11px; font-size: 11px; }
        .pa-nav-icon { display: none; }
        .pa-nav-count { margin-left: 2px; }
        .pa-topbar { padding: 12px 16px; min-height: 65px; }
        .pa-content { padding: 20px 13px 25px; }
        .pa-page-heading { flex-direction: column; }
        .pa-page-heading > .pa-btn { width: 100%; }
        .pa-stats { gap: 9px; }
        .pa-stat { padding: 13px; }
        .pa-stat-number { font-size: 25px; }
        .pa-stat-label { font-size: 11px; }
        .pa-stat-icon { width: 30px; height: 30px; }
        .pa-panel-heading { align-items: flex-start; flex-direction: column; padding: 16px; }
        .pa-panel-actions { width: 100%; }
        .pa-panel-actions .pa-btn { flex: 1; }
        .pa-filterbar { padding: 13px; }
        .pa-tabs { width: 100%; overflow-x: auto; flex-wrap: nowrap; }
        .pa-tab { flex-shrink: 0; }
        .pa-search { min-width: 100%; max-width: 100%; }
        .pa-filter-row { width: 100%; }
        .pa-filter-row .pa-select { flex: 1; min-width: 0; }
        .pa-detail-grid { grid-template-columns: 1fr; }
        .pa-doc-list { grid-template-columns: 1fr; }
        .pa-modal-backdrop { padding: 8px; }
        .pa-modal-head, .pa-modal-body, .pa-modal-foot { padding: 16px; }
        .pa-modal-foot { align-items: stretch; flex-direction: column; }
        .pa-modal-foot-actions { display: grid; grid-template-columns: 1fr; }
        .pa-modal-foot-actions .pa-btn { width: 100%; }
      }
    `}</style>
  );
}

// ============================================================
// DASHBOARD COMPONENTS
// ============================================================

function StatCard({ type, icon, label, value, note }) {
  return (
    <div className={`pa-stat pa-stat-${type}`}>
      <div className="pa-stat-top">
        <span className="pa-stat-label">{label}</span>
        <span className="pa-stat-icon">{icon}</span>
      </div>
      <strong className="pa-stat-number">{value}</strong>
      <div className="pa-stat-note">{note}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const knownStatus = statusOptions.includes(status) ? status : "Pending";

  return (
    <span className={`pa-status pa-status-${statusClass(knownStatus)}`}>
      {knownStatus}
    </span>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="pa-detail-field">
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function ApplicantModal({
  application,
  onClose,
  onStatusChange,
  updating,
  onOpenDocument,
}) {
  if (!application) return null;

  const docs = [
    { key: "nationalId", label: "National ID", path: application.national_id_path },
    {
      key: "kcseCertificate",
      label: "KCSE certificate",
      path: application.kcse_certificate_path,
    },
    {
      key: "supportingDocument",
      label: "Supporting document",
      path: application.supporting_document_path,
    },
  ];

  return (
    <div
      className="pa-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="pa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pa-applicant-title"
      >
        <div className="pa-modal-head">
          <div>
            <div className="pa-kicker">APPLICANT RECORD</div>
            <h2 id="pa-applicant-title">{application.full_name}</h2>
            <p>
              Submitted {formatDate(application.submitted_at)}
            </p>
          </div>

          <button
            type="button"
            className="pa-icon-btn"
            onClick={onClose}
            aria-label="Close applicant details"
          >
            ✕
          </button>
        </div>

        <div className="pa-modal-body">
          <div style={{ marginBottom: 20 }}>
            <StatusBadge status={application.status || "Pending"} />
          </div>

          <div className="pa-detail-section">
            <h3>Personal information</h3>
            <div className="pa-detail-grid">
              <DetailField label="Full name" value={application.full_name} />
              <DetailField label="Email address" value={application.email} />
              <DetailField label="Phone number" value={application.phone} />
              <DetailField label="Gender" value={application.gender} />
              <DetailField label="Age" value={application.age} />
              <DetailField label="County" value={application.county} />
              <DetailField
                label="Industrial background"
                value={application.industrial_background}
              />
              <DetailField
                label="Application centre"
                value={application.centre}
              />
              <DetailField
                label="Submitted on"
                value={formatDate(application.submitted_at)}
              />
              <DetailField
                label="Current status"
                value={application.status || "Pending"}
              />
            </div>
          </div>

          <div className="pa-detail-section">
            <h3>Uploaded documents</h3>
            <div className="pa-doc-list">
              {docs.map((doc) => (
                <div className="pa-doc-card" key={doc.key}>
                  <strong>{doc.label}</strong>
                  <p>
                    {doc.path
                      ? "Document is recorded in secure storage."
                      : "No document recorded."}
                  </p>
                  {doc.path ? (
                    <button
                      className="pa-btn pa-btn-sm"
                      type="button"
                      onClick={() => onOpenDocument(application, doc.key)}
                    >
                      ↗ Open document
                    </button>
                  ) : (
                    <span className="pa-secondary-text">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pa-modal-foot">
          <button type="button" className="pa-btn" onClick={onClose}>
            Close details
          </button>

          <div className="pa-modal-foot-actions">
            <button
              type="button"
              className="pa-btn pa-btn-success"
              disabled={
                updating || application.status === "Approved"
              }
              onClick={() => onStatusChange(application.id, "Approved")}
            >
              {updating ? "Saving..." : "✓ Approve"}
            </button>

            <button
              type="button"
              className="pa-btn pa-btn-danger"
              disabled={
                updating || application.status === "Rejected"
              }
              onClick={() => onStatusChange(application.id, "Rejected")}
            >
              ✕ Reject
            </button>

            {application.status !== "Pending" && (
              <button
                type="button"
                className="pa-btn"
                disabled={updating}
                onClick={() => onStatusChange(application.id, "Pending")}
              >
                ↺ Reset to pending
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// CENTRE ADMIN DASHBOARD
// ============================================================

function AdminDashboard() {
  const navigate = useNavigate();

  const [centre, setCentre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openingDocument, setOpeningDocument] = useState(false);

  const loadSequence = useRef(0);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  }

  // ----------------------------------------------------------
  // LOAD ALL APPLICATIONS FOR THE SIGNED-IN CENTRE
  // ----------------------------------------------------------

  useEffect(() => {
    let active = true;
    const sequence = ++loadSequence.current;

    async function loadApplications() {
      setLoading(true);
      setError("");
      setMessage("");

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

        if (!active) return;

        setCentre(profile.centre);
        setAdminEmail(userData.user.email || "");

        // Batch loading avoids showing only the first page of records.
        const rows = await fetchAllCentreApplications(profile.centre);

        if (!active || sequence !== loadSequence.current) return;

        setApplications(
          rows.map((application) => ({
            ...application,
            status: application.status || "Pending",
          }))
        );

        // Keep a selected applicant synchronized with refreshed records.
        setSelectedApplicant((previous) => {
          if (!previous) return null;
          return (
            rows.find((row) => row.id === previous.id) || null
          );
        });
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

  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(
      (item) => (item.status || "Pending") === "Pending"
    ).length;
    const approved = applications.filter(
      (item) => item.status === "Approved"
    ).length;
    const rejected = applications.filter(
      (item) => item.status === "Rejected"
    ).length;
    const withDocuments = applications.filter(
      (item) =>
        item.national_id_path && item.kcse_certificate_path
    ).length;

    return { total, pending, approved, rejected, withDocuments };
  }, [applications]);

  // ----------------------------------------------------------
  // SEARCH, FILTERS AND PAGINATION
  // ----------------------------------------------------------

  const availableCounties = useMemo(() => {
    return [...new Set(
      applications.map((item) => item.county).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications.filter((application) => {
      const status = application.status || "Pending";

      const matchesTab =
        activeTab === "All" || status === activeTab;

      const matchesCounty =
        countyFilter === "All" || application.county === countyFilter;

      const searchFields = [
        application.full_name,
        application.email,
        application.phone,
        application.county,
        application.gender,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchFields.some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearch)
        );

      return matchesTab && matchesCounty && matchesSearch;
    });
  }, [applications, activeTab, countyFilter, search]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, pageCount);

  const paginatedApplications = filteredApplications.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, countyFilter]);

  // ----------------------------------------------------------
  // STATUS CHANGES
  // ----------------------------------------------------------

  async function updateStatus(applicationId, newStatus) {
    if (!statusOptions.includes(newStatus)) {
      setError("Invalid application status.");
      return;
    }

    const target = applications.find(
      (item) => item.id === applicationId
    );

    if (!target) {
      setError("Applicant could not be found in the current list.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark ${target.full_name} as ${newStatus}?`
    );

    if (!confirmed) return;

    setUpdatingId(applicationId);
    setError("");
    setMessage("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("centre, role")
        .eq("id", userData.user.id)
        .single();

      if (
        profileError ||
        profile?.role !== "centre_admin" ||
        profile.centre !== centre
      ) {
        throw new Error("You are not authorized to update this application.");
      }

      const { data, error: updateError } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId)
        .eq("centre", profile.centre)
        .select("id, status")
        .single();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error("The application status was not updated.");
      }

      setApplications((previous) =>
        previous.map((application) =>
          application.id === applicationId
            ? { ...application, status: data.status }
            : application
        )
      );

      setSelectedApplicant((previous) =>
        previous?.id === applicationId
          ? { ...previous, status: data.status }
          : previous
      );

      setMessage(
        `${target.full_name}'s application is now ${data.status}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // ----------------------------------------------------------
  // OPEN A PRIVATE DOCUMENT
  // Create a short-lived signed URL only when needed.
  // ----------------------------------------------------------

  async function openDocument(application, documentKey) {
    const pathByKey = {
      nationalId: application.national_id_path,
      kcseCertificate: application.kcse_certificate_path,
      supportingDocument: application.supporting_document_path,
    };

    const path = pathByKey[documentKey];

    if (!path) {
      setError("This applicant does not have that document recorded.");
      return;
    }

    setOpeningDocument(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in again to access documents.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("centre, role")
        .eq("id", userData.user.id)
        .single();

      if (
        profileError ||
        profile?.role !== "centre_admin" ||
        profile.centre !== centre ||
        application.centre !== centre
      ) {
        throw new Error("You are not authorized to open this document.");
      }

      const { data, error: signedError } = await supabase.storage
        .from("sponsorship-documents")
        .createSignedUrl(path, 300);

      if (signedError || !data?.signedUrl) {
        throw signedError || new Error("Could not create a secure document link.");
      }

      const opened = window.open(data.signedUrl, "_blank", "noopener,noreferrer");

      if (!opened) {
        // Useful if the browser blocks opening a new tab.
        window.location.assign(data.signedUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open the document."
      );
    } finally {
      setOpeningDocument(false);
    }
  }

  // ----------------------------------------------------------
  // EXPORT ALL APPLICANTS TO WORD
  // This fetches every record for the centre from Supabase,
  // regardless of the current tab, search or pagination.
  // ----------------------------------------------------------

  async function downloadApplicantsWord() {
    setError("");
    setMessage("");

    if (exporting) return;

    setExporting(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in again before downloading.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("centre, role")
        .eq("id", userData.user.id)
        .single();

      if (
        profileError ||
        profile?.role !== "centre_admin" ||
        profile.centre !== centre ||
        !centres.includes(profile.centre)
      ) {
        throw new Error(
          "You are not authorized to export these applications."
        );
      }

      // Important: do not export the filtered page state.
      // Read all matching centre records in batches.
      const exportRows = await fetchAllCentreApplications(
        profile.centre,
        [
          "id",
          "full_name",
          "email",
          "phone",
          "gender",
          "age",
          "county",
          "industrial_background",
          "status",
          "submitted_at",
        ].join(",")
      );

      if (exportRows.length === 0) {
        throw new Error("There are no applications to download.");
      }

      const cellText = (value) =>
        new Paragraph({
          children: [
            {
              text: String(value ?? ""),
              size: 16,
            },
          ],
          spacing: { before: 30, after: 30 },
        });

      const headerCell = (value) =>
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: "16384A" },
          margins: { top: 90, bottom: 90, left: 70, right: 70 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                {
                  text: value,
                  bold: true,
                  color: "FFFFFF",
                  size: 16,
                },
              ],
            }),
          ],
        });

      const dataCell = (value) =>
        new TableCell({
          margins: { top: 70, bottom: 70, left: 70, right: 70 },
          children: [cellText(value)],
        });

      const headers = [
        "Full name",
        "Email",
        "Phone",
        "Gender",
        "Age",
        "County",
        "Industrial background",
        "Status",
        "Submitted",
      ];

      const rows = [
        new TableRow({
          tableHeader: true,
          children: headers.map(headerCell),
        }),
        ...exportRows.map((application) =>
          new TableRow({
            cantSplit: true,
            children: [
              application.full_name,
              application.email,
              application.phone,
              application.gender,
              application.age,
              application.county,
              application.industrial_background,
              application.status || "Pending",
              application.submitted_at
                ? new Date(application.submitted_at).toLocaleString("en-KE")
                : "",
            ].map(dataCell),
          })
        ),
      ];

      const counts = exportRows.reduce(
        (result, item) => {
          const status = item.status || "Pending";
          if (status === "Approved") result.approved += 1;
          else if (status === "Rejected") result.rejected += 1;
          else result.pending += 1;
          return result;
        },
        { pending: 0, approved: 0, rejected: 0 }
      );

      const wordDocument = new Document({
        creator: "Training Sponsorship Portal",
        title: `${profile.centre} - All Applicants`,
        description: "Centre application register",
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: PageOrientation.LANDSCAPE,
                },
                margin: {
                  top: 650,
                  right: 500,
                  bottom: 650,
                  left: 500,
                },
              },
            },
            children: [
              new Paragraph({
                text: "TRAINING SPONSORSHIP APPLICATION REGISTER",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 180 },
              }),
              new Paragraph({
                children: [
                  { text: "Training centre: ", bold: true },
                  { text: profile.centre },
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  { text: "Total applicants: ", bold: true },
                  { text: String(exportRows.length) },
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  { text: "Pending: ", bold: true },
                  { text: String(counts.pending) },
                  { text: "    Approved: ", bold: true },
                  { text: String(counts.approved) },
                  { text: "    Rejected: ", bold: true },
                  { text: String(counts.rejected) },
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  { text: "Generated: ", bold: true },
                  { text: new Date().toLocaleString("en-KE") },
                ],
                spacing: { after: 250 },
              }),
              new Table({
                rows,
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                columnWidths: [
                  2000, 2300, 1300, 1000, 650, 1200, 1800, 1200, 2000,
                ],
              }),
              new Paragraph({
                text:
                  "CONFIDENTIAL: This report contains applicant personal information. Share only with authorized personnel.",
                spacing: { before: 250 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(wordDocument);
      const safeCentre = profile.centre.replace(/[^a-z0-9]+/gi, "_");
      const date = new Date().toISOString().slice(0, 10);

      saveAs(
        blob,
        `${safeCentre}_ALL_Applicants_${date}.docx`
      );

      setMessage(
        `Word report prepared with ${exportRows.length} applicant record(s).`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the Word document."
      );
    } finally {
      setExporting(false);
    }
  }

  // ----------------------------------------------------------
  // EXPORT ALL CENTRE APPLICANTS AS CSV
  // Opens directly in Excel and is convenient for large lists.
  // ----------------------------------------------------------

  async function downloadApplicantsCsv() {
    if (exporting) return;

    setError("");
    setMessage("");
    setExporting(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in again before downloading.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("centre, role")
        .eq("id", userData.user.id)
        .single();

      if (
        profileError ||
        profile?.role !== "centre_admin" ||
        profile.centre !== centre
      ) {
        throw new Error("You are not authorized to export these applications.");
      }

      const rows = await fetchAllCentreApplications(
        profile.centre,
        [
          "full_name",
          "email",
          "phone",
          "gender",
          "age",
          "county",
          "industrial_background",
          "status",
          "submitted_at",
        ].join(",")
      );

      if (!rows.length) {
        throw new Error("There are no applications to download.");
      }

      const headers = [
        "Full name",
        "Email",
        "Phone",
        "Gender",
        "Age",
        "County",
        "Industrial background",
        "Status",
        "Submitted",
      ];

      const escapeCsv = (value) => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
      };

      const lines = [
        headers.map(escapeCsv).join(","),
        ...rows.map((item) =>
          [
            item.full_name,
            item.email,
            item.phone,
            item.gender,
            item.age,
            item.county,
            item.industrial_background,
            item.status || "Pending",
            item.submitted_at
              ? new Date(item.submitted_at).toLocaleString("en-KE")
              : "",
          ]
            .map(escapeCsv)
            .join(",")
        ),
      ];

      // UTF-8 BOM improves Unicode handling in Excel.
      const blob = new Blob(
        ["\uFEFF", lines.join("\r\n")],
        { type: "text/csv;charset=utf-8;" }
      );

      const safeCentre = profile.centre.replace(/[^a-z0-9]+/gi, "_");

      saveAs(
        blob,
        `${safeCentre}_ALL_Applicants_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );

      setMessage(`CSV report prepared with ${rows.length} applicant record(s).`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not export the CSV report."
      );
    } finally {
      setExporting(false);
    }
  }

  // ----------------------------------------------------------
  // LOADING / SESSION STATES
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="portal-admin">
        <AdminDashboardStyles />
        <div className="pa-loading">
          <div className="pa-spinner" />
          <strong>Loading centre dashboard</strong>
          <p style={{ color: "#738191" }}>
            Securely retrieving applications from Supabase.
          </p>
        </div>
      </div>
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

  // ----------------------------------------------------------
  // DASHBOARD UI
  // ----------------------------------------------------------

  const tabItems = [
    { name: "All", count: stats.total, icon: "▦" },
    { name: "Pending", count: stats.pending, icon: "◷" },
    { name: "Approved", count: stats.approved, icon: "✓" },
    { name: "Rejected", count: stats.rejected, icon: "×" },
  ];

  const firstItem =
    filteredApplications.length === 0
      ? 0
      : (safePage - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(
    safePage * PAGE_SIZE,
    filteredApplications.length
  );

  return (
    <div className="portal-admin">
      <AdminDashboardStyles />

      <div className="pa-shell">
        <aside className="pa-sidebar">
          <div className="pa-brand">
            <div className="pa-brand-mark">S</div>
            <div>
              <strong>Training Sponsorship</strong>
              <small>ADMINISTRATION</small>
            </div>
          </div>

          <div>
            <div className="pa-nav-label">WORKSPACE</div>

            <nav className="pa-nav">
              <button
                type="button"
                className={activeTab === "All" ? "active" : ""}
                onClick={() => {
                  setActiveTab("All");
                  setMobileMenu(false);
                }}
              >
                <span className="pa-nav-icon">▦</span>
                Dashboard
              </button>

              <button
                type="button"
                className={activeTab === "Pending" ? "active" : ""}
                onClick={() => {
                  setActiveTab("Pending");
                  setMobileMenu(false);
                }}
              >
                <span className="pa-nav-icon">◷</span>
                Pending review
                <span className="pa-nav-count">{stats.pending}</span>
              </button>

              <button
                type="button"
                className={activeTab === "Approved" ? "active" : ""}
                onClick={() => {
                  setActiveTab("Approved");
                  setMobileMenu(false);
                }}
              >
                <span className="pa-nav-icon">✓</span>
                Approved
                <span className="pa-nav-count">{stats.approved}</span>
              </button>

              <button
                type="button"
                className={activeTab === "Rejected" ? "active" : ""}
                onClick={() => {
                  setActiveTab("Rejected");
                  setMobileMenu(false);
                }}
              >
                <span className="pa-nav-icon">×</span>
                Rejected
                <span className="pa-nav-count">{stats.rejected}</span>
              </button>
            </nav>
          </div>

          <div className="pa-sidebar-bottom">
            <div className="pa-nav-label">CENTRE ACCOUNT</div>

            <div className="pa-centre-box">
              <small><span className="pa-centre-dot" /> ACTIVE CENTRE</small>
              <strong>{centre}</strong>
            </div>

            <button
              type="button"
              className="pa-signout"
              onClick={logout}
            >
              ↪ &nbsp; Sign out
            </button>
          </div>
        </aside>

        <div className="pa-main">
          <header className="pa-topbar">
            <div>
              <small>Training Sponsorship / Administration</small>
              <strong>Application management</strong>
            </div>

            <div className="pa-admin-profile">
              <div className="pa-avatar">
                {(adminEmail.charAt(0) || "A").toUpperCase()}
              </div>
              <div className="pa-profile-copy">
                <strong>Centre Administrator</strong>
                <small>{adminEmail || centre}</small>
              </div>
            </div>
          </header>

          <main className="pa-content">
            <div className="pa-page-heading">
              <div>
                <div className="pa-kicker">CENTRE WORKSPACE</div>
                <h1>Good day, Administrator</h1>
                <p>
                  Review applications and manage applicants for{" "}
                  <strong>{centre}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="pa-btn"
                onClick={() => setRefreshKey((value) => value + 1)}
                disabled={loading}
              >
                ↻ &nbsp; Refresh data
              </button>
            </div>

            {error && (
              <div className="pa-notice pa-notice-error" role="alert">
                <strong>Something needs attention.</strong> {error}
              </div>
            )}

            {message && (
              <div className="pa-notice pa-notice-success" role="status">
                ✓ &nbsp; {message}
              </div>
            )}

            <section className="pa-stats">
              <StatCard
                type="all"
                icon="▦"
                label="Total applicants"
                value={stats.total}
                note="All applications for this centre"
              />

              <StatCard
                type="pending"
                icon="◷"
                label="Awaiting review"
                value={stats.pending}
                note="Applications still pending"
              />

              <StatCard
                type="approved"
                icon="✓"
                label="Approved"
                value={stats.approved}
                note="Applications approved"
              />

              <StatCard
                type="rejected"
                icon="×"
                label="Rejected"
                value={stats.rejected}
                note="Applications rejected"
              />
            </section>

            <section className="pa-panel">
              <div className="pa-panel-heading">
                <div>
                  <h2>Applicant register</h2>
                  <p>
                    {stats.total} total record(s) · {stats.withDocuments} with
                    both required documents
                  </p>
                </div>

                <div className="pa-panel-actions">
                  <button
                    type="button"
                    className="pa-btn"
                    onClick={downloadApplicantsCsv}
                    disabled={exporting || stats.total === 0}
                  >
                    ↓ Export CSV
                  </button>

                  <button
                    type="button"
                    className="pa-btn pa-btn-primary"
                    onClick={downloadApplicantsWord}
                    disabled={exporting || stats.total === 0}
                  >
                    {exporting
                      ? "Preparing export..."
                      : "↓ Download all Word"}
                  </button>
                </div>
              </div>

              <div className="pa-filterbar">
                <div className="pa-tabs">
                  {tabItems.map((tab) => (
                    <button
                      key={tab.name}
                      type="button"
                      className={`pa-tab ${
                        activeTab === tab.name ? "active" : ""
                      }`}
                      onClick={() => setActiveTab(tab.name)}
                    >
                      {tab.name}
                      <span className="pa-tab-count">{tab.count}</span>
                    </button>
                  ))}
                </div>

                <div className="pa-search">
                  <span>⌕</span>
                  <input
                    aria-label="Search applicants"
                    placeholder="Search name, email or phone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className="pa-filter-row">
                  <select
                    className="pa-select"
                    aria-label="Filter by county"
                    value={countyFilter}
                    onChange={(event) => setCountyFilter(event.target.value)}
                  >
                    <option value="All">All counties</option>
                    {availableCounties.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="pa-empty">
                  <div className="pa-empty-icon">▤</div>
                  <h3>
                    {applications.length === 0
                      ? "No applications yet"
                      : "No matching applicants"}
                  </h3>
                  <p>
                    {applications.length === 0
                      ? `Applications submitted to ${centre} will appear here.`
                      : "Try another search term or change the selected filters."}
                  </p>

                  {(search || countyFilter !== "All" || activeTab !== "All") && (
                    <button
                      type="button"
                      className="pa-btn"
                      onClick={() => {
                        setSearch("");
                        setCountyFilter("All");
                        setActiveTab("All");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="pa-table-scroll">
                    <table className="pa-table">
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Contact</th>
                          <th>County</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedApplications.map((application) => {
                          const initials = String(application.full_name || "A")
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0] || "")
                            .join("")
                            .toUpperCase();

                          return (
                            <tr key={application.id}>
                              <td>
                                <div className="pa-applicant">
                                  <div className="pa-applicant-avatar">
                                    {initials || "A"}
                                  </div>

                                  <div>
                                    <div className="pa-applicant-name">
                                      {application.full_name || "Unnamed applicant"}
                                    </div>
                                    <div className="pa-secondary-text">
                                      {application.gender || "Gender not recorded"}
                                      {application.age
                                        ? ` · ${application.age} years`
                                        : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div style={{ marginBottom: 4 }}>
                                  {application.email || "—"}
                                </div>
                                <div className="pa-secondary-text">
                                  {application.phone || "—"}
                                </div>
                              </td>

                              <td>{application.county || "—"}</td>

                              <td>
                                <div>{formatDate(application.submitted_at)}</div>
                              </td>

                              <td>
                                <StatusBadge
                                  status={application.status || "Pending"}
                                />
                              </td>

                              <td>
                                <div className="pa-row-actions">
                                  <button
                                    type="button"
                                    className="pa-btn pa-btn-sm"
                                    onClick={() => setSelectedApplicant(application)}
                                  >
                                    View details
                                  </button>

                                  {application.status !== "Approved" && (
                                    <button
                                      type="button"
                                      className="pa-icon-btn"
                                      title="Approve applicant"
                                      aria-label={`Approve ${application.full_name}`}
                                      disabled={updatingId === application.id}
                                      onClick={() =>
                                        updateStatus(application.id, "Approved")
                                      }
                                    >
                                      ✓
                                    </button>
                                  )}

                                  {application.status !== "Rejected" && (
                                    <button
                                      type="button"
                                      className="pa-icon-btn"
                                      title="Reject applicant"
                                      aria-label={`Reject ${application.full_name}`}
                                      disabled={updatingId === application.id}
                                      onClick={() =>
                                        updateStatus(application.id, "Rejected")
                                      }
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pa-pagination">
                    <div className="pa-pagination-text">
                      Showing {firstItem}–{lastItem} of{" "}
                      {filteredApplications.length} matching applicants
                    </div>

                    <div className="pa-pagination-buttons">
                      <button
                        type="button"
                        className="pa-page-number"
                        disabled={safePage <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      {Array.from(
                        { length: pageCount },
                        (_, index) => index + 1
                      )
                        .filter(
                          (number) =>
                            number === 1 ||
                            number === pageCount ||
                            Math.abs(number - safePage) <= 1
                        )
                        .map((number, index, visiblePages) => (
                          <span
                            key={number}
                            style={{ display: "contents" }}
                          >
                            {index > 0 &&
                              number - visiblePages[index - 1] > 1 && (
                                <span className="pa-secondary-text">…</span>
                              )}

                            <button
                              type="button"
                              className={`pa-page-number ${
                                number === safePage ? "active" : ""
                              }`}
                              onClick={() => setPage(number)}
                              aria-label={`Page ${number}`}
                              aria-current={
                                number === safePage ? "page" : undefined
                              }
                            >
                              {number}
                            </button>
                          </span>
                        ))}

                      <button
                        type="button"
                        className="pa-page-number"
                        disabled={safePage >= pageCount}
                        onClick={() =>
                          setPage((value) => Math.min(pageCount, value + 1))
                        }
                        aria-label="Next page"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <p className="pa-footer-note">
              Private administrator workspace · Centre-restricted access ·
              Applicant records and downloaded reports contain confidential
              personal information. Share only with authorized personnel.
            </p>
          </main>
        </div>
      </div>

      {selectedApplicant && (
        <ApplicantModal
          application={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={updateStatus}
          updating={updatingId === selectedApplicant.id}
          onOpenDocument={openDocument}
        />
      )}

      {openingDocument && (
        <div className="pa-modal-backdrop">
          <div className="pa-modal" style={{ maxWidth: 320, padding: 25 }}>
            <div className="pa-spinner" />
            <p style={{ textAlign: "center", marginBottom: 0 }}>
              Preparing secure document link...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUCCESS PAGE
// ============================================================

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
          Your application has been submitted successfully. Keep your original
          documents available if they are requested during the selection process.
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
          Please keep your original documents available if they are requested
          during the selection process.
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

// ============================================================
// SIGN OUT WHEN LEAVING ADMIN ROUTES
// ============================================================

function AdminAutoLogout() {
  const location = useLocation();
  const wasAdmin = useRef(location.pathname.startsWith("/admin"));

  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");

    // Only sign out when navigating from an admin route to a non-admin route.
    // Do not immediately sign out on an ordinary home-page visit.
    if (wasAdmin.current && !isAdmin) {
      supabase.auth.signOut();
    }

    wasAdmin.current = isAdmin;
  }, [location.pathname]);

  return null;
}

// ============================================================
// APP ROUTES
// ============================================================

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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </>
  );
}