const urlParams = new URLSearchParams(window.location.search);
const cameFromWalkthrough = urlParams.get('from') === 'walkthrough';

const ctfInstructorWrap = document.getElementById('ctf-instructor-wrap');
const ctfInstructorCube = document.getElementById('ctf-instructor-cube');
const ctfHintBubble = document.getElementById('ctf-hint-bubble');
const ctfHintText = document.getElementById('ctf-hint-text');

const hintMessage =
  "Start by reading whatever's sitting in the leaked bucket:\n\n" +
  "aws s3 cp s3://<bucket-name>/ops-notes.txt - --endpoint-url http://localhost:4566 --no-sign-request\n\n" +
  "Then use what you find to assume the role it mentions:\n\n" +
  "aws sts assume-role --role-arn <role-arn> --role-session-name pwn --endpoint-url http://localhost:4566\n\n" +
  "Paste the three Credentials values from that output into the Verify form above.";

if (cameFromWalkthrough) {
  ctfInstructorWrap.classList.remove('is-hidden');
  document.getElementById('topbar-cube').style.display = 'none';

  ctfInstructorCube.addEventListener('click', () => {
    eeRecordHintUsed('medium');
    ctfHintText.textContent = hintMessage;
    ctfHintBubble.classList.toggle('is-hidden');
  });
}