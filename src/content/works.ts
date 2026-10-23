/* The works registry and all gallery / work-page copy (NFR-18).
   Copy rules (MEDAD.md §4): no em/en dashes or "--", no eyebrow labels, no
   badges, no emojis, no English except links, no numbers about Medad, no
   client names. Descriptions say what a work does, never who it was for.

   Owner direction (2026-10-23): a name stands alone. No category word
   («نظام»، «أنظمة»، «منصات») next to a work's name, and no name repeated.
   So the archive holds one folder per family: «تسيير» is one folder with two
   sheets inside (التسجيل، التحفيز); the other folders hold one sheet each. */

export type ArmId = 'digital' | 'live';
export type Frame = 'browser' | 'phone';
export type Slug = 'halqah' | 'tasyeer-tasjeel' | 'tasyeer-tahfeez' | 'injaz' | 'nabda' | 'malamih';
export type Fill = 'white' | 'soft' | 'green' | 'ink';
export type Sketch = 'rows' | 'form' | 'ledger' | 'board' | 'pulse' | 'faces';

export interface Arm {
  id: ArmId;
  name: string;
  line: string;
}

export interface Work {
  slug: Slug;
  /** Full name, used alone on its own page. */
  name: string;
  /** Name on its sheet inside a shared folder (the folder already says the family). */
  short: string;
  /** One sentence: what the work does. */
  line: string;
  frame: Frame;
  /** True once the live demo ships; otherwise the work page shows the pending sheet. */
  demo: boolean;
  sketch: Sketch;
}

export interface Folder {
  id: string;
  arm: ArmId;
  /** The folder's name: the family name, or the work's own name for a single sheet. */
  name: string;
  /** Only for folders that hold more than one sheet. */
  line?: string;
  fill: Fill;
  works: Slug[];
}

export const arms: Arm[] = [
  { id: 'digital', name: 'حلول رقمية', line: 'مواقع ومنصات تُدار بها الأعمال كل يوم.' },
  { id: 'live', name: 'تجارب حية', line: 'مسابقات تفاعلية تجمع القاعة على لحظة واحدة.' },
];

export const works: Work[] = [
  {
    slug: 'halqah',
    name: 'حلقة',
    short: 'حلقة',
    line: 'حلقات التحفيظ في مكان واحد: المعلم يسجّل الحضور والتسميع، والمشرف يتابع، والطالب يرى تقدمه.',
    frame: 'browser',
    demo: true,
    sketch: 'rows',
  },
  {
    slug: 'tasyeer-tasjeel',
    name: 'تسيير: التسجيل',
    short: 'التسجيل',
    line: 'يعرّف بالبرنامج، ويستقبل التسجيل في نموذج واضح، ثم يمنح المسجّل رقم عضويته.',
    frame: 'phone',
    demo: false,
    sketch: 'form',
  },
  {
    slug: 'tasyeer-tahfeez',
    name: 'تسيير: التحفيز',
    short: 'التحفيز',
    line: 'يعتمد المشرف التسجيلات ويمنح النقاط، ويرى الطالب رصيده لحظة بلحظة.',
    frame: 'browser',
    demo: false,
    sketch: 'ledger',
  },
  {
    slug: 'injaz',
    name: 'إنجاز',
    short: 'إنجاز',
    line: 'يسلّم المشاركون مهامهم، ويقيّمها المشرفون، وتتحرك لوحة الصدارة مع كل تقييم.',
    frame: 'browser',
    demo: false,
    sketch: 'board',
  },
  {
    slug: 'nabda',
    name: 'نبضة',
    short: 'نبضة',
    line: 'مسابقة جماعية حية، لكل فريق نبض يطول بالإجابة الصحيحة ويقصر بالخاطئة.',
    frame: 'phone',
    demo: false,
    sketch: 'pulse',
  },
  {
    slug: 'malamih',
    name: 'ملامح',
    short: 'ملامح',
    line: 'مسابقة حية جديدة تجمع القاعة على شاشة واحدة، ونسختها التجريبية قيد الطباعة.',
    frame: 'phone',
    demo: false,
    sketch: 'faces',
  },
];

/* Folders follow the approved categories (brief §3.3): one folder each. */
export const folders: Folder[] = [
  { id: 'halqah', arm: 'digital', name: 'حلقة', fill: 'white', works: ['halqah'] },
  {
    id: 'tasyeer',
    arm: 'digital',
    name: 'تسيير',
    line: 'منصات تسيّر البرامج من أول تسجيل إلى آخر نقطة.',
    fill: 'soft',
    works: ['tasyeer-tasjeel', 'tasyeer-tahfeez'],
  },
  { id: 'injaz', arm: 'digital', name: 'إنجاز', fill: 'green', works: ['injaz'] },
  { id: 'nabda', arm: 'live', name: 'نبضة', fill: 'ink', works: ['nabda'] },
  { id: 'malamih', arm: 'live', name: 'ملامح', fill: 'soft', works: ['malamih'] },
];

export const workBySlug = (slug: Slug): Work => works.find((w) => w.slug === slug)!;
export const folderOf = (slug: Slug): Folder => folders.find((f) => f.works.includes(slug))!;
export const foldersIn = (arm: ArmId): Folder[] => folders.filter((f) => f.arm === arm);

export const worksCopy = {
  gallery: {
    title: 'الأعمال',
    description: 'أرشيف أعمال {مداد}: منصات تعمل ومسابقات حية، ولكل عمل نسخة تجريبية تجرّبها بنفسك.',
    /** The last word is boxed in green. */
    headline: ['أرشيف', 'الأعمال'] as const,
    line: 'كل ملف هنا عمل بنيناه. اختر ملفاً واسحبه من الأرشيف لتجرّبه بنفسك؛ التجارب تعمل ببيانات وهمية، فلا شيء مما تدخله يُحفظ أو يغادر جهازك.',
    filtersLabel: 'تصفية الأعمال',
    all: 'الكل',
    open: 'افتح الملف',
    showing: 'يظهر الآن',
  },
  page: {
    demoLabel: 'النسخة التجريبية من',
    noscript: 'هذه التجربة تحتاج إلى تفعيل جافاسكربت في متصفحك.',
    pending: {
      title: 'التجربة قيد الطباعة',
      line: 'نجهّز هذه النسخة لتعمل هنا كما تعمل في الواقع. إلى أن تكتمل، تصفّح بقية الأرشيف.',
      cta: 'تصفّح الأرشيف',
    },
    closing: {
      headline: 'لنكتب فكرتك التالية',
      line: 'عندك فكرة تشبه هذا العمل أو تختلف عنه؟ حدّثنا عنها.',
      cta: 'راسلنا على واتساب',
      all: 'كل الأعمال',
    },
  },
  /** What a visitor should try first, per demo. */
  howTo: {
    halqah: 'بدّل الدور من أعلى التجربة: سجّل حضور طالب وتسميعه بصفتك معلماً، ثم انظر إليه بعين المشرف والطالب.',
  } as Partial<Record<Slug, string>>,
};
