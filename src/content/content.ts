
// src/content/content.ts
import { getContentInstance } from './factory';

// 현재 사이트 확인
function determineSource(): Source | null {
    const url = window.location.href;
    if (url.includes('acmicpc.net')) return 'BOJ';
    // 다른 사이트 추가 가능
    return null;
}

// 메인 실행 함수
function main() {
    const source = determineSource();
    if (!source) return;
    
    const contentInstance = getContentInstance(source);
    
    // 결과 페이지인 경우 모니터링 시작
    if (contentInstance.isResultPage()) {
        contentInstance.startJudgeMonitor();
    }
    
    // 메시지 리스너 설정
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message.type) return false;
        
        switch (message.type) {
            case 'SUBMIT_CODE':
                const success = contentInstance.submitCode(message.data.code, message.data.language);
                sendResponse({ success });
                break;
                
            case 'CHECK_LOGIN':
                const isLoggedIn = contentInstance.checkLoginStatus();
                sendResponse({ isLoggedIn });
                break;
                
            case 'START_MONITOR':
                if (contentInstance.isResultPage()) {
                    contentInstance.startJudgeMonitor();
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: 'Not on result page' });
                }
                break;
        }
        
        return true; // 비동기 응답을 위해 true 반환
    });
}

// 실행
main();