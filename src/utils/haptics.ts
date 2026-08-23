import { useStore } from "@/store/useStore";

export const triggerHaptic = (pattern: number | number[] = 10) => {
  const { settings } = useStore.getState();
  if (!settings.hapticsEnabled || !navigator.vibrate) return;
  navigator.vibrate(pattern);
};

export const hapticLight = () => triggerHaptic(10);
export const hapticMedium = () => triggerHaptic([10, 50, 20]);
export const hapticSuccess = () => triggerHaptic([10, 30, 10]);
