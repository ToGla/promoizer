const hash = require('object-hash')

module.exports = function Promoizer({ maxAge=0 }) {

    const entries =  {}

    function setExpiration(key) {
        return maxAge > 0 ? setTimeout(() => {
            delete entries[key]
        }, maxAge) : null;
    }

    function hasResult(key) {
        return entries[key] ? entries[key].result : false
    }

    function getResult(key) {
        return entries[key].result
    }

    function isPending(key) {
        return entries[key]? entries[key].pending : false
    }

    function setPending(key) {
        entries[key] = {
            pending: true
        }
    }

    function addToQueue(key) {
        entries[key].queue = entries[key].queue || []
        return new Promise((resolve, reject) => {
            entries[key].queue.push(({err, result}) => {
                if(err) {
                    return reject(err)
                } 
                return resolve(result)
            })
        })
    }

    function processQueue({ key, err, result}) {
        if(entries[key].queue) {
            while(entries[key].queue.length) {
                const f = entries[key].queue.shift();
                f({err, result})
            }
        }
    }

    function setResult({key, err, result}) {
        processQueue({key, err, result})
        if(err) {
            throw err;
        }
        entries[key] = {
            pending: false,
            result, 
            purge: setExpiration(key)
        }
        return result
    }

    function promoize(f) {
        return (...params) => {
            const key = hash({ f, params })
            if(hasResult(key)) {
                return Promise.resolve(getResult(key))
            }
            if(isPending(key)) {
                return addToQueue(key)
            }
            setPending(key)
            return new Promise((resolve, reject) => {
                try {
                    return resolve(f(...params))
                } catch(e) {
                    return reject(e) 
                }
            })
            .then(result => setResult({key, result}))
            .catch(err => setResult({key, err}))
        }
    }
    
    return promoize
}