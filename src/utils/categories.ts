import { useStore } from "@/store/useStore";

export const suggestCategory = (description: string): string | null => {
  const { categories } = useStore.getState();
  const lower = description.toLowerCase();

  for (const cat of categories) {
    if (cat.keywords.some((k) => lower.includes(k))) {
      return cat.id;
    }
  }
  return null;
};
