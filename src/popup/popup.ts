document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  document.getElementById('testBtn')?.addEventListener('click', async () => {
    const executeResult = await new Promise<any & {tabId: number}>((resolve) => {
      window.postMessage({
        type: 'EXECUTE',
        data: {
          source: 'BOJ',
          sourceId: '1000',
          code: `a, b = map(int, input().split())
print(a+b)`,
          language: 'Python'
        }
      }, '*');

      console.log('????');
      window.addEventListener('message', function handler(event) {
        console.log('event', event);
        window.removeEventListener('message', handler);
        resolve(event.data.data);
      });
    });

    if (executeResult.code === '0000' && executeResult.tabId) {
      while (true) {
        const statusResult = await new Promise((resolve) => {
          window.postMessage({
            type: 'PROGRESS',
            data: { 
              tabId: executeResult.tabId 
            }
          }, '*');

          window.addEventListener('message', function handler(event) {
            window.removeEventListener('message', handler);
            resolve(event.data.data);
          });
        });

        console.log('채점 상태:', statusResult);
        if (statusResult.isComplete) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  });
}); 