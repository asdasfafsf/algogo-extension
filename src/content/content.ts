import { MessageType } from '../constants/messageTypes';
import { Message } from '../types/Message';
import { getContentInstance } from './factory';

function main() {
    chrome.runtime.onMessage.addListener(async (message: Message<keyof typeof MessageType>, sender, sendResponse) => {
        if (!message.type) return false;
        
        switch (message.type) {
            // 백준 페이지에서 동작해야하는 script
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
            case 'RESPONSE_PROGRESS':
                const responseProgressTypedMessage = message as Message<typeof MessageType.RESPONSE_PROGRESS>;
                const responseProgressData = responseProgressTypedMessage.data;
                const responseProgress = await chrome.runtime.sendMessage(responseProgressData);
                sendResponse(responseProgress);
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

    window.addEventListener('message', async (event) => {
        console.log('event야!!!!', event);

        switch (event.data.type) {
            case 'EXECUTE':
                const executeTypedMessage = event.data as Message<typeof MessageType.EXECUTE>;
                const executeResult = await new Promise<any>((resolve, reject) => {
                    chrome.runtime.sendMessage(executeTypedMessage, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });
                console.log(`방가방가executeResult: ${executeResult}`);
                
                if (executeResult.code === '0000') {
                    event.source?.postMessage({
                        type: 'RESPONSE_EXECUTE',
                        data: executeResult,
                    });
                } else {
                    event.source?.postMessage({
                        type: 'RESPONSE_EXECUTE',
                        data: executeResult,
                    });
                }
                break;
            case 'REQUEST_PROGRESS':
                const progressTypedMessage = event.data as Message<typeof MessageType.REQUEST_PROGRESS>;
                const progressData = progressTypedMessage.data;
                const progress = await chrome.runtime.sendMessage({...progressTypedMessage, type: 'RESPONSE_PROGRESS'});
                
                event.source?.postMessage({
                    type: 'RESPONSE_PROGRESS',
                    data: progress,
                });
                break;
        }
    });
}

main();