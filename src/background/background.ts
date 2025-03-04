import { MessageType } from "../constants/messageTypes";
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
const waitUntil = async <T extends keyof typeof MessageType, R>(
    tabId: number,
    checkMessage: Message<T>,
    predicate: (response: R) => boolean,
    options: {
        interval?: number;
        timeout?: number;
        timeoutMessage?: string;
    } = {}
): Promise<R> => {
    const {
        interval = 500,
        timeout = 30000,
        timeoutMessage = '시간 초과'
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
            console.error('상태 체크 중 오류:', error);
            throw error;
        }
    }
    
    throw new Error(timeoutMessage);
};

const checkLogin = async (tabId: number, data: {source: Source}) => {
    return await waitUntil<keyof typeof MessageType, boolean>(tabId, {
        type: 'CHECK_LOGIN',
        data,
    }, (result) => result, {
        timeout: 30000,
    });
}

// 원래 탭 정보를 저장할 변수
let originalTab: chrome.tabs.Tab | null = null;

// 기존 로직은 그대로 두고
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'SUBMIT') {
        const { source, sourceId, code, language } = message.data;
        const instance = getInstance(source);

        if (!instance) {
            return false;
        }

        // 현재 탭 정보 저장
        const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        originalTab = currentTabs[0];

        if (!originalTab?.id) {
            return false;
        }

        originalTab = originalTab as chrome.tabs.Tab;

        // 새 탭 열기
        const url = instance.getSubmitUrl(sourceId);
        const tab = await createAndWaitForTab(url);

        if (!tab.id) {
            return false;
        }

        const data = message.data as Submit;
        const isLogin = await sendMessageToTab<boolean>(tab.id, {
            type: 'CHECK_LOGIN',
            data: {source: data.source},
        });

        if (!isLogin) {
            chrome.tabs.update(tab.id, {active: true});
            const isLoggedIn = await checkLogin(tab.id, {source: data.source});

            if (!isLoggedIn) {
                console.log('로그인이 안되어 있음');
                return false;
            }

            chrome.tabs.update(originalTab.id!, {active: true});
        }

        const submitResult = await sendMessageToTab<any>(tab.id, {
            type: 'SUBMIT',
            data,
        });
        
        if (!submitResult) {
            return false;
        }

        const result = await waitUntil<keyof typeof MessageType, boolean>(tab.id, {
            type: 'RESULT',
            data,
        }, (result) => result, {
            timeout: 30000,
        });     
        

        if (!result) {
            return false;
        }
        
        console.log('제출 페이지')
    }
});

