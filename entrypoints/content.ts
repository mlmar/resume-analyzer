import { MessageType } from '@/entrypoints/types/Message';
import './content-style.less'; // Add a .highlight-box { outline: 2px solid blue; } class here

export default defineContentScript({
    matches: ['*://*/*'],
    main(ctx) {
        const INSPECTOR_CLASS = 'resume-extension-inspect';
        const INSPECTOR_CURSOR = 'crosshair';
        const HIGHLIGHT_CLASS = 'resume-extension-highlight';

        let isInspectorActive = false;
        let activeElements = new Set<HTMLElement>()
        let lastElement: HTMLElement | null = null;
        let highlightedElements = new Set<HTMLElement>();

        // Remove all elements on load
        document.querySelectorAll(INSPECTOR_CLASS).forEach((element) => element.classList.remove(INSPECTOR_CLASS));
        document.querySelectorAll(HIGHLIGHT_CLASS).forEach((element) => element.classList.remove(HIGHLIGHT_CLASS));

        browser.runtime.sendMessage({
            type: MessageType.Inspect,
            data: true
        });

        browser.runtime.sendMessage({
            type: MessageType.Text,
            data: getActiveText()
        });

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MessageType.Inspect) {
                isInspectorActive = message.data ?? !isInspectorActive;
                if (!isInspectorActive) {
                    if (lastElement && !activeElements.has(lastElement)) {
                        lastElement?.classList.remove(INSPECTOR_CLASS);
                    }

                    document.body.style.cursor = '';
                    document.removeEventListener('mouseover', handleMouseOver);
                    document.removeEventListener('mouseleave', handleMouseLeave);
                    document.removeEventListener('click', handleClick);
                } else {
                    document.body.style.cursor = INSPECTOR_CURSOR;
                    document.addEventListener('mouseover', handleMouseOver);
                    document.addEventListener('mouseleave', handleMouseLeave);
                    document.addEventListener('click', handleClick);
                }
            } else if (message.type === MessageType.Clear) {
                clearActiveElements();
            } else if (message.type === MessageType.Highlight) {
                highlightSkill(message.data as string);
            }
        });

        function handleMouseOver(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (target === lastElement) {
                return;
            }

            if (lastElement && !activeElements.has(lastElement)) {
                lastElement.classList.remove(INSPECTOR_CLASS)
            }

            // Add highlight to the new element
            if (!activeElements.has(target)) {
                target.classList.add(INSPECTOR_CLASS);
                lastElement = target;
            }
        }

        function handleMouseLeave() {
            // Remove highlight from the previous element
            if (lastElement && !activeElements.has(lastElement)) {
                lastElement.classList.remove(INSPECTOR_CLASS)
            }
        }

        function handleClick(event: MouseEvent) {
            event.preventDefault(); // Stop the link from opening
            event.stopPropagation();

            const target = event.target as HTMLElement;
            if (activeElements.has(target)) {
                removeActiveElement(target);
            } else {
                addActiveElement(target);
            }

            // Send the text back to your Sidepanel
            browser.runtime.sendMessage({
                type: MessageType.Text,
                data: getActiveText()
            });
        }

        function addActiveElement(target: HTMLElement): void {
            for (const element of activeElements) {
                if (element.contains(target) || target.contains(element)) {
                    removeActiveElement(element);
                }
            }
            target.classList.add(INSPECTOR_CLASS);
            activeElements.add(target);
        }

        function removeActiveElement(target: HTMLElement): void {
            target.classList.remove(INSPECTOR_CLASS);
            activeElements.delete(target);
        }

        function clearActiveElements() {
            for (let element of activeElements) {
                removeActiveElement(element);
            }
        }

        function getActiveText() {
            const sorted = Array.from(activeElements).sort((a, b) => {
                return a.compareDocumentPosition(b);
            })
            return sorted.map(element => element.innerText || element.textContent)
        }

        function highlightSkill(skill: string) {
            // Clear previous highlights
            for (const element of highlightedElements) {
                element.classList.remove(HIGHLIGHT_CLASS);
                highlightedElements.delete(element);
            }

            if (!skill) {
                return;
            }

            const lowerSkill = skill.toLowerCase();
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let firstMatch: HTMLElement | null = null;

            while (walker.nextNode()) {
                const textNode = walker.currentNode;
                if (textNode.textContent && textNode.textContent.toLowerCase().includes(lowerSkill)) {
                    const parent = textNode.parentElement;
                    if (parent) {
                        parent.classList.add(HIGHLIGHT_CLASS);
                        highlightedElements.add(parent);
                        if (!firstMatch) firstMatch = parent;
                    }
                }
            }

            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },
});