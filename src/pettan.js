/** Pettan.js -Event Library- v0.2 **/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports === 'object' &&
    typeof exports.nodeName !== 'string') {

    factory(exports);
  } else {
    factory(root);
  }
})(this, function (exports) {
  function PettanError (context, method, message, eventName) {
    this.message = '[' + method + ']' +  (typeof eventName !== 'undefined' ?
      ('(' + eventName + '): ' + message) : message);
    this.stack = Error().stack;
  }

  PettanError.prototype = Object.create(Error.prototype);
  PettanError.prototype.name = 'PettanError';

  function NativeEventRecord (source, eventName, options) {
    var self = this;
    this._source = source;
    this._options = options;
    this._externalListener = null;
    this._internalListener = (function () {
      if (self._externalListener !== null) {
        self._externalListener.apply(this, arguments);
      }
    }).bind(source);

    this._source.addEventListener(eventName,
      this._internalListener, this._options);
  }

  NativeEventRecord.prototype.setListener = function (externalListener) {
    this._externalListener = externalListener;
  }

  NativeEventRecord.prototype.destroy = function () {
    if (!this._source === null) {
      this._source.removeEventListener(eventName,
        this._internalListener, this._options);
      this._source = null;
      this._options = null;
      this._internalListener = null;
    }
  }

  function EventRecord () {

  }

  function BindContext (instance, eventName, context) {
    this._pettan = instance;
    this._eventName = eventName;
    this.context = context;
  }
  BindContext.prototype.listen = function (handler) {

  }

  function EmitContext () {

  }

  EmitContext.protoype.queue = function () {

  }

  function Pettan () {
    this._customEvents = {};
    this._nativeEvents = {};
    this._errorHandler = null;
  };

  Pettan.prototype.setUncaughtHandler = function (handler) {
    if (typeof handler === 'function') {
      this._errorHandler = handler;
    }
  };

  Pettan.prototype.bind = function (item,
    nativeEventName,
    pettanEventName,
    options) {

    if (typeof item === 'undefined' ||
      typeof nativeEventName !== 'string' ||
      typeof pettanEventName !== 'string') {

      throw new PettanError('bind',
        'Missing or bad parameters', pettanEventName);
    }
    if (!('addEventListener' in item)) {
      throw new PettanError('bind',
        'Item is not a native event emitter', pettanEventName);
    }

    if (!(pettanEventName in this._nativeEvents)) {
      this._nativeEvents[pettanEventName] = [];
    }

    var record = new NativeEventRecord(item, nativeEventName, options);
    this._nativeEvents[pettanEventName].push(record);
    record.setListener((function () {
      this.emit.apply(this, [pettanEventName].concat(arguments));
    }).bind(this));

    return new BindContext(this, pettanEventName, record);
  };

  Pettan.prototype.unbind = function (pettanEventName, record) {
    if (pettanEventName in this._nativeEvents) {
      if (typeof record === 'undefined') {
        this._nativeEvents[pettanEventName].forEach(function (record) {
          record.destroy();
        });
        this._nativeEvents[pettanEventName] = [];
      } else {
        var recordIndex = this._nativeEvents[pettanEventName].indexOf(record);
        if (recordIndex >= 0) {
          this._nativeEvents[pettanEventName].splice(recordIndex, 1);
        }
        record.destroy();
      }
    }
  };

  Pettan.prototype.listen = function (eventName, handler) {
    if (typeof eventName !== 'string' || typeof handler === 'undefined') {

    }
    if (!(eventName in this.bindings)) {
      this.bindings[eventName] = [];
    }
    this.bindings[eventName].push(handler);
  };

  Pettan.prototype.emit = function (eventName, data) {
    var promise = Promise.resolve(data);
    if (eventName in this.bindings) {
      for (var i = 0; i < this.bindings[eventName].length; i++) {
        promise = promise.then(this.bindings[eventName][i]);
      }
    }
    return promise.catch((function (e) {
      if (this._errorHandler !== null) {
        this._errorHandler(e);
      }
      // Always rethrow
      throw e;
    }).bind(this));
  };

  // Drop all bindings for event
  Pettan.prototype.drop = function (eventName) {
    if (eventName in this.bindings) {
      delete this.bindings[eventName];
    }
    if (eventName in this.nativeBindings) {
      delete this.nativeBindings[eventName];
    }
  };

  Pettan.prototype.rename = function (eventOldName, eventNewName) {
    if (eventNewName in this.bindings &&
      this.bindings[eventNewName].length !== 0) {

      throw new Error('Cannot rename to ' + eventNewName + '. ' +
        'A non-empty listener group with the same name already exists.');
    }
    // Find native binding
    if (eventOldName in this.nativeBindings) {
      if (eventNewName in this.nativeBindings &&
        this.nativeBindings[eventNewName].length !== 0) {

        throw new Error('Cannot rename native bindings for ' + eventOldName +
          ' to ' + eventNewName + '. Naming conflict at target.');
      }
      this.nativeBindings[eventOldName].forEach(function (boundObject) {
        boundObject.eventName = eventNewName;
      });
      this.nativeBindings[eventNewName] = this.nativeBindings[eventOldName];
      delete this.nativeBindings[eventOldName];
    }
    if (eventOldName in this.bindings) {
      this.bindings[eventNewName] = this.bindings[eventOldName];
      delete this.bindings[eventOldName];
    }
  };

  Pettan.prototype.next = function (value) {
    return function () {
      return value;
    };
  };
  exports.Pettan = Pettan;
  exports.PettanError = PettanError;
})();
