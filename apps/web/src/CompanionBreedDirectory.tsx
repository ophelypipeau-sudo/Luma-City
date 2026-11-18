import { useId, useState } from "react";
import { FCI_BREEDS, FCI_BREED_SOURCE, LOOF_BREEDS, LOOF_BREED_SOURCE } from "../../../packages/domain/src/companion-breed-references";
import { COMPANION_BREEDS, companionVariants, type CompanionBreedId } from "../../../packages/domain/src/companions";

const breedByStandard = new Map<string, CompanionBreedId>(
  (Object.keys(COMPANION_BREEDS) as CompanionBreedId[]).flatMap((id) => {
    const breed = COMPANION_BREEDS[id];
    return "standard" in breed && companionVariants(id).length ? [[breed.standard, id] as const] : [];
  }),
);
const fciSearchNames: Partial<Record<string, string>> = {
  "15": "Malinois Groenendael Tervueren Laekenois",
  "97": "Loulou de Poméranie Pomeranian Spitz nain",
  "148": "Teckel nain Kaninchen poil ras poil long poil dur",
  "172": "Caniche toy nain moyen grand",
  "257": "Shiba Inu",
};

const directories = {
  Chiens: {
    breeds: FCI_BREEDS,
    source: FCI_BREED_SOURCE,
    federation: "FCI",
    provisional: "Reconnaissance provisoire",
  },
  Chats: {
    breeds: LOOF_BREEDS,
    source: LOOF_BREED_SOURCE,
    federation: "LOOF",
    provisional: "Nouvelle race",
  },
};

const searchKey = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function CompanionBreedDirectory({ onBrowse }: {
  onBrowse: (breed: CompanionBreedId, trigger: HTMLButtonElement) => void;
}) {
  const field = useId();
  const [species, setSpecies] = useState<keyof typeof directories>("Chiens");
  const [query, setQuery] = useState("");
  const directory = directories[species];
  const availableCount = directory.breeds.filter(([code]) => breedByStandard.has(code)).length;
  const terms = searchKey(query).split(" ");
  const entries = directory.breeds.flatMap(([code, name, original, provisional]) => {
    const breedId = breedByStandard.get(code);
    const inGameName = breedId && COMPANION_BREEDS[breedId].name;
    const searchable = searchKey([name, original, inGameName, code, species === "Chiens" ? fciSearchNames[code] : ""].join(" "));
    return terms.every((term) => searchable.includes(term))
      ? [{ code, name, provisional, breedId, inGameName }] : [];
  });

  return <section className="companion-directory" aria-label="Répertoire des races FCI et LOOF">
    <div className="companion-directory-tools">
      <div className="companion-directory-species" role="group" aria-label="Espèce">
        <button type="button" aria-pressed={species === "Chiens"} onClick={() => { setSpecies("Chiens"); setQuery(""); }}>Chiens</button>
        <button type="button" aria-pressed={species === "Chats"} onClick={() => { setSpecies("Chats"); setQuery(""); }}>Chats</button>
      </div>
      <label htmlFor={field}>Rechercher une race</label>
      <input id={field} type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
    </div>
    <p className="companion-directory-source">
      {entries.length} sur {directory.breeds.length} entrées · {availableCount} adoptables ·{" "}
      <a href={directory.source} target="_blank" rel="noreferrer">Liste officielle {directory.federation}</a>
    </p>
    {entries.length ? <ul className="companion-directory-list" aria-label={`Races · ${species}`}>
      {entries.map(({ code, name, provisional, breedId, inGameName }) => <li key={code}>
        <div><strong>{name}</strong>{provisional && <small>{directory.provisional}</small>}</div>
        {breedId
          ? <button type="button" aria-label={`Voir les pelages · ${inGameName}`}
              onClick={(event) => onBrowse(breedId, event.currentTarget)}>Voir les pelages</button>
          : <small>À illustrer</small>}
      </li>)}
    </ul> : <p>Aucune race trouvée.</p>}
  </section>;
}
