const steps = [
  {
    title: "The App and the Walled-Off Service",
    desc: "Not every vulnerability lives inside the cloud resource itself. Sometimes it's a normal app bug that happens to reach somewhere it shouldn't. Hover over each piece to see what it does.",
    image: "assets/01-overview.jpg"
  },
  {
    title: "The Fetch Feature",
    desc: "This app accepts a URL from the user and fetches it, server-side, to show a preview. That server-side fetch is the whole problem — it runs with the server's own access, not the user's.",
    image: "assets/02-fetch-feature.jpg"
  },
  {
    title: "Internal Service: Sealed",
    desc: "This is how it should look. The credential service only answers requests from inside its own network — nothing from the outside world can reach it directly.",
    image: "assets/03-beacon-secure.jpg"
  },
  {
    title: "Internal Service: Breached",
    desc: "But the fetch feature IS inside that network. If you can control what URL it requests, you can make the app itself reach in on your behalf — and hand you what comes back. Ready to try it?",
    image: "assets/04-beacon-vulnerable.jpg"
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
    "Third time's the charm — this one's a bit different from the others.",
    "Easy was about something left open. Medium was about trust granted too broadly.",
    "This one's about a normal app feature reaching somewhere it was never supposed to go.",
    "Hover around, then hit Next when you're ready."
  ],
  [
    "This fetch feature takes a URL from the user and requests it on the server's behalf.",
    "That's a completely normal, common feature. The danger is in what URLs it's willing to accept.",
    "If nothing restricts it, it'll fetch anywhere the server itself can reach."
  ],
  [
    "This is the internal credential service, fully sealed off.",
    "In a real cloud instance, something very similar to this exists — it hands out temporary credentials.",
    "It's only ever supposed to be reachable from inside the instance itself. Never from outside."
  ],
  [
    "And here's the catch: the app's server IS inside that same network.",
    "If you can make the fetch feature request an internal address instead of an external one, you're not breaking in from outside — you're borrowing the app's own position.",
    "This is called SSRF. Time to go find it yourself."
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