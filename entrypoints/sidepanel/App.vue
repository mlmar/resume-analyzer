<script lang="ts" setup>
import { InferenceAPI } from '@/entrypoints/sidepanel/util/InferenceAPI';
import { PDFUtil } from '@/entrypoints/sidepanel/util/PDFUtil';
import FileDropInput from '@/components/FileDropInput.vue';
import StatusCard from '@/components/StatusCard.vue';

const token = ref('');
const selectedFile = ref<File | null>(null);
const isProcessing = ref(false);
const isDone = ref(false);
const errorMsg = ref('');

watch(selectedFile, async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        errorMsg.value = 'Please upload a valid PDF file.';
        return;
    }
    errorMsg.value = '';
    isDone.value = false;
    isProcessing.value = true;

    try {
        const text = await PDFUtil.read(file);
        await InferenceAPI.prompt(
            'Summarize this resume in 3-5 sentences, highlighting key skills, experience, and accomplishments: ' + text,
            token.value,
        );
        isDone.value = true;
    } catch (err) {
        errorMsg.value = 'Something went wrong. Check your token and try again.';
    } finally {
        isProcessing.value = false;
    }
});
</script>

<template>
    <main class="flex flex-col h-full w-full bg-page text-ink overflow-hidden">
        <header class="shrink-0 flex items-center gap-2.5 px-4 py-3 bg-surface border-b border-border">
            <span
                class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-page text-sm flex items-center justify-center select-none"
                aria-hidden="true"
            >
                <i class="pi pi-file-pdf" />
            </span>
            <h1 class="text-sm font-semibold">Resume Analyzer</h1>
        </header>

        <form class="flex flex-col gap-4 p-4 flex-1 overflow-y-auto" aria-label="Resume analyzer" @submit.prevent>
            <div class="flex flex-col gap-1.5">
                <label for="token" class="text-xs font-semibold text-muted uppercase">GitHub Model Token</label>
                <input
                    id="token"
                    type="password"
                    v-model="token"
                    placeholder="github_pat__xxxxxxxxxxxx"
                    autofocus
                    class="bg-surface border border-border-strong rounded-xl px-3 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>

            <FileDropInput
                v-model="selectedFile"
                idle-label="Drag & drop your resume"
                active-label="Release to analyze"
                browse-hint="or click to browse"
            />

            <StatusCard
                :is-processing="isProcessing"
                :is-done="isDone"
                :error-msg="errorMsg"
                processing-label="Analyzing resume..."
                done-label="Done. Results logged to console."
            />
        </form>
    </main>
</template>

<style scoped></style>
