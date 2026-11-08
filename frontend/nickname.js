(function () {
  function showNicknameOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ee-nickname-overlay';
    overlay.innerHTML = `
      <div class="ee-nickname-box">
        <h2>Choose your handle</h2>
        <p>This is how you'll show up on the scoreboard — pick a hacker alias, not your real name.</p>
        <input type="text" id="ee-nickname-input" placeholder="e.g. nullpointer, ghost_in_the_shell" autocomplete="off" maxlength="24">
        <button id="ee-nickname-submit">Let's go</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('ee-nickname-input');
    const submit = document.getElementById('ee-nickname-submit');
    input.focus();

    function confirmNickname() {
      const value = input.value.trim();
      if (!value) {
        input.style.borderColor = 'var(--accent-amber)';
        return;
      }
      localStorage.setItem('ee_nickname', value);
      overlay.remove();
    }

    submit.addEventListener('click', confirmNickname);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmNickname();
    });
  }

  if (!localStorage.getItem('ee_nickname')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showNicknameOverlay);
    } else {
      showNicknameOverlay();
    }
  }
})();