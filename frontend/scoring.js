const EE_SCOREBOARD_API = "https://escalate-extract-scoreboard-production.up.railway.app";
const EE_WRITE_SECRET = "ee-scoreboard-x7k2m9-secret";
const EE_BASE_POINTS = { easy: 100, medium: 150, hard: 200 };

function eeKey(tier, suffix) {
  return `ee_${tier}_${suffix}`;
}

function eeGetNickname() {
  return localStorage.getItem('ee_nickname') || 'anonymous';
}

// Call when Launch is clicked — counts the attempt and starts the timer.
function eeRecordAttempt(tier) {
  const count = parseInt(localStorage.getItem(eeKey(tier, 'attempts')) || '0', 10) + 1;
  localStorage.setItem(eeKey(tier, 'attempts'), count);
  localStorage.setItem(eeKey(tier, 'launch_time'), Date.now().toString());
  return count;
}

// Call when a hint is viewed — sticky per tier, never resets.
function eeRecordHintUsed(tier) {
  localStorage.setItem(eeKey(tier, 'hint_used'), 'true');
}

function eeHintUsed(tier) {
  return localStorage.getItem(eeKey(tier, 'hint_used')) === 'true';
}

function eeAttemptCount(tier) {
  return parseInt(localStorage.getItem(eeKey(tier, 'attempts')) || '0', 10);
}

// Call the moment a flag is confirmed correct.
function eeComputeTierScore(tier) {
  const base = EE_BASE_POINTS[tier] || 100;
  const launchTime = parseInt(localStorage.getItem(eeKey(tier, 'launch_time')) || '0', 10);
  const minutesTaken = launchTime ? (Date.now() - launchTime) / 60000 : 999;

  const timeBonus = Math.max(0, 30 - minutesTaken * 2);
  const hintUsed = eeHintUsed(tier);
  const hintMultiplier = hintUsed ? 0.75 : 1.0;
  const attemptCount = eeAttemptCount(tier);
  const attemptPenalty = (attemptCount - 1) * 5;

  const score = Math.round((base + timeBonus) * hintMultiplier - attemptPenalty);

  return {
    tier,
    score,
    minutesTaken: Math.round(minutesTaken * 10) / 10,
    hintUsed,
    attemptCount,
    nickname: eeGetNickname(),
    timestamp: Date.now()
  };
}

// Stores locally for now — this is exactly the object shape we'll POST
// to the hosted scoreboard API once it exists.
function eeSaveTierResult(result) {
  localStorage.setItem(eeKey(result.tier, 'last_result'), JSON.stringify(result));

  const historyKey = 'ee_score_history';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.push(result);
  localStorage.setItem(historyKey, JSON.stringify(history));

  // Also push to the live, shared scoreboard.
  fetch(`${EE_SCOREBOARD_API}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: result.nickname,
      tier: result.tier,
      score: result.score,
      minutesTaken: result.minutesTaken,
      hintUsed: result.hintUsed,
      attemptCount: result.attemptCount,
      secret: EE_WRITE_SECRET
    })
  }).catch(err => {
    console.warn('Could not reach live scoreboard:', err);
  });
}