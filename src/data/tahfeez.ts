/* Tahfeez demo: invented club members, invented point moves and the demo's own
   copy (FR-14, FR-23, NFR-18). Every name is invented. No ID or phone numbers
   are kept: the short sign-up form asks for an example ID that is checked for
   shape and then dropped. The state lives in memory only and is rebuilt from
   this file on reset or reload. Structure follows the real product: sign-up
   issues a membership number from 1001 at once, the registration waits for a
   supervisor's approval, the supervisor grants or deducts points with a
   reason, and the student sees the balance and the latest moves. */

export type Role = 'join' | 'admin' | 'student';
export type Status = 'pending' | 'active' | 'rejected';

export interface Move {
  delta: number;
  reason: string;
  when: string;
}
export interface Member {
  no: number;
  name: string;
  stage: string;
  status: Status;
  moves: Move[];
}

/** Membership numbers start at 1001 (the product's sequence). */
export const FIRST_NO = 1001;

export const STAGES = ['ابتدائي', 'متوسط', 'ثانوي'] as const;

/** The supervisor picks an amount from these. */
export const AMOUNTS = [5, 10, 20, -5, -10] as const;

/** Reasons offered as one tap fills; the field stays free text. */
export const REASONS = ['مشاركة في نشاط', 'حضور مبكر', 'مساعدة زميل'] as const;

/** The student portal opens on this active member until someone signs up. */
export const DEFAULT_STUDENT = 1003;

export function seedMembers(): Member[] {
  return [
    {
      no: 1001,
      name: 'ماجد سلطان',
      stage: 'متوسط',
      status: 'active',
      moves: [
        { delta: 20, reason: 'فوز في مسابقة', when: 'قبل أسبوع' },
        { delta: 15, reason: 'حضور الأسبوع كاملاً', when: 'قبل أيام' },
      ],
    },
    { no: 1002, name: 'هشام وليد', stage: 'ثانوي', status: 'rejected', moves: [] },
    {
      no: 1003,
      name: 'سلمان عمار',
      stage: 'متوسط',
      status: 'active',
      moves: [
        { delta: 25, reason: 'نقاط الترحيب', when: 'قبل أسبوعين' },
        { delta: 10, reason: 'مشاركة في نشاط', when: 'قبل أسبوع' },
        { delta: -5, reason: 'تأخر عن الموعد', when: 'قبل أيام' },
        { delta: 15, reason: 'حضور الأسبوع كاملاً', when: 'أمس' },
      ],
    },
    {
      no: 1004,
      name: 'نواف بسام',
      stage: 'ابتدائي',
      status: 'active',
      moves: [{ delta: 30, reason: 'إتمام مشروع', when: 'قبل أيام' }],
    },
    { no: 1005, name: 'عمر ياسر', stage: 'ثانوي', status: 'pending', moves: [] },
    { no: 1006, name: 'طلال مهدي', stage: 'ابتدائي', status: 'pending', moves: [] },
  ];
}

export const ui = {
  brand: 'نادي السواعد',
  roles: { join: 'التسجيل', admin: 'مشرف', student: 'طالب' } as Record<Role, string>,
  rolesLabel: 'اختر الواجهة',
  roleNow: 'أنت الآن في واجهة',
  reset: 'إعادة',
  resetDone: 'عادت التجربة إلى بدايتها.',
  status: { pending: 'قيد الاعتماد', active: 'مفعّل', rejected: 'مرفوض' } as Record<Status, string>,
  showAll: 'عرض الكل',
  showLess: 'عرض أقل',
  points: 'نقطة',
  join: {
    title: 'انضم إلى نادي السواعد',
    line: 'اجمع النقاط بمشاركتك وحضورك، وتابع رصيدك من صفحتك.',
    demo: 'نموذج تجريبي، لا تدخل بيانات حقيقية.',
    name: 'الاسم الثلاثي',
    namePh: 'ثلاثة أسماء',
    nid: 'رقم الهوية',
    nidPh: 'مثال: ٢٢٢٢٢٢٢٢٢٢',
    stage: 'المرحلة',
    fill: 'املأ بمثال',
    filled: 'امتلأ النموذج ببيانات وهمية.',
    submit: 'أرسل الطلب',
    errors: {
      name: 'اكتب الاسم ثلاثياً بالحروف العربية.',
      nid: 'رقم الهوية عشرة أرقام يبدأ بواحد أو اثنين.',
      stage: 'اختر المرحلة.',
    },
    errorsSaid: 'في النموذج خانات تحتاج إلى تصحيح.',
    doneTitle: 'وصل طلبك',
    doneNo: 'رقم عضويتك',
    doneLine: 'طلبك بانتظار اعتماد المشرف.',
    toAdmin: 'افتح لوحة المشرف',
    toStudent: 'افتح صفحتي',
    again: 'تسجيل آخر',
    said: (no: string) => `وصل الطلب. رقم العضوية ${no}، بانتظار اعتماد المشرف.`,
  },
  admin: {
    title: 'التسجيلات',
    filtersLabel: 'تصفية التسجيلات',
    all: 'الكل',
    approve: 'اعتماد',
    reject: 'رفض',
    points: 'النقاط',
    approved: (name: string) => `اعتُمد ${name}.`,
    rejected: (name: string) => `رُفض طلب ${name}.`,
    empty: 'لا تسجيلات في هذه الحالة.',
    no: 'رقم',
    back: 'كل التسجيلات',
    balance: 'الرصيد',
    amountLabel: 'المقدار',
    add: 'إضافة',
    deduct: 'خصم',
    reason: 'السبب',
    reasonPh: 'مثال: مشاركة في نشاط',
    reasonsLabel: 'أسباب مقترحة',
    save: 'سجّل الحركة',
    needAmount: 'اختر المقدار.',
    needReason: 'اكتب سبب الحركة.',
    tooMuch: 'الرصيد لا يكفي لهذا الخصم.',
    saved: (delta: string, name: string, total: string) => `سُجّلت ${delta} لـ${name}. الرصيد الآن ${total}.`,
    moves: 'آخر الحركات',
    noMoves: 'لا حركات بعد.',
  },
  student: {
    whoLabel: 'ادخل بصفة',
    hello: 'مرحبا،',
    balance: 'رصيدي',
    moves: 'آخر حركات النقاط',
    noMoves: 'لا حركات بعد. ستظهر هنا أول نقطة يمنحها المشرف.',
    pendingTitle: 'بانتظار الاعتماد',
    pendingLine: 'وصل طلبك وسيراجعه المشرف. يظهر رصيدك هنا بعد الاعتماد.',
    rejectedTitle: 'لم يُعتمد الطلب',
    rejectedLine: 'راجع المشرف لمعرفة السبب.',
    now: 'الآن',
  },
};
