// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: x0 => x0.name,
      AH: () => Date.now(),
      AI: x0 => x0.offsetHeight,
      AJ: x0 => x0.canvasKitMaximumSurfaces,
      AK: (x0,x1) => x0.vibrate(x1),
      AL: () => globalThis.window.ImageDecoder,
      AM: (x0,x1) => { x0.accept = x1 },
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.statusText,
      BH: () => typeof dartUseDateNowForTicks !== "undefined",
      BI: x0 => x0.offsetWidth,
      BJ: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      BK: x0 => x0.content,
      BL: () => new FileReader(),
      BM: (x0,x1) => { x0.multiple = x1 },
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: x0 => x0.url,
      CH: () => 1000 * performance.now(),
      CI: (x0,x1) => { x0.tabIndex = x1 },
      CJ: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      CK: x0 => x0.document,
      CL: (x0,x1) => x0.readAsArrayBuffer(x1),
      CM: (x0,x1) => { x0.type = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: x0 => x0.status,
      DH: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      DI: x0 => x0.stopPropagation(),
      DJ: x0 => x0.maxHeight,
      DK: x0 => new WeakRef(x0),
      DL: x0 => x0.result,
      DM: x0 => x0.permissions,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: x0 => x0.getReader(),
      EH: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      EI: x0 => x0.value,
      EJ: x0 => x0.maxWidth,
      EK: x0 => x0.deref(),
      EL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      EM: x0 => x0.geolocation,
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: x0 => x0.read(),
      FH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FI: x0 => x0.disabled,
      FJ: x0 => x0.minHeight,
      FK: () => globalThis.WeakRef,
      FL: x0 => x0.type,
      FM: (x0,x1) => x0.getRandomValues(x1),
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.value,
      GH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GI: (x0,x1) => { x0.type = x1 },
      GJ: x0 => x0.minWidth,
      GK: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      GL: x0 => x0.vendor,
      GM: (x0,x1,x2,x3) => x0.encrypt(x1,x2,x3),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: x0 => x0.done,
      HH: x0 => x0.body,
      HI: (x0,x1) => { x0.min = x1 },
      HJ: x0 => x0.debugSkipFontRetryDelay,
      HK: (a, s, e) => a.slice(s, e),
      HL: x0 => new Blob(x0),
      HM: x0 => x0.sessionStorage,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.cancel(),
      IH: () => globalThis.document,
      II: (x0,x1) => { x0.max = x1 },
      IJ: x0 => x0.status,
      IK: () => new XMLHttpRequest(),
      IL: x0 => globalThis.fetch(x0),
      IM: x0 => x0.subtle,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: x0 => x0.body,
      JH: () => globalThis.window._flutter_skwasmInstance,
      JI: (x0,x1) => { x0.value = x1 },
      JJ: x0 => new Uint8Array(x0),
      JK: (x0,x1,x2) => x0.open(x1,x2),
      JL: x0 => x0.arrayBuffer(),
      JM: (x0,x1,x2,x3,x4,x5,x6,x7) => x0.unwrapKey(x1,x2,x3,x4,x5,x6,x7),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: x0 => x0.headers,
      KH: () => globalThis.window.flutterCanvasKit,
      KI: (x0,x1) => { x0.disabled = x1 },
      KJ: (x0,x1,x2) => x0.set(x1,x2),
      KK: (x0,x1) => x0.send(x1),
      KL: x0 => x0.size,
      KM: (x0,x1,x2,x3,x4,x5) => x0.importKey(x1,x2,x3,x4,x5),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: x0 => x0.signal,
      LH: () => globalThis.globalThis,
      LI: (a, l) => a.length = l,
      LJ: x0 => x0.buffer,
      LK: x0 => x0.send(),
      LL: (x0,x1) => x0.get(x1),
      LM: (x0,x1,x2,x3) => x0.generateKey(x1,x2,x3),
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: x0 => x0.origin,
      MH: x0 => x0.remove(),
      MI: (x0,x1) => { x0.scrollTop = x1 },
      MJ: x0 => x0.wasmMemory,
      MK: x0 => x0.readyState,
      ML: x0 => x0.body,
      MM: (x0,x1,x2,x3,x4) => x0.wrapKey(x1,x2,x3,x4),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: x0 => x0.location,
      NH: (x0,x1) => x0.querySelectorAll(x1),
      NI: (x0,x1) => { x0.scrollLeft = x1 },
      NJ: () => globalThis.window._flutter_skwasmInstance,
      NK: x0 => x0.abort(),
      NL: x0 => x0.headers,
      NM: (x0,x1,x2) => x0.exportKey(x1,x2),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: () => globalThis.window,
      OH: (x0,x1) => x0.item(x1),
      OI: (d, digits) => d.toFixed(digits),
      OJ: x0 => x0.arrayBuffer(),
      OK: x0 => x0.upload,
      OL: x0 => x0.input,
      OM: x0 => x0.crypto,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: x0 => x0.flags,
      PG: (o, p) => p in o,
      PH: x0 => x0.length,
      PI: (x0,x1) => { x0.spellcheck = x1 },
      PJ: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      PK: x0 => x0.responseURL,
      PL: x0 => x0.hostElement,
      PM: x0 => x0.isSecureContext,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: x0 => x0.groups,
      QH: () => globalThis.Sentry.close(),
      QI: (x0,x1) => { x0.disabled = x1 },
      QJ: (x0,x1) => x0.fetch(x1),
      QK: x0 => x0.statusText,
      QL: x0 => x0.location,
      QM: (x0,x1) => x0.removeItem(x1),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: (map, o) => map.get(o),
      RH: (o, p, v) => o[p] = v,
      RI: (x0,x1) => { x0.autocomplete = x1 },
      RJ: x0 => x0.fontFallbackBaseUrl,
      RK: x0 => x0.getAllResponseHeaders(),
      RL: (x0,x1) => x0.getModifierState(x1),
      RM: (x0,x1,x2,x3) => x0.decrypt(x1,x2,x3),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: x0 => x0.abort(),
      SH: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SI: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      SJ: (x0,x1,x2) => x0.slice(x1,x2),
      SK: x0 => x0.status,
      SL: x0 => x0.metaKey,
      SM: (o, a) => o + a,
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: (a, i) => a.splice(i, 1),
      TH: x0 => globalThis.Sentry.init(x0),
      TI: (x0,x1) => { x0.value = x1 },
      TJ: (x0,x1) => x0.decode(x1),
      TK: x0 => x0.response,
      TL: x0 => x0.altKey,
      TM: x0 => x0.children,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.left,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.blur(),
      UG: secondsSinceEpoch => {
        const date = new Date(secondsSinceEpoch * 1000);
        const match = /\((.*)\)/.exec(date.toString());
        if (match == null) {
            // This should never happen on any recent browser.
            return '';
        }
        return match[1];
      },
      UH: () => new Sentry.getClient(),
      UI: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      UJ: (x0,x1) => x0.adoptText(x1),
      UK: x0 => x0.withCredentials,
      UL: x0 => x0.ctrlKey,
      UM: (x0,x1,x2) => x0.addEventListener(x1,x2),
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.clientY,
      VE: x0 => x0.language,
      VF: x0 => x0.button,
      VG: x0 => x0.devicePixelRatio,
      VH: x0 => x0.getOptions(),
      VI: (x0,x1) => x0.add(x1),
      VJ: x0 => x0.first(),
      VK: (x0,x1) => { x0.timeout = x1 },
      VL: x0 => x0.isComposing,
      VM: (x0,x1) => x0.removeChild(x1),
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientX,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.innerHeight,
      WG: x0 => x0.availWidth,
      WH: (x0,x1) => { x0.name = x1 },
      WI: x0 => x0.data,
      WJ: x0 => x0.next(),
      WK: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      WL: x0 => x0.code,
      WM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.changedTouches,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.innerWidth,
      XG: x0 => x0.availHeight,
      XH: (x0,x1) => { x0.sdk = x1 },
      XI: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      XJ: x0 => x0.current(),
      XK: (x0,x1) => { x0.withCredentials = x1 },
      XL: x0 => x0.repeat,
      XM: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: x0 => x0.screen,
      YH: x0 => x0.sdk,
      YI: x0 => x0.value,
      YJ: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      YK: (x0,x1) => { x0.responseType = x1 },
      YL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: x0 => x0.type,
      ZH: () => globalThis.Sentry.globalHandlersIntegration(),
      ZI: x0 => x0.selectionDirection,
      ZJ: x0 => x0.v8BreakIterator,
      ZK: (x0,x1) => x0.revokeObjectURL(x1),
      ZL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      ZM: x0 => ({type: x0}),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: x0 => x0.orientation,
      aH: () => globalThis.Sentry.dedupeIntegration(),
      aI: x0 => x0.selectionStart,
      aJ: () => globalThis.Intl,
      aK: (x0,x1) => { x0.src = x1 },
      aL: (x0,x1) => x0.getItem(x1),
      aM: (x0,x1) => new Blob(x0,x1),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.maxTouchPoints,
      bE: (x0,x1) => x0.contains(x1),
      bF: x0 => x0.clientWidth,
      bG: x0 => x0.deviceMemory,
      bH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      bI: x0 => x0.selectionEnd,
      bJ: (x0,x1) => x0.segment(x1),
      bK: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      bL: x0 => x0.localStorage,
      bM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: x0 => x0.onLine,
      cH: x0 => ({createScriptURL: x0}),
      cI: x0 => x0.selectionDirection,
      cJ: x0 => x0.index,
      cK: x0 => x0.naturalHeight,
      cL: (x0,x1) => x0.key(x1),
      cM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.body,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => { x0.name = x1 },
      dG: x0 => x0.navigator,
      dH: (x0,x1,x2) => x0.createPolicy(x1,x2),
      dI: x0 => x0.selectionStart,
      dJ: x0 => x0.next(),
      dK: x0 => x0.naturalWidth,
      dL: x0 => x0.length,
      dM: (x0,x1) => { x0.display = x1 },
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: x0 => x0.pathname,
      eH: (x0,x1,x2) => x0.createScriptURL(x1,x2),
      eI: x0 => x0.selectionEnd,
      eJ: x0 => x0.value,
      eK: x0 => x0.decode(),
      eL: (x0,x1,x2) => x0.setItem(x1,x2),
      eM: x0 => x0.style,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.classList,
      fF: (x0,x1) => x0.removeChild(x1),
      fG: x0 => x0.userAgent,
      fH: x0 => x0.hasChildNodes(),
      fI: x0 => x0.keyCode,
      fJ: x0 => x0.done,
      fK: (x0,x1) => { x0.decoding = x1 },
      fL: x0 => x0.baseURI,
      fM: (x0,x1) => { x0.draggable = x1 },
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: (x0,x1) => x0.matchMedia(x1),
      gH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      gI: (x0,x1) => x0.scrollIntoView(x1),
      gJ: (o, m, a) => o[m].apply(o, a),
      gK: (x0,x1) => { x0.crossOrigin = x1 },
      gL: x0 => x0.document,
      gM: x0 => x0.length,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: x0 => x0.matches,
      hH: (x0,x1) => x0.append(x1),
      hI: x0 => x0.multiViewEnabled,
      hJ: x0 => x0.iterator,
      hK: (x0,x1) => x0.createObjectURL(x1),
      hL: (x0,x1) => x0.querySelector(x1),
      hM: x0 => x0.getReader(),
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: x0 => x0.platform,
      iH: x0 => x0.firstChild,
      iI: (x0,x1) => x0.replaceWith(x1),
      iJ: () => globalThis.Symbol,
      iK: x0 => x0.URL,
      iL: (x0,x1) => { x0.id = x1 },
      iM: x0 => x0.value,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (map, o, v) => map.set(o, v),
      jH: x0 => x0.head,
      jI: (x0,x1) => { x0.className = x1 },
      jJ: (x0,x1) => new Intl.Segmenter(x0,x1),
      jK: x0 => new Blob(x0),
      jL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jM: x0 => x0.done,
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kH: (x0,x1) => { x0.integrity = x1 },
      kI: (x0,x1) => { x0.name = x1 },
      kJ: x0 => x0.Segmenter,
      kK: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      kL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kM: x0 => x0.read(),
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.ctrlKey,
      lF: (handle) => clearInterval(handle),
      lG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      lH: (x0,x1) => { x0.src = x1 },
      lI: (x0,x1) => { x0.placeholder = x1 },
      lJ: () => new TextDecoder(),
      lK: x0 => new window.ImageDecoder(x0),
      lL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      lM: (x0,x1) => new OffscreenCanvas(x0,x1),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.y,
      mF: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      mG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      mH: x0 => x0.trustedTypes,
      mI: (x0,x1) => { x0.name = x1 },
      mJ: a => a.pop(),
      mK: x0 => x0.name,
      mL: (x0,x1) => { x0.onerror = x1 },
      mM: x0 => x0.assetBase,
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.x,
      nF: () => Date.now(),
      nG: x0 => x0.hash,
      nH: (x0,x1) => { x0.crossOrigin = x1 },
      nI: (x0,x1) => { x0.placeholder = x1 },
      nJ: x0 => x0.click(),
      nK: x0 => x0.repetitionCount,
      nL: (x0,x1) => { x0.oncancel = x1 },
      nM: x0 => x0.loader,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: (x0,x1) => x0.getRandomValues(x1),
      oG: x0 => x0.location,
      oH: (x0,x1) => x0.createElement(x1),
      oI: (x0,x1) => { x0.action = x1 },
      oJ: (x0,x1) => x0.getElementsByClassName(x1),
      oK: x0 => x0.frameCount,
      oL: (x0,x1) => { x0.onchange = x1 },
      oM: () => globalThis._flutter,
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: () => globalThis.crypto,
      pG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pH: (x0,x1) => x0.requestAnimationFrame(x1),
      pI: (x0,x1) => { x0.method = x1 },
      pJ: (x0,x1) => x0.dispatchEvent(x1),
      pK: x0 => x0.selectedTrack,
      pL: x0 => globalThis.URL.createObjectURL(x0),
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: l => new DataView(new ArrayBuffer(l)),
      qG: x0 => x0.history,
      qH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qI: (x0,x1) => { x0.noValidate = x1 },
      qJ: (x0,x1) => x0.createEvent(x1),
      qK: x0 => x0.completed,
      qL: x0 => x0.type,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: () => new WeakMap(),
      rG: x0 => x0.search,
      rH: x0 => x0.now(),
      rI: (x0,x1) => x0.transferFromImageBitmap(x1),
      rJ: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      rK: x0 => x0.ready,
      rL: x0 => x0.lastModified,
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      sG: x0 => x0.pathname,
      sH: x0 => x0.performance,
      sI: (x0,x1) => x0.getContext(x1),
      sJ: x0 => x0.readText(),
      sK: x0 => x0.tracks,
      sL: x0 => x0.name,
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      tG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      tH: (x0,x1) => x0.removeProperty(x1),
      tI: (x0,x1) => { x0.height = x1 },
      tJ: x0 => x0.clipboard,
      tK: x0 => x0.close(),
      tL: (x0,x1) => x0.item(x1),
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: () => new AbortController(),
      uG: o => Object.keys(o),
      uH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      uI: (x0,x1) => { x0.width = x1 },
      uJ: (x0,x1) => x0.writeText(x1),
      uK: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      uL: x0 => x0.length,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      vG: x0 => x0.state,
      vH: x0 => x0.parentElement,
      vI: x0 => x0.height,
      vJ: x0 => x0.unlock(),
      vK: (x0,x1) => x0.decode(x1),
      vL: x0 => x0.files,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: (x0,x1) => globalThis.fetch(x0,x1),
      wG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      wH: (x0,x1) => x0.removeAttribute(x1),
      wI: x0 => x0.width,
      wJ: (x0,x1) => x0.lock(x1),
      wK: x0 => x0.displayHeight,
      wL: x0 => x0.target,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: (x0,x1) => x0.get(x1),
      xG: (x0,x1) => x0.go(x1),
      xH: x0 => x0.id,
      xI: x0 => x0.rasterEndMilliseconds,
      xJ: x0 => x0.orientation,
      xK: x0 => x0.displayWidth,
      xL: (x0,x1) => x0.replaceChildren(x1),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      yG: x0 => x0.state,
      yH: (x0,x1) => x0.querySelectorAll(x1),
      yI: x0 => x0.rasterStartMilliseconds,
      yJ: (x0,x1) => x0.querySelector(x1),
      yK: x0 => x0.duration,
      yL: x0 => x0.click(),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: (x0,x1) => x0.forEach(x1),
      zG: (x0,x1) => x0.sendEnvelope(x1),
      zH: x0 => x0.isConnected,
      zI: x0 => x0.imageBitmaps,
      zJ: (x0,x1) => { x0.title = x1 },
      zK: x0 => x0.image,
      zL: (x0,x1,x2) => x0.setAttribute(x1,x2),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
