(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fetch = require('../fetch')(Promise);

if(window.fetch) {
    return;
}
for(var global in fetch) {
    if(fetch.hasOwnProperty(global)) {
        window[global] = fetch[global];
    }
}
window.fetch.promiseImpl = function(PromiseImpl) {
    return require('../fetch').promiseImpl(PromiseImpl);
};
},{"../fetch":2}],2:[function(require,module,exports){
'use strict';

var Promise = Promise;

function Headers(headers) {
    this.map = {};

    var self = this;
    if (headers instanceof Headers) {
        headers.forEach(function (name, values) {
            values.forEach(function (value) {
                self.append(name, value);
            });
        });

    } else if (headers) {
        Object.getOwnPropertyNames(headers).forEach(function (name) {
            self.append(name, headers[name]);
        });
    }
}

Headers.prototype.append = function (name, value) {
    var list = this.map[name];
    if (!list) {
        list = [];
        this.map[name] = list;
    }
    list.push(value);
};

Headers.prototype['delete'] = function (name) {
    delete this.map[name];
};

Headers.prototype.get = function (name) {
    var values = this.map[name];
    return values ? values[0] : null;
};

Headers.prototype.getAll = function (name) {
    return this.map[name] || [];
};

Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(name);
};

Headers.prototype.set = function (name, value) {
    this.map[name] = [value];
};

// Instead of iterable for now.
Headers.prototype.forEach = function (callback) {
    var self = this;
    Object.getOwnPropertyNames(this.map).forEach(function (name) {
        callback(name, self.map[name]);
    });
};

function consumed(body) {
    if (body.bodyUsed) {
        return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
}

function Body() {
    this._body = null;
    this.bodyUsed = false;

    this.arrayBuffer = function () {
        throw new Error('Not implemented yet');
    };

    var blobSupport = (function () {
        try {
            new Blob();
            return true;
        } catch (e) {
            return false;
        }
    })();

    if (blobSupport) {
        this.blob = function () {
            var rejected = consumed(this);
            return rejected ? rejected : Promise.resolve(new Blob([this._body]));
        };
    }

    this.formData = function () {
        var rejected = consumed(this);
        return rejected ? rejected : Promise.resolve(decode(this._body));
    };

    this.json = function () {
        var rejected = consumed(this);
        if (rejected) {
            return rejected;
        }

        var body = this._body;
        return new Promise(function (resolve, reject) {
            try {
                resolve(JSON.parse(body));
            } catch (ex) {
                reject(ex);
            }
        });
    };

    this.text = function () {
        var rejected = consumed(this);
        return rejected ? rejected : Promise.resolve(this._body);
    };

    return this;
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return (methods.indexOf(upcased) > -1) ? upcased : method;
}

function Request(url, options) {
    options = options || {};
    this.url = url;
    this._body = options.body;
    this.credentials = options.credentials || null;
    this.headers = new Headers(options.headers);
    this.method = normalizeMethod(options.method || 'GET');
    this.mode = options.mode || null;
    this.referrer = null;
}

function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
        if (bytes) {
            var split = bytes.split('=');
            var name = split.shift().replace(/\+/g, ' ');
            var value = split.join('=').replace(/\+/g, ' ');
            form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
    });
    return form;
}

function headers(xhr) {
    var head = new Headers();
    var pairs = xhr.getAllResponseHeaders().trim().split('\n');
    pairs.forEach(function (header) {
        var split = header.trim().split(':');
        var key = split.shift().trim();
        var value = split.join(':').trim();
        head.append(key, value);
    });
    return head;
}

Request.prototype.fetch = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.onload = function () {
            var status = (xhr.status === 1223) ? 204 : xhr.status;

            //edit fork, allow 0 as successful response code.
            if (status < 100 || status > 599) {
                reject(new TypeError('Network request failed'));
                return;
            }
            var options = {
                status: status,
                statusText: xhr.statusText,
                headers: headers(xhr)
            };
            resolve(new Response(xhr.responseText, options));
        };

        xhr.onerror = function () {
            reject(new TypeError('Network request failed'));
        };

        xhr.open(self.method, self.url);

        self.headers.forEach(function (name, values) {
            values.forEach(function (value) {
                xhr.setRequestHeader(name, value);
            });
        });

        xhr.send((self._body === undefined) ? null : self._body);
    });
};

Body.call(Request.prototype);

function Response(body, options) {
    this._body = body;
    this.type = 'default';
    this.url = null;
    this.status = options.status;
    this.statusText = options.statusText;
    this.headers = options.headers;
}

Body.call(Response.prototype);

module.exports = function(PromiseImpl, opts) {

    promiseImpl(PromiseImpl, opts);

    return {
        Headers: Headers,
        Request: Request,
        Response: Response,
        fetch: function (url, options) {
            return new Request(url, options).fetch();
        }
    };
};

module.exports.promiseImpl = promiseImpl;

function promiseImpl(PromiseImpl) {

    if(!Promise && !PromiseImpl) {
        throw new Error('Please supply a promise implementation');
    } else if(PromiseImpl) {
        Promise = PromiseImpl;
    }
}
},{}]},{},[1]);
