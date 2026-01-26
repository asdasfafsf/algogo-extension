import { MessageType, createMessage, createResponse, ResponseCode } from '../shared/messaging';
import { PlatformFactory } from '../core/platform';

const platform = PlatformFactory.get('BOJ');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.WEB_TO_CONTENT_SUBMIT) {
    sendResponse(createResponse(ResponseCode.SUCCESS, '제출 시작했습니다.'));
    return true;
  }

  if (message.type === MessageType.WEB_TO_CONTENT_PROGRESS) {
    sendResponse(createResponse(ResponseCode.SUCCESS, '진행 상태를 조회했습니다.'));
    return true;
  }

  return false;
});
