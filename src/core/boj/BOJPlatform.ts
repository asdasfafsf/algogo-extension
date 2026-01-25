import type { SubmitRequest, SubmitResult, JudgeProgress, Language } from '../../types';
import type { Platform } from '../../core/platform';
import { waitUntil, withTimeout } from '../../shared/utils';

const LANGUAGE_MAPPING: Record<Language, string> = {
  'Node.js': '17',
  'Python': '28',
  'Java': '93',
  'C++': '84',
};

export class BOJPlatform implements Platform {
  readonly name = 'BOJ';
  readonly baseUrl = 'https://www.acmicpc.net';

  getSubmitUrl(problemId: string): string {
    return `${this.baseUrl}/submit/${problemId}`;
  }

  isLoggedIn(): boolean {
    const loginInput = document.querySelector('input[name="login_user_id"]');
    return loginInput === null;
  }

  async submit(request: SubmitRequest): Promise<SubmitResult> {
    try {
      await this.selectLanguage(request.language);
      await this.inputCode(request.code);
      await this.clickSubmit();

      return {
        success: true,
        message: '제출되었습니다.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '제출에 실패했습니다.',
      };
    }
  }

  async getProgress(problemId: string): Promise<JudgeProgress> {
    const statusCell = document.querySelector('table.table td.result') as HTMLElement;
    const memoryCell = document.querySelector('table.table td.memory') as HTMLElement;
    const timeCell = document.querySelector('table.table td.time') as HTMLElement;

    if (!statusCell) {
      return {
        status: 'pending',
        progress: 0,
        isComplete: false,
      };
    }

    const statusText = statusCell.textContent?.trim() || '';
    const isWaiting = statusText.includes('기다리는 중') || statusText.includes('채점 중');

    const progressMatch = statusText.match(/\((\d+)%\)/);
    const progress = progressMatch ? parseInt(progressMatch[1], 10) : isWaiting ? 50 : 100;

    return {
      status: statusText,
      progress,
      memory: memoryCell?.textContent?.trim(),
      time: timeCell?.textContent?.trim(),
      isComplete: !isWaiting,
    };
  }

  private async selectLanguage(language: Language): Promise<void> {
    const select = document.querySelector('#language') as HTMLSelectElement;
    if (!select) throw new Error('언어 선택기를 찾을 수 없습니다.');

    const langValue = LANGUAGE_MAPPING[language];
    select.value = langValue;

    select.dispatchEvent(new Event('change'));
    select.dispatchEvent(new Event('chosen:updated'));

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async inputCode(code: string): Promise<void> {
    const textarea = document.getElementById('source') as HTMLTextAreaElement;
    if (!textarea) throw new Error('코드 입력 영역을 찾을 수 없습니다.');

    const cmElement = textarea.parentElement?.querySelector('.CodeMirror') as HTMLElement;
    if (!cmElement) throw new Error('CodeMirror 요소를 찾을 수 없습니다.');

    const codeArea = cmElement.querySelector('textarea') as HTMLTextAreaElement;
    if (!codeArea) throw new Error('코드 입력 영역을 찾을 수 없습니다.');

    codeArea.value = code;
    codeArea.dispatchEvent(new Event('input'));
    codeArea.dispatchEvent(new Event('change'));

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async clickSubmit(): Promise<void> {
    const button = document.getElementById('submit_button') as HTMLButtonElement;
    if (!button) throw new Error('제출 버튼을 찾을 수 없습니다.');

    button.click();
  }
}
