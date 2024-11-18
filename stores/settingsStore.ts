const defaultSettings = {
  dpmm: 8,
  width: 55,
  height: 25,
};

type Settings = typeof defaultSettings;

export const useSettingsStore = defineStore(
  "settingsStore",
  () => {
    let prevSettings: Settings = defaultSettings;

    const settings = ref<Settings>(prevSettings);

    return { settings };
  },
  { persist: true }
);
