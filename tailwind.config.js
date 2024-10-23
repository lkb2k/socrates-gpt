// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#0a0908",
        gunmetal: "#22333b",
        almond: "#eae0d5",
        khaki: "#c6ac8f",
        walnutBrown: "#5e503f",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.black"),
            a: {
              color: theme("colors.khaki"),
              "&:hover": {
                color: theme("colors.walnutBrown"),
              },
            },
            h1: { color: theme("colors.gunmetal") },
            h2: { color: theme("colors.gunmetal") },
            h3: { color: theme("colors.gunmetal") },
            h4: { color: theme("colors.gunmetal") },
            strong: { color: theme("colors.gunmetal") },
            blockquote: {
              color: theme("colors.walnutBrown"),
              borderLeftColor: theme("colors.khaki"),
            },
            code: { color: theme("colors.gunmetal") },
            // Customize other elements as needed
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
