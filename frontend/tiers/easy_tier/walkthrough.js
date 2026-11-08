const steps = [
  {
    title: "The Cloud Environment",
    desc: "This is a small cluster of cloud resources — storage, compute, identity, and access control. Hover over each piece to see what it does.",
    image: "assets/01-overview.jpg"
  },
  {
    title: "The Storage Bucket",
    desc: "This is the piece we're focusing on. Every bucket has a policy attached to it — a set of rules deciding who's allowed to read or write what's inside.",
    image: "assets/02-storage.jpg"
  },
  {
    title: "Access Control: Private",
    desc: "This is the actual setting that matters. Right now, public access is blocked — this is how the bucket should be configured.",
    image: "assets/03-toggle-secure.jpg"
  },
  {
    title: "Access Control: Public",
    desc: "Here's what happens when that protection is turned off. The bucket is now reachable by anyone on the internet — no login, no credentials, nothing. This is the exact misconfiguration you'll be looking for.",
    image: "assets/04-toggle-vulnerable.jpg"
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
    window.location.href = 'easy.html?from=walkthrough';
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
    "Hey there — I'm Cube. I'll be guiding you through this walkthrough.",
    "This scene is a small cloud environment: a handful of resources, all working together.",
    "Go ahead and hover over the glowing dots — each one is a different piece of the puzzle.",
    "Whenever you're ready, hit Next below and we'll zoom into the one that actually matters."
  ],
  [
    "This is a storage bucket — think of it as a container that holds files in the cloud.",
    "Every bucket has a policy attached to it, deciding who's allowed to read or write what's inside.",
    "By default, cloud providers try to keep these private. Someone has to actively change that."
  ],
  [
    "Here's the actual setting we care about: public access.",
    "Right now, it's switched to private — which means only authorized identities can read this bucket.",
    "This is how it should look. Let's see what happens when someone gets this wrong."
  ],
  [
    "And here it is — public access, switched on.",
    "This bucket is now reachable by anyone on the internet. No login, no credentials, nothing.",
    "This exact misconfiguration is what you'll be hunting for in the real exercise. Ready to try it?"
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