import type { SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Rendered width/height in px (icons are 24x24 viewBox). */
  size?: number;
};

/**
 * Build an icon component from a static, trusted 24x24 SVG body (reicon pack).
 * Bodies are generated with every hardcoded fill/stroke replaced by
 * `currentColor`, so icons inherit the surrounding text color.
 */
export function createIcon(name: string, svgBody: string) {
  function IconComponent({ size = 16, ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        // static trusted string generated from the reicon SVG pack
        dangerouslySetInnerHTML={{ __html: svgBody }}
        {...props}
      />
    );
  }
  IconComponent.displayName = name;
  return IconComponent;
}
