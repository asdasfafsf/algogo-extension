import { MessageType, createMessage, createResponse, ResponseCode } from '../shared/messaging';
import { PlatformFactory } from '../core/platform';

const platform = PlatformFactory.get('BOJ');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MessageType.WEB_TO_CONTENT_SUBMIT) {
    sendResponse(createResponse(ResponseCode.SUCCESS, '준비 중'));
    return true;
  }

  if (message.type === MessageType.WEB_TO_CONTENT_PROGRESS) {
    sendResponse(createResponse(ResponseCode.SUCCESS, '준비 중'));
    return true;
  }

  return false;
});
