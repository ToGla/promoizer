# Promoizer

Promise based cache & memoization utility for usage with Node.js

Promoizer is a small library that essentially works as a cache for
function calls. A wrapped function will when invoked, stash the results
in memory. Subsequent calls will then, if called with the same arguments, return the stashed result instead of recalculate. 

This can be useful in a few cases. Among others:
- requests for the same network resource (queue and cache)
- reduce the call stack for recursive functions

Wrapped functions will always return the result wrapped in a promise.

## Features

- Cache
- Queue
- Memoization
- Promise based

## Examples 
### Instantiate
```
// options: maxAge: <milliseconds>, default 0 - never expire.
const promoize = new Promoizer({ maxAge: 10000 * 60  })
``` 
### Wrap and call a simple function 
```
const myFunction = Promoize((a, b) => a + b)
myFunction(3,5).then(console.log)
```

### Wrap and call a network request function
```
const http = require('http')
const makeGetRequest = Promoize((url) => {
    let result
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            response.on('data', chunk => result += chunk)
            response.on('end', () => resolve(result))
        }).on('error', reject)
    })
})

// Executing the request will cache the response. 
// Subsequent requests to the same url will 
// - return results from cache if resolved and not expired
// - be queued and resolved in the order they were invoked

makeGetRequest('http://httpbin.org/get?query=param')
    .then(result => /(\{.+\})/s.exec(result)[0])
    .then(JSON.parse)
    .then(console.log)
```


### Recursion
```    
// Recursive example rewritten from the original fibonacci
const mfib = Promoize(
    (n) => {
        return n < 2 ? n : mfib(n-1)
            .then(p1 => {
                return mfib(n-2)
                    .then(p2 => p1 + p2)
            })
    }
)

// Should run smoothly
mfib(1000)
    .then(console.log)

//The original, can take a while to compute. Be careful. 
const fibonacci = (n) => n < 2 ? n : fibonacci(n -1) + fibonacci(n-2)
console.log(fibonacci(40))
```