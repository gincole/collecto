import {
  createFieldAction,
  createOptionAction,
  deleteFieldAction,
  deleteOptionAction,
  getFieldDeleteImpactAction,
  getOptionDeleteImpactAction,
  reorderFieldsAction,
  reorderOptionsAction,
  updateFieldAction,
  updateOptionAction,
} from "./actions";
import type { FieldManagerActions } from "./field-manager-contract";

export const fieldActions = {
  createField: createFieldAction,
  createOption: createOptionAction,
  deleteField: deleteFieldAction,
  deleteOption: deleteOptionAction,
  getFieldImpact: getFieldDeleteImpactAction,
  getOptionImpact: getOptionDeleteImpactAction,
  reorderFields: reorderFieldsAction,
  reorderOptions: reorderOptionsAction,
  updateField: updateFieldAction,
  updateOption: updateOptionAction,
} satisfies FieldManagerActions;
