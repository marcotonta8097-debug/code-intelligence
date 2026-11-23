import { describe, expect, it } from "vitest";
import {
  cintEntityStore,
  cintMemoryTableKey,
  cintRowBelongsToProject,
} from "@/lib/cint/cintEntityStore";

describe("cintEntityStore project_id isolation (Tier 1)", () => {
  it("namespaces memory tables by projectId", () => {
    expect(cintMemoryTableKey("proj_a", "findings")).toBe("proj_a::findings");
    expect(cintMemoryTableKey("proj_b", "findings")).toBe("proj_b::findings");
    expect(() => cintMemoryTableKey("local", "findings")).toThrow(/projectId/);
  });

  it("does not leak rows across projects", async () => {
    const a = `cint_iso_a_${Date.now()}`;
    const b = `cint_iso_b_${Date.now()}`;
    await cintEntityStore.create(
      "findings",
      { id: `f_${a}`, title: "only A", severity: "low", status: "open", confidence: "low" },
      a,
    );
    await cintEntityStore.create(
      "findings",
      { id: `f_${b}`, title: "only B", severity: "low", status: "open", confidence: "low" },
      b,
    );

    const listA = await cintEntityStore.list("findings", a);
    const listB = await cintEntityStore.list("findings", b);
    expect(listA.some((r) => String(r.id) === `f_${a}`)).toBe(true);
    expect(listA.some((r) => String(r.id) === `f_${b}`)).toBe(false);
    expect(listB.some((r) => String(r.id) === `f_${b}`)).toBe(true);
    expect(listB.some((r) => String(r.id) === `f_${a}`)).toBe(false);

    expect(await cintEntityStore.get("findings", `f_${a}`, b)).toBeNull();
    expect(cintRowBelongsToProject((await cintEntityStore.get("findings", `f_${a}`, a))!, a)).toBe(
      true,
    );
  });
});
