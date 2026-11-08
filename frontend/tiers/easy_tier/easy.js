const BACKEND_URL = "http://localhost:5000";

document.getElementById('launch-btn').addEventListener('click', async () => {
  const status = document.getElementById('launch-status');
  eeRecordAttempt('easy');
  status.textContent = 'Launching environment...';
  try {
    const res = await fetch(`${BACKEND_URL}/api/launch`, { method: 'POST' });
    const data = await res.json();
    status.textContent = data.status === 'success'
      ? `Environment live. Bucket: ${data.bucket}`
      : `Launch failed: ${data.detail || 'unknown error'}`;
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});

document.getElementById('flag-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('flag-input');
  const status = document.getElementById('submit-status');
  const value = input.value.trim();
  if (!value) {
    status.textContent = 'Enter a flag first.';
    return;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag: value })
    });
        const data = await res.json();
    if (data.correct) {
      const result = eeComputeTierScore('easy');
      eeSaveTierResult(result);
      status.textContent = `Correct! Flag accepted. Score: ${result.score} (${result.minutesTaken} min, ${result.attemptCount} attempt${result.attemptCount > 1 ? 's' : ''}${result.hintUsed ? ', hint used' : ''})`;
    } else {
      status.textContent = 'Incorrect flag, try again.';
    }
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});

document.getElementById('exit-btn').addEventListener('click', async () => {
  const status = document.getElementById('launch-status');
  status.textContent = 'Destroying environment...';
  try {
    const res = await fetch(`${BACKEND_URL}/api/destroy`, { method: 'POST' });
    const data = await res.json();
    status.textContent = data.status === 'destroyed'
      ? 'Environment destroyed. Click Launch to try again.'
      : `Destroy failed: ${data.detail || 'unknown error'}`;
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});