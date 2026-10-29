export type CollectionWizardState = {
  fieldErrors?: { description?: string; name?: string; presetKey?: string };
  message?: string;
  status: "error" | "idle";
};

export type CollectionWizardAction = (
  previousState: CollectionWizardState,
  formData: FormData,
) => Promise<CollectionWizardState>;
