// src/content/boj.ts
export const BOJ = {
    // 코드 제출 함수
    submitCode: async (code: string, language: Language): Promise<boolean> => {
        try {
            // 언어 선택
            const languageSelect = document.querySelector('#language') as HTMLSelectElement;
            const langValueMap: Record<Language, string> = {
                'Python': '28',
                'Java': '93',
                'C++': '84',
                'Node.js': '17'
            };
            
            languageSelect.value = langValueMap[language];
            languageSelect.dispatchEvent(new Event('change'));
            languageSelect.dispatchEvent(new Event('chosen:updated'));
            
            // 잠시 대기하여 DOM 업데이트 완료 시간 제공
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 코드 입력
            const textarea = document.getElementById('source');
            if (!textarea) {
                throw new Error('Textarea not found');
            }
            
            // 코드 설정 (포커스 없이)
            textarea.value = code;
            
            // 다시 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 제출 버튼 클릭
            const submitButton = document.getElementById('submit_button');
            if (!submitButton) {
                throw new Error('Submit button not found');
            }
            submitButton.click();
            
            return true;
        } catch (e) {
            console.error('코드 제출 중 오류:', e);
            return false;
        }
    },
    
    // 로그인 상태 확인
    checkLoginStatus: (): boolean => {
        return !!document.querySelector('a[onclick*="logout_form"]');
    },
    
    // 채점 상태 모니터링 시작
    startJudgeMonitor: () => {
        // 이미 모니터링 중인지 확인
        if (window.hasOwnProperty('judgeMonitorStarted')) return;
        // @ts-ignore
        window.judgeMonitorStarted = true;
        
        function checkJudgeStatus() {
            const statusCell = document.querySelector('table.table td.result');
            if (!statusCell) {
                setTimeout(checkJudgeStatus, 500);
                return;
            }
            
            const statusText = statusCell.textContent?.trim() || '';
            const isWaiting = statusText.includes('기다리는 중') || 
                            statusText.includes('채점 중');
            
            // 진행률 추출
            let progress = 0;
            const progressMatch = statusText.match(/\((\d+)%\)/);
            if (progressMatch) {
                progress = parseInt(progressMatch[1], 10);
            }
            
            const result = {
                status: statusText,
                progress: isWaiting ? progress : 100,
                memory: document.querySelector('table.table td.memory')?.textContent?.trim(),
                time: document.querySelector('table.table td.time')?.textContent?.trim(),
                code: document.querySelector('table.table td.result')?.className?.includes('result-ac') 
                    ? 'SUCCESS' 
                    : 'FAIL',
                isComplete: !isWaiting
            };
            
            // 백그라운드로 상태 전송
            chrome.runtime.sendMessage({
                type: 'JUDGE_STATUS_UPDATE',
                data: result
            });
            
            // 완료되지 않았으면 계속 확인
            if (!result.isComplete) {
                setTimeout(checkJudgeStatus, 500);
            }
        }
        
        // 모니터링 시작
        checkJudgeStatus();
    },
    
    // 결과 페이지 확인
    isResultPage: (): boolean => {
        return window.location.href.includes('/status');
    }
};