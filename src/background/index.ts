import { MessageType, createMessage, createResponse, ResponseCode } from '../shared/messaging';
import { PlatformFactory } from '../core/platform';
import { BOJPlatform } from '../core/boj/BOJPlatform';

PlatformFactory.register(new BOJPlatform());

interface ActiveTab {
  tabId: number;
  originalTabId: number;
}

const activeTabs = new Map<number, ActiveTab>();

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

async function activateTab(tabId: number): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.tabs.update(tabId, { active: true }, () => resolve());
  });
}

async function closeTab(tabId: number): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.tabs.remove(tabId, () => resolve());
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

chrome.runtime.onMessage.addListener((message, sender: chrome.runtime.MessageSender, sendResponse) => {
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

async function handleWebSubmit(data: unknown, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const request = data as { problemId: string; code: string; language: string };
    const platform = PlatformFactory.get('BOJ');

    if (!platform) {
      sendResponse(createResponse(ResponseCode.UNKNOWN_ERROR, '플랫폼을 찾을 수 없습니다.'));
      return;
    }

    const tabId = await createTab(platform.getSubmitUrl(request.problemId));
    await waitForTabReady(tabId);

    activeTabs.set(tabId, {
      tabId,
      originalTabId: sender.tab?.id || 0,
    });

    await activateTab(tabId);

    const loginCheck = await sendMessageToContent<{ isLoggedIn: boolean }>(
      tabId,
      createMessage(MessageType.BACKGROUND_TO_CONTENT_LOGIN_CHECK)
    );

    if (!loginCheck?.isLoggedIn) {
      sendResponse(createResponse(ResponseCode.NOT_LOGGED_IN, '로그인이 필요합니다.'));
      await closeTab(tabId);
      return;
    }

    const submitMessage = createMessage(MessageType.BACKGROUND_TO_CONTENT_SUBMIT, {
      problemId: request.problemId,
      code: request.code,
      language: request.language as 'Node.js' | 'Python' | 'Java' | 'C++',
    });

    await sendMessageToContent<void>(
      tabId,
      submitMessage
    );

    sendResponse(createResponse(ResponseCode.SUCCESS, '제출되었습니다.'));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}

async function handleWebProgress(data: unknown, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const request = data as { problemId: string };
    const platform = PlatformFactory.get('BOJ');

    if (!platform) {
      sendResponse(createResponse(ResponseCode.UNKNOWN_ERROR, '플랫폼을 찾을 수 없습니다.'));
      return;
    }

    const progressMessage = createMessage(MessageType.BACKGROUND_TO_CONTENT_PROGRESS, {
      problemId: request.problemId,
    });

    const activeTab = activeTabs.get(tabId);
    if (!activeTab) {
      sendResponse(createResponse(ResponseCode.INVALID_REQUEST, '진행 중인 제출이 없습니다.'));
      return;
    }

    const progress = await sendMessageToContent<void>(activeTab.tabId, progressMessage);
    sendResponse(createResponse(ResponseCode.SUCCESS, '', progress));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}
