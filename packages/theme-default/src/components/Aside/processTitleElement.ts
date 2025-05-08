/**
 * process title element to toc element that can be rendered
 * @param element
 * @returns clonedElement
 */
export function processTitleElement(element: Element): Element {
  const elementClone = element.cloneNode(true) as Element;

  // 1. remove .header-anchor
  const anchorElement = elementClone.querySelector('.header-anchor');

  if (anchorElement) {
    elementClone.removeChild(anchorElement);
  }

  // 2. replace a elements with their text content
  const anchorElements = elementClone.querySelectorAll('a');

  anchorElements.forEach(anchor => {
    const textContent = anchor.textContent || '';
    const textNode = document.createTextNode(textContent);
    anchor.replaceWith(textNode);
  });

  return elementClone;
}
