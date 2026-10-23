/* Shared in-memory state of the Tahfeez demo. One reducer feeds the sign-up,
   the supervisor and the student, so an approval or a point move shows up in
   the student's page in the same session. Nothing is persisted. */
import { DEFAULT_STUDENT, FIRST_NO, seedMembers, ui, type Member, type Move } from '../../data/tahfeez';

export interface State {
  members: Member[];
  /** Whose page the student portal shows. */
  viewAs: number;
  /** Bumped on reset so every view remounts with clean local state. */
  epoch: number;
}

export type Action =
  | { type: 'register'; name: string; stage: string }
  | { type: 'decide'; no: number; ok: boolean }
  | { type: 'move'; no: number; delta: number; reason: string }
  | { type: 'view'; no: number }
  | { type: 'reset' };

export const initial = (epoch = 0): State => ({ members: seedMembers(), viewAs: DEFAULT_STUDENT, epoch });

export const nextNo = (members: Member[]): number => Math.max(FIRST_NO - 1, ...members.map((m) => m.no)) + 1;

const patch = (members: Member[], no: number, f: (m: Member) => Member) => members.map((m) => (m.no === no ? f(m) : m));

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'register': {
      const no = nextNo(state.members);
      const m: Member = { no, name: action.name, stage: action.stage, status: 'pending', moves: [] };
      return { ...state, members: [...state.members, m], viewAs: no };
    }
    case 'decide':
      return { ...state, members: patch(state.members, action.no, (m) => ({ ...m, status: action.ok ? 'active' : 'rejected' })) };
    case 'move': {
      const mv: Move = { delta: action.delta, reason: action.reason, when: ui.student.now };
      return { ...state, members: patch(state.members, action.no, (m) => ({ ...m, moves: [...m.moves, mv] })) };
    }
    case 'view':
      return { ...state, viewAs: action.no };
    case 'reset':
      return initial(state.epoch + 1);
  }
}

export const balance = (m: Member): number => m.moves.reduce((t, x) => t + x.delta, 0);
export const byNo = (members: Member[], no: number): Member | undefined => members.find((m) => m.no === no);

const AR = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits for display. */
export const ar = (n: number | string): string => String(n).replace(/\d/g, (d) => AR[Number(d)]);
/** Latin digits for checking. */
export const latin = (s: string): string => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));

export function pointsText(n: number): string {
  const a = Math.abs(n);
  if (a === 0) return 'لا نقاط';
  if (a === 1) return 'نقطة واحدة';
  if (a === 2) return 'نقطتان';
  if (a <= 10) return `${ar(a)} نقاط`;
  return `${ar(a)} نقطة`;
}
