import { useEffect, useState } from "react";
import {
  getCourses,
  getUsers,
  saveUsers,
  subscribeToCourses,
  subscribeToUsers,
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

function nextLevel(points) {
  const index = LEVELS.findIndex(
    (item) => item === getLevel(points)
  );

  return LEVELS[index + 1] || null;
}

export default function Student({
  studentKey,
  onLogout,
}) {
  const [users, setUsers] = useState(() => getUsers());
  const [courses, setCourses] = useState(() => getCourses());
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [feedback, setFeedback] = useState("");

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

  const user = users[studentKey];

  if (!user) {
    return (
      <div className="student-error">
        <h2>الطالب غير موجود</h2>

        <button
          className="btn btn-outline"
          onClick={onLogout}
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  const level = getLevel(user.points);
  const next = nextLevel(user.points);
  const completedCourses = user.completedCourses || {};
  const progress = next
    ? Math.min(
        100,
        ((user.points - level.min) /
          (next.min - level.min)) *
          100
      )
    : 100;

  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) ||
    courses[0];

  function handleQuizAnswer(courseId, questionIndex, optionIndex) {
    setQuizAnswers((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        [questionIndex]: optionIndex,
      },
    }));
  }

  function submitCourse(course) {
    if (completedCourses[course.id]) {
      setFeedback(
        `هذا الكورس مكتمل بالفعل، وقد استلمت ${course.pointsReward} نقطة.`
      );
      return;
    }

    const answers = quizAnswers[course.id] || {};
    const allAnswered = course.quiz.every(
      (_, index) => answers[index] !== undefined
    );

    if (!allAnswered) {
      setFeedback("أجب على جميع أسئلة الكورس أولاً قبل الإكمال.");
      return;
    }

    const correctCount = course.quiz.filter(
      (question, index) =>
        Number(answers[index]) === question.correctIndex
    ).length;

    if (correctCount !== course.quiz.length) {
      setFeedback("الإجابة غير صحيحة، حاول مرة أخرى بعد مراجعة الفيديو.");
      return;
    }

    const updatedUsers = {
      ...users,
      [studentKey]: {
        ...user,
        points: user.points + course.pointsReward,
        history: [
          {
            id: `course-${Date.now()}`,
            delta: course.pointsReward,
            reason: `إكمال كورس ${course.title}`,
            date: new Date().toISOString().slice(0, 10),
          },
          ...user.history,
        ],
        completedCourses: {
          ...(user.completedCourses || {}),
          [course.id]: true,
        },
      },
    };

    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setFeedback(
      `تم إكمال الكورس ${course.title} وحصلت على ${course.pointsReward} نقطة.`
    );
  }

  return (
    <div className="dash">
      <TopBar
        title={`أهلاً، ${user.name}`}
        tag="STUDENT"
        onLogout={onLogout}
      />

      <div className="dash-container">
        <div className="stat-grid three">
          <div className="stat-cell">
            <span className="num" dir="ltr">
              {user.points}
            </span>
            <div className="desc">إجمالي نقاطك الحالية</div>
          </div>

          <div className="stat-cell">
            <span className="num" style={{ color: level.color }}>
              {level.name}
            </span>
            <div className="desc">مستواك الحالي في المنصة</div>
          </div>

          <div className="stat-cell">
            <span className="num" dir="ltr">
              {user.history.length}
            </span>
            <div className="desc">عدد مرات حصولك على نقاط</div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 28 }}>
          <div className="panel-title">التقدّم نحو المستوى التالي</div>

          <div className="level-row">
            <span style={{ color: level.color }}>{level.name}</span>
            <span className="dim">{next ? next.name : "أعلى مستوى"}</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${level.color}, ${next ? next.color : level.color})`,
              }}
            />
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 48 }}>
          COURSES
        </div>

        <div className="course-grid">
          {courses.map((course) => {
            const isCompleted = Boolean(completedCourses[course.id]);

            return (
              <div
                className={`course-card ${selectedCourse?.id === course.id ? "selected" : ""}`}
                key={course.id}
              >
                <div className="course-info">
                  <div className="course-name">{course.title}</div>
                  <div className="course-meta">{course.category}</div>
                </div>

                <div className="course-actions">
                  <div
                    className={
                      "course-status " +
                      (isCompleted ? "done" : "todo")
                    }
                  >
                    {isCompleted ? "مكتمل" : "متاح"}
                  </div>

                  <button
                    className="btn btn-outline small"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    {isCompleted ? "عرض" : "اختيار"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCourse && (
          <div className="panel course-detail" style={{ marginTop: 28 }}>
            <div className="course-detail-head">
              <div>
                <div className="panel-title">{selectedCourse.category}</div>
                <h3 className="course-detail-title">{selectedCourse.title}</h3>
              </div>

              <div className="course-reward">
                +{selectedCourse.pointsReward} نقطة
              </div>
            </div>

            <p className="course-description">{selectedCourse.description}</p>

            <div className="video-wrap">
              <iframe
                src={selectedCourse.videoUrl}
                title={selectedCourse.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="quiz-block">
              {selectedCourse.quiz.map((question, questionIndex) => (
                <div className="quiz-question" key={questionIndex}>
                  <div className="quiz-question-text">
                    {question.question}
                  </div>

                  <div className="quiz-options">
                    {question.options.map((option, optionIndex) => (
                      <label className="quiz-option" key={optionIndex}>
                        <input
                          type="radio"
                          name={`${selectedCourse.id}-${questionIndex}`}
                          checked={
                            Number(quizAnswers[selectedCourse.id]?.[questionIndex]) === optionIndex
                          }
                          onChange={() =>
                            handleQuizAnswer(
                              selectedCourse.id,
                              questionIndex,
                              optionIndex
                            )
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {feedback && <div className="course-feedback">{feedback}</div>}

            <button
              className="btn btn-amber"
              onClick={() => submitCourse(selectedCourse)}
              disabled={Boolean(completedCourses[selectedCourse.id])}
            >
              {completedCourses[selectedCourse.id]
                ? "تم إكمال الكورس"
                : "إكمال الكورس والحصول على النقاط"}
            </button>
          </div>
        )}

        <div className="section-label" style={{ marginTop: 48 }}>
          POINTS LOG
        </div>

        <div className="panel">
          {user.history.length === 0 ? (
            <div className="empty">
              لسه معندكش أي نقاط مسجّلة. أول نقطة هتظهر هنا بمجرد ما الأدمن يضيفها.
            </div>
          ) : (
            user.history.map((item) => (
              <div className="log-row" key={item.id}>
                <span
                  className={"delta " + (item.delta >= 0 ? "pos" : "neg")}
                  dir="ltr"
                >
                  {item.delta >= 0 ? "+" : ""}
                  {item.delta}
                </span>

                <span className="reason">{item.reason}</span>
                <span className="date" dir="ltr">{item.date}</span>
              </div>
            ))
          )}
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