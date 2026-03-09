<script lang="ts" setup>
const styles = {
    input: 'flex items-center rounded-xl border px-3 py-2.5 transition-all w-full bg-transparent text-ink placeholder-faint focus:outline-none',
};

const model = defineModel<string | undefined>({ required: true });

const inputRef = ref<HTMLInputElement | null>(null);
const isLocked = ref(!!model.value);

watch(model, (val) => {
    if (val && !isLocked.value && !inputRef.value) {
        isLocked.value = true;
    }
});

function handleBlur() {
    if (model.value) {
        isLocked.value = true;
    }
}

function handleUnlock() {
    if (!isLocked.value) return;
    model.value = '';
    isLocked.value = false;
    nextTick(() => inputRef.value?.focus());
}
</script>

<template>
    <input
        v-if="!isLocked"
        ref="inputRef"
        type="password"
        v-model="model"
        v-bind="$attrs"
        :class="[styles.input, 'bg-surface border-border-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20']"
        @blur="handleBlur"
    />
    <input
        v-else
        type="password"
        value="**********"
        v-bind="$attrs"
        :class="[styles.input, 'bg-surface/60 border-border cursor-pointer']"
        @click="handleUnlock"
    />
</template>
