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

    this._source.addEventListener(eventName, this._internalListener,
      this._options);
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

  function EventRecord (handler) {
    this._handler = handler;
  }

  EventRecord.prototype.asPromised = function() {
    var parentArgs = arguments;
    return new Promise((function (resolve, reject) {
      try {
        resolve(this._handler.apply(this, parentArgs));
      } catch (e) {
        reject(e);
      }
    }).bind(this));
  }

  EventRecord.prototype.destroy = function () {
    // destructor does nothing
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

  EmitContext.prototype.queue = function () {

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
      throw new PettanError('listen', 'Missing or bad parameters', eventName);
    }

    if (!(eventName in this._customEvents)) {
      this._customEvents[eventName] = [];
    }
    var record = new EventRecord(handler);
    this._customEvents[eventName].push(record);
    return record;
  };

  Pettan.prototype.emit = function (eventName) {
    var params = arguments.slice(1);
    if (typeof eventName !== 'string' || typeof handler === 'undefined') {
      throw new PettanError('listen', 'Missing or bad parameters', eventName);
    }
    if (eventName in this._customEvents) {
      return Promise.all(this._customEvents.map(function (eventRecord) {
        return eventRecord.asPromised.apply(eventRecord, params);
      })).catch((function (e) {
        if (this._errorHandler !== null) {
          this._errorHandler(e);
        }
        throw e;
      }).bind(this)).then(function (results) {
        return new EmitContext(params, results);
      });
    } else {
      return Promise.resolve(new EmitContext(params, []));
      // Nothing to apply to
    }
  };

  Pettan.prototype.drop = function (eventName) {
    // Drop all bindings for event but not native bindings
    if (eventName in this._customEvents) {
      this._customEvents.forEach(function (eventRecord) {
        eventRecord.destroy();
      });
      delete this._customEvents[eventName];
    }
  };

  Pettan.prototype.rename = function (oldEventName, newEventName) {
    if (typeof oldEventName !== 'string' || typeof newEventName !== 'string') {
      throw new PettanError('rename', 'Missing or bad parameters',
        oldEventName);
    }
    if (newEventName === oldEventName) {
      throw new PettanError('rename', 'Cannot rename to the same name',
        oldEventName);
    }
    if (!(oldEventName in this._customEvents)) {
      throw new PettanError('rename', 'Source event does not exist',
        oldEventName);
    }
    if (newEventName in this._customEvents &&
      this._customEvents[newEventName].length > 0) {

      throw new PettanError('rename', 'Destination event name already exists',
        oldEventName);
    }
    if (newEventName in this._nativeEvents) {
      throw new PettanError('rename', 'Destination conflicts with native event',
        oldEventName);
    }

    this._customEvents[newEventName] = this._customEvents[oldEventName];

    if (oldEventName in this._nativeEvents) {
      // This has a corresponding native event so rename that too
      this._nativeEvents[oldEventName].forEach(function (nativeEventRecord) {
        nativeEventRecord.setListener((function () {
          this.emit.apply(this, [newEventName].concate(arguments));
        }).bind(this))
      });
      this._nativeEvents[newEventName] = this._nativeEvents[oldEventName];
      delete this._nativeEvents[oldEventName];
    }

    delete this._customEvents[oldEventName];
  };

  // Static function
  Pettan.wrap = function (f) {
    return (function () {
      var params = arguments;
      f.apply(null, params);
      return new Promise(function (resolve, reject) {
        resolve.apply(this, arguments);
      });
    });
  };

  exports.Pettan = Pettan;
  exports.PettanError = PettanError;
});
