import { MessageType } from '../constants/messageTypes';

export type MessageType = typeof MessageType[keyof typeof MessageType];


export interface MessagePayloadMap {
    [MessageType.SUBMIT]: Submit;
    [MessageType.CHECK_LOGIN]: {source: Source};
    [MessageType.RESULT]: void;
}

export type Message<T extends MessageType> = {
    type: T;
    data: MessagePayloadMap[T];
}