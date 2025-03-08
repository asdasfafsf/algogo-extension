import { MessageType, ResponseCode, ResponseCodePair, ResponseMessageType } from "../constants/messageTypes";
import { Message } from "../types/Message";
import { getInstance } from "./factory";


const createAndWaitForTab = async (url: string): Promise<chrome.tabs.Tab> => {
    // 탭 생성
    const newTab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.tabs.create({ url, active: false }, (tab) => {
            resolve(tab);
        });
    });
    
    await new Promise<void>((resolve) => {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (tabId === newTab.id && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
    

    const updatedTab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.tabs.get(newTab.id!, (tab) => {
            resolve(tab);
        });
    });
    
    return updatedTab;
};


/**
 * Content Script에 메시지를 보내고 응답을 기다리는 함수
 * @param tabId 메시지를 보낼 탭 ID
 * @param message 보낼 메시지 객체
 * @param timeout 타임아웃 시간(ms), 기본값 5000ms
 * @returns Promise<T> 응답 데이터
 */
const sendMessageToTab = async <R>(
    tabId: number, 
    message: unknown, 
    timeout: number = 5000
): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`메시지 응답 타임아웃: ${timeout}ms 초과`));
        }, timeout);
        
        chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response as R);
            }
        });
    });
};


/**
 * 조건이 만족될 때까지 대기하는 함수
 * @param tabId 체크할 탭 ID
 * @param checkMessage 체크를 위한 메시지
 * @param predicate 결과를 평가하는 함수
 * @param options 대기 옵션
 */
const waitUntil = async <R>(
    tabId: number,
    checkMessage: Message<typeof MessageType[keyof typeof MessageType]>,
    predicate: (response: R) => boolean,
    options: {
        interval?: number;
        timeout?: number;
    } = {}
): Promise<R> => {
    const {
        interval = 500,
        timeout = 30000,
    } = options;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        try {
            const result = await sendMessageToTab<R>(tabId, checkMessage);
            if (predicate(result)) {
                return result;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
            throw error;
        }
    }
    
    throw {
        ...ResponseCodePair[ResponseCode.TIMEOUT],
    }
};


// 이미 리스너가 등록된 탭 ID 집합
const registeredTabIds = new Set<number>();

/**
 * 탭 닫힘을 감지하는 함수 (중복 등록 방지)
 * @param tabId 감시할 탭 ID
 */
const waitForTabClose = async (tabId: number): Promise<never> => {
    // 이미 등록된 탭이면 기존 Promise 재사용
    if (registeredTabIds.has(tabId)) {
        return new Promise<never>((_, reject) => {
            // 이미 리스너가 등록되어 있으므로 새로운 Promise만 반환
            // 탭이 닫히면 기존 리스너에 의해 reject될 것임
        });
    }
    
    // 새로운 탭이면 리스너 등록
    registeredTabIds.add(tabId);
    
    return new Promise<never>((_, reject) => {
        const listener = (closedTabId: number) => {
            if (closedTabId === tabId) {
                chrome.tabs.onRemoved.removeListener(listener);
                registeredTabIds.delete(tabId);
                reject({
                    ...ResponseCodePair[ResponseCode.TAB_CLOSED],
                });
            }
        };
        chrome.tabs.onRemoved.addListener(listener);
    });
};


const checkLogin = async (tabId: number, data: {source: Source}) => {
    return await waitUntil<boolean>(tabId, {
        type: MessageType.NEW_CONTENT_SCRIPT_TO_BACKGROUND_CHECK_LOGIN,
        data,
    }, (result) => result, {
        timeout: 30000,
    });
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    let currentTabId = null;
    if (message.type === MessageType.CONTENT_SCRIPT_TO_BACKGROUND_SUBMIT) {
        try {
            const { source, sourceId, code, language } = message.data;
            const instance = getInstance(source);

            console.log('message : background', message);

            if (!instance) {
                throw {
                    ...ResponseCodePair[ResponseCode.NOT_SUPPORTED_SOURCE],
                }
            }

            // 현재 탭 정보 저장
            const currentTabs = (await chrome.tabs.query({ active: true, currentWindow: true })).at(0);
        
            if (!currentTabs?.id) {
                throw {
                    ...ResponseCodePair[ResponseCode.NOT_OPEN_TAB],
                }
            }

            const originalTab = currentTabs as chrome.tabs.Tab;

            // 새 탭 열기
            const url = instance.getSubmitUrl(sourceId);
            const tab = await createAndWaitForTab(url);

            if (!tab.id) {
                throw {
                    ...ResponseCodePair[ResponseCode.NOT_OPEN_TAB],
                }
            }

            currentTabId = tab.id;

            const data = message.data as Submit;
            const isLogin = await Promise.race([sendMessageToTab<boolean>(tab.id, {
                type: MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_CHECK_LOGIN,
                data: {source},
            }), waitForTabClose(tab.id)]);
            

            if (!isLogin) {
                chrome.tabs.update(tab.id, {active: true});
                const isLoggedIn = await checkLogin(tab.id, {source: data.source});

                if (!isLoggedIn) {
                    throw {
                        ...ResponseCodePair[ResponseCode.LOGIN_FAILED],
                    }
                }

                chrome.tabs.update(originalTab.id!, {active: true});
            }

            const submitResult =  await Promise.race([sendMessageToTab<any>(tab.id, {
                type: MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT,
                data,
            }), waitForTabClose(tab.id)]);
            
            if (!submitResult) {
                throw {
                    ...ResponseCodePair[ResponseCode.SUBMIT_FAILED],
                }
            }

            const result = await Promise.race([waitUntil<boolean>(tab.id, {
                type: MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_RESULT,
                data,
            }, (result) => result, {
                timeout: 30000,
            }), waitForTabClose(tab.id)]);     
            

            if (!result) {
                throw {
                    ...ResponseCodePair[ResponseCode.SUBMIT_FAILED],
                }
            }

            sendResponse({
                type: ResponseMessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_SUBMIT_RESPONSE,
                ...ResponseCodePair[ResponseCode.SUCCESS],
                data: { tabId: tab.id },
            });
            
            return false;
        } catch (error:  any | {code: string, message: string}) {
            if (error.code) {
                sendResponse(error);
            } else {
                if (error.message.includes('Error: Could not establish connection. Receiving end does not exist.')) {
                    sendResponse({
                        ...ResponseCodePair[ResponseCode.TAB_CLOSED],
                    });
                } else {
                    sendResponse({
                        ...ResponseCodePair[ResponseCode.UNKNOWN_ERROR],
                    });
                }
            }
            if (currentTabId) {
                chrome.tabs.remove(currentTabId);
            }

            return false;
        } finally {

        }
    } else if (message.type === MessageType.CONTENT_SCRIPT_TO_BACKGROUND_PROGRESS) {
        const data = message.data as {tabId: number, source: Source};
        const progress = await waitUntil<boolean>(data.tabId, {
            type: MessageType.BACKGROUND_TO_NEW_CONTENT_SCRIPT_PROGRESS,
            data,
        }, (result) => result, {
            timeout: 30000,
        });

        sendResponse(progress);
        return false;
    }

    return false;
});

