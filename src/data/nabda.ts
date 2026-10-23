/* Nabda demo: invented data, rules and the demo's own copy (FR-19, FR-20, NFR-18).
   Questions are light general knowledge, invented for the site, with no
   religious, political or client content. Team names are invented. Rules
   follow the real product: each team has a countdown (its pulse), a correct
   answer adds time, a wrong one subtracts, and the first pulse that stops
   ends the round for everyone. Between rounds the visitor buys cards with
   points (prices and limits as in the product notes). Nothing is stored and
   nothing goes over the network: the state lives in memory only. */

export type CardId = 'time' | 'freeze' | 'double';

export interface Question {
  q: string;
  /** Three options; the first one is the right answer (shuffled when served). */
  options: [string, string, string];
}

export interface BotSpec {
  id: string;
  name: string;
  /** Chance of a right answer. */
  accuracy: number;
  /** Thinking time between answers, in ms. */
  think: [number, number];
}

/** Clock rules (ms). Tuned so a round lasts about thirty to forty five seconds. */
export const RULES = {
  startMs: 25_000,
  correctMs: 5_000,
  wrongMs: 3_000,
  /** Room for the start plus four extra-time cards (25 + 4 × 10 s). */
  maxMs: 65_000,
  countdownMs: 3_000,
  /** How long the right answer stays shown before the next question. */
  revealMs: 650,
  /** Below this the pulse is weak; below `criticalMs` it is critical. */
  weakMs: 9_000,
  criticalMs: 4_500,
  /** Full height of the pulse line is reached at this time left. */
  fullMs: 25_000,
  /** Rank points for the surviving teams (first, second, third); a stopped pulse gets none. */
  rankPoints: [2, 1, 1],
  /** Pulse drawing: 12 frames a second, stepped. */
  frameMs: 83,
} as const;

export const CARDS: Record<CardId, { name: string; effect: string; price: number; limit: number }> = {
  time: { name: 'وقت إضافي', effect: 'تبدأ جولتك القادمة بعشر ثوان زائدة.', price: 3, limit: 4 },
  freeze: { name: 'تجميد', effect: 'تقفل فريقا تختاره عن الإجابة خمس ثوان في بداية الجولة، وعداده ينزل.', price: 4, limit: 4 },
  double: { name: 'مضاعفة', effect: 'نقاط جولتك القادمة مضاعفة، وتضيع المضاعفة إن توقف نبضك.', price: 6, limit: 2 },
};
export const CARD_IDS: CardId[] = ['time', 'freeze', 'double'];
export const TIME_CARD_MS = 10_000;
export const FREEZE_MS = 5_000;

export const YOU = 'you';
export const youName = 'فريقك';

/* Two bots keep the phone screen calm: one steady, one shaky. */
export const bots: BotSpec[] = [
  { id: 'saqr', name: 'الصقور', accuracy: 0.68, think: [2600, 4800] },
  { id: 'mawj', name: 'الموج', accuracy: 0.5, think: [3000, 5800] },
];

export const questions: Question[] = [
  { q: 'أكبر كواكب المجموعة الشمسية؟', options: ['المشتري', 'زحل', 'المريخ'] },
  { q: 'سفينة الصحراء هي؟', options: ['الجمل', 'الحصان', 'الفيل'] },
  { q: 'أسرع حيوان بري؟', options: ['الفهد', 'الأسد', 'الذئب'] },
  { q: 'كم ضلعا للمثلث؟', options: ['ثلاثة', 'أربعة', 'خمسة'] },
  { q: 'العضو الذي يضخ الدم؟', options: ['القلب', 'الرئة', 'الكبد'] },
  { q: 'كم فصلا في السنة؟', options: ['أربعة', 'ثلاثة', 'ستة'] },
  { q: 'عاصمة اليابان؟', options: ['طوكيو', 'أوساكا', 'كيوتو'] },
  { q: 'كم دقيقة في الساعة؟', options: ['ستون', 'خمسون', 'مئة'] },
  { q: 'أكبر محيطات الأرض؟', options: ['الهادئ', 'الأطلسي', 'الهندي'] },
  { q: 'الكوكب الأحمر هو؟', options: ['المريخ', 'الزهرة', 'عطارد'] },
  { q: 'كم لونا في قوس المطر؟', options: ['سبعة', 'خمسة', 'تسعة'] },
  { q: 'يصنع الزجاج من؟', options: ['الرمل', 'الخشب', 'الطين'] },
  { q: 'أي هذه الطيور لا يطير؟', options: ['النعامة', 'الصقر', 'الحمام'] },
  { q: 'كم ساعة في اليوم؟', options: ['أربع وعشرون', 'عشرون', 'ثلاثون'] },
  { q: 'أعلى جبل في العالم؟', options: ['إيفرست', 'فوجي', 'كليمنجارو'] },
  { q: 'يصنع النحل العسل من؟', options: ['رحيق الأزهار', 'أوراق الشجر', 'الماء'] },
  { q: 'بم يهتدي الخفاش في الظلام؟', options: ['السمع', 'الشم', 'اللمس'] },
  { q: 'أي الأشكال بلا زوايا؟', options: ['الدائرة', 'المربع', 'المثلث'] },
  { q: 'كم رجلا للعنكبوت؟', options: ['ثمان', 'ست', 'عشر'] },
  { q: 'أزرق مع أصفر يعطي؟', options: ['الأخضر', 'البرتقالي', 'البنفسجي'] },
  { q: 'عاصمة إيطاليا؟', options: ['روما', 'ميلانو', 'نابولي'] },
  { q: 'الميزان يقيس؟', options: ['الوزن', 'الطول', 'الوقت'] },
  { q: 'أكبر حيوان على الأرض؟', options: ['الحوت الأزرق', 'الفيل', 'الزرافة'] },
  { q: 'في أي قارة تقع البرازيل؟', options: ['أمريكا الجنوبية', 'أفريقيا', 'آسيا'] },
  { q: 'يتجمد الماء عند؟', options: ['البرودة', 'الغليان', 'التبخر'] },
  { q: 'كم يوما في الأسبوع؟', options: ['سبعة', 'ستة', 'ثمانية'] },
  { q: 'أطول حيوان رقبة؟', options: ['الزرافة', 'الجمل', 'النعامة'] },
  { q: 'أقرب نجم إلى الأرض؟', options: ['الشمس', 'القمر', 'المريخ'] },
];

export const ui = {
  brand: 'نبضة',
  pause: 'إيقاف',
  resume: 'استئناف',
  reset: 'إعادة',
  teamsLabel: 'نبض الفرق',
  round: (n: string) => `الجولة ${n}`,
  intro: {
    title: 'لكل فريق نبض',
    rules: [
      'الإجابة الصحيحة تضيف خمس ثوان لنبضك، والخاطئة تخصم ثلاثا.',
      'أول نبض يتوقف ينهي الجولة على الجميع.',
      'تلعب ضد فريقين آليين، ثم تشتري بطاقات بنقاطك.',
    ],
    start: 'ابدأ الجولة',
  },
  ready: 'استعد',
  optionsLabel: 'الخيارات',
  paused: 'الجولة متوقفة، والعدادات ساكنة.',
  pausedSaid: 'أوقفت الجولة.',
  resumedSaid: 'استؤنفت الجولة.',
  autoPaused: 'أوقفت الجولة لأنك غادرت الصفحة.',
  scrollPaused: 'أوقفت الجولة لأنها خرجت من الشاشة.',
  frozen: 'مجمد',
  stopped: 'توقف',
  right: 'صحيحة',
  wrong: 'خاطئة',
  next: 'السؤال التالي',
  startSaid: 'بدأت الجولة.',
  froze: (name: string) => `جمدت ${name} خمس ثوان.`,
  thawed: (name: string) => `عاد ${name} إلى الإجابة.`,
  low: 'نبضك يضعف، أجب بسرعة.',
  results: {
    title: (n: string) => `انتهت الجولة ${n}`,
    endedBy: (name: string) => `توقف نبض ${name} أولا.`,
    endedByYou: 'توقف نبض فريقك أولا.',
    left: 'بقي',
    pointsOf: 'نقاط الجولة',
    doubled: 'مضاعفة',
    lostDouble: 'ضاعت المضاعفة',
    balance: 'رصيدك',
  },
  shop: {
    title: 'متجر البطاقات',
    line: 'تخصم النقاط الآن، ويعمل أثر البطاقة في الجولة القادمة.',
    price: 'السعر',
    uses: 'المتبقي',
    buy: 'اشتر',
    noPoints: 'نقاطك لا تكفي',
    noUses: 'بلغت حدها',
    pickTeam: 'اختر فريقا',
    already: 'اشتريتها للجولة القادمة',
    targetLabel: 'الفريق الذي تجمده',
    bought: (card: string) => `اشتريت ${card}.`,
    pending: 'في جولتك القادمة',
    none: 'لم تشتر شيئا بعد.',
  },
  again: 'جولة أخرى',
  resetDone: 'بدأت اللعبة من جديد.',
};
