const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Otwórz menu');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

// Route quote and careers calls to the appropriate contact topic.
document.querySelectorAll('[data-topic]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('#contact-topic').value = link.dataset.topic;
    document.querySelector('.message-preview').hidden = true;
    document.querySelector('#form-status').textContent = '';
  });
});

const contactForm = document.querySelector('#contact-form');
const preview = document.querySelector('.message-preview');
const preparedMessage = document.querySelector('#prepared-message');
const formStatus = document.querySelector('#form-status');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(contactForm);
  preparedMessage.value = `${values.get('topic')}\n\n${values.get('message')}\n\n${values.get('name')}\n${values.get('email')}${values.get('phone') ? '\n' + values.get('phone') : ''}`;
  preview.hidden = false;
  formStatus.textContent = 'Wiadomość jest gotowa do skopiowania. Nie została wysłana.';
  preparedMessage.focus();
});
contactForm.addEventListener('input', () => {
  preview.hidden = true;
  formStatus.textContent = '';
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preparedMessage.value);
    formStatus.textContent = 'Skopiowano wiadomość. Nie została wysłana.';
  } catch {
    preparedMessage.focus();
    preparedMessage.select();
    formStatus.textContent = 'Zaznaczono wiadomość. Skopiuj ją skrótem Ctrl+C lub ⌘C.';
  }
});

// Keep the original hero header; pin it only once the hero has scrolled away.
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');
let headerUpdatePending = false;
let stickyHeaderVisible = false;
let headerAnimation = null;
const reducedHeaderMotion = matchMedia('(prefers-reduced-motion: reduce)');
function updateStickyHeader() {
  headerUpdatePending = false;
  const shouldShow = hero.getBoundingClientRect().bottom <= 0;
  if (shouldShow === stickyHeaderVisible) return;
  stickyHeaderVisible = shouldShow;

  // Continue from the current visual position if scrolling reverses mid-animation.
  const style = getComputedStyle(header);
  const from = header.classList.contains('is-sticky')
    ? { transform: style.transform, opacity: style.opacity }
    : { transform: 'translateY(-100%)', opacity: 0 };
  headerAnimation?.cancel();
  if (reducedHeaderMotion.matches) {
    header.classList.toggle('is-sticky', shouldShow);
    headerAnimation = null;
    return;
  }

  header.classList.add('is-sticky');
  const animation = header.animate([
    from,
    shouldShow
      ? { transform: 'translateY(0)', opacity: 1 }
      : { transform: 'translateY(-100%)', opacity: 0 }
  ], {
    duration: shouldShow ? 320 : 240,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'forwards'
  });
  headerAnimation = animation;
  animation.onfinish = () => {
    if (headerAnimation !== animation) return;
    header.classList.toggle('is-sticky', stickyHeaderVisible);
    animation.cancel();
    headerAnimation = null;
  };
}
function scheduleHeaderUpdate() {
  if (!headerUpdatePending) {
    headerUpdatePending = true;
    requestAnimationFrame(updateStickyHeader);
  }
}
window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
window.addEventListener('resize', scheduleHeaderUpdate);
window.addEventListener('pageshow', scheduleHeaderUpdate);
updateStickyHeader();

// Highlight the section currently passing below the fixed header.
const menuSections = [...navigation.querySelectorAll('a[href^="#"]')].map(link => ({
  link,
  section: document.querySelector(link.getAttribute('href'))
})).filter(item => item.section);
let menuUpdatePending = false;
function updateActiveMenu() {
  menuUpdatePending = false;
  const activationLine = header.offsetHeight + 40;
  let active = menuSections[0];
  for (const item of menuSections) {
    if (item.section.getBoundingClientRect().top <= activationLine) active = item;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    active = menuSections[menuSections.length - 1];
  }
  for (const item of menuSections) {
    const isActive = item === active;
    item.link.classList.toggle('active', isActive);
    if (isActive) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
}
function scheduleMenuUpdate() {
  if (menuUpdatePending) return;
  menuUpdatePending = true;
  requestAnimationFrame(updateActiveMenu);
}
window.addEventListener('scroll', scheduleMenuUpdate, { passive: true });
window.addEventListener('resize', scheduleMenuUpdate);
window.addEventListener('hashchange', scheduleMenuUpdate);
window.addEventListener('pageshow', scheduleMenuUpdate);
updateActiveMenu();

const heroSlides = [...hero.querySelectorAll('.hero-slide')];
const slideIndicator = hero.querySelector('.slide-indicator');
const slideCurrent = hero.querySelector('.slide-current');
const slideDuration = 6500;
const sliderMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activeSlide = 0;
let elapsedSlideTime = 0;
let lastSlideFrame = null;
let sliderFrame = null;
let sliderPaused = sliderMotion.matches;
let heroVisible = hero.getBoundingClientRect().bottom > 0;
let heroFocused = false;
function setSlide(index) {
  activeSlide = index;
  slideCurrent.textContent = String(index + 1).padStart(2, '0');
  slideIndicator.setAttribute('aria-label', `Slajd ${index + 1} z ${heroSlides.length}`);
  elapsedSlideTime = 0;
  hero.style.setProperty('--slide-progress', '0');
  heroSlides.forEach((slide, i) => {
    const active = i === index;
    slide.classList.toggle('is-active', active);
    slide.inert = !active;
    slide.setAttribute('aria-hidden', String(!active));

  });
}
function sliderCanRun() {
  return !sliderPaused && heroVisible && !document.hidden && !heroFocused;
}
function animateSlider(time) {
  sliderFrame = null;
  if (!sliderCanRun()) { lastSlideFrame = null; return; }
  if (lastSlideFrame !== null) elapsedSlideTime += time - lastSlideFrame;
  lastSlideFrame = time;
  if (elapsedSlideTime >= slideDuration) setSlide((activeSlide + 1) % heroSlides.length);
  hero.style.setProperty('--slide-progress', String(elapsedSlideTime / slideDuration));
  sliderFrame = requestAnimationFrame(animateSlider);
}
function syncSlider() {
  if (sliderCanRun() && sliderFrame === null) {
    lastSlideFrame = null;
    sliderFrame = requestAnimationFrame(animateSlider);
  } else if (!sliderCanRun()) {
    cancelAnimationFrame(sliderFrame);
    sliderFrame = null;
    lastSlideFrame = null;
  }
}
hero.addEventListener('focusin', () => { heroFocused = true; syncSlider(); });
hero.addEventListener('focusout', event => { heroFocused = hero.contains(event.relatedTarget); syncSlider(); });
document.addEventListener('visibilitychange', syncSlider);
sliderMotion.addEventListener('change', event => { sliderPaused = event.matches; syncSlider(); });
new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; syncSlider(); }).observe(hero);
syncSlider();


// Shared lead popup for the header, CTA band and footer.
const leadDialog = document.querySelector('#lead-dialog');
const leadForm = document.querySelector('#lead-form');
const leadEmail = document.querySelector('#lead-email');
const leadPhone = document.querySelector('#lead-phone');
const leadFormStatus = document.querySelector('#lead-form-status');
const leadClose = document.querySelector('.lead-dialog-close');
const leadTriggers = document.querySelectorAll('[data-lead-popup]');
let lastLeadTrigger = null;

function openLeadDialog(trigger) {
  lastLeadTrigger = trigger;
  leadFormStatus.textContent = '';
  leadFormStatus.classList.remove('is-info');
  if (typeof leadDialog.showModal === 'function') {
    leadDialog.showModal();
    document.body.classList.add('has-open-dialog');
    requestAnimationFrame(() => leadEmail.focus());
  }
}

function closeLeadDialog() {
  if (leadDialog.open) leadDialog.close();
  document.body.classList.remove('has-open-dialog');
  lastLeadTrigger?.focus();
}

leadTriggers.forEach(trigger => trigger.addEventListener('click', () => openLeadDialog(trigger)));
leadClose.addEventListener('click', closeLeadDialog);
leadDialog.addEventListener('click', event => {
  const box = leadDialog.getBoundingClientRect();
  const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  if (outside) closeLeadDialog();
});
leadDialog.addEventListener('close', () => document.body.classList.remove('has-open-dialog'));

leadForm.addEventListener('submit', event => {
  event.preventDefault();
  const email = leadEmail.value.trim();
  const phone = leadPhone.value.trim();
  leadFormStatus.classList.remove('is-info');

  if (!email && !phone) {
    leadFormStatus.textContent = 'Podaj adres e-mail lub numer telefonu.';
    leadEmail.focus();
    return;
  }
  if (email && !leadEmail.checkValidity()) {
    leadFormStatus.textContent = 'Sprawdź poprawność adresu e-mail.';
    leadEmail.focus();
    return;
  }
  if (phone && phone.replace(/\D/g, '').length < 7) {
    leadFormStatus.textContent = 'Sprawdź poprawność numeru telefonu.';
    leadPhone.focus();
    return;
  }

  // Static-site fallback: carry the lead into the full contact form.
  const fullEmail = document.querySelector('#contact-form [name="email"]');
  const fullPhone = document.querySelector('#contact-form [name="phone"]');
  const fullMessage = document.querySelector('#contact-form [name="message"]');
  if (email) fullEmail.value = email;
  if (phone) fullPhone.value = phone;
  if (!fullMessage.value) fullMessage.value = 'Proszę o kontakt i przekazanie informacji dotyczących transportu.';
  document.querySelector('#contact-topic').value = 'Transport i wycena';

  leadFormStatus.classList.add('is-info');
  leadFormStatus.textContent = 'Kontakt zapisany w formularzu. Uzupełnij dane i wyślij zapytanie.';
  setTimeout(() => {
    closeLeadDialog();
    document.querySelector('#contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('#contact-form [name="name"]').focus({ preventScroll: true });
  }, 650);
});
