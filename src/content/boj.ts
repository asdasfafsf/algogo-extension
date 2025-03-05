// src/content/boj.ts
export const BOJ = {
    // 코드 제출 함수
    submit: async (submit: Submit): Promise<boolean> => {
        try {
            // 언어 선택
            const { language, code } = submit;
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
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 코드 입력
            const textarea = document.getElementById('source');
            if (!textarea) {
                throw new Error('Textarea not found');
            }

            const cmElement = textarea.parentElement?.querySelector('.CodeMirror');
            if (!cmElement) {
                throw new Error('CodeMirror element not found');
            }

            const codeArea = cmElement.querySelector('textarea');

            if (codeArea) {
                codeArea.value = code;
                codeArea.dispatchEvent(new Event('input'));
                codeArea.dispatchEvent(new Event('change'));
            }
            
            // 다시 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 제출 버튼 클릭
            const submitButton = document.getElementById('submit_button');
            if (!submitButton) {
                throw new Error('Submit button not found');
            }
            submitButton.click();
            return true;
        } catch (e) {
            return false;
        }
    },
    progress: async () => {
        const statusCell = document.querySelector('table.table td.result');
        if (!statusCell) {
            return null;
        }

        const statusText = statusCell.textContent?.trim() || '';
        const isWaiting = statusText.includes('기다리는 중') || 
                        statusText.includes('채점 중');
        
        let progress = 0;
        const progressMatch = statusText.match(/\((\d+)%\)/);
        if (progressMatch) {
            progress = parseInt(progressMatch[1], 10);
        }
        
        const result = {
            status: statusText,
            progress: isWaiting ? progress : 100,
            memory: (document.querySelector('table.table td.memory')?.textContent?.trim() || ''),
            time: (document.querySelector('table.table td.time')?.textContent?.trim() || ''),
            code: (document.querySelector('table.table td.result')?.className?.includes('result-ac') 
                ? 'SUCCESS' 
                : 'FAIL'),
            isComplete: !isWaiting
        };
        
        return result;
    },
    // 로그인 상태 확인
    checkLoginStatus: (): boolean => {
        const loginInput = document.querySelector('input[name="login_user_id"]');
        return !loginInput; 
    },
    
    // 결과 페이지 확인
    isResultPage: (): boolean => {
        return window.location.href.includes('/status');
    }
};

