export const $$ = document.querySelectorAll.bind(document);
export const $ = document.querySelector.bind(document);

export function clamp(num, min, max) {
    return Math.max(Math.min(num, max), min);
}
