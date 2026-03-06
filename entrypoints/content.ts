import { MessageType } from '@/entrypoints/types/Message';
import './content-style.less'; // Add a .highlight-box { outline: 2px solid blue; } class here

export default defineContentScript({
    matches: ['*://*/*'],
    main(ctx) {
        const INSPECTOR_CLASS = 'resume-extension-inspect'

        let isInspectorActive = false;
        let activeElements = new Set<HTMLElement>()
        let lastElement: HTMLElement | null = null;

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
                isInspectorActive = !isInspectorActive;
                if (!isInspectorActive) {
                    lastElement?.classList.remove(INSPECTOR_CLASS);

                    document.removeEventListener('mouseover', handleMouseOver);
                    document.removeEventListener('mouseleave', handleMouseLeave);
                    document.removeEventListener('click', handleClick);

                    clearActiveElements();
                } else {
                    document.addEventListener('mouseover', handleMouseOver);
                    document.addEventListener('mouseleave', handleMouseLeave);
                    document.addEventListener('click', handleClick);
                }
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
    },
});