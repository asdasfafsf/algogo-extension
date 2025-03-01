export type Response<T> = {
    code: string;
    message: string;
    result: T;
}