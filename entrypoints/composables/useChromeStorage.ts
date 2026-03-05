export function useChromeStorage<T>(key: string, defaultValue: T) {
    const state = ref(defaultValue);
    const isLoaded = ref(false);

    watch(state, (value) => {
        if (!isLoaded.value) return;
        chrome.storage.local.set({ [key]: value });
    });

    onMounted(async () => {
        const result = await chrome.storage.local.get([key]);
        state.value = result[key] ?? defaultValue;
        isLoaded.value = true;
    });

    return state;
}