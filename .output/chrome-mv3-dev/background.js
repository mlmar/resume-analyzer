var background = (function() {
  "use strict";
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
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
  const ANALYZE_MODEL = "gpt-4o-mini";
  const matchSchema = {
    type: "object",
    properties: {
      matchingSkills: {
        type: "array",
        items: { type: "string" },
        description: "Technical skills, technologies, tools, and qualifications from the job description that are explicitly present on the resume, PLUS experience/tenure requirements (e.g. '3+ years of X') that the candidate's work history clearly satisfies. Do NOT infer specific skills or technologies not explicitly listed on the resume. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by relevance to the role."
      },
      missingSkills: {
        type: "array",
        items: { type: "string" },
        description: "Technical skills, technologies, tools, and qualifications from the job description that are NOT explicitly listed on the resume, plus experience/tenure requirements the candidate's work history does not satisfy. Do NOT include soft skills (e.g. communication, collaboration, problem-solving). Use the job description's phrasing. Order by importance to the role."
      },
      level: {
        type: "string",
        description: "Candidate's inferred seniority level based on resume experience (e.g. Junior, Mid, Senior, Staff, Principal)"
      },
      salary: {
        type: "string",
        description: "Candidate's estimated competitive annual salary range in USD (e.g. '$120,000 - $150,000') based on this role's level, location, and role market rates"
      },
      matchScore: {
        type: "number",
        description: "A 0-100 match score where required skills are weighted more heavily than preferred skills; 80+ indicates the candidate meets most requirements"
      },
      summary: {
        type: "string",
        description: "2-4 sentence overview of the candidate's fit, key strengths relative to the role, and critical gaps"
      },
      employeeSentimentScore: {
        type: "number",
        description: "Overall employee sentiment score from 1 (very negative) to 5 (very positive), derived from Glassdoor and Indeed review ratings. Only populate if a specific company name is identifiable in the job description; otherwise return null."
      }
    },
    required: ["matchingSkills", "missingSkills", "level", "salary", "matchScore", "summary", "employeeSentimentScore"],
    additionalProperties: false
  };
  function buildPrompt(resume, job) {
    return [
      `You are a technical recruiter and hiring expert. Analyze how well the candidate's resume matches the job description.`,
      `Instructions:`,
      `- Extract concrete skills, technologies, tools, certifications, and qualifications from both documents.`,
      `- matchingSkills: Skills and technologies explicitly listed on the resume that also appear in the job description, plus any experience/tenure requirements (e.g. "3+ years of X") that the candidate's work history clearly satisfies. Do NOT infer specific skills or technologies that are not explicitly stated on the resume. Use the exact phrasing from the job description. Order by relevance to the role.`,
      `- missingSkills: Skills and technologies required or preferred in the job description that are NOT explicitly listed on the resume, plus any experience/tenure requirements the candidate does not satisfy. Use the exact phrasing from the job description. Order by importance to the role.`,
      `- Do NOT include soft skills (e.g. "communication", "teamwork", "collaboration", "problem-solving", "leadership") in either list under any circumstances.`,
      `- level: Infer the candidate's seniority from their resume (e.g. "Junior", "Mid", "Senior", "Staff", "Principal"). Base this on years of experience, scope of past roles, and technical depth.`,
      `- salary: Estimate a competitive annual salary range in USD (e.g. "$120,000 - $150,000") based on the inferred level, location if mentioned, and market rates for the role.`,
      `- matchScore: A 0-100 score. Weight required skills more heavily than preferred/nice-to-have skills. A score of 70+ means the candidate meets most requirements.`,
      `- summary: 2-4 sentences covering the candidate's fit, key strengths relative to the role, and the most critical gaps.`,
      `- employeeSentimentScore: ONLY provide this if a specific company name is clearly stated in the job description. A 1–5 integer score (1 = very negative, 5 = very positive) derived from Glassdoor and Indeed ratings. Return null if no company name is present or no data is available.`,
      `<Resume>
${resume}
</Resume>`,
      `<Job Description>
${job}
</Job Description>`
    ].join("\n");
  }
  const definition = defineBackground(() => {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error("Error setting panel behavior:", error));
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "loading") {
        browser.runtime.sendMessage({ type: MessageType.Reset });
      }
    });
    let lastActiveTabId = null;
    browser.tabs.onActivated.addListener((activeInfo) => {
      if (lastActiveTabId != null) {
        browser.tabs.sendMessage(lastActiveTabId, { type: MessageType.Inspect, data: false }).catch(() => {
          console.error("Resume-Extension: Failed to disable toggle mode for previous tab");
        });
        browser.tabs.sendMessage(lastActiveTabId, { type: MessageType.Clear }).catch(() => {
          console.error("Resume-Extension: Failed to clear selections for previous tab");
        });
      }
      lastActiveTabId = activeInfo.tabId;
      browser.runtime.sendMessage({ type: MessageType.Reset }).catch(() => {
        console.error("Resume-Extension: Failed to reset UI");
      });
    });
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === MessageType.Analyze) {
        async function fetchGithubModelResponse() {
          try {
            const payload = message.data;
            const prompt = buildPrompt(payload.resume, payload.job);
            const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${payload.token}`
              },
              body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    name: "resume_match",
                    strict: true,
                    schema: matchSchema
                    // The schema we defined above
                  }
                },
                model: payload.model ?? ANALYZE_MODEL
              })
            });
            const data = await response.json();
            sendResponse({ success: true, data });
          } catch (error) {
            console.error("AI Fetch Error:", error);
            sendResponse({ success: false, error: "Failed to fetch analysis" });
          }
        }
        fetchGithubModelResponse();
        return true;
      }
      if (message.type === MessageType.FetchModels) {
        async function fetchCatalogModels() {
          try {
            const { token } = message.data;
            const response = await fetch("https://models.github.ai/catalog/models", {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
              }
            });
            if (!response.ok) {
              sendResponse({ success: false, error: `HTTP ${response.status}` });
              return;
            }
            const data = await response.json();
            sendResponse({ success: true, data });
          } catch (error) {
            console.error("FetchModels Error:", error);
            sendResponse({ success: false, error: "Failed to fetch models" });
          }
        }
        fetchCatalogModels();
        return true;
      }
    });
  });
  function initPlugins() {
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
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
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "ws://localhost:3000";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
        type: "custom",
        event,
        payload
      }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2();
    else reloadContentScriptMv3(payload);
  }
  async function reloadContentScriptMv3({ registration, contentScript }) {
    if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
    else await reloadManifestContentScriptMv3(contentScript);
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{
        ...contentScript,
        id,
        css: contentScript.css ?? []
      }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{
        ...contentScript,
        id,
        css: contentScript.css ?? []
      }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
      const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log("Content script is not registered yet, nothing to reload", contentScript);
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(matchingTabs.map(async (tab) => {
      try {
        await browser.tabs.reload(tab.id);
      } catch (err) {
        logger.warn("Failed to reload tab:", err);
      }
    }));
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener("open", () => ws2.sendCustom("wxt:background-initialized"));
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") browser.runtime.reload();
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  var background_entrypoint_default = result;
  return background_entrypoint_default;
})();
