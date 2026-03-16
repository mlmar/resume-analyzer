<script lang="ts" setup>
import { InferenceAPI } from '@/entrypoints/sidepanel/lib/InferenceAPI';
import { Inspector } from '@/entrypoints/sidepanel/lib/Inspector';
import { PDFUtil } from '@/entrypoints/sidepanel/lib/PDFUtil';
import { MessageType } from '@/entrypoints/types/Message';
import { useChromeStorage } from '@/entrypoints/sidepanel/composables/useChromeStorage';
import { useGitHubModels } from '@/entrypoints/sidepanel/composables/useGitHubModels';
import { GithubModelResponse } from '@/entrypoints/types/GithubModelResponse';
import FileDropInput from '@/entrypoints/sidepanel/components/FileDropInput.vue';
import StatusCard from '@/entrypoints/sidepanel/components/StatusCard.vue';
import ProtectedPasswordInput from '@/entrypoints/sidepanel/components/ProtectedPasswordInput.vue';

// Styles
const styles = {
    header: 'font-semibold text-muted uppercase',
    analysisItem: 'flex flex-col gap-3 bg-surface border border-border-strong rounded-xl px-4 py-3 text-ink',
    analysisItemHeader: 'text-xl font-semibold text-muted uppercase',
    skillsList: 'flex gap-2 flex-wrap sa',
    skillsListItem: 'p-2 border border-border rounded-xl cursor-pointer hover:bg-highlight-hover',
    activeSkill: 'bg-highlight border-highlight-border text-highlight-text',
    modelSelect:
        'rounded-2xl px-4 py-3 bg-surface border border-border-strong text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-primary',
};

// State
const token = useChromeStorage<string>('token', import.meta.env.WXT_GITHUB_MODEL_API_KEY);
const { models, isLoading: isLoadingModels, selectedModel } = useGitHubModels(token);

const resumeFile = ref<File | null>(null);
const isProcessing = ref(false);
const isDone = ref(false);
const error = ref('');
const jobText = ref<string[]>([]);
const analysis = ref<GithubModelResponse | null>(null);
const isInspecting = ref(false);
const activeSkill = ref<string | null>(null);

const inspector = new Inspector();

// Status states
const statusVariant = computed<'processing' | 'done' | 'error' | null>(() => {
    if (error.value) return 'error';
    if (isProcessing.value) return 'processing';
    if (isDone.value) return 'done';
    return null;
});

const statusLabel = computed(() => {
    if (error.value) return error.value;
    if (isProcessing.value) return 'Analyzing resume...';
    if (isDone.value) return 'Done. See results below.';
    return undefined;
});

// UI State Reset
function handleReset() {
    jobText.value = [];
    isInspecting.value = false;
    activeSkill.value = null;
}

// Fetches analysis
async function getAnalysis() {
    if (!resumeFile.value || !jobText.value.length) {
        return;
    }

    error.value = '';
    isDone.value = false;
    isProcessing.value = true;

    try {
        const resumeText = await PDFUtil.read(resumeFile.value);

        analysis.value = await InferenceAPI.prompt({
            resume: resumeText,
            job: jobText.value.join('\n'),
            token: token.value,
            model: selectedModel.value,
        });
        isDone.value = true;
    } catch (err) {
        error.value = (err as Error).message || 'Something went wrong. Check your token, resume, or job description and try again.';
    } finally {
        isProcessing.value = false;
    }
}

// Handles pdf file change
function handleResumeFileChange(file: File) {
    resumeFile.value = file;
}

// Toggles selection mmode
function handleToggleInspect() {
    isInspecting.value = !isInspecting.value;
    inspector.toggle();
}

// Clears selected text and state
function handleClearInspect() {
    jobText.value = [];
    inspector.clear();
}

// Adds selected text to state
function handleSelectInspect(text: string[]) {
    jobText.value = text;
}

// Highlights clicked skill
function handleSkillClick(skill: string) {
    if (activeSkill.value === skill) {
        activeSkill.value = null;
        inspector.highlight(null);
    } else {
        activeSkill.value = skill;
        inspector.highlight(skill);
    }
}

onMounted(() => {
    inspector.open();
    inspector.addListener(MessageType.Reset, handleReset);
    inspector.addListener(MessageType.Text, handleSelectInspect);
});

onUnmounted(() => {
    inspector.close();
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

        <section class="overflow-y-auto flex flex-col basis-full">
            <form class="flex flex-col h-full gap-4 p-4" aria-label="Resume analyzer" @submit.prevent="getAnalysis">
                <section class="flex flex-col gap-2">
                    <label for="token" :class="styles.header">GitHub Model Token</label>
                    <ProtectedPasswordInput id="token" v-model="token" placeholder="github_pat__xxxxxxxxxxxx" />
                </section>

                <section class="flex flex-col gap-2">
                    <label for="model" :class="styles.header">Model</label>
                    <select id="model" v-model="selectedModel" :disabled="isLoadingModels || !models.length" :class="styles.modelSelect">
                        <option v-if="!models.length" value="" disabled>
                            {{ isLoadingModels ? 'Loading models...' : 'Enter token to load models' }}
                        </option>
                        <option v-for="model in models" :key="model.id" :value="model.id">
                            {{ model.name }}
                        </option>
                    </select>
                </section>

                <FileDropInput
                    idle-label="Drag & drop your resume"
                    active-label="Release to analyze"
                    browse-hint="or click to browse"
                    @select="handleResumeFileChange"
                />

                <section class="flex gap-2">
                    <button
                        :class="[
                            'flex-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium cursor-pointer transition-all duration-200',
                            isInspecting
                                ? 'bg-primary/10 text-primary border-2 border-primary ring-2 ring-primary/20 hover:bg-primary/15'
                                : 'bg-surface border-2 border-border-strong text-ink hover:border-primary hover:text-primary hover:bg-primary/5',
                        ]"
                        @click="() => handleToggleInspect()"
                        type="button"
                    >
                        <template v-if="!isInspecting"> Select Job Description </template>
                        <template v-if="isInspecting"> Exit Selection Mode </template>
                    </button>
                    <button
                        v-if="jobText.length"
                        class="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium cursor-pointer transition-all duration-200 bg-surface border-2 border-border-strong text-red-500 hover:border-red-500 hover:bg-red-500/5"
                        @click="() => handleClearInspect()"
                        type="button"
                    >
                        <i class="pi pi-times-circle" />
                        Clear
                    </button>
                </section>
                <button
                    class="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white cursor-pointer transition-all duration-200 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                    type="submit"
                    :disabled="!token || !resumeFile || !jobText.length"
                >
                    <i class="pi pi-bolt" />
                    Analyze
                </button>
                <StatusCard :variant="statusVariant" :label="statusLabel" />
            </form>
            <section class="flex flex-col gap-2 p-4" v-if="analysis">
                <h2 :class="styles.header">Analysis</h2>
                <ul class="flex flex-col gap-2">
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Match Score</span>
                        <div class="flex gap-4">
                            <span
                                class="text-[5em] font-semibold leading-none"
                                :class="{
                                    'text-score-high': analysis.matchScore >= 80,
                                    'text-score-medium': analysis.matchScore < 80 && analysis.matchScore >= 60,
                                    'text-score-low': analysis.matchScore < 60 && analysis.matchScore >= 40,
                                    'text-score-poor': analysis.matchScore < 40,
                                }"
                                >{{ analysis.matchScore }}%
                            </span>
                        </div>
                    </li>
                    <li v-if="analysis.employeeSentimentScore !== null" :class="styles.analysisItem">
                        <span :class="styles.header">Employee Sentiment (Glassdoor / Indeed)</span>
                        <div class="flex items-center gap-2 mb-1">
                            <i
                                v-for="n in 5"
                                :key="n"
                                :class="[
                                    'sentiment-dot text-xl pi',
                                    {
                                        'pi-star text-sentiment-empty': n > analysis.employeeSentimentScore,
                                        'pi-star-fill text-sentiment-filled': n <= analysis.employeeSentimentScore,
                                    },
                                ]"
                            />
                            <span v-if="analysis.employeeSentimentScore !== null" class="text-sm">{{ analysis.employeeSentimentScore }}/5</span>
                        </div>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Expected Level & Salary</span>
                        <div class="flex gap-4">
                            <span>{{ analysis.level }} ({{ analysis.salary }})</span>
                        </div>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Summary</span>
                        <span>{{ analysis.summary }}</span>
                    </li>

                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Matching Skills</span>
                        <ul :class="styles.skillsList">
                            <li
                                v-for="skill in analysis.matchingSkills"
                                :class="[styles.skillsListItem, activeSkill === skill ? styles.activeSkill : '']"
                                @click="handleSkillClick(skill)"
                            >
                                {{ skill }}
                            </li>
                        </ul>
                    </li>
                    <li :class="styles.analysisItem">
                        <span :class="styles.header">Missing Skills</span>
                        <ul :class="styles.skillsList">
                            <li
                                v-for="skill in analysis.missingSkills"
                                :class="[styles.skillsListItem, activeSkill === skill ? styles.activeSkill : '']"
                                @click="handleSkillClick(skill)"
                            >
                                {{ skill }}
                            </li>
                        </ul>
                    </li>
                </ul>
            </section>
        </section>
    </main>
</template>

<style scoped></style>
