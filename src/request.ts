// The request's behaviour, in one place: its due date, its state and the actions it offers.
// Each function cites the rules it applies. Spec: spec/screens/request.md, spec/rules.md.

export type Role = 'R-01' | 'R-02';
export type StateId = 'ST-01' | 'ST-02' | 'ST-03' | 'ST-04' | 'ST-05' | 'ST-06' | 'ST-07' | 'ST-08' | 'ST-09' | 'ST-10';
export type DialogId = 'DL-01' | 'DL-02' | 'DL-03';
export type Action = { label: string; variant: 'primary' | 'secondary' | 'tertiary'; disabled?: boolean };

/** Dates are days, written YYYY-MM-DD, in the shop's time zone. */
export type Request = {
  received: string;
  sentOn: string;
  extendedOn?: string;
  extendReason?: string;
  proofAskedOn?: string;
  proofDoubt?: string;
  proofReceivedOn?: string;
  answeredOn?: string;
};

/** Who looks, on which day, and the dialog the lead opened, with what they have written in it so far. */
export type View = { viewer: Role; today: string; dialog?: DialogId; draft?: string };

const DAY = 86_400_000;
const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
const toDay = (d: Date) => d.toISOString().slice(0, 10);

/** The same day, n months later; the last day of that month when it has no such day (Q-02). */
export function addMonths(day: string, n: number): string {
  const d = toDate(day);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return toDay(target);
}

/** Days from one day to another: negative once the second day has passed. */
export const daysBetween = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);

/** BR-01, BR-02: one month after the request reached the shop; three once extended (Q-03). Proof of identity moves nothing (BR-05). */
export function dueDate(r: Request): string {
  return addMonths(r.received, r.extendedOn ? 3 : 1);
}

/** BR-05: asked for proof, and it has not arrived. */
const waitingForProof = (r: Request) => Boolean(r.proofAskedOn && !r.proofReceivedOn);

/** Which state the screen is in. The order is the spec's: the first state that applies wins. A dialog is not a state. */
export function stateOf(r: Request, v: View): StateId {
  const left = daysBetween(v.today, dueDate(r));
  if (v.viewer === 'R-02') return 'ST-07';                                               // BR-08
  if (r.answeredOn) return daysBetween(dueDate(r), r.answeredOn) > 0 ? 'ST-10' : 'ST-06'; // BR-04, BR-03
  if (left < 0) return waitingForProof(r) ? 'ST-09' : 'ST-03';                            // BR-03
  if (waitingForProof(r)) return left <= 7 ? 'ST-08' : 'ST-05';                           // BR-05, BR-07
  if (left <= 7) return 'ST-02';                                                         // BR-07
  if (r.extendedOn) return 'ST-04';                                                      // BR-02
  return 'ST-01';
}

/** The states each dialog opens over. When time moves the request to another state, the dialog closes:
 * Extend and Ask for proof are refused once the due date has passed (BR-02, BR-05); answering never is (BR-04). */
const OVER: Record<DialogId, StateId[]> = {
  'DL-01': ['ST-01', 'ST-02', 'ST-05', 'ST-08'],                            // BR-02
  'DL-02': ['ST-01', 'ST-02', 'ST-04'],                                     // BR-05
  'DL-03': ['ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-08', 'ST-09'], // BR-04
};

/** The button that opens each dialog. */
const OPENS: Record<DialogId, string> = { 'DL-01': 'Extend', 'DL-02': 'Ask for proof of identity', 'DL-03': 'Mark as answered' };

/** The dialog on the screen, if any: the one the lead opened, while the request is in a state it opens over and that
 * state still offers its button. A request extended or asked in another tab closes the dialog (D-04, D-10). */
export function dialogOf(r: Request, v: View): DialogId | null {
  if (!v.dialog || !OVER[v.dialog].includes(stateOf(r, v))) return null;
  return stateActions(r, v).some(a => a.label === OPENS[v.dialog!]) ? v.dialog : null;
}

/** The buttons the screen offers, in order: the dialog's when one is open, else the state's. */
export function actionsFor(r: Request, v: View): Action[] {
  const cancel: Action = { label: 'Cancel', variant: 'tertiary' };
  const blank = !v.draft?.trim();                            // D-09: the main button waits for what must be written
  switch (dialogOf(r, v)) {
    case 'DL-01': return [{ label: 'Extend', variant: 'primary', disabled: blank }, cancel];
    case 'DL-02': return [{ label: 'Ask', variant: 'primary', disabled: blank }, cancel];
    case 'DL-03': return [{ label: 'Mark as answered', variant: 'primary', disabled: blank }, cancel];
  }
  return stateActions(r, v);
}

/** The state's own buttons, in order. */
function stateActions(r: Request, v: View): Action[] {
  const answer: Action = { label: 'Mark as answered', variant: 'primary' };
  const extend: Action = { label: 'Extend', variant: 'secondary' };
  const ask: Action = { label: 'Ask for proof of identity', variant: 'tertiary' };
  const received: Action = { label: 'Proof received', variant: 'primary' };
  const once = r.extendedOn ? [] : [extend];                 // extended once (BR-02)
  const askOnce = r.proofAskedOn ? [] : [ask];               // asked once (BR-05, D-10)
  switch (stateOf(r, v)) {
    case 'ST-06': case 'ST-07': case 'ST-10': return [];
    case 'ST-09': return [received, { ...answer, variant: 'tertiary' }]; // no Extend once the due date has passed (BR-02); answering stays least prominent (Q-05)
    case 'ST-03': return [answer];
    case 'ST-08': case 'ST-05': return [received, ...once, { ...answer, variant: 'tertiary' }];
    case 'ST-04': return [answer, ...askOnce];
    default: return [answer, ...once, ...askOnce];
  }
}

/** "3 Dec", with the year when it is not today's year: "3 Feb 2027". */
export const short = (day: string, today: string) => toDate(day).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', ...(day.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}), timeZone: 'UTC',
});

/** "1 day", "5 days" */
export const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
