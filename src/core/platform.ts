import type { SubmitRequest, SubmitResult, JudgeProgress } from '../types';

export interface Platform {
  readonly name: string;
  readonly baseUrl: string;

  getSubmitUrl(problemId: string): string;
  isLoggedIn(): boolean;
  submit(request: SubmitRequest): Promise<SubmitResult>;
  getProgress(problemId: string): Promise<JudgeProgress>;
}

export class PlatformFactory {
  private static platforms = new Map<string, Platform>();

  static register(platform: Platform): void {
    this.platforms.set(platform.name, platform);
  }

  static get(name: string): Platform | undefined {
    return this.platforms.get(name);
  }

  static createPlatform(name: string, baseUrl: string): Platform {
    return {
      name,
      baseUrl,
      getSubmitUrl: (problemId: string) => {
        return `${baseUrl}/submit/${problemId}`;
      },
      isLoggedIn: () => true,
      submit: async (request: SubmitRequest) => {
        return { success: false, message: 'Not implemented' };
      },
      getProgress: async (problemId: string) => {
        return { status: 'pending', progress: 0, isComplete: false };
      },
    };
  }
}
