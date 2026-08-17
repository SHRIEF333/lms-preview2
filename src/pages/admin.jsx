import { useEffect, useState } from "react";
import {
  getCourses,
  getUsers,
  saveCourses,
  saveUsers,
  subscribeToCourses,
  subscribeToUsers,
  normalizeKey,
} from "../storage";

const LEVELS = [
  { min: 0, name: "مبتدئ", color: "#8d8578" },
  { min: 50, name: "متمرس", color: "#2fd6c4" },
  { min: 150, name: "متقدم", color: "#e0913f" },
  { min: 300, name: "خبير", color: "#ff6b6b" },
];

function getLevel(points) {
  let level = LEVELS[0];

  for (const item of LEVELS) {
    if (points >= item.min) {
      level = item;
    }
  }

  return level;
}

export default function Admin({ onLogout }) {
  const [users, setUsers] = useState(() => getUsers());
  const [courses, setCourses] = useState(() => getCourses());

  const [amounts, setAmounts] = useState({});
  const [reasons, setReasons] = useState({});
  const [newUserName, setNewUserName] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState("");
  const [newCourseVideoUrl, setNewCourseVideoUrl] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseReward, setNewCourseReward] = useState("200");

  useEffect(() => {
    const unsubscribeUsers = subscribeToUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });

    const unsubscribeCourses = subscribeToCourses((updatedCourses) => {
      setCourses(updatedCourses);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCourses();
    };
  }, []);

  function addPoints(key) {
    const amount = Number(amounts[key]);

    if (!amount || isNaN(amount)) {
      return;
    }

    const user = users[key];

    if (!user) {
      return;
    }

    const entry = {
      id: "h" + Date.now() + Math.random().toString(36).slice(2, 6),
      delta: amount,
      reason: reasons[key]?.trim() || (amount > 0 ? "نقاط إضافية" : "خصم نقاط"),
      date: new Date().toISOString().slice(0, 10),
    };

    const updatedUsers = {
      ...users,
      [key]: {
        ...user,
        points: Math.max(0, user.points + amount),
        history: [entry, ...user.history],
      },
    };

    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setAmounts({ ...amounts, [key]: "" });
    setReasons({ ...reasons, [key]: "" });
  }

  function addNewUser() {
    const cleanName = newUserName.trim();

    if (!cleanName) return;

    const key = normalizeKey(cleanName);

    if (users[key]) {
      alert("الطالب موجود بالفعل");
      return;
    }

    const updatedUsers = {
      ...users,
      [key]: {
        name: cleanName,
        points: 0,
        history: [],
        completedCourses: {},
      },
    };

    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setNewUserName("");
  }

  function deleteUser(key) {
    if (!users[key]) return;

    const confirmed = window.confirm(`هل تريد حذف الطالب ${users[key].name}؟`);

    if (!confirmed) return;

    const { [key]: removedUser, ...remainingUsers } = users;
    const updatedUsers = remainingUsers;

    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    setAmounts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setReasons((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addNewCourse() {
    const title = newCourseTitle.trim();
    const category = newCourseCategory.trim();
    const videoUrl = newCourseVideoUrl.trim();
    const description = newCourseDescription.trim();
    const reward = Number(newCourseReward);

    if (!title || !category || !videoUrl || !reward || isNaN(reward)) {
      alert("املأ كل الحقول المطلوبة: عنوان، قسم، رابط الفيديو، ورمز المكافأة.");
      return;
    }

    const updatedCourses = [
      ...courses,
      {
        id: normalizeKey(`${title}-${category}`),
        title,
        category,
        description: description || "دورة جديدة في المنصة.",
        videoUrl,
        pointsReward: reward,
        quiz: [
          {
            question: `ما الهدف الرئيسي من كورس ${title}؟`,
            options: [
              "فهم الموضوع بشكل صحيح",
              "تجاهل المحتوى",
              "حذف الدروس",
            ],
            correctIndex: 0,
          },
          {
            question: "هل أكملت الفيديو الخاص بالكورس؟",
            options: ["نعم", "لا"],
            correctIndex: 0,
          },
        ],
      },
    ];

    saveCourses(updatedCourses);
    setCourses(updatedCourses);
    setNewCourseTitle("");
    setNewCourseCategory("");
    setNewCourseVideoUrl("");
    setNewCourseDescription("");
    setNewCourseReward("200");
  }

  const entries = Object.entries(users).sort((a, b) => b[1].points - a[1].points);
  const totalPoints = entries.reduce((total, [, user]) => total + user.points, 0);

  return (
    <div className="dash">
      <TopBar title="لوحة تحكم الأدمن" tag="ADMIN" onLogout={onLogout} />

      <div className="dash-container">
        <div className="stat-grid three">
          <div className="stat-cell">
            <span className="num" dir="ltr">{entries.length}</span>
            <div className="desc">إجمالي عدد الطلاب</div>
          </div>

          <div className="stat-cell">
            <span className="num" dir="ltr">{totalPoints}</span>
            <div className="desc">إجمالي النقاط الموزعة</div>
          </div>

          <div className="stat-cell">
            <span className="num" dir="ltr">{entries[0]?.[1].points ?? 0}</span>
            <div className="desc">أعلى رصيد نقاط</div>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 48 }}>
          ADD STUDENT
        </div>

        <div className="panel">
          <div className="input-row">
            <input
              className="text-input"
              placeholder="اسم طالب جديد"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addNewUser();
              }}
            />

            <button className="btn btn-outline" onClick={addNewUser}>
              إضافة طالب
            </button>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 48 }}>
          ADD COURSE
        </div>

        <div className="panel">
          <div className="input-row stack">
            <input
              className="text-input"
              placeholder="عنوان الكورس"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
            />

            <input
              className="text-input"
              placeholder="اسم القسم مثل Programming / English"
              value={newCourseCategory}
              onChange={(e) => setNewCourseCategory(e.target.value)}
            />

            <input
              className="text-input"
              placeholder="رابط فيديو YouTube Embed"
              value={newCourseVideoUrl}
              onChange={(e) => setNewCourseVideoUrl(e.target.value)}
            />

            <input
              className="text-input"
              type="number"
              placeholder="عدد نقاط المكافأة"
              value={newCourseReward}
              onChange={(e) => setNewCourseReward(e.target.value)}
            />

            <textarea
              className="text-input textarea-input"
              placeholder="وصف الكورس (اختياري)"
              value={newCourseDescription}
              onChange={(e) => setNewCourseDescription(e.target.value)}
            />

            <button className="btn btn-amber" onClick={addNewCourse}>
              إضافة كورس
            </button>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 48 }}>
          MANAGE STUDENTS
        </div>

        <div className="admin-list">
          {entries.map(([key, user]) => {
            const level = getLevel(user.points);

            return (
              <div className="admin-row" key={key}>
                <div className="admin-row-top">
                  <div className="admin-user">
                    <div className="admin-name">{user.name}</div>
                    <div className="admin-level" style={{ color: level.color }}>
                      {level.name}
                    </div>
                  </div>

                  <div className="admin-points" dir="ltr">
                    {user.points} pts
                  </div>
                </div>

                <div className="admin-row-form">
                  <input
                    className="text-input small"
                    type="number"
                    placeholder="النقاط (+ أو -)"
                    value={amounts[key] || ""}
                    onChange={(e) =>
                      setAmounts({ ...amounts, [key]: e.target.value })
                    }
                  />

                  <input
                    className="text-input small grow"
                    placeholder="سبب النقاط (اختياري)"
                    value={reasons[key] || ""}
                    onChange={(e) =>
                      setReasons({ ...reasons, [key]: e.target.value })
                    }
                  />

                  <button className="btn btn-amber small" onClick={() => addPoints(key)}>
                    تطبيق
                  </button>

                  <button className="btn btn-danger small" onClick={() => deleteUser(key)}>
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, tag, onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="logo">
          MARK<span>·</span>LMS
        </div>

        <div className="topbar-right">
          <span className="role-tag">{tag}</span>
          <span className="topbar-title">{title}</span>

          <button className="btn btn-outline small" onClick={onLogout}>
            تسجيل خروج
          </button>
        </div>
      </div>
    </div>
  );
}