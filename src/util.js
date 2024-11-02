/** 
 * @param {ParentNode | undefined} parentNode
 * @param {string} className
 * @returns {Element | null}
 */
export function querySelectorByClass(parentNode, className) {
    return parentNode?.querySelector("." + className) ?? null;
} 

/** 
 * @param {ParentNode} parentNode
 * @param {string} className
 * @returns {NodeListOf<Element>}
 */
export function querySelectorAllByClass(parentNode, className) {
    return parentNode.querySelectorAll("." + className);
} 

/**
 * @param {Element} element
 * @param {MutationCallback} callback
 * @param {MutationObserverInit} config
 * @returns {MutationObserver}
 */
export function createObserver(element, callback, config) {
    const observer = new MutationObserver(callback);
    observer.observe(element, config);
    return observer;
}