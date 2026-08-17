import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "lms:users";
const COURSES_STORAGE_KEY = "lms:courses";
const SHARED_CHANNEL = "lms_shared_channel";
const SHARED_SYNC_KEY = "lms:sync";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function hasSupabaseConfig() {
  return Boolean(supabase);
}

function emitSharedUpdate(kind) {
  const payload = {
    kind,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(SHARED_SYNC_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("تعذر نشر تحديث الحالة المشتركة:", error);
  }

  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(SHARED_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    } catch (error) {
      console.warn("تعذر استخدام BroadcastChannel:", error);
    }
  }
}

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

export async function hydrateCoursesFromSupabase() {
  if (!supabase) {
    return getCourses();
  }

  const { data, error } = await supabase.from("courses").select("*");

  if (error) {
    console.error("تعذر جلب الكورسات من Supabase:", error);
    return getCourses();
  }

  if (!data || data.length === 0) {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(SEED_COURSES));
    return SEED_COURSES;
  }

  const normalized = data.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description ?? "",
    videoUrl: row.video_url ?? row.videoUrl,
    pointsReward: Number(row.points_reward ?? row.pointsReward ?? 200),
    quiz: Array.isArray(row.quiz) ? row.quiz : [],
  }));

  localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
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
    emitSharedUpdate("courses");

    if (supabase) {
      const rows = courses.map((course) => ({
        id: course.id,
        title: course.title,
        category: course.category,
        description: course.description,
        video_url: course.videoUrl,
        points_reward: Number(course.pointsReward ?? 0),
        quiz: course.quiz,
      }));

      supabase
        .from("courses")
        .upsert(rows, { onConflict: "id" })
        .then(({ error }) => {
          if (error) {
            console.error("تعذر مزامنة الكورسات مع Supabase:", error);
          }
        });
    }

    return true;
  } catch (error) {
    console.error("تعذر حفظ الكورسات:", error);
    return false;
  }
}

export async function hydrateUsersFromSupabase() {
  if (!supabase) {
    return getUsers();
  }

  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    console.error("تعذر جلب الطلاب من Supabase:", error);
    return getUsers();
  }

  if (!data || data.length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }

  const normalized = {};

  data.forEach((row) => {
    normalized[row.id] = {
      name: row.name,
      points: Number(row.points ?? 0),
      history: Array.isArray(row.history) ? row.history : [],
      completedCourses: row.completed_courses ?? row.completedCourses ?? {},
    };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
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
    emitSharedUpdate("users");

    if (supabase) {
      const rows = Object.entries(users).map(([id, user]) => ({
        id,
        name: user.name,
        points: Number(user.points ?? 0),
        history: user.history ?? [],
        completed_courses: user.completedCourses ?? {},
      }));

      supabase
        .from("users")
        .upsert(rows, { onConflict: "id" })
        .then(({ error }) => {
          if (error) {
            console.error("تعذر مزامنة الطلاب مع Supabase:", error);
          }
        });
    }

    return true;
  } catch (error) {
    console.error("تعذر حفظ بيانات الطلاب:", error);
    return false;
  }
}

export function subscribeToUsers(callback) {
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (error) {
        console.error("تعذر قراءة البيانات الجديدة:", error);
      }
    }

    if (event.key === SHARED_SYNC_KEY && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.kind === "users") {
          callback(getUsers());
        }
      } catch (error) {
        console.error("تعذر قراءة إشعار التحديث المشترك:", error);
      }
    }
  };

  const handleChannelMessage = (event) => {
    if (event?.data?.kind === "users") {
      callback(getUsers());
    }
  };

  window.addEventListener("storage", handleStorage);

  let channel = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(SHARED_CHANNEL);
    channel.addEventListener("message", handleChannelMessage);
  }

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
      channel.close();
    }
  };
}

export function subscribeToCourses(callback) {
  const handleStorage = (event) => {
    if (event.key === COURSES_STORAGE_KEY && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch (error) {
        console.error("تعذر قراءة بيانات الكورسات الجديدة:", error);
      }
    }

    if (event.key === SHARED_SYNC_KEY && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.kind === "courses") {
          callback(getCourses());
        }
      } catch (error) {
        console.error("تعذر قراءة إشعار تحديث الكورسات:", error);
      }
    }
  };

  const handleChannelMessage = (event) => {
    if (event?.data?.kind === "courses") {
      callback(getCourses());
    }
  };

  window.addEventListener("storage", handleStorage);

  let channel = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(SHARED_CHANNEL);
    channel.addEventListener("message", handleChannelMessage);
  }

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
      channel.close();
    }
  };
}