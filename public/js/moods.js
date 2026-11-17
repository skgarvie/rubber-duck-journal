// Mood scale: 1 (terrible) → 5 (fantastic), coloured black → blue → green.
// Colours mirror the --mood-* tokens in css/app.css.
export const MOODS = Object.freeze([
  { value: 1, label: 'Terrible', color: '#0b0b0f' },
  { value: 2, label: 'Bad', color: '#1e2a6b' },
  { value: 3, label: 'Okay', color: '#2563eb' },
  { value: 4, label: 'Good', color: '#0d7f74' },
  { value: 5, label: 'Fantastic', color: '#15803d' },
]);

export function moodByValue(value) {
  const n = Number(value);
  return MOODS.find((m) => m.value === n) || null;
}
