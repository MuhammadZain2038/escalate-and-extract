const EE_SCOREBOARD_API = "https://escalate-extract-scoreboard-production.up.railway.app";

function renderTierCell(tierData) {
  if (!tierData) return '<span class="hint">—</span>';
  const hintTag = tierData.hint_used ? ' <span class="hint-tag">hint</span>' : '';
  return `${tierData.score}${hintTag}`;
}

async function loadLeaderboard() {
  const status = document.getElementById('leaderboard-status');
  const table = document.getElementById('leaderboard-table');
  const body = document.getElementById('leaderboard-body');

  try {
    const res = await fetch(`${EE_SCOREBOARD_API}/api/leaderboard`);
    const data = await res.json();
    const players = data.leaderboard || [];

    if (players.length === 0) {
      status.textContent = 'No scores yet — be the first to clear a tier.';
      return;
    }

    body.innerHTML = players.map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${player.nickname}</td>
        <td><strong>${player.total_score}</strong></td>
        <td>${renderTierCell(player.tiers.easy)}</td>
        <td>${renderTierCell(player.tiers.medium)}</td>
        <td>${renderTierCell(player.tiers.hard)}</td>
      </tr>
    `).join('');

    status.style.display = 'none';
    table.style.display = 'table';
  } catch (err) {
    status.textContent = 'Could not reach the scoreboard right now. Try again shortly.';
  }
}

loadLeaderboard();