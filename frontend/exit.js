document.getElementById('exit-all-btn').addEventListener('click', async () => {
  const confirmed = confirm(
    "This stops the entire environment — LocalStack, the vulnerable apps, and this server — and tears down any currently running scenario. You'll need to run 'docker compose up -d' yourself to start it again. Continue?"
  );
  if (!confirmed) return;

  showExitOverlay();

  try {
    await fetch("http://localhost:5000/api/exit", { method: "POST" });
  } catch (err) {
    // Expected — the backend stops itself mid-response in some cases,
    // which can surface as a fetch error even though shutdown succeeded.
  }

  setExitOverlayDone();
});

function showExitOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'ee-exit-overlay';
  overlay.innerHTML = `
    <div class="ee-exit-box">
      <div class="ee-exit-spinner"></div>
      <h2 id="ee-exit-title">Shutting down...</h2>
      <p id="ee-exit-desc">Tearing down the current scenario and stopping all containers. This can take a little while.</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function setExitOverlayDone() {
  document.getElementById('ee-exit-spinner')?.remove();
  const spinner = document.querySelector('.ee-exit-spinner');
  if (spinner) spinner.style.display = 'none';
  document.getElementById('ee-exit-title').textContent = 'Shut down.';
  document.getElementById('ee-exit-desc').textContent =
    "Everything's stopped. Run 'docker compose up -d' in your terminal when you're ready to play again.";
}