import { describe, expect, it, vi } from "vitest";

import {
  createField,
  createOption,
  deleteField,
  deleteOption,
  getFieldDeleteImpact,
  getOptionDeleteImpact,
  reorderFields,
  reorderOptions,
  updateField,
  updateOption,
  type FieldGateway,
} from "@/features/fields/service";

const userId = "90000000-0000-4000-8000-000000000099";
const collectionId = "90000000-0000-4000-8000-000000000001";
const fieldId = "91000000-0000-4000-8000-000000000001";
const optionId = "92000000-0000-4000-8000-000000000001";

function gateway(overrides: Partial<FieldGateway> = {}): FieldGateway {
  return {
    createFieldOwned: vi.fn(async () => ({
      data: { id: fieldId },
      error: null,
    })),
    createOptionOwned: vi.fn(async () => ({
      data: { id: optionId },
      error: null,
    })),
    deleteFieldOwned: vi.fn(async () => ({
      data: { affectedItemCount: 2, id: fieldId },
      error: null,
    })),
    deleteOptionOwned: vi.fn(async () => ({
      data: { affectedItemCount: 1, id: optionId },
      error: null,
    })),
    getFieldImpactOwned: vi.fn(async () => ({
      data: { affectedItemCount: 2 },
      error: null,
    })),
    getOptionImpactOwned: vi.fn(async () => ({
      data: { affectedItemCount: 1 },
      error: null,
    })),
    getUser: vi.fn(async () => ({ data: { id: userId }, error: null })),
    logError: vi.fn(),
    reorderFieldsOwned: vi.fn(async () => ({
      data: { id: collectionId },
      error: null,
    })),
    reorderOptionsOwned: vi.fn(async () => ({
      data: { id: fieldId },
      error: null,
    })),
    updateFieldOwned: vi.fn(async () => ({
      data: { id: fieldId },
      error: null,
    })),
    updateOptionOwned: vi.fn(async () => ({
      data: { id: optionId },
      error: null,
    })),
    ...overrides,
  };
}

describe("Field mutation service", () => {
  it("authenticates and creates fields without accepting an owner ID", async () => {
    const store = gateway();
    await expect(
      createField(
        { collectionId, name: "Rating", required: false, type: "rating" },
        store,
      ),
    ).resolves.toEqual({ data: { id: fieldId }, status: "success" });
    expect(store.createFieldOwned).toHaveBeenCalledWith(userId, {
      collectionId,
      name: "Rating",
      required: false,
      type: "rating",
    });
  });

  it("rejects attempts to mutate a field type before calling the gateway", async () => {
    const store = gateway();
    await expect(
      updateField(
        { collectionId, fieldId, name: "Score", type: "number" },
        store,
      ),
    ).resolves.toMatchObject({ status: "validation_error" });
    expect(store.updateFieldOwned).not.toHaveBeenCalled();
  });

  it("updates field identity without exposing a type mutation", async () => {
    const store = gateway();
    await expect(
      updateField(
        { collectionId, fieldId, name: "Score", required: true },
        store,
      ),
    ).resolves.toEqual({ data: { id: fieldId }, status: "success" });
    expect(store.updateFieldOwned).toHaveBeenCalledWith(userId, {
      collectionId,
      fieldId,
      name: "Score",
      required: true,
    });
  });

  it("rejects duplicate reorder IDs before writing", async () => {
    const store = gateway();
    await expect(
      reorderFields({ collectionId, fieldIds: [fieldId, fieldId] }, store),
    ).resolves.toMatchObject({ status: "validation_error" });
    expect(store.reorderFieldsOwned).not.toHaveBeenCalled();
  });

  it("sends complete ordered Field IDs to the owner-scoped gateway", async () => {
    const store = gateway();
    await expect(
      reorderFields({ collectionId, fieldIds: [fieldId] }, store),
    ).resolves.toEqual({
      data: { id: collectionId },
      status: "success",
    });
  });

  it("returns impact counts before and after atomic field cleanup", async () => {
    const store = gateway();
    await expect(
      getFieldDeleteImpact({ collectionId, fieldId }, store),
    ).resolves.toEqual({
      data: { affectedItemCount: 2 },
      status: "success",
    });
    await expect(
      deleteField({ collectionId, fieldId }, store),
    ).resolves.toEqual({
      data: { affectedItemCount: 2, id: fieldId },
      status: "success",
    });
  });

  it("preserves stable option IDs on rename/reorder and reports delete cleanup", async () => {
    const store = gateway();
    await expect(
      createOption({ collectionId, fieldId, label: "Kept" }, store),
    ).resolves.toEqual({
      data: { id: optionId },
      status: "success",
    });
    await expect(
      updateOption(
        { collectionId, fieldId, label: "Remembered", optionId },
        store,
      ),
    ).resolves.toEqual({ data: { id: optionId }, status: "success" });
    await expect(
      reorderOptions({ collectionId, fieldId, optionIds: [optionId] }, store),
    ).resolves.toEqual({ data: { id: fieldId }, status: "success" });
    await expect(
      getOptionDeleteImpact({ collectionId, fieldId, optionId }, store),
    ).resolves.toEqual({ data: { affectedItemCount: 1 }, status: "success" });
    await expect(
      deleteOption({ collectionId, fieldId, optionId }, store),
    ).resolves.toEqual({
      data: { affectedItemCount: 1, id: optionId },
      status: "success",
    });
  });

  it("uses not-found for direct IDs outside the owner scope", async () => {
    const store = gateway({
      getFieldImpactOwned: vi.fn(async () => ({ data: null, error: null })),
    });
    await expect(
      getFieldDeleteImpact({ collectionId, fieldId }, store),
    ).resolves.toEqual({
      status: "not_found",
    });
  });

  it.each(["23505", "22023", "23514"])(
    "returns a conflict for expected database error %s",
    async (code) => {
      const store = gateway({
        createFieldOwned: vi.fn(async () => ({
          data: null,
          error: { code },
        })),
      });
      await expect(
        createField(
          { collectionId, name: "Rating", required: false, type: "rating" },
          store,
        ),
      ).resolves.toEqual({ status: "conflict" });
      expect(store.logError).not.toHaveBeenCalled();
    },
  );

  it("keeps infrastructure failures distinct from expected conflicts", async () => {
    const store = gateway({
      createFieldOwned: vi.fn(async () => ({
        data: null,
        error: { code: "XX000" },
      })),
    });
    await expect(
      createField(
        { collectionId, name: "Rating", required: false, type: "rating" },
        store,
      ),
    ).resolves.toEqual({ status: "error" });
    expect(store.logError).toHaveBeenCalledOnce();
  });
});
