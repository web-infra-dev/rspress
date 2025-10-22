/**
 * process title element to toc element that can be rendered
 * @param element
 * @returns clonedElement
 */
export function processTitleElement(element: Element): Element {
  const elementClone = element.cloneNode(true) as Element;

  // 1. remove .rp-header-anchor
  const anchorElement = elementClone.querySelector('.rp-header-anchor');

  if (anchorElement) {
    elementClone.removeChild(anchorElement);
  }

  // 2. delete ".rp-toc-exclude" element
  const excludeElements = elementClone.querySelectorAll(
    '.rspress-toc-exclude,.rp-toc-exclude',
  );
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

  // 4. remove <!-- -> elements,
  // case: `## Title {props.title}` will generate a comment node `<!-- -->` for replace in SSG
  const commentNodes = elementClone.childNodes;
  commentNodes.forEach(node => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
    }
  });

  return elementClone;
}
