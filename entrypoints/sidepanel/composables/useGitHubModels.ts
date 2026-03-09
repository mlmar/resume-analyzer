import { GitHubCatalogModel } from '@/entrypoints/types/GitHubCatalogModel';
import { MessageType } from '@/entrypoints/types/Message';
import { useChromeStorage } from '@/entrypoints/sidepanel/composables/useChromeStorage';
import { ANALYZE_MODEL } from '@/entrypoints/config/analyzeConfig';

export function useGitHubModels(token: Ref<string>) {
    const models = ref<GitHubCatalogModel[]>([]);
    const isLoading = ref(false);
    const selectedModel = useChromeStorage<string>('selected-model', ANALYZE_MODEL);

    async function fetchModels() {
        if (!token.value) return;
        isLoading.value = true;
        try {
            const response = await browser.runtime.sendMessage({
                type: MessageType.FetchModels,
                data: { token: token.value }
            });
            if (!response.success) return;
            const data = response.data as GitHubCatalogModel[];

            models.value = data.filter((model) =>
                model.supported_input_modalities?.includes('text') &&
                model.supported_output_modalities?.includes('text')
            ).map((model) => {
                return {
                    ...model,
                    id: model.id.split('/').at(-1)!
                }
            });

            if (models.value.length && !models.value.find(m => m.id === selectedModel.value)) {
                selectedModel.value = models.value[0].id;
            }
        } finally {
            isLoading.value = false;
        }
    }

    watch(token, (val) => { if (val) fetchModels(); }, { immediate: true });

    return { models, isLoading, selectedModel };
}
