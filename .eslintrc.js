module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    "indent": "off",
    "linebreak-style": "off",
    "quotes": "off",
    "semi": "off",
    "no-unused-vars": [
      "error", {
        "varsIgnorePattern": "constructor|prototype",
      },
    ],
    "no-console": "off",
    "no-cond-assign": "off",
  },
};
