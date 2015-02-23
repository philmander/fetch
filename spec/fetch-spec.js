var Q = require('q');
var Promise = null;

var promiseImpl = process.env.promise ? process.env.promise.toLowerCase() : 'q';
if(!promiseImpl) {
    console.log('Testing with default Bluebird');
    Promise = require('bluebird');
} else if(promiseImpl === 'q') {
    console.log('Testing with default Q');
    Promise = Q.Promise;
} else if(promiseImpl === 'bluebird') {
    console.log('Testing with Bluebird');
    Promise = require('bluebird');
    Promise.onPossiblyUnhandledRejection(null);
} else {
    console.log('Unrecognized promise impl: ' + promiseImpl);
}

var fetch = require('../fetch')(Promise).fetch;
var Request = require('../fetch')(Promise).Request;

GLOBAL.XMLHttpRequest = require('./mock-xmlhttprequest').MockHttpRequest;
var MockHttpServer = require('./mock-xmlhttprequest').MockHttpServer;

var url = 'http://blah.com/foo';

describe('QFetch', function() {

    beforeEach(function() {
        this.server = new MockHttpServer();
        this.server.start();
    });

    afterEach(function() {
        this.server.stop();
    });

    it('makes a successful GET request', function(done) {

        this.server.handle = function (req) {
            expect(req.url).toEqual(url);
            expect(req.method).toEqual('GET');
            if(req.method === 'GET') {
                req.receive(200, 'Nice!');
            } else {
                req.receive(405, 'Doh!');
            }
        };

        fetch(url).then(function(res) {

            expect(res.status).toBe(200);
            expect(res.statusText).toBe('200 OK');
            return res.text();
        }).then(function(text) {
            expect(text).toEqual('Nice!');
            done();
        })
    });

    it('makes a successful POST request', function(done) {
        this.server.handle = function (req) {
            expect(req.url).toEqual(url);
            expect(req.method).toEqual('POST');
            if(req.method === 'POST') {
                req.receive(200, 'Nice!');
            } else {
                req.receive(405, 'Doh!');
            }
        };

        fetch(url, {
            method: 'POST'
        }).then(function(res) {
            expect(res.status).toBe(200);
            expect(res.statusText).toBe('200 OK');
            return res.text();
        }).then(function(text) {
            expect(text).toEqual('Nice!');
            done();
        });
    });

    it('makes a successful PUT request', function(done) {
        this.server.handle = function (req) {
            expect(req.url).toEqual(url);
            expect(req.method).toEqual('PUT');

            if(req.method === 'PUT') {
                req.receive(200, 'Nice!');
            } else {
                req.receive(405, 'Doh!');
            }
        };

        fetch(url, {
            method: 'PUT'
        }).then(function(res) {
            expect(res.status).toBe(200);
            expect(res.statusText).toBe('200 OK');
            return res.text();
        }).then(function(text) {
            expect(text).toEqual('Nice!');
            done();
        });
    });

    it('makes a successful DELETE request', function(done) {
        this.server.handle = function (req) {
            expect(req.url).toEqual(url);
            expect(req.method).toEqual('DELETE');
            if(req.method === 'DELETE') {
                req.receive(200, 'Nice!');
            } else {
                req.receive(405, 'Doh!');
            }
        };

        fetch(url, {
            method: 'DELETE'
        }).then(function(res) {
            expect(res.status).toBe(200);
            expect(res.statusText).toBe('200 OK');
            return res.text();
        }).then(function(text) {
            expect(text).toEqual('Nice!');
            done();
        });
    });

    it('handles a response with a json body', function(done) {

        var obj = {
            one: 1,
            two: 2,
            three: 3
        };

        this.server.handle = function (req) {
            req.receive(200, JSON.stringify(obj));
        };

        fetch(url).then(function(res) {
            return res.json();
        }).then(function(resObj) {
            expect(resObj).toEqual(obj);
            done();
        });
    });

    it('handles successful responses', function(done) {

        var self = this;
        var status = [0, 200, 201, 202, 203, 204, 304, 1223];
        var promises = [];
        status.forEach(function(status) {
            self.server.handle = function (request) {
                request.receive(status, 'OK');
            };
            promises.push(fetch(url));
        });
        Q.allSettled(promises).then(function (results) {
            var allGood = results.every(function(result) {
                return result.state === 'fulfilled'
            });
            expect(results.length).toEqual(status.length);
            expect(allGood).toBe(true);
            done();
        })
    });

    it('handles failed requests', function(done) {

        function handleStatus(response) {
            if (response.status >= 200 && response.status < 300) {
                return Promise.resolve(response)
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        }

        var self = this;
        var status = [400, 401, 404, 500, 503];
        var promises = [];
        status.forEach(function(status) {
            self.server.handle = function (request) {
                request.receive(status, 'Bad');
            };
            promises.push(fetch(url).then(handleStatus));
        });
        Q.allSettled(promises).then(function (results) {
            var allBad = results.every(function(result) {
                return result.state === 'rejected'
            });
            expect(results.length).toEqual(status.length);
            expect(allBad).toBe(true);
            done();
        })
    });

    it('makes a request with the specified headers', function() {
        var req = new Request(url, {
            headers: {
                'X-Header-A' : 'aaa',
                'X-Header-B' : 'bbb',
                'X-Header-C' : 'ccc'
            }
        });

        expect(req.headers.get('X-Header-A')).toEqual('aaa');
        expect(req.headers.get('X-Header-B')).toEqual('bbb');
        expect(req.headers.get('X-Header-C')).toEqual('ccc');
    });

    it('makes a request with a request plain text body', function(done) {

        this.server.handle = function (req) {
            expect(req.requestText).toEqual('body text');
            done();
        };

        fetch(url, {
            method: 'PUT',
            body: 'body text'
        });
    });

    it('makes a request with a request json body', function(done) {

        this.server.handle = function (req) {
            expect(req.requestText).toEqual('{\"one\":1,\"two\":2,\"three\":3}');
            done();
        };

        fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                one: 1,
                two: 2,
                three: 3
            })
        });
    });
});