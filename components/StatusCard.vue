<script lang="ts" setup>
defineProps<{
    isProcessing: boolean;
    isDone: boolean;
    errorMsg: string;
    processingLabel: string;
    doneLabel: string;
}>();
</script>

<template>
    <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
    >
        <output
            v-if="isProcessing || isDone"
            aria-live="polite"
            :aria-label="isProcessing ? processingLabel : doneLabel"
            class="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-border"
        >
            <i
                :class="['pi text-xl shrink-0', isProcessing ? 'pi-spinner pi-spin text-primary-light' : 'pi-check-circle text-success']"
                aria-hidden="true"
            />
            <p class="text-xs text-muted">
                <span v-if="isProcessing">{{ processingLabel }}</span>
                <span v-else-if="isDone">{{ doneLabel }}</span>
            </p>
        </output>
    </Transition>

    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
        <p v-if="errorMsg" role="alert" class="flex items-center gap-2 bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-sm text-error">
            <i class="pi pi-exclamation-triangle shrink-0" aria-hidden="true" />
            <span>{{ errorMsg }}</span>
        </p>
    </Transition>
</template>
