import { randomUUID } from "node:crypto";
import type { Presence, RoomId } from "../../../packages/contracts/src/index.ts";
import { homeOwner } from "../../../packages/contracts/src/index.ts";
import type { HomePoint, HomeSnapshot } from "../../../packages/contracts/src/housing.ts";
import { canStandInHome, createHomeNavigationMesh, findHomePath, HOME_MOVE_SPEED, homeDistance,
  nearestHomePoint, sampleHomeMotion, type HomeNavigationMesh } from "../../../packages/domain/src/home-navigation.ts";
import { PlayerError } from "./wardrobe.ts";

type Player = Presence & { roomId: RoomId | null };
/** Uses the existing presence map; no second multiplayer authority or database. */
export function createHomeNavigation(players: Map<string, Player>, now = Date.now) {
  const scenes = new Map<string, { revision: number; mesh: HomeNavigationMesh }>();
  function sample(player: Player, time = now()) {
    if (player.motion) {
      const point = sampleHomeMotion(player.motion, time);
      player.x = point.x / 10; player.y = point.y / 6.8;
    }
    return { x: player.x * 10, y: player.y * 6.8 };
  }
  function stop(player: Player, time = now()) { sample(player, time); delete player.motion; }
  function move(player: Player, destination: HomePoint, time = now()) {
    const owner = homeOwner(player.roomId ?? "greenhouse"), scene = owner && scenes.get(owner);
    if (!scene) throw new PlayerError("Le salon n’est pas encore prêt pour le déplacement.");
    const start = sample(player, time), points = findHomePath(scene.mesh, start, destination);
    if (!points) throw new PlayerError("Cet emplacement est inaccessible. Choisis une zone libre au sol.");
    if (points.length < 2) { stop(player, time); return; }
    player.motion = { id: randomUUID(), points, startedAt: time, speed: HOME_MOVE_SPEED, revision: scene.revision };
  }
  function update(home: HomeSnapshot, time = now()) {
    const previous = scenes.get(home.ownerId);
    if (previous && previous.revision >= home.revision) return;
    const mesh = createHomeNavigationMesh(home);
    scenes.set(home.ownerId, { mesh, revision: home.revision });
    for (const player of players.values()) {
      if (player.roomId !== `home:${home.ownerId}`) continue;
      const destination = player.motion?.points.at(-1);
      const point = sample(player, time), safe = nearestHomePoint(mesh, point);
      stop(player, time);
      if (!safe) continue; // Saves with no free ground are rejected before commit.
      player.x = safe.x / 10; player.y = safe.y / 6.8;
      if (destination && canStandInHome(mesh, destination)) {
        const path = findHomePath(mesh, safe, destination);
        if (path && path.length > 1) player.motion = {
          id: randomUUID(), points: path, startedAt: time, speed: HOME_MOVE_SPEED, revision: home.revision,
        };
      }
    }
  }
  function spawn(home: HomeSnapshot) {
    update(home);
    const occupants = [...players.values()].filter((p) => p.roomId === `home:${home.ownerId}`).map((p) => sample(p));
    const mesh = scenes.get(home.ownerId)!.mesh;
    // Arrival spacing, without a second physics engine or blocking player movement.
    return nearestHomePoint(mesh, { x: 750, y: 565 }, (point) => occupants.every((other) => homeDistance(point, other) >= 140))
      ?? nearestHomePoint(mesh, { x: 750, y: 565 }, (point) => occupants.every((other) => homeDistance(point, other) >= 90))
      ?? nearestHomePoint(mesh, { x: 750, y: 565 }, (point) => occupants.every((other) => homeDistance(point, other) >= 40));
  }
  function settle(time = now()) {
    let changed = false;
    for (const p of players.values()) if (p.motion && sampleHomeMotion(p.motion, time).done) {
      stop(p, time); changed = true;
    }
    return changed;
  }
  function prune() {
    const active = new Set([...players.values()].map((p) => homeOwner(p.roomId ?? "greenhouse")));
    for (const owner of scenes.keys()) if (!active.has(owner)) scenes.delete(owner);
  }
  return { sample, move, stop, update, spawn, settle, prune };
}
