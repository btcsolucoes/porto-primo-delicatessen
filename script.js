const body = document.body;
const dock = document.querySelector(".tab-dock");
const cover = document.querySelector(".cover");
const tabs = Array.from(document.querySelectorAll(".tab-dock [role='tab']"));
const panels = Array.from(document.querySelectorAll(".tab-panels > [role='tabpanel']"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let tabScrollLock = false;

document.querySelectorAll("img").forEach((img) => {
  if (!img.hasAttribute("fetchpriority")) img.loading = "lazy";
  img.decoding = "async";
});

function setActivePrimaryTab(tab) {
  tabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });

  body.dataset.theme = tab.dataset.theme || "manha";
  tab.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "nearest",
    inline: "center",
  });
}

function activatePrimaryTab(tab) {
  const panel = document.getElementById(tab.getAttribute("aria-controls"));
  setActivePrimaryTab(tab);
  if (!panel) return;

  const offset = (dock?.offsetHeight || 0) + 18;
  const top = panel.getBoundingClientRect().top + window.scrollY - offset;
  tabScrollLock = true;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduceMotion ? "auto" : "smooth",
  });
  window.setTimeout(() => {
    tabScrollLock = false;
  }, reduceMotion ? 80 : 720);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activatePrimaryTab(tab));
});

const panelObserver = new IntersectionObserver(
  (entries) => {
    if (tabScrollLock) return;
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const tab = tabs.find((item) => item.getAttribute("aria-controls") === visible.target.id);
    if (tab) setActivePrimaryTab(tab);
  },
  {
    root: null,
    rootMargin: "-42% 0px -48% 0px",
    threshold: [0, 0.12, 0.24, 0.36],
  }
);

panels.forEach((panel) => panelObserver.observe(panel));

function syncDockState() {
  if (!dock || !cover) return;
  document.documentElement.style.setProperty("--dock-height", `${dock.offsetHeight}px`);
  body.classList.toggle("nav-is-fixed", window.scrollY >= cover.offsetHeight);
}

document.querySelectorAll(".subtabs").forEach((group) => {
  const scopedTabs = Array.from(group.children).filter((child) => child.classList.contains("subtab"));
  const scopedPanels = scopedTabs.map((tab) => document.getElementById(tab.dataset.target)).filter(Boolean);

  scopedTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;

      scopedTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      scopedPanels.forEach((panel) => {
        const active = panel.id === target;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });

      tab.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  });
});

syncDockState();
window.addEventListener("scroll", syncDockState, { passive: true });
window.addEventListener("resize", syncDockState);
