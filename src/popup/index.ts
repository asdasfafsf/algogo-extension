import { MessageType, createMessage } from '../shared/messaging';

const submitForm = document.getElementById('submit-form') as HTMLFormElement;
const problemInput = document.getElementById('problem-id') as HTMLInputElement;
const codeInput = document.getElementById('code') as HTMLTextAreaElement;
const languageSelect = document.getElementById('language') as HTMLSelectElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  if (!problemInput.value || !codeInput.value) {
    showError('문제 번호와 코드를 입력해주세요.');
    return;
  }

  const request = createMessage(MessageType.WEB_TO_CONTENT_SUBMIT, {
    problemId: problemInput.value,
    code: codeInput.value,
    language: languageSelect.value as 'Node.js' | 'Python' | 'Java' | 'C++',
  });

  setLoading(true);

  try {
    const response = await new Promise<unknown>((resolve, reject) => {
      chrome.runtime.sendMessage(request, resolve);
    });

    const result = response as { code: string; message: string };

    if (result.code === '0000') {
      showSuccess(result.message);
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
}

function setLoading(loading: boolean): void {
  submitButton.disabled = loading;
  submitButton.textContent = loading ? '제출 중...' : '제출';
}

function showError(message: string): void {
  statusDiv.textContent = message;
  statusDiv.className = 'error';
}

function showSuccess(message: string): void {
  statusDiv.textContent = message;
  statusDiv.className = 'success';
}

if (submitForm) {
  submitForm.addEventListener('submit', handleSubmit);
}
