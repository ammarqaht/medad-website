/* Tasjeel demo: invented club, invented example values and the demo's own copy
   (FR-14, FR-22, NFR-18). The club, its place and its dates are invented. The
   example ID and phone are repeated digits so they cannot be mistaken for real
   numbers. Nothing the visitor types is stored or sent: the state lives in
   memory only and is gone on reset or reload. Structure follows the real
   product: three steps (intro, registration form with Arabic validation,
   confirmation with a membership number), stage and grade linked, and one
   conditional question. */

export type Step = 'intro' | 'form' | 'done';
export type StageKey = 'primary' | 'middle' | 'secondary';
export type YesNo = 'yes' | 'no';

export interface Stage {
  key: StageKey;
  label: string;
  grades: string[];
}

/** Stage and grade are linked: the grade list follows the chosen stage. */
export const stages: Stage[] = [
  { key: 'primary', label: 'ابتدائي', grades: ['الرابع', 'الخامس', 'السادس'] },
  { key: 'middle', label: 'متوسط', grades: ['الأول', 'الثاني', 'الثالث'] },
  { key: 'secondary', label: 'ثانوي', grades: ['الأول', 'الثاني', 'الثالث'] },
];

export const STEPS: Step[] = ['intro', 'form', 'done'];

/** Membership numbers are made up locally; the first one of a session. Digits
    without zero on purpose (a lone Arabic-Indic zero reads as a letter dot). */
export const FIRST_MEMBER = 2461;

/** One click fills the form with obviously fake values. */
export const example = {
  name: 'سامي فهد خالد المثالي',
  nid: '١١١١١١١١١١',
  phone: '٥٥٥٥٥٥٥٥٥',
  stage: 'middle' as StageKey,
  grade: 1,
  district: 'حي المثال',
  allergy: 'no' as YesNo,
  allergyText: '',
};

export const ui = {
  brand: 'نادي الأفق',
  reset: 'إعادة',
  resetDone: 'عادت التجربة إلى بدايتها.',
  stepsLabel: 'خطوات التسجيل',
  steps: { intro: 'التعريف', form: 'التسجيل', done: 'الاعتماد' } as Record<Step, string>,
  stepNow: 'الخطوة الحالية:',
  intro: {
    title: 'نادي الأفق الصيفي',
    line: 'نادٍ صيفي للطلاب يجمع القيم والمهارة والترفيه في برامج قصيرة ممتعة.',
    detailsLabel: 'تفاصيل النادي',
    details: [
      { k: 'الفئة', v: 'من الرابع الابتدائي إلى الثالث الثانوي' },
      { k: 'المدة', v: 'أربعة أسابيع من أول الإجازة' },
      { k: 'الوقت', v: 'من العصر إلى العشاء، الأحد إلى الخميس' },
      { k: 'المكان', v: 'مدرسة وهمية في حي المثال' },
    ],
    cta: 'سجّل',
  },
  form: {
    title: 'تسجيل طالب',
    demo: 'نموذج تجريبي، لا تدخل بيانات حقيقية.',
    fill: 'املأ بمثال',
    filled: 'امتلأ النموذج ببيانات وهمية.',
    labels: {
      name: 'اسم الطالب الرباعي',
      nid: 'رقم الهوية',
      phone: 'جوال ولي الأمر',
      stage: 'المرحلة',
      grade: 'الصف',
      district: 'الحي',
      allergy: 'حساسية أو مرض مزمن؟',
      allergyText: 'ما هو؟',
    },
    placeholders: {
      name: 'أربعة أسماء',
      nid: 'مثال: ١١١١١١١١١١',
      phone: 'مثال: ٥٥٥٥٥٥٥٥٥',
      district: 'اسم الحي',
      allergyText: 'اذكره باختصار',
    },
    gradeFirst: 'اختر المرحلة أولاً.',
    yes: 'نعم',
    no: 'لا',
    submit: 'إتمام التسجيل',
    back: 'رجوع',
    errorsSaid: (n: string) => `في النموذج ${n} تحتاج إلى تصحيح.`,
  },
  errors: {
    nameEmpty: 'اكتب اسم الطالب.',
    nameArabic: 'اكتب الاسم بالحروف العربية.',
    nameFour: 'اكتب الاسم رباعياً: أربعة أسماء.',
    nidEmpty: 'اكتب رقم الهوية.',
    nidLength: 'رقم الهوية عشرة أرقام.',
    nidStart: 'رقم الهوية يبدأ بواحد أو اثنين.',
    phoneEmpty: 'اكتب جوال ولي الأمر.',
    phoneFormat: 'الجوال تسعة أرقام تبدأ بخمسة.',
    stage: 'اختر المرحلة.',
    grade: 'اختر الصف.',
    district: 'اكتب اسم الحي.',
    allergy: 'اختر نعم أو لا.',
    allergyText: 'اذكر الحساسية أو المرض.',
  },
  done: {
    title: 'تم التسجيل',
    hello: (first: string) => `مرحبا بـ${first} في نادي الأفق.`,
    number: 'رقم العضوية',
    noticesTitle: 'تنبيهات',
    notices: [
      'احفظ رقم العضوية، فبه تُعرض نقاط الطالب وحضوره.',
      'يُعتمد التسجيل بعد استكمال الرسوم.',
      'هذا رقم تجريبي، ولم يُحفظ شيء مما كتبته.',
    ],
    another: 'تسجيل طالب آخر',
    home: 'العودة للبداية',
    said: (n: string) => `رقم العضوية ${n}.`,
  },
};

