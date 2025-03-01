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
    }
}