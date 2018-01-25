const should = require('chai').should()
const Troth = require('../lib/index')

beforeEach(() => {
})

describe('#debug', () => {
  it('works', () => {
    Troth.debug()
  })
})

describe('#new', () => {
  it('works', () => {
    let works = false
    return Troth.new((resolve, reject) => { works = true; resolve() }).then(_ => works.should.equal(true))
  })
})

describe('#resolve', () => {
  it('works', () => {
    return Troth.resolve(true).then(v => v.should.equal(true))
  })
})

describe('#reject', () => {
  it('works', () => {
    return Troth.reject(true).catch(v => v.should.equal(true))
  })
})

describe('#all', () => {
  it('works', () => {
    return Troth.all([Troth.resolve(true)]).then(v => v[0].should.equal(true))
  })
})

describe('#halt', () => {
  it('works', () => {
    Troth.halt()
    try {
      Troth.resolve(true)
    } catch (e) {
      e.message.should.include("halted")
    }
  })
})

describe('#continue', () => {
  it('works', () => {
    Troth.halt()
    Troth.continue()
    return Troth.resolve(true)
  })
})

describe('#then', () => {
  it('works', () => {
    return Troth.then(_ => true).then(v => v.should.equal(true))
  })
})

describe('#track', () => {
  it('works', () => {
    return Troth.all([
      Troth.track(Troth.reject(new Error())).catch(e => e.stack.should.include("from:")),
      Troth.track(Troth.reject(true)).catch(e => e.should.equal(true)),
    ])
  })
})

describe('#error', () => {
  it('works', () => {
    return Troth.error('m', 'i', 'n').catch(e => {
      e.message.should.equal('m')
      e.info.should.equal('i')
      e.name.should.equal('n')
    })
  })
})

describe('#sleep', () => {
  it('works', () => {
    return Troth.sleep(0.001)
  })
})

describe('#each', () => {
  it('works', () => {
    const array = []
    return Troth.each([1, 2, 3], v => array.push(v)).then(a => {
      array[0].should.equal(1)
      array[1].should.equal(2)
      array[2].should.equal(3)
      a[0].should.equal(1)
      a[1].should.equal(2)
      a[2].should.equal(3)
    })
  })
})

describe('#parallel', () => {
  it('works', () => {
    const array = []
    return Troth.parallel([
        _ => Troth.then(_ => Troth.sleep(0.01)).then(_ => array.push(1)),
        _ => Troth.then(_ => array.push(2)),
        _ => Troth.then(_ => array.push(3)),
      ], 2).then(a => {
      array[0].should.equal(2)
      array[1].should.equal(3)
      array[2].should.equal(1)
      a[0].should.equal(3)
      a[1].should.equal(1)
      a[2].should.equal(2)
    })
  })
})

describe('#promify', () => {
  it('works', () => {
    const o = {}
    o.m = (a, callback) => {
      a.should.equal('a')
      callback(null, 'b')
    }
    return Troth.promify(o, 'm', 'a').then(b => b.should.equal('b'))
  })
})

describe('#log', () => {
  it('works', () => {
    return Troth.resolve('works').then(Troth.log('it'))
  })
})


