import { useId, useState, type ReactNode } from "react";
import { PROFILE_MOTTO_MAX } from "../../../packages/contracts/src/index";

export function MottoEditor({
  initial,
  onSave,
  onClose,
  children,
}: {
  initial: string;
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}) {
  const field = useId();
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="motto-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");
        try {
          await onSave(draft.trim());
          onClose();
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "La bulle n’a pas été enregistrée.",
          );
          setSaving(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <label htmlFor={field}>Ma bulle de profil</label>
      <textarea
        id={field}
        rows={3}
        autoFocus
        value={draft}
        maxLength={PROFILE_MOTTO_MAX}
        onChange={(event) => setDraft(event.target.value)}
      />
      <small>
        {draft.length}/{PROFILE_MOTTO_MAX}
      </small>
      {children && <fieldset className="profile-template-field" disabled={saving}>
        <legend>Fond du profil</legend>
        {children}
      </fieldset>}
      {error && <p role="alert">{error}</p>}
      <div className="profile-form-actions">
        <button type="button" disabled={saving} onClick={onClose}>
          Annuler
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
