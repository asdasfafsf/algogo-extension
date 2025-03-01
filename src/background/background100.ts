chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});



async function waitForLogin(tabId: number): Promise<boolean> {
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
}

// sendResponse 파라미터를 실제로 사용하도록 수정
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    if (message.type === 'SUBMIT') {
        sendResponse({ received: true });
        
        const { source, code, sourceId, language } = message.data;
        
        if (source === 'BOJ') {
            const newTab = await chrome.tabs.create({ 
                url: `https://www.acmicpc.net/submit/${sourceId}`,
                active: true 
            });
            
            await waitForTabLoad(newTab.id!);
            
            const loginCheck = await chrome.scripting.executeScript({
                target: { tabId: newTab.id! },
                func: () => !!document.querySelector('#login_form')
            });

            if (loginCheck[0].result) {
                await chrome.tabs.update(newTab.id!, { active: true });
                
                const loginSuccess = await waitForLogin(newTab.id!);
                if (!loginSuccess) {
                    console.log('로그인 대기 시간 초과');
                    return;
                }
            }

            // 언어 선택과 코드 입력만 수행
            await chrome.scripting.executeScript({
                target: { tabId: newTab.id! },
                func: async (code, lang) => {
                    const languageSelect = document.querySelector('#language') as HTMLSelectElement;
                    
                    if (languageSelect) {
                        // 1. 언어 선택 설정
                        const setLanguage = () => {
                            const langValueMap: Record<string, string> = {
                                'Python': '28',
                                'Java': '93',
                                'C++': '84',
                                'Node.js': '17'
                            };
                            
                            languageSelect.value = langValueMap[lang];
                            languageSelect.dispatchEvent(new Event('change'));
                            languageSelect.dispatchEvent(new Event('chosen:updated'));
                            console.log('언어 설정 완료:', lang);
                        };

                        // 2. 코드 입력
                        const setCode = () => {
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
                            console.log('코드 입력 완료');
                        };

                        // 3. 제출
                        const submitCode = () => {
                            const submitButton = document.getElementById('submit_button');
                            if (!submitButton) {
                                throw new Error('Submit button not found');
                            }
                            submitButton.click();
                            console.log('제출 버튼 클릭됨');
                        };

                        // 채점 결과 감지 함수
                        const waitForResult = () => {
                            return new Promise((resolve) => {
                                console.log('채점 결과 확인 시작');
                                chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, tab) {
                                    // 모든 탭 업데이트 로깅
                                    console.log('탭 업데이트 감지:', {
                                        status: changeInfo.status,
                                        url: tab.url
                                    });
                                });
                            });
                        };

                        // 채점 페이지 감지 함수
                        const waitForGradingPage = (tabId: number) => {
                            return new Promise((resolve) => {
                                console.log('채점 페이지 감지 시작');
                                chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo, tab) {
                                    if (updatedTabId === tabId && changeInfo.status === 'complete' && tab.url?.includes('/status')) {
                                        chrome.tabs.onUpdated.removeListener(listener);
                                        console.log('채점 페이지 감지됨');
                                        resolve();
                                    }
                                });
                            });
                        };

                        // 실행 순서는 기존 코드 그대로 유지
                        try {
                            console.log('제출 프로세스 시작');
                            setLanguage();
                            setCode();
                            
                            // 제출 전에 먼저 리스너 등록
                            const resultPromise = waitForResult();
                            
                            setTimeout(() => {
                                console.log('5초 후 제출 버튼 클릭');
                                submitCode();
                            }, 5000);
                            
                            // 결과 기다리기
                            resultPromise.then(() => {
                                console.log('채점 페이지 감지됨');
                            });
                            
                        } catch (error) {
                            console.error('실행 중 오류 발생:', error.message);
                        }
                    } else {
                        console.error('언어 선택 요소를 찾을 수 없습니다.');
                    }
                },
                args: [code, language]
            });

            // 탭을 보여줌
            await chrome.tabs.update(newTab.id!, { active: true });
        }
    }
    
    return true;
});






