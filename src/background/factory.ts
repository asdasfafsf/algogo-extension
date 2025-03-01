import { BOJ } from "./boj";

export const Factory = {
    'BOJ': BOJ
}

export const getInstance = (source: string) => {
    return Factory[source as keyof typeof Factory];
}