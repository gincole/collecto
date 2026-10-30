export type ItemFieldOption = { id: string; label: string; position: number };
export type ItemFieldDefinition = {
  id: string;
  name: string;
  options: ItemFieldOption[];
  position: number;
  required: boolean;
  type: "text" | "number" | "date" | "rating" | "select" | "url";
};
export type ItemValue = string | number;
export type ItemRecord = {
  collectionId: string;
  createdAt: string;
  description: string | null;
  id: string;
  imagePath?: string | null;
  title: string;
  updatedAt: string;
  values: Record<string, ItemValue>;
};
