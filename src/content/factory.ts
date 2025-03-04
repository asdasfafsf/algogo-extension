// src/content/factory.ts
import { BOJ } from './boj';


export const ContentFactory = {
    'BOJ': BOJ
};

export const getContentInstance = (source: Source) => {
    return ContentFactory[source as keyof typeof ContentFactory];
};