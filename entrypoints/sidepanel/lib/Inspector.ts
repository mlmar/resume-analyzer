import { Message, MessageDataMap, MessageType } from "@/entrypoints/types/Message";

type Callback<T> = (data: T) => void;

/**
 *  Inspector class that listens for selection events from the DOM
 */
export class Inspector {
    private callbacksMap = new Map<MessageType, Set<Callback<never>>>();

    // Opens connection
    open() {
        browser.runtime.onMessage.addListener(this.listener);
    }

    // Closes connection
    close() {
        browser.runtime.onMessage.removeListener(this.listener);
    }

    private listener(message: Message) {
        const callbacks = this.callbacksMap.get(message.type);
        if (callbacks) {
            for (const callback of callbacks) {
                callback(message.data as never);
            }
        }
    }

    // Adds listener callback to map set
    addListener<K extends MessageType>(key: K, callback: Callback<MessageDataMap[K]>) {
        const callbacks = this.callbacksMap.get(key) ?? new Set();
        this.callbacksMap.set(key, callbacks as Set<Callback<never>>);
        callbacks.add(callback as Callback<never>);
    }

    // Removes listener callback from map set
    removeListener<K extends MessageType>(key: K, callback: Callback<MessageDataMap[K]>) {
        this.callbacksMap.get(key)?.delete(callback as Callback<never>);
    }

    // Toggles inspection mode 
    async toggle() {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        await browser.tabs.sendMessage(tab.id!, { type: MessageType.Inspect });
    }

    // Clears current selections
    async clear() {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        await browser.tabs.sendMessage(tab.id!, { type: MessageType.Clear });
    }

    // Highlights text
    async highlight(text: string | null) {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        await browser.tabs.sendMessage(tab.id!, { type: MessageType.Highlight, data: text });
    }
}