// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// JSDOM 16 cần bổ sung Web Crypto và TextEncoder để kiểm tra tài khoản cục bộ.
Object.defineProperty(global, "crypto", {
  value: require("crypto").webcrypto,
  configurable: true,
});
global.TextEncoder = require("util").TextEncoder;
