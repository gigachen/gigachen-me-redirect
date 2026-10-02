(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionModes = ["auto", "on", "off"];
  const requestedMotion = new URLSearchParams(location.search).get("motion");
  let storedMotion = "auto";
  try { storedMotion = localStorage.getItem("gigachen-motion") || "auto"; } catch { /* Preferences remain usable without storage. */ }
  let motionMode = motionModes.includes(requestedMotion) ? requestedMotion : motionModes.includes(storedMotion) ? storedMotion : "auto";
  const motionListeners = new Set();
  const motionPreference = {
    get matches() { return motionMode === "off" || (motionMode === "auto" && systemMotion.matches); },
    addEventListener(type, listener) { if (type === "change") motionListeners.add(listener); },
    removeEventListener(type, listener) { if (type === "change") motionListeners.delete(listener); }
  };
  function updateMotion() {
    document.documentElement.classList.toggle("motion-enabled", motionMode === "on");
    document.documentElement.classList.toggle("motion-reduced", motionPreference.matches);
    document.querySelectorAll("[data-motion-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.motionMode === motionMode)));
    const status = document.querySelector(".motion-status");
    if (status) status.textContent = motionMode === "auto" ? "Following this browser: animations " + (systemMotion.matches ? "off." : "on.") : "Animations " + motionMode + ".";
    motionListeners.forEach(listener => listener({ matches: motionPreference.matches }));
  }
  function setMotion(mode) {
    motionMode = mode;
    try { localStorage.setItem("gigachen-motion", mode); } catch { /* Storage is optional. */ }
    const url = new URL(location.href);
    url.searchParams.delete("motion");
    history.replaceState(null, "", url);
    updateMotion();
  }
  if (motionModes.includes(requestedMotion)) {
    try { localStorage.setItem("gigachen-motion", motionMode); } catch { /* Storage is optional. */ }
  }
  if (typeof systemMotion.addEventListener === "function") systemMotion.addEventListener("change", updateMotion);
  else if (typeof systemMotion.addListener === "function") systemMotion.addListener(updateMotion);
  document.querySelectorAll("[data-motion-mode]").forEach(button => button.addEventListener("click", () => setMotion(button.dataset.motionMode)));
  updateMotion();

  const sections = [...document.querySelectorAll("main > section[id]")];
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const isProject = document.body.dataset.page === "project";
  let openingActive = false;
  let navigateChapter = null;
  let hideChapterCue = null;

  function playOpening() {
    const intro = document.getElementById("opening-intro");
    const motion = motionPreference;
    if (!intro || motion.matches) return;
    const replay = new URLSearchParams(location.search).get("preview") === "logo-intro";
    try { if (!replay && sessionStorage.getItem("gigachen-intro-seen")) return; } catch { /* The intro still works when storage is unavailable. */ }
    const content = [...document.querySelectorAll(".site-header, main, .site-footer")];
    const previousFocus = document.activeElement;
    const skip = intro.querySelector(".intro-skip");
    const continueButton = intro.querySelector(".intro-continue");
    const slot = intro.querySelector(".intro-logo-slot");
    const logo = intro.querySelector(".intro-logo");
    const logoImage = logo.querySelector("img");
    const wordmark = intro.querySelector(".intro-wordmark");
    const header = document.querySelector(".site-header");
    const headerOpacity = header.style.opacity;
    const headerLogo = header.querySelector(".brand-logo");
    const spacer = document.createElement("div");
    spacer.className = "intro-scroll-space";
    spacer.setAttribute("aria-hidden", "true");
    let scrollDistance = Math.max(600, innerHeight * 1.1);
    spacer.style.height = (scrollDistance + header.offsetHeight) + "px";
    header.before(spacer);
    const candidates = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?/\\|_-";
    // Each position settles independently, so the word emerges across the whole grid.
    const textTargets = [...intro.querySelectorAll(".intro-ascii, .intro-caption")].map(element => ({
      element,
      finalText: element.textContent,
      characters: [...element.textContent],
      settlesAt: [...element.textContent].map(character => character === "\n" ? 0 : 520 + Math.random() * 950)
    }));
    const restoreText = () => textTargets.forEach(target => { target.element.textContent = target.finalText; });
    const scramble = elapsed => {
      textTargets.forEach(target => {
        target.element.textContent = target.characters.map((character, index) => {
          if (character === "\n" || elapsed >= target.settlesAt[index]) return character;
          return Math.random() < .12 ? " " : candidates[Math.floor(Math.random() * candidates.length)];
        }).join("");
      });
    };
    let scrambleFrame = 0;
    let lastFrame = 0;
    const started = performance.now();
    scramble(0);
    function updateScramble(now) {
      const elapsed = now - started;
      if (elapsed >= 1500) { restoreText(); return; }
      if (now - lastFrame >= 65) { scramble(elapsed); lastFrame = now; }
      scrambleFrame = requestAnimationFrame(updateScramble);
    }
    scrambleFrame = requestAnimationFrame(updateScramble);
    openingActive = true;
    intro.hidden = false;
    document.documentElement.classList.add("is-opening");
    content.forEach(element => { element.inert = true; });
    let scrollFrame = 0;
    let travelling = false;
    let finished = false;
    const ease = value => value * value * (3 - 2 * value);
    const clamp = value => Math.min(1, Math.max(0, value));
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(scrambleFrame);
      restoreText();
      intro.hidden = true;
      openingActive = false;
      document.documentElement.classList.remove("is-opening");
      header.style.opacity = headerOpacity;
      spacer.remove();
      window.scrollTo({ top: 0, behavior: "instant" });
      content.forEach(element => { element.inert = false; });
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey, true);
      motion.removeEventListener("change", onMotion);
      try { sessionStorage.setItem("gigachen-intro-seen", "1"); } catch { /* Storage is optional. */ }
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body) previousFocus.focus({ preventScroll: true });
      else {
        const heading = document.querySelector(".chapter:not([hidden]) h1, .chapter:not([hidden]) h2");
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      }
    };
    function renderScroll() {
      scrollFrame = 0;
      if (finished) return;
      const progress = clamp(window.scrollY / scrollDistance);
      const portion = ease(progress);
      const origin = slot.getBoundingClientRect();
      const destination = headerLogo.getBoundingClientRect();
      const headerTop = header.getBoundingClientRect().top;
      if (progress > 0) travelling = true;
      if (travelling) {
        logo.classList.add("is-travelling");
        const interpolate = (from, to) => from + (to - from) * portion;
        logo.style.left = interpolate(origin.left, destination.left) + "px";
        logo.style.top = interpolate(origin.top, destination.top - headerTop) + "px";
        logo.style.width = interpolate(origin.width, destination.width) + "px";
        logo.style.height = interpolate(origin.height, destination.height) + "px";
        logoImage.style.transform = "scale(" + interpolate(1.6, 1.5) + ")";
        logoImage.style.filter = "saturate(" + interpolate(.65, 1) + ")";
      }
      const textFade = ease(clamp(progress / .65));
      wordmark.style.opacity = 1 - textFade;
      wordmark.style.transform = "translateY(" + (-32 * textFade) + "px)";
      intro.style.backgroundColor = "rgba(9, 13, 10, " + (1 - portion) + ")";
      header.style.opacity = portion;
      continueButton.style.opacity = 1 - ease(clamp(progress / .35));
      skip.style.opacity = 1 - portion;
      if (progress >= .999) finish();
    }
    function onScroll() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll);
    }
    function onResize() {
      const progress = clamp(window.scrollY / scrollDistance);
      scrollDistance = Math.max(600, innerHeight * 1.1);
      spacer.style.height = (scrollDistance + header.offsetHeight) + "px";
      window.scrollTo({ top: progress * scrollDistance, behavior: "instant" });
      onScroll();
    }
    const enter = () => {
      window.scrollTo({ top: scrollDistance, behavior: "smooth" });
    };
    const onKey = event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(); return; }
      if (event.key === "Tab") {
        event.preventDefault();
        const controls = [continueButton, skip];
        const index = controls.indexOf(document.activeElement);
        controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus({ preventScroll: true });
      }
      if (["PageDown", "ArrowDown", " ", "PageUp", "ArrowUp", "Home", "End"].includes(event.key) && !event.target.closest("button")) {
        event.preventDefault();
        event.stopPropagation();
        const step = ["PageDown", "PageUp", " "].includes(event.key) ? innerHeight * .65 : 90;
        const next = event.key === "End" ? scrollDistance : event.key === "Home" ? 0 : window.scrollY + (["PageUp", "ArrowUp"].includes(event.key) || (event.key === " " && event.shiftKey) ? -step : step);
        window.scrollTo({ top: Math.min(scrollDistance, Math.max(0, next)), behavior: "smooth" });
      }
    };
    const onMotion = event => { if (event.matches) finish(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey, true);
    motion.addEventListener("change", onMotion);
    skip.addEventListener("click", enter, { once: true });
    continueButton.addEventListener("click", enter, { once: true });
    intro.focus({ preventScroll: true });
    renderScroll();
  }

  function markChapter(id) {
    const current = isProject ? "work" : id;
    for (const link of navLinks) {
      if (link.hash === "#" + current) link.setAttribute("aria-current", isProject ? "page" : "location");
      else link.removeAttribute("aria-current");
    }
  }

  if (sections.length) {
    const ids = sections.map(section => section.id);
    const labels = { home: "Home", work: "Work", about: "About", resume: "Resume" };
    const reducedMotion = motionPreference;
    const overlay = document.createElement("div");
    overlay.className = "transport-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<div class="transport-content"><span class="transport-index"></span><strong class="transport-title"></strong><pre class="transport-ascii"></pre><span>ACCESSING NEXT MODULE</span><span class="transport-line"></span></div>';
    document.body.append(overlay);
    const announcement = document.createElement("div");
    announcement.className = "chapter-announcement";
    announcement.setAttribute("role", "status");
    document.body.append(announcement);
    const cue = document.createElement("div");
    cue.className = "chapter-cue";
    cue.hidden = true;
    cue.innerHTML = '<span class="chapter-cue-label"></span><span class="chapter-cue-track" aria-hidden="true"><span class="chapter-cue-fill"></span></span>';
    document.body.append(cue);
    const cueLabel = cue.querySelector(".chapter-cue-label");
    const cueFill = cue.querySelector(".chapter-cue-fill");
    let cueDirection = 0;
    function showCue(direction, portion = 0, gesture = "Scroll") {
      const target = adjacent(direction);
      if (!target || locked || openingActive) return;
      cueDirection = direction;
      cueLabel.textContent = gesture + " a little more to enter " + labels[target] + (direction > 0 ? " ↓" : " ↑");
      cueFill.style.transform = "scaleX(" + Math.min(1, Math.max(0, portion)) + ")";
      cue.hidden = false;
    }
    hideChapterCue = () => {
      cue.hidden = true;
      cueDirection = 0;
      wheelCharge = 0;
    };
    const content = [document.querySelector(".site-header"), document.querySelector("main"), document.querySelector(".site-footer")];
    const asciiScreens = {
      home: [
        "+--------------------------------+",
        "| GIGACHEN_OS :: SESSION START   |",
        "| > whoami                       |",
        "| francis.gunadi                 |",
        "| status ............... online  |",
        "+--------------------------------+"
      ].join("\n"),
      work: [
        "+--------------------------------+",
        "| /WORK                          |",
        "| +-- /forensics/                |",
        "| +-- /reverse/                  |",
        "| +-- /web/                      |",
        "| `-- /machine-learning/         |",
        "+--------------------------------+"
      ].join("\n"),
      about: [
        "+--------------------------------+",
        "| [ ID: FG-001 ]                 |",
        "| NAME : FRANCIS GUNADI         |",
        "| BASE : JAKARTA, ID            |",
        "| TEAM : PETIR CYBER SECURITY   |",
        "| MODE : INVESTIGATE            |",
        "+--------------------------------+"
      ].join("\n"),
      resume: [
        "+--------------------------------+",
        "| RESUME.TXT                     |",
        "| [x] EDUCATION                 |",
        "| [x] ORGANIZATION              |",
        "| [x] RECOGNITION               |",
        "| [x] PROJECTS                  |",
        "+--------------------------------+"
      ].join("\n")
    };
    let active = ids.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
    let locked = false;
    let cooldown = 0;
    let asciiFrame = 0;
    let swapTimer = 0;
    let endTimer = 0;
    let finishTransition = null;
    let wheelCharge = 0;
    const wheelThreshold = 720;
    const swipeThreshold = 160;

    sections.forEach((section, index) => {
      const route = document.createElement("nav");
      route.className = "wrap chapter-route";
      route.setAttribute("aria-label", labels[section.id] + " chapter navigation");
      const caption = document.createElement("span");
      caption.textContent = "End of " + labels[section.id];
      route.append(caption);
      if (index > 0) {
        const previous = document.createElement("a");
        previous.href = "#" + ids[index - 1];
        previous.textContent = "← " + labels[ids[index - 1]];
        route.append(previous);
      }
      const next = document.createElement("a");
      const nextId = ids[index + 1] || "home";
      next.href = "#" + nextId;
      next.textContent = index === ids.length - 1 ? "Back to Home ↑" : "Next: " + labels[nextId] + " ↓";
      route.append(next);
      section.append(route);
    });

    function showChapter(id) {
      active = id;
      sections.forEach(section => { section.hidden = section.id !== id; });
      markChapter(id);
      document.title = (id === "home" ? "Francis Gunadi" : labels[id] + " — Francis Gunadi") + " / Portfolio";
      window.scrollTo({ top: 0, behavior: "instant" });
      hideChapterCue();
    }

    function focusChapter(id) {
      const heading = document.getElementById(id).querySelector("h1, h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      announcement.textContent = labels[id] + " chapter";
    }

    navigateChapter = (id, updateHistory = true) => {
      if (!ids.includes(id) || locked || openingActive) return;
      hideChapterCue();
      if (id === active) {
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      const commitChapter = () => {
        if (updateHistory) history.pushState(null, "", "#" + id);
        showChapter(id);
      };
      if (reducedMotion.matches) {
        commitChapter();
        focusChapter(id);
        cooldown = performance.now() + 450;
        return;
      }
      locked = true;
      content.forEach(element => { if (element) element.inert = true; });
      document.documentElement.classList.add("is-transporting");
      overlay.querySelector(".transport-index").textContent = "CHAPTER " + String(ids.indexOf(id) + 1).padStart(2, "0") + " / 04";
      overlay.querySelector(".transport-title").textContent = id.toUpperCase();
      const ascii = overlay.querySelector(".transport-ascii");
      ascii.textContent = "";
      overlay.classList.add("is-visible");
      const started = performance.now();
      function typeAscii(now) {
        const portion = Math.min(1, (now - started) / 1050);
        ascii.textContent = asciiScreens[id].slice(0, Math.ceil(asciiScreens[id].length * portion)) + (portion < 1 ? "_" : "");
        if (portion < 1) asciiFrame = requestAnimationFrame(typeAscii);
      }
      asciiFrame = requestAnimationFrame(typeAscii);
      let swapped = false;
      const swap = () => {
        if (swapped) return;
        swapped = true;
        commitChapter();
      };
      finishTransition = () => {
        clearTimeout(swapTimer);
        clearTimeout(endTimer);
        cancelAnimationFrame(asciiFrame);
        swap();
        overlay.classList.remove("is-visible");
        document.documentElement.classList.remove("is-transporting");
        content.forEach(element => { if (element) element.inert = false; });
        document.getElementById(id).classList.add("chapter-arrive");
        setTimeout(() => document.getElementById(id).classList.remove("chapter-arrive"), 550);
        locked = false;
        cooldown = performance.now() + 450;
        finishTransition = null;
        focusChapter(id);
      };
      swapTimer = setTimeout(swap, 680);
      endTimer = setTimeout(() => finishTransition?.(), 1300);
    };

    document.documentElement.classList.add("chapter-mode");
    showChapter(active);
    document.addEventListener("click", event => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !ids.includes(url.hash.slice(1))) return;
      event.preventDefault();
      navigateChapter(url.hash.slice(1));
    });
    function followHistory() {
      const id = location.hash.slice(1) || "home";
      if (ids.includes(id)) navigateChapter(id, false);
    }
    window.addEventListener("popstate", followHistory);
    window.addEventListener("hashchange", followHistory);

    function atBoundary(direction) {
      return direction < 0 ? window.scrollY <= 2 : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3;
    }
    function adjacent(direction) {
      return ids[ids.indexOf(active) + direction];
    }
    function editing(target) {
      return target instanceof Element && (target.closest("dialog[open]") || target.closest("input, textarea, select, [contenteditable]"));
    }
    let cueFrame = 0;
    window.addEventListener("scroll", () => {
      if (cueFrame) return;
      cueFrame = requestAnimationFrame(() => {
        cueFrame = 0;
        if (locked || document.querySelector("dialog[open]")) { hideChapterCue(); return; }
        const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
        if (remaining <= 80 && adjacent(1)) {
          if (cueDirection !== 1) wheelCharge = 0;
          showCue(1, Math.abs(wheelCharge) / wheelThreshold);
        } else if (cueDirection === -1 && atBoundary(-1)) {
          showCue(-1, Math.abs(wheelCharge) / wheelThreshold);
        } else {
          hideChapterCue();
        }
      });
    }, { passive: true });
    window.addEventListener("wheel", event => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || editing(event.target)) return;
      if (openingActive) return;
      if (locked) { event.preventDefault(); return; }
      const direction = Math.sign(event.deltaY);
      if (!direction || !atBoundary(direction) || !adjacent(direction) || performance.now() < cooldown) { hideChapterCue(); return; }
      event.preventDefault();
      if (Math.sign(wheelCharge) !== direction) wheelCharge = 0;
      const delta = Math.abs(event.deltaY) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      wheelCharge += direction * Math.min(120, delta);
      showCue(direction, Math.abs(wheelCharge) / wheelThreshold);
      if (Math.abs(wheelCharge) >= wheelThreshold) navigateChapter(adjacent(direction));
    }, { passive: false });
    let touchStart = null;
    window.addEventListener("touchstart", event => {
      if (event.touches.length !== 1 || editing(event.target)) { touchStart = null; return; }
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY, top: atBoundary(-1), bottom: atBoundary(1), opening: openingActive };
    }, { passive: true });
    window.addEventListener("touchmove", event => {
      if (!touchStart || event.touches.length !== 1) return;
      const delta = touchStart.y - event.touches[0].clientY;
      const horizontal = touchStart.x - event.touches[0].clientX;
      if (Math.abs(delta) <= Math.abs(horizontal)) return;
      const direction = Math.sign(delta);
      // Claim only vertical movement beyond the page edge before the browser can refresh.
      const outward = direction < 0 ? atBoundary(-1) : atBoundary(1);
      if ((outward || locked) && event.cancelable) event.preventDefault();
      if (touchStart.opening || openingActive || locked || performance.now() < cooldown) return;
      if (direction && (direction > 0 ? touchStart.bottom : touchStart.top) && adjacent(direction)) showCue(direction, Math.abs(delta) / swipeThreshold, "Swipe");
    }, { passive: false });
    window.addEventListener("touchend", event => {
      const gesture = touchStart;
      touchStart = null;
      if (!gesture || gesture.opening || openingActive || locked || performance.now() < cooldown || !event.changedTouches.length) return;
      const delta = gesture.y - event.changedTouches[0].clientY;
      const horizontal = gesture.x - event.changedTouches[0].clientX;
      if (Math.abs(delta) <= Math.abs(horizontal)) return;
      const direction = Math.sign(delta);
      if (Math.abs(delta) >= swipeThreshold && (direction > 0 ? gesture.bottom : gesture.top) && adjacent(direction)) navigateChapter(adjacent(direction));
      else if (cueDirection) showCue(cueDirection, 0, "Swipe");
    }, { passive: true });
    window.addEventListener("touchcancel", () => { touchStart = null; hideChapterCue(); }, { passive: true });
    document.addEventListener("keydown", event => {
      if (openingActive) return;
      if (event.key === "Escape" && locked) { finishTransition?.(); return; }
      if (event.isComposing || editing(event.target) || event.altKey || event.metaKey || event.ctrlKey || event.target.closest?.("a, button, summary")) return;
      const direction = ["PageDown", "ArrowDown"].includes(event.key) || (event.key === " " && !event.shiftKey) ? 1 : ["PageUp", "ArrowUp"].includes(event.key) || (event.key === " " && event.shiftKey) ? -1 : 0;
      if (direction && atBoundary(direction) && adjacent(direction) && !locked && performance.now() >= cooldown) {
        event.preventDefault();
        navigateChapter(adjacent(direction));
      }
    });
    reducedMotion.addEventListener("change", event => {
      if (event.matches) finishTransition?.();
    });
  }

  playOpening();

  const dialog = document.getElementById("command-dialog");
  const opener = document.querySelector("[data-open-palette]");
  const closer = document.querySelector("[data-close-palette]");
  const form = document.getElementById("command-form");
  const input = document.getElementById("command-input");
  const result = document.getElementById("command-result");
  if (!dialog || !opener || !form || !input || !result || typeof dialog.showModal !== "function") return;

  let returnFocus = opener;
  const root = isProject ? "../../" : "";
  const chapters = ["home", "work", "about", "resume"];
  const projects = [
    ["tracereader", "TraceReader"],
    ["petir-regen", "PETIR REGEN"],
    ["moneytalks", "MoneyTalks"],
    ["floodcast", "FloodCast"]
  ];
  const aliases = { trace: "tracereader", reader: "tracereader", petir: "petir-regen", regen: "petir-regen", money: "moneytalks", flood: "floodcast", cv: "resume" };

  function setMessage(message) {
    result.replaceChildren(document.createTextNode(message));
  }

  function link(label, href) {
    const anchor = document.createElement("a");
    anchor.textContent = label;
    anchor.href = href;
    result.append(anchor);
  }

  function openPalette() {
    if (dialog.open || openingActive) return;
    hideChapterCue?.();
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : opener;
    dialog.showModal();
    input.focus();
    input.select();
  }

  function closePalette() {
    if (dialog.open) dialog.close();
  }

  opener.addEventListener("click", openPalette);
  closer?.addEventListener("click", closePalette);
  dialog.addEventListener("close", () => returnFocus.focus());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closePalette();
  });
  document.addEventListener("keydown", event => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (event.key === "/" && !editing && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      openPalette();
    }
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    let command = input.value.trim().toLowerCase().replace(/\s+/g, " ");
    if (!command) {
      setMessage("Enter a chapter, project, or help.");
      return;
    }
    if (command === "clear") { result.replaceChildren(); input.value = ""; return; }
    if (command === "help" || command === "?") {
      setMessage("Navigation: home, work, about, resume. Projects: tracereader, petir-regen, moneytalks, floodcast. Other commands: ls, whoami, pwd, email, clear.");
      return;
    }
    if (command === "ls" || command === "ls work") {
      result.replaceChildren();
      projects.forEach(([slug, name]) => link(name + " ↗", root + "projects/" + slug + "/"));
      return;
    }
    if (command === "whoami") { setMessage("Francis Gunadi. Cybersecurity, digital forensics, reverse engineering, and applied machine learning."); return; }
    if (command === "pwd") { setMessage(window.location.pathname); return; }
    if (command === "email") {
      result.replaceChildren();
      link("francis.gunadi@gmail.com ↗", "mailto:francis.gunadi@gmail.com");
      return;
    }
    command = command.replace(/^(open|cd|cat)\s+/, "").replace(/^\.?\//, "").replace(/\.(log|model|vision|ctf|txt|md)$/, "").replace(/[ _]+/g, "-");
    command = aliases[command] || command;
    if (chapters.includes(command)) {
      closePalette();
      if (navigateChapter) navigateChapter(command);
      else window.location.href = root + "#" + command;
      return;
    }
    if (projects.some(([slug]) => slug === command)) {
      closePalette();
      window.location.href = root + "projects/" + command + "/";
      return;
    }
    setMessage("No match. Try help to see the available commands.");
  });
})();
