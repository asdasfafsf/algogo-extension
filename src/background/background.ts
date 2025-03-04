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