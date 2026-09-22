import { describe, expect, it, beforeEach } from "vitest";
import { emptyAlbum } from "./album.ts";
import { InMemoryAlbumStore, LocalStorageAlbumStore } from "./album-store.ts";

function state(stamps: string[]) {
  return { ...emptyAlbum("m1"), stamps, albumPullFor: "2025-W39" };
}

describe("InMemoryAlbumStore", () => {
  it("saves and reads an Album per manager", async () => {
    const store = new InMemoryAlbumStore();
    await store.saveState(state(["A"]));

    expect(await store.getState("m1")).toEqual(state(["A"]));
    expect(await store.getState("m2")).toBeUndefined();
  });
});

describe("LocalStorageAlbumStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists stamps across store instances", async () => {
    const first = new LocalStorageAlbumStore();
    await first.saveState(state(["A", "B"]));

    const second = new LocalStorageAlbumStore();
    expect(await second.getState("m1")).toEqual(state(["A", "B"]));
  });
});
