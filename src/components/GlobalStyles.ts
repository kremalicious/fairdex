import { rem } from 'polished';
import { createGlobalStyle, css } from 'styled-components';

const variables = css`
  :root {
    // Colors
    --color-accent: rgb(219, 184, 44);
    --color-accent-shadow: rgba(219, 184, 44, 0.7);
    --color-border: rgba(0, 0, 0, 0.05);
    --color-content-bg: #f4f6f8;
    --color-main-bg: #ffffff;
    --color-text-primary: #131f3e; // FIXME
    --color-text-secondary: #adadad; // FIXME
    --color-text-orange: #f77902;
    --color-light-grey-blue: #85c3d6; // FIXME
    --color-greyish: #adadad;
    --color-grey: #d9dee2;

    // Layout
    --card-height: ${rem('256px')};
    --card-width: ${rem('256px')};
    --header-height: ${rem('72px')};
    --sidebar-width: ${rem('320px')};

    // Spacing
    --spacing-title: 0.75rem;
    --spacing-text: 0.5rem;
    --spacing-narrow: 1rem;
    --spacing-normal: 2rem;
    --spacing-wide: 3rem;

    // Animations
    --animation-duration: 250ms;
  }
`;

const GlobalStyles = createGlobalStyle`
  ${variables}

  html {
    box-sizing: border-box;
    overflow-y: scroll;
    font-size: 16px;
  }

  body {
    font-family: 'Open Sans', sans-serif;
    font-size: 16px;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }

  a {
    text-decoration: none;
  }

  h1, h2, h3 {
    margin: 0;
    font-size: 1rem;
  }

  #root {
    background-color: var(--color-content-bg);
  }
`;

export default GlobalStyles;