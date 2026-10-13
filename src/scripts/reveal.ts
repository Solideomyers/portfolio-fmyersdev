// D04: the Home case cards rise in once, staggered (--i), when their grid scrolls into view.
// motion.css hides [data-reveal] only under html.js, so without JS the cards are simply there.
const groups = [...document.querySelectorAll<HTMLElement>('[data-reveal-group]')];

const show = (group: Element, instant = false) => {
  for (const el of group.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (instant) el.style.transition = 'none';
    el.classList.add('is-in');
  }
};
// Never leave content hidden behind an anchor jump or on paper.
const showAll = () => groups.forEach((g) => show(g, true));
addEventListener('hashchange', showAll);
addEventListener('beforeprint', showAll);

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      show(e.target);
      io.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
for (const g of groups) {
  // A keyboard user may tab into a card before it is scrolled into view: never focus the invisible.
  g.addEventListener('focusin', () => show(g, true));
  // Already on screen at load (or reached via #hash): show it without a fade.
  if (location.hash || g.getBoundingClientRect().top < innerHeight) show(g, true);
  else io.observe(g);
}
