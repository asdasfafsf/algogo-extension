import type { SubmitRequest, SubmitResult, JudgeProgress } from '../types';

export enum MessageType {
  WEB_TO_CONTENT_SUBMIT = 'WEB_TO_CONTENT_SUBMIT',
  WEB_TO_CONTENT_PROGRESS = 'WEB_TO_CONTENT_PROGRESS',
  CONTENT_TO_BACKGROUND_SUBMIT = 'CONTENT_TO_BACKGROUND_SUBMIT',
  CONTENT_TO_BACKGROUND_PROGRESS = 'CONTENT_TO_BACKGROUND_PROGRESS',
  BACKGROUND_TO_CONTENT_SUBMIT = 'BACKGROUND_TO_CONTENT_SUBMIT',
  BACKGROUND_TO_CONTENT_PROGRESS = 'BACKGROUND_TO_CONTENT_PROGRESS',
  BACKGROUND_TO_CONTENT_RESULT = 'BACKGROUND_TO_CONTENT_RESULT',
  BACKGROUND_TO_CONTENT_LOGIN_CHECK = 'BACKGROUND_TO_CONTENT_LOGIN_CHECK',
  CONTENT_TO_BACKGROUND_LOGIN_CHECK = 'CONTENT_TO_BACKGROUND_LOGIN_CHECK',
}

export enum ResponseCode {
  SUCCESS = '0000',
  INVALID_REQUEST = '1001',
  UNSUPPORTED_LANGUAGE = '1002',
  NOT_LOGGED_IN = '1003',
  SUBMIT_FAILED = '1004',
  TIMEOUT = '2001',
  TAB_CLOSED = '2002',
  UNKNOWN_ERROR = '9000',
}

export interface Message<T extends MessageType> {
  type: T;
  data?: MessageData[T];
}

export interface Response {
  code: ResponseCode;
  message: string;
  data?: unknown;
}

type MessageData = {
  [MessageType.WEB_TO_CONTENT_SUBMIT]: SubmitRequest;
  [MessageType.WEB_TO_CONTENT_PROGRESS]: { problemId: string };
  [MessageType.CONTENT_TO_BACKGROUND_SUBMIT]: SubmitRequest;
  [MessageType.CONTENT_TO_BACKGROUND_PROGRESS]: { problemId: string };
  [MessageType.BACKGROUND_TO_CONTENT_SUBMIT]: SubmitRequest;
  [MessageType.BACKGROUND_TO_CONTENT_PROGRESS]: { problemId: string };
  [MessageType.BACKGROUND_TO_CONTENT_RESULT]: { problemId: string };
  [MessageType.BACKGROUND_TO_CONTENT_LOGIN_CHECK]: void;
  [MessageType.CONTENT_TO_BACKGROUND_LOGIN_CHECK]: { isLoggedIn: boolean };
};

export function createMessage<T extends MessageType>(
  type: T,
  data?: MessageData[T]
): Message<T> {
  return { type, data };
}

export function createResponse(
  code: ResponseCode,
  message: string,
  data?: unknown
): Response {
  return { code, message, data };
}
