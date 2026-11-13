import { mkdir, readFile, writeFile, rename, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AtelierDraft,
  DraftInput,
  WorkshopPublication,
} from "../../../packages/contracts/src/atelier.ts";
import {
  checkIds,
  defaultDraft,
} from "../../../packages/contracts/src/atelier.ts";
import {
  imageUpload,
  normalizePiece,
  defaultMask,
  dyeProfile,
  inspectPiece,
  pngPixels,
} from "./atelier-images.ts";
import type { AtelierProvider } from "./atelier-provider.ts";
type Stored = {
  draft: AtelierDraft;
  mime: string;
  publications: WorkshopPublication[];
};
export class AtelierStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    readonly root: string,
    private body: Buffer,
    readonly provider?: AtelierProvider,
  ) {}
  async recoverInterrupted() {
    await mkdir(this.root, { recursive: true });
    for (const id of await readdir(this.root)) {
      if (!/^[0-9a-f-]{36}$/.test(id)) continue;
      const item = await this.load(id).catch(() => null);
      if (item?.draft.status === "preparing") {
        item.draft.status = "failed";
        item.draft.job = undefined;
        item.draft.error =
          "Traitement interrompu par le redémarrage du serveur. La source est conservée ; relancer manuellement.";
        this.touch(item);
        await this.save(item);
      }
    }
  }
  private serial<T>(fn: () => Promise<T>) {
    const t = this.queue.then(fn);
    this.queue = t.catch(() => {});
    return t;
  }
  private dir(id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Import inconnu.");
    return join(this.root, id);
  }
  private async load(id: string, owner?: string, includeTrash = false) {
    let item: Stored;
    try {
      item = JSON.parse(
        await readFile(join(this.dir(id), "draft.json"), "utf8"),
      );
    } catch {
      throw new Error("Import inconnu.");
    }
    if (owner && item.draft.owner !== owner) throw new Error("Import inconnu.");
    if (owner && item.draft.trashedAt && !includeTrash)
      throw new Error(
        "Cet import est dans la corbeille. Restaure-le pour le modifier.",
      );
    return item;
  }
  private async save(item: Stored) {
    const path = join(this.dir(item.draft.id), "draft.json");
    await writeFile(path + ".tmp", JSON.stringify(item, null, 2));
    // Windows can briefly lock the destination while a polling request reads it.
    // Keep the old complete file until its atomic replacement succeeds.
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(path + ".tmp", path);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 5 || (code !== "EPERM" && code !== "EBUSY")) throw error;
        await new Promise((resolve) => setTimeout(resolve, 20 * 2 ** attempt));
      }
    }
  }
  private touch(item: Stored) {
    item.draft.revision++;
    item.draft.updatedAt = new Date().toISOString();
  }
  async list(owner: string, trash = false) {
    await mkdir(this.root, { recursive: true });
    const names = await readdir(this.root);
    const items = await Promise.all(
      names
        .filter((n) => /^[0-9a-f-]{36}$/.test(n))
        .map((n) => this.load(n).catch(() => null)),
    );
    return items
      .filter(
        (i): i is Stored =>
          !!i && i.draft.owner === owner && !!i.draft.trashedAt === trash,
      )
      .map((i) => i.draft)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(owner: string, id: string) {
    return (await this.load(id, owner)).draft;
  }
  async trash(owner: string, id: string, restore = false) {
    return this.serial(async () => {
      const item = await this.load(id, owner, true);
      if (item.draft.status === "preparing")
        throw new Error(
          "Attends la fin du traitement avant de supprimer cet import.",
        );
      item.draft.trashedAt = restore ? undefined : new Date().toISOString();
      this.touch(item);
      await this.save(item);
      return item.draft;
    });
  }
  async catalog() {
    await mkdir(this.root, { recursive: true });
    const names = await readdir(this.root);
    const rows = await Promise.all(
      names
        .filter((n) => /^[0-9a-f-]{36}$/.test(n))
        .map((n) => this.load(n).catch(() => null)),
    );
    return rows.flatMap((i) => (i && !i.draft.trashedAt ? i.publications : []));
  }
  async create(owner: string, dataUrl: unknown) {
    return this.serial(async () => {
      const source = imageUpload(dataUrl),
        id = randomUUID(),
        now = new Date().toISOString();
      await mkdir(this.dir(id), { recursive: true });
      await writeFile(join(this.dir(id), "source.bin"), source.bytes);
      const item: Stored = {
        mime: source.mime,
        publications: [],
        draft: {
          ...defaultDraft,
          id,
          owner,
          revision: 1,
          status: "draft",
          createdAt: now,
          updatedAt: now,
          sourceUrl: `/api/atelier/assets/${id}/source`,
          warnings: [
            "Vérifier les zones cachées et les coutures dans l’aperçu avant publication.",
          ],
        },
      };
      await this.save(item);
      return item.draft;
    });
  }
  async update(owner: string, id: string, revision: number, patch: DraftInput) {
    return this.serial(async () => {
      const item = await this.load(id, owner);
      if (item.draft.revision !== revision)
        throw new Error(
          "Ce brouillon a changé. Recharge-le avant de sauvegarder.",
        );
      if (item.draft.status === "preparing")
        throw new Error("Un traitement est déjà en cours.");
      const moved =
        JSON.stringify(item.draft.placement) !==
          JSON.stringify(patch.placement) ||
        item.draft.pattern !== patch.pattern;
      item.draft = {
        ...item.draft,
        ...patch,
        status: item.draft.preparedUrl ? "review" : "draft",
        checks: moved ? [] : patch.checks,
        report: moved ? undefined : item.draft.report,
      };
      this.touch(item);
      await this.save(item);
      return item.draft;
    });
  }
  private async install(item: Stored, bytes: Buffer, registered: boolean) {
    const front = normalizePiece(bytes, item.draft.pattern, registered),
      dir = this.dir(item.draft.id),
      v = item.draft.revision + 1;
    const main = defaultMask(front, false),
      detail = defaultMask(front, true);
    const profile = dyeProfile(front, main, detail);
    await writeFile(join(dir, "front.png"), front);
    await writeFile(join(dir, "mask1.png"), main);
    await writeFile(join(dir, "mask2.png"), detail);
    if (
      !item.draft.preparedUrl &&
      item.draft.mainColor === defaultDraft.mainColor &&
      profile.baseColor
    )
      item.draft.mainColor = profile.baseColor;
    item.draft.mainTone = profile.mainTone;
    item.draft.detailTone = profile.detailTone;
    item.draft.preparedUrl = `/api/atelier/assets/${item.draft.id}/front?v=${v}`;
    item.draft.mask1Url = `/api/atelier/assets/${item.draft.id}/mask1?v=${v}`;
    item.draft.mask2Url = `/api/atelier/assets/${item.draft.id}/mask2?v=${v}`;
    item.draft.status = "review";
    item.draft.checks = [];
    item.draft.report = inspectPiece(front, this.body, item.draft.placement);
    item.draft.warnings = [
      "Le tissu entier reçoit la première teinte. Isole une seconde matière si nécessaire et protège les motifs, boucles et ornements avec le pinceau.",
      "Les contrôles géométriques ne valident pas la qualité du dessin.",
    ];
    item.draft.error = undefined;
    this.touch(item);
    await this.save(item);
    return item.draft;
  }
  async uploadPrepared(
    owner: string,
    id: string,
    dataUrl: unknown,
    registered: boolean,
  ) {
    return this.serial(async () => {
      const item = await this.load(id, owner);
      if (item.draft.status === "preparing")
        throw new Error("Traitement en cours.");
      const upload = imageUpload(dataUrl);
      if (upload.mime !== "image/png")
        throw new Error("Calque PNG transparent requis.");
      await writeFile(
        join(this.dir(id), "prepared-original.png"),
        upload.bytes,
      );
      return this.install(item, upload.bytes, registered);
    });
  }
  async masks(owner: string, id: string, one: unknown, two: unknown) {
    return this.serial(async () => {
      const item = await this.load(id, owner);
      if (!item.draft.preparedUrl || item.draft.status === "preparing")
        throw new Error("Préparer le vêtement avant les masques.");
      const files = (
        [
          ["mask1", one],
          ["mask2", two],
        ] as const
      ).map(([name, value]) => {
        const file = imageUpload(value);
        const p = pngPixels(file.bytes);
        if (p.width !== 887 || p.height !== 1774)
          throw new Error("Les masques doivent garder le repère 887 × 1774.");
        return { name, bytes: file.bytes };
      });
      for (const { name, bytes } of files) {
        await writeFile(join(this.dir(id), name + ".png"), bytes);
      }
      const profile = dyeProfile(
        await readFile(join(this.dir(id), "front.png")),
        files[0].bytes,
        files[1].bytes,
      );
      item.draft.mainTone = profile.mainTone;
      item.draft.detailTone = profile.detailTone;
      this.touch(item);
      item.draft.status = "review";
      item.draft.checks = item.draft.checks.filter((c) => c !== "colors");
      item.draft.mask1Url = `/api/atelier/assets/${id}/mask1?v=${item.draft.revision}`;
      item.draft.mask2Url = `/api/atelier/assets/${id}/mask2?v=${item.draft.revision}`;
      await this.save(item);
      return item.draft;
    });
  }
  async inspect(owner: string, id: string) {
    return this.serial(async () => {
      const item = await this.load(id, owner);
      if (!item.draft.preparedUrl) throw new Error("Aucun vêtement préparé.");
      item.draft.report = inspectPiece(
        await readFile(join(this.dir(id), "front.png")),
        this.body,
        item.draft.placement,
      );
      this.touch(item);
      await this.save(item);
      return item.draft;
    });
  }
  async publish(owner: string, id: string) {
    return this.serial(async () => {
      const item = await this.load(id, owner),
        d = item.draft;
      if (d.status !== "review")
        throw new Error("Le vêtement doit être en révision avant publication.");
      if (!checkIds.every((c) => d.checks.includes(c)))
        throw new Error(
          "Valider tous les raccords et les couleurs avant publication.",
        );
      d.report = inspectPiece(
        await readFile(join(this.dir(id), "front.png")),
        this.body,
        d.placement,
      );
      if (d.report.some((r) => r.blocking && !r.ok)) {
        await this.save(item);
        throw new Error(
          "Corriger les contrôles de placement avant publication.",
        );
      }
      const version = item.publications.length + 1,
        prefix = `v${version}-`;
      for (const file of ["front", "mask1", "mask2"])
        await writeFile(
          join(this.dir(id), prefix + file + ".png"),
          await readFile(join(this.dir(id), file + ".png")),
        );
      const pub: WorkshopPublication = {
        id: `atelier.${id}.v${version}`,
        name: d.name,
        price: d.price,
        pattern: d.pattern,
        front: `/api/atelier/assets/${id}/${prefix}front`,
        mask1: `/api/atelier/assets/${id}/${prefix}mask1`,
        mask2: d.hasDetail
          ? `/api/atelier/assets/${id}/${prefix}mask2`
          : undefined,
        mainColor: d.mainColor,
        detailColor: d.detailColor,
        detailLabel: d.detailLabel,
        mainTone: d.mainTone,
        detailTone: d.hasDetail ? d.detailTone : undefined,
        hasDetail: d.hasDetail,
        placement: d.placement,
        version,
      };
      item.publications.push(pub);
      d.status = "published";
      d.publishedId = pub.id;
      this.touch(item);
      await this.save(item);
      return { draft: d, publication: pub };
    });
  }
  async start(owner: string, id: string, kind: "analyze" | "prepare") {
    if (!this.provider)
      throw new Error(
        "Configurer OPENAI_API_KEY dans le fichier .env du serveur pour activer l’import photo.",
      );
    const item = await this.serial(async () => {
      const i = await this.load(id, owner);
      if (i.draft.status === "preparing")
        throw new Error("Un traitement est déjà en cours.");
      i.draft.status = "preparing";
      i.draft.job = kind;
      i.draft.error = undefined;
      this.touch(i);
      await this.save(i);
      return i;
    });
    void (async () => {
      try {
        const source = await readFile(join(this.dir(id), "source.bin"));
        if (kind === "analyze") {
          const analysis = await this.provider!.analyze({
            bytes: source,
            mime: item.mime,
          });
          await this.serial(async () => {
            const i = await this.load(id, owner);
            i.draft.analysis = analysis;
            i.draft.status = i.draft.preparedUrl ? "review" : "draft";
            i.draft.job = undefined;
            this.touch(i);
            await this.save(i);
          });
        } else {
          const result = await this.provider!.prepare({
            source,
            mime: item.mime,
            body: this.body,
            pattern: item.draft.pattern,
            name: item.draft.name,
            notes: item.draft.notes,
          });
          await this.serial(async () => {
            const i = await this.load(id, owner);
            await writeFile(
              join(this.dir(id), "generated-original.png"),
              result.png,
            );
            await writeFile(
              join(this.dir(id), "generation-prompt.txt"),
              result.prompt,
            );
            i.draft.job = undefined;
            await this.install(i, result.png, true);
          });
        }
      } catch (error) {
        await this.serial(async () => {
          const i = await this.load(id, owner);
          i.draft.status = "failed";
          i.draft.job = undefined;
          i.draft.error =
            error instanceof Error ? error.message : "Échec du traitement";
          this.touch(i);
          await this.save(i);
        });
      }
    })();
    return item.draft;
  }
  async asset(owner: string, id: string, file: string) {
    const item = await this.load(id);
    const published =
      /^v\d+-(front|mask1|mask2)$/.test(file) &&
      item.publications.some(
        (p) =>
          p.front.endsWith("/" + file) ||
          p.mask1?.endsWith("/" + file) ||
          p.mask2?.endsWith("/" + file),
      );
    if (item.draft.owner !== owner && !published)
      throw new Error("Image inconnue.");
    if (file === "source")
      return {
        bytes: await readFile(join(this.dir(id), "source.bin")),
        mime: item.mime,
      };
    if (!/^(front|mask1|mask2|v\d+-(front|mask1|mask2))$/.test(file))
      throw new Error("Image inconnue.");
    return {
      bytes: await readFile(join(this.dir(id), file + ".png")),
      mime: "image/png",
    };
  }
}
