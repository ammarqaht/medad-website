/* Halqah demo: invented data and the demo's own copy (FR-14, NFR-18).
   Every name here is invented; circles carry generic names; nothing points to
   a real place, organisation or person. No IDs, no phone numbers. The state
   lives in memory only and is rebuilt from this file on reset or reload.
   Structure follows the real product: three portals, three attendance states,
   three recitation lines per day (far review, near review, lesson), a school
   week from Sunday to Thursday, and "silence is not absence". */

export type Role = 'admin' | 'teacher' | 'student';
export type Att = 'present' | 'late' | 'absent';
export type LineKey = 'kubra' | 'sughra' | 'dars';
export type Track = 'silver' | 'golden';

export interface Line {
  done: boolean;
  errors: number;
  note: string;
}
export interface Entry {
  att: Att;
  lines: Record<LineKey, Line>;
  by: string;
}
export interface Circle {
  id: string;
  name: string;
  teacher: string;
  slot: string;
}
export interface Student {
  id: string;
  name: string;
  circle: string;
  track: Track;
  level: number;
  /** Points earned before the weeks shown here. */
  base: number;
}

/** Sunday to Thursday. */
export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] as const;
/** Short day names for phone widths. */
export const DAYS_SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'] as const;
/** The demo's "today" sits mid week so there are past and future days. */
export const TODAY = 2;
/** Week 0 is this week; 1 and 2 are the weeks before it. */
export const WEEKS = ['هذا الأسبوع', 'الأسبوع الماضي', 'قبل أسبوعين'] as const;

export const LINES: LineKey[] = ['kubra', 'sughra', 'dars'];
/** Points the system derives from the teacher's record (same rule as the product). */
export const POINTS = { attend: 10, kubra: 5, sughra: 2, dars: 5 } as const;

export const TEACHER_CIRCLE = 'c1';
export const STUDENT_ID = 's1';

export const circles: Circle[] = [
  { id: 'c1', name: 'حلقة النور', teacher: 'الأستاذ عادل', slot: 'العصر' },
  { id: 'c2', name: 'حلقة الهدى', teacher: 'الأستاذ وليد', slot: 'العصر' },
  { id: 'c3', name: 'حلقة البيان', teacher: 'الأستاذ منصور', slot: 'المغرب' },
  { id: 'c4', name: 'حلقة الفرقان', teacher: 'الأستاذ رائد', slot: 'المغرب' },
];

const roster: [string, string, Track, number][] = [
  ['c1', 'عبدالرحمن سامي', 'silver', 59],
  ['c1', 'يوسف ماجد', 'silver', 58],
  ['c1', 'أنس فيصل', 'silver', 60],
  ['c1', 'زياد هشام', 'silver', 57],
  ['c1', 'معاذ طارق', 'silver', 59],
  ['c1', 'إياد نواف', 'silver', 56],
  ['c2', 'عمر بدر', 'golden', 28],
  ['c2', 'حمزة وائل', 'golden', 29],
  ['c2', 'سلمان رياض', 'golden', 27],
  ['c2', 'تميم غازي', 'golden', 29],
  ['c2', 'بلال مازن', 'golden', 30],
  ['c2', 'نايف عصام', 'golden', 26],
  ['c3', 'خالد مهند', 'silver', 52],
  ['c3', 'سعد جواد', 'silver', 54],
  ['c3', 'لؤي باسل', 'silver', 53],
  ['c3', 'مالك حسام', 'silver', 55],
  ['c3', 'راكان فهد', 'silver', 51],
  ['c4', 'عبدالله صالح', 'golden', 26],
  ['c4', 'فارس منير', 'golden', 25],
  ['c4', 'هادي شادي', 'golden', 27],
  ['c4', 'قصي أيمن', 'golden', 28],
  ['c4', 'جود رامي', 'golden', 24],
  ['c4', 'مصعب زيد', 'golden', 25],
  ['c4', 'ريان كمال', 'golden', 26],
];

export const students: Student[] = roster.map(([circle, name, track, level], i) => ({
  id: `s${i + 1}`,
  name,
  circle,
  track,
  level,
  base: 140 + ((i * 37) % 180),
}));

/** The student portal's current plan (read only in the demo). */
export const plan = {
  track: 'silver' as Track,
  level: 59,
  day: 7,
  of: 24,
  exams: [12, 24],
  lines: {
    kubra: 'من سورة الأعلى إلى سورة الناس',
    sughra: 'سورة النبأ كاملة',
    dars: 'سورة النازعات من الآية ١ إلى ١٤',
  } as Record<LineKey, string>,
};

/** Plans issued by the supervisor (read only in the demo). */
export const plans = [
  { student: 's1', level: 59, day: 7, issued: 'الأحد الماضي' },
  { student: 's7', level: 28, day: 15, issued: 'قبل أسبوعين' },
  { student: 's13', level: 52, day: 3, issued: 'الأحد' },
  { student: 's18', level: 26, day: 21, issued: 'قبل ثلاثة أسابيع' },
  { student: 's9', level: 27, day: 11, issued: 'قبل أسبوعين' },
];

export type ExamType = 'golden' | 'diamond' | 'tajweed';
/** Recent exams (read only in the demo). */
export const exams: { student: string; type: ExamType; level?: number; errors: number; score: number; passed: boolean }[] = [
  { student: 's4', type: 'golden', level: 57, errors: 2, score: 96, passed: true },
  { student: 's10', type: 'diamond', level: 29, errors: 4, score: 91, passed: true },
  { student: 's15', type: 'golden', level: 53, errors: 9, score: 74, passed: false },
  { student: 's19', type: 'tajweed', errors: 3, score: 88, passed: true },
  { student: 's2', type: 'diamond', level: 58, errors: 1, score: 98, passed: true },
];

/** Older point movements for the demo student, shown under his balance. */
export const pastMoves = [{ label: 'الوسام الذهبي', when: 'قبل أسبوعين', delta: 50 }];

const NOTES = ['تلاوة متقنة', '', 'انتبه للوقف والابتداء', 'حفظ ثابت', '', 'أحسن في الدرس، يحتاج مراجعة'];

export const key = (week: number, day: number, student: string): string => `${week}:${day}:${student}`;

export const emptyLine = (): Line => ({ done: false, errors: 0, note: '' });

/** Days left unrecorded on purpose, so "not recorded" shows up (silence is not absence). */
const silent = new Set(['c4:0:1', 'c3:1:3']);
/** Today's recording so far: c2 complete, c3 three students, c1 and c4 waiting. */
const todayDone: Record<string, number> = { c2: 99, c3: 3 };

/** Deterministic seed: the same history on every load and every reset. */
export function seedEntries(): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  students.forEach((s, si) => {
    const circle = circles.find((c) => c.id === s.circle)!;
    const pos = students.filter((x) => x.circle === s.circle).indexOf(s);
    for (let week = 0; week < WEEKS.length; week++) {
      for (let day = 0; day < DAYS.length; day++) {
        if (week === 0 && day > TODAY) continue;
        if (week === 0 && day === TODAY && pos >= (todayDone[s.circle] ?? 0)) continue;
        if (silent.has(`${s.circle}:${week}:${day}`)) continue;
        const r = (si * 7 + week * 5 + day * 3) % 11;
        const att: Att = r === 0 ? 'absent' : r === 4 ? 'late' : 'present';
        const line = (done: boolean, errors: number, note = ''): Line =>
          att === 'absent' ? emptyLine() : { done, errors: done ? errors : 0, note: done ? note : '' };
        out[key(week, day, s.id)] = {
          att,
          by: circle.teacher,
          lines: {
            kubra: line(r !== 3, r % 3),
            sughra: line(true, (r + day) % 2),
            dars: line(r !== 7, (r + week) % 4, NOTES[(si + day + week) % NOTES.length]),
          },
        };
      }
    }
  });
  return out;
}

export const ui = {
  brand: 'حلقة',
  roles: { admin: 'مشرف', teacher: 'معلم', student: 'طالب' } as Record<Role, string>,
  rolesLabel: 'اختر الدور',
  reset: 'إعادة',
  resetDone: 'عادت التجربة إلى بدايتها.',
  roleNow: 'أنت الآن في بوابة',
  att: { present: 'حاضر', late: 'متأخر', absent: 'غائب' } as Record<Att, string>,
  lines: { kubra: 'المراجعة الكبرى', sughra: 'المراجعة الصغرى', dars: 'الدرس' } as Record<LineKey, string>,
  linesShort: { kubra: 'الكبرى', sughra: 'الصغرى', dars: 'الدرس' } as Record<LineKey, string>,
  showAll: 'عرض الكل',
  showLess: 'عرض أقل',
  tracks: { silver: 'المسار الفضي', golden: 'المسار الذهبي' } as Record<Track, string>,
  level: 'المستوى',
  today: 'اليوم',
  notRecorded: 'لم يسجل',
  notYet: 'لم يأتِ',
  recited: 'سمّع',
  notRecited: 'لم يسمّع',
  noErrors: 'بلا أخطاء',
  by: 'سجّله',
  points: 'نقطة',
  admin: {
    nav: { follow: 'المتابعة', students: 'الطلاب', plans: 'الخطط والاختبارات' },
    navShort: { follow: 'المتابعة', students: 'الطلاب', plans: 'الخطط' },
    navLabel: 'أقسام بوابة المشرف',
    followTitle: 'تقدم الحلقات اليوم',
    tally: 'حصيلة اليوم',
    week: 'أيام الأسبوع',
    of: 'من',
    open: 'افتح الحلقة',
    back: 'كل الحلقات',
    daysLabel: 'اختر يوماً',
    nothing: 'لم يُسجَّل في هذا اليوم شيء بعد.',
    future: 'هذا اليوم لم يأتِ بعد.',
    studentsTitle: 'الطلاب والحلقات',
    allCircles: 'كل الحلقات',
    allShort: 'الكل',
    circlesLabel: 'تصفية الطلاب بالحلقة',
    plansTitle: 'الخطط المصدرة',
    examsTitle: 'آخر الاختبارات',
    planDay: 'المقرر',
    issued: 'أُصدرت',
    exam: { golden: 'الوسام الذهبي', diamond: 'الوسام الماسي', tajweed: 'اختبار تجويد' } as Record<ExamType, string>,
    passed: 'اجتاز',
    failed: 'لم يجتز',
    score: 'الدرجة',
  },
  teacher: {
    hello: 'أهلاً،',
    recorded: 'سُجّل',
    daysLabel: 'يوم التسجيل',
    future: 'لا يمكن التسجيل ليوم لم يأتِ بعد. اختر اليوم أو يوماً مضى.',
    attLabel: 'الحضور',
    recitation: 'التسميع',
    absentNote: 'غائب، فلا تسميع في هذا اليوم.',
    errors: 'الأخطاء',
    more: 'زيادة الأخطاء في',
    less: 'إنقاص الأخطاء في',
    note: 'ملاحظة',
    save: 'حفظ',
    saved: 'محفوظ',
    dirty: 'لم يُحفظ بعد',
    pickAtt: 'اختر حالة الحضور أولاً.',
  },
  student: {
    hello: 'أهلاً،',
    balance: 'رصيد نقاطي',
    attendance: 'حضوري وتسميعي',
    prevWeek: 'الأسبوع السابق',
    nextWeek: 'الأسبوع التالي',
    daysLabel: 'أيام الأسبوع',
    nothing: 'لم يُسجَّل في هذا اليوم شيء.',
    future: 'هذا اليوم لم يأتِ بعد.',
    teacherNote: 'ملاحظة المعلم',
    plan: 'خطتي',
    planDay: 'المقرر',
    nextExam: 'الوسام الذهبي عند المقرر',
    moves: 'آخر حركات النقاط',
    dayMove: 'حضور وتسميع',
    absentMove: 'غياب',
  },
};
