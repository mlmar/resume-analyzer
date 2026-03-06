<script lang="ts" setup>
import { GithubModelResponse, InferenceAPI } from '@/entrypoints/sidepanel/lib/InferenceAPI';
import { PDFUtil } from '@/entrypoints/sidepanel/lib/PDFUtil';
import FileDropInput from '@/entrypoints/sidepanel/components/FileDropInput.vue';
import StatusCard from '@/entrypoints/sidepanel/components/StatusCard.vue';
import { InspectAPI } from '@/entrypoints/sidepanel/lib/InspectAPI';
import { MessageType } from '@/entrypoints/types/Message';
import { useChromeStorage } from '@/entrypoints/sidepanel/composables/useChromeStorage';

const token = useChromeStorage<string>('token', '');
const selectedFile = useChromeStorage<File | null>('selected-file', null);
const isProcessing = ref(false);
const isDone = ref(false);
const error = ref('');
const jobText = ref<string[]>([]);
const analysis = ref<GithubModelResponse | null>(null);
const isInspecting = ref(false);

const styles = {
    header: 'font-semibold text-muted uppercase',
    analysisItem: 'flex flex-col gap-3 bg-surface border border-border-strong rounded-xl px-4 py-3 text-ink',
    analysisItemHeader: 'text-xl font-semibold text-muted uppercase',
};

const statusVariant = computed<'processing' | 'done' | 'error' | null>(() => {
    if (error.value) return 'error';
    if (isProcessing.value) return 'processing';
    if (isDone.value) return 'done';
    return null;
});

const statusLabel = computed(() => {
    if (error.value) return error.value;
    if (isProcessing.value) return 'Analyzing resume...';
    if (isDone.value) return 'Done. Results logged to console.';
    return undefined;
});

function handleReset() {
    isProcessing.value = false;
    isDone.value = false;
    error.value = '';
    jobText.value = [];
    analysis.value = null;
    isInspecting.value = false;
}

async function handleSubmit() {
    if (!selectedFile.value || !jobText.value.length) {
        return;
    }

    error.value = '';
    isDone.value = false;
    isProcessing.value = true;

    try {
        const resumeText = await PDFUtil.read(selectedFile.value);

        analysis.value = await InferenceAPI.prompt({
            resume: resumeText,
            job: jobText.value.join('\n'),
            token: token.value,
        });
        isDone.value = true;
    } catch (err) {
        error.value = 'Something went wrong. Check your token and try again.';
    } finally {
        isProcessing.value = false;
    }
}

function handleToggleInspect(toggled?: boolean) {
    isInspecting.value = toggled ?? !isInspecting.value;
    jobText.value = [];
    InspectAPI.toggle();
}

function handleInspectSelect(text: string[]) {
    jobText.value = text;
}

onMounted(() => {
    InspectAPI.open();
    InspectAPI.addListener(MessageType.Reset, handleReset);
    InspectAPI.addListener(MessageType.Text, handleInspectSelect);
});

onUnmounted(() => {
    InspectAPI.close();
});
</script>

<template>
    <main class="flex flex-col h-full w-full bg-page text-ink overflow-hidden">
        <header class="shrink-0 flex items-center gap-2.5 px-4 py-3 bg-surface border-b border-border">
            <span
                class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-page flex items-center justify-center select-none"
                aria-hidden="true"
            >
                <i class="pi pi-file-pdf" />
            </span>
            <h1 class="font-semibold">Resume Analyzer</h1>
        </header>

        <section class="overflow-y-auto flex flex-col">
            <form class="flex flex-col gap-4 p-4" aria-label="Resume analyzer" @submit.prevent="handleSubmit">
                <div class="flex flex-col gap-1.5">
                    <label for="token" :class="styles.header">GitHub Model Token</label>
                    <input
                        id="token"
                        type="password"
                        v-model="token"
                        placeholder="github_pat__xxxxxxxxxxxx"
                        autofocus
                        class="bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-ink placeholder-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <FileDropInput
                    v-model="selectedFile"
                    idle-label="Drag & drop your resume"
                    active-label="Release to analyze"
                    browse-hint="or click to browse"
                />

                <StatusCard :variant="statusVariant" :label="statusLabel" />
                <button
                    class="rounded-2xl border-1 border-border bg-ink text-white p-2 cursor-pointer ring-2 hover:ring-primary/20 transition-all hover:bg-muted"
                    :class="{ isInspecting: 'ring-primary/20' }"
                    @click="() => handleToggleInspect()"
                    type="button"
                >
                    {{ isInspecting ? 'Clear ' + jobText.length + ' Elements' : 'Select Job Description' }}
                </button>
                <button
                    class="rounded-2xl border-1 border-border bg-ink text-white p-2 cursor-pointer ring-2 hover:ring-primary/20 transition-all hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                    type="submit"
                    :disabled="!token || !selectedFile || !jobText.length"
                >
                    Analyze
                </button>
            </form>
            <section class="flex flex-col gap-1 p-4">
                <h2 :class="styles.header">Analysis</h2>
                <ul class="flex flex-col gap-4">
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Match Score</span>
                        <span>{{ analysis?.matchScore }}</span>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Matching Skills</span>
                        <span>{{ analysis?.matchingSkills }}</span>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Missing Skills</span>
                        <span>{{ analysis?.missingSkills }}</span>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Summary</span>
                        <span>{{ analysis?.summary }}</span>
                    </li>
                </ul>
            </section>
        </section>
    </main>
</template>

<style scoped></style>
