/* Tasjeel demo state and validation. Everything stays in memory: no storage,
   no network. The membership number is a local counter for the session. */
import { FIRST_MEMBER, ui, type Step, type StageKey, type YesNo } from '../../data/tasjeel';

export interface Form {
  name: string;
  nid: string;
  phone: string;
  stage: StageKey | '';
  grade: number;
  district: string;
  allergy: YesNo | '';
  allergyText: string;
}
export type Field = keyof Form;
export type Errors = Partial<Record<Field, string>>;

export const emptyForm = (): Form => ({
  name: '',
  nid: '',
  phone: '',
  stage: '',
  grade: -1,
  district: '',
  allergy: '',
  allergyText: '',
});

/** Fields in the order they appear, so focus can go to the first error. */
export const ORDER: Field[] = ['name', 'nid', 'phone', 'stage', 'grade', 'district', 'allergy', 'allergyText'];

const AR = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits for display. */
export const ar = (n: number | string): string => String(n).replace(/\d/g, (d) => AR[Number(d)]);
/** Latin digits for checking (visitors type either kind). */
export const latin = (s: string): string =>
  s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) % 16));
const digits = (s: string): string => latin(s).replace(/[\s-]/g, '');

const ARABIC_NAME = /^[ء-يـ\s]+$/;

export function validate(f: Form): Errors {
  const E = ui.errors;
  const e: Errors = {};
  const name = f.name.trim();
  if (!name) e.name = E.nameEmpty;
  else if (!ARABIC_NAME.test(name)) e.name = E.nameArabic;
  else if (name.split(/\s+/).length < 4) e.name = E.nameFour;

  const nid = digits(f.nid);
  if (!nid) e.nid = E.nidEmpty;
  else if (!/^\d{10}$/.test(nid)) e.nid = E.nidLength;
  else if (!/^[12]/.test(nid)) e.nid = E.nidStart;

  const phone = digits(f.phone).replace(/^0(?=5)/, '');
  if (!phone) e.phone = E.phoneEmpty;
  else if (!/^5\d{8}$/.test(phone)) e.phone = E.phoneFormat;

  if (!f.stage) e.stage = E.stage;
  else if (f.grade < 0) e.grade = E.grade;
  if (!f.district.trim()) e.district = E.district;
  if (!f.allergy) e.allergy = E.allergy;
  else if (f.allergy === 'yes' && !f.allergyText.trim()) e.allergyText = E.allergyText;
  return e;
}

export interface State {
  step: Step;
  /** Membership numbers handed out this session. */
  issued: number;
  /** The last confirmation. */
  member: number;
  first: string;
}

export const initial = (): State => ({ step: 'intro', issued: 0, member: 0, first: '' });

/** Next local membership number, skipping any with a zero digit. */
export function nextMember(issued: number): number {
  let n = FIRST_MEMBER;
  for (let i = 0; i < issued; i++) {
    n++;
    while (String(n).includes('0')) n++;
  }
  return n;
}

export function countText(n: number): string {
  if (n === 1) return 'خانة واحدة';
  if (n === 2) return 'خانتان';
  if (n <= 10) return `${ar(n)} خانات`;
  return `${ar(n)} خانة`;
}
