export function Declaration() {
  return (
    <div className="rounded-lg border border-slate-700 bg-ink p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold">Declaration</p>
      <p className="mt-2 text-sm text-slate-300">
        I declare that I have a genuine intention to study the course for which I have applied
        and that I have secured, or intend to secure, sufficient funds to cover all tuition fees
        and related costs for the duration of my studies.
      </p>
      <p className="mt-2 text-sm text-slate-300">
        I understand and agree that tuition fees are non-refundable after four (4) weeks from the
        commencement date of the course.
      </p>
      <p className="mt-2 text-sm text-slate-300">
        By signing this declaration, I acknowledge that I have read, understood, and agreed to
        these terms and conditions.
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          name="declaration_accepted"
          value="on"
          required
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-ink text-gold focus:ring-gold"
        />
        <span>I have read, understood, and agree to the declaration above.</span>
      </label>
    </div>
  );
}
