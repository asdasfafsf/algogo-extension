import { MessageType, createMessage, createResponse, ResponseCode } from '../shared/messaging';
import { PlatformFactory } from '../core/platform';

const platform = PlatformFactory.get('BOJ');

if (!platform) {
  console.error('Platform not found');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.BACKGROUND_TO_CONTENT_SUBMIT) {
    handleBackgroundSubmit(message.data, sendResponse);
    return true;
  }

  if (message.type === MessageType.BACKGROUND_TO_CONTENT_PROGRESS) {
    handleBackgroundProgress(message.data, sendResponse);
    return true;
  }

  if (message.type === MessageType.BACKGROUND_TO_CONTENT_LOGIN_CHECK) {
    handleLoginCheck(sendResponse);
    return true;
  }

  return false;
});

function handleBackgroundSubmit(data: unknown, sendResponse: (response: unknown) => void): void {
  try {
    const request = data as { problemId: string; code: string; language: string };
    const result = platform?.submit({
      problemId: request.problemId,
      code: request.code,
      language: request.language as 'Node.js' | 'Python' | 'Java' | 'C++',
    });

    if (!result) {
      sendResponse(createResponse(ResponseCode.UNKNOWN_ERROR, '플랫폼을 찾을 수 없습니다.'));
      return;
    }

    sendResponse(createResponse(ResponseCode.SUCCESS, '제출되었습니다.'));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}

function handleBackgroundProgress(data: unknown, sendResponse: (response: unknown) => void): void {
  try {
    const request = data as { problemId: string };
    const progress = platform?.getProgress(request.problemId);

    if (!progress) {
      sendResponse(createResponse(ResponseCode.UNKNOWN_ERROR, '플랫폼을 찾을 수 없습니다.'));
      return;
    }

    sendResponse(createResponse(ResponseCode.SUCCESS, '', progress));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}

function handleLoginCheck(sendResponse: (response: unknown) => void): void {
  try {
    const loginStatus = platform?.isLoggedIn();

    if (loginStatus === undefined) {
      sendResponse(createResponse(ResponseCode.UNKNOWN_ERROR, '플랫폼을 찾을 수 없습니다.'));
      return;
    }

    sendResponse(createResponse(ResponseCode.SUCCESS, '', { isLoggedIn: loginStatus }));
  } catch (error) {
    sendResponse(createResponse(
      ResponseCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    ));
  }
}
