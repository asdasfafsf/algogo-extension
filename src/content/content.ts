import { MessageType } from '../constants/messageTypes';
import { Message } from '../types/Message';
import { getContentInstance } from './factory';

console.log('content.ts 의 main함수 밖입니다.')
function main() {

    console.log('content.ts 실행');
    chrome.runtime.onMessage.addListener(async (message: Message<keyof typeof MessageType>, sender, sendResponse) => {
        if (!message.type) return false;
        
        switch (message.type) {
            case 'CHECK_LOGIN':
                const typedMessage = message as Message<typeof MessageType.CHECK_LOGIN>;
                const data = typedMessage.data;
                const contentInstance = getContentInstance(data.source);
                const isLogin = contentInstance.checkLoginStatus();
                sendResponse(isLogin);
                break;
        }
        
        return true; 
    });
    console.log('content.ts 실행 완료');
}

main();