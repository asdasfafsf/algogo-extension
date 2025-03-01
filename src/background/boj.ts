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
    submitCode: async (tabId: number, code: string, language: string) => { 
        return new Promise(async (resolve, reject) => {
            const results = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    const languageSelect = document.querySelector('#language') as HTMLSelectElement;
                    const langValueMap: Record<string, string> = {
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
                    return
                }
            });
        })

        
            
    }
}