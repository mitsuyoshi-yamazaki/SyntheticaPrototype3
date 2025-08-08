import "../src/app/globals.css"

/** @type {import('@storybook/nextjs').Preview} */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#101010" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
}

export default preview
