const steps = [
  {
    title: "The Identity & Access Layer",
    desc: "Every identity in the cloud can be trusted to act as another, more powerful one — if something allows it. Hover over each piece to see what it does.",
    image: "assets/01-overview.jpg"
  },
  {
    title: "The Trust Relationship",
    desc: "This is the actual connection that matters: one identity, trusted to temporarily become another. That trust isn't automatic — something has to explicitly grant it.",
    image: "assets/02-trust-link.jpg"
  },
  {
    title: "Trust Gate: Closed",
    desc: "This is how it should look. No path exists between the low-privilege identity and the privileged role — the gate stays shut unless trust is explicitly configured.",
    image: "assets/03-gate-secure.jpg"
  },
  {
    title: "Trust Gate: Open",
    desc: "And here's what happens when that trust gets configured too broadly. The identity can now freely assume the privileged role — using nothing but a leaked credential.",
    image: "assets/04-gate-vulnerable.jpg"
  }
];

let currentStep = 0;

const sceneImage = document.getElementById('scene-image');
const stepTitle = document.getElementById('step-title');
const stepDesc = document.getElementById('step-desc');
const stepIndicator = document.getElementById('step-indicator');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

function renderStep() {
  const step = steps[currentStep];

  sceneImage.classList.add('is-switching');

  setTimeout(() => {
    sceneImage.src = step.image;
    stepTitle.textContent = step.title;
    stepDesc.textContent = step.desc;
    stepIndicator.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    document.querySelectorAll('.hotspot-layer').forEach(layer => {
      layer.classList.toggle('is-hidden', Number(layer.dataset.step) !== currentStep + 1);
    });

    sceneImage.classList.remove('is-switching');
  }, 120);

  prevBtn.disabled = currentStep === 0;
  nextBtn.textContent = currentStep === steps.length - 1 ? 'Try it yourself →' : 'Next →';

  updateInstructorVisibility();
}

prevBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  } else {
    window.location.href = 'ctf.html?from=walkthrough';
  }
});

document.querySelectorAll('.hotspot').forEach(hotspot => {
  const tooltip = document.createElement('div');
  tooltip.className = 'hotspot-tooltip';
  tooltip.innerHTML = `<strong>${hotspot.dataset.title}</strong><span>${hotspot.dataset.desc}</span>`;
  hotspot.appendChild(tooltip);
});

// ===== Instructor cube — all steps =====
const instructorMessagesByStep = [
  [
    "Back again — same guide, new problem this time.",
    "This environment is about trust between identities, not just storage.",
    "Go ahead and hover over the glowing dots to get your bearings.",
    "Whenever you're ready, hit Next and we'll zoom into the connection that actually matters."
  ],
  [
    "This beam is a trust relationship — one identity allowed to temporarily act as another.",
    "Technically, this is called assuming a role. It's a completely normal, legitimate AWS feature.",
    "The problem isn't that this exists. It's who it was configured to trust."
  ],
  [
    "Here's the gate that controls that trust, fully closed.",
    "No connection exists here — the low-privilege identity has no path to the privileged role.",
    "This is the correct, boring, secure state. Let's see what happens when it isn't."
  ],
  [
    "And there it is — the gate wide open.",
    "Someone configured this role to trust that identity, probably for a one-off task, and never locked it back down.",
    "Combine that with a leaked credential, and the privileged role is one command away. Ready to try it?"
  ]
];

let instructorMessageIndex = 0;
let instructorHasPlayed = false;

const instructorWrap = document.getElementById('instructor-wrap');
const particleBurst = document.getElementById('particle-burst');
const speechBubble = document.getElementById('speech-bubble');
const speechText = document.getElementById('speech-text');
const speechNext = document.getElementById('speech-next');
const instructorCube = document.getElementById('instructor-cube');
instructorCube.classList.add('is-spinning');

function faceInstructorForward() {
  instructorCube.classList.remove('is-spinning');
  instructorCube.style.transform = 'rotateX(-18deg) rotateY(0deg)';
}

function resumeInstructorSpin() {
  instructorCube.style.transform = '';
  instructorCube.classList.add('is-spinning');
}

function spawnParticles() {
  particleBurst.innerHTML = '';
  const count = 10;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count;
    const dist = 28 + Math.random() * 14;
    p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
    particleBurst.appendChild(p);
  }
}

function showInstructorMessage(index) {
  faceInstructorForward();
  const messages = instructorMessagesByStep[currentStep];
  speechText.textContent = messages[index];
  speechNext.textContent = index === messages.length - 1 ? "Got it!" : "Next";
  speechBubble.classList.remove('is-hidden');
}

speechNext.addEventListener('click', () => {
  const messages = instructorMessagesByStep[currentStep];
  instructorMessageIndex++;
  if (instructorMessageIndex < messages.length) {
    showInstructorMessage(instructorMessageIndex);
  } else {
    speechBubble.classList.add('is-hidden');
    resumeInstructorSpin();
  }
});

instructorCube.addEventListener('click', () => {
  instructorMessageIndex = 0;
  showInstructorMessage(0);
});

function updateInstructorVisibility() {
  instructorWrap.classList.remove('is-hidden');
  document.getElementById('topbar-cube').style.display = 'none';

  if (!instructorHasPlayed) {
    instructorHasPlayed = true;
    spawnParticles();
  }

  instructorMessageIndex = 0;
  showInstructorMessage(0);
}

renderStep();