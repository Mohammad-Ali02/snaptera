/* SnapTarget — nav toggle, scroll reveal, contact form */
"use strict";

/* REPLACE: paste your Formspree form ID (e.g. "mqkvzyzw") to activate the form.
   Get one free at https://formspree.io — leave "" for demo mode. */
const FORMSPREE_ID = "";

/* ---------- Mobile navigation ---------- */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");

navToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

// Close the menu after choosing a link (mobile)
navMenu.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!("IntersectionObserver" in window) || reduceMotion) {
  reveals.forEach((el) => el.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => observer.observe(el));
}

/* ---------- Contact form ---------- */
const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

const validators = {
  name: (v) => (v.trim() ? "" : "Please enter your name."),
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? ""
      : "Please enter a valid email address.",
  message: (v) => (v.trim() ? "" : "Please enter a message."),
};

function setFieldError(input, message) {
  const field = input.closest(".field");
  const errorEl = field.querySelector(".field-error");
  field.classList.toggle("invalid", Boolean(message));
  errorEl.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validate() {
  let firstInvalid = null;
  for (const [name, check] of Object.entries(validators)) {
    const input = form.elements[name];
    const message = check(input.value);
    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  return firstInvalid;
}

// Re-validate a field the user is fixing, so the error clears as they type
form.addEventListener("input", (e) => {
  const check = validators[e.target.name];
  if (check && e.target.closest(".field").classList.contains("invalid")) {
    setFieldError(e.target, check(e.target.value));
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";
  status.textContent = "";

  const firstInvalid = validate();
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const button = form.querySelector("button[type=submit]");

  if (!FORMSPREE_ID) {
    // Demo mode — no backend connected yet
    status.classList.add("ok");
    status.textContent =
      "Demo mode: message validated but not sent — connect a Formspree ID in js/main.js to go live.";
    form.reset();
    return;
  }

  button.disabled = true;
  status.textContent = "Sending…";

  try {
    const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    status.classList.add("ok");
    status.textContent = "Thanks — your message has been sent!";
    form.reset();
  } catch {
    status.classList.add("err");
    status.textContent =
      "Something went wrong sending your message. Please email me directly instead.";
  } finally {
    button.disabled = false;
  }
});
