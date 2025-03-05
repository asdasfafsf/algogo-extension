import { MessageType } from '../constants/messageTypes';

export type MessageType = typeof MessageType[keyof typeof MessageType];


export interface MessagePayloadMap {
    [MessageType.SUBMIT]: Submit;
    [MessageType.CHECK_LOGIN]: {source: Source};
    [MessageType.RESULT]: {source: Source};
    [MessageType.EXECUTE]: Submit;
}

export type Message<T extends MessageType> = {
    type: T;
    data: MessagePayloadMap[T];
}