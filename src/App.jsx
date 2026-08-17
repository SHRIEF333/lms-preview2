import { useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import {
  getUsers,
  hydrateCoursesFromSupabase,
  hydrateUsersFromSupabase,
  normalizeKey,
} from "./storage";
import Student from "./pages/Student";
import Admin from "./pages/admin";

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    hydrateUsersFromSupabase();
    hydrateCoursesFromSupabase();
  }, []);

  const [studentKey, setStudentKey] = useState(() => {
    return sessionStorage.getItem("lms:studentKey") || "";
  });

  const [adminLoggedIn, setAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem("lms:adminLoggedIn") === "true";
  });

  const [nameInput, setNameInput] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [error, setError] = useState("");

  function handleStudentLogin() {
    const name = nameInput.trim();

    if (!name) {
      setError("اكتب اسمك الأول");
      return;
    }

    const users = getUsers();
    const normalizedInput = normalizeKey(name);
    const matchedKey =
      users[normalizedInput]
        ? normalizedInput
        : Object.keys(users).find((key) => {
            const candidate = users[key];
            return (
              normalizeKey(candidate?.name || "") === normalizedInput ||
              key === normalizedInput ||
              String(candidate?.name || "").trim() === name
            );
          });

    if (!matchedKey) {
      setError("الطالب غير موجود. تأكد من كتابة الاسم كما سجله الأدمن.");
      return;
    }

    sessionStorage.setItem("lms:studentKey", matchedKey);
    setStudentKey(matchedKey);
    setError("");
    navigate("/student");
  }

  function handleAdminLogin() {
    const ADMIN_PASSWORD = "Shifo123@";

    if (adminPassword !== ADMIN_PASSWORD) {
      setError("كلمة المرور غير صحيحة");
      return;
    }

    sessionStorage.setItem("lms:adminLoggedIn", "true");
    setAdminLoggedIn(true);
    setError("");
    setAdminPassword("");
    setShowAdminLogin(false);
    navigate("/admin");
  }

  function logout() {
    sessionStorage.removeItem("lms:studentKey");
    sessionStorage.removeItem("lms:adminLoggedIn");
    setStudentKey("");
    setAdminLoggedIn(false);
    setNameInput("");
    setAdminPassword("");
    setShowAdminLogin(false);
    setError("");
    navigate("/");
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="login-wrap">
            <div className="hud-corner tl" />
            <div className="hud-corner tr" />
            <div className="hud-corner bl" />
            <div className="hud-corner br" />

            <div className="login-panel">
              <div className="eyebrow">MARK · نظام إدارة التعلّم</div>

              <h1>
                منصتك للتفوّق في <span className="accent">جميع المجالات</span>
              </h1>

              <p className="sub">
                سجّل دخولك كطالب لمتابعة نقاطك وتقدّمك، أو كأدمن لإدارة الطلاب
                وتوزيع النقاط.
              </p>

              <div className="login-block">
                <div className="block-label">دخول الطالب</div>

                <div className="input-row">
                  <input
                    className="text-input"
                    placeholder="اكتب اسمك"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleStudentLogin();
                      }
                    }}
                  />

                  <button className="btn btn-amber" onClick={handleStudentLogin}>
                    دخول →
                  </button>
                </div>

                {error && !showAdminLogin && <div className="error-text">{error}</div>}
              </div>

              <div className="divider">
                <span>أو</span>
              </div>

              {!showAdminLogin ? (
                <button
                  className="btn btn-outline full"
                  onClick={() => {
                    setShowAdminLogin(true);
                    setError("");
                  }}
                >
                  دخول كأدمن
                </button>
              ) : (
                <div>
                  <div className="block-label">كلمة مرور الأدمن</div>

                  <input
                    className="text-input"
                    type="password"
                    placeholder="اكتب كلمة المرور"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAdminLogin();
                      }
                    }}
                    style={{ width: "100%", marginBottom: "10px" }}
                  />

                  <div className="input-row">
                    <button className="btn btn-amber full" onClick={handleAdminLogin}>
                      دخول الأدمن
                    </button>
                  </div>

                  {error && <div className="error-text">{error}</div>}

                  <button
                    className="btn btn-outline full"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword("");
                      setError("");
                    }}
                    style={{ marginTop: "10px" }}
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <Route
        path="/student"
        element={
          studentKey ? (
            <Student studentKey={studentKey} onLogout={logout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          adminLoggedIn ? (
            <Admin onLogout={logout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
