import { getInstance } from "./factory";


const createAndWaitForTab = async (url: string): Promise<chrome.tabs.Tab> => {
    // 탭 생성
    const newTab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.tabs.create({ url }, (tab) => {
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
const sendMessageToTab = async <T>(tabId: number, message: any, timeout: number = 5000): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
            reject(new Error(`메시지 응답 타임아웃: ${timeout}ms 초과`));
        }, timeout);
        
        // 메시지 전송
        chrome.tabs.sendMessage(tabId, message, (response) => {
            // 타임아웃 해제
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
                // 오류 발생 시 (예: content script가 로드되지 않음)
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response as T);
            }
        });
    });
};


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'SUBMIT') {
        const { source, code, language } = message.data;
        const instance = getInstance(source);

        if (!instance) {
            return false;
        }

        // 새 탭 열기
        const url = instance.getSubmitUrl(code.sourceId);
        const tab = await createAndWaitForTab(url);

        if (!tab.id) {
            return false;
        }
        
        return true; // 비동기 응답을 위해 true 반환
    }
});