/* Injaz demo: an invented program, invented participants, tasks and answers,
   and the demo's own copy (FR-14, FR-24, NFR-18). Every name is invented and
   the program carries a generic name in Medad's look. The state lives in
   memory only and is rebuilt from this file on reset or reload. Structure
   follows the real product: participants submit a text answer per task (one
   submission per participant per task, updated in place), supervisors review
   it with a grade and feedback or ask for a redo, and the leaderboard ranks by
   points. A submission can be sent again only after a redo request. */

export type Role = 'member' | 'admin';
export type SubStatus = 'pending' | 'approved' | 'returned';

export interface Task {
  id: string;
  title: string;
  brief: string;
  max: number;
  due: string;
}
export interface Person {
  id: string;
  name: string;
  /** Points from earlier tasks not shown in the demo. */
  base: number;
  /** Tasks completed before the ones shown. */
  doneBefore: number;
}
export interface Submission {
  text: string;
  status: SubStatus;
  grade: number;
  feedback: string;
  /** How many times it was sent (the record is updated, never duplicated). */
  sent: number;
}

export const ME = 'p1';

export const tasks: Task[] = [
  { id: 't1', title: 'عرّف بنفسك', brief: 'اكتب فقرة قصيرة عن نفسك وما تريد أن تتعلمه في البرنامج.', max: 10, due: 'انتهى موعدها' },
  { id: 't2', title: 'خطة الأسبوع', brief: 'ضع ثلاثة أهداف لهذا الأسبوع، وكيف ستقيس كل هدف.', max: 15, due: 'تنتهي الخميس' },
  { id: 't3', title: 'ملخص كتاب', brief: 'لخّص فكرة كتاب قرأته في خمسة أسطر، واذكر ما ستطبقه منه.', max: 20, due: 'تنتهي الأحد' },
  { id: 't4', title: 'فكرة مبادرة', brief: 'اقترح مبادرة صغيرة تخدم مدرستك أو حيّك، ومن يشاركك فيها.', max: 10, due: 'تنتهي بعد أسبوع' },
];

export const people: Person[] = [
  { id: 'p1', name: 'أنس رائد', base: 52, doneBefore: 5 },
  { id: 'p2', name: 'يزن عادل', base: 61, doneBefore: 6 },
  { id: 'p3', name: 'قصي ماهر', base: 47, doneBefore: 5 },
  { id: 'p4', name: 'جواد هاني', base: 66, doneBefore: 7 },
  { id: 'p5', name: 'معتز فيصل', base: 39, doneBefore: 4 },
  { id: 'p6', name: 'غيث سامر', base: 55, doneBefore: 6 },
  { id: 'p7', name: 'ليث مراد', base: 33, doneBefore: 4 },
];

export const subKey = (person: string, task: string): string => `${person}:${task}`;

/** Deterministic seed: the same history on every load and every reset. */
export function seedSubs(): Record<string, Submission> {
  const s = (text: string, status: SubStatus, grade = 0, feedback = ''): Submission => ({ text, status, grade, feedback, sent: 1 });
  return {
    [subKey('p1', 't1')]: s('أحب البرمجة والقراءة، وأريد أن أتعلم كيف أدير وقتي وأعرض أفكاري بثقة.', 'approved', 8, 'بداية موفقة، أضف مثالاً في المرة القادمة.'),
    [subKey('p1', 't2')]: s('أقرأ عشرين صفحة كل يوم، وأنهي واجباتي قبل المغرب، وأمشي ثلاث مرات.', 'pending'),
    [subKey('p1', 't3')]: s('كتاب عن العادات الصغيرة.', 'returned', 0, 'الملخص قصير جداً، اذكر الفكرة وما ستطبقه.'),
    [subKey('p2', 't1')]: s('أنا مهتم بالتصميم، وأريد أن أتعلم العمل في فريق.', 'approved', 9, 'جميل.'),
    [subKey('p2', 't2')]: s('هدفي الأول حفظ صفحتين، والثاني تمرين يومي، والثالث ترتيب غرفتي.', 'pending'),
    [subKey('p3', 't3')]: s('قرأت كتاباً عن التفكير الناقد: نسأل قبل أن نصدق، ونبحث عن الدليل، وسأطبق ذلك في قراءة الأخبار.', 'pending'),
    [subKey('p4', 't1')]: s('أحب الرياضة والعلوم، وأريد أن أتعلم الخطابة.', 'approved', 10, 'ممتاز.'),
    [subKey('p4', 't4')]: s('مكتبة صغيرة في فناء المدرسة يتبادل فيها الطلاب الكتب، ويشاركني فيها صفي.', 'pending'),
    [subKey('p5', 't2')]: s('أنام مبكراً، وأقرأ كل يوم، وأساعد أخي في دروسه.', 'pending'),
    [subKey('p6', 't1')]: s('أحب الرسم، وأريد أن أتعلم إدارة المشاريع.', 'approved', 7, 'أحسنت.'),
  };
}

export const ui = {
  brand: 'برنامج المهارات',
  roles: { member: 'مشارك', admin: 'مشرف' } as Record<Role, string>,
  rolesLabel: 'اختر الدور',
  roleNow: 'أنت الآن بصفة',
  reset: 'إعادة',
  resetDone: 'عادت التجربة إلى بدايتها.',
  status: { none: 'لم تسلّم', pending: 'قيد المراجعة', approved: 'مقيّمة', returned: 'مطلوب إعادة' } as Record<SubStatus | 'none', string>,
  showAll: 'عرض الكل',
  showLess: 'عرض أقل',
  points: 'نقطة',
  of: 'من',
  board: {
    title: 'لوحة الصدارة',
    label: 'ترتيب المشاركين بالنقاط',
    rank: 'المركز',
    tasks: 'مهام',
    you: 'أنت',
  },
  member: {
    tabs: { tasks: 'مهامي', board: 'الصدارة' },
    tabsLabel: 'أقسام المشارك',
    hello: 'مرحبا،',
    myPoints: 'نقاطي',
    myRank: 'مركزي',
    tasksTitle: 'المهام',
    open: 'افتح',
    back: 'كل المهام',
    maxPts: 'حتى',
    answer: 'إجابتك',
    answerPh: 'اكتب إجابتك هنا',
    demo: 'نموذج تجريبي، لا تدخل بيانات حقيقية.',
    send: 'سلّم',
    resend: 'أعد التسليم',
    short: 'اكتب إجابة أطول قليلاً.',
    locked: 'سلّمتها، وتنتظر مراجعة المشرف.',
    yourAnswer: 'ما سلّمته',
    grade: 'التقييم',
    feedback: 'ملاحظة المشرف',
    sent: (t: string) => `سُلّمت «${t}» وهي الآن قيد المراجعة.`,
    resent: (t: string) => `حُدّث تسليم «${t}» وعاد إلى المراجعة.`,
  },
  admin: {
    tabs: { queue: 'التسليمات', board: 'الصدارة' },
    tabsLabel: 'أقسام المشرف',
    title: 'طابور التسليمات',
    filtersLabel: 'تصفية التسليمات',
    empty: 'لا تسليمات في هذه الحالة.',
    review: 'راجع',
    back: 'الطابور',
    answer: 'الإجابة',
    grade: 'التقييم',
    more: 'زيادة التقييم',
    less: 'إنقاص التقييم',
    feedback: 'ملاحظة للمشارك',
    feedbackPh: 'اختيارية عند القبول',
    accept: 'قبول وتقييم',
    redo: 'طلب إعادة',
    needFeedback: 'اكتب ملاحظة توضح المطلوب إعادته.',
    accepted: (name: string, g: string) => `قُبل تسليم ${name} بتقييم ${g}.`,
    returned: (name: string) => `طُلبت إعادة من ${name}.`,
  },
};
