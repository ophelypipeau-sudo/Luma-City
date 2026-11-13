import { useEffect, useState, type ComponentProps } from "react";
import { ArrowRight, Check, Eye, EyeOff, X } from "lucide-react";
import { playerNameSchema, starterPieces, type StarterOutfit } from "../../../packages/contracts/src/player-account";
import { avatarGarment } from "./avatar/catalog";
import { AvatarItemThumbnail } from "./avatar/LayeredDoll";
import { Portrait } from "./Avatar";
import "./player-welcome.css";

const categories = [
  ["hair", "Coiffure"], ["top", "T-shirt"], ["bottom", "Pantalon"], ["shoes", "Chaussures"],
] as const;

function PasswordField({ label, fieldName = "le mot de passe", ...input }: ComponentProps<"input"> & { label: string; fieldName?: string }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <>
      <label htmlFor={input.id}>{label}</label>
      <div className="player-password-field">
        <input {...input} type={visible ? "text" : "password"} />
        <button type="button" aria-controls={input.id}
          aria-label={`${visible ? "Masquer" : "Afficher"} ${fieldName}`}
          onClick={() => setVisible(value => !value)}>
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

export function PlayerWelcome({ busy, error, multiplayer, neonAuth, needsCharacter, checkName, submit, playDemo }: {
  busy: boolean;
  error: string;
  multiplayer: boolean;
  neonAuth: boolean;
  needsCharacter: boolean;
  checkName: (name: string) => Promise<boolean>;
  submit: (input: { name: string; email: string; password: string; outfit?: StarterOutfit }) => void;
  playDemo: (id: "iris" | "june") => void;
}) {
  const [registering, setCreating] = useState(true);
  const creating = registering || needsCharacter;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [outfit, setOutfit] = useState<StarterOutfit>({
    hair: starterPieces.hair[0], top: starterPieces.top[0],
    bottom: starterPieces.bottom[0], shoes: starterPieces.shoes[0],
  });
  const [availability, setAvailability] = useState<{ name: string; status: "free" | "taken" | "offline" }>();
  const parsed = playerNameSchema.safeParse(name);
  const checkedName = creating && parsed.success ? parsed.data : null;
  useEffect(() => {
    if (!checkedName) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkName(checkedName).then(
        (free) => { if (!cancelled) setAvailability({ name: checkedName, status: free ? "free" : "taken" }); },
        () => { if (!cancelled) setAvailability({ name: checkedName, status: "offline" }); },
      );
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [checkedName, checkName]);
  const status = checkedName && availability?.name === checkedName ? availability.status : undefined;
  const passwordsDiffer = passwordConfirmation !== "" && passwordConfirmation !== password;
  const showsName = creating || !neonAuth;
  const minimumPasswordLength = creating || !neonAuth ? 8 : 1;
  const valid = (!showsName || parsed.success) && (needsCharacter || password.length >= minimumPasswordLength) &&
    (!creating || (privacy && status !== "taken" && (needsCharacter || passwordConfirmation === password)));
  function switchMode(next: boolean) {
    setCreating(next);
    setPassword("");
    setPasswordConfirmation("");
    setAvailability(undefined);
  }
  return (
    <div className="modal-backdrop player-backdrop">
      <section className="player-welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <form className="player-form" onSubmit={(event) => {
          event.preventDefault();
          if (valid && !busy) submit({ name: parsed.data ?? "", email, password, outfit: creating ? outfit : undefined });
        }}>
          <p className="player-brand">Luma City</p>
          <h2 id="welcome-title">{creating ? "Crée ton personnage" : "Retrouve ton personnage"}</h2>
          {!needsCharacter && <div className="player-modes" aria-label="Accès au jeu">
            <button type="button" aria-pressed={creating} disabled={busy} onClick={() => switchMode(true)}>Créer un compte</button>
            <button type="button" aria-pressed={!creating} disabled={busy} onClick={() => switchMode(false)}>Se connecter</button>
          </div>}
          {showsName && <>
          <label htmlFor="player-name">Pseudo</label>
          <div className="player-name-field">
            <input id="player-name" autoComplete={neonAuth ? "nickname" : "username"} required maxLength={24} value={name}
              aria-invalid={status === "taken"} aria-describedby="player-name-status"
              onChange={(event) => setName(event.target.value)} />
            {status === "taken" && <X size={18} className="player-taken" aria-hidden="true" />}
            {status === "free" && <Check size={18} className="player-free" aria-hidden="true" />}
          </div>
          <small id="player-name-status" aria-live="polite" className={status === "taken" ? "player-taken" : ""}>
            {status === "taken" ? "Ce pseudo est déjà pris." : status === "free" ? "Ce pseudo est disponible."
              : checkedName && !status ? "Vérification du pseudo…" : creating ? "3 à 24 lettres, chiffres, tirets ou tirets bas." : ""}
          </small>
          </>}
          {neonAuth && !needsCharacter && <>
            <label htmlFor="player-email">Adresse e-mail</label>
            <input id="player-email" type="email" autoComplete={creating ? "email" : "username"}
              required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          </>}
          {!needsCharacter && <>
          <PasswordField key={String(creating)} label="Mot de passe" id="player-password"
            autoComplete={creating ? "new-password" : "current-password"}
            required minLength={minimumPasswordLength} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          </>}
          {creating && !needsCharacter && <>
            <small>8 caractères minimum.</small>
            <PasswordField label="Répéter le mot de passe" fieldName="la confirmation du mot de passe"
              id="player-password-confirmation" autoComplete="new-password"
              required minLength={8} maxLength={128} value={passwordConfirmation}
              aria-invalid={passwordsDiffer}
              aria-describedby={passwordsDiffer ? "player-password-mismatch" : undefined}
              onChange={(event) => setPasswordConfirmation(event.target.value)} />
            {passwordsDiffer && <small id="player-password-mismatch" className="player-taken" aria-live="polite">
              Les deux mots de passe ne correspondent pas.
            </small>}
          </>}
          {creating && <label className="player-privacy">
              <input type="checkbox" required checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
              <span>{neonAuth ? "J’ai compris que mon pseudo est visible dans le jeu." : "J’ai compris que mon pseudo est visible dans le jeu et que mon mot de passe est stocké sous forme protégée."}</span>
          </label>}
          {error && <p className="player-taken" role="alert">{error}</p>}
          <button className="primary-button player-enter" disabled={!valid || busy}>
            {creating ? "Créer et entrer dans le jeu" : "Entrer dans le jeu"} <ArrowRight size={17} />
          </button>
          <details className="player-demo">
            <summary>Comptes de démonstration</summary>
            <button type="button" disabled={busy} onClick={() => playDemo("iris")}>Iris</button>
            {multiplayer && <button type="button" disabled={busy} onClick={() => playDemo("june")}>June</button>}
          </details>
        </form>
        <div className="player-creator">
          <div className="player-preview" aria-label="Aperçu du personnage" role="img">
            <Portrait id="iris" layers={outfit} fullBody />
          </div>
          {creating && <div className="player-options">
            {categories.map(([slot, label]) => (
              <fieldset key={slot}>
                <legend>{label}</legend>
                <div className="player-pieces">
                  {starterPieces[slot].map((id) => {
                    const piece = avatarGarment(id);
                    return <button key={id} type="button" aria-pressed={outfit[slot] === id}
                      onClick={() => setOutfit((current) => ({ ...current, [slot]: id }))}>
                      <AvatarItemThumbnail piece={piece} /><span>{piece.name}</span>
                    </button>;
                  })}
                </div>
              </fieldset>
            ))}
          </div>}
        </div>
      </section>
    </div>
  );
}
