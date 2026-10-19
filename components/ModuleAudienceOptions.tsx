// <option>s for a module's "who can see this" <select>, shared by the upload,
// edit, and send-now forms on Admin → Modules.
export function ModuleAudienceOptions({
  programs,
  professors,
  includeProfessors = true,
}: {
  programs: { id: string; name: string }[];
  professors: { id: string; full_name: string }[];
  includeProfessors?: boolean;
}) {
  return (
    <>
      {programs.length > 0 && (
        <optgroup label="One program">
          {programs.map((p) => (
            <option key={p.id} value={`program:${p.id}`}>{p.name}</option>
          ))}
        </optgroup>
      )}
      <optgroup label="Every program at a level">
        <option value="diploma">All Diploma / Certificate programs</option>
        <option value="bachelors">All Bachelor&apos;s programs</option>
        <option value="masters">All Master&apos;s programs</option>
        <option value="doctorate">All Doctorate programs</option>
      </optgroup>
      <optgroup label="Everyone">
        <option value="all">All students</option>
      </optgroup>
      {includeProfessors && professors.length > 0 && (
        <optgroup label="Specific Professor">
          {professors.map((p) => (
            <option key={p.id} value={`prof:${p.id}`}>{p.full_name}</option>
          ))}
        </optgroup>
      )}
    </>
  );
}
