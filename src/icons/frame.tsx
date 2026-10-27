import type { ReactElement, ReactNode } from 'react';

/**
 * Icons are language-agnostic data: the same drawing in every locale, on the web and on share cards.
 * They must render in both React DOM and Satori (next/og), so they stick to the SVG subset Satori
 * passes to resvg: intrinsic `path`/`circle`/`rect`/`ellipse`/`polygon`/`line` elements with plain
 * fill/stroke attributes. No CSS classes, `<use>`, filters, masks, gradients or `<text>`, and no
 * function components inside the `<svg>`.
 */
export interface IconProps {
  /** Width and height in px. */
  size?: number;
  /** Fill/stroke color. `currentColor` follows the surrounding text color (DOM and Satori). */
  color?: string;
}

export type Icon = (props: IconProps) => ReactElement;

/** Stroke width shared by every line detail (24-unit grid). */
export const STROKE = 2;

/** The `<svg>` wrapper on a 24×24 grid. Called as a plain function so its children stay intrinsic. */
export function frame({ size = 24, color = 'currentColor' }: IconProps, children: (color: string) => ReactNode): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      {children(color)}
    </svg>
  );
}
