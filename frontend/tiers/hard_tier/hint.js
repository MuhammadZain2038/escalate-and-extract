const urlParams = new URLSearchParams(window.location.search);
const cameFromWalkthrough = urlParams.get('from') === 'walkthrough';

const ctfInstructorWrap = document.getElementById('ctf-instructor-wrap');
const ctfInstructorCube = document.getElementById('ctf-instructor-cube');
const ctfHintBubble = document.getElementById('ctf-hint-bubble');
const ctfHintText = document.getElementById('ctf-hint-text');

const hintMessage =
  "Find the fetch/preview parameter in the web app, then point it inward:\n\n" +
  "http://hard-metadata:9000/latest/meta-data/iam/security-credentials/\n\n" +
  "That returns a role name as plain text. Append it to the same path to get the actual stolen credentials.\n\n" +
  "Paste the three resulting values into the Verify form above.";

if (cameFromWalkthrough) {
  ctfInstructorWrap.classList.remove('is-hidden');
  document.getElementById('topbar-cube').style.display = 'none';

  ctfInstructorCube.addEventListener('click', () => {
    eeRecordHintUsed('hard');
    ctfHintText.textContent = hintMessage;
    ctfHintBubble.classList.toggle('is-hidden');
  });
}