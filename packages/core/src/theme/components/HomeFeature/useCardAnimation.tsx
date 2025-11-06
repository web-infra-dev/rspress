import { type HTMLAttributes, useRef, useState } from 'react';

export const useCardAnimation = () => {
  const [pageX, setPageX] = useState<null | number>(null);
  const [pageY, setPageY] = useState<null | number>(null);
  const [isHovering, setIsHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = ({ pageX, pageY }: { pageX: number; pageY: number }) => {
    setPageX(pageX);
    setPageY(pageY);
  };

  const handleTouchMove = (evt: any) => {
    evt.preventDefault();
    const { pageX, pageY } = evt.touches[0];
    handleMove({ pageX, pageY });
  };

  let shine: string;
  let shineBg: string;
  let container: string;
  let outerContainer: string;
  const handleEnter = () => {
    setIsHovering(true);
  };
  const handleLeave = () => {
    setIsHovering(false);
  };

  const ele = ref.current;
  if (pageX && pageY && ele && isHovering) {
    const rootElemWidth = ele.clientWidth || ele.offsetWidth || ele.scrollWidth;
    const rootElemHeight =
      ele.clientHeight || ele.offsetHeight || ele.scrollHeight;

    const bodyScrollTop =
      document.body.scrollTop ||
      document.getElementsByTagName('html')[0].scrollTop;
    const bodyScrollLeft = document.body.scrollLeft;

    const offsets = ele.getBoundingClientRect();
    const wMultiple = 320 / rootElemWidth;
    const multiple = wMultiple * 0.05;
    const offsetX =
      0.52 - (pageX - offsets.left - bodyScrollLeft) / rootElemWidth;
    const offsetY =
      0.52 - (pageY - offsets.top - bodyScrollTop) / rootElemHeight;
    const dy = pageY - offsets.top - bodyScrollTop - rootElemHeight / 2;
    const dx = pageX - offsets.left - bodyScrollLeft - rootElemWidth / 2;
    const yRotate = (offsetX - dx) * multiple;
    const xRotate =
      (dy - offsetY) * (Math.min(offsets.width / offsets.height, 1) * multiple);
    const arad = Math.atan2(dy, dx);
    const rawAngle = (arad * 180) / Math.PI - 90;
    const angle = rawAngle < 0 ? rawAngle + 360 : rawAngle;

    shine = `translateX(${offsetX - 0.1}px) translateY(${offsetY - 0.1}px)`;
    shineBg = `linear-gradient(${angle}deg, rgba(255, 255, 255, ${
      ((pageY - offsets.top - bodyScrollTop) / rootElemHeight) * 0.2
    }) 0%, rgba(255, 255, 255, 0) 50%)`;

    container = `rotateX(${xRotate}deg) rotateY(${yRotate}deg)`;
    outerContainer = `perspective(${rootElemWidth * 2}px)`;
  } else {
    shine = '';
    shineBg = '';
    container = '';
    outerContainer = '';
  }

  const outerProps: HTMLAttributes<HTMLDivElement> = {
    style: {
      transform: outerContainer,
      transformStyle: 'preserve-3d',
    },
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
    onMouseMove: handleMove,
    onTouchMove: handleTouchMove,
    onTouchStart: handleEnter,
    onTouchEnd: handleLeave,
  };
  const outerRef = ref;

  const innerProps = {
    style: {
      transform: container,
    },
  };

  const shineDom = (
    <div
      className="rp-home-feature__item__shine"
      style={{
        position: 'absolute',
        userSelect: 'none',
        pointerEvents: 'none',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        borderRadius: '20px',
        zIndex: '8',
        ...(shine
          ? {
              transform: shine,
            }
          : {}),
        ...(shineBg
          ? {
              background: shineBg,
            }
          : {}),
      }}
    />
  );

  return {
    outerProps,
    outerRef,
    innerProps,
    shineDom,
  };
};
