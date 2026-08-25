import { useStore } from "@/store/useStore";

const INTENSITY_SCALE: Record<string, number> = {
  medium: 5,
  high: 12.5,
};

export const triggerHaptic = (pattern: number | number[] = 10) => {
  const { settings } = useStore.getState();
  if (!settings.hapticsEnabled || !navigator.vibrate) return;
  const scale = INTENSITY_SCALE[settings.hapticsIntensity ?? "medium"];
  const scaled = Array.isArray(pattern)
    ? pattern.map((v) => Math.round(v * scale))
    : Math.round((pattern as number) * scale);
  navigator.vibrate(scaled);
};

export const hapticLight = () => triggerHaptic(10);
export const hapticMedium = () => triggerHaptic([10, 50, 20]);
export const hapticSuccess = () => triggerHaptic([10, 30, 10]);
