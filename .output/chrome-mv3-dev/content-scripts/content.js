var content = (function() {
  "use strict";
  function defineContentScript(definition2) {
    return definition2;
  }
  const browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  var MessageType = /* @__PURE__ */ ((MessageType2) => {
    MessageType2["Text"] = "GRAB_TEXT";
    MessageType2["Inspect"] = "TOGGLE_INSPECT";
    MessageType2["Clear"] = "CLEAR_INSPECT";
    MessageType2["Reset"] = "RESET";
    MessageType2["Analyze"] = "ANALYZE";
    MessageType2["FetchModels"] = "FETCH_MODELS";
    MessageType2["Highlight"] = "HIGHLIGHT_SKILL";
    return MessageType2;
  })(MessageType || {});
  const definition = defineContentScript({
    matches: ["*://*/*"],
    main(ctx) {
      const INSPECTOR_CLASS = "resume-extension-inspect";
      const INSPECTOR_CURSOR = "crosshair";
      const HIGHLIGHT_CLASS = "resume-extension-highlight";
      let isInspectorActive = false;
      let activeElements = /* @__PURE__ */ new Set();
      let lastElement = null;
      let highlightedElements = /* @__PURE__ */ new Set();
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
            document.body.style.cursor = "";
            document.removeEventListener("mouseover", handleMouseOver);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("click", handleClick);
          } else {
            document.body.style.cursor = INSPECTOR_CURSOR;
            document.addEventListener("mouseover", handleMouseOver);
            document.addEventListener("mouseleave", handleMouseLeave);
            document.addEventListener("click", handleClick);
          }
        } else if (message.type === MessageType.Clear) {
          clearActiveElements();
        } else if (message.type === MessageType.Highlight) {
          highlightSkill(message.data);
        }
      });
      function handleMouseOver(event) {
        const target = event.target;
        if (target === lastElement) {
          return;
        }
        if (lastElement && !activeElements.has(lastElement)) {
          lastElement.classList.remove(INSPECTOR_CLASS);
        }
        if (!activeElements.has(target)) {
          target.classList.add(INSPECTOR_CLASS);
          lastElement = target;
        }
      }
      function handleMouseLeave() {
        if (lastElement && !activeElements.has(lastElement)) {
          lastElement.classList.remove(INSPECTOR_CLASS);
        }
      }
      function handleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        const target = event.target;
        if (activeElements.has(target)) {
          removeActiveElement(target);
        } else {
          addActiveElement(target);
        }
        browser.runtime.sendMessage({
          type: MessageType.Text,
          data: getActiveText()
        });
      }
      function addActiveElement(target) {
        for (const element of activeElements) {
          if (element.contains(target) || target.contains(element)) {
            removeActiveElement(element);
          }
        }
        target.classList.add(INSPECTOR_CLASS);
        activeElements.add(target);
      }
      function removeActiveElement(target) {
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
        });
        return sorted.map((element) => element.innerText || element.textContent);
      }
      function highlightSkill(skill) {
        for (const element of highlightedElements) {
          element.classList.remove(HIGHLIGHT_CLASS);
          highlightedElements.delete(element);
        }
        if (!skill) {
          return;
        }
        const lowerSkill = skill.toLowerCase();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let firstMatch = null;
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
          firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  });
  function print$1(method, ...args) {
    if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
    else method("[wxt]", ...args);
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  var WxtLocationChangeEvent = class WxtLocationChangeEvent2 extends Event {
    static EVENT_NAME = getUniqueEventName("wxt:locationchange");
    constructor(newUrl, oldUrl) {
      super(WxtLocationChangeEvent2.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  function getUniqueEventName(eventName) {
    return `${browser?.runtime?.id}:${"content"}:${eventName}`;
  }
  const supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
  function createLocationWatcher(ctx) {
    let lastUrl;
    let watching = false;
    return { run() {
      if (watching) return;
      watching = true;
      lastUrl = new URL(location.href);
      if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
        const newUrl = new URL(event.destination.url);
        if (newUrl.href === lastUrl.href) return;
        window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
        lastUrl = newUrl;
      }, { signal: ctx.signal });
      else ctx.setInterval(() => {
        const newUrl = new URL(location.href);
        if (newUrl.href !== lastUrl.href) {
          window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
          lastUrl = newUrl;
        }
      }, 1e3);
    } };
  }
  var ContentScriptContext = class ContentScriptContext2 {
    static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
    id;
    abortController;
    locationWatcher = createLocationWatcher(this);
    constructor(contentScriptName, options) {
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.id = Math.random().toString(36).slice(2);
      this.abortController = new AbortController();
      this.stopOldScripts();
      this.listenForNewerScripts();
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime?.id == null) this.notifyInvalidated();
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
    * Add a listener that is called when the content script's context is invalidated.
    *
    * @returns A function to remove the listener.
    *
    * @example
    * browser.runtime.onMessage.addListener(cb);
    * const removeInvalidatedListener = ctx.onInvalidated(() => {
    *   browser.runtime.onMessage.removeListener(cb);
    * })
    * // ...
    * removeInvalidatedListener();
    */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
    * Return a promise that never resolves. Useful if you have an async function that shouldn't run
    * after the context is expired.
    *
    * @example
    * const getValueFromStorage = async () => {
    *   if (ctx.isInvalid) return ctx.block();
    *
    *   // ...
    * }
    */
    block() {
      return new Promise(() => {
      });
    }
    /**
    * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
    *
    * Intervals can be cleared by calling the normal `clearInterval` function.
    */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
    * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
    *
    * Timeouts can be cleared by calling the normal `setTimeout` function.
    */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
    * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
    * invalidated.
    *
    * Callbacks can be canceled by calling the normal `cancelAnimationFrame` function.
    */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
    * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
    * invalidated.
    *
    * Callbacks can be canceled by calling the normal `cancelIdleCallback` function.
    */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
        ...options,
        signal: this.signal
      });
    }
    /**
    * @internal
    * Abort the abort controller and execute all `onInvalidated` listeners.
    */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
    }
    stopOldScripts() {
      document.dispatchEvent(new CustomEvent(ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
        contentScriptName: this.contentScriptName,
        messageId: this.id
      } }));
      window.postMessage({
        type: ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE,
        contentScriptName: this.contentScriptName,
        messageId: this.id
      }, "*");
    }
    verifyScriptStartedEvent(event) {
      const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
      const isFromSelf = event.detail?.messageId === this.id;
      return isSameContentScript && !isFromSelf;
    }
    listenForNewerScripts() {
      const cb = (event) => {
        if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
        this.notifyInvalidated();
      };
      document.addEventListener(ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE, cb);
      this.onInvalidated(() => document.removeEventListener(ContentScriptContext2.SCRIPT_STARTED_MESSAGE_TYPE, cb));
    }
  };
  function initPlugins() {
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
    else method("[wxt]", ...args);
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      return await main(new ContentScriptContext("content", options));
    } catch (err) {
      logger.error(`The content script "${"content"}" crashed on startup!`, err);
      throw err;
    }
  })();
  return result;
})();
content;