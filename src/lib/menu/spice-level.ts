export const MAX_SPICE_LEVEL = 3;

export type SpiceLevel = 1 | 2 | 3;

export function spiceLevelOf(option: {
  id?: string;
  optionId?: string;
  spiceLevel?: number;
}): SpiceLevel | undefined {
  if (option.spiceLevel === 1 || option.spiceLevel === 2 || option.spiceLevel === 3) {
    return option.spiceLevel;
  }
  const id = option.id ?? option.optionId;
  if (id === "mild-shito") {
    return 1;
  }
  if (id === "hot-shito") {
    return 3;
  }
  return undefined;
}

export function isHeatGroup(groupId: string): boolean {
  return groupId === "heat";
}
