import { MessageType, ResponseMessageType, ResponseCodePair } from '../constants/messageTypes';

export type MessageType = typeof MessageType[keyof typeof MessageType];
export type ResponseMessageType = typeof ResponseMessageType[keyof typeof ResponseMessageType];

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

export interface ResponseMessageMap {
    [ResponseMessageType.WEB_TO_CONTENT_SCRIPT_SUBMIT_RESPONSE]: Submit;
    [ResponseMessageType.WEB_TO_CONTENT_SCRIPT_PROGRESS_RESPONSE]: {tabId: Number, source: Source};
    
    [ResponseMessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT_RESPONSE]: Submit;
    [ResponseMessageType.CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS_RESPONSE]: {tabId: Number, source: Source};
    
    [ResponseMessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_CHECK_LOGIN_RESPONSE]: {source: Source};
    [ResponseMessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT_RESPONSE]: Submit;
    [ResponseMessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_RESULT_RESPONSE]: {source: Source};
    [ResponseMessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_PROGRESS_RESPONSE]: {tabId: Number, source: Source};
   
    [ResponseMessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_CHECK_LOGIN_RESPONSE]: {source: Source};
    [ResponseMessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT_RESPONSE]: Submit;
    [ResponseMessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS_RESPONSE]: {tabId: Number, source: Source};
    [ResponseMessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_RESULT_RESPONSE]: {source: Source};
}   

export type Message = {
    type: MessageType;
    data: MessagePayloadMap[MessageType];
}

export type ResponseCodePairValue = typeof ResponseCodePair[keyof typeof ResponseCodePair];


export type ResponseMessage = {
    type: ResponseMessageType;
    data: ResponseMessageMap[ResponseMessageType];
} & ResponseCodePairValue;

