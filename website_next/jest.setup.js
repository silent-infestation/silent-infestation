// jest.setup.js
import "@testing-library/jest-dom";

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };

// 🔇 Redirige tous les logs vers une fonction vide
console.error = jest.fn();
console.warn = jest.fn();
console.info = jest.fn();
console.log = jest.fn();
console.debug = jest.fn();
console.trace = jest.fn();

if (process.env.SUPPRESS_TEST_LOGS === "true") {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
}
