<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import { HistoryEntry } from '@/entrypoints/types/GithubModelResponse';
import { matchScoreClass } from '@/entrypoints/sidepanel/lib/matchScoreClass';
import { toCSV, downloadCSV } from '@/entrypoints/sidepanel/lib/CSVUtil';

const props = defineProps<{
    history: HistoryEntry[];
}>();

const emit = defineEmits<{
    select: [entry: HistoryEntry];
    clear: [];
    rename: [index: number, name: string];
}>();

const headerStyle = 'font-semibold text-muted uppercase';

const editingIndex = ref<number | null>(null);
const editingName = ref('');

async function startEdit(index: number, name: string) {
    editingIndex.value = index;
    editingName.value = name;
    await nextTick();
}

function commitEdit(index: number) {
    if (editingIndex.value !== index) return;
    emit('rename', index, editingName.value.trim() || props.history[index].name);
    editingIndex.value = null;
}

function handleDownloadCSV() {
    const headers = ['Name', 'Match Score', 'Level', 'Salary', 'Matching Skills', 'Missing Skills', 'Summary', 'Suggestion'];
    const rows = props.history.map((e) => [
        e.name,
        e.matchScore,
        e.level,
        e.salary,
        e.matchingSkills.join('; '),
        e.missingSkills.join('; '),
        e.summary,
        e.suggestion,
    ]);
    downloadCSV('resume-history.csv', toCSV(headers, rows));
}
</script>

<template>
    <section class="overflow-y-auto flex flex-col basis-full p-4 gap-3">
        <div class="flex items-center justify-between">
            <h2 :class="headerStyle">History</h2>
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium border border-border-strong text-muted hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    :disabled="!history.length"
                    @click="handleDownloadCSV"
                >
                    <i class="pi pi-download text-xs" />
                    CSV
                </button>
                <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium border border-border-strong text-red-500 hover:border-red-500 hover:bg-red-500/5 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    :disabled="!history.length"
                    @click="emit('clear')"
                >
                    <i class="pi pi-trash text-xs" />
                    Clear
                </button>
            </div>
        </div>

        <p v-if="!history.length" class="text-muted text-sm text-center py-8">No history yet. Run an analysis to get started.</p>

        <ul v-else class="flex flex-col gap-2">
            <li
                v-for="(entry, i) in history"
                :key="i"
                class="flex items-center justify-between gap-3 bg-surface border border-border-strong rounded-xl px-4 py-3 transition-all duration-150"
                :class="editingIndex !== i ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5' : 'border-primary/40'"
                @click="editingIndex !== i && emit('select', entry)"
            >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <input
                        v-if="editingIndex === i"
                        v-model="editingName"
                        :ref="(el) => el && (el as HTMLInputElement).focus()"
                        class="text-sm text-ink bg-transparent border-b border-primary outline-none flex-1 min-w-0"
                        @click.stop
                        @keydown.enter.prevent="commitEdit(i)"
                        @keydown.escape.prevent="editingIndex = null"
                        @blur="commitEdit(i)"
                    />
                    <div v-else class="flex items-center gap-1.5 min-w-0">
                        <span class="text-sm text-ink truncate">{{ entry.name }}</span>
                    </div>
                    <button
                        type="button"
                        :aria-label="editingIndex === i ? 'Save name' : 'Edit name'"
                        class="shrink-0 text-muted hover:text-ink transition-colors duration-150 cursor-pointer"
                        @click.stop="editingIndex === i ? commitEdit(i) : startEdit(i, entry.name)"
                    >
                        <i :class="editingIndex === i ? 'pi pi-check text-primary' : 'pi pi-pencil'" class="text-sm" />
                    </button>
                    <a
                        v-if="entry.jobUrl"
                        :href="entry.jobUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        :title="entry.jobUrl"
                        class="shrink-0 text-muted hover:text-primary transition-colors duration-150"
                        @click.stop
                    >
                        <i class="pi pi-external-link text-sm" />
                    </a>
                </div>
                <span class="text-lg font-semibold leading-none shrink-0" :class="matchScoreClass(entry.matchScore)">{{ entry.matchScore }}%</span>
            </li>
        </ul>
    </section>
</template>
