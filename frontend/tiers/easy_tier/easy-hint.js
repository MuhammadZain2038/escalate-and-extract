const urlParams = new URLSearchParams(window.location.search);
const cameFromWalkthrough = urlParams.get('from') === 'walkthrough';

const ctfInstructorWrap = document.getElementById('ctf-instructor-wrap');
const ctfInstructorCube = document.getElementById('ctf-instructor-cube');
const ctfHintBubble = document.getElementById('ctf-hint-bubble');
const ctfHintText = document.getElementById('ctf-hint-text');

const hintMessage =
  "Try listing what's inside a bucket, and reading a file out of it:\n\n" +
  "aws s3 ls s3://<bucket-name> --endpoint-url http://localhost:4566 --no-sign-request\n\n" +
  "aws s3 cp s3://<bucket-name>/flag.txt - --endpoint-url http://localhost:4566 --no-sign-request\n\n" +
  "--no-sign-request means you're connecting with zero credentials — exactly what proves " +
  "the bucket is genuinely public. Swap <bucket-name> for the real one once you've found it.";

if (cameFromWalkthrough) {
  ctfInstructorWrap.classList.remove('is-hidden');
  document.getElementById('topbar-cube').style.display = 'none';

  ctfInstructorCube.addEventListener('click', () => {
    eeRecordHintUsed('easy');
    ctfHintText.textContent = hintMessage;
    ctfHintBubble.classList.toggle('is-hidden');
  });
}