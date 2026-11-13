import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Gift,
  Heart,
  House,
  IdCard,
  MessageCircle,
  Pencil,
  Quote,
  Shirt,
  Star,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import {
  PROFILE_XP,
  levelProgress,
  PROFILE_RELATIONS,
  PROFILE_RELATION_SLOTS,
  PROFILE_IMAGE_MAX_CHARS,
  type Character,
  type GiftItem,
  type ProfileRelation,
  type ProfileSocial,
  type ProfileTemplate,
} from "../../../packages/contracts/src/index";
import { Portrait } from "./Avatar";
import { MottoEditor } from "./MottoEditor";
import { avatarGarment } from "./avatar/catalog";
import { AvatarItemThumbnail } from "./avatar/LayeredDoll";
import type { AvatarLayers } from "./avatar/model";
import { ProfileWardrobe } from "./ProfileWardrobe";

export type ProfileAction =
  | { type: "like" | "photo" }
  | { type: "look-like"; lookKey: string }
  | { type: "guestbook"; body: string }
  | { type: "relation"; kind: ProfileRelation; accept: boolean }
  | { type: "decline-friend" }
  | { type: "gift"; item: GiftItem; id: string };

const relations = {
  friend: { label: "Ajouter en ami", accepted: "Amis", Icon: UserPlus },
  "best-friend": {
    label: "Proposer d’être meilleurs amis",
    accepted: "Meilleurs amis",
    Icon: Star,
  },
  romance: {
    label: "Proposer d’être en couple",
    accepted: "En couple",
    Icon: Heart,
  },
};

const templateLabels: Record<ProfileTemplate, string> = {
  image: "Importer mon image de profil",
  solid: "Rose uni",
  stardust: "Poussière d’étoiles",
  constellation: "Constellation lilas",
};
async function prepareProfileImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12_000_000)
    throw new Error("Choisis une image PNG, JPEG ou WebP de 12 Mo maximum.");
  const image = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 720 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Impossible de préparer cette image.");
    context.fillStyle = "#fce1ed";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = canvas.toDataURL("image/jpeg", 0.78);
    if (encoded.length > PROFILE_IMAGE_MAX_CHARS) throw new Error("Cette image est trop volumineuse.");
    return encoded;
  } finally {
    image.close();
  }
}

export function ProfileCard({
  character,
  viewerLayers,
  own,
  blocked,
  generation,
  requestVersion,
  purchased,
  onProfile,
  onHome,
  onClose,
  onMessage,
  onSave,
  canUploadImage,
  onWear,
  onResetXp,
  loadSocial,
  act,
  rewards,
}: {
  character: Character;
  viewerLayers: AvatarLayers;
  own: boolean;
  blocked?: boolean;
  generation: number;
  requestVersion?: number;
  purchased: readonly GiftItem[];
  onProfile: () => void;
  onHome: () => void;
  onClose: () => void;
  onMessage: () => void;
  onSave: (motto: string, template?: ProfileTemplate, image?: string) => Promise<void>;
  canUploadImage?: boolean;
  onWear: (layers: AvatarLayers) => void;
  onResetXp?: (start: "start" | "near-level") => Promise<number>;
  loadSocial: (id: string) => Promise<ProfileSocial>;
  act: (id: string, action: ProfileAction) => Promise<ProfileSocial>;
  rewards?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [view, setView] = useState<"card" | "gift" | "wardrobe">("card");
  const [social, setSocial] = useState<ProfileSocial>();
  const [editing, setEditing] = useState(false);
  const savedTemplate = character.profile_template === "garden" ? "solid" : character.profile_template ?? "solid";
  const [draftTemplate, setDraftTemplate] = useState<ProfileTemplate>("solid");
  const [draftImage, setDraftImage] = useState<string>();
  const [imageError, setImageError] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const template = editing ? draftTemplate : savedTemplate;
  const savedImage = character.profile_image_version
    ? `/api/profile/image/${encodeURIComponent(character.id)}/${encodeURIComponent(character.profile_image_version)}`
    : undefined;
  const backgroundImage = template === "image" ? (editing ? draftImage ?? savedImage : savedImage) : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [giftChoice, setGiftChoice] = useState<GiftItem>();
  const giftCommand = useRef<string | undefined>(undefined);
  const layers = own ? viewerLayers : undefined;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    let current = true;
    loadSocial(character.id)
      .then((result) => {
        if (current) setSocial(result);
      })
      .catch((cause: Error) => {
        if (current) setError(cause.message);
      });
    return () => {
      current = false;
    };
  }, [character.id, generation, loadSocial, requestVersion]);

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action indisponible.");
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: typeof view) {
    setError("");
    setNotice("");
    setEditing(false);
    setView(next);
  }

  function changeSocial(action: ProfileAction) {
    void perform(async () => {
      const updated = await act(character.id, action);
      setSocial(updated);
      if (updated.xpSent) setNotice(`${updated.xpSent} XP dans le magazine de ${character.name}.`);
      if (action.type === "gift") {
        navigate("card");
        setNotice("Cadeau envoyé.");
      }
    });
  }

  const interactionDisabled = own || blocked || busy || !social;
  const featured = social?.featuredRelations;
  const relationshipSlots = [
    ...Array.from({ length: PROFILE_RELATION_SLOTS["best-friend"] }, (_, index) => ({
      label: `Meilleur ami ${index + 1}`,
      person: featured?.bestFriends[index],
      Icon: Star,
    })),
    { label: "Couple", person: featured?.partner, Icon: Heart },
  ];
  const subtitle = {
    card: character.name,
    gift: `Un cadeau pour ${character.name}`,
    wardrobe: "Mon dressing",
  }[view];

  return (
    <dialog
      className={`profile-card profile-card-${view === "card" ? "summary" : view}`}
      data-template={template}
      style={backgroundImage ? { "--profile-image": `url("${backgroundImage}")` } as CSSProperties : undefined}
      data-editing={editing}
      ref={dialog}
      aria-labelledby={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="profile-window">
        <header>
          {view === "card" ? (
            <span className="profile-level">
              Niv. {levelProgress(character.xp ?? 0).level}
            </span>
          ) : (
            <button
              type="button"
              aria-label="Retour à la fiche"
              onClick={() => navigate("card")}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 id={title}>{subtitle}</h2>
          {view === "card" && (
            <button
              type="button"
              className="profile-like"
              aria-label={social?.liked ? "Aimé" : "J’aime"}
              title={
                own
                  ? "Les J’aime reçus sur ton profil"
                  : social?.liked
                    ? "Profil déjà aimé"
                    : `Offrir ${PROFILE_XP.like} XP à ${character.name}`
              }
              aria-pressed={social?.liked ?? false}
              disabled={interactionDisabled || social?.liked}
              onClick={() => changeSocial({ type: "like" })}
            >
              <Heart size={17} fill={social?.liked ? "currentColor" : "none"} />
              {!!social?.likes && <span>{social.likes}</span>}
            </button>
          )}
          <button type="button" aria-label="Fermer le profil" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {view === "card" && (
          <div className="profile-content">
            <div className="profile-actions">
              {onResetXp && (
                <div
                  className="profile-relations"
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        setNotice(
                          `Test réinitialisé à ${await onResetXp("start")} XP.`,
                        );
                      })
                    }
                  >
                    Repartir à 0 XP
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        setNotice(
                          `Test réglé à ${await onResetXp("near-level")} XP.`,
                        );
                      })
                    }
                  >
                    Tester un passage de niveau
                  </button>
                </div>
              )}
              {own && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftTemplate(savedTemplate);
                    setDraftImage(undefined);
                    setImageError("");
                    setEditing(true);
                  }}
                  disabled={editing}
                >
                  <Pencil size={15} /> Modifier mon profil
                </button>
              )}
              <div className="profile-relations" aria-label="Relations">
                {PROFILE_RELATIONS.map((kind) => {
                  const { label, accepted, Icon } = relations[kind];
                  const state = social?.relations[kind];
                  const text =
                    state === "incoming"
                      ? `Accepter · ${accepted.toLowerCase()}`
                      : state === "outgoing"
                        ? "Demande envoyée"
                        : state === "accepted"
                          ? accepted
                          : label;
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-label={text}
                      title={text}
                      data-status={state}
                      disabled={
                        interactionDisabled ||
                        state === "accepted" ||
                        state === "outgoing"
                      }
                      onClick={() =>
                        changeSocial({
                          type: "relation",
                          kind,
                          accept: state === "incoming",
                        })
                      }
                    >
                      <Icon size={19} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="profile-avatar">
              <Portrait {...character} fullBody layers={layers} />
            </div>
            <div className="profile-note">
              {editing ? (
                <MottoEditor
                  initial={character.motto ?? ""}
                  onSave={async (motto) => {
                    if (loadingImage) throw new Error("L’image est en cours de préparation.");
                    await onSave(motto, draftTemplate === savedTemplate && !draftImage ? undefined : draftTemplate,
                      draftTemplate === "image" ? draftImage : undefined);
                  }}
                  onClose={() => setEditing(false)}
                >
                  <div className="profile-template-options">
                    {(["constellation", "solid", "stardust"] as const).map((option) => (
                      <label key={option}>
                        <input type="radio" name={`${title}-template`} checked={draftTemplate === option}
                          onChange={() => setDraftTemplate(option)} />
                        <span className="profile-template-swatch" data-template={option} aria-hidden="true">
                          {option !== "solid" ? <Star size={15} fill="currentColor" /> : null}
                        </span>
                        {templateLabels[option]}
                      </label>
                    ))}
                    <button type="button" className="profile-image-option" disabled={!canUploadImage || loadingImage}
                      onClick={() => imageInput.current?.click()}>
                      <ImagePlus size={17} aria-hidden="true" />
                      <span>{templateLabels.image}</span><b>VIP</b>
                    </button>
                  </div>
                  <input type="file" ref={imageInput} hidden accept="image/png,image/jpeg,image/webp"
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        input.value = "";
                        if (!file) return;
                        setLoadingImage(true);
                        setImageError("");
                        try {
                          setDraftImage(await prepareProfileImage(file));
                          setDraftTemplate("image");
                        } catch (cause) {
                          setImageError(cause instanceof Error ? cause.message : "Impossible de lire cette image.");
                        } finally {
                          setLoadingImage(false);
                        }
                      }} />
                  {imageError && <p role="alert">{imageError}</p>}
                </MottoEditor>
              ) : (
                <p className="profile-quote">
                  <Quote size={16} aria-hidden="true" />
                  <span>{character.motto || "Aucun texte pour le moment."}</span>
                </p>
              )}
              <ul className="profile-featured-relations" aria-label="Meilleurs amis et couple">
                {relationshipSlots.map(({ label, person, Icon }) => (
                  <li key={label} className="profile-relation-slot" aria-label={`${label} · ${person?.name ?? "Place libre"}`} title={`${label} · ${person?.name ?? "Place libre"}`}>
                    <span className="profile-relation-portrait" data-empty={!person}>
                      {person ? <Portrait id={person.id} /> : <UserRound size={20} aria-hidden="true" />}
                      <span className="profile-relation-badge">
                        <Icon size={10} fill="currentColor" aria-hidden="true" />
                      </span>
                    </span>
                    {person && <span className="profile-relation-name">{person.name}</span>}
                  </li>
                ))}
              </ul>
              <div
                className="profile-quick-actions"
                aria-label="Actions du profil"
              >
                <button
                  type="button"
                  onClick={() => changeSocial({ type: "photo" })}
                  disabled={interactionDisabled || social?.photographed}
                  title={`Offrir ${PROFILE_XP.photo} XP à ${character.name}`}
                >
                  <Camera /> {social?.photographed ? "Photo faite" : "Photo"}
                </button>
                <button type="button" onClick={onProfile}>
                  <IdCard /> Livre d’or
                </button>
                {!own && social?.lookKey && (
                  <button type="button" aria-pressed={social.lookLiked}
                    disabled={interactionDisabled || social.lookLiked}
                    onClick={() => changeSocial({ type: "look-like", lookKey: social.lookKey! })}>
                    <Heart /> {social.lookLiked ? "Look aimé" : "J’aime ce look"}
                    {social.lookLikes > 0 ? ` · ${social.lookLikes}` : ""}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onMessage}
                  disabled={own || blocked}
                >
                  <MessageCircle /> Message
                </button>
                <button type="button" onClick={onHome} disabled={blocked}>
                  <House /> Maison
                </button>
                <button
                  type="button"
                  onClick={() => navigate("gift")}
                  disabled={interactionDisabled}
                >
                  <Gift /> Cadeau
                </button>
                {own && (
                  <button type="button" onClick={() => navigate("wardrobe")}>
                    <Shirt /> Mon dressing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "wardrobe" && own && (
          <ProfileWardrobe
            character={character}
            equipped={viewerLayers}
            items={purchased}
            onSave={(outfit) => {
              void perform(async () => {
                onWear(outfit);
                navigate("card");
                setNotice("Tenue enregistrée.");
              });
            }}
          />
        )}

        {view === "gift" && (
          <div className="profile-detail-panel">
            {purchased.length === 0 ? (
              <p>Tu n’as aucun vêtement acheté à offrir.</p>
            ) : (
              <>
                <div
                  className="profile-gift-options"
                  aria-label="Vêtements achetés"
                >
                  {purchased.map((item) => {
                    const piece = avatarGarment(item.pieceId);
                    return (
                      <button
                        type="button"
                        key={item.key}
                        aria-pressed={giftChoice?.key === item.key}
                        onClick={() => {
                          setGiftChoice(item);
                          giftCommand.current = crypto.randomUUID();
                        }}
                      >
                        <AvatarItemThumbnail
                          piece={piece}
                          color={item.color}
                          detailColor={item.detailColor}
                        />
                        {piece.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={interactionDisabled || !giftChoice}
                  onClick={() =>
                    giftChoice &&
                    giftCommand.current &&
                    changeSocial({
                      type: "gift",
                      item: giftChoice,
                      id: giftCommand.current,
                    })
                  }
                >
                  Offrir le vêtement à {character.name}
                </button>
              </>
            )}
          </div>
        )}

        {rewards}
        {notice && (
          <p className="profile-feedback" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="profile-feedback" role="alert">
            {error}
          </p>
        )}
      </div>
    </dialog>
  );
}
