type JudgeProgress = {
  status: string;
  progress: number;
  memory?: string;
  time?: string;
  isComplete: boolean;
};

type Factory = {
    [key in Source]: {
        getSubmitUrl: (sourceId: string) => string;
        waitForLogin: (tabId: number) => Promise<boolean>;
        submitCode: (tabId: number, code: string, language: string) => Promise<void>;
        waitForResultPage: (tabId: number) => Promise<boolean>;
        monitorJudgeProgress: (tabId: number, progressCallback: (progress: JudgeProgress) => void) => Promise<JudgeProgress>;
    };
};