(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}(function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var isVoid = function (x) { return x == undefined; };
    var getType = function (x) { return isVoid(x) ? 'void' : Object.prototype.toString.call(x).slice(8, -1).toLowerCase(); };
    var isFn = function (x) { return getType(x) === 'function'; };
    var constructor = {
        date: function (x) { return +x; },
        string: String,
        number: Number,
        // The priority of true is greater than false
        boolean: function (x) { return !x; },
        symbol: function (x) { return x.toString(); }
    };
    // 比较值的大小的方法
    var by = {
        default: function (a, b) {
            var typeA = getType(a);
            var typeB = getType(b);
            if (typeA === 'void' || typeB === 'void') {
                return by.void(a, b, typeA, typeB);
            }
            else {
                var canSort = constructor[typeA] && typeA === typeB;
                !canSort && console.warn("[TIP] \u4E0D\u80FD\u6392\u5E8F\u5BF9 " + a + " \u548C " + b + " \u6392\u5E8F\uFF0C\u5FFD\u7565\u6B64\u6B21\u6BD4\u8F83\u3002\u4F60\u53EF\u4EE5\u4F20\u5165\u81EA\u5B9A\u4E49\u6392\u5E8F\u51FD\u6570\u5BF9\u5BF9\u8C61\u8FDB\u884C\u6392\u5E8F\u3002");
                return canSort
                    ? by.type(typeA)(a, b)
                    : undefined;
            }
        },
        type: function (type) { return function (a, b) {
            var Type = isFn(type) ? type : constructor[type];
            if (!Type)
                throw new Error("Error occured when compare value " + a + " with value " + b);
            var va = Type(a), vb = Type(b);
            return va === vb ? 0 : (va < vb ? -1 : 1);
        }; },
        void: function (a, b, ta, tb) {
            if (ta === tb)
                return 0;
            if (a)
                return -1;
            if (b)
                return 1;
        }
    };
    // 排序实例，用来维护排序管道和排序方法
    function Sort() {
        this.compare = null;
        this.pipeline = [];
    }
    // 给管道添加解构方法，用于解构对象并处理值
    // @example
    // sort.map(x => String(x.a))
    // 从 x 中取得 a 属性并转换为字符串，再继续比较
    Sort.prototype.map = function (_value) {
        this.pipeline.push({ _value: _value, _type: 'map' });
        return this;
    };
    // 给管道添加插件，用于调整排序动作
    // @example
    // sort.plugin(fn => (a, b) => -fn(a, b))
    // 将上一个排序结果反转
    Sort.prototype.plugin = function (_value) {
        this.pipeline.push({ _value: _value, _type: 'plugin' });
        return this;
    };
    // 设定排序方法，用来处理排序的值的顺序
    Sort.prototype.sortby = function (fn) {
        this.compare = isFn(fn) ? fn : by.type(fn.toLowerCase());
    };
    // 空过程函数（接受一个函数，返回一个接受参数并返回该函数处理参数的结果的函数）
    var pass = function (sortFn) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return sortFn.apply(void 0, args);
    }; };
    // 将管道合并为函数
    Sort.prototype.seal = function () {
        this.compare = this.compare || by.default;
        var plugin = function (plug) { return function (sortFn) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return plug(sortFn.apply(void 0, args));
        }; }; };
        var mapping = function (map) { return function (sortFn) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return sortFn.apply(void 0, args.map(function (x) { return map(x); }));
        }; }; };
        return this.pipeline.reduce(function (lastSortFn, current) {
            var _type = current._type, _value = current._value;
            if (_type === 'map')
                return mapping(lastSortFn(_value));
            if (_type === 'plugin')
                return plugin(_value)(lastSortFn);
        }, pass)(this.compare);
    };
    // 初始插件
    var plugins = {
        by: function (sort, args) { return sort.sortby(args); },
        i: function (sort) { return sort.map(function (x) { return (x || '').toLowerCase(); }); },
        asc: function (sort) { return sort.plugin(pass); },
        dec: function (sort) { return sort.plugin(function (fn) { return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return -fn.apply(void 0, args);
        }; }); },
        rand: function (sort) { return sort.plugin(function () { return function () { return Math.random() < .5 ? -1 : 1; }; }); },
        is: function (sort, args) {
            if (args === void 0) { args = ''; }
            return sort.map(function (x) { return x === args; }).sortby('boolean');
        },
        all: function (sort, args) {
            if (args === void 0) { args = ''; }
            return sort.map(function (x) { return x.every ? x.every(function (y) { return String(y) === args; }) : x === args; }).sortby('boolean');
        },
        has: function (sort, args) { return sort.map(function (x) { return x.some(function (y) { return String(y) === args; }); }).sortby('boolean'); },
        not: function (sort, args) {
            if (args === void 0) { args = ''; }
            return sort.map(function (x) { return args ? (x !== args) : !x; }).sortby('boolean');
        },
        len: function (sort, args) {
            if (args === void 0) { args = null; }
            return isVoid(args)
                ? sort.map(function (x) { return x.length; }).sortby('number')
                : sort.map(function (x) { return x.length === args; }).sortby('boolean');
        },
        // 默认使用解构插件，处理对象的属性如 'a.b.c' 的值
        default: function (name) {
            var pathsStore = name.split('.');
            var getVal = function (x) {
                var paths = __spreadArrays(pathsStore);
                var val = x, next = null;
                while (val && paths.length) {
                    next = paths.shift();
                    val = val[next];
                }
                return val;
            };
            return function (sort) { return sort.map(getVal); };
        }
    };
    // 从字符串指令中得到排序函数
    function generate(s) {
        var sort = new Sort();
        var actions = s.split('-').slice(0);
        actions = actions.filter(function (x) { return x; })
            .map(function (action) {
            var _a = action.match(/([^(]+)(\(([^)]*)\))?/), all = _a[0], name = _a[1], argsWithQuote = _a[2], args = _a[3];
            var plugin = argsWithQuote
                ? plugins[name]
                : plugins.default(name);
            plugin(sort, args || undefined);
        });
        return sort.seal();
    }
    /**
     * 初始化函数，根据传入的指令（或函数），获得对应的排序方法
     * @returns {function} sortFn 排序方法，可用于 Array.prototype.sort 参数
     * @todo 根据参数可选是否覆盖 Array.prototype.sort
     */
    function factory() {
        var cmd = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cmd[_i] = arguments[_i];
        }
        cmd = cmd.reduce(function (h, c) { return (h.concat(c)); }, []);
        if (cmd.length < 1)
            return undefined;
        var sortFns = cmd.map(function (x, i) {
            try {
                return isFn(x) ? x : generate(x);
            }
            catch (error) {
                throw new Error("Error on generate sort function, Index " + (i + 1) + "th: " + x + ".");
            }
        });
        var flat = function (fns) { return function (a, b) { return fns.reduce(function (sortResult, fn) { return sortResult || fn(a, b); }, 0); }; };
        return flat(sortFns);
    }
    /**
     * 自定义插件
     * @todo 自定义排序逻辑
     */
    factory.extends = function extendPlugin(exts) {
        if (exts === void 0) { exts = {}; }
        Object.entries(exts).map(function (_a) {
            var k = _a[0], v = _a[1];
            plugins[k] = v;
        });
    };
    module.exports = factory;
    //# sourceMappingURL=index.js.map

}));
//# sourceMappingURL=index.js.map
