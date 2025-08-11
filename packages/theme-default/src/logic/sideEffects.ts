function getTargetTop(element: HTMLElement, scrollPaddingTop: number) {
  const targetPadding = Number.parseInt(
    window.getComputedStyle(element).paddingTop,
    10,
  );

  const targetTop =
    window.scrollY +
    element.getBoundingClientRect().top -
    scrollPaddingTop -
    targetPadding;

  return Math.round(targetTop);
}

export function scrollToTarget(
  target: HTMLElement,
  isSmooth: boolean,
  scrollPaddingTop: number,
) {
  // Only scroll smoothly in page header anchor
  window.scrollTo({
    left: 0,
    top: getTargetTop(target, scrollPaddingTop),
    ...(isSmooth ? { behavior: 'smooth' } : {}),
  });
}

export function useSetup() {
  return;
}
