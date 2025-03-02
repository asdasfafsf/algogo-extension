export const BOJ = {
    getSubmitUrl: (sourceId: string) => {
        return `https://www.acmicpc.net/submit/${sourceId}`;
    },
    waitForLogin: async (tabId: number) => {
        const maxWaitTime = 300000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => !document.querySelector('#login_form')
            });
            
            if (results[0].result) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        return false;
    },
    submitCode: async (tabId: number, code: string, language: Language) => { 
        return new Promise(async (resolve, reject) => {
            try {
                // 페이지 요소가 모두 로드될 때까지 반복 확인
                const maxAttempts = 10; // 최대 시도 횟수
                const checkInterval = 1000; // 확인 간격 (1초)
                let attempts = 0;
                let pageReady = false;
                
                while (!pageReady && attempts < maxAttempts) {
                    const pageReadyCheck = await chrome.scripting.executeScript({
                        target: { tabId },
                        func: () => {
                            return !!document.querySelector('#language') && 
                                   !!document.querySelector('.CodeMirror') &&
                                   !!document.getElementById('submit_button');
                        }
                    });
                    
                    pageReady = pageReadyCheck[0].result ?? false;
                    
                    if (!pageReady) {
                        attempts++;
                        console.log(`페이지 로딩 대기 중... (${attempts}/${maxAttempts})`);
                        await new Promise(resolve => setTimeout(resolve, checkInterval));
                    }
                }
                
                if (!pageReady) {
                    throw new Error('페이지 요소 로드 시간 초과');
                }
                
                // 추가 안정화를 위한 짧은 대기
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const results = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: (code: string, language: Language) => {
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
            
            
                        // 코드 입력
                        const textarea = document.getElementById('source');
                        if (!textarea) {
                            throw new Error('Textarea not found');
                        }
            
                        const cmElement = textarea.parentElement?.querySelector('.CodeMirror');
                        if (!cmElement) {
                            throw new Error('CodeMirror element not found');
                        }
            
                        const codeLine = cmElement.querySelector('.CodeMirror-line');
                        const codeArea = cmElement.querySelector('textarea');
            
                        if (codeLine) codeLine.textContent = code;
                        if (codeArea) {
                            codeArea.value = code;
                            codeArea.dispatchEvent(new Event('input'));
                            codeArea.dispatchEvent(new Event('change'));
                        }
            
                        const submitButton = document.getElementById('submit_button');
                        if (!submitButton) {
                            throw new Error('Submit button not found');
                        }
                        submitButton.click();
                        return true; // 성공 시 true 반환
                    },
                    args: [code, language],
                });
                
                if (results && results[0].result) {
                    resolve(true);
                } else {
                    reject(new Error('코드 제출 실패'));
                }
            } catch (error) {
                console.error('코드 제출 중 오류:', error);
                reject(error);
            }
        });
    },
    monitorJudgeProgress: async (tabId: number, progressCallback: (progress: JudgeProgress) => void) => {
        const maxWaitTime = 300000; // 최대 5분 대기
        const startTime = Date.now();
        let lastStatus = '';
        
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // 채점 상태 확인
                const statusResults = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: (tabId: number) => {
                        const statusCell = document.querySelector('table.table td.result');
                        if (!statusCell) return null;
                        
                        const statusText = statusCell.textContent?.trim() || '';
                        const isWaiting = statusText.includes('기다리는 중') || 
                                        statusText.includes('채점 중');
                        
                        // 진행률 추출 (예: "채점 중 (31%)")
                        let progress = 0;
                        const progressMatch = statusText.match(/\((\d+)%\)/);
                        if (progressMatch) {
                            progress = parseInt(progressMatch[1], 10);
                        }
                        
                        if (!isWaiting) {
                            // 채점 완료
                            return {
                                status: statusText,
                                progress: 100,
                                memory: document.querySelector('table.table td.memory')?.textContent?.trim(),
                                time: document.querySelector('table.table td.time')?.textContent?.trim(),
                                code: document.querySelector('table.table td.result')?.className?.includes('result-ac') 
                                    ? 'SUCCESS' 
                                    : 'FAIL',
                                isComplete: true
                            };
                        }
                        
                        return {
                            status: statusText,
                            progress: progress,
                            isComplete: false
                        };
                    },
                    args: [tabId],
                });
                
                const result = statusResults[0].result;
                if (result) {
                    console.log("채점 상태:", result);
                    
                    if (result.status !== lastStatus) {
                        lastStatus = result.status;
                        progressCallback(result);
                        
                        if (result.isComplete) {
                            console.log("채점 완료:", result);
                            return result;
                        }
                    }
                } else {
                    console.log("채점 상태를 가져올 수 없음");
                }
                
                // 잠시 대기 후 다시 확인
                await new Promise(r => setTimeout(r, 100));
            } catch (error) {
                console.error("채점 모니터링 오류:", error);
                const errorResult = { 
                    status: '오류 발생', 
                    progress: 0, 
                    error: (error as Error).message,
                    isComplete: true,
                    code: 'ERROR'
                };
                progressCallback(errorResult);
                return errorResult;
            }
        }
        
        console.log("채점 시간 초과");
        // 시간 초과
        const timeoutResult = { 
            status: '시간 초과', 
            progress: 0, 
            isComplete: true,
            code: 'TIMEOUT'
        };
        progressCallback(timeoutResult);
        return timeoutResult;
    },
    waitForResultPage: async (tabId: number): Promise<boolean> => {
        const maxWaitTime = 30000; // 최대 30초 대기
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: (tabId: number) => window.location.href.includes('/status'),
                    args: [tabId],
                });
                
                if (results[0].result) {
                    return true;
                }
                
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                return false;
            }
        }
        
        return false;
    },
    checkLoginStatus: async (tabId: number): Promise<boolean> => {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => !document.querySelector('#login_form')
            });
            
            return results[0].result ?? false;
        } catch (error) {
            return false;
        }
    }
}