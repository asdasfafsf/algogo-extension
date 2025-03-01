import { getInstance } from "./factory";

const waitForTabLoad = (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener); // 리스너 제거
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
};



const handleSubmit = async (message: Submit, sender: any, sendResponse: any) => {
    const instance = getInstance(message.source);
    const submitUrl = instance.getSubmitUrl(message.sourceId);

    const newTab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.tabs.create({ url: submitUrl }, async (tab) => {
            resolve(tab);
        });
    });

    if (!newTab?.id) {
        console.error("새로운 탭을 열 수 없습니다.");
        sendResponse({ code: "9000", message: "탭 생성 실패", result: null });
        return;
    }

    await waitForTabLoad(newTab.id);
    const loginSuccess = await instance.waitForLogin(newTab.id);

    if (!loginSuccess) {
        console.error("로그인 실패");
        sendResponse({ code: "9001", message: "로그인 실패", result: null });
        return;
    }

    await instance.submitCode(newTab.id, message.code, message.language);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUBMIT') {
        handleSubmit(message as Submit, sender, sendResponse);
    }
});


