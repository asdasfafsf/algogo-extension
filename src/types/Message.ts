import { MessageType } from '../constants/messageTypes';

export type MessageType = typeof MessageType[keyof typeof MessageType];


export interface MessagePayloadMap {
    [MessageType.WEB_TO_CONTENT_SCRIPT_SUBMIT]: Submit;
    [MessageType.WEB_TO_CONTENT_SCRIPT_PROGRESS]: {tabId: Number, source: Source};
    
    [MessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT]: Submit;
    [MessageType.CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS]: {tabId: Number, source: Source};
    
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_CHECK_LOGIN]: {source: Source};
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT]: Submit;
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_RESULT]: {source: Source};
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_PROGRESS]: {tabId: Number, source: Source};
   
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_CHECK_LOGIN]: {source: Source};
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT]: Submit;
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS]: {tabId: Number, source: Source};
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_RESULT]: {source: Source};
}

export interface MessageResponseMap {
    [MessageType.WEB_TO_CONTENT_SCRIPT_SUBMIT]: Submit;
    [MessageType.WEB_TO_CONTENT_SCRIPT_PROGRESS]: {tabId: Number, source: Source};
    
    [MessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT]: Submit;
    [MessageType.CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS]: {tabId: Number, source: Source};
    
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_CHECK_LOGIN]: {source: Source};
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT]: Submit;
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_RESULT]: {source: Source};
    [MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_PROGRESS]: {tabId: Number, source: Source};
   
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_CHECK_LOGIN]: {source: Source};
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT]: Submit;
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS]: {tabId: Number, source: Source};
    [MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_RESULT]: {source: Source};
}   

export type Message<T extends MessageType> = {
    type: T;
    data: MessagePayloadMap[T];
}

export type Response<T extends MessageType> = {
    type: T;
    data: MessageResponseMap[T];
}