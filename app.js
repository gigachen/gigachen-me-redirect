(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const sections = [...document.querySelectorAll("main > section[id]")];
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const isProject = document.body.dataset.page === "project";
  let navigateChapter = null;
  let hideChapterCue = null;

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
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
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
      if (!target || locked) return;
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
      if (!ids.includes(id) || locked) return;
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
      touchStart = { y: event.touches[0].clientY, top: atBoundary(-1), bottom: atBoundary(1) };
    }, { passive: true });
    window.addEventListener("touchmove", event => {
      if (!touchStart || locked || performance.now() < cooldown || event.touches.length !== 1) return;
      const delta = touchStart.y - event.touches[0].clientY;
      const direction = Math.sign(delta);
      if (direction && (direction > 0 ? touchStart.bottom : touchStart.top) && adjacent(direction)) showCue(direction, Math.abs(delta) / swipeThreshold, "Swipe");
    }, { passive: true });
    window.addEventListener("touchend", event => {
      if (!touchStart || locked || performance.now() < cooldown || !event.changedTouches.length) return;
      const delta = touchStart.y - event.changedTouches[0].clientY;
      const direction = Math.sign(delta);
      if (Math.abs(delta) >= swipeThreshold && (direction > 0 ? touchStart.bottom : touchStart.top) && adjacent(direction)) navigateChapter(adjacent(direction));
      else if (cueDirection) showCue(cueDirection, 0, "Swipe");
      touchStart = null;
    }, { passive: true });
    document.addEventListener("keydown", event => {
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
    if (dialog.open) return;
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
