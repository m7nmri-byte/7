/** تحويل بين ISO وقيمة حقل datetime-local المحلّي */
export const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(+d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};

export const fromLocal = (v: string) => new Date(v).toISOString();

export const minutesBetween = (startIso: string, endIso: string) =>
  Math.max(0, Math.round((+new Date(endIso) - +new Date(startIso)) / 60000));

export const shiftMinutes = (startIso: string, minutes: number) =>
  new Date(+new Date(startIso) + minutes * 60000).toISOString();
