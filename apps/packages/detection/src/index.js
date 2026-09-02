import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../../node_modules/.bun/graphology-utils@2.5.2+6368c1bed9f3b4f1/node_modules/graphology-utils/defaults.js
var require_defaults = __commonJS((exports, module) => {
  function isLeaf(o) {
    return !o || typeof o !== "object" || typeof o === "function" || Array.isArray(o) || o instanceof Set || o instanceof Map || o instanceof RegExp || o instanceof Date;
  }
  function resolveDefaults(target, defaults) {
    target = target || {};
    var output = {};
    for (var k in defaults) {
      var existing = target[k];
      var def = defaults[k];
      if (!isLeaf(def)) {
        output[k] = resolveDefaults(existing, def);
        continue;
      }
      if (existing === undefined) {
        output[k] = def;
      } else {
        output[k] = existing;
      }
    }
    return output;
  }
  module.exports = resolveDefaults;
});

// ../../node_modules/.bun/graphology-utils@2.5.2+6368c1bed9f3b4f1/node_modules/graphology-utils/is-graph.js
var require_is_graph = __commonJS((exports, module) => {
  module.exports = function isGraph(value) {
    return value !== null && typeof value === "object" && typeof value.addUndirectedEdgeWithKey === "function" && typeof value.dropNode === "function" && typeof value.multi === "boolean";
  };
});

// ../../node_modules/.bun/graphology-utils@2.5.2+6368c1bed9f3b4f1/node_modules/graphology-utils/infer-type.js
var require_infer_type = __commonJS((exports, module) => {
  var isGraph = require_is_graph();
  module.exports = function inferType(graph) {
    if (!isGraph(graph))
      throw new Error("graphology-utils/infer-type: expecting a valid graphology instance.");
    var declaredType = graph.type;
    if (declaredType !== "mixed")
      return declaredType;
    if (graph.directedSize === 0 && graph.undirectedSize === 0 || graph.directedSize > 0 && graph.undirectedSize > 0)
      return "mixed";
    if (graph.directedSize > 0)
      return "directed";
    return "undirected";
  };
});

// ../../node_modules/.bun/obliterator@2.0.5/node_modules/obliterator/iterator.js
var require_iterator = __commonJS((exports, module) => {
  function Iterator(next) {
    if (typeof next !== "function")
      throw new Error("obliterator/iterator: expecting a function!");
    this.next = next;
  }
  if (typeof Symbol !== "undefined")
    Iterator.prototype[Symbol.iterator] = function() {
      return this;
    };
  Iterator.of = function() {
    var args = arguments, l = args.length, i = 0;
    return new Iterator(function() {
      if (i >= l)
        return { done: true };
      return { done: false, value: args[i++] };
    });
  };
  Iterator.empty = function() {
    var iterator = new Iterator(function() {
      return { done: true };
    });
    return iterator;
  };
  Iterator.fromSequence = function(sequence) {
    var i = 0, l = sequence.length;
    return new Iterator(function() {
      if (i >= l)
        return { done: true };
      return { done: false, value: sequence[i++] };
    });
  };
  Iterator.is = function(value) {
    if (value instanceof Iterator)
      return true;
    return typeof value === "object" && value !== null && typeof value.next === "function";
  };
  module.exports = Iterator;
});

// ../../node_modules/.bun/mnemonist@0.39.8/node_modules/mnemonist/utils/typed-arrays.js
var require_typed_arrays = __commonJS((exports) => {
  var MAX_8BIT_INTEGER = Math.pow(2, 8) - 1;
  var MAX_16BIT_INTEGER = Math.pow(2, 16) - 1;
  var MAX_32BIT_INTEGER = Math.pow(2, 32) - 1;
  var MAX_SIGNED_8BIT_INTEGER = Math.pow(2, 7) - 1;
  var MAX_SIGNED_16BIT_INTEGER = Math.pow(2, 15) - 1;
  var MAX_SIGNED_32BIT_INTEGER = Math.pow(2, 31) - 1;
  exports.getPointerArray = function(size) {
    var maxIndex = size - 1;
    if (maxIndex <= MAX_8BIT_INTEGER)
      return Uint8Array;
    if (maxIndex <= MAX_16BIT_INTEGER)
      return Uint16Array;
    if (maxIndex <= MAX_32BIT_INTEGER)
      return Uint32Array;
    throw new Error("mnemonist: Pointer Array of size > 4294967295 is not supported.");
  };
  exports.getSignedPointerArray = function(size) {
    var maxIndex = size - 1;
    if (maxIndex <= MAX_SIGNED_8BIT_INTEGER)
      return Int8Array;
    if (maxIndex <= MAX_SIGNED_16BIT_INTEGER)
      return Int16Array;
    if (maxIndex <= MAX_SIGNED_32BIT_INTEGER)
      return Int32Array;
    return Float64Array;
  };
  exports.getNumberType = function(value) {
    if (value === (value | 0)) {
      if (Math.sign(value) === -1) {
        if (value <= 127 && value >= -128)
          return Int8Array;
        if (value <= 32767 && value >= -32768)
          return Int16Array;
        return Int32Array;
      } else {
        if (value <= 255)
          return Uint8Array;
        if (value <= 65535)
          return Uint16Array;
        return Uint32Array;
      }
    }
    return Float64Array;
  };
  var TYPE_PRIORITY = {
    Uint8Array: 1,
    Int8Array: 2,
    Uint16Array: 3,
    Int16Array: 4,
    Uint32Array: 5,
    Int32Array: 6,
    Float32Array: 7,
    Float64Array: 8
  };
  exports.getMinimalRepresentation = function(array, getter) {
    var maxType = null, maxPriority = 0, p, t, v, i, l;
    for (i = 0, l = array.length;i < l; i++) {
      v = getter ? getter(array[i]) : array[i];
      t = exports.getNumberType(v);
      p = TYPE_PRIORITY[t.name];
      if (p > maxPriority) {
        maxPriority = p;
        maxType = t;
      }
    }
    return maxType;
  };
  exports.isTypedArray = function(value) {
    return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
  };
  exports.concat = function() {
    var length = 0, i, o, l;
    for (i = 0, l = arguments.length;i < l; i++)
      length += arguments[i].length;
    var array = new arguments[0].constructor(length);
    for (i = 0, o = 0;i < l; i++) {
      array.set(arguments[i], o);
      o += arguments[i].length;
    }
    return array;
  };
  exports.indices = function(length) {
    var PointerArray = exports.getPointerArray(length);
    var array = new PointerArray(length);
    for (var i = 0;i < length; i++)
      array[i] = i;
    return array;
  };
});

// ../../node_modules/.bun/mnemonist@0.39.8/node_modules/mnemonist/sparse-map.js
var require_sparse_map = __commonJS((exports, module) => {
  var Iterator = require_iterator();
  var getPointerArray = require_typed_arrays().getPointerArray;
  function SparseMap(Values, length) {
    if (arguments.length < 2) {
      length = Values;
      Values = Array;
    }
    var ByteArray = getPointerArray(length);
    this.size = 0;
    this.length = length;
    this.dense = new ByteArray(length);
    this.sparse = new ByteArray(length);
    this.vals = new Values(length);
  }
  SparseMap.prototype.clear = function() {
    this.size = 0;
  };
  SparseMap.prototype.has = function(member) {
    var index = this.sparse[member];
    return index < this.size && this.dense[index] === member;
  };
  SparseMap.prototype.get = function(member) {
    var index = this.sparse[member];
    if (index < this.size && this.dense[index] === member)
      return this.vals[index];
    return;
  };
  SparseMap.prototype.set = function(member, value) {
    var index = this.sparse[member];
    if (index < this.size && this.dense[index] === member) {
      this.vals[index] = value;
      return this;
    }
    this.dense[this.size] = member;
    this.sparse[member] = this.size;
    this.vals[this.size] = value;
    this.size++;
    return this;
  };
  SparseMap.prototype.delete = function(member) {
    var index = this.sparse[member];
    if (index >= this.size || this.dense[index] !== member)
      return false;
    index = this.dense[this.size - 1];
    this.dense[this.sparse[member]] = index;
    this.sparse[index] = this.sparse[member];
    this.size--;
    return true;
  };
  SparseMap.prototype.forEach = function(callback, scope) {
    scope = arguments.length > 1 ? scope : this;
    for (var i = 0;i < this.size; i++)
      callback.call(scope, this.vals[i], this.dense[i]);
  };
  SparseMap.prototype.keys = function() {
    var size = this.size, dense = this.dense, i = 0;
    return new Iterator(function() {
      if (i < size) {
        var item = dense[i];
        i++;
        return {
          value: item
        };
      }
      return {
        done: true
      };
    });
  };
  SparseMap.prototype.values = function() {
    var size = this.size, values = this.vals, i = 0;
    return new Iterator(function() {
      if (i < size) {
        var item = values[i];
        i++;
        return {
          value: item
        };
      }
      return {
        done: true
      };
    });
  };
  SparseMap.prototype.entries = function() {
    var size = this.size, dense = this.dense, values = this.vals, i = 0;
    return new Iterator(function() {
      if (i < size) {
        var item = [dense[i], values[i]];
        i++;
        return {
          value: item
        };
      }
      return {
        done: true
      };
    });
  };
  if (typeof Symbol !== "undefined")
    SparseMap.prototype[Symbol.iterator] = SparseMap.prototype.entries;
  SparseMap.prototype.inspect = function() {
    var proxy = new Map;
    for (var i = 0;i < this.size; i++)
      proxy.set(this.dense[i], this.vals[i]);
    Object.defineProperty(proxy, "constructor", {
      value: SparseMap,
      enumerable: false
    });
    proxy.length = this.length;
    if (this.vals.constructor !== Array)
      proxy.type = this.vals.constructor.name;
    return proxy;
  };
  if (typeof Symbol !== "undefined")
    SparseMap.prototype[Symbol.for("nodejs.util.inspect.custom")] = SparseMap.prototype.inspect;
  module.exports = SparseMap;
});

// ../../node_modules/.bun/mnemonist@0.39.8/node_modules/mnemonist/sparse-queue-set.js
var require_sparse_queue_set = __commonJS((exports, module) => {
  var Iterator = require_iterator();
  var getPointerArray = require_typed_arrays().getPointerArray;
  function SparseQueueSet(capacity) {
    var ByteArray = getPointerArray(capacity);
    this.start = 0;
    this.size = 0;
    this.capacity = capacity;
    this.dense = new ByteArray(capacity);
    this.sparse = new ByteArray(capacity);
  }
  SparseQueueSet.prototype.clear = function() {
    this.start = 0;
    this.size = 0;
  };
  SparseQueueSet.prototype.has = function(member) {
    if (this.size === 0)
      return false;
    var index = this.sparse[member];
    var inBounds = index < this.capacity && (index >= this.start && index < this.start + this.size) || index < (this.start + this.size) % this.capacity;
    return inBounds && this.dense[index] === member;
  };
  SparseQueueSet.prototype.enqueue = function(member) {
    var index = this.sparse[member];
    if (this.size !== 0) {
      var inBounds = index < this.capacity && (index >= this.start && index < this.start + this.size) || index < (this.start + this.size) % this.capacity;
      if (inBounds && this.dense[index] === member)
        return this;
    }
    index = (this.start + this.size) % this.capacity;
    this.dense[index] = member;
    this.sparse[member] = index;
    this.size++;
    return this;
  };
  SparseQueueSet.prototype.dequeue = function() {
    if (this.size === 0)
      return;
    var index = this.start;
    this.size--;
    this.start++;
    if (this.start === this.capacity)
      this.start = 0;
    var member = this.dense[index];
    this.sparse[member] = this.capacity;
    return member;
  };
  SparseQueueSet.prototype.forEach = function(callback, scope) {
    scope = arguments.length > 1 ? scope : this;
    var c = this.capacity, l = this.size, i = this.start, j = 0;
    while (j < l) {
      callback.call(scope, this.dense[i], j, this);
      i++;
      j++;
      if (i === c)
        i = 0;
    }
  };
  SparseQueueSet.prototype.values = function() {
    var dense = this.dense, c = this.capacity, l = this.size, i = this.start, j = 0;
    return new Iterator(function() {
      if (j >= l)
        return {
          done: true
        };
      var value = dense[i];
      i++;
      j++;
      if (i === c)
        i = 0;
      return {
        value,
        done: false
      };
    });
  };
  if (typeof Symbol !== "undefined")
    SparseQueueSet.prototype[Symbol.iterator] = SparseQueueSet.prototype.values;
  SparseQueueSet.prototype.inspect = function() {
    var proxy = [];
    this.forEach(function(member) {
      proxy.push(member);
    });
    Object.defineProperty(proxy, "constructor", {
      value: SparseQueueSet,
      enumerable: false
    });
    proxy.capacity = this.capacity;
    return proxy;
  };
  if (typeof Symbol !== "undefined")
    SparseQueueSet.prototype[Symbol.for("nodejs.util.inspect.custom")] = SparseQueueSet.prototype.inspect;
  module.exports = SparseQueueSet;
});

// ../../node_modules/.bun/pandemonium@2.4.1/node_modules/pandemonium/random-index.js
var require_random_index = __commonJS((exports, module) => {
  function createRandomIndex(rng) {
    return function(length) {
      if (typeof length !== "number")
        length = length.length;
      return Math.floor(rng() * length);
    };
  }
  var randomIndex = createRandomIndex(Math.random);
  randomIndex.createRandomIndex = createRandomIndex;
  module.exports = randomIndex;
});

// ../../node_modules/.bun/graphology-utils@2.5.2+6368c1bed9f3b4f1/node_modules/graphology-utils/getters.js
var require_getters = __commonJS((exports) => {
  function coerceWeight(value) {
    if (typeof value !== "number" || isNaN(value))
      return 1;
    return value;
  }
  function createNodeValueGetter(nameOrFunction, defaultValue) {
    var getter = {};
    var coerceToDefault = function(v) {
      if (typeof v === "undefined")
        return defaultValue;
      return v;
    };
    if (typeof defaultValue === "function")
      coerceToDefault = defaultValue;
    var get = function(attributes) {
      return coerceToDefault(attributes[nameOrFunction]);
    };
    var returnDefault = function() {
      return coerceToDefault(undefined);
    };
    if (typeof nameOrFunction === "string") {
      getter.fromAttributes = get;
      getter.fromGraph = function(graph, node) {
        return get(graph.getNodeAttributes(node));
      };
      getter.fromEntry = function(node, attributes) {
        return get(attributes);
      };
    } else if (typeof nameOrFunction === "function") {
      getter.fromAttributes = function() {
        throw new Error("graphology-utils/getters/createNodeValueGetter: irrelevant usage.");
      };
      getter.fromGraph = function(graph, node) {
        return coerceToDefault(nameOrFunction(node, graph.getNodeAttributes(node)));
      };
      getter.fromEntry = function(node, attributes) {
        return coerceToDefault(nameOrFunction(node, attributes));
      };
    } else {
      getter.fromAttributes = returnDefault;
      getter.fromGraph = returnDefault;
      getter.fromEntry = returnDefault;
    }
    return getter;
  }
  function createEdgeValueGetter(nameOrFunction, defaultValue) {
    var getter = {};
    var coerceToDefault = function(v) {
      if (typeof v === "undefined")
        return defaultValue;
      return v;
    };
    if (typeof defaultValue === "function")
      coerceToDefault = defaultValue;
    var get = function(attributes) {
      return coerceToDefault(attributes[nameOrFunction]);
    };
    var returnDefault = function() {
      return coerceToDefault(undefined);
    };
    if (typeof nameOrFunction === "string") {
      getter.fromAttributes = get;
      getter.fromGraph = function(graph, edge) {
        return get(graph.getEdgeAttributes(edge));
      };
      getter.fromEntry = function(edge, attributes) {
        return get(attributes);
      };
      getter.fromPartialEntry = getter.fromEntry;
      getter.fromMinimalEntry = getter.fromEntry;
    } else if (typeof nameOrFunction === "function") {
      getter.fromAttributes = function() {
        throw new Error("graphology-utils/getters/createEdgeValueGetter: irrelevant usage.");
      };
      getter.fromGraph = function(graph, edge) {
        var extremities = graph.extremities(edge);
        return coerceToDefault(nameOrFunction(edge, graph.getEdgeAttributes(edge), extremities[0], extremities[1], graph.getNodeAttributes(extremities[0]), graph.getNodeAttributes(extremities[1]), graph.isUndirected(edge)));
      };
      getter.fromEntry = function(e, a, s, t, sa, ta, u) {
        return coerceToDefault(nameOrFunction(e, a, s, t, sa, ta, u));
      };
      getter.fromPartialEntry = function(e, a, s, t) {
        return coerceToDefault(nameOrFunction(e, a, s, t));
      };
      getter.fromMinimalEntry = function(e, a) {
        return coerceToDefault(nameOrFunction(e, a));
      };
    } else {
      getter.fromAttributes = returnDefault;
      getter.fromGraph = returnDefault;
      getter.fromEntry = returnDefault;
      getter.fromMinimalEntry = returnDefault;
    }
    return getter;
  }
  exports.createNodeValueGetter = createNodeValueGetter;
  exports.createEdgeValueGetter = createEdgeValueGetter;
  exports.createEdgeWeightGetter = function(name) {
    return createEdgeValueGetter(name, coerceWeight);
  };
});

// ../../node_modules/.bun/graphology-indices@0.17.0+6368c1bed9f3b4f1/node_modules/graphology-indices/louvain.js
var require_louvain = __commonJS((exports) => {
  var typed = require_typed_arrays();
  var resolveDefaults = require_defaults();
  var createEdgeWeightGetter = require_getters().createEdgeWeightGetter;
  var INSPECT = Symbol.for("nodejs.util.inspect.custom");
  var DEFAULTS = {
    getEdgeWeight: "weight",
    keepDendrogram: false,
    resolution: 1
  };
  function UndirectedLouvainIndex(graph, options) {
    options = resolveDefaults(options, DEFAULTS);
    var resolution = options.resolution;
    var getEdgeWeight = createEdgeWeightGetter(options.getEdgeWeight).fromEntry;
    var size = (graph.size - graph.selfLoopCount) * 2;
    var NeighborhoodPointerArray = typed.getPointerArray(size);
    var NodesPointerArray = typed.getPointerArray(graph.order + 1);
    var WeightsArray = options.getEdgeWeight ? Float64Array : typed.getPointerArray(graph.size * 2);
    this.C = graph.order;
    this.M = 0;
    this.E = size;
    this.U = 0;
    this.resolution = resolution;
    this.level = 0;
    this.graph = graph;
    this.nodes = new Array(graph.order);
    this.keepDendrogram = options.keepDendrogram;
    this.neighborhood = new NodesPointerArray(size);
    this.weights = new WeightsArray(size);
    this.loops = new WeightsArray(graph.order);
    this.starts = new NeighborhoodPointerArray(graph.order + 1);
    this.belongings = new NodesPointerArray(graph.order);
    this.dendrogram = [];
    this.mapping = null;
    this.counts = new NodesPointerArray(graph.order);
    this.unused = new NodesPointerArray(graph.order);
    this.totalWeights = new WeightsArray(graph.order);
    var ids = {};
    var weight;
    var i = 0, n = 0;
    var self2 = this;
    graph.forEachNode(function(node) {
      self2.nodes[i] = node;
      ids[node] = i;
      n += graph.undirectedDegreeWithoutSelfLoops(node);
      self2.starts[i] = n;
      self2.belongings[i] = i;
      self2.counts[i] = 1;
      i++;
    });
    graph.forEachEdge(function(edge, attr, source, target, sa, ta, u) {
      weight = getEdgeWeight(edge, attr, source, target, sa, ta, u);
      source = ids[source];
      target = ids[target];
      self2.M += weight;
      if (source === target) {
        self2.totalWeights[source] += weight * 2;
        self2.loops[source] = weight * 2;
      } else {
        self2.totalWeights[source] += weight;
        self2.totalWeights[target] += weight;
        var startSource = --self2.starts[source], startTarget = --self2.starts[target];
        self2.neighborhood[startSource] = target;
        self2.neighborhood[startTarget] = source;
        self2.weights[startSource] = weight;
        self2.weights[startTarget] = weight;
      }
    });
    this.starts[i] = this.E;
    if (this.keepDendrogram)
      this.dendrogram.push(this.belongings.slice());
    else
      this.mapping = this.belongings.slice();
  }
  UndirectedLouvainIndex.prototype.isolate = function(i, degree) {
    var currentCommunity = this.belongings[i];
    if (this.counts[currentCommunity] === 1)
      return currentCommunity;
    var newCommunity = this.unused[--this.U];
    var loops = this.loops[i];
    this.totalWeights[currentCommunity] -= degree + loops;
    this.totalWeights[newCommunity] += degree + loops;
    this.belongings[i] = newCommunity;
    this.counts[currentCommunity]--;
    this.counts[newCommunity]++;
    return newCommunity;
  };
  UndirectedLouvainIndex.prototype.move = function(i, degree, targetCommunity) {
    var currentCommunity = this.belongings[i], loops = this.loops[i];
    this.totalWeights[currentCommunity] -= degree + loops;
    this.totalWeights[targetCommunity] += degree + loops;
    this.belongings[i] = targetCommunity;
    var nowEmpty = this.counts[currentCommunity]-- === 1;
    this.counts[targetCommunity]++;
    if (nowEmpty)
      this.unused[this.U++] = currentCommunity;
  };
  UndirectedLouvainIndex.prototype.computeNodeDegree = function(i) {
    var o, l, weight;
    var degree = 0;
    for (o = this.starts[i], l = this.starts[i + 1];o < l; o++) {
      weight = this.weights[o];
      degree += weight;
    }
    return degree;
  };
  UndirectedLouvainIndex.prototype.expensiveIsolate = function(i) {
    var degree = this.computeNodeDegree(i);
    return this.isolate(i, degree);
  };
  UndirectedLouvainIndex.prototype.expensiveMove = function(i, ci) {
    var degree = this.computeNodeDegree(i);
    this.move(i, degree, ci);
  };
  UndirectedLouvainIndex.prototype.zoomOut = function() {
    var inducedGraph = new Array(this.C - this.U), newLabels = {};
    var N = this.nodes.length;
    var C = 0, E = 0;
    var i, j, l, m, n, ci, cj, data, adj;
    for (i = 0, l = this.C;i < l; i++) {
      ci = this.belongings[i];
      if (!(ci in newLabels)) {
        newLabels[ci] = C;
        inducedGraph[C] = {
          adj: {},
          totalWeights: this.totalWeights[ci],
          internalWeights: 0
        };
        C++;
      }
      this.belongings[i] = newLabels[ci];
    }
    var currentLevel, nextLevel;
    if (this.keepDendrogram) {
      currentLevel = this.dendrogram[this.level];
      nextLevel = new (typed.getPointerArray(C))(N);
      for (i = 0;i < N; i++)
        nextLevel[i] = this.belongings[currentLevel[i]];
      this.dendrogram.push(nextLevel);
    } else {
      for (i = 0;i < N; i++)
        this.mapping[i] = this.belongings[this.mapping[i]];
    }
    for (i = 0, l = this.C;i < l; i++) {
      ci = this.belongings[i];
      data = inducedGraph[ci];
      adj = data.adj;
      data.internalWeights += this.loops[i];
      for (j = this.starts[i], m = this.starts[i + 1];j < m; j++) {
        n = this.neighborhood[j];
        cj = this.belongings[n];
        if (ci === cj) {
          data.internalWeights += this.weights[j];
          continue;
        }
        if (!(cj in adj))
          adj[cj] = 0;
        adj[cj] += this.weights[j];
      }
    }
    this.C = C;
    n = 0;
    for (ci = 0;ci < C; ci++) {
      data = inducedGraph[ci];
      adj = data.adj;
      ci = +ci;
      this.totalWeights[ci] = data.totalWeights;
      this.loops[ci] = data.internalWeights;
      this.counts[ci] = 1;
      this.starts[ci] = n;
      this.belongings[ci] = ci;
      for (cj in adj) {
        this.neighborhood[n] = +cj;
        this.weights[n] = adj[cj];
        E++;
        n++;
      }
    }
    this.starts[C] = E;
    this.E = E;
    this.U = 0;
    this.level++;
    return newLabels;
  };
  UndirectedLouvainIndex.prototype.modularity = function() {
    var ci, cj, i, j, m;
    var Q = 0;
    var M2 = this.M * 2;
    var internalWeights = new Float64Array(this.C);
    for (i = 0;i < this.C; i++) {
      ci = this.belongings[i];
      internalWeights[ci] += this.loops[i];
      for (j = this.starts[i], m = this.starts[i + 1];j < m; j++) {
        cj = this.belongings[this.neighborhood[j]];
        if (ci !== cj)
          continue;
        internalWeights[ci] += this.weights[j];
      }
    }
    for (i = 0;i < this.C; i++) {
      Q += internalWeights[i] / M2 - Math.pow(this.totalWeights[i] / M2, 2) * this.resolution;
    }
    return Q;
  };
  UndirectedLouvainIndex.prototype.delta = function(i, degree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalWeight = this.totalWeights[targetCommunity];
    degree += this.loops[i];
    return targetCommunityDegree / M - targetCommunityTotalWeight * degree * this.resolution / (2 * M * M);
  };
  UndirectedLouvainIndex.prototype.deltaWithOwnCommunity = function(i, degree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalWeight = this.totalWeights[targetCommunity];
    degree += this.loops[i];
    return targetCommunityDegree / M - (targetCommunityTotalWeight - degree) * degree * this.resolution / (2 * M * M);
  };
  UndirectedLouvainIndex.prototype.fastDelta = function(i, degree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalWeight = this.totalWeights[targetCommunity];
    degree += this.loops[i];
    return targetCommunityDegree - degree * targetCommunityTotalWeight * this.resolution / (2 * M);
  };
  UndirectedLouvainIndex.prototype.fastDeltaWithOwnCommunity = function(i, degree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalWeight = this.totalWeights[targetCommunity];
    degree += this.loops[i];
    return targetCommunityDegree - degree * (targetCommunityTotalWeight - degree) * this.resolution / (2 * M);
  };
  UndirectedLouvainIndex.prototype.bounds = function(i) {
    return [this.starts[i], this.starts[i + 1]];
  };
  UndirectedLouvainIndex.prototype.project = function() {
    var self2 = this;
    var projection = {};
    self2.nodes.slice(0, this.C).forEach(function(node, i) {
      projection[node] = Array.from(self2.neighborhood.slice(self2.starts[i], self2.starts[i + 1])).map(function(j) {
        return self2.nodes[j];
      });
    });
    return projection;
  };
  UndirectedLouvainIndex.prototype.collect = function(level) {
    if (arguments.length < 1)
      level = this.level;
    var o = {};
    var mapping = this.keepDendrogram ? this.dendrogram[level] : this.mapping;
    var i, l;
    for (i = 0, l = mapping.length;i < l; i++)
      o[this.nodes[i]] = mapping[i];
    return o;
  };
  UndirectedLouvainIndex.prototype.assign = function(prop, level) {
    if (arguments.length < 2)
      level = this.level;
    var mapping = this.keepDendrogram ? this.dendrogram[level] : this.mapping;
    var i, l;
    for (i = 0, l = mapping.length;i < l; i++)
      this.graph.setNodeAttribute(this.nodes[i], prop, mapping[i]);
  };
  UndirectedLouvainIndex.prototype[INSPECT] = function() {
    var proxy = {};
    Object.defineProperty(proxy, "constructor", {
      value: UndirectedLouvainIndex,
      enumerable: false
    });
    proxy.C = this.C;
    proxy.M = this.M;
    proxy.E = this.E;
    proxy.U = this.U;
    proxy.resolution = this.resolution;
    proxy.level = this.level;
    proxy.nodes = this.nodes;
    proxy.starts = this.starts.slice(0, proxy.C + 1);
    var eTruncated = ["neighborhood", "weights"];
    var cTruncated = ["counts", "loops", "belongings", "totalWeights"];
    var self2 = this;
    eTruncated.forEach(function(key) {
      proxy[key] = self2[key].slice(0, proxy.E);
    });
    cTruncated.forEach(function(key) {
      proxy[key] = self2[key].slice(0, proxy.C);
    });
    proxy.unused = this.unused.slice(0, this.U);
    if (this.keepDendrogram)
      proxy.dendrogram = this.dendrogram;
    else
      proxy.mapping = this.mapping;
    return proxy;
  };
  function DirectedLouvainIndex(graph, options) {
    options = resolveDefaults(options, DEFAULTS);
    var resolution = options.resolution;
    var getEdgeWeight = createEdgeWeightGetter(options.getEdgeWeight).fromEntry;
    var size = (graph.size - graph.selfLoopCount) * 2;
    var NeighborhoodPointerArray = typed.getPointerArray(size);
    var NodesPointerArray = typed.getPointerArray(graph.order + 1);
    var WeightsArray = options.getEdgeWeight ? Float64Array : typed.getPointerArray(graph.size * 2);
    this.C = graph.order;
    this.M = 0;
    this.E = size;
    this.U = 0;
    this.resolution = resolution;
    this.level = 0;
    this.graph = graph;
    this.nodes = new Array(graph.order);
    this.keepDendrogram = options.keepDendrogram;
    this.neighborhood = new NodesPointerArray(size);
    this.weights = new WeightsArray(size);
    this.loops = new WeightsArray(graph.order);
    this.starts = new NeighborhoodPointerArray(graph.order + 1);
    this.offsets = new NeighborhoodPointerArray(graph.order);
    this.belongings = new NodesPointerArray(graph.order);
    this.dendrogram = [];
    this.counts = new NodesPointerArray(graph.order);
    this.unused = new NodesPointerArray(graph.order);
    this.totalInWeights = new WeightsArray(graph.order);
    this.totalOutWeights = new WeightsArray(graph.order);
    var ids = {};
    var weight;
    var i = 0, n = 0;
    var self2 = this;
    graph.forEachNode(function(node) {
      self2.nodes[i] = node;
      ids[node] = i;
      n += graph.outDegreeWithoutSelfLoops(node);
      self2.starts[i] = n;
      n += graph.inDegreeWithoutSelfLoops(node);
      self2.offsets[i] = n;
      self2.belongings[i] = i;
      self2.counts[i] = 1;
      i++;
    });
    graph.forEachEdge(function(edge, attr, source, target, sa, ta, u) {
      weight = getEdgeWeight(edge, attr, source, target, sa, ta, u);
      source = ids[source];
      target = ids[target];
      self2.M += weight;
      if (source === target) {
        self2.loops[source] += weight;
        self2.totalInWeights[source] += weight;
        self2.totalOutWeights[source] += weight;
      } else {
        self2.totalOutWeights[source] += weight;
        self2.totalInWeights[target] += weight;
        var startSource = --self2.starts[source], startTarget = --self2.offsets[target];
        self2.neighborhood[startSource] = target;
        self2.neighborhood[startTarget] = source;
        self2.weights[startSource] = weight;
        self2.weights[startTarget] = weight;
      }
    });
    this.starts[i] = this.E;
    if (this.keepDendrogram)
      this.dendrogram.push(this.belongings.slice());
    else
      this.mapping = this.belongings.slice();
  }
  DirectedLouvainIndex.prototype.bounds = UndirectedLouvainIndex.prototype.bounds;
  DirectedLouvainIndex.prototype.inBounds = function(i) {
    return [this.offsets[i], this.starts[i + 1]];
  };
  DirectedLouvainIndex.prototype.outBounds = function(i) {
    return [this.starts[i], this.offsets[i]];
  };
  DirectedLouvainIndex.prototype.project = UndirectedLouvainIndex.prototype.project;
  DirectedLouvainIndex.prototype.projectIn = function() {
    var self2 = this;
    var projection = {};
    self2.nodes.slice(0, this.C).forEach(function(node, i) {
      projection[node] = Array.from(self2.neighborhood.slice(self2.offsets[i], self2.starts[i + 1])).map(function(j) {
        return self2.nodes[j];
      });
    });
    return projection;
  };
  DirectedLouvainIndex.prototype.projectOut = function() {
    var self2 = this;
    var projection = {};
    self2.nodes.slice(0, this.C).forEach(function(node, i) {
      projection[node] = Array.from(self2.neighborhood.slice(self2.starts[i], self2.offsets[i])).map(function(j) {
        return self2.nodes[j];
      });
    });
    return projection;
  };
  DirectedLouvainIndex.prototype.isolate = function(i, inDegree, outDegree) {
    var currentCommunity = this.belongings[i];
    if (this.counts[currentCommunity] === 1)
      return currentCommunity;
    var newCommunity = this.unused[--this.U];
    var loops = this.loops[i];
    this.totalInWeights[currentCommunity] -= inDegree + loops;
    this.totalInWeights[newCommunity] += inDegree + loops;
    this.totalOutWeights[currentCommunity] -= outDegree + loops;
    this.totalOutWeights[newCommunity] += outDegree + loops;
    this.belongings[i] = newCommunity;
    this.counts[currentCommunity]--;
    this.counts[newCommunity]++;
    return newCommunity;
  };
  DirectedLouvainIndex.prototype.move = function(i, inDegree, outDegree, targetCommunity) {
    var currentCommunity = this.belongings[i], loops = this.loops[i];
    this.totalInWeights[currentCommunity] -= inDegree + loops;
    this.totalInWeights[targetCommunity] += inDegree + loops;
    this.totalOutWeights[currentCommunity] -= outDegree + loops;
    this.totalOutWeights[targetCommunity] += outDegree + loops;
    this.belongings[i] = targetCommunity;
    var nowEmpty = this.counts[currentCommunity]-- === 1;
    this.counts[targetCommunity]++;
    if (nowEmpty)
      this.unused[this.U++] = currentCommunity;
  };
  DirectedLouvainIndex.prototype.computeNodeInDegree = function(i) {
    var o, l, weight;
    var inDegree = 0;
    for (o = this.offsets[i], l = this.starts[i + 1];o < l; o++) {
      weight = this.weights[o];
      inDegree += weight;
    }
    return inDegree;
  };
  DirectedLouvainIndex.prototype.computeNodeOutDegree = function(i) {
    var o, l, weight;
    var outDegree = 0;
    for (o = this.starts[i], l = this.offsets[i];o < l; o++) {
      weight = this.weights[o];
      outDegree += weight;
    }
    return outDegree;
  };
  DirectedLouvainIndex.prototype.expensiveMove = function(i, ci) {
    var inDegree = this.computeNodeInDegree(i), outDegree = this.computeNodeOutDegree(i);
    this.move(i, inDegree, outDegree, ci);
  };
  DirectedLouvainIndex.prototype.zoomOut = function() {
    var inducedGraph = new Array(this.C - this.U), newLabels = {};
    var N = this.nodes.length;
    var C = 0, E = 0;
    var i, j, l, m, n, ci, cj, data, offset, out, adj, inAdj, outAdj;
    for (i = 0, l = this.C;i < l; i++) {
      ci = this.belongings[i];
      if (!(ci in newLabels)) {
        newLabels[ci] = C;
        inducedGraph[C] = {
          inAdj: {},
          outAdj: {},
          totalInWeights: this.totalInWeights[ci],
          totalOutWeights: this.totalOutWeights[ci],
          internalWeights: 0
        };
        C++;
      }
      this.belongings[i] = newLabels[ci];
    }
    var currentLevel, nextLevel;
    if (this.keepDendrogram) {
      currentLevel = this.dendrogram[this.level];
      nextLevel = new (typed.getPointerArray(C))(N);
      for (i = 0;i < N; i++)
        nextLevel[i] = this.belongings[currentLevel[i]];
      this.dendrogram.push(nextLevel);
    } else {
      for (i = 0;i < N; i++)
        this.mapping[i] = this.belongings[this.mapping[i]];
    }
    for (i = 0, l = this.C;i < l; i++) {
      ci = this.belongings[i];
      offset = this.offsets[i];
      data = inducedGraph[ci];
      inAdj = data.inAdj;
      outAdj = data.outAdj;
      data.internalWeights += this.loops[i];
      for (j = this.starts[i], m = this.starts[i + 1];j < m; j++) {
        n = this.neighborhood[j];
        cj = this.belongings[n];
        out = j < offset;
        adj = out ? outAdj : inAdj;
        if (ci === cj) {
          if (out)
            data.internalWeights += this.weights[j];
          continue;
        }
        if (!(cj in adj))
          adj[cj] = 0;
        adj[cj] += this.weights[j];
      }
    }
    this.C = C;
    n = 0;
    for (ci = 0;ci < C; ci++) {
      data = inducedGraph[ci];
      inAdj = data.inAdj;
      outAdj = data.outAdj;
      ci = +ci;
      this.totalInWeights[ci] = data.totalInWeights;
      this.totalOutWeights[ci] = data.totalOutWeights;
      this.loops[ci] = data.internalWeights;
      this.counts[ci] = 1;
      this.starts[ci] = n;
      this.belongings[ci] = ci;
      for (cj in outAdj) {
        this.neighborhood[n] = +cj;
        this.weights[n] = outAdj[cj];
        E++;
        n++;
      }
      this.offsets[ci] = n;
      for (cj in inAdj) {
        this.neighborhood[n] = +cj;
        this.weights[n] = inAdj[cj];
        E++;
        n++;
      }
    }
    this.starts[C] = E;
    this.E = E;
    this.U = 0;
    this.level++;
    return newLabels;
  };
  DirectedLouvainIndex.prototype.modularity = function() {
    var ci, cj, i, j, m;
    var Q = 0;
    var M = this.M;
    var internalWeights = new Float64Array(this.C);
    for (i = 0;i < this.C; i++) {
      ci = this.belongings[i];
      internalWeights[ci] += this.loops[i];
      for (j = this.starts[i], m = this.offsets[i];j < m; j++) {
        cj = this.belongings[this.neighborhood[j]];
        if (ci !== cj)
          continue;
        internalWeights[ci] += this.weights[j];
      }
    }
    for (i = 0;i < this.C; i++)
      Q += internalWeights[i] / M - this.totalInWeights[i] * this.totalOutWeights[i] / Math.pow(M, 2) * this.resolution;
    return Q;
  };
  DirectedLouvainIndex.prototype.delta = function(i, inDegree, outDegree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalInWeight = this.totalInWeights[targetCommunity], targetCommunityTotalOutWeight = this.totalOutWeights[targetCommunity];
    var loops = this.loops[i];
    inDegree += loops;
    outDegree += loops;
    return targetCommunityDegree / M - (outDegree * targetCommunityTotalInWeight + inDegree * targetCommunityTotalOutWeight) * this.resolution / (M * M);
  };
  DirectedLouvainIndex.prototype.deltaWithOwnCommunity = function(i, inDegree, outDegree, targetCommunityDegree, targetCommunity) {
    var M = this.M;
    var targetCommunityTotalInWeight = this.totalInWeights[targetCommunity], targetCommunityTotalOutWeight = this.totalOutWeights[targetCommunity];
    var loops = this.loops[i];
    inDegree += loops;
    outDegree += loops;
    return targetCommunityDegree / M - (outDegree * (targetCommunityTotalInWeight - inDegree) + inDegree * (targetCommunityTotalOutWeight - outDegree)) * this.resolution / (M * M);
  };
  DirectedLouvainIndex.prototype.collect = UndirectedLouvainIndex.prototype.collect;
  DirectedLouvainIndex.prototype.assign = UndirectedLouvainIndex.prototype.assign;
  DirectedLouvainIndex.prototype[INSPECT] = function() {
    var proxy = {};
    Object.defineProperty(proxy, "constructor", {
      value: DirectedLouvainIndex,
      enumerable: false
    });
    proxy.C = this.C;
    proxy.M = this.M;
    proxy.E = this.E;
    proxy.U = this.U;
    proxy.resolution = this.resolution;
    proxy.level = this.level;
    proxy.nodes = this.nodes;
    proxy.starts = this.starts.slice(0, proxy.C + 1);
    var eTruncated = ["neighborhood", "weights"];
    var cTruncated = [
      "counts",
      "offsets",
      "loops",
      "belongings",
      "totalInWeights",
      "totalOutWeights"
    ];
    var self2 = this;
    eTruncated.forEach(function(key) {
      proxy[key] = self2[key].slice(0, proxy.E);
    });
    cTruncated.forEach(function(key) {
      proxy[key] = self2[key].slice(0, proxy.C);
    });
    proxy.unused = this.unused.slice(0, this.U);
    if (this.keepDendrogram)
      proxy.dendrogram = this.dendrogram;
    else
      proxy.mapping = this.mapping;
    return proxy;
  };
  exports.UndirectedLouvainIndex = UndirectedLouvainIndex;
  exports.DirectedLouvainIndex = DirectedLouvainIndex;
});

// ../../node_modules/.bun/graphology-communities-louvain@2.0.2+6368c1bed9f3b4f1/node_modules/graphology-communities-louvain/index.js
var require_graphology_communities_louvain = __commonJS((exports, module) => {
  var resolveDefaults = require_defaults();
  var isGraph = require_is_graph();
  var inferType = require_infer_type();
  var SparseMap = require_sparse_map();
  var SparseQueueSet = require_sparse_queue_set();
  var createRandomIndex = require_random_index().createRandomIndex;
  var indices = require_louvain();
  var UndirectedLouvainIndex = indices.UndirectedLouvainIndex;
  var DirectedLouvainIndex = indices.DirectedLouvainIndex;
  var DEFAULTS = {
    nodeCommunityAttribute: "community",
    getEdgeWeight: "weight",
    fastLocalMoves: true,
    randomWalk: true,
    resolution: 1,
    rng: Math.random
  };
  function addWeightToCommunity(map, community, weight) {
    var currentWeight = map.get(community);
    if (typeof currentWeight === "undefined")
      currentWeight = 0;
    currentWeight += weight;
    map.set(community, currentWeight);
  }
  var EPSILON = 0.0000000001;
  function tieBreaker(bestCommunity, currentCommunity, targetCommunity, delta, bestDelta) {
    if (Math.abs(delta - bestDelta) < EPSILON) {
      if (bestCommunity === currentCommunity) {
        return false;
      } else {
        return targetCommunity > bestCommunity;
      }
    } else if (delta > bestDelta) {
      return true;
    }
    return false;
  }
  function undirectedLouvain(detailed, graph, options) {
    var index = new UndirectedLouvainIndex(graph, {
      getEdgeWeight: options.getEdgeWeight,
      keepDendrogram: detailed,
      resolution: options.resolution
    });
    var randomIndex = createRandomIndex(options.rng);
    var moveWasMade = true, localMoveWasMade = true;
    var currentCommunity, targetCommunity;
    var communities = new SparseMap(Float64Array, index.C);
    var queue, start, end, weight, ci, ri, s, i, j, l;
    var degree, targetCommunityDegree;
    var bestCommunity, bestDelta, deltaIsBetter, delta;
    var deltaComputations = 0, nodesVisited = 0, moves = [], localMoves, currentMoves;
    if (options.fastLocalMoves)
      queue = new SparseQueueSet(index.C);
    while (moveWasMade) {
      l = index.C;
      moveWasMade = false;
      localMoveWasMade = true;
      if (options.fastLocalMoves) {
        currentMoves = 0;
        ri = options.randomWalk ? randomIndex(l) : 0;
        for (s = 0;s < l; s++, ri++) {
          i = ri % l;
          queue.enqueue(i);
        }
        while (queue.size !== 0) {
          i = queue.dequeue();
          nodesVisited++;
          degree = 0;
          communities.clear();
          currentCommunity = index.belongings[i];
          start = index.starts[i];
          end = index.starts[i + 1];
          for (;start < end; start++) {
            j = index.neighborhood[start];
            weight = index.weights[start];
            targetCommunity = index.belongings[j];
            degree += weight;
            addWeightToCommunity(communities, targetCommunity, weight);
          }
          bestDelta = index.fastDeltaWithOwnCommunity(i, degree, communities.get(currentCommunity) || 0, currentCommunity);
          bestCommunity = currentCommunity;
          for (ci = 0;ci < communities.size; ci++) {
            targetCommunity = communities.dense[ci];
            if (targetCommunity === currentCommunity)
              continue;
            targetCommunityDegree = communities.vals[ci];
            deltaComputations++;
            delta = index.fastDelta(i, degree, targetCommunityDegree, targetCommunity);
            deltaIsBetter = tieBreaker(bestCommunity, currentCommunity, targetCommunity, delta, bestDelta);
            if (deltaIsBetter) {
              bestDelta = delta;
              bestCommunity = targetCommunity;
            }
          }
          if (bestDelta < 0) {
            bestCommunity = index.isolate(i, degree);
            if (bestCommunity === currentCommunity)
              continue;
          } else {
            if (bestCommunity === currentCommunity) {
              continue;
            } else {
              index.move(i, degree, bestCommunity);
            }
          }
          moveWasMade = true;
          currentMoves++;
          start = index.starts[i];
          end = index.starts[i + 1];
          for (;start < end; start++) {
            j = index.neighborhood[start];
            targetCommunity = index.belongings[j];
            if (targetCommunity !== bestCommunity)
              queue.enqueue(j);
          }
        }
        moves.push(currentMoves);
      } else {
        localMoves = [];
        moves.push(localMoves);
        while (localMoveWasMade) {
          localMoveWasMade = false;
          currentMoves = 0;
          ri = options.randomWalk ? randomIndex(l) : 0;
          for (s = 0;s < l; s++, ri++) {
            i = ri % l;
            nodesVisited++;
            degree = 0;
            communities.clear();
            currentCommunity = index.belongings[i];
            start = index.starts[i];
            end = index.starts[i + 1];
            for (;start < end; start++) {
              j = index.neighborhood[start];
              weight = index.weights[start];
              targetCommunity = index.belongings[j];
              degree += weight;
              addWeightToCommunity(communities, targetCommunity, weight);
            }
            bestDelta = index.fastDeltaWithOwnCommunity(i, degree, communities.get(currentCommunity) || 0, currentCommunity);
            bestCommunity = currentCommunity;
            for (ci = 0;ci < communities.size; ci++) {
              targetCommunity = communities.dense[ci];
              if (targetCommunity === currentCommunity)
                continue;
              targetCommunityDegree = communities.vals[ci];
              deltaComputations++;
              delta = index.fastDelta(i, degree, targetCommunityDegree, targetCommunity);
              deltaIsBetter = tieBreaker(bestCommunity, currentCommunity, targetCommunity, delta, bestDelta);
              if (deltaIsBetter) {
                bestDelta = delta;
                bestCommunity = targetCommunity;
              }
            }
            if (bestDelta < 0) {
              bestCommunity = index.isolate(i, degree);
              if (bestCommunity === currentCommunity)
                continue;
            } else {
              if (bestCommunity === currentCommunity) {
                continue;
              } else {
                index.move(i, degree, bestCommunity);
              }
            }
            localMoveWasMade = true;
            currentMoves++;
          }
          localMoves.push(currentMoves);
          moveWasMade = localMoveWasMade || moveWasMade;
        }
      }
      if (moveWasMade)
        index.zoomOut();
    }
    var results = {
      index,
      deltaComputations,
      nodesVisited,
      moves
    };
    return results;
  }
  function directedLouvain(detailed, graph, options) {
    var index = new DirectedLouvainIndex(graph, {
      getEdgeWeight: options.getEdgeWeight,
      keepDendrogram: detailed,
      resolution: options.resolution
    });
    var randomIndex = createRandomIndex(options.rng);
    var moveWasMade = true, localMoveWasMade = true;
    var currentCommunity, targetCommunity;
    var communities = new SparseMap(Float64Array, index.C);
    var queue, start, end, offset, out, weight, ci, ri, s, i, j, l;
    var inDegree, outDegree, targetCommunityDegree;
    var bestCommunity, bestDelta, deltaIsBetter, delta;
    var deltaComputations = 0, nodesVisited = 0, moves = [], localMoves, currentMoves;
    if (options.fastLocalMoves)
      queue = new SparseQueueSet(index.C);
    while (moveWasMade) {
      l = index.C;
      moveWasMade = false;
      localMoveWasMade = true;
      if (options.fastLocalMoves) {
        currentMoves = 0;
        ri = options.randomWalk ? randomIndex(l) : 0;
        for (s = 0;s < l; s++, ri++) {
          i = ri % l;
          queue.enqueue(i);
        }
        while (queue.size !== 0) {
          i = queue.dequeue();
          nodesVisited++;
          inDegree = 0;
          outDegree = 0;
          communities.clear();
          currentCommunity = index.belongings[i];
          start = index.starts[i];
          end = index.starts[i + 1];
          offset = index.offsets[i];
          for (;start < end; start++) {
            out = start < offset;
            j = index.neighborhood[start];
            weight = index.weights[start];
            targetCommunity = index.belongings[j];
            if (out)
              outDegree += weight;
            else
              inDegree += weight;
            addWeightToCommunity(communities, targetCommunity, weight);
          }
          bestDelta = index.deltaWithOwnCommunity(i, inDegree, outDegree, communities.get(currentCommunity) || 0, currentCommunity);
          bestCommunity = currentCommunity;
          for (ci = 0;ci < communities.size; ci++) {
            targetCommunity = communities.dense[ci];
            if (targetCommunity === currentCommunity)
              continue;
            targetCommunityDegree = communities.vals[ci];
            deltaComputations++;
            delta = index.delta(i, inDegree, outDegree, targetCommunityDegree, targetCommunity);
            deltaIsBetter = tieBreaker(bestCommunity, currentCommunity, targetCommunity, delta, bestDelta);
            if (deltaIsBetter) {
              bestDelta = delta;
              bestCommunity = targetCommunity;
            }
          }
          if (bestDelta < 0) {
            bestCommunity = index.isolate(i, inDegree, outDegree);
            if (bestCommunity === currentCommunity)
              continue;
          } else {
            if (bestCommunity === currentCommunity) {
              continue;
            } else {
              index.move(i, inDegree, outDegree, bestCommunity);
            }
          }
          moveWasMade = true;
          currentMoves++;
          start = index.starts[i];
          end = index.starts[i + 1];
          for (;start < end; start++) {
            j = index.neighborhood[start];
            targetCommunity = index.belongings[j];
            if (targetCommunity !== bestCommunity)
              queue.enqueue(j);
          }
        }
        moves.push(currentMoves);
      } else {
        localMoves = [];
        moves.push(localMoves);
        while (localMoveWasMade) {
          localMoveWasMade = false;
          currentMoves = 0;
          ri = options.randomWalk ? randomIndex(l) : 0;
          for (s = 0;s < l; s++, ri++) {
            i = ri % l;
            nodesVisited++;
            inDegree = 0;
            outDegree = 0;
            communities.clear();
            currentCommunity = index.belongings[i];
            start = index.starts[i];
            end = index.starts[i + 1];
            offset = index.offsets[i];
            for (;start < end; start++) {
              out = start < offset;
              j = index.neighborhood[start];
              weight = index.weights[start];
              targetCommunity = index.belongings[j];
              if (out)
                outDegree += weight;
              else
                inDegree += weight;
              addWeightToCommunity(communities, targetCommunity, weight);
            }
            bestDelta = index.deltaWithOwnCommunity(i, inDegree, outDegree, communities.get(currentCommunity) || 0, currentCommunity);
            bestCommunity = currentCommunity;
            for (ci = 0;ci < communities.size; ci++) {
              targetCommunity = communities.dense[ci];
              if (targetCommunity === currentCommunity)
                continue;
              targetCommunityDegree = communities.vals[ci];
              deltaComputations++;
              delta = index.delta(i, inDegree, outDegree, targetCommunityDegree, targetCommunity);
              deltaIsBetter = tieBreaker(bestCommunity, currentCommunity, targetCommunity, delta, bestDelta);
              if (deltaIsBetter) {
                bestDelta = delta;
                bestCommunity = targetCommunity;
              }
            }
            if (bestDelta < 0) {
              bestCommunity = index.isolate(i, inDegree, outDegree);
              if (bestCommunity === currentCommunity)
                continue;
            } else {
              if (bestCommunity === currentCommunity) {
                continue;
              } else {
                index.move(i, inDegree, outDegree, bestCommunity);
              }
            }
            localMoveWasMade = true;
            currentMoves++;
          }
          localMoves.push(currentMoves);
          moveWasMade = localMoveWasMade || moveWasMade;
        }
      }
      if (moveWasMade)
        index.zoomOut();
    }
    var results = {
      index,
      deltaComputations,
      nodesVisited,
      moves
    };
    return results;
  }
  function louvain(assign, detailed, graph, options) {
    if (!isGraph(graph))
      throw new Error("graphology-communities-louvain: the given graph is not a valid graphology instance.");
    var type = inferType(graph);
    if (type === "mixed")
      throw new Error("graphology-communities-louvain: cannot run the algorithm on a true mixed graph.");
    options = resolveDefaults(options, DEFAULTS);
    var c = 0;
    if (graph.size === 0) {
      if (assign) {
        graph.forEachNode(function(node) {
          graph.setNodeAttribute(node, options.nodeCommunityAttribute, c++);
        });
        return;
      }
      var communities = {};
      graph.forEachNode(function(node) {
        communities[node] = c++;
      });
      if (!detailed)
        return communities;
      return {
        communities,
        count: graph.order,
        deltaComputations: 0,
        dendrogram: null,
        level: 0,
        modularity: NaN,
        moves: null,
        nodesVisited: 0,
        resolution: options.resolution
      };
    }
    var fn2 = type === "undirected" ? undirectedLouvain : directedLouvain;
    var results = fn2(detailed, graph, options);
    var index = results.index;
    if (!detailed) {
      if (assign) {
        index.assign(options.nodeCommunityAttribute);
        return;
      }
      return index.collect();
    }
    var output = {
      count: index.C,
      deltaComputations: results.deltaComputations,
      dendrogram: index.dendrogram,
      level: index.level,
      modularity: index.modularity(),
      moves: results.moves,
      nodesVisited: results.nodesVisited,
      resolution: options.resolution
    };
    if (assign) {
      index.assign(options.nodeCommunityAttribute);
      return output;
    }
    output.communities = index.collect();
    return output;
  }
  var fn = louvain.bind(null, false, false);
  fn.assign = louvain.bind(null, true, false);
  fn.detailed = louvain.bind(null, false, true);
  fn.defaults = DEFAULTS;
  module.exports = fn;
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/alea.js
var require_alea = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function Alea(seed) {
      var me = this, mash = Mash();
      me.next = function() {
        var t = 2091639 * me.s0 + me.c * 0.00000000023283064365386963;
        me.s0 = me.s1;
        me.s1 = me.s2;
        return me.s2 = t - (me.c = t | 0);
      };
      me.c = 1;
      me.s0 = mash(" ");
      me.s1 = mash(" ");
      me.s2 = mash(" ");
      me.s0 -= mash(seed);
      if (me.s0 < 0) {
        me.s0 += 1;
      }
      me.s1 -= mash(seed);
      if (me.s1 < 0) {
        me.s1 += 1;
      }
      me.s2 -= mash(seed);
      if (me.s2 < 0) {
        me.s2 += 1;
      }
      mash = null;
    }
    function copy(f, t) {
      t.c = f.c;
      t.s0 = f.s0;
      t.s1 = f.s1;
      t.s2 = f.s2;
      return t;
    }
    function impl(seed, opts) {
      var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
      prng.int32 = function() {
        return xg.next() * 4294967296 | 0;
      };
      prng.double = function() {
        return prng() + (prng() * 2097152 | 0) * 0.00000000000000011102230246251565;
      };
      prng.quick = prng;
      if (state) {
        if (typeof state == "object")
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    function Mash() {
      var n = 4022871197;
      var mash = function(data) {
        data = String(data);
        for (var i = 0;i < data.length; i++) {
          n += data.charCodeAt(i);
          var h = 0.02519603282416938 * n;
          n = h >>> 0;
          h -= n;
          h *= n;
          n = h >>> 0;
          h -= n;
          n += h * 4294967296;
        }
        return (n >>> 0) * 0.00000000023283064365386963;
      };
      return mash;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.alea = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/xor128.js
var require_xor128 = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function XorGen(seed) {
      var me = this, strseed = "";
      me.x = 0;
      me.y = 0;
      me.z = 0;
      me.w = 0;
      me.next = function() {
        var t = me.x ^ me.x << 11;
        me.x = me.y;
        me.y = me.z;
        me.z = me.w;
        return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
      };
      if (seed === (seed | 0)) {
        me.x = seed;
      } else {
        strseed += seed;
      }
      for (var k = 0;k < strseed.length + 64; k++) {
        me.x ^= strseed.charCodeAt(k) | 0;
        me.next();
      }
    }
    function copy(f, t) {
      t.x = f.x;
      t.y = f.y;
      t.z = f.z;
      t.w = f.w;
      return t;
    }
    function impl(seed, opts) {
      var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
        return (xg.next() >>> 0) / 4294967296;
      };
      prng.double = function() {
        do {
          var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
        } while (result === 0);
        return result;
      };
      prng.int32 = xg.next;
      prng.quick = prng;
      if (state) {
        if (typeof state == "object")
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.xor128 = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/xorwow.js
var require_xorwow = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function XorGen(seed) {
      var me = this, strseed = "";
      me.next = function() {
        var t = me.x ^ me.x >>> 2;
        me.x = me.y;
        me.y = me.z;
        me.z = me.w;
        me.w = me.v;
        return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
      };
      me.x = 0;
      me.y = 0;
      me.z = 0;
      me.w = 0;
      me.v = 0;
      if (seed === (seed | 0)) {
        me.x = seed;
      } else {
        strseed += seed;
      }
      for (var k = 0;k < strseed.length + 64; k++) {
        me.x ^= strseed.charCodeAt(k) | 0;
        if (k == strseed.length) {
          me.d = me.x << 10 ^ me.x >>> 4;
        }
        me.next();
      }
    }
    function copy(f, t) {
      t.x = f.x;
      t.y = f.y;
      t.z = f.z;
      t.w = f.w;
      t.v = f.v;
      t.d = f.d;
      return t;
    }
    function impl(seed, opts) {
      var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
        return (xg.next() >>> 0) / 4294967296;
      };
      prng.double = function() {
        do {
          var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
        } while (result === 0);
        return result;
      };
      prng.int32 = xg.next;
      prng.quick = prng;
      if (state) {
        if (typeof state == "object")
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.xorwow = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/xorshift7.js
var require_xorshift7 = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function XorGen(seed) {
      var me = this;
      me.next = function() {
        var { x: X, i } = me, t, v, w;
        t = X[i];
        t ^= t >>> 7;
        v = t ^ t << 24;
        t = X[i + 1 & 7];
        v ^= t ^ t >>> 10;
        t = X[i + 3 & 7];
        v ^= t ^ t >>> 3;
        t = X[i + 4 & 7];
        v ^= t ^ t << 7;
        t = X[i + 7 & 7];
        t = t ^ t << 13;
        v ^= t ^ t << 9;
        X[i] = v;
        me.i = i + 1 & 7;
        return v;
      };
      function init(me2, seed2) {
        var j, w, X = [];
        if (seed2 === (seed2 | 0)) {
          w = X[0] = seed2;
        } else {
          seed2 = "" + seed2;
          for (j = 0;j < seed2.length; ++j) {
            X[j & 7] = X[j & 7] << 15 ^ seed2.charCodeAt(j) + X[j + 1 & 7] << 13;
          }
        }
        while (X.length < 8)
          X.push(0);
        for (j = 0;j < 8 && X[j] === 0; ++j)
          ;
        if (j == 8)
          w = X[7] = -1;
        else
          w = X[j];
        me2.x = X;
        me2.i = 0;
        for (j = 256;j > 0; --j) {
          me2.next();
        }
      }
      init(me, seed);
    }
    function copy(f, t) {
      t.x = f.x.slice();
      t.i = f.i;
      return t;
    }
    function impl(seed, opts) {
      if (seed == null)
        seed = +new Date;
      var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
        return (xg.next() >>> 0) / 4294967296;
      };
      prng.double = function() {
        do {
          var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
        } while (result === 0);
        return result;
      };
      prng.int32 = xg.next;
      prng.quick = prng;
      if (state) {
        if (state.x)
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.xorshift7 = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/xor4096.js
var require_xor4096 = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function XorGen(seed) {
      var me = this;
      me.next = function() {
        var { w, X, i } = me, t, v;
        me.w = w = w + 1640531527 | 0;
        v = X[i + 34 & 127];
        t = X[i = i + 1 & 127];
        v ^= v << 13;
        t ^= t << 17;
        v ^= v >>> 15;
        t ^= t >>> 12;
        v = X[i] = v ^ t;
        me.i = i;
        return v + (w ^ w >>> 16) | 0;
      };
      function init(me2, seed2) {
        var t, v, i, j, w, X = [], limit = 128;
        if (seed2 === (seed2 | 0)) {
          v = seed2;
          seed2 = null;
        } else {
          seed2 = seed2 + "\x00";
          v = 0;
          limit = Math.max(limit, seed2.length);
        }
        for (i = 0, j = -32;j < limit; ++j) {
          if (seed2)
            v ^= seed2.charCodeAt((j + 32) % seed2.length);
          if (j === 0)
            w = v;
          v ^= v << 10;
          v ^= v >>> 15;
          v ^= v << 4;
          v ^= v >>> 13;
          if (j >= 0) {
            w = w + 1640531527 | 0;
            t = X[j & 127] ^= v + w;
            i = t == 0 ? i + 1 : 0;
          }
        }
        if (i >= 128) {
          X[(seed2 && seed2.length || 0) & 127] = -1;
        }
        i = 127;
        for (j = 4 * 128;j > 0; --j) {
          v = X[i + 34 & 127];
          t = X[i = i + 1 & 127];
          v ^= v << 13;
          t ^= t << 17;
          v ^= v >>> 15;
          t ^= t >>> 12;
          X[i] = v ^ t;
        }
        me2.w = w;
        me2.X = X;
        me2.i = i;
      }
      init(me, seed);
    }
    function copy(f, t) {
      t.i = f.i;
      t.w = f.w;
      t.X = f.X.slice();
      return t;
    }
    function impl(seed, opts) {
      if (seed == null)
        seed = +new Date;
      var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
        return (xg.next() >>> 0) / 4294967296;
      };
      prng.double = function() {
        do {
          var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
        } while (result === 0);
        return result;
      };
      prng.int32 = xg.next;
      prng.quick = prng;
      if (state) {
        if (state.X)
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.xor4096 = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/lib/tychei.js
var require_tychei = __commonJS((exports, module) => {
  (function(global, module2, define2) {
    function XorGen(seed) {
      var me = this, strseed = "";
      me.next = function() {
        var { b, c, d, a } = me;
        b = b << 25 ^ b >>> 7 ^ c;
        c = c - d | 0;
        d = d << 24 ^ d >>> 8 ^ a;
        a = a - b | 0;
        me.b = b = b << 20 ^ b >>> 12 ^ c;
        me.c = c = c - d | 0;
        me.d = d << 16 ^ c >>> 16 ^ a;
        return me.a = a - b | 0;
      };
      me.a = 0;
      me.b = 0;
      me.c = 2654435769 | 0;
      me.d = 1367130551;
      if (seed === Math.floor(seed)) {
        me.a = seed / 4294967296 | 0;
        me.b = seed | 0;
      } else {
        strseed += seed;
      }
      for (var k = 0;k < strseed.length + 20; k++) {
        me.b ^= strseed.charCodeAt(k) | 0;
        me.next();
      }
    }
    function copy(f, t) {
      t.a = f.a;
      t.b = f.b;
      t.c = f.c;
      t.d = f.d;
      return t;
    }
    function impl(seed, opts) {
      var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
        return (xg.next() >>> 0) / 4294967296;
      };
      prng.double = function() {
        do {
          var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
        } while (result === 0);
        return result;
      };
      prng.int32 = xg.next;
      prng.quick = prng;
      if (state) {
        if (typeof state == "object")
          copy(state, xg);
        prng.state = function() {
          return copy(xg, {});
        };
      }
      return prng;
    }
    if (module2 && module2.exports) {
      module2.exports = impl;
    } else if (define2 && define2.amd) {
      define2(function() {
        return impl;
      });
    } else {
      this.tychei = impl;
    }
  })(exports, typeof module == "object" && module, typeof define == "function" && define);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/seedrandom.js
var require_seedrandom = __commonJS((exports, module) => {
  (function(global, pool, math) {
    var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
    function seedrandom(seed, options, callback) {
      var key = [];
      options = options == true ? { entropy: true } : options || {};
      var shortseed = mixkey(flatten(options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed, 3), key);
      var arc4 = new ARC4(key);
      var prng = function() {
        var n = arc4.g(chunks), d = startdenom, x = 0;
        while (n < significance) {
          n = (n + x) * width;
          d *= width;
          x = arc4.g(1);
        }
        while (n >= overflow) {
          n /= 2;
          d /= 2;
          x >>>= 1;
        }
        return (n + x) / d;
      };
      prng.int32 = function() {
        return arc4.g(4) | 0;
      };
      prng.quick = function() {
        return arc4.g(4) / 4294967296;
      };
      prng.double = prng;
      mixkey(tostring(arc4.S), pool);
      return (options.pass || callback || function(prng2, seed2, is_math_call, state) {
        if (state) {
          if (state.S) {
            copy(state, arc4);
          }
          prng2.state = function() {
            return copy(arc4, {});
          };
        }
        if (is_math_call) {
          math[rngname] = prng2;
          return seed2;
        } else
          return prng2;
      })(prng, shortseed, "global" in options ? options.global : this == math, options.state);
    }
    function ARC4(key) {
      var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
      if (!keylen) {
        key = [keylen++];
      }
      while (i < width) {
        s[i] = i++;
      }
      for (i = 0;i < width; i++) {
        s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
        s[j] = t;
      }
      (me.g = function(count) {
        var t2, r = 0, i2 = me.i, j2 = me.j, s2 = me.S;
        while (count--) {
          t2 = s2[i2 = mask & i2 + 1];
          r = r * width + s2[mask & (s2[i2] = s2[j2 = mask & j2 + t2]) + (s2[j2] = t2)];
        }
        me.i = i2;
        me.j = j2;
        return r;
      })(width);
    }
    function copy(f, t) {
      t.i = f.i;
      t.j = f.j;
      t.S = f.S.slice();
      return t;
    }
    function flatten(obj, depth) {
      var result = [], typ = typeof obj, prop;
      if (depth && typ == "object") {
        for (prop in obj) {
          try {
            result.push(flatten(obj[prop], depth - 1));
          } catch (e) {}
        }
      }
      return result.length ? result : typ == "string" ? obj : obj + "\x00";
    }
    function mixkey(seed, key) {
      var stringseed = seed + "", smear, j = 0;
      while (j < stringseed.length) {
        key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
      }
      return tostring(key);
    }
    function autoseed() {
      try {
        var out;
        if (nodecrypto && (out = nodecrypto.randomBytes)) {
          out = out(width);
        } else {
          out = new Uint8Array(width);
          (global.crypto || global.msCrypto).getRandomValues(out);
        }
        return tostring(out);
      } catch (e) {
        var browser = global.navigator, plugins = browser && browser.plugins;
        return [+new Date, global, plugins, global.screen, tostring(pool)];
      }
    }
    function tostring(a) {
      return String.fromCharCode.apply(0, a);
    }
    mixkey(math.random(), pool);
    if (typeof module == "object" && module.exports) {
      module.exports = seedrandom;
      try {
        nodecrypto = __require("crypto");
      } catch (ex) {}
    } else if (typeof define == "function" && define.amd) {
      define(function() {
        return seedrandom;
      });
    } else {
      math["seed" + rngname] = seedrandom;
    }
  })(typeof self !== "undefined" ? self : exports, [], Math);
});

// ../../node_modules/.bun/seedrandom@3.0.5/node_modules/seedrandom/index.js
var require_seedrandom2 = __commonJS((exports, module) => {
  var alea = require_alea();
  var xor128 = require_xor128();
  var xorwow = require_xorwow();
  var xorshift7 = require_xorshift7();
  var xor4096 = require_xor4096();
  var tychei = require_tychei();
  var sr = require_seedrandom();
  sr.alea = alea;
  sr.xor128 = xor128;
  sr.xorwow = xorwow;
  sr.xorshift7 = xorshift7;
  sr.xor4096 = xor4096;
  sr.tychei = tychei;
  module.exports = sr;
});

// ../../packages/detection/src/communities.ts
function detectCommunities(graph, options) {
  const result = import_graphology_communities_louvain.default.detailed(graph, {
    getEdgeWeight: "weight",
    resolution: options.resolution,
    rng: import_seedrandom.default(options.profile.randomSeed)
  });
  return {
    communities: result.communities,
    communityCount: result.count,
    modularity: result.modularity,
    resolution: result.resolution,
    seed: options.profile.randomSeed,
    deltaComputations: result.deltaComputations,
    nodesVisited: result.nodesVisited,
    moves: result.moves,
    dendrogram: result.dendrogram.map((level) => Array.from(level))
  };
}
var import_graphology_communities_louvain, import_seedrandom;
var init_communities = __esm(() => {
  import_graphology_communities_louvain = __toESM(require_graphology_communities_louvain(), 1);
  import_seedrandom = __toESM(require_seedrandom2(), 1);
});

// ../../packages/detection/src/category-baseline.ts
function median(values) {
  if (values.length === 0)
    return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const center = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? center) + center) / 2 : center;
}
function robustMetric(values) {
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center)));
  return { median: center, mad: Math.max(mad, 0.01) };
}
function activityByEntity(transactions) {
  const amounts = new Map;
  const bins = new Map;
  for (const transaction of transactions) {
    if (transaction.status !== "captured" && transaction.status !== "settled")
      continue;
    const values = amounts.get(transaction.fromEntityId) ?? [];
    values.push(Math.log1p(Number(BigInt(transaction.amountPaise))));
    amounts.set(transaction.fromEntityId, values);
    const histogram = bins.get(transaction.fromEntityId) ?? Array.from({ length: BIN_COUNT }, () => 0);
    const hour = new Date(transaction.occurredAt).getUTCHours();
    const bin = Math.min(BIN_COUNT - 1, Math.floor(hour / (24 / BIN_COUNT)));
    histogram[bin] = (histogram[bin] ?? 0) + 1;
    bins.set(transaction.fromEntityId, histogram);
  }
  return new Map([...amounts].map(([entityId, values]) => {
    const histogram = bins.get(entityId) ?? [];
    return [
      entityId,
      {
        logAmountMedian: median(values),
        frequency: values.length,
        timeHistogram: Array.from({ length: BIN_COUNT }, (_, index) => (histogram[index] ?? 0) / values.length)
      }
    ];
  }));
}
function fitCategoryBaselines(entities, transactions, excludedEntityIds) {
  const activity = activityByEntity(transactions);
  const baselines = {};
  const categories = new Set(entities.flatMap((entity) => entity.category ? [entity.category] : []));
  for (const category of categories) {
    const samples = entities.filter((entity) => entity.category === category && !excludedEntityIds.has(entity.id) && activity.has(entity.id)).flatMap((entity) => {
      const sample = activity.get(entity.id);
      return sample ? [sample] : [];
    });
    if (samples.length === 0)
      continue;
    baselines[category] = {
      logAmount: robustMetric(samples.map((sample) => sample.logAmountMedian)),
      frequency: robustMetric(samples.map((sample) => sample.frequency)),
      timeHistogram: Array.from({ length: BIN_COUNT }, (_, index) => median(samples.map((sample) => sample.timeHistogram[index] ?? 0)))
    };
  }
  return baselines;
}
function histogramDistance(left, right) {
  return left.reduce((total, value, index) => total + Math.abs(value - (right[index] ?? 0)), 0) / 2;
}
function categoryAnomalyForMembers(memberIds, entities, transactions, baselines) {
  if (!baselines)
    return 0;
  const scores = categoryAnomalyScores(entities, transactions, baselines);
  const anomalies = [...memberIds].flatMap((entityId) => {
    const value = scores[entityId];
    return value === undefined ? [] : [value];
  });
  return anomalies.length === 0 ? 0 : anomalies.reduce((sum, value) => sum + value, 0) / anomalies.length;
}
function categoryAnomalyScores(entities, transactions, baselines) {
  if (!baselines)
    return {};
  const activity = activityByEntity(transactions);
  return Object.fromEntries(entities.filter((entity) => entity.onboardedVia === "aggregator" && entity.category).flatMap((entity) => {
    const sample = activity.get(entity.id);
    const baseline = entity.category ? baselines[entity.category] : undefined;
    if (!sample || !baseline)
      return [];
    const amountDeviation = Math.abs((sample.logAmountMedian - baseline.logAmount.median) / baseline.logAmount.mad);
    const frequencyDeviation = Math.abs((sample.frequency - baseline.frequency.median) / baseline.frequency.mad);
    const timeDeviation = histogramDistance(sample.timeHistogram, baseline.timeHistogram);
    return [
      [
        entity.id,
        Math.min(1, (Math.min(amountDeviation, 6) / 6 + Math.min(frequencyDeviation, 6) / 6 + timeDeviation) / 3)
      ]
    ];
  }));
}
var BIN_COUNT = 6;

// ../../packages/detection/src/evidence.ts
function compareTransactions(left, right) {
  return Date.parse(left.occurredAt) - Date.parse(right.occurredAt) || left.id.localeCompare(right.id);
}
function attributeEvidence(attributes, profile) {
  const groups = new Map;
  for (const attribute of attributes) {
    const key = `${attribute.type}\x00${attribute.value}`;
    const group = groups.get(key) ?? [];
    if (!group.some((member) => member.entityId === attribute.entityId)) {
      group.push(attribute);
      groups.set(key, group);
    }
  }
  const edges = [];
  let ignoredAttributesAboveDegreeCap = 0;
  for (const group of groups.values()) {
    group.sort((left, right) => left.entityId.localeCompare(right.entityId));
    const degree = group.length;
    if (degree < 2)
      continue;
    if (degree > profile.attributeDegreeCap) {
      ignoredAttributesAboveDegreeCap += 1;
      continue;
    }
    const first = group[0];
    if (!first)
      continue;
    const type = first.type === "device_fingerprint" ? "shared_device" : "shared_payout_account";
    const contribution = 1 / (degree - 1);
    for (let leftIndex = 0;leftIndex < group.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1;rightIndex < group.length; rightIndex += 1) {
        const left = group[leftIndex];
        const right = group[rightIndex];
        if (!left || !right)
          continue;
        edges.push({
          id: `${type}:${first.value}:${left.entityId}:${right.entityId}`,
          sourceEntityId: left.entityId,
          targetEntityId: right.entityId,
          type,
          directed: false,
          rawValue: degree,
          contribution,
          detail: {
            attributeType: first.type,
            degree,
            value: first.value
          }
        });
      }
    }
  }
  return { edges, ignoredAttributesAboveDegreeCap };
}
function flowEvidence(transactions, profile) {
  const active = transactions.filter((transaction) => ACTIVE_TRANSACTION_STATUSES.has(transaction.status)).slice().sort(compareTransactions);
  const lotsByEntity = new Map;
  const windowMilliseconds = profile.flowWindowHours * 60 * 60 * 1000;
  for (const transaction of active) {
    const occurredAt = Date.parse(transaction.occurredAt);
    const amountPaise = BigInt(transaction.amountPaise);
    if (amountPaise <= 0n)
      continue;
    const lots = lotsByEntity.get(transaction.fromEntityId) ?? [];
    let outboundRemaining = amountPaise;
    for (const lot of lots) {
      if (outboundRemaining === 0n)
        break;
      const elapsedMilliseconds = occurredAt - Date.parse(lot.transaction.occurredAt);
      if (elapsedMilliseconds < 0 || elapsedMilliseconds > windowMilliseconds)
        continue;
      if (lot.remainingPaise === 0n)
        continue;
      const allocated = lot.remainingPaise < outboundRemaining ? lot.remainingPaise : outboundRemaining;
      lot.remainingPaise -= allocated;
      outboundRemaining -= allocated;
      lot.allocations.push({
        inboundTransactionId: lot.transaction.id,
        outboundTransactionId: transaction.id,
        targetEntityId: transaction.toEntityId,
        amountPaise: allocated.toString(),
        elapsedMilliseconds
      });
    }
    const inboundLot = {
      transaction,
      amountPaise,
      remainingPaise: amountPaise,
      allocations: []
    };
    const recipientLots = lotsByEntity.get(transaction.toEntityId) ?? [];
    recipientLots.push(inboundLot);
    lotsByEntity.set(transaction.toEntityId, recipientLots);
  }
  const edges = [];
  for (const [intermediaryEntityId, lots] of lotsByEntity) {
    for (const lot of lots) {
      const forwardedAmountPaise = lot.amountPaise - lot.remainingPaise;
      const ratio = Number(forwardedAmountPaise) / Number(lot.amountPaise);
      if (ratio < profile.flowRatio)
        continue;
      const allocationsByTarget = new Map;
      for (const allocation of lot.allocations) {
        const targetAllocations = allocationsByTarget.get(allocation.targetEntityId) ?? [];
        targetAllocations.push(allocation);
        allocationsByTarget.set(allocation.targetEntityId, targetAllocations);
      }
      for (const [targetEntityId, allocations] of allocationsByTarget) {
        const allocatedPaise = allocations.reduce((total, allocation) => total + BigInt(allocation.amountPaise), 0n);
        edges.push({
          id: `fast_flow:${lot.transaction.id}:${targetEntityId}`,
          sourceEntityId: intermediaryEntityId,
          targetEntityId,
          type: "fast_flow",
          directed: true,
          rawValue: ratio,
          contribution: Number(allocatedPaise) / Number(lot.amountPaise),
          detail: {
            inboundAmountPaise: lot.amountPaise.toString(),
            forwardedAmountPaise: forwardedAmountPaise.toString(),
            intermediaryEntityId,
            allocations: allocations.map((allocation) => ({
              inboundTransactionId: allocation.inboundTransactionId,
              outboundTransactionId: allocation.outboundTransactionId,
              amountPaise: allocation.amountPaise,
              elapsedMilliseconds: allocation.elapsedMilliseconds
            }))
          }
        });
      }
    }
  }
  return edges;
}
function deriveEvidence(input, profile) {
  const attributes = attributeEvidence(input.attributes, profile);
  const edges = [
    ...attributes.edges,
    ...flowEvidence(input.transactions, profile)
  ].sort((left, right) => left.id.localeCompare(right.id));
  return {
    edges,
    ignoredAttributesAboveDegreeCap: attributes.ignoredAttributesAboveDegreeCap
  };
}
var ACTIVE_TRANSACTION_STATUSES;
var init_evidence = __esm(() => {
  ACTIVE_TRANSACTION_STATUSES = new Set(["captured", "settled"]);
});

// ../../packages/detection/src/diagnose-false-positives.ts
function jaccard(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;
  return intersection / Math.max(1, new Set([...left, ...right]).size);
}
function diagnoseFalsePositives(communities, truthGroups, threshold, matchJaccard = 0.5) {
  const rings = truthGroups.filter((group) => group.kind === "ring");
  const ringById = new Map(rings.map((r) => [r.id, r]));
  const ringMemberMap = new Map;
  const ringExposureMap = new Map;
  for (const ring of rings) {
    ringExposureMap.set(ring.id, ring.estimatedExposurePaise);
    for (const memberId of ring.memberIds) {
      ringMemberMap.set(memberId, ring.id);
    }
  }
  const flagged = communities.filter((community) => community.flagEligible && community.score >= threshold);
  const flaggedMemberIds = new Set(flagged.flatMap((c) => c.memberIds));
  const candidateMatches = flagged.flatMap((community, communityIndex) => rings.map((ring, ringIndex) => ({
    communityIndex,
    ringIndex,
    overlap: jaccard(community.memberIds, ring.memberIds)
  }))).filter((match) => match.overlap >= matchJaccard).sort((left, right) => right.overlap - left.overlap || left.communityIndex - right.communityIndex || left.ringIndex - right.ringIndex);
  const matchedCommunityIndexes = new Set;
  const matchedRingIndexes = new Set;
  for (const match of candidateMatches) {
    if (matchedCommunityIndexes.has(match.communityIndex) || matchedRingIndexes.has(match.ringIndex))
      continue;
    matchedCommunityIndexes.add(match.communityIndex);
    matchedRingIndexes.add(match.ringIndex);
  }
  const matchedRings = new Set(rings.filter((_, index) => matchedRingIndexes.has(index)).map((r) => r.id));
  const classifications = [];
  for (let i = 0;i < flagged.length; i += 1) {
    if (matchedCommunityIndexes.has(i))
      continue;
    const community = flagged[i];
    const fraudMembers = community.memberIds.filter((id) => ringMemberMap.has(id));
    const legitimateMembers = community.memberIds.filter((id) => !ringMemberMap.has(id));
    const involvedRings = rings.map((ring) => {
      const intersection = fraudMembers.filter((id) => ring.memberIds.includes(id)).length;
      return {
        ringId: ring.id,
        ringSize: ring.memberIds.length,
        intersection,
        jaccardOverlap: jaccard(community.memberIds, ring.memberIds)
      };
    }).filter((r) => r.intersection > 0).sort((a, b) => b.intersection - a.intersection);
    const bestMatch = involvedRings[0];
    let classification;
    let explanation = "";
    if (fraudMembers.length === 0) {
      classification = "A";
      explanation = `No planted fraud members. Genuine synthetic false positive.`;
    } else if (involvedRings.length === 1 && bestMatch && bestMatch.jaccardOverlap < matchJaccard) {
      classification = "B";
      explanation = `Fraud fragment: ${fraudMembers.length} members from ring ${bestMatch.ringId}, Jaccard=${bestMatch.jaccardOverlap.toFixed(3)} < ${matchJaccard}`;
    } else {
      classification = "C";
      if (involvedRings.length > 1) {
        explanation = `Mixed/merged: ${fraudMembers.length} fraud members from ${involvedRings.length} rings. ${legitimateMembers.length} non-ring members.`;
      } else if (involvedRings.length === 1 && legitimateMembers.length > 0) {
        explanation = `Mixed: fraud members from 1 ring + ${legitimateMembers.length} legitimate members prevents matching.`;
      } else {
        explanation = `Complex topology.`;
      }
    }
    classifications.push({
      communityOrdinal: community.ordinal,
      size: community.memberIds.length,
      score: community.score,
      classification,
      fraudMemberCount: fraudMembers.length,
      legitimateMemberCount: legitimateMembers.length,
      involvedRings: involvedRings.map((ring) => ({
        ...ring,
        isBestMatch: ring === bestMatch
      })),
      bestMatchRing: bestMatch,
      explanation
    });
  }
  const typeACounts = classifications.filter((c) => c.classification === "A").length;
  const typeBCounts = classifications.filter((c) => c.classification === "B").length;
  const typeCCounts = classifications.filter((c) => c.classification === "C").length;
  const missedRings = rings.filter((r) => !matchedRings.has(r.id));
  const missedRingFragments = new Map;
  const missedRingMerges = new Map;
  for (const missedRing of missedRings) {
    const communitiesWithMembers = flagged.filter((c) => c.memberIds.some((id) => missedRing.memberIds.includes(id)));
    if (communitiesWithMembers.length === 0)
      continue;
    if (communitiesWithMembers.length === 1) {} else {
      missedRingFragments.set(missedRing.id, communitiesWithMembers);
    }
  }
  for (const classification of classifications) {
    if (classification.classification === "C" && classification.involvedRings.length > 1) {
      for (const ring of classification.involvedRings) {
        if (!missedRingMerges.has(ring.ringId)) {
          missedRingMerges.set(ring.ringId, new Set);
        }
        for (const otherRing of classification.involvedRings) {
          if (otherRing.ringId !== ring.ringId) {
            missedRingMerges.get(ring.ringId)?.add(otherRing.ringId);
          }
        }
      }
    }
  }
  const missedRingCounts = {
    totalMissed: missedRings.length,
    fragmentedIntoMultipleCommunities: missedRingFragments.size,
    mergedWithOtherRings: missedRingMerges.size,
    mergedWithLegitimate: 0,
    remainedUnflagged: 0,
    scoredBelowThreshold: 0
  };
  for (const missedRing of missedRings) {
    const membersInFlaggedCommunities = flagged.filter((c) => c.memberIds.some((id) => missedRing.memberIds.includes(id))).length;
    if (membersInFlaggedCommunities === 0) {
      missedRingCounts.remainedUnflagged += 1;
    }
  }
  const ringMemberIds = new Set(rings.flatMap((r) => r.memberIds));
  const truePositiveEntities = [...flaggedMemberIds].filter((id) => ringMemberIds.has(id)).length;
  const fpWithFraud = classifications.filter((c) => c.fraudMemberCount > 0).length;
  const fpWithoutFraud = classifications.filter((c) => c.fraudMemberCount === 0).length;
  const entityRecall = ringMemberIds.size > 0 ? truePositiveEntities / ringMemberIds.size : 0;
  const ringRecall = rings.length > 0 ? matchedRings.size / rings.length : 0;
  let paradoxExplanation = "";
  if (entityRecall > 0.9 && ringRecall < 0.75 && classifications.length > 30) {
    paradoxExplanation = `HIGH entity recall (${(entityRecall * 100).toFixed(1)}%) but LOW ring recall (${(ringRecall * 100).toFixed(1)}%) ` + `indicates most individuals are captured but rings are FRAGMENTED or MERGED. ` + `Type B (fragments with low Jaccard) and Type C (merged communities) dominate the false positives.`;
  }
  return {
    threshold,
    totalFlaggedCommunities: flagged.length,
    truePositiveCommunities: matchedCommunityIndexes.size,
    falsePositivesCounted: flagged.length - matchedCommunityIndexes.size,
    classifications: {
      trueSyntheticFalsePositives_A: typeACounts,
      fraudFragments_B: typeBCounts,
      mixedMergedCommunities_C: typeCCounts
    },
    fpContainingFraudEntities: fpWithFraud,
    fpContainingZeroFraudEntities: fpWithoutFraud,
    missedRings: missedRingCounts,
    entityRecoveryParadox: {
      flaggedEntities: flaggedMemberIds.size,
      fraudEntities: truePositiveEntities,
      entityRecall,
      ringsRecovered: matchedRings.size,
      totalRings: rings.length,
      ringRecall,
      paradoxExplanation
    },
    rootCauseLayers: inferRootCause({
      fpTypeA: typeACounts,
      fpTypeB: typeBCounts,
      fpTypeC: typeCCounts,
      entityRecall,
      ringRecall,
      fragmentedRingCount: missedRingFragments.size,
      mergedRingCount: missedRingMerges.size
    })
  };
}
function inferRootCause(metrics) {
  const layers = [];
  if (metrics.entityRecall > 0.85 && metrics.ringRecall < 0.75) {
    layers.push("COMMUNITY FORMATION LAYER: Rings are being fragmented into multiple smaller communities, " + "each containing sufficient fraud entities for detection but insufficient cohesion for Jaccard matching.");
  }
  if (metrics.fpTypeB > metrics.fpTypeA + metrics.fpTypeC) {
    layers.push("EVALUATION/MATCHING LAYER: Jaccard >= 0.5 threshold is too strict for noisy/incomplete rings. " + `${metrics.fpTypeB} communities are fraud fragments (single ring, low overlap).`);
  }
  if (metrics.fpTypeC > metrics.fpTypeA + metrics.fpTypeB) {
    layers.push("LOUVAIN/GRAPH TOPOLOGY LAYER: Communities are merging across ring boundaries or with legitimate entities, " + `indicating insufficient evidence separation or over-eager community merging. ` + `${metrics.fpTypeC} communities mix fraud from multiple rings or fraud + legitimate.`);
  }
  if (metrics.fragmentedRingCount > 2) {
    layers.push(`SYNTHETIC GENERATOR TOPOLOGY: ${metrics.fragmentedRingCount} planted rings are fragmenting into multiple flagged communities. ` + `Rings may lack sufficient internal cohesion (shared accounts/devices) to form a single strong community.`);
  }
  if (metrics.mergedRingCount > 2) {
    layers.push(`EVIDENCE DERIVATION LAYER: ${metrics.mergedRingCount} planted rings are being merged with other rings in the same communities. ` + `Evidence edges may be creating unexpected cross-ring bridges.`);
  }
  if (layers.length === 0) {
    layers.push("MIXED LAYERS: No dominant pattern. Investigation required.");
  }
  return layers;
}
function formatDiagnosisReport(report) {
  const lines = [
    "═══════════════════════════════════════════════════════════════════════════════",
    "FALSE-POSITIVE CLASSIFICATION REPORT",
    "═══════════════════════════════════════════════════════════════════════════════",
    "",
    `EVALUATION THRESHOLD: ${report.threshold}`,
    `Total Flagged Communities: ${report.totalFlaggedCommunities}`,
    `True Positives (matched): ${report.truePositiveCommunities}`,
    `False Positives (unmatched): ${report.falsePositivesCounted}`,
    "",
    "─────────────────────────────────────────────────────────────────────────────",
    "CLASSIFICATION BREAKDOWN",
    "─────────────────────────────────────────────────────────────────────────────",
    `Type A (True Synthetic False Positives): ${report.classifications.trueSyntheticFalsePositives_A}`,
    `Type B (Fraud Fragments, Jaccard < 0.5): ${report.classifications.fraudFragments_B}`,
    `Type C (Mixed/Merged Communities): ${report.classifications.mixedMergedCommunities_C}`,
    "",
    `FP containing ≥1 fraud entity: ${report.fpContainingFraudEntities}`,
    `FP containing 0 fraud entities: ${report.fpContainingZeroFraudEntities}`,
    "",
    "─────────────────────────────────────────────────────────────────────────────",
    "ENTITY RECOVERY PARADOX",
    "─────────────────────────────────────────────────────────────────────────────",
    `Entity Recall: ${(report.entityRecoveryParadox.entityRecall * 100).toFixed(1)}% (${report.entityRecoveryParadox.fraudEntities}/${report.entityRecoveryParadox.flaggedEntities} flagged)`,
    `Ring Recall: ${(report.entityRecoveryParadox.ringRecall * 100).toFixed(1)}% (${report.entityRecoveryParadox.ringsRecovered}/${report.entityRecoveryParadox.totalRings})`,
    ``,
    report.entityRecoveryParadox.paradoxExplanation ? report.entityRecoveryParadox.paradoxExplanation : "Metrics are balanced.",
    "",
    "─────────────────────────────────────────────────────────────────────────────",
    "MISSED RING ANALYSIS (31.4% not recovered)",
    "─────────────────────────────────────────────────────────────────────────────",
    `Total Missed: ${report.missedRings.totalMissed}`,
    `Fragmented into multiple communities: ${report.missedRings.fragmentedIntoMultipleCommunities}`,
    `Merged with other rings: ${report.missedRings.mergedWithOtherRings}`,
    `Remained unflagged: ${report.missedRings.remainedUnflagged}`,
    "",
    "─────────────────────────────────────────────────────────────────────────────",
    "ROOT CAUSE ANALYSIS",
    "─────────────────────────────────────────────────────────────────────────────",
    ...report.rootCauseLayers.map((layer) => `• ${layer}`),
    "",
    "═══════════════════════════════════════════════════════════════════════════════"
  ];
  return lines.join(`
`);
}

// ../../packages/detection/src/evaluation.ts
function jaccard2(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((id) => rightSet.has(id)).length;
  return intersection / Math.max(1, new Set([...left, ...right]).size);
}
function safeRatio(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}
function evaluateAtThreshold(communities, truthGroups, threshold, profile) {
  const flagged = communities.filter((community) => community.flagEligible && community.score >= threshold);
  const rings = truthGroups.filter((group) => group.kind === "ring");
  const ringMemberIds = new Set(rings.flatMap((group) => group.memberIds));
  const flaggedMemberIds = new Set(flagged.flatMap((group) => group.memberIds));
  const truePositiveEntities = [...flaggedMemberIds].filter((id) => ringMemberIds.has(id)).length;
  const candidateMatches = flagged.flatMap((community, communityIndex) => rings.map((ring, ringIndex) => ({
    communityIndex,
    ringIndex,
    overlap: jaccard2(community.memberIds, ring.memberIds)
  }))).filter((match) => match.overlap >= profile.matchJaccard).sort((left, right) => right.overlap - left.overlap || left.communityIndex - right.communityIndex || left.ringIndex - right.ringIndex);
  const matchedCommunityIndexes = new Set;
  const matchedRingIndexes = new Set;
  for (const match of candidateMatches) {
    if (matchedCommunityIndexes.has(match.communityIndex) || matchedRingIndexes.has(match.ringIndex))
      continue;
    matchedCommunityIndexes.add(match.communityIndex);
    matchedRingIndexes.add(match.ringIndex);
  }
  const matchedRings = rings.filter((_, index) => matchedRingIndexes.has(index));
  const truePositiveCommunities = matchedCommunityIndexes.size;
  const falsePositiveCount = flagged.length - truePositiveCommunities;
  const reviewCostPerFinding = BigInt(profile.economics.analystHourlyRatePaise) * BigInt(profile.economics.reviewMinutes) / 60n;
  const reviewCostPaise = reviewCostPerFinding * BigInt(falsePositiveCount);
  const matchedIds = new Set(matchedRings.map((ring) => ring.id));
  const missedRings = rings.filter((ring) => !matchedIds.has(ring.id));
  for (const ring of missedRings) {
    console.log(`### MISSED_RING ### id=${ring.id} exposure=${ring.estimatedExposurePaise} members=${ring.memberIds.join(",")}`);
  }
  const missedExposurePaise = rings.filter((ring) => !matchedIds.has(ring.id)).reduce((total, ring) => total + BigInt(ring.estimatedExposurePaise), 0n);
  return {
    threshold,
    entityPrecision: safeRatio(truePositiveEntities, flaggedMemberIds.size),
    entityRecall: safeRatio(truePositiveEntities, ringMemberIds.size),
    communityPrecision: safeRatio(truePositiveCommunities, flagged.length),
    ringRecall: safeRatio(matchedRings.length, rings.length),
    falsePositiveCount,
    reviewCostPaise: reviewCostPaise.toString(),
    missedExposurePaise: missedExposurePaise.toString(),
    totalCostPaise: (reviewCostPaise + missedExposurePaise).toString()
  };
}
function evaluateThresholds(communities, truthGroups, profile) {
  const points = profile.thresholdCandidates.map((threshold) => evaluateAtThreshold(communities, truthGroups, threshold, profile));
  const selected = [...points].sort((left, right) => Number(BigInt(left.totalCostPaise) - BigInt(right.totalCostPaise)) || right.ringRecall - left.ringRecall || left.threshold - right.threshold)[0];
  if (!selected)
    throw new Error("Detector profile has no thresholds.");
  return { points, selected };
}

// ../../node_modules/.bun/graphology@0.26.0+6368c1bed9f3b4f1/node_modules/graphology/dist/graphology.mjs
import { EventEmitter } from "events";
function assignPolyfill() {
  const target = arguments[0];
  for (let i = 1, l = arguments.length;i < l; i++) {
    if (!arguments[i])
      continue;
    for (const k in arguments[i])
      target[k] = arguments[i][k];
  }
  return target;
}
function getMatchingEdge(graph, source, target, type) {
  const sourceData = graph._nodes.get(source);
  let edge = null;
  if (!sourceData)
    return edge;
  if (type === "mixed") {
    edge = sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target];
  } else if (type === "directed") {
    edge = sourceData.out && sourceData.out[target];
  } else {
    edge = sourceData.undirected && sourceData.undirected[target];
  }
  return edge;
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null;
}
function isEmpty(o) {
  let k;
  for (k in o)
    return false;
  return true;
}
function privateProperty(target, name, value) {
  Object.defineProperty(target, name, {
    enumerable: false,
    configurable: false,
    writable: true,
    value
  });
}
function readOnlyProperty(target, name, value) {
  const descriptor = {
    enumerable: true,
    configurable: true
  };
  if (typeof value === "function") {
    descriptor.get = value;
  } else {
    descriptor.value = value;
    descriptor.writable = false;
  }
  Object.defineProperty(target, name, descriptor);
}
function validateHints(hints) {
  if (!isPlainObject(hints))
    return false;
  if (hints.attributes && !Array.isArray(hints.attributes))
    return false;
  return true;
}
function incrementalIdStartingFromRandomByte() {
  let i = Math.floor(Math.random() * 256) & 255;
  return () => {
    return i++;
  };
}
function chain() {
  const iterables = arguments;
  let current = null;
  let i = -1;
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      let step = null;
      do {
        if (current === null) {
          i++;
          if (i >= iterables.length)
            return { done: true };
          current = iterables[i][Symbol.iterator]();
        }
        step = current.next();
        if (step.done) {
          current = null;
          continue;
        }
        break;
      } while (true);
      return step;
    }
  };
}
function emptyIterator() {
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      return { done: true };
    }
  };
}
function MixedNodeData(key, attributes) {
  this.key = key;
  this.attributes = attributes;
  this.clear();
}
function DirectedNodeData(key, attributes) {
  this.key = key;
  this.attributes = attributes;
  this.clear();
}
function UndirectedNodeData(key, attributes) {
  this.key = key;
  this.attributes = attributes;
  this.clear();
}
function EdgeData(undirected, key, source, target, attributes) {
  this.key = key;
  this.attributes = attributes;
  this.undirected = undirected;
  this.source = source;
  this.target = target;
}
function findRelevantNodeData(graph, method, mode, nodeOrEdge, nameOrEdge, add1, add2) {
  let nodeData, edgeData, arg1, arg2;
  nodeOrEdge = "" + nodeOrEdge;
  if (mode === NODE) {
    nodeData = graph._nodes.get(nodeOrEdge);
    if (!nodeData)
      throw new NotFoundGraphError(`Graph.${method}: could not find the "${nodeOrEdge}" node in the graph.`);
    arg1 = nameOrEdge;
    arg2 = add1;
  } else if (mode === OPPOSITE) {
    nameOrEdge = "" + nameOrEdge;
    edgeData = graph._edges.get(nameOrEdge);
    if (!edgeData)
      throw new NotFoundGraphError(`Graph.${method}: could not find the "${nameOrEdge}" edge in the graph.`);
    const source = edgeData.source.key;
    const target = edgeData.target.key;
    if (nodeOrEdge === source) {
      nodeData = edgeData.target;
    } else if (nodeOrEdge === target) {
      nodeData = edgeData.source;
    } else {
      throw new NotFoundGraphError(`Graph.${method}: the "${nodeOrEdge}" node is not attached to the "${nameOrEdge}" edge (${source}, ${target}).`);
    }
    arg1 = add1;
    arg2 = add2;
  } else {
    edgeData = graph._edges.get(nodeOrEdge);
    if (!edgeData)
      throw new NotFoundGraphError(`Graph.${method}: could not find the "${nodeOrEdge}" edge in the graph.`);
    if (mode === SOURCE) {
      nodeData = edgeData.source;
    } else {
      nodeData = edgeData.target;
    }
    arg1 = nameOrEdge;
    arg2 = add1;
  }
  return [nodeData, arg1, arg2];
}
function attachNodeAttributeGetter(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, name] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    return data.attributes[name];
  };
}
function attachNodeAttributesGetter(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge) {
    const [data] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge);
    return data.attributes;
  };
}
function attachNodeAttributeChecker(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, name] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    return data.attributes.hasOwnProperty(name);
  };
}
function attachNodeAttributeSetter(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1, add2) {
    const [data, name, value] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1, add2);
    data.attributes[name] = value;
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "set",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachNodeAttributeUpdater(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1, add2) {
    const [data, name, updater] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1, add2);
    if (typeof updater !== "function")
      throw new InvalidArgumentsGraphError(`Graph.${method}: updater should be a function.`);
    const attributes = data.attributes;
    const value = updater(attributes[name]);
    attributes[name] = value;
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "set",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachNodeAttributeRemover(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, name] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    delete data.attributes[name];
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "remove",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachNodeAttributesReplacer(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, attributes] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    if (!isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided attributes are not a plain object.`);
    data.attributes = attributes;
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "replace",
      attributes: data.attributes
    });
    return this;
  };
}
function attachNodeAttributesMerger(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, attributes] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    if (!isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided attributes are not a plain object.`);
    assign(data.attributes, attributes);
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "merge",
      attributes: data.attributes,
      data: attributes
    });
    return this;
  };
}
function attachNodeAttributesUpdater(Class, method, mode) {
  Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
    const [data, updater] = findRelevantNodeData(this, method, mode, nodeOrEdge, nameOrEdge, add1);
    if (typeof updater !== "function")
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided updater is not a function.`);
    data.attributes = updater(data.attributes);
    this.emit("nodeAttributesUpdated", {
      key: data.key,
      type: "update",
      attributes: data.attributes
    });
    return this;
  };
}
function attachNodeAttributesMethods(Graph) {
  NODE_ATTRIBUTES_METHODS.forEach(function({ name, attacher }) {
    attacher(Graph, name("Node"), NODE);
    attacher(Graph, name("Source"), SOURCE);
    attacher(Graph, name("Target"), TARGET);
    attacher(Graph, name("Opposite"), OPPOSITE);
  });
}
function attachEdgeAttributeGetter(Class, method, type) {
  Class.prototype[method] = function(element, name) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element;
      const target = "" + name;
      name = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    return data.attributes[name];
  };
}
function attachEdgeAttributesGetter(Class, method, type) {
  Class.prototype[method] = function(element) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 1) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element, target = "" + arguments[1];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    return data.attributes;
  };
}
function attachEdgeAttributeChecker(Class, method, type) {
  Class.prototype[method] = function(element, name) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element;
      const target = "" + name;
      name = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    return data.attributes.hasOwnProperty(name);
  };
}
function attachEdgeAttributeSetter(Class, method, type) {
  Class.prototype[method] = function(element, name, value) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 3) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element;
      const target = "" + name;
      name = arguments[2];
      value = arguments[3];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    data.attributes[name] = value;
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "set",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachEdgeAttributeUpdater(Class, method, type) {
  Class.prototype[method] = function(element, name, updater) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 3) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element;
      const target = "" + name;
      name = arguments[2];
      updater = arguments[3];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    if (typeof updater !== "function")
      throw new InvalidArgumentsGraphError(`Graph.${method}: updater should be a function.`);
    data.attributes[name] = updater(data.attributes[name]);
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "set",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachEdgeAttributeRemover(Class, method, type) {
  Class.prototype[method] = function(element, name) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element;
      const target = "" + name;
      name = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    delete data.attributes[name];
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "remove",
      attributes: data.attributes,
      name
    });
    return this;
  };
}
function attachEdgeAttributesReplacer(Class, method, type) {
  Class.prototype[method] = function(element, attributes) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element, target = "" + attributes;
      attributes = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    if (!isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided attributes are not a plain object.`);
    data.attributes = attributes;
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "replace",
      attributes: data.attributes
    });
    return this;
  };
}
function attachEdgeAttributesMerger(Class, method, type) {
  Class.prototype[method] = function(element, attributes) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element, target = "" + attributes;
      attributes = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    if (!isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided attributes are not a plain object.`);
    assign(data.attributes, attributes);
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "merge",
      attributes: data.attributes,
      data: attributes
    });
    return this;
  };
}
function attachEdgeAttributesUpdater(Class, method, type) {
  Class.prototype[method] = function(element, updater) {
    let data;
    if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
      throw new UsageGraphError(`Graph.${method}: cannot find this type of edges in your ${this.type} graph.`);
    if (arguments.length > 2) {
      if (this.multi)
        throw new UsageGraphError(`Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
      const source = "" + element, target = "" + updater;
      updater = arguments[2];
      data = getMatchingEdge(this, source, target, type);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`);
    } else {
      if (type !== "mixed")
        throw new UsageGraphError(`Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
      element = "" + element;
      data = this._edges.get(element);
      if (!data)
        throw new NotFoundGraphError(`Graph.${method}: could not find the "${element}" edge in the graph.`);
    }
    if (typeof updater !== "function")
      throw new InvalidArgumentsGraphError(`Graph.${method}: provided updater is not a function.`);
    data.attributes = updater(data.attributes);
    this.emit("edgeAttributesUpdated", {
      key: data.key,
      type: "update",
      attributes: data.attributes
    });
    return this;
  };
}
function attachEdgeAttributesMethods(Graph) {
  EDGE_ATTRIBUTES_METHODS.forEach(function({ name, attacher }) {
    attacher(Graph, name("Edge"), "mixed");
    attacher(Graph, name("DirectedEdge"), "directed");
    attacher(Graph, name("UndirectedEdge"), "undirected");
  });
}
function forEachSimple(breakable, object, callback, avoid) {
  let shouldBreak = false;
  for (const k in object) {
    if (k === avoid)
      continue;
    const edgeData = object[k];
    shouldBreak = callback(edgeData.key, edgeData.attributes, edgeData.source.key, edgeData.target.key, edgeData.source.attributes, edgeData.target.attributes, edgeData.undirected);
    if (breakable && shouldBreak)
      return edgeData.key;
  }
  return;
}
function forEachMulti(breakable, object, callback, avoid) {
  let edgeData, source, target;
  let shouldBreak = false;
  for (const k in object) {
    if (k === avoid)
      continue;
    edgeData = object[k];
    do {
      source = edgeData.source;
      target = edgeData.target;
      shouldBreak = callback(edgeData.key, edgeData.attributes, source.key, target.key, source.attributes, target.attributes, edgeData.undirected);
      if (breakable && shouldBreak)
        return edgeData.key;
      edgeData = edgeData.next;
    } while (edgeData !== undefined);
  }
  return;
}
function createIterator(object, avoid) {
  const keys = Object.keys(object);
  const l = keys.length;
  let edgeData;
  let i = 0;
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      do {
        if (!edgeData) {
          if (i >= l)
            return { done: true };
          const k = keys[i++];
          if (k === avoid) {
            edgeData = undefined;
            continue;
          }
          edgeData = object[k];
        } else {
          edgeData = edgeData.next;
        }
      } while (!edgeData);
      return {
        done: false,
        value: {
          edge: edgeData.key,
          attributes: edgeData.attributes,
          source: edgeData.source.key,
          target: edgeData.target.key,
          sourceAttributes: edgeData.source.attributes,
          targetAttributes: edgeData.target.attributes,
          undirected: edgeData.undirected
        }
      };
    }
  };
}
function forEachForKeySimple(breakable, object, k, callback) {
  const edgeData = object[k];
  if (!edgeData)
    return;
  const sourceData = edgeData.source;
  const targetData = edgeData.target;
  if (callback(edgeData.key, edgeData.attributes, sourceData.key, targetData.key, sourceData.attributes, targetData.attributes, edgeData.undirected) && breakable)
    return edgeData.key;
}
function forEachForKeyMulti(breakable, object, k, callback) {
  let edgeData = object[k];
  if (!edgeData)
    return;
  let shouldBreak = false;
  do {
    shouldBreak = callback(edgeData.key, edgeData.attributes, edgeData.source.key, edgeData.target.key, edgeData.source.attributes, edgeData.target.attributes, edgeData.undirected);
    if (breakable && shouldBreak)
      return edgeData.key;
    edgeData = edgeData.next;
  } while (edgeData !== undefined);
  return;
}
function createIteratorForKey(object, k) {
  let edgeData = object[k];
  if (edgeData.next !== undefined) {
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        if (!edgeData)
          return { done: true };
        const value = {
          edge: edgeData.key,
          attributes: edgeData.attributes,
          source: edgeData.source.key,
          target: edgeData.target.key,
          sourceAttributes: edgeData.source.attributes,
          targetAttributes: edgeData.target.attributes,
          undirected: edgeData.undirected
        };
        edgeData = edgeData.next;
        return {
          done: false,
          value
        };
      }
    };
  }
  let done = false;
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      if (done === true)
        return { done: true };
      done = true;
      return {
        done: false,
        value: {
          edge: edgeData.key,
          attributes: edgeData.attributes,
          source: edgeData.source.key,
          target: edgeData.target.key,
          sourceAttributes: edgeData.source.attributes,
          targetAttributes: edgeData.target.attributes,
          undirected: edgeData.undirected
        }
      };
    }
  };
}
function createEdgeArray(graph, type) {
  if (graph.size === 0)
    return [];
  if (type === "mixed" || type === graph.type) {
    return Array.from(graph._edges.keys());
  }
  const size = type === "undirected" ? graph.undirectedSize : graph.directedSize;
  const list = new Array(size), mask = type === "undirected";
  const iterator = graph._edges.values();
  let i = 0;
  let step, data;
  while (step = iterator.next(), step.done !== true) {
    data = step.value;
    if (data.undirected === mask)
      list[i++] = data.key;
  }
  return list;
}
function forEachEdge(breakable, graph, type, callback) {
  if (graph.size === 0)
    return;
  const shouldFilter = type !== "mixed" && type !== graph.type;
  const mask = type === "undirected";
  let step, data;
  let shouldBreak = false;
  const iterator = graph._edges.values();
  while (step = iterator.next(), step.done !== true) {
    data = step.value;
    if (shouldFilter && data.undirected !== mask)
      continue;
    const { key, attributes, source, target } = data;
    shouldBreak = callback(key, attributes, source.key, target.key, source.attributes, target.attributes, data.undirected);
    if (breakable && shouldBreak)
      return key;
  }
  return;
}
function createEdgeIterator(graph, type) {
  if (graph.size === 0)
    return emptyIterator();
  const shouldFilter = type !== "mixed" && type !== graph.type;
  const mask = type === "undirected";
  const iterator = graph._edges.values();
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      let step, data;
      while (true) {
        step = iterator.next();
        if (step.done)
          return step;
        data = step.value;
        if (shouldFilter && data.undirected !== mask)
          continue;
        break;
      }
      const value = {
        edge: data.key,
        attributes: data.attributes,
        source: data.source.key,
        target: data.target.key,
        sourceAttributes: data.source.attributes,
        targetAttributes: data.target.attributes,
        undirected: data.undirected
      };
      return { value, done: false };
    }
  };
}
function forEachEdgeForNode(breakable, multi, type, direction, nodeData, callback) {
  const fn = multi ? forEachMulti : forEachSimple;
  let found;
  if (type !== "undirected") {
    if (direction !== "out") {
      found = fn(breakable, nodeData.in, callback);
      if (breakable && found)
        return found;
    }
    if (direction !== "in") {
      found = fn(breakable, nodeData.out, callback, !direction ? nodeData.key : undefined);
      if (breakable && found)
        return found;
    }
  }
  if (type !== "directed") {
    found = fn(breakable, nodeData.undirected, callback);
    if (breakable && found)
      return found;
  }
  return;
}
function createEdgeArrayForNode(multi, type, direction, nodeData) {
  const edges = [];
  forEachEdgeForNode(false, multi, type, direction, nodeData, function(key) {
    edges.push(key);
  });
  return edges;
}
function createEdgeIteratorForNode(type, direction, nodeData) {
  let iterator = emptyIterator();
  if (type !== "undirected") {
    if (direction !== "out" && typeof nodeData.in !== "undefined")
      iterator = chain(iterator, createIterator(nodeData.in));
    if (direction !== "in" && typeof nodeData.out !== "undefined")
      iterator = chain(iterator, createIterator(nodeData.out, !direction ? nodeData.key : undefined));
  }
  if (type !== "directed" && typeof nodeData.undirected !== "undefined") {
    iterator = chain(iterator, createIterator(nodeData.undirected));
  }
  return iterator;
}
function forEachEdgeForPath(breakable, type, multi, direction, sourceData, target, callback) {
  const fn = multi ? forEachForKeyMulti : forEachForKeySimple;
  let found;
  if (type !== "undirected") {
    if (typeof sourceData.in !== "undefined" && direction !== "out") {
      found = fn(breakable, sourceData.in, target, callback);
      if (breakable && found)
        return found;
    }
    if (typeof sourceData.out !== "undefined" && direction !== "in" && (direction || sourceData.key !== target)) {
      found = fn(breakable, sourceData.out, target, callback);
      if (breakable && found)
        return found;
    }
  }
  if (type !== "directed") {
    if (typeof sourceData.undirected !== "undefined") {
      found = fn(breakable, sourceData.undirected, target, callback);
      if (breakable && found)
        return found;
    }
  }
  return;
}
function createEdgeArrayForPath(type, multi, direction, sourceData, target) {
  const edges = [];
  forEachEdgeForPath(false, type, multi, direction, sourceData, target, function(key) {
    edges.push(key);
  });
  return edges;
}
function createEdgeIteratorForPath(type, direction, sourceData, target) {
  let iterator = emptyIterator();
  if (type !== "undirected") {
    if (typeof sourceData.in !== "undefined" && direction !== "out" && target in sourceData.in)
      iterator = chain(iterator, createIteratorForKey(sourceData.in, target));
    if (typeof sourceData.out !== "undefined" && direction !== "in" && target in sourceData.out && (direction || sourceData.key !== target))
      iterator = chain(iterator, createIteratorForKey(sourceData.out, target));
  }
  if (type !== "directed") {
    if (typeof sourceData.undirected !== "undefined" && target in sourceData.undirected)
      iterator = chain(iterator, createIteratorForKey(sourceData.undirected, target));
  }
  return iterator;
}
function attachEdgeArrayCreator(Class, description) {
  const { name, type, direction } = description;
  Class.prototype[name] = function(source, target) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return [];
    if (!arguments.length)
      return createEdgeArray(this, type);
    if (arguments.length === 1) {
      source = "" + source;
      const nodeData = this._nodes.get(source);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(`Graph.${name}: could not find the "${source}" node in the graph.`);
      return createEdgeArrayForNode(this.multi, type === "mixed" ? this.type : type, direction, nodeData);
    }
    if (arguments.length === 2) {
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.${name}:  could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.${name}:  could not find the "${target}" target node in the graph.`);
      return createEdgeArrayForPath(type, this.multi, direction, sourceData, target);
    }
    throw new InvalidArgumentsGraphError(`Graph.${name}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
  };
}
function attachForEachEdge(Class, description) {
  const { name, type, direction } = description;
  const forEachName = "forEach" + name[0].toUpperCase() + name.slice(1, -1);
  Class.prototype[forEachName] = function(source, target, callback) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return;
    if (arguments.length === 1) {
      callback = source;
      return forEachEdge(false, this, type, callback);
    }
    if (arguments.length === 2) {
      source = "" + source;
      callback = target;
      const nodeData = this._nodes.get(source);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(`Graph.${forEachName}: could not find the "${source}" node in the graph.`);
      return forEachEdgeForNode(false, this.multi, type === "mixed" ? this.type : type, direction, nodeData, callback);
    }
    if (arguments.length === 3) {
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.${forEachName}:  could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.${forEachName}:  could not find the "${target}" target node in the graph.`);
      return forEachEdgeForPath(false, type, this.multi, direction, sourceData, target, callback);
    }
    throw new InvalidArgumentsGraphError(`Graph.${forEachName}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
  };
  const mapName = "map" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[mapName] = function() {
    const args = Array.prototype.slice.call(arguments);
    const callback = args.pop();
    let result;
    if (args.length === 0) {
      let length = 0;
      if (type !== "directed")
        length += this.undirectedSize;
      if (type !== "undirected")
        length += this.directedSize;
      result = new Array(length);
      let i = 0;
      args.push((e, ea, s, t, sa, ta, u) => {
        result[i++] = callback(e, ea, s, t, sa, ta, u);
      });
    } else {
      result = [];
      args.push((e, ea, s, t, sa, ta, u) => {
        result.push(callback(e, ea, s, t, sa, ta, u));
      });
    }
    this[forEachName].apply(this, args);
    return result;
  };
  const filterName = "filter" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[filterName] = function() {
    const args = Array.prototype.slice.call(arguments);
    const callback = args.pop();
    const result = [];
    args.push((e, ea, s, t, sa, ta, u) => {
      if (callback(e, ea, s, t, sa, ta, u))
        result.push(e);
    });
    this[forEachName].apply(this, args);
    return result;
  };
  const reduceName = "reduce" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[reduceName] = function() {
    let args = Array.prototype.slice.call(arguments);
    if (args.length < 2 || args.length > 4) {
      throw new InvalidArgumentsGraphError(`Graph.${reduceName}: invalid number of arguments (expecting 2, 3 or 4 and got ${args.length}).`);
    }
    if (typeof args[args.length - 1] === "function" && typeof args[args.length - 2] !== "function") {
      throw new InvalidArgumentsGraphError(`Graph.${reduceName}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
    }
    let callback;
    let initialValue;
    if (args.length === 2) {
      callback = args[0];
      initialValue = args[1];
      args = [];
    } else if (args.length === 3) {
      callback = args[1];
      initialValue = args[2];
      args = [args[0]];
    } else if (args.length === 4) {
      callback = args[2];
      initialValue = args[3];
      args = [args[0], args[1]];
    }
    let accumulator = initialValue;
    args.push((e, ea, s, t, sa, ta, u) => {
      accumulator = callback(accumulator, e, ea, s, t, sa, ta, u);
    });
    this[forEachName].apply(this, args);
    return accumulator;
  };
}
function attachFindEdge(Class, description) {
  const { name, type, direction } = description;
  const findEdgeName = "find" + name[0].toUpperCase() + name.slice(1, -1);
  Class.prototype[findEdgeName] = function(source, target, callback) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return false;
    if (arguments.length === 1) {
      callback = source;
      return forEachEdge(true, this, type, callback);
    }
    if (arguments.length === 2) {
      source = "" + source;
      callback = target;
      const nodeData = this._nodes.get(source);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(`Graph.${findEdgeName}: could not find the "${source}" node in the graph.`);
      return forEachEdgeForNode(true, this.multi, type === "mixed" ? this.type : type, direction, nodeData, callback);
    }
    if (arguments.length === 3) {
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.${findEdgeName}:  could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.${findEdgeName}:  could not find the "${target}" target node in the graph.`);
      return forEachEdgeForPath(true, type, this.multi, direction, sourceData, target, callback);
    }
    throw new InvalidArgumentsGraphError(`Graph.${findEdgeName}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
  };
  const someName = "some" + name[0].toUpperCase() + name.slice(1, -1);
  Class.prototype[someName] = function() {
    const args = Array.prototype.slice.call(arguments);
    const callback = args.pop();
    args.push((e, ea, s, t, sa, ta, u) => {
      return callback(e, ea, s, t, sa, ta, u);
    });
    const found = this[findEdgeName].apply(this, args);
    if (found)
      return true;
    return false;
  };
  const everyName = "every" + name[0].toUpperCase() + name.slice(1, -1);
  Class.prototype[everyName] = function() {
    const args = Array.prototype.slice.call(arguments);
    const callback = args.pop();
    args.push((e, ea, s, t, sa, ta, u) => {
      return !callback(e, ea, s, t, sa, ta, u);
    });
    const found = this[findEdgeName].apply(this, args);
    if (found)
      return false;
    return true;
  };
}
function attachEdgeIteratorCreator(Class, description) {
  const { name: originalName, type, direction } = description;
  const name = originalName.slice(0, -1) + "Entries";
  Class.prototype[name] = function(source, target) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return emptyIterator();
    if (!arguments.length)
      return createEdgeIterator(this, type);
    if (arguments.length === 1) {
      source = "" + source;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.${name}: could not find the "${source}" node in the graph.`);
      return createEdgeIteratorForNode(type, direction, sourceData);
    }
    if (arguments.length === 2) {
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.${name}:  could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.${name}:  could not find the "${target}" target node in the graph.`);
      return createEdgeIteratorForPath(type, direction, sourceData, target);
    }
    throw new InvalidArgumentsGraphError(`Graph.${name}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
  };
}
function attachEdgeIterationMethods(Graph) {
  EDGES_ITERATION.forEach((description) => {
    attachEdgeArrayCreator(Graph, description);
    attachForEachEdge(Graph, description);
    attachFindEdge(Graph, description);
    attachEdgeIteratorCreator(Graph, description);
  });
}
function CompositeSetWrapper() {
  this.A = null;
  this.B = null;
}
function forEachInObjectOnce(breakable, visited, nodeData, object, callback) {
  for (const k in object) {
    const edgeData = object[k];
    const sourceData = edgeData.source;
    const targetData = edgeData.target;
    const neighborData = sourceData === nodeData ? targetData : sourceData;
    if (visited && visited.has(neighborData.key))
      continue;
    const shouldBreak = callback(neighborData.key, neighborData.attributes);
    if (breakable && shouldBreak)
      return neighborData.key;
  }
  return;
}
function forEachNeighbor(breakable, type, direction, nodeData, callback) {
  if (type !== "mixed") {
    if (type === "undirected")
      return forEachInObjectOnce(breakable, null, nodeData, nodeData.undirected, callback);
    if (typeof direction === "string")
      return forEachInObjectOnce(breakable, null, nodeData, nodeData[direction], callback);
  }
  const visited = new CompositeSetWrapper;
  let found;
  if (type !== "undirected") {
    if (direction !== "out") {
      found = forEachInObjectOnce(breakable, null, nodeData, nodeData.in, callback);
      if (breakable && found)
        return found;
      visited.wrap(nodeData.in);
    }
    if (direction !== "in") {
      found = forEachInObjectOnce(breakable, visited, nodeData, nodeData.out, callback);
      if (breakable && found)
        return found;
      visited.wrap(nodeData.out);
    }
  }
  if (type !== "directed") {
    found = forEachInObjectOnce(breakable, visited, nodeData, nodeData.undirected, callback);
    if (breakable && found)
      return found;
  }
  return;
}
function createNeighborArrayForNode(type, direction, nodeData) {
  if (type !== "mixed") {
    if (type === "undirected")
      return Object.keys(nodeData.undirected);
    if (typeof direction === "string")
      return Object.keys(nodeData[direction]);
  }
  const neighbors = [];
  forEachNeighbor(false, type, direction, nodeData, function(key) {
    neighbors.push(key);
  });
  return neighbors;
}
function createDedupedObjectIterator(visited, nodeData, object) {
  const keys = Object.keys(object);
  const l = keys.length;
  let i = 0;
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      let neighborData = null;
      do {
        if (i >= l) {
          if (visited)
            visited.wrap(object);
          return { done: true };
        }
        const edgeData = object[keys[i++]];
        const sourceData = edgeData.source;
        const targetData = edgeData.target;
        neighborData = sourceData === nodeData ? targetData : sourceData;
        if (visited && visited.has(neighborData.key)) {
          neighborData = null;
          continue;
        }
      } while (neighborData === null);
      return {
        done: false,
        value: { neighbor: neighborData.key, attributes: neighborData.attributes }
      };
    }
  };
}
function createNeighborIterator(type, direction, nodeData) {
  if (type !== "mixed") {
    if (type === "undirected")
      return createDedupedObjectIterator(null, nodeData, nodeData.undirected);
    if (typeof direction === "string")
      return createDedupedObjectIterator(null, nodeData, nodeData[direction]);
  }
  let iterator = emptyIterator();
  const visited = new CompositeSetWrapper;
  if (type !== "undirected") {
    if (direction !== "out") {
      iterator = chain(iterator, createDedupedObjectIterator(visited, nodeData, nodeData.in));
    }
    if (direction !== "in") {
      iterator = chain(iterator, createDedupedObjectIterator(visited, nodeData, nodeData.out));
    }
  }
  if (type !== "directed") {
    iterator = chain(iterator, createDedupedObjectIterator(visited, nodeData, nodeData.undirected));
  }
  return iterator;
}
function attachNeighborArrayCreator(Class, description) {
  const { name, type, direction } = description;
  Class.prototype[name] = function(node) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return [];
    node = "" + node;
    const nodeData = this._nodes.get(node);
    if (typeof nodeData === "undefined")
      throw new NotFoundGraphError(`Graph.${name}: could not find the "${node}" node in the graph.`);
    return createNeighborArrayForNode(type === "mixed" ? this.type : type, direction, nodeData);
  };
}
function attachForEachNeighbor(Class, description) {
  const { name, type, direction } = description;
  const forEachName = "forEach" + name[0].toUpperCase() + name.slice(1, -1);
  Class.prototype[forEachName] = function(node, callback) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return;
    node = "" + node;
    const nodeData = this._nodes.get(node);
    if (typeof nodeData === "undefined")
      throw new NotFoundGraphError(`Graph.${forEachName}: could not find the "${node}" node in the graph.`);
    forEachNeighbor(false, type === "mixed" ? this.type : type, direction, nodeData, callback);
  };
  const mapName = "map" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[mapName] = function(node, callback) {
    const result = [];
    this[forEachName](node, (n, a) => {
      result.push(callback(n, a));
    });
    return result;
  };
  const filterName = "filter" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[filterName] = function(node, callback) {
    const result = [];
    this[forEachName](node, (n, a) => {
      if (callback(n, a))
        result.push(n);
    });
    return result;
  };
  const reduceName = "reduce" + name[0].toUpperCase() + name.slice(1);
  Class.prototype[reduceName] = function(node, callback, initialValue) {
    if (arguments.length < 3)
      throw new InvalidArgumentsGraphError(`Graph.${reduceName}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
    let accumulator = initialValue;
    this[forEachName](node, (n, a) => {
      accumulator = callback(accumulator, n, a);
    });
    return accumulator;
  };
}
function attachFindNeighbor(Class, description) {
  const { name, type, direction } = description;
  const capitalizedSingular = name[0].toUpperCase() + name.slice(1, -1);
  const findName = "find" + capitalizedSingular;
  Class.prototype[findName] = function(node, callback) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return;
    node = "" + node;
    const nodeData = this._nodes.get(node);
    if (typeof nodeData === "undefined")
      throw new NotFoundGraphError(`Graph.${findName}: could not find the "${node}" node in the graph.`);
    return forEachNeighbor(true, type === "mixed" ? this.type : type, direction, nodeData, callback);
  };
  const someName = "some" + capitalizedSingular;
  Class.prototype[someName] = function(node, callback) {
    const found = this[findName](node, callback);
    if (found)
      return true;
    return false;
  };
  const everyName = "every" + capitalizedSingular;
  Class.prototype[everyName] = function(node, callback) {
    const found = this[findName](node, (n, a) => {
      return !callback(n, a);
    });
    if (found)
      return false;
    return true;
  };
}
function attachNeighborIteratorCreator(Class, description) {
  const { name, type, direction } = description;
  const iteratorName = name.slice(0, -1) + "Entries";
  Class.prototype[iteratorName] = function(node) {
    if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
      return emptyIterator();
    node = "" + node;
    const nodeData = this._nodes.get(node);
    if (typeof nodeData === "undefined")
      throw new NotFoundGraphError(`Graph.${iteratorName}: could not find the "${node}" node in the graph.`);
    return createNeighborIterator(type === "mixed" ? this.type : type, direction, nodeData);
  };
}
function attachNeighborIterationMethods(Graph) {
  NEIGHBORS_ITERATION.forEach((description) => {
    attachNeighborArrayCreator(Graph, description);
    attachForEachNeighbor(Graph, description);
    attachFindNeighbor(Graph, description);
    attachNeighborIteratorCreator(Graph, description);
  });
}
function forEachAdjacency(breakable, assymetric, disconnectedNodes, graph, callback) {
  const iterator = graph._nodes.values();
  const type = graph.type;
  let step, sourceData, neighbor, adj, edgeData, targetData, shouldBreak;
  while (step = iterator.next(), step.done !== true) {
    let hasEdges = false;
    sourceData = step.value;
    if (type !== "undirected") {
      adj = sourceData.out;
      for (neighbor in adj) {
        edgeData = adj[neighbor];
        do {
          targetData = edgeData.target;
          hasEdges = true;
          shouldBreak = callback(sourceData.key, targetData.key, sourceData.attributes, targetData.attributes, edgeData.key, edgeData.attributes, edgeData.undirected);
          if (breakable && shouldBreak)
            return edgeData;
          edgeData = edgeData.next;
        } while (edgeData);
      }
    }
    if (type !== "directed") {
      adj = sourceData.undirected;
      for (neighbor in adj) {
        if (assymetric && sourceData.key > neighbor)
          continue;
        edgeData = adj[neighbor];
        do {
          targetData = edgeData.target;
          if (targetData.key !== neighbor)
            targetData = edgeData.source;
          hasEdges = true;
          shouldBreak = callback(sourceData.key, targetData.key, sourceData.attributes, targetData.attributes, edgeData.key, edgeData.attributes, edgeData.undirected);
          if (breakable && shouldBreak)
            return edgeData;
          edgeData = edgeData.next;
        } while (edgeData);
      }
    }
    if (disconnectedNodes && !hasEdges) {
      shouldBreak = callback(sourceData.key, null, sourceData.attributes, null, null, null, null);
      if (breakable && shouldBreak)
        return null;
    }
  }
  return;
}
function serializeNode(key, data) {
  const serialized = { key };
  if (!isEmpty(data.attributes))
    serialized.attributes = assign({}, data.attributes);
  return serialized;
}
function serializeEdge(type, key, data) {
  const serialized = {
    key,
    source: data.source.key,
    target: data.target.key
  };
  if (!isEmpty(data.attributes))
    serialized.attributes = assign({}, data.attributes);
  if (type === "mixed" && data.undirected)
    serialized.undirected = true;
  return serialized;
}
function validateSerializedNode(value) {
  if (!isPlainObject(value))
    throw new InvalidArgumentsGraphError('Graph.import: invalid serialized node. A serialized node should be a plain object with at least a "key" property.');
  if (!("key" in value))
    throw new InvalidArgumentsGraphError("Graph.import: serialized node is missing its key.");
  if ("attributes" in value && (!isPlainObject(value.attributes) || value.attributes === null))
    throw new InvalidArgumentsGraphError("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
}
function validateSerializedEdge(value) {
  if (!isPlainObject(value))
    throw new InvalidArgumentsGraphError('Graph.import: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.');
  if (!("source" in value))
    throw new InvalidArgumentsGraphError("Graph.import: serialized edge is missing its source.");
  if (!("target" in value))
    throw new InvalidArgumentsGraphError("Graph.import: serialized edge is missing its target.");
  if ("attributes" in value && (!isPlainObject(value.attributes) || value.attributes === null))
    throw new InvalidArgumentsGraphError("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
  if ("undirected" in value && typeof value.undirected !== "boolean")
    throw new InvalidArgumentsGraphError("Graph.import: invalid undirectedness information. Undirected should be boolean or omitted.");
}
function addNode(graph, node, attributes) {
  if (attributes && !isPlainObject(attributes))
    throw new InvalidArgumentsGraphError(`Graph.addNode: invalid attributes. Expecting an object but got "${attributes}"`);
  node = "" + node;
  attributes = attributes || {};
  if (graph._nodes.has(node))
    throw new UsageGraphError(`Graph.addNode: the "${node}" node already exist in the graph.`);
  const data = new graph.NodeDataClass(node, attributes);
  graph._nodes.set(node, data);
  graph.emit("nodeAdded", {
    key: node,
    attributes
  });
  return data;
}
function unsafeAddNode(graph, node, attributes) {
  const data = new graph.NodeDataClass(node, attributes);
  graph._nodes.set(node, data);
  graph.emit("nodeAdded", {
    key: node,
    attributes
  });
  return data;
}
function addEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes) {
  if (!undirected && graph.type === "undirected")
    throw new UsageGraphError(`Graph.${name}: you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.`);
  if (undirected && graph.type === "directed")
    throw new UsageGraphError(`Graph.${name}: you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.`);
  if (attributes && !isPlainObject(attributes))
    throw new InvalidArgumentsGraphError(`Graph.${name}: invalid attributes. Expecting an object but got "${attributes}"`);
  source = "" + source;
  target = "" + target;
  attributes = attributes || {};
  if (!graph.allowSelfLoops && source === target)
    throw new UsageGraphError(`Graph.${name}: source & target are the same ("${source}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
  const sourceData = graph._nodes.get(source), targetData = graph._nodes.get(target);
  if (!sourceData)
    throw new NotFoundGraphError(`Graph.${name}: source node "${source}" not found.`);
  if (!targetData)
    throw new NotFoundGraphError(`Graph.${name}: target node "${target}" not found.`);
  const eventData = {
    key: null,
    undirected,
    source,
    target,
    attributes
  };
  if (mustGenerateKey) {
    edge = graph._edgeKeyGenerator();
  } else {
    edge = "" + edge;
    if (graph._edges.has(edge))
      throw new UsageGraphError(`Graph.${name}: the "${edge}" edge already exists in the graph.`);
  }
  if (!graph.multi && (undirected ? typeof sourceData.undirected[target] !== "undefined" : typeof sourceData.out[target] !== "undefined")) {
    throw new UsageGraphError(`Graph.${name}: an edge linking "${source}" to "${target}" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option.`);
  }
  const edgeData = new EdgeData(undirected, edge, sourceData, targetData, attributes);
  graph._edges.set(edge, edgeData);
  const isSelfLoop = source === target;
  if (undirected) {
    sourceData.undirectedDegree++;
    targetData.undirectedDegree++;
    if (isSelfLoop) {
      sourceData.undirectedLoops++;
      graph._undirectedSelfLoopCount++;
    }
  } else {
    sourceData.outDegree++;
    targetData.inDegree++;
    if (isSelfLoop) {
      sourceData.directedLoops++;
      graph._directedSelfLoopCount++;
    }
  }
  if (graph.multi)
    edgeData.attachMulti();
  else
    edgeData.attach();
  if (undirected)
    graph._undirectedSize++;
  else
    graph._directedSize++;
  eventData.key = edge;
  graph.emit("edgeAdded", eventData);
  return edge;
}
function mergeEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes, asUpdater) {
  if (!undirected && graph.type === "undirected")
    throw new UsageGraphError(`Graph.${name}: you cannot merge/update a directed edge to an undirected graph. Use the #.mergeEdge/#.updateEdge or #.addUndirectedEdge instead.`);
  if (undirected && graph.type === "directed")
    throw new UsageGraphError(`Graph.${name}: you cannot merge/update an undirected edge to a directed graph. Use the #.mergeEdge/#.updateEdge or #.addDirectedEdge instead.`);
  if (attributes) {
    if (asUpdater) {
      if (typeof attributes !== "function")
        throw new InvalidArgumentsGraphError(`Graph.${name}: invalid updater function. Expecting a function but got "${attributes}"`);
    } else {
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(`Graph.${name}: invalid attributes. Expecting an object but got "${attributes}"`);
    }
  }
  source = "" + source;
  target = "" + target;
  let updater;
  if (asUpdater) {
    updater = attributes;
    attributes = undefined;
  }
  if (!graph.allowSelfLoops && source === target)
    throw new UsageGraphError(`Graph.${name}: source & target are the same ("${source}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
  let sourceData = graph._nodes.get(source);
  let targetData = graph._nodes.get(target);
  let edgeData;
  let alreadyExistingEdgeData;
  if (!mustGenerateKey) {
    edgeData = graph._edges.get(edge);
    if (edgeData) {
      if (edgeData.source.key !== source || edgeData.target.key !== target) {
        if (!undirected || edgeData.source.key !== target || edgeData.target.key !== source) {
          throw new UsageGraphError(`Graph.${name}: inconsistency detected when attempting to merge the "${edge}" edge with "${source}" source & "${target}" target vs. ("${edgeData.source.key}", "${edgeData.target.key}").`);
        }
      }
      alreadyExistingEdgeData = edgeData;
    }
  }
  if (!alreadyExistingEdgeData && !graph.multi && sourceData) {
    alreadyExistingEdgeData = undirected ? sourceData.undirected[target] : sourceData.out[target];
  }
  if (alreadyExistingEdgeData) {
    const info = [alreadyExistingEdgeData.key, false, false, false];
    if (asUpdater ? !updater : !attributes)
      return info;
    if (asUpdater) {
      const oldAttributes = alreadyExistingEdgeData.attributes;
      alreadyExistingEdgeData.attributes = updater(oldAttributes);
      graph.emit("edgeAttributesUpdated", {
        type: "replace",
        key: alreadyExistingEdgeData.key,
        attributes: alreadyExistingEdgeData.attributes
      });
    } else {
      assign(alreadyExistingEdgeData.attributes, attributes);
      graph.emit("edgeAttributesUpdated", {
        type: "merge",
        key: alreadyExistingEdgeData.key,
        attributes: alreadyExistingEdgeData.attributes,
        data: attributes
      });
    }
    return info;
  }
  attributes = attributes || {};
  if (asUpdater && updater)
    attributes = updater(attributes);
  const eventData = {
    key: null,
    undirected,
    source,
    target,
    attributes
  };
  if (mustGenerateKey) {
    edge = graph._edgeKeyGenerator();
  } else {
    edge = "" + edge;
    if (graph._edges.has(edge))
      throw new UsageGraphError(`Graph.${name}: the "${edge}" edge already exists in the graph.`);
  }
  let sourceWasAdded = false;
  let targetWasAdded = false;
  if (!sourceData) {
    sourceData = unsafeAddNode(graph, source, {});
    sourceWasAdded = true;
    if (source === target) {
      targetData = sourceData;
      targetWasAdded = true;
    }
  }
  if (!targetData) {
    targetData = unsafeAddNode(graph, target, {});
    targetWasAdded = true;
  }
  edgeData = new EdgeData(undirected, edge, sourceData, targetData, attributes);
  graph._edges.set(edge, edgeData);
  const isSelfLoop = source === target;
  if (undirected) {
    sourceData.undirectedDegree++;
    targetData.undirectedDegree++;
    if (isSelfLoop) {
      sourceData.undirectedLoops++;
      graph._undirectedSelfLoopCount++;
    }
  } else {
    sourceData.outDegree++;
    targetData.inDegree++;
    if (isSelfLoop) {
      sourceData.directedLoops++;
      graph._directedSelfLoopCount++;
    }
  }
  if (graph.multi)
    edgeData.attachMulti();
  else
    edgeData.attach();
  if (undirected)
    graph._undirectedSize++;
  else
    graph._directedSize++;
  eventData.key = edge;
  graph.emit("edgeAdded", eventData);
  return [edge, true, sourceWasAdded, targetWasAdded];
}
function dropEdgeFromData(graph, edgeData) {
  graph._edges.delete(edgeData.key);
  const { source: sourceData, target: targetData, attributes } = edgeData;
  const undirected = edgeData.undirected;
  const isSelfLoop = sourceData === targetData;
  if (undirected) {
    sourceData.undirectedDegree--;
    targetData.undirectedDegree--;
    if (isSelfLoop) {
      sourceData.undirectedLoops--;
      graph._undirectedSelfLoopCount--;
    }
  } else {
    sourceData.outDegree--;
    targetData.inDegree--;
    if (isSelfLoop) {
      sourceData.directedLoops--;
      graph._directedSelfLoopCount--;
    }
  }
  if (graph.multi)
    edgeData.detachMulti();
  else
    edgeData.detach();
  if (undirected)
    graph._undirectedSize--;
  else
    graph._directedSize--;
  graph.emit("edgeDropped", {
    key: edgeData.key,
    attributes,
    source: sourceData.key,
    target: targetData.key,
    undirected
  });
}
function attachStaticFromMethod(Class) {
  Class.from = function(data, options) {
    const finalOptions = assign({}, data.options, options);
    const instance = new Class(finalOptions);
    instance.import(data);
    return instance;
  };
}
var assign, GraphError, InvalidArgumentsGraphError, NotFoundGraphError, UsageGraphError, NODE = 0, SOURCE = 1, TARGET = 2, OPPOSITE = 3, NODE_ATTRIBUTES_METHODS, EDGE_ATTRIBUTES_METHODS, EDGES_ITERATION, NEIGHBORS_ITERATION, INSTANCE_ID, TYPES, EMITTER_PROPS, EDGE_ADD_METHODS, DEFAULTS, Graph, DirectedGraph, UndirectedGraph, MultiGraph, MultiDirectedGraph, MultiUndirectedGraph;
var init_graphology = __esm(() => {
  assign = assignPolyfill;
  if (typeof Object.assign === "function")
    assign = Object.assign;
  GraphError = class GraphError extends Error {
    constructor(message) {
      super();
      this.name = "GraphError";
      this.message = message;
    }
  };
  InvalidArgumentsGraphError = class InvalidArgumentsGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "InvalidArgumentsGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(this, InvalidArgumentsGraphError.prototype.constructor);
    }
  };
  NotFoundGraphError = class NotFoundGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "NotFoundGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(this, NotFoundGraphError.prototype.constructor);
    }
  };
  UsageGraphError = class UsageGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "UsageGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(this, UsageGraphError.prototype.constructor);
    }
  };
  MixedNodeData.prototype.clear = function() {
    this.inDegree = 0;
    this.outDegree = 0;
    this.undirectedDegree = 0;
    this.undirectedLoops = 0;
    this.directedLoops = 0;
    this.in = {};
    this.out = {};
    this.undirected = {};
  };
  DirectedNodeData.prototype.clear = function() {
    this.inDegree = 0;
    this.outDegree = 0;
    this.directedLoops = 0;
    this.in = {};
    this.out = {};
  };
  UndirectedNodeData.prototype.clear = function() {
    this.undirectedDegree = 0;
    this.undirectedLoops = 0;
    this.undirected = {};
  };
  EdgeData.prototype.attach = function() {
    let outKey = "out";
    let inKey = "in";
    if (this.undirected)
      outKey = inKey = "undirected";
    const source = this.source.key;
    const target = this.target.key;
    this.source[outKey][target] = this;
    if (this.undirected && source === target)
      return;
    this.target[inKey][source] = this;
  };
  EdgeData.prototype.attachMulti = function() {
    let outKey = "out";
    let inKey = "in";
    const source = this.source.key;
    const target = this.target.key;
    if (this.undirected)
      outKey = inKey = "undirected";
    const adj = this.source[outKey];
    const head = adj[target];
    if (typeof head === "undefined") {
      adj[target] = this;
      if (!(this.undirected && source === target)) {
        this.target[inKey][source] = this;
      }
      return;
    }
    head.previous = this;
    this.next = head;
    adj[target] = this;
    this.target[inKey][source] = this;
  };
  EdgeData.prototype.detach = function() {
    const source = this.source.key;
    const target = this.target.key;
    let outKey = "out";
    let inKey = "in";
    if (this.undirected)
      outKey = inKey = "undirected";
    delete this.source[outKey][target];
    delete this.target[inKey][source];
  };
  EdgeData.prototype.detachMulti = function() {
    const source = this.source.key;
    const target = this.target.key;
    let outKey = "out";
    let inKey = "in";
    if (this.undirected)
      outKey = inKey = "undirected";
    if (this.previous === undefined) {
      if (this.next === undefined) {
        delete this.source[outKey][target];
        delete this.target[inKey][source];
      } else {
        this.next.previous = undefined;
        this.source[outKey][target] = this.next;
        this.target[inKey][source] = this.next;
      }
    } else {
      this.previous.next = this.next;
      if (this.next !== undefined) {
        this.next.previous = this.previous;
      }
    }
  };
  NODE_ATTRIBUTES_METHODS = [
    {
      name: (element) => `get${element}Attribute`,
      attacher: attachNodeAttributeGetter
    },
    {
      name: (element) => `get${element}Attributes`,
      attacher: attachNodeAttributesGetter
    },
    {
      name: (element) => `has${element}Attribute`,
      attacher: attachNodeAttributeChecker
    },
    {
      name: (element) => `set${element}Attribute`,
      attacher: attachNodeAttributeSetter
    },
    {
      name: (element) => `update${element}Attribute`,
      attacher: attachNodeAttributeUpdater
    },
    {
      name: (element) => `remove${element}Attribute`,
      attacher: attachNodeAttributeRemover
    },
    {
      name: (element) => `replace${element}Attributes`,
      attacher: attachNodeAttributesReplacer
    },
    {
      name: (element) => `merge${element}Attributes`,
      attacher: attachNodeAttributesMerger
    },
    {
      name: (element) => `update${element}Attributes`,
      attacher: attachNodeAttributesUpdater
    }
  ];
  EDGE_ATTRIBUTES_METHODS = [
    {
      name: (element) => `get${element}Attribute`,
      attacher: attachEdgeAttributeGetter
    },
    {
      name: (element) => `get${element}Attributes`,
      attacher: attachEdgeAttributesGetter
    },
    {
      name: (element) => `has${element}Attribute`,
      attacher: attachEdgeAttributeChecker
    },
    {
      name: (element) => `set${element}Attribute`,
      attacher: attachEdgeAttributeSetter
    },
    {
      name: (element) => `update${element}Attribute`,
      attacher: attachEdgeAttributeUpdater
    },
    {
      name: (element) => `remove${element}Attribute`,
      attacher: attachEdgeAttributeRemover
    },
    {
      name: (element) => `replace${element}Attributes`,
      attacher: attachEdgeAttributesReplacer
    },
    {
      name: (element) => `merge${element}Attributes`,
      attacher: attachEdgeAttributesMerger
    },
    {
      name: (element) => `update${element}Attributes`,
      attacher: attachEdgeAttributesUpdater
    }
  ];
  EDGES_ITERATION = [
    {
      name: "edges",
      type: "mixed"
    },
    {
      name: "inEdges",
      type: "directed",
      direction: "in"
    },
    {
      name: "outEdges",
      type: "directed",
      direction: "out"
    },
    {
      name: "inboundEdges",
      type: "mixed",
      direction: "in"
    },
    {
      name: "outboundEdges",
      type: "mixed",
      direction: "out"
    },
    {
      name: "directedEdges",
      type: "directed"
    },
    {
      name: "undirectedEdges",
      type: "undirected"
    }
  ];
  NEIGHBORS_ITERATION = [
    {
      name: "neighbors",
      type: "mixed"
    },
    {
      name: "inNeighbors",
      type: "directed",
      direction: "in"
    },
    {
      name: "outNeighbors",
      type: "directed",
      direction: "out"
    },
    {
      name: "inboundNeighbors",
      type: "mixed",
      direction: "in"
    },
    {
      name: "outboundNeighbors",
      type: "mixed",
      direction: "out"
    },
    {
      name: "directedNeighbors",
      type: "directed"
    },
    {
      name: "undirectedNeighbors",
      type: "undirected"
    }
  ];
  CompositeSetWrapper.prototype.wrap = function(set) {
    if (this.A === null)
      this.A = set;
    else if (this.B === null)
      this.B = set;
  };
  CompositeSetWrapper.prototype.has = function(key) {
    if (this.A !== null && key in this.A)
      return true;
    if (this.B !== null && key in this.B)
      return true;
    return false;
  };
  INSTANCE_ID = incrementalIdStartingFromRandomByte();
  TYPES = new Set(["directed", "undirected", "mixed"]);
  EMITTER_PROPS = new Set([
    "domain",
    "_events",
    "_eventsCount",
    "_maxListeners"
  ]);
  EDGE_ADD_METHODS = [
    {
      name: (verb) => `${verb}Edge`,
      generateKey: true
    },
    {
      name: (verb) => `${verb}DirectedEdge`,
      generateKey: true,
      type: "directed"
    },
    {
      name: (verb) => `${verb}UndirectedEdge`,
      generateKey: true,
      type: "undirected"
    },
    {
      name: (verb) => `${verb}EdgeWithKey`
    },
    {
      name: (verb) => `${verb}DirectedEdgeWithKey`,
      type: "directed"
    },
    {
      name: (verb) => `${verb}UndirectedEdgeWithKey`,
      type: "undirected"
    }
  ];
  DEFAULTS = {
    allowSelfLoops: true,
    multi: false,
    type: "mixed"
  };
  Graph = class Graph extends EventEmitter {
    constructor(options) {
      super();
      options = assign({}, DEFAULTS, options);
      if (typeof options.multi !== "boolean")
        throw new InvalidArgumentsGraphError(`Graph.constructor: invalid 'multi' option. Expecting a boolean but got "${options.multi}".`);
      if (!TYPES.has(options.type))
        throw new InvalidArgumentsGraphError(`Graph.constructor: invalid 'type' option. Should be one of "mixed", "directed" or "undirected" but got "${options.type}".`);
      if (typeof options.allowSelfLoops !== "boolean")
        throw new InvalidArgumentsGraphError(`Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got "${options.allowSelfLoops}".`);
      const NodeDataClass = options.type === "mixed" ? MixedNodeData : options.type === "directed" ? DirectedNodeData : UndirectedNodeData;
      privateProperty(this, "NodeDataClass", NodeDataClass);
      const instancePrefix = "geid_" + INSTANCE_ID() + "_";
      let edgeId = 0;
      const edgeKeyGenerator = () => {
        let availableEdgeKey;
        do {
          availableEdgeKey = instancePrefix + edgeId++;
        } while (this._edges.has(availableEdgeKey));
        return availableEdgeKey;
      };
      privateProperty(this, "_attributes", {});
      privateProperty(this, "_nodes", new Map);
      privateProperty(this, "_edges", new Map);
      privateProperty(this, "_directedSize", 0);
      privateProperty(this, "_undirectedSize", 0);
      privateProperty(this, "_directedSelfLoopCount", 0);
      privateProperty(this, "_undirectedSelfLoopCount", 0);
      privateProperty(this, "_edgeKeyGenerator", edgeKeyGenerator);
      privateProperty(this, "_options", options);
      EMITTER_PROPS.forEach((prop) => privateProperty(this, prop, this[prop]));
      readOnlyProperty(this, "order", () => this._nodes.size);
      readOnlyProperty(this, "size", () => this._edges.size);
      readOnlyProperty(this, "directedSize", () => this._directedSize);
      readOnlyProperty(this, "undirectedSize", () => this._undirectedSize);
      readOnlyProperty(this, "selfLoopCount", () => this._directedSelfLoopCount + this._undirectedSelfLoopCount);
      readOnlyProperty(this, "directedSelfLoopCount", () => this._directedSelfLoopCount);
      readOnlyProperty(this, "undirectedSelfLoopCount", () => this._undirectedSelfLoopCount);
      readOnlyProperty(this, "multi", this._options.multi);
      readOnlyProperty(this, "type", this._options.type);
      readOnlyProperty(this, "allowSelfLoops", this._options.allowSelfLoops);
      readOnlyProperty(this, "implementation", () => "graphology");
    }
    _resetInstanceCounters() {
      this._directedSize = 0;
      this._undirectedSize = 0;
      this._directedSelfLoopCount = 0;
      this._undirectedSelfLoopCount = 0;
    }
    hasNode(node) {
      return this._nodes.has("" + node);
    }
    hasDirectedEdge(source, target) {
      if (this.type === "undirected")
        return false;
      if (arguments.length === 1) {
        const edge = "" + source;
        const edgeData = this._edges.get(edge);
        return !!edgeData && !edgeData.undirected;
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData)
          return false;
        return nodeData.out.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
    }
    hasUndirectedEdge(source, target) {
      if (this.type === "directed")
        return false;
      if (arguments.length === 1) {
        const edge = "" + source;
        const edgeData = this._edges.get(edge);
        return !!edgeData && edgeData.undirected;
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData)
          return false;
        return nodeData.undirected.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
    }
    hasEdge(source, target) {
      if (arguments.length === 1) {
        const edge = "" + source;
        return this._edges.has(edge);
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData)
          return false;
        return typeof nodeData.out !== "undefined" && nodeData.out.hasOwnProperty(target) || typeof nodeData.undirected !== "undefined" && nodeData.undirected.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(`Graph.hasEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
    }
    directedEdge(source, target) {
      if (this.type === "undirected")
        return;
      source = "" + source;
      target = "" + target;
      if (this.multi)
        throw new UsageGraphError("Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.");
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.directedEdge: could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.directedEdge: could not find the "${target}" target node in the graph.`);
      const edgeData = sourceData.out && sourceData.out[target] || undefined;
      if (edgeData)
        return edgeData.key;
    }
    undirectedEdge(source, target) {
      if (this.type === "directed")
        return;
      source = "" + source;
      target = "" + target;
      if (this.multi)
        throw new UsageGraphError("Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.");
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.undirectedEdge: could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.undirectedEdge: could not find the "${target}" target node in the graph.`);
      const edgeData = sourceData.undirected && sourceData.undirected[target] || undefined;
      if (edgeData)
        return edgeData.key;
    }
    edge(source, target) {
      if (this.multi)
        throw new UsageGraphError("Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.");
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(`Graph.edge: could not find the "${source}" source node in the graph.`);
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(`Graph.edge: could not find the "${target}" target node in the graph.`);
      const edgeData = sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target] || undefined;
      if (edgeData)
        return edgeData.key;
    }
    areDirectedNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areDirectedNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return false;
      return neighbor in nodeData.in || neighbor in nodeData.out;
    }
    areOutNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areOutNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return false;
      return neighbor in nodeData.out;
    }
    areInNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areInNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return false;
      return neighbor in nodeData.in;
    }
    areUndirectedNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areUndirectedNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type === "directed")
        return false;
      return neighbor in nodeData.undirected;
    }
    areNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type !== "undirected") {
        if (neighbor in nodeData.in || neighbor in nodeData.out)
          return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected)
          return true;
      }
      return false;
    }
    areInboundNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areInboundNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type !== "undirected") {
        if (neighbor in nodeData.in)
          return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected)
          return true;
      }
      return false;
    }
    areOutboundNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.areOutboundNeighbors: could not find the "${node}" node in the graph.`);
      if (this.type !== "undirected") {
        if (neighbor in nodeData.out)
          return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected)
          return true;
      }
      return false;
    }
    inDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.inDegree: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.inDegree;
    }
    outDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.outDegree: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.outDegree;
    }
    directedDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.directedDegree: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.inDegree + nodeData.outDegree;
    }
    undirectedDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.undirectedDegree: could not find the "${node}" node in the graph.`);
      if (this.type === "directed")
        return 0;
      return nodeData.undirectedDegree;
    }
    inboundDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.inboundDegree: could not find the "${node}" node in the graph.`);
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree;
      }
      return degree;
    }
    outboundDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.outboundDegree: could not find the "${node}" node in the graph.`);
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.outDegree;
      }
      return degree;
    }
    degree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.degree: could not find the "${node}" node in the graph.`);
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree + nodeData.outDegree;
      }
      return degree;
    }
    inDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.inDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.inDegree - nodeData.directedLoops;
    }
    outDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.outDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.outDegree - nodeData.directedLoops;
    }
    directedDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.directedDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      if (this.type === "undirected")
        return 0;
      return nodeData.inDegree + nodeData.outDegree - nodeData.directedLoops * 2;
    }
    undirectedDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.undirectedDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      if (this.type === "directed")
        return 0;
      return nodeData.undirectedDegree - nodeData.undirectedLoops * 2;
    }
    inboundDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.inboundDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree;
        loops += nodeData.directedLoops;
      }
      return degree - loops;
    }
    outboundDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.outboundDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.outDegree;
        loops += nodeData.directedLoops;
      }
      return degree - loops;
    }
    degreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.degreeWithoutSelfLoops: could not find the "${node}" node in the graph.`);
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree + nodeData.outDegree;
        loops += nodeData.directedLoops * 2;
      }
      return degree - loops;
    }
    source(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.source: could not find the "${edge}" edge in the graph.`);
      return data.source.key;
    }
    target(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.target: could not find the "${edge}" edge in the graph.`);
      return data.target.key;
    }
    extremities(edge) {
      edge = "" + edge;
      const edgeData = this._edges.get(edge);
      if (!edgeData)
        throw new NotFoundGraphError(`Graph.extremities: could not find the "${edge}" edge in the graph.`);
      return [edgeData.source.key, edgeData.target.key];
    }
    opposite(node, edge) {
      node = "" + node;
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.opposite: could not find the "${edge}" edge in the graph.`);
      const source = data.source.key;
      const target = data.target.key;
      if (node === source)
        return target;
      if (node === target)
        return source;
      throw new NotFoundGraphError(`Graph.opposite: the "${node}" node is not attached to the "${edge}" edge (${source}, ${target}).`);
    }
    hasExtremity(edge, node) {
      edge = "" + edge;
      node = "" + node;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.hasExtremity: could not find the "${edge}" edge in the graph.`);
      return data.source.key === node || data.target.key === node;
    }
    isUndirected(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.isUndirected: could not find the "${edge}" edge in the graph.`);
      return data.undirected;
    }
    isDirected(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.isDirected: could not find the "${edge}" edge in the graph.`);
      return !data.undirected;
    }
    isSelfLoop(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(`Graph.isSelfLoop: could not find the "${edge}" edge in the graph.`);
      return data.source === data.target;
    }
    addNode(node, attributes) {
      const nodeData = addNode(this, node, attributes);
      return nodeData.key;
    }
    mergeNode(node, attributes) {
      if (attributes && !isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(`Graph.mergeNode: invalid attributes. Expecting an object but got "${attributes}"`);
      node = "" + node;
      attributes = attributes || {};
      let data = this._nodes.get(node);
      if (data) {
        if (attributes) {
          assign(data.attributes, attributes);
          this.emit("nodeAttributesUpdated", {
            type: "merge",
            key: node,
            attributes: data.attributes,
            data: attributes
          });
        }
        return [node, false];
      }
      data = new this.NodeDataClass(node, attributes);
      this._nodes.set(node, data);
      this.emit("nodeAdded", {
        key: node,
        attributes
      });
      return [node, true];
    }
    updateNode(node, updater) {
      if (updater && typeof updater !== "function")
        throw new InvalidArgumentsGraphError(`Graph.updateNode: invalid updater function. Expecting a function but got "${updater}"`);
      node = "" + node;
      let data = this._nodes.get(node);
      if (data) {
        if (updater) {
          const oldAttributes = data.attributes;
          data.attributes = updater(oldAttributes);
          this.emit("nodeAttributesUpdated", {
            type: "replace",
            key: node,
            attributes: data.attributes
          });
        }
        return [node, false];
      }
      const attributes = updater ? updater({}) : {};
      data = new this.NodeDataClass(node, attributes);
      this._nodes.set(node, data);
      this.emit("nodeAdded", {
        key: node,
        attributes
      });
      return [node, true];
    }
    dropNode(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(`Graph.dropNode: could not find the "${node}" node in the graph.`);
      let edgeData;
      if (this.type !== "undirected") {
        for (const neighbor in nodeData.out) {
          edgeData = nodeData.out[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
        for (const neighbor in nodeData.in) {
          edgeData = nodeData.in[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      if (this.type !== "directed") {
        for (const neighbor in nodeData.undirected) {
          edgeData = nodeData.undirected[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      this._nodes.delete(node);
      this.emit("nodeDropped", {
        key: node,
        attributes: nodeData.attributes
      });
    }
    dropEdge(edge) {
      let edgeData;
      if (arguments.length > 1) {
        const source = "" + arguments[0];
        const target = "" + arguments[1];
        edgeData = getMatchingEdge(this, source, target, this.type);
        if (!edgeData)
          throw new NotFoundGraphError(`Graph.dropEdge: could not find the "${source}" -> "${target}" edge in the graph.`);
      } else {
        edge = "" + edge;
        edgeData = this._edges.get(edge);
        if (!edgeData)
          throw new NotFoundGraphError(`Graph.dropEdge: could not find the "${edge}" edge in the graph.`);
      }
      dropEdgeFromData(this, edgeData);
      return this;
    }
    dropDirectedEdge(source, target) {
      if (arguments.length < 2)
        throw new UsageGraphError("Graph.dropDirectedEdge: it does not make sense to try and drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
      if (this.multi)
        throw new UsageGraphError("Graph.dropDirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
      source = "" + source;
      target = "" + target;
      const edgeData = getMatchingEdge(this, source, target, "directed");
      if (!edgeData)
        throw new NotFoundGraphError(`Graph.dropDirectedEdge: could not find a "${source}" -> "${target}" edge in the graph.`);
      dropEdgeFromData(this, edgeData);
      return this;
    }
    dropUndirectedEdge(source, target) {
      if (arguments.length < 2)
        throw new UsageGraphError("Graph.dropUndirectedEdge: it does not make sense to drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
      if (this.multi)
        throw new UsageGraphError("Graph.dropUndirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
      const edgeData = getMatchingEdge(this, source, target, "undirected");
      if (!edgeData)
        throw new NotFoundGraphError(`Graph.dropUndirectedEdge: could not find a "${source}" -> "${target}" edge in the graph.`);
      dropEdgeFromData(this, edgeData);
      return this;
    }
    clear() {
      this._edges.clear();
      this._nodes.clear();
      this._resetInstanceCounters();
      this.emit("cleared");
    }
    clearEdges() {
      const iterator = this._nodes.values();
      let step;
      while (step = iterator.next(), step.done !== true) {
        step.value.clear();
      }
      this._edges.clear();
      this._resetInstanceCounters();
      this.emit("edgesCleared");
    }
    getAttribute(name) {
      return this._attributes[name];
    }
    getAttributes() {
      return this._attributes;
    }
    hasAttribute(name) {
      return this._attributes.hasOwnProperty(name);
    }
    setAttribute(name, value) {
      this._attributes[name] = value;
      this.emit("attributesUpdated", {
        type: "set",
        attributes: this._attributes,
        name
      });
      return this;
    }
    updateAttribute(name, updater) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError("Graph.updateAttribute: updater should be a function.");
      const value = this._attributes[name];
      this._attributes[name] = updater(value);
      this.emit("attributesUpdated", {
        type: "set",
        attributes: this._attributes,
        name
      });
      return this;
    }
    removeAttribute(name) {
      delete this._attributes[name];
      this.emit("attributesUpdated", {
        type: "remove",
        attributes: this._attributes,
        name
      });
      return this;
    }
    replaceAttributes(attributes) {
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError("Graph.replaceAttributes: provided attributes are not a plain object.");
      this._attributes = attributes;
      this.emit("attributesUpdated", {
        type: "replace",
        attributes: this._attributes
      });
      return this;
    }
    mergeAttributes(attributes) {
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError("Graph.mergeAttributes: provided attributes are not a plain object.");
      assign(this._attributes, attributes);
      this.emit("attributesUpdated", {
        type: "merge",
        attributes: this._attributes,
        data: attributes
      });
      return this;
    }
    updateAttributes(updater) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError("Graph.updateAttributes: provided updater is not a function.");
      this._attributes = updater(this._attributes);
      this.emit("attributesUpdated", {
        type: "update",
        attributes: this._attributes
      });
      return this;
    }
    updateEachNodeAttributes(updater, hints) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError("Graph.updateEachNodeAttributes: expecting an updater function.");
      if (hints && !validateHints(hints))
        throw new InvalidArgumentsGraphError("Graph.updateEachNodeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        nodeData.attributes = updater(nodeData.key, nodeData.attributes);
      }
      this.emit("eachNodeAttributesUpdated", {
        hints: hints ? hints : null
      });
    }
    updateEachEdgeAttributes(updater, hints) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError("Graph.updateEachEdgeAttributes: expecting an updater function.");
      if (hints && !validateHints(hints))
        throw new InvalidArgumentsGraphError("Graph.updateEachEdgeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
      const iterator = this._edges.values();
      let step, edgeData, sourceData, targetData;
      while (step = iterator.next(), step.done !== true) {
        edgeData = step.value;
        sourceData = edgeData.source;
        targetData = edgeData.target;
        edgeData.attributes = updater(edgeData.key, edgeData.attributes, sourceData.key, targetData.key, sourceData.attributes, targetData.attributes, edgeData.undirected);
      }
      this.emit("eachEdgeAttributesUpdated", {
        hints: hints ? hints : null
      });
    }
    forEachAdjacencyEntry(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.forEachAdjacencyEntry: expecting a callback.");
      forEachAdjacency(false, false, false, this, callback);
    }
    forEachAdjacencyEntryWithOrphans(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.forEachAdjacencyEntryWithOrphans: expecting a callback.");
      forEachAdjacency(false, false, true, this, callback);
    }
    forEachAssymetricAdjacencyEntry(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.forEachAssymetricAdjacencyEntry: expecting a callback.");
      forEachAdjacency(false, true, false, this, callback);
    }
    forEachAssymetricAdjacencyEntryWithOrphans(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.forEachAssymetricAdjacencyEntryWithOrphans: expecting a callback.");
      forEachAdjacency(false, true, true, this, callback);
    }
    nodes() {
      return Array.from(this._nodes.keys());
    }
    forEachNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.forEachNode: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        callback(nodeData.key, nodeData.attributes);
      }
    }
    findNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.findNode: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes))
          return nodeData.key;
      }
      return;
    }
    mapNodes(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.mapNode: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      const result = new Array(this.order);
      let i = 0;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        result[i++] = callback(nodeData.key, nodeData.attributes);
      }
      return result;
    }
    someNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.someNode: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes))
          return true;
      }
      return false;
    }
    everyNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.everyNode: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (!callback(nodeData.key, nodeData.attributes))
          return false;
      }
      return true;
    }
    filterNodes(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.filterNodes: expecting a callback.");
      const iterator = this._nodes.values();
      let step, nodeData;
      const result = [];
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes))
          result.push(nodeData.key);
      }
      return result;
    }
    reduceNodes(callback, initialValue) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError("Graph.reduceNodes: expecting a callback.");
      if (arguments.length < 2)
        throw new InvalidArgumentsGraphError("Graph.reduceNodes: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.");
      let accumulator = initialValue;
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        accumulator = callback(accumulator, nodeData.key, nodeData.attributes);
      }
      return accumulator;
    }
    nodeEntries() {
      const iterator = this._nodes.values();
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          const step = iterator.next();
          if (step.done)
            return step;
          const data = step.value;
          return {
            value: { node: data.key, attributes: data.attributes },
            done: false
          };
        }
      };
    }
    export() {
      const nodes = new Array(this._nodes.size);
      let i = 0;
      this._nodes.forEach((data, key) => {
        nodes[i++] = serializeNode(key, data);
      });
      const edges = new Array(this._edges.size);
      i = 0;
      this._edges.forEach((data, key) => {
        edges[i++] = serializeEdge(this.type, key, data);
      });
      return {
        options: {
          type: this.type,
          multi: this.multi,
          allowSelfLoops: this.allowSelfLoops
        },
        attributes: this.getAttributes(),
        nodes,
        edges
      };
    }
    import(data, merge = false) {
      if (data instanceof Graph) {
        data.forEachNode((n, a) => {
          if (merge)
            this.mergeNode(n, a);
          else
            this.addNode(n, a);
        });
        data.forEachEdge((e, a, s, t, _sa, _ta, u) => {
          if (merge) {
            if (u)
              this.mergeUndirectedEdgeWithKey(e, s, t, a);
            else
              this.mergeDirectedEdgeWithKey(e, s, t, a);
          } else {
            if (u)
              this.addUndirectedEdgeWithKey(e, s, t, a);
            else
              this.addDirectedEdgeWithKey(e, s, t, a);
          }
        });
        return this;
      }
      if (!isPlainObject(data))
        throw new InvalidArgumentsGraphError("Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.");
      if (data.attributes) {
        if (!isPlainObject(data.attributes))
          throw new InvalidArgumentsGraphError("Graph.import: invalid attributes. Expecting a plain object.");
        if (merge)
          this.mergeAttributes(data.attributes);
        else
          this.replaceAttributes(data.attributes);
      }
      let i, l, list, node, edge;
      if (data.nodes) {
        list = data.nodes;
        if (!Array.isArray(list))
          throw new InvalidArgumentsGraphError("Graph.import: invalid nodes. Expecting an array.");
        for (i = 0, l = list.length;i < l; i++) {
          node = list[i];
          validateSerializedNode(node);
          const { key, attributes } = node;
          if (merge)
            this.mergeNode(key, attributes);
          else
            this.addNode(key, attributes);
        }
      }
      if (data.edges) {
        let undirectedByDefault = false;
        if (this.type === "undirected") {
          undirectedByDefault = true;
        }
        list = data.edges;
        if (!Array.isArray(list))
          throw new InvalidArgumentsGraphError("Graph.import: invalid edges. Expecting an array.");
        for (i = 0, l = list.length;i < l; i++) {
          edge = list[i];
          validateSerializedEdge(edge);
          const {
            source,
            target,
            attributes,
            undirected = undirectedByDefault
          } = edge;
          let method;
          if ("key" in edge) {
            method = merge ? undirected ? this.mergeUndirectedEdgeWithKey : this.mergeDirectedEdgeWithKey : undirected ? this.addUndirectedEdgeWithKey : this.addDirectedEdgeWithKey;
            method.call(this, edge.key, source, target, attributes);
          } else {
            method = merge ? undirected ? this.mergeUndirectedEdge : this.mergeDirectedEdge : undirected ? this.addUndirectedEdge : this.addDirectedEdge;
            method.call(this, source, target, attributes);
          }
        }
      }
      return this;
    }
    nullCopy(options) {
      const graph = new Graph(assign({}, this._options, options));
      graph.replaceAttributes(assign({}, this.getAttributes()));
      return graph;
    }
    emptyCopy(options) {
      const graph = this.nullCopy(options);
      this._nodes.forEach((nodeData, key) => {
        const attributes = assign({}, nodeData.attributes);
        nodeData = new graph.NodeDataClass(key, attributes);
        graph._nodes.set(key, nodeData);
      });
      return graph;
    }
    copy(options) {
      options = options || {};
      if (typeof options.type === "string" && options.type !== this.type && options.type !== "mixed")
        throw new UsageGraphError(`Graph.copy: cannot create an incompatible copy from "${this.type}" type to "${options.type}" because this would mean losing information about the current graph.`);
      if (typeof options.multi === "boolean" && options.multi !== this.multi && options.multi !== true)
        throw new UsageGraphError("Graph.copy: cannot create an incompatible copy by downgrading a multi graph to a simple one because this would mean losing information about the current graph.");
      if (typeof options.allowSelfLoops === "boolean" && options.allowSelfLoops !== this.allowSelfLoops && options.allowSelfLoops !== true)
        throw new UsageGraphError("Graph.copy: cannot create an incompatible copy from a graph allowing self loops to one that does not because this would mean losing information about the current graph.");
      const graph = this.emptyCopy(options);
      const iterator = this._edges.values();
      let step, edgeData;
      while (step = iterator.next(), step.done !== true) {
        edgeData = step.value;
        addEdge(graph, "copy", false, edgeData.undirected, edgeData.key, edgeData.source.key, edgeData.target.key, assign({}, edgeData.attributes));
      }
      return graph;
    }
    toJSON() {
      return this.export();
    }
    toString() {
      return "[object Graph]";
    }
    inspect() {
      const nodes = {};
      this._nodes.forEach((data, key) => {
        nodes[key] = data.attributes;
      });
      const edges = {}, multiIndex = {};
      this._edges.forEach((data, key) => {
        const direction = data.undirected ? "--" : "->";
        let label = "";
        let source = data.source.key;
        let target = data.target.key;
        let tmp;
        if (data.undirected && source > target) {
          tmp = source;
          source = target;
          target = tmp;
        }
        const desc = `(${source})${direction}(${target})`;
        if (!key.startsWith("geid_")) {
          label += `[${key}]: `;
        } else if (this.multi) {
          if (typeof multiIndex[desc] === "undefined") {
            multiIndex[desc] = 0;
          } else {
            multiIndex[desc]++;
          }
          label += `${multiIndex[desc]}. `;
        }
        label += desc;
        edges[label] = data.attributes;
      });
      const dummy = {};
      for (const k in this) {
        if (this.hasOwnProperty(k) && !EMITTER_PROPS.has(k) && typeof this[k] !== "function" && typeof k !== "symbol")
          dummy[k] = this[k];
      }
      dummy.attributes = this._attributes;
      dummy.nodes = nodes;
      dummy.edges = edges;
      privateProperty(dummy, "constructor", this.constructor);
      return dummy;
    }
  };
  if (typeof Symbol !== "undefined")
    Graph.prototype[Symbol.for("nodejs.util.inspect.custom")] = Graph.prototype.inspect;
  EDGE_ADD_METHODS.forEach((method) => {
    ["add", "merge", "update"].forEach((verb) => {
      const name = method.name(verb);
      const fn = verb === "add" ? addEdge : mergeEdge;
      if (method.generateKey) {
        Graph.prototype[name] = function(source, target, attributes) {
          return fn(this, name, true, (method.type || this.type) === "undirected", null, source, target, attributes, verb === "update");
        };
      } else {
        Graph.prototype[name] = function(edge, source, target, attributes) {
          return fn(this, name, false, (method.type || this.type) === "undirected", edge, source, target, attributes, verb === "update");
        };
      }
    });
  });
  attachNodeAttributesMethods(Graph);
  attachEdgeAttributesMethods(Graph);
  attachEdgeIterationMethods(Graph);
  attachNeighborIterationMethods(Graph);
  DirectedGraph = class DirectedGraph extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "directed" }, options);
      if ("multi" in finalOptions && finalOptions.multi !== false)
        throw new InvalidArgumentsGraphError("DirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
      if (finalOptions.type !== "directed")
        throw new InvalidArgumentsGraphError('DirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!');
      super(finalOptions);
    }
  };
  UndirectedGraph = class UndirectedGraph extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "undirected" }, options);
      if ("multi" in finalOptions && finalOptions.multi !== false)
        throw new InvalidArgumentsGraphError("UndirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
      if (finalOptions.type !== "undirected")
        throw new InvalidArgumentsGraphError('UndirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!');
      super(finalOptions);
    }
  };
  MultiGraph = class MultiGraph extends Graph {
    constructor(options) {
      const finalOptions = assign({ multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError("MultiGraph.from: inconsistent indication that the graph should be simple in given options!");
      super(finalOptions);
    }
  };
  MultiDirectedGraph = class MultiDirectedGraph extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "directed", multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError("MultiDirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
      if (finalOptions.type !== "directed")
        throw new InvalidArgumentsGraphError('MultiDirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!');
      super(finalOptions);
    }
  };
  MultiUndirectedGraph = class MultiUndirectedGraph extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "undirected", multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError("MultiUndirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
      if (finalOptions.type !== "undirected")
        throw new InvalidArgumentsGraphError('MultiUndirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!');
      super(finalOptions);
    }
  };
  attachStaticFromMethod(Graph);
  attachStaticFromMethod(DirectedGraph);
  attachStaticFromMethod(UndirectedGraph);
  attachStaticFromMethod(MultiGraph);
  attachStaticFromMethod(MultiDirectedGraph);
  attachStaticFromMethod(MultiUndirectedGraph);
  Graph.Graph = Graph;
  Graph.DirectedGraph = DirectedGraph;
  Graph.UndirectedGraph = UndirectedGraph;
  Graph.MultiGraph = MultiGraph;
  Graph.MultiDirectedGraph = MultiDirectedGraph;
  Graph.MultiUndirectedGraph = MultiUndirectedGraph;
  Graph.InvalidArgumentsGraphError = InvalidArgumentsGraphError;
  Graph.NotFoundGraphError = NotFoundGraphError;
  Graph.UsageGraphError = UsageGraphError;
});

// ../../packages/detection/src/graph.ts
function projectEvidenceGraph(entities, evidence) {
  const graph = new MultiGraph;
  for (const entity of entities) {
    if (!graph.hasNode(entity.id))
      graph.addNode(entity.id, { entityId: entity.id });
  }
  for (const edge of evidence) {
    if (!graph.hasNode(edge.sourceEntityId)) {
      graph.addNode(edge.sourceEntityId, { entityId: edge.sourceEntityId });
    }
    if (!graph.hasNode(edge.targetEntityId)) {
      graph.addNode(edge.targetEntityId, { entityId: edge.targetEntityId });
    }
    if (edge.sourceEntityId === edge.targetEntityId)
      continue;
    graph.addUndirectedEdgeWithKey(edge.id, edge.sourceEntityId, edge.targetEntityId, {
      evidenceId: edge.id,
      evidenceType: edge.type,
      originallyDirected: edge.directed,
      weight: edge.contribution
    });
  }
  return graph;
}
var init_graph = __esm(() => {
  init_graphology();
});

// ../../packages/detection/src/scoring.ts
function pairKey(left, right) {
  return left < right ? `${left}\x00${right}` : `${right}\x00${left}`;
}
function extractCommunityFeatures(community, entities, transactions, evidence, categoryBaselines, categoryAnomalyByEntity) {
  const members = new Set(community.memberIds);
  const internal = evidence.filter((edge) => members.has(edge.sourceEntityId) && members.has(edge.targetEntityId));
  const possiblePairs = Math.max(1, community.memberIds.length * (community.memberIds.length - 1) / 2);
  const uniquePairs = new Set(internal.map((edge) => pairKey(edge.sourceEntityId, edge.targetEntityId)));
  const densityFor = (type) => clamp(internal.filter((edge) => edge.type === type).reduce((sum, edge) => sum + edge.contribution, 0) / possiblePairs);
  const payoutMembers = new Set(internal.filter((edge) => edge.type === "shared_payout_account").flatMap((edge) => [edge.sourceEntityId, edge.targetEntityId]));
  return {
    fastFlowDensity: densityFor("fast_flow"),
    payoutConcentration: clamp(payoutMembers.size / Math.max(1, community.memberIds.length)),
    sharedDeviceDensity: densityFor("shared_device"),
    graphDensity: clamp(uniquePairs.size / possiblePairs),
    categoryAnomaly: categoryAnomalyByEntity === undefined ? categoryAnomalyForMembers(members, entities, transactions, categoryBaselines) : (() => {
      const values = [...members].flatMap((entityId) => {
        const value = categoryAnomalyByEntity[entityId];
        return value === undefined ? [] : [value];
      });
      return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
    })()
  };
}
function scoreFeatures(features, weights) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0)
    return 0;
  const weighted = features.fastFlowDensity * weights.fastFlowDensity + features.payoutConcentration * weights.payoutConcentration + features.sharedDeviceDensity * weights.sharedDeviceDensity + features.graphDensity * weights.graphDensity + features.categoryAnomaly * weights.categoryAnomaly;
  return Math.round(weighted / totalWeight * 1e5) / 1000;
}
function riskBand(score, bands) {
  if (score >= bands.critical)
    return "critical";
  if (score >= bands.elevated)
    return "elevated";
  if (score >= bands.review)
    return "review";
  return "monitor";
}
function explanations(features) {
  const labels = [
    ["fastFlowDensity", "rapid pass-through"],
    ["payoutConcentration", "shared payout concentration"],
    ["sharedDeviceDensity", "shared-device density"],
    ["graphDensity", "network density"],
    ["categoryAnomaly", "category deviation"]
  ];
  return labels.sort(([left], [right]) => features[right] - features[left]).slice(0, 3).map(([feature, label]) => `${label}: ${(features[feature] * 100).toFixed(1)}%`);
}
function scoreCommunities(input) {
  const categoryAnomalyByEntity = categoryAnomalyScores(input.entities, input.transactions, input.categoryBaselines);
  return input.communities.map((community) => {
    const features = extractCommunityFeatures(community, input.entities, input.transactions, input.evidence, input.categoryBaselines, categoryAnomalyByEntity);
    const score = scoreFeatures(features, input.weights);
    const members = new Set(community.memberIds);
    const internalEvidenceTypes = new Set(input.evidence.filter((edge) => members.has(edge.sourceEntityId) && members.has(edge.targetEntityId)).map((edge) => edge.type));
    const flagEligible = internalEvidenceTypes.has("fast_flow") || internalEvidenceTypes.has("shared_payout_account");
    return {
      ...community,
      rank: 0,
      score,
      riskBand: riskBand(score, input.bands),
      flagged: flagEligible && score >= input.threshold,
      flagEligible,
      features,
      explanation: explanations(features)
    };
  }).sort((left, right) => right.score - left.score || left.ordinal - right.ordinal).map((community, index) => ({ ...community, rank: index + 1 }));
}
function communitiesFromPartition(partition, modularity) {
  const members = new Map;
  for (const [entityId, ordinal] of Object.entries(partition)) {
    const group = members.get(ordinal) ?? [];
    group.push(entityId);
    members.set(ordinal, group);
  }
  return [...members].sort(([left], [right]) => left - right).map(([ordinal, memberIds]) => ({
    ordinal,
    memberIds: memberIds.sort(),
    modularity
  }));
}
var clamp = (value) => Math.max(0, Math.min(1, value));
var init_scoring = () => {};

// ../../packages/detection/src/tuning.ts
function tuneDetector(input) {
  const ringMemberIds = new Set(input.truthGroups.filter((group) => group.kind === "ring").flatMap((group) => group.memberIds));
  const categoryBaselines = fitCategoryBaselines(input.entities, input.transactions, ringMemberIds);
  const attempts = [];
  for (const resolution of input.profile.resolutionCandidates) {
    const partition = detectCommunities(input.graph, {
      profile: input.profile,
      resolution
    });
    const candidates = communitiesFromPartition(partition.communities, partition.modularity);
    for (const [
      weightIndex,
      weights
    ] of input.profile.weightCandidates.entries()) {
      const communities = scoreCommunities({
        communities: candidates,
        entities: input.entities,
        transactions: input.transactions,
        evidence: input.evidence,
        weights,
        threshold: 0,
        bands: input.profile.bands,
        categoryBaselines
      });
      const evaluation = evaluateThresholds(communities, input.truthGroups, input.profile);
      attempts.push({
        candidate: {
          resolution,
          weightIndex,
          threshold: evaluation.selected.threshold,
          totalCostPaise: evaluation.selected.totalCostPaise,
          ringRecall: evaluation.selected.ringRecall,
          communityPrecision: evaluation.selected.communityPrecision
        },
        communities,
        evaluation
      });
    }
  }
  const best = attempts.sort((left, right) => Number(BigInt(left.candidate.totalCostPaise) - BigInt(right.candidate.totalCostPaise)) || right.candidate.ringRecall - left.candidate.ringRecall || right.candidate.communityPrecision - left.candidate.communityPrecision || left.candidate.resolution - right.candidate.resolution || left.candidate.weightIndex - right.candidate.weightIndex)[0];
  if (!best)
    throw new Error("Detector profile produced no tuning candidates.");
  return {
    selected: best.candidate,
    candidates: attempts.map((attempt) => attempt.candidate),
    communities: best.communities.map((community) => ({
      ...community,
      flagged: community.flagEligible && community.score >= best.candidate.threshold
    })),
    evaluation: best.evaluation,
    categoryBaselines
  };
}
var init_tuning = __esm(() => {
  init_communities();
  init_scoring();
});

// ../../packages/detection/src/index.ts
var init_src = __esm(() => {
  init_communities();
  init_evidence();
  init_graph();
  init_scoring();
  init_tuning();
});
init_src();

export {
  tuneDetector,
  scoreCommunities,
  projectEvidenceGraph,
  formatDiagnosisReport,
  fitCategoryBaselines,
  extractCommunityFeatures,
  evaluateThresholds,
  evaluateAtThreshold,
  diagnoseFalsePositives,
  detectCommunities,
  deriveEvidence,
  communitiesFromPartition,
  categoryAnomalyScores,
  categoryAnomalyForMembers
};
