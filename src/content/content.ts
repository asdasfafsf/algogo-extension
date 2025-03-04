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
                const loginTypedMessage = message as Message<typeof MessageType.CHECK_LOGIN>;
                const loginData = loginTypedMessage.data;
                const loginContentInstance = getContentInstance(loginData.source);
                const isLogin = loginContentInstance.checkLoginStatus();
                sendResponse(isLogin);
                break;
            case 'SUBMIT':
                const typedMessage = message as Message<typeof MessageType.SUBMIT>;
                const data = typedMessage.data;
                const contentInstance = getContentInstance(data.source);
                const isSubmit = contentInstance.submit(data);
                sendResponse(isSubmit);
                break;
        }
        
        return true; 
    });
    console.log('content.ts 실행 완료');
}

main();