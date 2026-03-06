<script lang="ts" setup>
const props = defineProps<{
    idleLabel: string;
    activeLabel: string;
    browseHint: string;
}>();

const emit = defineEmits<{
    select: [file: File];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref<string | null>(null);

function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        isDragging.value = false;
    }
}

function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging.value = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
        fileName.value = file.name;
        emit('select', file);
    }
}

function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        fileName.value = file.name;
        emit('select', file);
    }
}
</script>

<template>
    <label
        for="fileUpload"
        :aria-label="fileName ? `Selected file: ${fileName}. Click or drag to replace.` : 'File drop zone. Click or drag and drop a PDF to upload.'"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        :class="[
            'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
            'px-6 py-12 text-center cursor-pointer select-none transition-all duration-200',
            isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border bg-surface hover:border-border-strong hover:bg-page',
        ]"
    >
        <span class="relative flex items-center justify-center pointer-events-none">
            <i
                :class="[
                    'pi text-4xl transition-transform duration-300',
                    isDragging ? 'pi-cloud-download scale-125 text-primary' : fileName ? 'pi-file text-primary' : 'pi-folder-open text-muted',
                ]"
                aria-hidden="true"
            />
            <span v-if="isDragging" aria-hidden="true" class="absolute inline-flex h-full w-full rounded-full bg-primary opacity-30 animate-ping" />
        </span>
        <span class="pointer-events-none">
            <p class="font-semibold text-ink-secondary">
                {{ isDragging ? activeLabel : fileName ? fileName : idleLabel }}
            </p>
            <p class="text-faint mt-1">{{ browseHint }}</p>
        </span>

        <input id="fileUpload" ref="fileInput" type="file" accept="application/pdf" class="hidden" @change="onFileChange" />
    </label>
</template>
