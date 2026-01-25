import { MessageType, createMessage, createResponse, ResponseCode } from '../shared/messaging';
import { PlatformFactory } from '../core/platform';

const platform = PlatformFactory.get('BOJ');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.WEB_TO_CONTENT_SUBMIT) {
    handleWebSubmit(message.data, sendResponse);
    return true;
  }

  if (message.type === MessageType.WEB_TO_CONTENT_PROGRESS) {
    handleWebProgress(message.data, sendResponse);
    return true;
  }

  return false;
});

interface SubmissionTab {
  tabId: number;
  problemId: string;
  submitData: { code: string; language: string; problemId: string };
}

const activeSubmissions = new Map<number, SubmissionTab>();

async function handleWebSubmit(data: unknown, sendResponse: (response: unknown) => void {
  try {
    const request = data as { code: string; language: string; problemId: string };
    const tabKey = request.problemId;

    const tabId = await createTab(platform.getSubmitUrl(request.problemId));
    await waitForTabReady(tabId);

    activeSubmissions.set(tabId, {
      tabId,
      problemId: request.problemId,
      submitData: {
        code: request.code,
        language: request.language,
        problemId: request.problemId,
      },
    });

    sendResponse(createResponse(ResponseCode.SUCCESS, '제출 시작했습니다.'));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}

async function handleWebProgress(data: unknown, sendResponse: (response: unknown) => void {
  try {
    const request = data as { problemId: string };
    const activeSubmission = activeSubmissions.get(parseInt(request.problemId, 10));

    if (!activeSubmission) {
      sendResponse(createResponse(ResponseCode.INVALID_REQUEST, '진행 중인 제출이 없습니다.'));
      return;
    }

    const progressMessage = createMessage(MessageType.BACKGROUND_TO_CONTENT_PROGRESS, {
      problemId: request.problemId,
    });

    await sendMessageToContent<void>(activeSubmission.tabId, progressMessage);
    sendResponse(createResponse(ResponseCode.SUCCESS, '', { isSubmitting: true }));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}

async function createTab(url: string): Promise<number> {
  const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
    chrome.tabs.create({ url, active: false }, resolve);
  });

  if (!tab.id) throw new Error('Failed to create tab');
  return tab.id;
}

async function waitForTabReady(tabId: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function sendMessageToContent<T>(
  tabId: number,
  message: { type: MessageType; data?: unknown }
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response as T);
      }
    });
  });
}
