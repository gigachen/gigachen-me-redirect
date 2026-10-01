(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const sections = [...document.querySelectorAll("main > section[id]")];
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const isProject = document.body.dataset.page === "project";

  function markChapter(id) {
    const current = isProject ? "work" : id;
    for (const link of navLinks) {
      if (link.hash === "#" + current) link.setAttribute("aria-current", isProject ? "page" : "location");
      else link.removeAttribute("aria-current");
    }
  }

  if (sections.length) {
    let pending = false;
    function updateChapter() {
      pending = false;
      const marker = Math.min(180, window.innerHeight * .28);
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) current = section.id;
      }
      markChapter(current);
    }
    function requestUpdate() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(updateChapter);
    }
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
    requestUpdate();
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
      window.location.href = root + "#" + command;
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
