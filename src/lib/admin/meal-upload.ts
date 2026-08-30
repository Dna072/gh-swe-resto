export function defaultMealAltText(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${trimmed} plated` : "";
}

export function mealUploadIssue(input: {
  mealId?: string;
  file: File | null;
  altText: string;
}): string | null {
  if (!input.mealId) {
    return "Save the meal first, then upload a photograph.";
  }
  if (!input.file) {
    return "Choose a photograph first.";
  }
  if (!input.altText.trim()) {
    return "Describe the plate in alt text before uploading.";
  }
  return null;
}
