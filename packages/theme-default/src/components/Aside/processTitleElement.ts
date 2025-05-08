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

  // 2. delete ".rspress-toc-exclude" element
  const excludeElements = elementClone.querySelectorAll('.rspress-toc-exclude');
  excludeElements.forEach(excludeElement => {
    const parentElement = excludeElement.parentElement;
    if (parentElement) {
      parentElement.removeChild(excludeElement);
    }
  });

  // 3. skip a element, replace a elements with their children
  const anchorElements = elementClone.querySelectorAll('a');

  anchorElements.forEach(anchor => {
    const tempContainer = document.createDocumentFragment();

    while (anchor.firstChild) {
      tempContainer.appendChild(anchor.firstChild);
    }

    anchor.replaceWith(tempContainer);
  });

  return elementClone;
}
