const BACKEND_URL = "http://localhost:5000";

document.getElementById('launch-btn').addEventListener('click', async () => {
  const status = document.getElementById('launch-status');
  eeRecordAttempt('hard');
  status.textContent = 'Launching environment...';
  try {
    const res = await fetch(`${BACKEND_URL}/api/hard/launch`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      status.textContent = `Environment live.`;
      document.getElementById('webapp-link').textContent = data.webapp_url;
    } else {
      status.textContent = `Launch failed: ${data.detail || 'unknown error'}`;
    }
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});

document.getElementById('exit-btn').addEventListener('click', async () => {
  const status = document.getElementById('launch-status');
  status.textContent = 'Destroying environment...';
  try {
    const res = await fetch(`${BACKEND_URL}/api/hard/destroy`, { method: 'POST' });
    const data = await res.json();
    status.textContent = data.status === 'destroyed'
      ? 'Environment destroyed. Click Launch to try again.'
      : `Destroy failed: ${data.detail || 'unknown error'}`;
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});

document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('submit-status');

  const accessKey = document.getElementById('access-key-input').value.trim();
  const secretKey = document.getElementById('secret-key-input').value.trim();
  const sessionToken = document.getElementById('session-token-input').value.trim();

  if (!accessKey || !secretKey || !sessionToken) {
    status.textContent = 'All three fields are required.';
    return;
  }

  status.textContent = 'Verifying...';

  try {
    const res = await fetch(`${BACKEND_URL}/api/hard/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key_id: accessKey,
        secret_access_key: secretKey,
        session_token: sessionToken
      })
    });
    const data = await res.json();
    status.textContent = data.correct
      ? `Access confirmed. Flag revealed: ${data.flag} — copy it into the field below.`
      : `Not quite: ${data.detail || 'those credentials did not check out'}`;
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});

document.getElementById('flag-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('flag-submit-status');
  const value = document.getElementById('flag-input').value.trim();

  if (!value) {
    status.textContent = 'Enter a flag first.';
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/hard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag: value })
    });
    const data = await res.json();
    if (data.correct) {
      const result = eeComputeTierScore('hard');
      eeSaveTierResult(result);
      status.textContent = `Correct! Flag accepted. Score: ${result.score} (${result.minutesTaken} min, ${result.attemptCount} attempt${result.attemptCount > 1 ? 's' : ''}${result.hintUsed ? ', hint used' : ''})`;
    } else {
      status.textContent = 'Incorrect flag, try again.';
    }
  } catch (err) {
    status.textContent = `Could not reach backend: ${err}`;
  }
});