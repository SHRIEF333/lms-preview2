const STORAGE_KEY = "lms:users";
const COURSES_STORAGE_KEY = "lms:courses";

const SEED_USERS = {
  أحمد_علي: {
    name: "أحمد علي",
    points: 120,
    history: [
      {
        id: "s1",
        delta: 50,
        reason: "إكمال وحدة Grammar 1",
        date: "2026-07-01",
      },
      {
        id: "s2",
        delta: 70,
        reason: "درجة كاملة في اختبار Reading",
        date: "2026-07-15",
      },
    ],
    completedCourses: {},
  },

  سارة_محمد: {
    name: "سارة محمد",
    points: 85,
    history: [
      {
        id: "s3",
        delta: 85,
        reason: "المشاركة في تدريبات Writing",
        date: "2026-07-10",
      },
    ],
    completedCourses: {},
  },
};

const SEED_COURSES = [
  {
    id: "python-basics",
    title: "Python Basics",
    category: "Programming",
    description:
      "أساسيات برمجة بايثون مع فيديوهات تعليمية وتطبيق عملي.",
    videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
    pointsReward: 200,
    quiz: [
      {
        question: "ما الهدف الرئيسي من print()؟",
        options: [
          "عرض النتيجة على الشاشة",
          "حذف الملف",
          "تغيير نوع المتغير",
        ],
        correctIndex: 0,
      },
      {
        question: "أي اسم متغير صحيح؟",
        options: [
          "2name",
          "name_2",
          "name-2",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "english-grammar",
    title: "English Grammar Essentials",
    category: "English",
    description:
      "مراجعة أساسية لقواعد اللغة الإنجليزية مع فيديوهات واضحة.",
    videoUrl: "https://www.youtube.com/embed/2Vjv0M1m5vY",
    pointsReward: 200,
    quiz: [
      {
        question: "أي جملة صحيحة لغوياً؟",
        options: [
          "She go to school every day.",
          "She goes to school every day.",
          "She going to school every day.",
        ],
        correctIndex: 1,
      },
      {
        question: "ما زمن الجملة 'I have finished my homework'؟",
        options: [
          "Present Simple",
          "Present Perfect",
          "Past Continuous",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "ui-design",
    title: "UI Design Fundamentals",
    category: "Design",
    description:
      "مبادئ تصميم واجهات المستخدم وتناسق الألوان والهوية البصرية.",
    videoUrl: "https://www.youtube.com/embed/3fQK8eYjA8E",
    pointsReward: 200,
    quiz: [
      {
        question: "ما الهدف من التباين في الألوان؟",
        options: [
          "إضافة تعقيد للواجهة",
          "تحديد العناصر المهمة ووضوحها",
          "تقليل مساحة الشاشة",
        ],
        correctIndex: 1,
      },
      {
        question: "ما الذي يساعد المستخدم على فهم الواجهة بسرعة؟",
        options: [
          "تكرار العناصر بشكل عشوائي",
          "التناسق والوضوح في التصميم",
          "إخفاء الأزرار الرئيسة",
        ],
        correctIndex: 1,
      },
    ],
  },
];

export function normalizeKey(name) {
  return String(name).trim().replace(/\s+/g, "_");
}

export function getCourses() {
  try {
    const saved = localStorage.getItem(COURSES_STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify(SEED_COURSES)
    );

    return SEED_COURSES;
  } catch (error) {
    console.error("تعذر تحميل الكورسات:", error);
    return SEED_COURSES;
  }
}

export function saveCourses(courses) {
  try {
    localStorage.setItem(
      COURSES_STORAGE_KEY,
      JSON.stringify(courses)
    );
    return true;
  } catch (error) {
    console.error("تعذر حفظ الكورسات:", error);
    return false;
  }
}

export function getUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(SEED_USERS)
    );

    return SEED_USERS;
  } catch (error) {
    console.error("تعذر تحميل بيانات الطلاب:", error);
    return SEED_USERS;
  }
}

export function saveUsers(users) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(users)
    );

    return true;
  } catch (error) {
    console.error("تعذر حفظ بيانات الطلاب:", error);
    return false;
  }
}

export function subscribeToUsers(callback) {
  const handleStorage = (event) => {
    if (
      event.key === STORAGE_KEY &&
      event.newValue
    ) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (error) {
        console.error(
          "تعذر قراءة البيانات الجديدة:",
          error
        );
      }
    }
  };

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}

export function subscribeToCourses(callback) {
  const handleStorage = (event) => {
    if (
      event.key === COURSES_STORAGE_KEY &&
      event.newValue
    ) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (error) {
        console.error(
          "تعذر قراءة بيانات الكورسات الجديدة:",
          error
        );
      }
    }
  };

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}