/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-catalogs",
factory: function (require) {
"use strict";
var plugin = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/constants.js
  var require_constants = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/constants.js"(exports, module) {
      "use strict";
      var WIN_SLASH = "\\\\/";
      var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
      var DOT_LITERAL = "\\.";
      var PLUS_LITERAL = "\\+";
      var QMARK_LITERAL = "\\?";
      var SLASH_LITERAL = "\\/";
      var ONE_CHAR = "(?=.)";
      var QMARK = "[^/]";
      var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
      var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
      var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
      var NO_DOT = `(?!${DOT_LITERAL})`;
      var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
      var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
      var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
      var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
      var STAR = `${QMARK}*?`;
      var SEP = "/";
      var POSIX_CHARS = {
        DOT_LITERAL,
        PLUS_LITERAL,
        QMARK_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        QMARK,
        END_ANCHOR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR,
        SEP
      };
      var WINDOWS_CHARS = {
        ...POSIX_CHARS,
        SLASH_LITERAL: `[${WIN_SLASH}]`,
        QMARK: WIN_NO_SLASH,
        STAR: `${WIN_NO_SLASH}*?`,
        DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
        NO_DOT: `(?!${DOT_LITERAL})`,
        NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
        NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
        NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
        QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
        START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
        END_ANCHOR: `(?:[${WIN_SLASH}]|$)`,
        SEP: "\\"
      };
      var POSIX_REGEX_SOURCE = {
        alnum: "a-zA-Z0-9",
        alpha: "a-zA-Z",
        ascii: "\\x00-\\x7F",
        blank: " \\t",
        cntrl: "\\x00-\\x1F\\x7F",
        digit: "0-9",
        graph: "\\x21-\\x7E",
        lower: "a-z",
        print: "\\x20-\\x7E ",
        punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
        space: " \\t\\r\\n\\v\\f",
        upper: "A-Z",
        word: "A-Za-z0-9_",
        xdigit: "A-Fa-f0-9"
      };
      module.exports = {
        MAX_LENGTH: 1024 * 64,
        POSIX_REGEX_SOURCE,
        // regular expressions
        REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
        REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
        REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
        REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
        REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
        REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
        // Replace globs with equivalent patterns to reduce parsing time.
        REPLACEMENTS: {
          "***": "*",
          "**/**": "**",
          "**/**/**": "**"
        },
        // Digits
        CHAR_0: 48,
        /* 0 */
        CHAR_9: 57,
        /* 9 */
        // Alphabet chars.
        CHAR_UPPERCASE_A: 65,
        /* A */
        CHAR_LOWERCASE_A: 97,
        /* a */
        CHAR_UPPERCASE_Z: 90,
        /* Z */
        CHAR_LOWERCASE_Z: 122,
        /* z */
        CHAR_LEFT_PARENTHESES: 40,
        /* ( */
        CHAR_RIGHT_PARENTHESES: 41,
        /* ) */
        CHAR_ASTERISK: 42,
        /* * */
        // Non-alphabetic chars.
        CHAR_AMPERSAND: 38,
        /* & */
        CHAR_AT: 64,
        /* @ */
        CHAR_BACKWARD_SLASH: 92,
        /* \ */
        CHAR_CARRIAGE_RETURN: 13,
        /* \r */
        CHAR_CIRCUMFLEX_ACCENT: 94,
        /* ^ */
        CHAR_COLON: 58,
        /* : */
        CHAR_COMMA: 44,
        /* , */
        CHAR_DOT: 46,
        /* . */
        CHAR_DOUBLE_QUOTE: 34,
        /* " */
        CHAR_EQUAL: 61,
        /* = */
        CHAR_EXCLAMATION_MARK: 33,
        /* ! */
        CHAR_FORM_FEED: 12,
        /* \f */
        CHAR_FORWARD_SLASH: 47,
        /* / */
        CHAR_GRAVE_ACCENT: 96,
        /* ` */
        CHAR_HASH: 35,
        /* # */
        CHAR_HYPHEN_MINUS: 45,
        /* - */
        CHAR_LEFT_ANGLE_BRACKET: 60,
        /* < */
        CHAR_LEFT_CURLY_BRACE: 123,
        /* { */
        CHAR_LEFT_SQUARE_BRACKET: 91,
        /* [ */
        CHAR_LINE_FEED: 10,
        /* \n */
        CHAR_NO_BREAK_SPACE: 160,
        /* \u00A0 */
        CHAR_PERCENT: 37,
        /* % */
        CHAR_PLUS: 43,
        /* + */
        CHAR_QUESTION_MARK: 63,
        /* ? */
        CHAR_RIGHT_ANGLE_BRACKET: 62,
        /* > */
        CHAR_RIGHT_CURLY_BRACE: 125,
        /* } */
        CHAR_RIGHT_SQUARE_BRACKET: 93,
        /* ] */
        CHAR_SEMICOLON: 59,
        /* ; */
        CHAR_SINGLE_QUOTE: 39,
        /* ' */
        CHAR_SPACE: 32,
        /*   */
        CHAR_TAB: 9,
        /* \t */
        CHAR_UNDERSCORE: 95,
        /* _ */
        CHAR_VERTICAL_LINE: 124,
        /* | */
        CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
        /* \uFEFF */
        /**
         * Create EXTGLOB_CHARS
         */
        extglobChars(chars) {
          return {
            "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
            "?": { type: "qmark", open: "(?:", close: ")?" },
            "+": { type: "plus", open: "(?:", close: ")+" },
            "*": { type: "star", open: "(?:", close: ")*" },
            "@": { type: "at", open: "(?:", close: ")" }
          };
        },
        /**
         * Create GLOB_CHARS
         */
        globChars(win32) {
          return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
        }
      };
    }
  });

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/utils.js
  var require_utils = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/utils.js"(exports) {
      "use strict";
      var {
        REGEX_BACKSLASH,
        REGEX_REMOVE_BACKSLASH,
        REGEX_SPECIAL_CHARS,
        REGEX_SPECIAL_CHARS_GLOBAL
      } = require_constants();
      exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
      exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
      exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
      exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
      exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
      exports.isWindows = () => {
        if (typeof navigator !== "undefined" && navigator.platform) {
          const platform = navigator.platform.toLowerCase();
          return platform === "win32" || platform === "windows";
        }
        if (typeof process !== "undefined" && process.platform) {
          return process.platform === "win32";
        }
        return false;
      };
      exports.removeBackslashes = (str) => {
        return str.replace(REGEX_REMOVE_BACKSLASH, (match) => {
          return match === "\\" ? "" : match;
        });
      };
      exports.escapeLast = (input, char, lastIdx) => {
        const idx = input.lastIndexOf(char, lastIdx);
        if (idx === -1) return input;
        if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
        return `${input.slice(0, idx)}\\${input.slice(idx)}`;
      };
      exports.removePrefix = (input, state = {}) => {
        let output = input;
        if (output.startsWith("./")) {
          output = output.slice(2);
          state.prefix = "./";
        }
        return output;
      };
      exports.wrapOutput = (input, state = {}, options = {}) => {
        const prepend = options.contains ? "" : "^";
        const append = options.contains ? "" : "$";
        let output = `${prepend}(?:${input})${append}`;
        if (state.negated === true) {
          output = `(?:^(?!${output}).*$)`;
        }
        return output;
      };
      exports.basename = (path, { windows } = {}) => {
        const segs = path.split(windows ? /[\\/]/ : "/");
        const last = segs[segs.length - 1];
        if (last === "") {
          return segs[segs.length - 2];
        }
        return last;
      };
    }
  });

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/scan.js
  var require_scan = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/scan.js"(exports, module) {
      "use strict";
      var utils = require_utils();
      var {
        CHAR_ASTERISK,
        /* * */
        CHAR_AT,
        /* @ */
        CHAR_BACKWARD_SLASH,
        /* \ */
        CHAR_COMMA,
        /* , */
        CHAR_DOT,
        /* . */
        CHAR_EXCLAMATION_MARK,
        /* ! */
        CHAR_FORWARD_SLASH,
        /* / */
        CHAR_LEFT_CURLY_BRACE,
        /* { */
        CHAR_LEFT_PARENTHESES,
        /* ( */
        CHAR_LEFT_SQUARE_BRACKET,
        /* [ */
        CHAR_PLUS,
        /* + */
        CHAR_QUESTION_MARK,
        /* ? */
        CHAR_RIGHT_CURLY_BRACE,
        /* } */
        CHAR_RIGHT_PARENTHESES,
        /* ) */
        CHAR_RIGHT_SQUARE_BRACKET
        /* ] */
      } = require_constants();
      var isPathSeparator = (code) => {
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
      };
      var depth = (token) => {
        if (token.isPrefix !== true) {
          token.depth = token.isGlobstar ? Infinity : 1;
        }
      };
      var scan = (input, options) => {
        const opts = options || {};
        const length = input.length - 1;
        const scanToEnd = opts.parts === true || opts.scanToEnd === true;
        const slashes = [];
        const tokens = [];
        const parts = [];
        let str = input;
        let index = -1;
        let start = 0;
        let lastIndex = 0;
        let isBrace = false;
        let isBracket = false;
        let isGlob = false;
        let isExtglob = false;
        let isGlobstar = false;
        let braceEscaped = false;
        let backslashes = false;
        let negated = false;
        let negatedExtglob = false;
        let finished = false;
        let braces = 0;
        let prev;
        let code;
        let token = { value: "", depth: 0, isGlob: false };
        const eos = () => index >= length;
        const peek = () => str.charCodeAt(index + 1);
        const advance = () => {
          prev = code;
          return str.charCodeAt(++index);
        };
        while (index < length) {
          code = advance();
          let next;
          if (code === CHAR_BACKWARD_SLASH) {
            backslashes = token.backslashes = true;
            code = advance();
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braceEscaped = true;
            }
            continue;
          }
          if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
            braces++;
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_BACKWARD_SLASH) {
                backslashes = token.backslashes = true;
                advance();
                continue;
              }
              if (code === CHAR_LEFT_CURLY_BRACE) {
                braces++;
                continue;
              }
              if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
                isBrace = token.isBrace = true;
                isGlob = token.isGlob = true;
                finished = true;
                if (scanToEnd === true) {
                  continue;
                }
                break;
              }
              if (braceEscaped !== true && code === CHAR_COMMA) {
                isBrace = token.isBrace = true;
                isGlob = token.isGlob = true;
                finished = true;
                if (scanToEnd === true) {
                  continue;
                }
                break;
              }
              if (code === CHAR_RIGHT_CURLY_BRACE) {
                braces--;
                if (braces === 0) {
                  braceEscaped = false;
                  isBrace = token.isBrace = true;
                  finished = true;
                  break;
                }
              }
            }
            if (scanToEnd === true) {
              continue;
            }
            break;
          }
          if (code === CHAR_FORWARD_SLASH) {
            slashes.push(index);
            tokens.push(token);
            token = { value: "", depth: 0, isGlob: false };
            if (finished === true) continue;
            if (prev === CHAR_DOT && index === start + 1) {
              start += 2;
              continue;
            }
            lastIndex = index + 1;
            continue;
          }
          if (opts.noext !== true) {
            const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
            if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
              isGlob = token.isGlob = true;
              isExtglob = token.isExtglob = true;
              finished = true;
              if (code === CHAR_EXCLAMATION_MARK && index === start) {
                negatedExtglob = true;
              }
              if (scanToEnd === true) {
                while (eos() !== true && (code = advance())) {
                  if (code === CHAR_BACKWARD_SLASH) {
                    backslashes = token.backslashes = true;
                    code = advance();
                    continue;
                  }
                  if (code === CHAR_RIGHT_PARENTHESES) {
                    isGlob = token.isGlob = true;
                    finished = true;
                    break;
                  }
                }
                continue;
              }
              break;
            }
          }
          if (code === CHAR_ASTERISK) {
            if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
            isGlob = token.isGlob = true;
            finished = true;
            if (scanToEnd === true) {
              continue;
            }
            break;
          }
          if (code === CHAR_QUESTION_MARK) {
            isGlob = token.isGlob = true;
            finished = true;
            if (scanToEnd === true) {
              continue;
            }
            break;
          }
          if (code === CHAR_LEFT_SQUARE_BRACKET) {
            while (eos() !== true && (next = advance())) {
              if (next === CHAR_BACKWARD_SLASH) {
                backslashes = token.backslashes = true;
                advance();
                continue;
              }
              if (next === CHAR_RIGHT_SQUARE_BRACKET) {
                isBracket = token.isBracket = true;
                isGlob = token.isGlob = true;
                finished = true;
                break;
              }
            }
            if (scanToEnd === true) {
              continue;
            }
            break;
          }
          if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
            negated = token.negated = true;
            start++;
            continue;
          }
          if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
            isGlob = token.isGlob = true;
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_LEFT_PARENTHESES) {
                  backslashes = token.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
          if (isGlob === true) {
            finished = true;
            if (scanToEnd === true) {
              continue;
            }
            break;
          }
        }
        if (opts.noext === true) {
          isExtglob = false;
          isGlob = false;
        }
        let base = str;
        let prefix = "";
        let glob = "";
        if (start > 0) {
          prefix = str.slice(0, start);
          str = str.slice(start);
          lastIndex -= start;
        }
        if (base && isGlob === true && lastIndex > 0) {
          base = str.slice(0, lastIndex);
          glob = str.slice(lastIndex);
        } else if (isGlob === true) {
          base = "";
          glob = str;
        } else {
          base = str;
        }
        if (base && base !== "" && base !== "/" && base !== str) {
          if (isPathSeparator(base.charCodeAt(base.length - 1))) {
            base = base.slice(0, -1);
          }
        }
        if (opts.unescape === true) {
          if (glob) glob = utils.removeBackslashes(glob);
          if (base && backslashes === true) {
            base = utils.removeBackslashes(base);
          }
        }
        const state = {
          prefix,
          input,
          start,
          base,
          glob,
          isBrace,
          isBracket,
          isGlob,
          isExtglob,
          isGlobstar,
          negated,
          negatedExtglob
        };
        if (opts.tokens === true) {
          state.maxDepth = 0;
          if (!isPathSeparator(code)) {
            tokens.push(token);
          }
          state.tokens = tokens;
        }
        if (opts.parts === true || opts.tokens === true) {
          let prevIndex;
          for (let idx = 0; idx < slashes.length; idx++) {
            const n = prevIndex ? prevIndex + 1 : start;
            const i = slashes[idx];
            const value = input.slice(n, i);
            if (opts.tokens) {
              if (idx === 0 && start !== 0) {
                tokens[idx].isPrefix = true;
                tokens[idx].value = prefix;
              } else {
                tokens[idx].value = value;
              }
              depth(tokens[idx]);
              state.maxDepth += tokens[idx].depth;
            }
            if (idx !== 0 || value !== "") {
              parts.push(value);
            }
            prevIndex = i;
          }
          if (prevIndex && prevIndex + 1 < input.length) {
            const value = input.slice(prevIndex + 1);
            parts.push(value);
            if (opts.tokens) {
              tokens[tokens.length - 1].value = value;
              depth(tokens[tokens.length - 1]);
              state.maxDepth += tokens[tokens.length - 1].depth;
            }
          }
          state.slashes = slashes;
          state.parts = parts;
        }
        return state;
      };
      module.exports = scan;
    }
  });

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/parse.js
  var require_parse = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/parse.js"(exports, module) {
      "use strict";
      var constants = require_constants();
      var utils = require_utils();
      var {
        MAX_LENGTH,
        POSIX_REGEX_SOURCE,
        REGEX_NON_SPECIAL_CHARS,
        REGEX_SPECIAL_CHARS_BACKREF,
        REPLACEMENTS
      } = constants;
      var expandRange = (args, options) => {
        if (typeof options.expandRange === "function") {
          return options.expandRange(...args, options);
        }
        args.sort();
        const value = `[${args.join("-")}]`;
        try {
          new RegExp(value);
        } catch (ex) {
          return args.map((v) => utils.escapeRegex(v)).join("..");
        }
        return value;
      };
      var syntaxError = (type, char) => {
        return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
      };
      var parse = (input, options) => {
        if (typeof input !== "string") {
          throw new TypeError("Expected a string");
        }
        input = REPLACEMENTS[input] || input;
        const opts = { ...options };
        const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
        let len = input.length;
        if (len > max) {
          throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
        }
        const bos = { type: "bos", value: "", output: opts.prepend || "" };
        const tokens = [bos];
        const capture = opts.capture ? "" : "?:";
        const PLATFORM_CHARS = constants.globChars(opts.windows);
        const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
        const {
          DOT_LITERAL,
          PLUS_LITERAL,
          SLASH_LITERAL,
          ONE_CHAR,
          DOTS_SLASH,
          NO_DOT,
          NO_DOT_SLASH,
          NO_DOTS_SLASH,
          QMARK,
          QMARK_NO_DOT,
          STAR,
          START_ANCHOR
        } = PLATFORM_CHARS;
        const globstar = (opts2) => {
          return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
        };
        const nodot = opts.dot ? "" : NO_DOT;
        const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
        let star = opts.bash === true ? globstar(opts) : STAR;
        if (opts.capture) {
          star = `(${star})`;
        }
        if (typeof opts.noext === "boolean") {
          opts.noextglob = opts.noext;
        }
        const state = {
          input,
          index: -1,
          start: 0,
          dot: opts.dot === true,
          consumed: "",
          output: "",
          prefix: "",
          backtrack: false,
          negated: false,
          brackets: 0,
          braces: 0,
          parens: 0,
          quotes: 0,
          globstar: false,
          tokens
        };
        input = utils.removePrefix(input, state);
        len = input.length;
        const extglobs = [];
        const braces = [];
        const stack = [];
        let prev = bos;
        let value;
        const eos = () => state.index === len - 1;
        const peek = state.peek = (n = 1) => input[state.index + n];
        const advance = state.advance = () => input[++state.index] || "";
        const remaining = () => input.slice(state.index + 1);
        const consume = (value2 = "", num = 0) => {
          state.consumed += value2;
          state.index += num;
        };
        const append = (token) => {
          state.output += token.output != null ? token.output : token.value;
          consume(token.value);
        };
        const negate = () => {
          let count = 1;
          while (peek() === "!" && (peek(2) !== "(" || peek(3) === "?")) {
            advance();
            state.start++;
            count++;
          }
          if (count % 2 === 0) {
            return false;
          }
          state.negated = true;
          state.start++;
          return true;
        };
        const increment = (type) => {
          state[type]++;
          stack.push(type);
        };
        const decrement = (type) => {
          state[type]--;
          stack.pop();
        };
        const push = (tok) => {
          if (prev.type === "globstar") {
            const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
            const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
            if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
              state.output = state.output.slice(0, -prev.output.length);
              prev.type = "star";
              prev.value = "*";
              prev.output = star;
              state.output += prev.output;
            }
          }
          if (extglobs.length && tok.type !== "paren") {
            extglobs[extglobs.length - 1].inner += tok.value;
          }
          if (tok.value || tok.output) append(tok);
          if (prev && prev.type === "text" && tok.type === "text") {
            prev.output = (prev.output || prev.value) + tok.value;
            prev.value += tok.value;
            return;
          }
          tok.prev = prev;
          tokens.push(tok);
          prev = tok;
        };
        const extglobOpen = (type, value2) => {
          const token = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
          token.prev = prev;
          token.parens = state.parens;
          token.output = state.output;
          const output = (opts.capture ? "(" : "") + token.open;
          increment("parens");
          push({ type, value: value2, output: state.output ? "" : ONE_CHAR });
          push({ type: "paren", extglob: true, value: advance(), output });
          extglobs.push(token);
        };
        const extglobClose = (token) => {
          let output = token.close + (opts.capture ? ")" : "");
          let rest;
          if (token.type === "negate") {
            let extglobStar = star;
            if (token.inner && token.inner.length > 1 && token.inner.includes("/")) {
              extglobStar = globstar(opts);
            }
            if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
              output = token.close = `)$))${extglobStar}`;
            }
            if (token.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
              const expression = parse(rest, { ...options, fastpaths: false }).output;
              output = token.close = `)${expression})${extglobStar})`;
            }
            if (token.prev.type === "bos") {
              state.negatedExtglob = true;
            }
          }
          push({ type: "paren", extglob: true, value, output });
          decrement("parens");
        };
        if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
          let backslashes = false;
          let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
            if (first === "\\") {
              backslashes = true;
              return m;
            }
            if (first === "?") {
              if (esc) {
                return esc + first + (rest ? QMARK.repeat(rest.length) : "");
              }
              if (index === 0) {
                return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
              }
              return QMARK.repeat(chars.length);
            }
            if (first === ".") {
              return DOT_LITERAL.repeat(chars.length);
            }
            if (first === "*") {
              if (esc) {
                return esc + first + (rest ? star : "");
              }
              return star;
            }
            return esc ? m : `\\${m}`;
          });
          if (backslashes === true) {
            if (opts.unescape === true) {
              output = output.replace(/\\/g, "");
            } else {
              output = output.replace(/\\+/g, (m) => {
                return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
              });
            }
          }
          if (output === input && opts.contains === true) {
            state.output = input;
            return state;
          }
          state.output = utils.wrapOutput(output, state, options);
          return state;
        }
        while (!eos()) {
          value = advance();
          if (value === "\0") {
            continue;
          }
          if (value === "\\") {
            const next = peek();
            if (next === "/" && opts.bash !== true) {
              continue;
            }
            if (next === "." || next === ";") {
              continue;
            }
            if (!next) {
              value += "\\";
              push({ type: "text", value });
              continue;
            }
            const match = /^\\+/.exec(remaining());
            let slashes = 0;
            if (match && match[0].length > 2) {
              slashes = match[0].length;
              state.index += slashes;
              if (slashes % 2 !== 0) {
                value += "\\";
              }
            }
            if (opts.unescape === true) {
              value = advance();
            } else {
              value += advance();
            }
            if (state.brackets === 0) {
              push({ type: "text", value });
              continue;
            }
          }
          if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
            if (opts.posix !== false && value === ":") {
              const inner = prev.value.slice(1);
              if (inner.includes("[")) {
                prev.posix = true;
                if (inner.includes(":")) {
                  const idx = prev.value.lastIndexOf("[");
                  const pre = prev.value.slice(0, idx);
                  const rest2 = prev.value.slice(idx + 2);
                  const posix = POSIX_REGEX_SOURCE[rest2];
                  if (posix) {
                    prev.value = pre + posix;
                    state.backtrack = true;
                    advance();
                    if (!bos.output && tokens.indexOf(prev) === 1) {
                      bos.output = ONE_CHAR;
                    }
                    continue;
                  }
                }
              }
            }
            if (value === "[" && peek() !== ":" || value === "-" && peek() === "]") {
              value = `\\${value}`;
            }
            if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
              value = `\\${value}`;
            }
            if (opts.posix === true && value === "!" && prev.value === "[") {
              value = "^";
            }
            prev.value += value;
            append({ value });
            continue;
          }
          if (state.quotes === 1 && value !== '"') {
            value = utils.escapeRegex(value);
            prev.value += value;
            append({ value });
            continue;
          }
          if (value === '"') {
            state.quotes = state.quotes === 1 ? 0 : 1;
            if (opts.keepQuotes === true) {
              push({ type: "text", value });
            }
            continue;
          }
          if (value === "(") {
            increment("parens");
            push({ type: "paren", value });
            continue;
          }
          if (value === ")") {
            if (state.parens === 0 && opts.strictBrackets === true) {
              throw new SyntaxError(syntaxError("opening", "("));
            }
            const extglob = extglobs[extglobs.length - 1];
            if (extglob && state.parens === extglob.parens + 1) {
              extglobClose(extglobs.pop());
              continue;
            }
            push({ type: "paren", value, output: state.parens ? ")" : "\\)" });
            decrement("parens");
            continue;
          }
          if (value === "[") {
            if (opts.nobracket === true || !remaining().includes("]")) {
              if (opts.nobracket !== true && opts.strictBrackets === true) {
                throw new SyntaxError(syntaxError("closing", "]"));
              }
              value = `\\${value}`;
            } else {
              increment("brackets");
            }
            push({ type: "bracket", value });
            continue;
          }
          if (value === "]") {
            if (opts.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
              push({ type: "text", value, output: `\\${value}` });
              continue;
            }
            if (state.brackets === 0) {
              if (opts.strictBrackets === true) {
                throw new SyntaxError(syntaxError("opening", "["));
              }
              push({ type: "text", value, output: `\\${value}` });
              continue;
            }
            decrement("brackets");
            const prevValue = prev.value.slice(1);
            if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
              value = `/${value}`;
            }
            prev.value += value;
            append({ value });
            if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
              continue;
            }
            const escaped = utils.escapeRegex(prev.value);
            state.output = state.output.slice(0, -prev.value.length);
            if (opts.literalBrackets === true) {
              state.output += escaped;
              prev.value = escaped;
              continue;
            }
            prev.value = `(${capture}${escaped}|${prev.value})`;
            state.output += prev.value;
            continue;
          }
          if (value === "{" && opts.nobrace !== true) {
            increment("braces");
            const open = {
              type: "brace",
              value,
              output: "(",
              outputIndex: state.output.length,
              tokensIndex: state.tokens.length
            };
            braces.push(open);
            push(open);
            continue;
          }
          if (value === "}") {
            const brace = braces[braces.length - 1];
            if (opts.nobrace === true || !brace) {
              push({ type: "text", value, output: value });
              continue;
            }
            let output = ")";
            if (brace.dots === true) {
              const arr = tokens.slice();
              const range = [];
              for (let i = arr.length - 1; i >= 0; i--) {
                tokens.pop();
                if (arr[i].type === "brace") {
                  break;
                }
                if (arr[i].type !== "dots") {
                  range.unshift(arr[i].value);
                }
              }
              output = expandRange(range, opts);
              state.backtrack = true;
            }
            if (brace.comma !== true && brace.dots !== true) {
              const out = state.output.slice(0, brace.outputIndex);
              const toks = state.tokens.slice(brace.tokensIndex);
              brace.value = brace.output = "\\{";
              value = output = "\\}";
              state.output = out;
              for (const t of toks) {
                state.output += t.output || t.value;
              }
            }
            push({ type: "brace", value, output });
            decrement("braces");
            braces.pop();
            continue;
          }
          if (value === "|") {
            if (extglobs.length > 0) {
              extglobs[extglobs.length - 1].conditions++;
            }
            push({ type: "text", value });
            continue;
          }
          if (value === ",") {
            let output = value;
            const brace = braces[braces.length - 1];
            if (brace && stack[stack.length - 1] === "braces") {
              brace.comma = true;
              output = "|";
            }
            push({ type: "comma", value, output });
            continue;
          }
          if (value === "/") {
            if (prev.type === "dot" && state.index === state.start + 1) {
              state.start = state.index + 1;
              state.consumed = "";
              state.output = "";
              tokens.pop();
              prev = bos;
              continue;
            }
            push({ type: "slash", value, output: SLASH_LITERAL });
            continue;
          }
          if (value === ".") {
            if (state.braces > 0 && prev.type === "dot") {
              if (prev.value === ".") prev.output = DOT_LITERAL;
              const brace = braces[braces.length - 1];
              prev.type = "dots";
              prev.output += value;
              prev.value += value;
              brace.dots = true;
              continue;
            }
            if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
              push({ type: "text", value, output: DOT_LITERAL });
              continue;
            }
            push({ type: "dot", value, output: DOT_LITERAL });
            continue;
          }
          if (value === "?") {
            const isGroup = prev && prev.value === "(";
            if (!isGroup && opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
              extglobOpen("qmark", value);
              continue;
            }
            if (prev && prev.type === "paren") {
              const next = peek();
              let output = value;
              if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
                output = `\\${value}`;
              }
              push({ type: "text", value, output });
              continue;
            }
            if (opts.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
              push({ type: "qmark", value, output: QMARK_NO_DOT });
              continue;
            }
            push({ type: "qmark", value, output: QMARK });
            continue;
          }
          if (value === "!") {
            if (opts.noextglob !== true && peek() === "(") {
              if (peek(2) !== "?" || !/[!=<:]/.test(peek(3))) {
                extglobOpen("negate", value);
                continue;
              }
            }
            if (opts.nonegate !== true && state.index === 0) {
              negate();
              continue;
            }
          }
          if (value === "+") {
            if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
              extglobOpen("plus", value);
              continue;
            }
            if (prev && prev.value === "(" || opts.regex === false) {
              push({ type: "plus", value, output: PLUS_LITERAL });
              continue;
            }
            if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
              push({ type: "plus", value });
              continue;
            }
            push({ type: "plus", value: PLUS_LITERAL });
            continue;
          }
          if (value === "@") {
            if (opts.noextglob !== true && peek() === "(" && peek(2) !== "?") {
              push({ type: "at", extglob: true, value, output: "" });
              continue;
            }
            push({ type: "text", value });
            continue;
          }
          if (value !== "*") {
            if (value === "$" || value === "^") {
              value = `\\${value}`;
            }
            const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
            if (match) {
              value += match[0];
              state.index += match[0].length;
            }
            push({ type: "text", value });
            continue;
          }
          if (prev && (prev.type === "globstar" || prev.star === true)) {
            prev.type = "star";
            prev.star = true;
            prev.value += value;
            prev.output = star;
            state.backtrack = true;
            state.globstar = true;
            consume(value);
            continue;
          }
          let rest = remaining();
          if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
            extglobOpen("star", value);
            continue;
          }
          if (prev.type === "star") {
            if (opts.noglobstar === true) {
              consume(value);
              continue;
            }
            const prior = prev.prev;
            const before = prior.prev;
            const isStart = prior.type === "slash" || prior.type === "bos";
            const afterStar = before && (before.type === "star" || before.type === "globstar");
            if (opts.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
              push({ type: "star", value, output: "" });
              continue;
            }
            const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
            const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
            if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
              push({ type: "star", value, output: "" });
              continue;
            }
            while (rest.slice(0, 3) === "/**") {
              const after = input[state.index + 4];
              if (after && after !== "/") {
                break;
              }
              rest = rest.slice(3);
              consume("/**", 3);
            }
            if (prior.type === "bos" && eos()) {
              prev.type = "globstar";
              prev.value += value;
              prev.output = globstar(opts);
              state.output = prev.output;
              state.globstar = true;
              consume(value);
              continue;
            }
            if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
              state.output = state.output.slice(0, -(prior.output + prev.output).length);
              prior.output = `(?:${prior.output}`;
              prev.type = "globstar";
              prev.output = globstar(opts) + (opts.strictSlashes ? ")" : "|$)");
              prev.value += value;
              state.globstar = true;
              state.output += prior.output + prev.output;
              consume(value);
              continue;
            }
            if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
              const end = rest[1] !== void 0 ? "|$" : "";
              state.output = state.output.slice(0, -(prior.output + prev.output).length);
              prior.output = `(?:${prior.output}`;
              prev.type = "globstar";
              prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
              prev.value += value;
              state.output += prior.output + prev.output;
              state.globstar = true;
              consume(value + advance());
              push({ type: "slash", value: "/", output: "" });
              continue;
            }
            if (prior.type === "bos" && rest[0] === "/") {
              prev.type = "globstar";
              prev.value += value;
              prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
              state.output = prev.output;
              state.globstar = true;
              consume(value + advance());
              push({ type: "slash", value: "/", output: "" });
              continue;
            }
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "globstar";
            prev.output = globstar(opts);
            prev.value += value;
            state.output += prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          const token = { type: "star", value, output: star };
          if (opts.bash === true) {
            token.output = ".*?";
            if (prev.type === "bos" || prev.type === "slash") {
              token.output = nodot + token.output;
            }
            push(token);
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren") && opts.regex === true) {
            token.output = value;
            push(token);
            continue;
          }
          if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
            if (prev.type === "dot") {
              state.output += NO_DOT_SLASH;
              prev.output += NO_DOT_SLASH;
            } else if (opts.dot === true) {
              state.output += NO_DOTS_SLASH;
              prev.output += NO_DOTS_SLASH;
            } else {
              state.output += nodot;
              prev.output += nodot;
            }
            if (peek() !== "*") {
              state.output += ONE_CHAR;
              prev.output += ONE_CHAR;
            }
          }
          push(token);
        }
        while (state.brackets > 0) {
          if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "]"));
          state.output = utils.escapeLast(state.output, "[");
          decrement("brackets");
        }
        while (state.parens > 0) {
          if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", ")"));
          state.output = utils.escapeLast(state.output, "(");
          decrement("parens");
        }
        while (state.braces > 0) {
          if (opts.strictBrackets === true) throw new SyntaxError(syntaxError("closing", "}"));
          state.output = utils.escapeLast(state.output, "{");
          decrement("braces");
        }
        if (opts.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
          push({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
        }
        if (state.backtrack === true) {
          state.output = "";
          for (const token of state.tokens) {
            state.output += token.output != null ? token.output : token.value;
            if (token.suffix) {
              state.output += token.suffix;
            }
          }
        }
        return state;
      };
      parse.fastpaths = (input, options) => {
        const opts = { ...options };
        const max = typeof opts.maxLength === "number" ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
        const len = input.length;
        if (len > max) {
          throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
        }
        input = REPLACEMENTS[input] || input;
        const {
          DOT_LITERAL,
          SLASH_LITERAL,
          ONE_CHAR,
          DOTS_SLASH,
          NO_DOT,
          NO_DOTS,
          NO_DOTS_SLASH,
          STAR,
          START_ANCHOR
        } = constants.globChars(opts.windows);
        const nodot = opts.dot ? NO_DOTS : NO_DOT;
        const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
        const capture = opts.capture ? "" : "?:";
        const state = { negated: false, prefix: "" };
        let star = opts.bash === true ? ".*?" : STAR;
        if (opts.capture) {
          star = `(${star})`;
        }
        const globstar = (opts2) => {
          if (opts2.noglobstar === true) return star;
          return `(${capture}(?:(?!${START_ANCHOR}${opts2.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
        };
        const create = (str) => {
          switch (str) {
            case "*":
              return `${nodot}${ONE_CHAR}${star}`;
            case ".*":
              return `${DOT_LITERAL}${ONE_CHAR}${star}`;
            case "*.*":
              return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
            case "*/*":
              return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;
            case "**":
              return nodot + globstar(opts);
            case "**/*":
              return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;
            case "**/*.*":
              return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;
            case "**/.*":
              return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;
            default: {
              const match = /^(.*?)\.(\w+)$/.exec(str);
              if (!match) return;
              const source2 = create(match[1]);
              if (!source2) return;
              return source2 + DOT_LITERAL + match[2];
            }
          }
        };
        const output = utils.removePrefix(input, state);
        let source = create(output);
        if (source && opts.strictSlashes !== true) {
          source += `${SLASH_LITERAL}?`;
        }
        return source;
      };
      module.exports = parse;
    }
  });

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/picomatch.js
  var require_picomatch = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/lib/picomatch.js"(exports, module) {
      "use strict";
      var scan = require_scan();
      var parse = require_parse();
      var utils = require_utils();
      var constants = require_constants();
      var isObject = (val) => val && typeof val === "object" && !Array.isArray(val);
      var picomatch = (glob, options, returnState = false) => {
        if (Array.isArray(glob)) {
          const fns = glob.map((input) => picomatch(input, options, returnState));
          const arrayMatcher = (str) => {
            for (const isMatch2 of fns) {
              const state2 = isMatch2(str);
              if (state2) return state2;
            }
            return false;
          };
          return arrayMatcher;
        }
        const isState = isObject(glob) && glob.tokens && glob.input;
        if (glob === "" || typeof glob !== "string" && !isState) {
          throw new TypeError("Expected pattern to be a non-empty string");
        }
        const opts = options || {};
        const posix = opts.windows;
        const regex = isState ? picomatch.compileRe(glob, options) : picomatch.makeRe(glob, options, false, true);
        const state = regex.state;
        delete regex.state;
        let isIgnored = () => false;
        if (opts.ignore) {
          const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
          isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
        }
        const matcher = (input, returnObject = false) => {
          const { isMatch: isMatch2, match, output } = picomatch.test(input, regex, options, { glob, posix });
          const result = { glob, state, regex, posix, input, output, match, isMatch: isMatch2 };
          if (typeof opts.onResult === "function") {
            opts.onResult(result);
          }
          if (isMatch2 === false) {
            result.isMatch = false;
            return returnObject ? result : false;
          }
          if (isIgnored(input)) {
            if (typeof opts.onIgnore === "function") {
              opts.onIgnore(result);
            }
            result.isMatch = false;
            return returnObject ? result : false;
          }
          if (typeof opts.onMatch === "function") {
            opts.onMatch(result);
          }
          return returnObject ? result : true;
        };
        if (returnState) {
          matcher.state = state;
        }
        return matcher;
      };
      picomatch.test = (input, regex, options, { glob, posix } = {}) => {
        if (typeof input !== "string") {
          throw new TypeError("Expected input to be a string");
        }
        if (input === "") {
          return { isMatch: false, output: "" };
        }
        const opts = options || {};
        const format = opts.format || (posix ? utils.toPosixSlashes : null);
        let match = input === glob;
        let output = match && format ? format(input) : input;
        if (match === false) {
          output = format ? format(input) : input;
          match = output === glob;
        }
        if (match === false || opts.capture === true) {
          if (opts.matchBase === true || opts.basename === true) {
            match = picomatch.matchBase(input, regex, options, posix);
          } else {
            match = regex.exec(output);
          }
        }
        return { isMatch: Boolean(match), match, output };
      };
      picomatch.matchBase = (input, glob, options) => {
        const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
        return regex.test(utils.basename(input));
      };
      picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);
      picomatch.parse = (pattern, options) => {
        if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options));
        return parse(pattern, { ...options, fastpaths: false });
      };
      picomatch.scan = (input, options) => scan(input, options);
      picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
        if (returnOutput === true) {
          return state.output;
        }
        const opts = options || {};
        const prepend = opts.contains ? "" : "^";
        const append = opts.contains ? "" : "$";
        let source = `${prepend}(?:${state.output})${append}`;
        if (state && state.negated === true) {
          source = `^(?!${source}).*$`;
        }
        const regex = picomatch.toRegex(source, options);
        if (returnState === true) {
          regex.state = state;
        }
        return regex;
      };
      picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
        if (!input || typeof input !== "string") {
          throw new TypeError("Expected a non-empty string");
        }
        let parsed = { negated: false, fastpaths: true };
        if (options.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
          parsed.output = parse.fastpaths(input, options);
        }
        if (!parsed.output) {
          parsed = parse(input, options);
        }
        return picomatch.compileRe(parsed, options, returnOutput, returnState);
      };
      picomatch.toRegex = (source, options) => {
        try {
          const opts = options || {};
          return new RegExp(source, opts.flags || (opts.nocase ? "i" : ""));
        } catch (err) {
          if (options && options.debug === true) throw err;
          return /$^/;
        }
      };
      picomatch.constants = constants;
      module.exports = picomatch;
    }
  });

  // ../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/index.js
  var require_picomatch2 = __commonJS({
    "../../.yarn/berry/cache/picomatch-npm-4.0.2-e93516ddf2-10c0.zip/node_modules/picomatch/index.js"(exports, module) {
      "use strict";
      var pico = require_picomatch();
      var utils = require_utils();
      function picomatch(glob, options, returnState = false) {
        if (options && (options.windows === null || options.windows === void 0)) {
          options = { ...options, windows: utils.isWindows() };
        }
        return pico(glob, options, returnState);
      }
      Object.assign(picomatch, pico);
      module.exports = picomatch;
    }
  });

  // sources/index.ts
  var sources_exports = {};
  __export(sources_exports, {
    default: () => sources_default
  });
  var import_core4 = __require("@yarnpkg/core");

  // ../../.yarn/berry/cache/chalk-npm-5.4.1-2f3fe4660a-10c0.zip/node_modules/chalk/source/vendor/ansi-styles/index.js
  var ANSI_BACKGROUND_OFFSET = 10;
  var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
  var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
  var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
  var styles = {
    modifier: {
      reset: [0, 0],
      // 21 isn't widely supported and 22 does the same thing
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      // Bright color
      blackBright: [90, 39],
      gray: [90, 39],
      // Alias of `blackBright`
      grey: [90, 39],
      // Alias of `blackBright`
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      // Bright color
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      // Alias of `bgBlackBright`
      bgGrey: [100, 49],
      // Alias of `bgBlackBright`
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  };
  var modifierNames = Object.keys(styles.modifier);
  var foregroundColorNames = Object.keys(styles.color);
  var backgroundColorNames = Object.keys(styles.bgColor);
  var colorNames = [...foregroundColorNames, ...backgroundColorNames];
  function assembleStyles() {
    const codes = /* @__PURE__ */ new Map();
    for (const [groupName, group] of Object.entries(styles)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles[styleName] = {
          open: `\x1B[${style[0]}m`,
          close: `\x1B[${style[1]}m`
        };
        group[styleName] = styles[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles, groupName, {
        value: group,
        enumerable: false
      });
    }
    Object.defineProperty(styles, "codes", {
      value: codes,
      enumerable: false
    });
    styles.color.close = "\x1B[39m";
    styles.bgColor.close = "\x1B[49m";
    styles.color.ansi = wrapAnsi16();
    styles.color.ansi256 = wrapAnsi256();
    styles.color.ansi16m = wrapAnsi16m();
    styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
    styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
    Object.defineProperties(styles, {
      rgbToAnsi256: {
        value(red, green, blue) {
          if (red === green && green === blue) {
            if (red < 8) {
              return 16;
            }
            if (red > 248) {
              return 231;
            }
            return Math.round((red - 8) / 247 * 24) + 232;
          }
          return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
        },
        enumerable: false
      },
      hexToRgb: {
        value(hex) {
          const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
          if (!matches) {
            return [0, 0, 0];
          }
          let [colorString] = matches;
          if (colorString.length === 3) {
            colorString = [...colorString].map((character) => character + character).join("");
          }
          const integer = Number.parseInt(colorString, 16);
          return [
            /* eslint-disable no-bitwise */
            integer >> 16 & 255,
            integer >> 8 & 255,
            integer & 255
            /* eslint-enable no-bitwise */
          ];
        },
        enumerable: false
      },
      hexToAnsi256: {
        value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
        enumerable: false
      },
      ansi256ToAnsi: {
        value(code) {
          if (code < 8) {
            return 30 + code;
          }
          if (code < 16) {
            return 90 + (code - 8);
          }
          let red;
          let green;
          let blue;
          if (code >= 232) {
            red = ((code - 232) * 10 + 8) / 255;
            green = red;
            blue = red;
          } else {
            code -= 16;
            const remainder = code % 36;
            red = Math.floor(code / 36) / 5;
            green = Math.floor(remainder / 6) / 5;
            blue = remainder % 6 / 5;
          }
          const value = Math.max(red, green, blue) * 2;
          if (value === 0) {
            return 30;
          }
          let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
          if (value === 2) {
            result += 60;
          }
          return result;
        },
        enumerable: false
      },
      rgbToAnsi: {
        value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
        enumerable: false
      },
      hexToAnsi: {
        value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
        enumerable: false
      }
    });
    return styles;
  }
  var ansiStyles = assembleStyles();
  var ansi_styles_default = ansiStyles;

  // ../../.yarn/berry/cache/chalk-npm-5.4.1-2f3fe4660a-10c0.zip/node_modules/chalk/source/vendor/supports-color/index.js
  var import_node_process = __toESM(__require("process"), 1);
  var import_node_os = __toESM(__require("os"), 1);
  var import_node_tty = __toESM(__require("tty"), 1);
  function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : import_node_process.default.argv) {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  }
  var { env } = import_node_process.default;
  var flagForceColor;
  if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
    flagForceColor = 0;
  } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
    flagForceColor = 1;
  }
  function envForceColor() {
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        return 1;
      }
      if (env.FORCE_COLOR === "false") {
        return 0;
      }
      return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
    const noFlagForceColor = envForceColor();
    if (noFlagForceColor !== void 0) {
      flagForceColor = noFlagForceColor;
    }
    const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
    if (forceColor === 0) {
      return 0;
    }
    if (sniffFlags) {
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
    }
    if ("TF_BUILD" in env && "AGENT_NAME" in env) {
      return 1;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (import_node_process.default.platform === "win32") {
      const osRelease = import_node_os.default.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => key in env)) {
        return 3;
      }
      if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if (env.TERM === "xterm-kitty") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app": {
          return version >= 3 ? 3 : 2;
        }
        case "Apple_Terminal": {
          return 2;
        }
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function createSupportsColor(stream, options = {}) {
    const level = _supportsColor(stream, {
      streamIsTTY: stream && stream.isTTY,
      ...options
    });
    return translateLevel(level);
  }
  var supportsColor = {
    stdout: createSupportsColor({ isTTY: import_node_tty.default.isatty(1) }),
    stderr: createSupportsColor({ isTTY: import_node_tty.default.isatty(2) })
  };
  var supports_color_default = supportsColor;

  // ../../.yarn/berry/cache/chalk-npm-5.4.1-2f3fe4660a-10c0.zip/node_modules/chalk/source/utilities.js
  function stringReplaceAll(string, substring, replacer) {
    let index = string.indexOf(substring);
    if (index === -1) {
      return string;
    }
    const substringLength = substring.length;
    let endIndex = 0;
    let returnValue = "";
    do {
      returnValue += string.slice(endIndex, index) + substring + replacer;
      endIndex = index + substringLength;
      index = string.indexOf(substring, endIndex);
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
  }
  function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
    let endIndex = 0;
    let returnValue = "";
    do {
      const gotCR = string[index - 1] === "\r";
      returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
      endIndex = index + 1;
      index = string.indexOf("\n", endIndex);
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
  }

  // ../../.yarn/berry/cache/chalk-npm-5.4.1-2f3fe4660a-10c0.zip/node_modules/chalk/source/index.js
  var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
  var GENERATOR = Symbol("GENERATOR");
  var STYLER = Symbol("STYLER");
  var IS_EMPTY = Symbol("IS_EMPTY");
  var levelMapping = [
    "ansi",
    "ansi",
    "ansi256",
    "ansi16m"
  ];
  var styles2 = /* @__PURE__ */ Object.create(null);
  var applyOptions = (object, options = {}) => {
    if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
      throw new Error("The `level` option should be an integer from 0 to 3");
    }
    const colorLevel = stdoutColor ? stdoutColor.level : 0;
    object.level = options.level === void 0 ? colorLevel : options.level;
  };
  var chalkFactory = (options) => {
    const chalk2 = (...strings) => strings.join(" ");
    applyOptions(chalk2, options);
    Object.setPrototypeOf(chalk2, createChalk.prototype);
    return chalk2;
  };
  function createChalk(options) {
    return chalkFactory(options);
  }
  Object.setPrototypeOf(createChalk.prototype, Function.prototype);
  for (const [styleName, style] of Object.entries(ansi_styles_default)) {
    styles2[styleName] = {
      get() {
        const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
        Object.defineProperty(this, styleName, { value: builder });
        return builder;
      }
    };
  }
  styles2.visible = {
    get() {
      const builder = createBuilder(this, this[STYLER], true);
      Object.defineProperty(this, "visible", { value: builder });
      return builder;
    }
  };
  var getModelAnsi = (model, level, type, ...arguments_) => {
    if (model === "rgb") {
      if (level === "ansi16m") {
        return ansi_styles_default[type].ansi16m(...arguments_);
      }
      if (level === "ansi256") {
        return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
      }
      return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
    }
    if (model === "hex") {
      return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
    }
    return ansi_styles_default[type][model](...arguments_);
  };
  var usedModels = ["rgb", "hex", "ansi256"];
  for (const model of usedModels) {
    styles2[model] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles2[bgModel] = {
      get() {
        const { level } = this;
        return function(...arguments_) {
          const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
          return createBuilder(this, styler, this[IS_EMPTY]);
        };
      }
    };
  }
  var proto = Object.defineProperties(() => {
  }, {
    ...styles2,
    level: {
      enumerable: true,
      get() {
        return this[GENERATOR].level;
      },
      set(level) {
        this[GENERATOR].level = level;
      }
    }
  });
  var createStyler = (open, close, parent) => {
    let openAll;
    let closeAll;
    if (parent === void 0) {
      openAll = open;
      closeAll = close;
    } else {
      openAll = parent.openAll + open;
      closeAll = close + parent.closeAll;
    }
    return {
      open,
      close,
      openAll,
      closeAll,
      parent
    };
  };
  var createBuilder = (self, _styler, _isEmpty) => {
    const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
    Object.setPrototypeOf(builder, proto);
    builder[GENERATOR] = self;
    builder[STYLER] = _styler;
    builder[IS_EMPTY] = _isEmpty;
    return builder;
  };
  var applyStyle = (self, string) => {
    if (self.level <= 0 || !string) {
      return self[IS_EMPTY] ? "" : string;
    }
    let styler = self[STYLER];
    if (styler === void 0) {
      return string;
    }
    const { openAll, closeAll } = styler;
    if (string.includes("\x1B")) {
      while (styler !== void 0) {
        string = stringReplaceAll(string, styler.close, styler.open);
        styler = styler.parent;
      }
    }
    const lfIndex = string.indexOf("\n");
    if (lfIndex !== -1) {
      string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
    }
    return openAll + string + closeAll;
  };
  Object.defineProperties(createChalk.prototype, styles2);
  var chalk = createChalk();
  var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
  var source_default = chalk;

  // sources/commands/apply.ts
  var import_cli = __require("@yarnpkg/cli");
  var import_core2 = __require("@yarnpkg/core");
  var import_fslib2 = __require("@yarnpkg/fslib");
  var import_parsers2 = __require("@yarnpkg/parsers");
  var import_clipanion = __require("clipanion");

  // sources/configuration/reader.ts
  var import_core = __require("@yarnpkg/core");
  var import_fslib = __require("@yarnpkg/fslib");
  var import_parsers = __require("@yarnpkg/parsers");
  var import_picomatch = __toESM(require_picomatch2());

  // sources/constants.ts
  var ROOT_ALIAS_GROUP = "root";
  var CATALOG_PROTOCOL = "catalog:";

  // sources/errors.ts
  var CatalogConfigurationError = class extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
      this.name = "CatalogConfigurationError";
    }
    static {
      this.FILE_NOT_FOUND = "FILE_NOT_FOUND";
    }
    static {
      this.INVALID_FORMAT = "INVALID_FORMAT";
    }
    static {
      this.INVALID_ALIAS = "INVALID_ALIAS";
    }
  };

  // sources/configuration/parser.ts
  function isValidCatalogsYml(config) {
    if (!config || typeof config !== "object") {
      return false;
    }
    const cfg = config;
    if (!("list" in cfg)) {
      return false;
    }
    if (!cfg.list || typeof cfg.list !== "object") {
      return false;
    }
    for (const group of Object.values(cfg.list)) {
      if (!group || typeof group !== "object") {
        return false;
      }
      for (const version of Object.values(group)) {
        if (typeof version !== "string") {
          return false;
        }
      }
    }
    if ("options" in cfg && cfg.options) {
      const options = cfg.options;
      if (!options || typeof options !== "object") {
        return false;
      }
      const opts = options;
      if (opts.default) {
        if (Array.isArray(opts.default)) {
          if (opts.default.length === 0 || !opts.default.every((item) => typeof item === "string")) {
            return false;
          }
        } else if (typeof opts.default !== "string" || opts.default !== "max") {
          return false;
        }
      }
      if (opts.includedWorkspaces) {
        if (!Array.isArray(opts.includedWorkspaces) || opts.includedWorkspaces.length === 0 || !opts.includedWorkspaces.every((item) => typeof item === "string")) {
          return false;
        }
      }
      if (opts.ignoredWorkspaces) {
        if (!Array.isArray(opts.ignoredWorkspaces) || opts.ignoredWorkspaces.length === 0 || !opts.ignoredWorkspaces.every((item) => typeof item === "string")) {
          return false;
        }
      }
      if (opts.validation) {
        const validLevels = ["warn", "strict", "off"];
        const validation = opts.validation;
        if (typeof validation === "string") {
          if (!validLevels.includes(validation)) {
            return false;
          }
        } else if (typeof validation === "object" && validation !== null) {
          if (!Object.values(validation).every(
            (level) => typeof level === "string" && validLevels.includes(level)
          )) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }
  function validateInheritanceStructure(config, getInheritanceChain) {
    const groups = Object.keys(config.list);
    for (const group of groups) {
      if (group.includes("/")) {
        const chain = getInheritanceChain(group);
        for (let i = 0; i < chain.length - 1; i++) {
          const parentGroup = chain[i];
          if (!groups.includes(parentGroup) && parentGroup !== ROOT_ALIAS_GROUP) {
            return false;
          }
        }
      }
    }
    return true;
  }
  function isValidCatalog(value) {
    if (!value || typeof value !== "object" || value instanceof Map) {
      return false;
    }
    return Object.values(value).every((v) => typeof v === "string");
  }
  function isValidCatalogs(value) {
    if (!value || typeof value !== "object" || value instanceof Map) {
      return false;
    }
    return Object.values(value).every((catalog) => isValidCatalog(catalog));
  }

  // sources/configuration/reader.ts
  var CATALOGS_YML_FILENAME = "catalogs.yml";
  var CatalogsConfigurationReader = class {
    constructor() {
      this.cache = /* @__PURE__ */ new Map();
    }
    /**
     * Read catalogs.yml file from project root
     */
    async read(project) {
      const cacheKey = String(project.cwd);
      const cached = this.cache.get(cacheKey);
      if (cached !== void 0) {
        return cached;
      }
      const catalogsYmlPath = import_fslib.ppath.join(
        project.cwd,
        CATALOGS_YML_FILENAME
      );
      if (!await import_fslib.xfs.existsPromise(catalogsYmlPath)) {
        this.cache.set(cacheKey, null);
        return null;
      }
      const content = await import_fslib.xfs.readFilePromise(catalogsYmlPath, "utf8");
      const parsed = (0, import_parsers.parseSyml)(content);
      if (!isValidCatalogsYml(parsed)) {
        throw new CatalogConfigurationError(
          "Invalid catalogs.yml format. Expected structure: { options?: {...}, list: { [alias: string]: { [packageName: string]: string } } }",
          CatalogConfigurationError.INVALID_FORMAT
        );
      }
      if (!validateInheritanceStructure(parsed, this.getInheritanceChain.bind(this))) {
        throw new CatalogConfigurationError(
          "Invalid inheritance structure in catalogs.yml. Parent groups must exist in the inheritance chain.",
          CatalogConfigurationError.INVALID_ALIAS
        );
      }
      this.cache.set(cacheKey, parsed);
      return parsed;
    }
    /**
     * Get options from catalogs.yml
     */
    async getOptions(project) {
      const catalogsYml = await this.read(project);
      return catalogsYml?.options;
    }
    /**
     * Get applied catalogs from .yarnrc.yml (what Yarn currently uses)
     * This reads from .yarnrc.yml to see what's actually been applied
     */
    async getAppliedCatalogs(project) {
      const yarnrcCatalog = project.configuration.get("catalog");
      const yarnrcCatalogs = project.configuration.get("catalogs");
      const catalogs = {};
      if (yarnrcCatalog && typeof yarnrcCatalog === "object") {
        if (yarnrcCatalog instanceof Map) {
          catalogs[ROOT_ALIAS_GROUP] = Object.fromEntries(
            yarnrcCatalog.entries()
          );
        } else if (isValidCatalog(yarnrcCatalog)) {
          catalogs[ROOT_ALIAS_GROUP] = yarnrcCatalog;
        }
      }
      if (yarnrcCatalogs && typeof yarnrcCatalogs === "object") {
        if (yarnrcCatalogs instanceof Map) {
          for (const [groupName, group] of yarnrcCatalogs.entries()) {
            if (group instanceof Map) {
              catalogs[groupName] = Object.fromEntries(group.entries());
            } else if (isValidCatalog(group)) {
              catalogs[groupName] = group;
            }
          }
        } else if (isValidCatalogs(yarnrcCatalogs)) {
          Object.assign(catalogs, yarnrcCatalogs);
        }
      }
      return catalogs;
    }
    /**
     * Check if a workspace is ignored based on catalogs.yml configuration
     * Logic: includedWorkspaces - ignoredWorkspaces = final set
     */
    async shouldIgnoreWorkspace(workspace) {
      if (!workspace.manifest.name) return false;
      const catalogsYml = await this.read(workspace.project);
      const options = catalogsYml?.options;
      if (!options) return false;
      const workspaceName = import_core.structUtils.stringifyIdent(workspace.manifest.name);
      if (options.ignoredWorkspaces) {
        const isIgnored = (0, import_picomatch.isMatch)(workspaceName, options.ignoredWorkspaces);
        if (isIgnored) return true;
      }
      if (options.includedWorkspaces) {
        const isIncluded = (0, import_picomatch.isMatch)(workspaceName, options.includedWorkspaces);
        if (!isIncluded) return true;
      }
      return false;
    }
    /**
     * Write catalogs to .yarnrc.yml in Yarn's native format
     * This applies catalogs.yml to .yarnrc.yml
     */
    async writeToYarnrc(project, catalogs) {
      const yarnrcPath = import_fslib.ppath.join(
        project.cwd,
        ".yarnrc.yml"
      );
      let existingConfig = {};
      if (await import_fslib.xfs.existsPromise(yarnrcPath)) {
        const content = await import_fslib.xfs.readFilePromise(yarnrcPath, "utf8");
        existingConfig = (0, import_parsers.parseSyml)(content) || {};
      }
      if (catalogs.root && Object.keys(catalogs.root).length > 0) {
        existingConfig.catalog = catalogs.root;
      } else {
        existingConfig.catalog = void 0;
      }
      if (Object.keys(catalogs.named).length > 0) {
        existingConfig.catalogs = catalogs.named;
      } else {
        existingConfig.catalogs = void 0;
      }
      const newContent = (0, import_parsers.stringifySyml)(existingConfig);
      await import_fslib.xfs.writeFilePromise(yarnrcPath, newContent);
    }
    /**
     * Resolve all catalogs with inheritance
     */
    resolveAllCatalogs(catalogsYml) {
      const result = {
        named: {}
      };
      for (const [groupName, group] of Object.entries(catalogsYml.list)) {
        if (groupName === ROOT_ALIAS_GROUP) {
          result.root = { ...group };
        } else {
          result.named[groupName] = this.resolveInheritedCatalog(
            groupName,
            catalogsYml.list
          );
        }
      }
      return result;
    }
    /**
     * Resolve inheritance for a single catalog group
     */
    resolveInheritedCatalog(groupName, allGroups) {
      const chain = this.getInheritanceChain(groupName);
      const resolved = {};
      for (const ancestor of chain) {
        const group = allGroups[ancestor];
        if (!group) {
          throw new CatalogConfigurationError(
            `Parent group "${ancestor}" not found in inheritance chain for "${groupName}"`,
            CatalogConfigurationError.INVALID_ALIAS
          );
        }
        Object.assign(resolved, group);
      }
      return resolved;
    }
    /**
     * Get inheritance chain for a group name
     * e.g., "frontend/react" => ["frontend", "frontend/react"]
     */
    getInheritanceChain(groupName) {
      const parts = groupName.split("/");
      const chain = [];
      for (let i = 0; i < parts.length; i++) {
        chain.push(parts.slice(0, i + 1).join("/"));
      }
      return chain;
    }
    /**
     * Clear the cache for a specific project
     */
    clearCache(project) {
      this.cache.delete(String(project.cwd));
    }
  };

  // sources/configuration/index.ts
  var configReader = new CatalogsConfigurationReader();

  // sources/commands/apply.ts
  var ApplyCommand = class extends import_cli.BaseCommand {
    constructor() {
      super(...arguments);
      this.check = import_clipanion.Option.Boolean("--check", false, {
        description: "Check if .yarnrc.yml is up to date and preview changes (fails if changes are needed)"
      });
    }
    static {
      this.paths = [["catalogs", "apply"]];
    }
    static {
      this.usage = import_clipanion.Command.Usage({
        category: "Catalogs commands",
        description: "Apply catalog definitions from catalogs.yml to .yarnrc.yml",
        details: `
      This command reads catalog definitions from catalogs.yml, resolves all inheritance,
      and writes them to .yarnrc.yml in Yarn's native catalog format.

      The catalogs.yml file should contain hierarchical catalog definitions with optional inheritance.
      After running this command, Yarn will use its native catalog resolution for dependencies.
    `,
        examples: [
          ["Apply catalogs to .yarnrc.yml", "yarn catalogs apply"],
          ["Check if .yarnrc.yml is up to date", "yarn catalogs apply --check"]
        ]
      });
    }
    async execute() {
      const configuration = await import_core2.Configuration.find(
        this.context.cwd,
        this.context.plugins
      );
      const { project } = await import_core2.Project.find(configuration, this.context.cwd);
      const report = await import_core2.StreamReport.start(
        {
          configuration,
          stdout: this.context.stdout
        },
        async (report2) => {
          const catalogsYml = await configReader.read(project);
          if (!catalogsYml) {
            report2.reportError(
              0,
              "No catalogs.yml file found in project root. Please create one to use this command."
            );
            return;
          }
          const resolved = configReader.resolveAllCatalogs(catalogsYml);
          const existingConfig = await readExistingYarnrc(project);
          const hasChanges = checkForChanges(existingConfig, resolved);
          if (!hasChanges) {
            this.reportNoChanges(report2);
            return;
          }
          if (this.check) {
            this.reportCheckFailure(report2, existingConfig, resolved);
          } else {
            await this.applyChanges(report2, project, existingConfig, resolved);
          }
        }
      );
      return report.exitCode();
    }
    reportNoChanges(report) {
      const message = this.check ? source_default.green("\u2713 .yarnrc.yml is up to date") : "No changes to apply - .yarnrc.yml is already up to date";
      report.reportInfo(0, message);
    }
    reportCheckFailure(report, existingConfig, resolved) {
      report.reportError(
        0,
        ".yarnrc.yml is out of date. Run 'yarn catalogs apply' to update it."
      );
      showCatalogDiff(report, existingConfig, resolved);
      const summary = formatCatalogSummary(
        resolved.root ? 1 : 0,
        Object.keys(resolved.named).length
      );
      report.reportInfo(0, `Would apply ${summary} to .yarnrc.yml`);
    }
    async applyChanges(report, project, existingConfig, resolved) {
      showCatalogDiff(report, existingConfig, resolved);
      await configReader.writeToYarnrc(project, resolved);
      configReader.clearCache(project);
      const summary = formatCatalogSummary(
        resolved.root ? 1 : 0,
        Object.keys(resolved.named).length
      );
      report.reportInfo(0, source_default.green(`\u2713 Applied ${summary} to .yarnrc.yml`));
    }
  };
  async function readExistingYarnrc(project) {
    const yarnrcPath = import_fslib2.ppath.join(
      project.cwd,
      ".yarnrc.yml"
    );
    if (!await import_fslib2.xfs.existsPromise(yarnrcPath)) {
      return {};
    }
    const content = await import_fslib2.xfs.readFilePromise(yarnrcPath, "utf8");
    return (0, import_parsers2.parseSyml)(content) || {};
  }
  function checkForChanges(existingConfig, resolved) {
    const newConfig = { ...existingConfig };
    if (resolved.root && Object.keys(resolved.root).length > 0) {
      newConfig.catalog = resolved.root;
    } else {
      newConfig.catalog = void 0;
    }
    if (Object.keys(resolved.named).length > 0) {
      newConfig.catalogs = resolved.named;
    } else {
      newConfig.catalogs = void 0;
    }
    const oldContent = (0, import_parsers2.stringifySyml)(existingConfig);
    const newContent = (0, import_parsers2.stringifySyml)(newConfig);
    return oldContent !== newContent;
  }
  function formatCatalogSummary(rootCount, namedCount) {
    const parts = [];
    if (rootCount > 0) {
      parts.push("1 root catalog");
    }
    if (namedCount > 0) {
      parts.push(`${namedCount} named catalog group${namedCount > 1 ? "s" : ""}`);
    }
    if (parts.length === 0) {
      return "no catalogs";
    }
    return parts.join(" and ");
  }
  function showCatalogGroupDiff(report, groupName, oldCatalog, newCatalog) {
    const allPackages = /* @__PURE__ */ new Set([
      ...Object.keys(oldCatalog),
      ...Object.keys(newCatalog)
    ]);
    const hasChanges = Array.from(allPackages).some(
      (pkg) => oldCatalog[pkg] !== newCatalog[pkg]
    );
    if (!hasChanges) {
      return;
    }
    report.reportInfo(0, source_default.bold(`${groupName}:`));
    for (const pkg of Array.from(allPackages).sort()) {
      const oldVersion = oldCatalog[pkg];
      const newVersion = newCatalog[pkg];
      if (!oldVersion) {
        report.reportInfo(0, source_default.green(`  + ${pkg}: ${newVersion}`));
      } else if (!newVersion) {
        report.reportInfo(0, source_default.red(`  - ${pkg}: ${oldVersion}`));
      } else if (oldVersion !== newVersion) {
        report.reportInfo(0, source_default.red(`  - ${pkg}: ${oldVersion}`));
        report.reportInfo(0, source_default.green(`  + ${pkg}: ${newVersion}`));
      }
    }
  }
  function showCatalogDiff(report, existingConfig, resolved) {
    const currentRoot = existingConfig.catalog;
    const currentNamed = existingConfig.catalogs;
    if (resolved.root || currentRoot) {
      showCatalogGroupDiff(
        report,
        "root catalog",
        currentRoot || {},
        resolved.root || {}
      );
    }
    const allGroups = /* @__PURE__ */ new Set([
      ...Object.keys(currentNamed || {}),
      ...Object.keys(resolved.named)
    ]);
    for (const groupName of Array.from(allGroups).sort()) {
      showCatalogGroupDiff(
        report,
        groupName,
        currentNamed?.[groupName] || {},
        resolved.named[groupName] || {}
      );
    }
  }

  // sources/utils/validation.ts
  var import_core3 = __require("@yarnpkg/core");
  async function validateWorkspace(workspace) {
    const shouldIgnore = await configReader.shouldIgnoreWorkspace(workspace);
    const hasCatalogProtocol = [
      ...Object.values(workspace.manifest.raw.dependencies || {}),
      ...Object.values(workspace.manifest.raw.devDependencies || {})
    ].some((version) => version.startsWith(CATALOG_PROTOCOL));
    const ignoredWorkspaceWithCatalogProtocol = shouldIgnore && hasCatalogProtocol;
    let catalogProtocolViolations = [];
    if (!shouldIgnore) {
      catalogProtocolViolations = await validateWorkspaceCatalogUsability(workspace);
    }
    return {
      shouldIgnore,
      catalogProtocolViolations,
      ignoredWorkspaceWithCatalogProtocol
    };
  }
  async function validateCatalogUsability(workspace, descriptor) {
    if (descriptor.range.startsWith(CATALOG_PROTOCOL)) {
      return null;
    }
    if (await configReader.shouldIgnoreWorkspace(workspace)) {
      return null;
    }
    const defaultAliasGroups = await getDefaultAliasGroups(workspace);
    const packageName = import_core3.structUtils.stringifyIdent(descriptor);
    const groupsWithDependency = await findAllGroupsWithSpecificDependency(
      workspace.project,
      packageName
    );
    const accessibleGroups = groupsWithDependency.flatMap(
      ({ groupName }) => defaultAliasGroups.length === 0 || defaultAliasGroups.includes(groupName) ? [groupName] : []
    );
    if (accessibleGroups.length === 0) {
      return null;
    }
    const validationLevel = await getPackageValidationLevel(
      workspace,
      packageName
    );
    return {
      validationLevel,
      applicableGroups: accessibleGroups
    };
  }
  async function validateWorkspaceCatalogUsability(workspace) {
    const dependencyDescriptors = [
      ...Object.entries(workspace.manifest.raw.dependencies ?? {}),
      ...Object.entries(workspace.manifest.raw.devDependencies ?? {})
    ].map(([stringifiedIdent, version]) => {
      const ident = import_core3.structUtils.parseIdent(stringifiedIdent);
      return import_core3.structUtils.makeDescriptor(ident, version);
    });
    const results = [];
    for (const descriptor of dependencyDescriptors) {
      const validationInfo = await validateCatalogUsability(
        workspace,
        descriptor
      );
      if (validationInfo && validationInfo.validationLevel !== "off") {
        results.push({
          descriptor,
          validationLevel: validationInfo.validationLevel,
          applicableGroups: validationInfo.applicableGroups
        });
      }
    }
    return results;
  }
  async function getGroupValidationLevel(workspace, groupName) {
    const options = await configReader.getOptions(workspace.project);
    const validationConfig = options?.validation || "warn";
    if (typeof validationConfig === "string") {
      return validationConfig;
    }
    const inheritanceChain = configReader.getInheritanceChain(groupName);
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
      const currentGroup = inheritanceChain[i];
      if (validationConfig[currentGroup] !== void 0) {
        return validationConfig[currentGroup];
      }
    }
    return "warn";
  }
  async function getPackageValidationLevel(workspace, packageName) {
    const accessibleGroups = (await findAllGroupsWithSpecificDependency(workspace.project, packageName)).map(({ groupName }) => groupName);
    if (accessibleGroups.length === 0) {
      return "off";
    }
    const validationLevels = [];
    for (const groupName of accessibleGroups) {
      const level = await getGroupValidationLevel(workspace, groupName);
      validationLevels.push(level);
    }
    if (validationLevels.includes("strict")) return "strict";
    if (validationLevels.includes("warn")) return "warn";
    return "off";
  }
  async function findAllGroupsWithSpecificDependency(project, packageName) {
    const catalogs = await configReader.getAppliedCatalogs(project);
    const results = [];
    if (!catalogs || Object.keys(catalogs).length === 0) {
      return results;
    }
    for (const [groupName, group] of Object.entries(catalogs)) {
      const version = group[packageName];
      if (version) {
        results.push({ groupName, version });
      }
    }
    return results;
  }

  // sources/utils/default.ts
  async function fallbackDefaultAliasGroup(workspace, dependency) {
    if (dependency.range.startsWith(CATALOG_PROTOCOL)) {
      if (await configReader.shouldIgnoreWorkspace(workspace)) {
        throw new Error(
          source_default.red(
            "The workspace is ignored from the catalogs, but the dependency to add is using the catalog protocol. Consider removing the protocol."
          )
        );
      }
      return;
    }
    const validationInfo = await validateCatalogUsability(workspace, dependency);
    if (!validationInfo) return;
    const { validationLevel, applicableGroups } = validationInfo;
    const defaultAliasGroups = await getDefaultAliasGroups(workspace);
    if (defaultAliasGroups.length > 0) {
      for (const aliasGroup of defaultAliasGroups) {
        if (applicableGroups.includes(aliasGroup)) {
          const catalogRange = aliasGroup === ROOT_ALIAS_GROUP ? CATALOG_PROTOCOL : `${CATALOG_PROTOCOL}${aliasGroup}`;
          dependency.range = catalogRange;
          return;
        }
      }
    }
    const aliasGroups = applicableGroups.map(
      (groupName) => groupName === ROOT_ALIAS_GROUP ? "" : groupName
    );
    const aliasGroupsText = aliasGroups.filter((aliasGroup) => aliasGroup !== "").length > 0 ? ` (${aliasGroups.join(", ")})` : "";
    const message = `\u27A4 ${dependency.name} is listed in the catalogs config${aliasGroupsText}, but it seems you're adding it without the catalog protocol. Consider running 'yarn add ${dependency.name}@${CATALOG_PROTOCOL}${aliasGroups[0]}' instead.`;
    if (validationLevel === "strict") {
      throw new Error(source_default.red(message));
    }
    if (validationLevel === "warn") {
      console.warn(source_default.yellow(message));
    }
  }
  async function getDefaultAliasGroups(workspace) {
    const options = await configReader.getOptions(workspace.project);
    if (options) {
      if (await configReader.shouldIgnoreWorkspace(workspace)) {
        return [];
      }
      if (options.default) {
        if (Array.isArray(options.default)) {
          return options.default;
        }
        if (options.default === "max") {
          const catalogs = await configReader.getAppliedCatalogs(
            workspace.project
          );
          const aliasGroups = Object.keys(catalogs || {});
          const dependencies = [
            ...Object.entries(workspace.manifest.raw.dependencies ?? {}),
            ...Object.entries(
              workspace.manifest.raw.devDependencies ?? {}
            )
          ];
          const counts = Object.fromEntries(
            aliasGroups.map((aliasGroup) => [aliasGroup, 0])
          );
          for (const [_, range] of dependencies) {
            if (range.startsWith(CATALOG_PROTOCOL)) {
              const aliasGroup = range.substring(CATALOG_PROTOCOL.length);
              counts[aliasGroup] = (counts[aliasGroup] || 0) + 1;
            }
          }
          const maxCount = Math.max(...Object.values(counts));
          return Object.keys(counts).filter(
            (aliasGroup) => counts[aliasGroup] === maxCount
          );
        }
      }
    }
    return [];
  }

  // sources/index.ts
  var plugin = {
    commands: [ApplyCommand],
    hooks: {
      validateWorkspace: async (workspace, report) => {
        const result = await validateWorkspace(workspace);
        if (result.catalogProtocolViolations.length > 0) {
          const strictViolations = result.catalogProtocolViolations.filter(
            (dep) => dep.validationLevel === "strict"
          );
          const warnViolations = result.catalogProtocolViolations.filter(
            (dep) => dep.validationLevel === "warn"
          );
          const formatMessage = (violations) => {
            const packageList = violations.map(
              (dep) => source_default.yellow(import_core4.structUtils.stringifyDescriptor(dep.descriptor))
            ).join(", ");
            return `The following dependencies are listed in the catalogs but not using the catalog protocol: ${packageList}. Consider using the catalog protocol instead.`;
          };
          if (strictViolations.length > 0) {
            report.reportError(
              import_core4.MessageName.INVALID_MANIFEST,
              formatMessage(strictViolations)
            );
          }
          if (warnViolations.length > 0) {
            report.reportWarning(
              import_core4.MessageName.INVALID_MANIFEST,
              formatMessage(warnViolations)
            );
          }
        }
        if (result.ignoredWorkspaceWithCatalogProtocol) {
          report.reportError(
            import_core4.MessageName.INVALID_MANIFEST,
            "Workspace is ignored from the catalogs, but it has dependencies with the catalog protocol. Consider removing the protocol."
          );
        }
      },
      afterWorkspaceDependencyAddition: async (workspace, __, dependency) => {
        fallbackDefaultAliasGroup(workspace, dependency);
      },
      afterWorkspaceDependencyReplacement: async (workspace, __, ___, dependency) => {
        fallbackDefaultAliasGroup(workspace, dependency);
      }
    }
  };
  var sources_default = plugin;
  return __toCommonJS(sources_exports);
})();
return plugin;
}
};
