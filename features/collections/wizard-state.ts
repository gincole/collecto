export type CollectionWizardState = {
  fieldErrors?: {
    description?: string;
    name?: string;
    presetKey?: string;
    fields?: string;
  };
  message?: string;
  status: "error" | "idle" | "success";
};

export type CollectionWizardAction = (
  previousState: CollectionWizardState,
  formData: FormData,
) => Promise<CollectionWizardState>;
