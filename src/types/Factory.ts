type Factory = {
    [key: string]: {
        getSubmitUrl: (sourceId: string) => string;
        waitForLogin: (tabId: number) => Promise<boolean>;
        submitCode: (tabId: number, code: string, language: string) => Promise<void>;
    };
}