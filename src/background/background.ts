import { getInstance } from "./factory";

const waitForTabLoad = (tabId: number): Promise<void> => {
    return new Promise((resolve) => {
        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        chrome.tabs.onUpdated.addListener(listener);
    });
};

const tabCloseListeners = new Map<number, (tabId: number) => void>();

// 포트 연결을 관리하는 맵 추가
const portConnections = new Map<number, chrome.runtime.Port>();

chrome.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith('judge_progress_')) {
        const tabId = parseInt(port.name.replace('judge_progress_', ''), 10);
        portConnections.set(tabId, port);
        
        port.onDisconnect.addListener(() => {
            portConnections.delete(tabId);
        });
    }
});

const handleSubmit = async (message: { data: Submit }, sender: any, sendResponse: any) => {
    const { data } = message;
    const instance = getInstance(data.source);
    const submitUrl = instance.getSubmitUrl(data.sourceId);
    
    // 현재 활성화된 탭 정보 저장
    const currentTab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });

    const newTab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => {
        chrome.tabs.create({ url: submitUrl, active: false }, (tab) => {
            resolve(tab?.id ? tab : undefined);
        });
    });

    if (!newTab?.id) {
        sendResponse({ code: "9000", message: "탭 생성 실패", result: null });
        return;
    }

    console.log("newTab", newTab);

    const tabClosedPromise = new Promise<never>((_, reject) => {
        const closeListener = (tabId: number) => {
            if (tabId === newTab.id) {
                chrome.tabs.onRemoved.removeListener(closeListener);
                tabCloseListeners.delete(tabId);
                reject(new Error("탭이 닫혔습니다."));
            }
        };
        tabCloseListeners.set(newTab.id!, closeListener);
        chrome.tabs.onRemoved.addListener(closeListener);
    });

    try {
        await Promise.race([waitForTabLoad(newTab.id), tabClosedPromise]);
        
        // 로그인 상태 확인
        const isLoggedIn = await Promise.race([instance.checkLoginStatus(newTab.id), tabClosedPromise]);
        
        // 로그인이 필요한 경우에만 탭 활성화
        if (!isLoggedIn) {
            // 로그인이 필요하면 탭 활성화
            await chrome.tabs.update(newTab.id, { active: true });
            
            // 로그인 대기
            const loginSuccess = await Promise.race([instance.waitForLogin(newTab.id), tabClosedPromise]);
            if (!loginSuccess) {
                sendResponse({ code: "9001", message: "로그인 실패", result: null });
                return;
            }
            
            // 로그인 성공 후 원래 탭으로 포커스 돌려주기
            if (currentTab?.id) {
                await chrome.tabs.update(currentTab.id, { active: true });
            }
        }
        
        console.log("submitCode", data.code, data.language);  
        const submitSuccess = await Promise.race([instance.submitCode(newTab.id, data.code, data.language), tabClosedPromise]);
        if (!submitSuccess) {
            sendResponse({ code: "9002", message: "제출 실패", result: null });
            return;
        }
        
        // 초기 응답 보내기
        const resultPageReady = await Promise.race([instance.waitForResultPage(newTab.id), tabClosedPromise]);
        if (!resultPageReady) {
            sendResponse({ code: "9003", message: "결과 페이지 로드 실패", result: null });
            return;
        }
        
        // 성공 응답 보내기
        sendResponse({ code: "0000", message: "제출 성공", result: { tabId: newTab.id } });
        
        // 채점 진행 상황 모니터링 시작
        instance.monitorJudgeProgress(newTab.id, (progress) => {
            // 포트가 연결되어 있으면 진행 상황 전송
            const port = portConnections.get(newTab.id!);
            if (port) {
                port.postMessage({ type: 'JUDGE_PROGRESS', data: progress });
            }
            
            // 채점이 완료되면 탭 닫기 (선택적)
            if (progress.isComplete && newTab.id) {
                setTimeout(() => {
                    chrome.tabs.remove(newTab.id!).catch(() => {});
                }, 3000); // 3초 후 탭 닫기
            }
        });
        
    } catch (error) {
        sendResponse({ code: "9003", message: "탭이 닫혔습니다.", result: null });
        return;
    } finally {
        if (newTab.id && tabCloseListeners.has(newTab.id)) {
            chrome.tabs.onRemoved.removeListener(tabCloseListeners.get(newTab.id)!);
            tabCloseListeners.delete(newTab.id);
        }
    }
};

// 메시지 리스너에서 비동기 응답을 위해 true 반환
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUBMIT') {
        handleSubmit(message, sender, sendResponse);
        return true; // 비동기 응답을 위해 true 반환
    }
});