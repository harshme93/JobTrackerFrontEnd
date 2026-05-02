import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

// ─── Replace with your Firebase config ───
const firebaseConfig = {
  apiKey: "AIzaSyBvlabnTzGpTuF4urTcxyvH4jAz28B1Dj8",
  authDomain: "hard-c8bbe.firebaseapp.com",
  projectId: "hard-c8bbe",
  storageBucket: "hard-c8bbe.firebasestorage.app",
  messagingSenderId: "11014720414",
  appId: "1:11014720414:web:3f0ec4d226127860846481",
  measurementId: "G-EDT7YSN8RK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [companies, setCompanies] = useState([]);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [newCompany, setNewCompany] = useState({ name: "", url: "", titles: "" });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: "", url: "", titles: "" });
  const [status, setStatus] = useState("");
  const [lastRun, setLastRun] = useState(null);

  // Listen to companies collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCompanies(data);
    });
    return unsub;
  }, []);

  // Load email setting
  useEffect(() => {
    getDoc(doc(db, "settings", "notification")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEmail(data.email || "");
        setSavedEmail(data.email || "");
      }
    });
  }, []);

  // Load last run timestamp
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "last_run"), (snap) => {
      if (snap.exists()) {
        setLastRun(snap.data());
      }
    });
    return unsub;
  }, []);

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2000);
  };

  const addCompany = async () => {
    if (!newCompany.name || !newCompany.url || !newCompany.titles) {
      flash("Fill all fields");
      return;
    }
    const id = newCompany.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    await setDoc(doc(db, "companies", id), {
      name: newCompany.name.trim(),
      url: newCompany.url.trim(),
      titles: newCompany.titles.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    });
    setNewCompany({ name: "", url: "", titles: "" });
    flash("Company added");
  };

  const deleteCompany = async (id) => {
    await deleteDoc(doc(db, "companies", id));
    flash("Deleted");
  };

  const startEdit = (company) => {
    setEditingId(company.id);
    setEditData({
      name: company.name,
      url: company.url,
      titles: company.titles.join(", "),
    });
  };

  const saveEdit = async (id) => {
    await setDoc(doc(db, "companies", id), {
      name: editData.name.trim(),
      url: editData.url.trim(),
      titles: editData.titles.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    });
    setEditingId(null);
    flash("Updated");
  };

  const saveEmail = async () => {
    await setDoc(doc(db, "settings", "notification"), { email: email.trim() });
    setSavedEmail(email.trim());
    flash("Email saved");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.h1}>Job Tracker</h1>

      {lastRun && (
        <div style={styles.lastRun}>
          Last checked: {new Date(lastRun.timestamp).toLocaleString()} — {lastRun.jobs_found} new job(s) found
        </div>
      )}

      {status && <div style={styles.flash}>{status}</div>}

      {/* ── Add Company ── */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Add Company</h2>
        <input
          style={styles.input}
          placeholder="Company name (e.g. Liberty Mutual)"
          value={newCompany.name}
          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Careers page URL"
          value={newCompany.url}
          onChange={(e) => setNewCompany({ ...newCompany, url: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Job titles (comma separated: senior analyst, product manager)"
          value={newCompany.titles}
          onChange={(e) => setNewCompany({ ...newCompany, titles: e.target.value })}
        />
        <button style={styles.btn} onClick={addCompany}>
          Add Company
        </button>
      </div>

      {/* ── Company List ── */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Tracked Companies ({companies.length})</h2>
        {companies.length === 0 && <p style={styles.empty}>No companies added yet.</p>}
        {companies.map((c) => (
          <div key={c.id} style={styles.companyRow}>
            {editingId === c.id ? (
              <div style={styles.editBlock}>
                <input
                  style={styles.input}
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
                <input
                  style={styles.input}
                  value={editData.url}
                  onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                />
                <input
                  style={styles.input}
                  value={editData.titles}
                  onChange={(e) => setEditData({ ...editData, titles: e.target.value })}
                />
                <div style={styles.btnRow}>
                  <button style={styles.btnSmall} onClick={() => saveEdit(c.id)}>Save</button>
                  <button style={{ ...styles.btnSmall, ...styles.btnCancel }} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <strong>{c.name}</strong>
                  <div style={styles.url}>{c.url}</div>
                  <div style={styles.titles}>
                    {c.titles.map((t, i) => (
                      <span key={i} style={styles.tag}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={styles.btnRow}>
                  <button style={styles.btnSmall} onClick={() => startEdit(c)}>Edit</button>
                  <button style={{ ...styles.btnSmall, ...styles.btnDanger }} onClick={() => deleteCompany(c.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Notification Settings ── */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Notification Settings</h2>
        <input
          style={styles.input}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button style={styles.btn} onClick={saveEmail}>
          Save Email
        </button>
        {savedEmail && <p style={styles.saved}>Notifications → {savedEmail}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 640, margin: "0 auto", padding: "2rem 1rem", fontFamily: "'IBM Plex Sans', sans-serif", color: "#1a1a1a" },
  h1: { fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" },
  lastRun: { fontSize: "0.8rem", color: "#888", marginBottom: "1.25rem" },
  h2: { fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" },
  card: { background: "#f7f7f7", borderRadius: 8, padding: "1.25rem", marginBottom: "1rem" },
  input: { width: "100%", padding: "0.6rem 0.75rem", border: "1px solid #ddd", borderRadius: 6, marginBottom: "0.5rem", fontSize: "0.9rem", boxSizing: "border-box" },
  btn: { background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "0.6rem 1.25rem", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 },
  btnSmall: { background: "#111", color: "#fff", border: "none", borderRadius: 4, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", marginRight: "0.5rem" },
  btnCancel: { background: "#888" },
  btnDanger: { background: "#c0392b" },
  btnRow: { display: "flex", marginTop: "0.5rem" },
  companyRow: { borderBottom: "1px solid #e0e0e0", padding: "0.75rem 0" },
  url: { fontSize: "0.8rem", color: "#666", marginTop: "0.2rem", wordBreak: "break-all" },
  titles: { marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" },
  tag: { background: "#e0e0e0", borderRadius: 4, padding: "0.15rem 0.5rem", fontSize: "0.75rem" },
  editBlock: { width: "100%" },
  empty: { color: "#999", fontSize: "0.9rem" },
  flash: { background: "#111", color: "#fff", padding: "0.5rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.85rem", textAlign: "center" },
  saved: { marginTop: "0.5rem", fontSize: "0.85rem", color: "#27ae60" },
};

export default App;
