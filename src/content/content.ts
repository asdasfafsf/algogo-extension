import { MessageType, ResponseMessageType } from '../constants/messageTypes';
import { Message } from '../types/Message';
import { getContentInstance } from './factory';

function main() {
    chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
        if (!message.type) return false;
        
        switch (message.type) {
            // 백준 페이지에서 동작해야하는 script
            case MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_CHECK_LOGIN:
                const loginTypedMessage = message as Message;
                const loginData = loginTypedMessage.data;
                const loginContentInstance = getContentInstance(loginData.source);
                const isLogin = loginContentInstance.checkLoginStatus();
                sendResponse(isLogin);
                break;
            case MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT:
                const typedMessage = message as Message;
                const data = typedMessage.data;
                const contentInstance = getContentInstance(data.source);
                const isSubmit = contentInstance.submit(data);
                sendResponse(isSubmit);
                break;
            case MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_RESULT:
                const resultTypedMessage = message as Message;
                const resultData = resultTypedMessage.data;
                const resultContentInstance = getContentInstance(resultData.source);
                const isResult = resultContentInstance.isResultPage();
                sendResponse(isResult);
                break;
            case MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_PROGRESS:
                const responseProgressTypedMessage = message as Message;
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
        switch (event.data.type) {
            case MessageType.WEB_TO_CONTENT_SCRIPT_SUBMIT:
                try {
                    const executeTypedMessage = event.data as Message;
                    const executeResult = await new Promise<any>((resolve, reject) => {
                        chrome.runtime.sendMessage({...executeTypedMessage, type: MessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT}, (response) => {
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
                            ...executeResult,
                            type: ResponseMessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT_RESPONSE,
                        });
                    } else {
                        event.source?.postMessage({
                            ...executeResult,
                            type: ResponseMessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT_RESPONSE,
                        });
                    }
                } catch (error) {
                    console.error('executeResult 오류', error);
                    event.source?.postMessage({
                        type: ResponseMessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT_RESPONSE,
                        code: '9000',
                        message: '오류가 발생했습니다.',
                    });
                } 
                break;
            case MessageType.WEB_TO_CONTENT_SCRIPT_PROGRESS:
                try {
                    const progressTypedMessage = event.data as Message;
                    const progressData = progressTypedMessage.data;
                    const progress = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(
                            {...progressData, type: MessageType.CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS}, 
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error('Progress 요청 오류:', chrome.runtime.lastError);
                                    reject(chrome.runtime.lastError);
                                } else {
                                    resolve(response);
                                }
                            }
                        );
                    });
                    
                    event.source?.postMessage({
                        type: ResponseMessageType.WEB_TO_CONTENT_SCRIPT_PROGRESS_RESPONSE,
                        data: progress,
                    });
                } catch (error) {
                    console.error('progress 오류', error);
                    event.source?.postMessage({
                        type: 'RESPONSE_PROGRESS',
                        code: '9000',
                        message: '오류가 발생했습니다.',
                        data: null,
                    });
                }
                break;
        }
    });
}

main();