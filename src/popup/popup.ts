document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  document.getElementById('testBtn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'EXECUTE',
      data: {
        source: 'BOJ',
        sourceId: '1000',  // 테스트용 문제 번호
        code: `a, b = map(int, input().split())
print(a+b)`,
        language: 'Python'
      }
    });
  });
}); 