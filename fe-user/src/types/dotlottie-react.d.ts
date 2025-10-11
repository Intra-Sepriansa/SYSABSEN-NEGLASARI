declare module '@lottiefiles/dotlottie-react' {
  import type { CSSProperties, FC } from 'react';

  export interface DotLottieReactProps {
    src: string;
    loop?: boolean;
    autoplay?: boolean;
    speed?: number;
    style?: CSSProperties;
    className?: string;
  }

  export const DotLottieReact: FC<DotLottieReactProps>;
}

