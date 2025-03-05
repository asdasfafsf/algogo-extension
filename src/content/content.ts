import { MessageType } from '../constants/messageTypes';
import { Message } from '../types/Message';
import { getContentInstance } from './factory';

function main() {
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
            case 'RESULT':
                const resultTypedMessage = message as Message<typeof MessageType.RESULT>;
                const resultData = resultTypedMessage.data;
                const resultContentInstance = getContentInstance(resultData.source);
                const isResult = resultContentInstance.isResultPage();
                sendResponse(isResult);
                break;
            default:
                sendResponse({
                    code: '9000',
                    message: '지원하지 않는 코드입니다.'
                });
                break;
        }
        
        return true; 
    });
}

main();