declare module "ldrs" {
  export const newtonsCradle: {
    register: () => void;
  };

  export const bouncy: {
    register: () => void;
  };

  export const dotSpinner: {
    register: () => void;
  };

  export const ring: {
    register: () => void;
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    "l-newtons-cradle": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        size?: string;
        speed?: string;
        color?: string;
      },
      HTMLElement
    >;
    "l-bouncy": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        size?: string;
        speed?: string;
        color?: string;
      },
      HTMLElement
    >;
    "l-dot-spinner": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        size?: string;
        speed?: string;
        color?: string;
      },
      HTMLElement
    >;
    "l-ring": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        size?: string;
        speed?: string;
        color?: string;
      },
      HTMLElement
    >;
  }
}
