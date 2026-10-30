import {
  errorMessage,
  type ActionResult,
  type FieldManagerActions,
} from "./field-manager-contract";

export function fieldActionsWithFeedback(
  actions: FieldManagerActions,
  notify: (message: string, kind?: "success" | "error") => void,
): FieldManagerActions {
  function wrap<T>(
    action: (input: T) => Promise<ActionResult>,
    subject: string,
    success?: string,
  ) {
    return async (input: T): Promise<ActionResult> => {
      let result: ActionResult;
      try {
        result = await action(input);
      } catch {
        result = { status: "error" };
      }
      if (result.status === "success") {
        if (success) notify(success, "success");
      } else notify(errorMessage(result, subject), "error");
      return result;
    };
  }
  return {
    createField: wrap(actions.createField, "Field", "Field created."),
    updateField: wrap(actions.updateField, "Field", "Field saved."),
    reorderFields: wrap(
      actions.reorderFields,
      "Field order",
      "Field order saved.",
    ),
    deleteField: wrap(
      actions.deleteField,
      "Field",
      "Field deleted. Its values and Gallery references were removed.",
    ),
    getFieldImpact: wrap(actions.getFieldImpact, "Field"),
    createOption: wrap(actions.createOption, "Option", "Option created."),
    updateOption: wrap(actions.updateOption, "Option", "Option saved."),
    reorderOptions: wrap(
      actions.reorderOptions,
      "Option order",
      "Option order saved.",
    ),
    deleteOption: wrap(
      actions.deleteOption,
      "Option",
      "Option deleted. Affected Items are now Uncategorized.",
    ),
    getOptionImpact: wrap(actions.getOptionImpact, "Option"),
  };
}
