const expect = require('chai').expect
const Promoizer = require('./index')

// Simple test function
const adder = (a, b) => a + b

//Random delay 
const x2x = x => new Promise((resolve) => {
    setTimeout(() => resolve(x), Math.random() /100)
})

//Delay
const delayed = (x) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(x), 25)
    })
}

// A classic :)
const fibonacci = (n) => {
    return n < 2 ? n : fibonacci(n -1) + fibonacci(n -2)
}

// 'Promoized' fibonacci
const mfib = Promoizer({maxAge: 0})(
    (n) => {
        return n < 2 ? n : mfib(n-1)
            .then(p1 => {
                return mfib(n-2)
                    .then(p2 => p1 + p2)
            })
    }
)

const getTime = (hrtime) => {
    let fraction = hrtime[1] > 0 ? hrtime[1] / (10 ** 9)  : 0;
    return hrtime[0] + fraction;
}



describe('Promoizer',() => {

    it('Should resolve a promise with correct result', () => {
        let a=1
        let b=2
        const memoize = Promoizer({ maxAge: 0 })
        const mAdder = memoize(adder)
        return mAdder(a, b)
            .then(result => expect(result).to.equal(a+b))
    })

    it('Should run return immediately when once resolved', () => {
        // 
        let x=100, m1, m2, s1, s2
        const memoize = Promoizer({ maxAge: 0 })
        const mDelayed = memoize(delayed)
        return new Promise((resolve) => {
            s1 = process.hrtime()
            mDelayed(x)
                .then((result) => {
                    expect(result).to.be.equal(x)
                    m1 = process.hrtime(s1)
                })
                .then(() => {
                    s2 = process.hrtime()
                    return mDelayed(x)
                })
                .then((result) => {
                    expect(result).to.be.equal(x)
                    m2 = process.hrtime(s2)
                })
                .then(() => {
                    expect(getTime(m2)).to.be.lessThan(getTime(m1))
                    resolve()
                })
        })
    })

    it('Should resolve in order', () => {
        const memoize = Promoizer({ maxAge: 0 })
        const mx2x = memoize(x2x)
        const inputs = [1,2,3,4,5,6,7,8]
        const results = []
        return new Promise((resolve) => {
            const dispatch = (result) => {
                results.push(result)
                if(results.length === inputs.length) {
                    resolve(results)
                }
            }
            inputs.map(x => mx2x(x).then(dispatch))
        })
        .then(() => {
            expect(results).to.be.deep.equal(inputs)
        })
    })

    it("Should run recursive functions too?", () => {
        let n=10, results={};
        return mfib(n)
            .then(mfibresult => {
                results.mfibresult=mfibresult
            })
            .then(() => fibonacci(n))
            .then(fibresult => {
                results.fibresult = fibresult
            })
            .then(() => {
                expect(results.mfibresult)
                    .to.eq(results.fibresult)
            })
    })
}) 

module.exports = mfib