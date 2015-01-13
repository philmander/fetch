#Fetchify

Fetchify is a fork of Github's [window.fetch polyfill](https://github.com/github/fetch)

It is adapted to be used primarily within Node as part of a Browserify bundle. It is also tested and 
pluggable with various Promise implementations such as Bluebird and Q

## window.fetch polyfill

The global `fetch` function is an easier way to make web requests and handle
responses than using an XMLHttpRequest. This polyfill is written as closely as
possible to the standard Fetch specification at https://fetch.spec.whatwg.org.

## Installation

Install with `npm`.

```sh
$ npm install fetchify --save
```

## Usage

The `fetch` function supports any HTTP method. We'll focus on GET and POST
example requests.

### Node
Example using [Bluebird](https://github.com/petkaantonov/bluebird)

```javascript 
var Promise = require('bluebird');

var fetch = require('fetchify')(Promise).fetch;

//Headers, Request and Response are also exported
var Headers = require('fetchify')(Promise).Headers;
var Request = require('fetchify')(Promise).Request;
var Response = require('fetchify')(Promise).Response;

fetch('/users.html')
  .then(function(response) {
    return response.text()
  }).then(function(body) {
    document.body.innerHTML = body
  })
```

You could also use [Q](https://github.com/kriskowal/q)

```javascript 
var Promise = require('q').Promise;

var fetch = require('fetchify')(Promise).fetch;
```

### In the browser

Fetchify also provides a browser polyfill build (see the `dist` directory).

If you don't want to globally polyfill a Promise impl, you can also inject it:

```html
<script src="fetch.min.js"></script>
<script>
    fetch.promiseImpl(Q.Promise);
    var result = fetch('data.json')
</script>
```

## More examples

### JSON

```javascript
fetch('/users.json')
  .then(function(response) {
    return response.json()
  }).then(function(json) {
    console.log('parsed json', json)
  }).catch(function(ex) {
    console.log('parsing failed', ex)
  })
```

### Response metadata

```javascript
fetch('/users.json').then(function(response) {
  console.log(response.headers.get('Content-Type'))
  console.log(response.headers.get('Date'))
  console.log(response.status)
  console.log(response.statusText)
})
```

### Post form

```javascript
var form = document.querySelector('form')

fetch('/query', {
  method: 'post',
  body: new FormData(form)
})
```

### Post JSON

```javascript
fetch('/users', {
  method: 'post',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Hubot',
    login: 'hubot',
  })
})
```

### File upload

```javascript
var input = document.querySelector('input[type="file"]')

var form = new FormData()
form.append('file', input.files[0])
form.append('user', 'hubot')

fetch('/avatars', {
  method: 'post',
  body: form
})
```

### Success and error handlers

This causes `fetch` to behave like jQuery's `$.ajax` by rejecting the `Promise`
on HTTP failure status codes like 404, 500, etc. The response `Promise` is
resolved only on successful, 200 level, status codes.

```javascript
function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json()
}

fetch('/users')
  .then(status)
  .then(json)
  .then(function(json) {
    console.log('request succeeded with json response', json)
  }).catch(function(error) {
    console.log('request failed', error)
  })
```

## Browser Support

![Chrome](https://raw.github.com/alrra/browser-logos/master/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/firefox/firefox_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/internet-explorer/internet-explorer_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/opera/opera_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | 10+ ✔ | Latest ✔ | 6.1+ ✔ |
