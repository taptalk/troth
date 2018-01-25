'use strict'

// To use alternative Promise libs, activate here.
// const Promise = require('bluebird')

module.exports = new class {

  /** Activate Promise debugging */
  debug() {
    const params = {
      warnings: true,
      longStackTraces: true,
      cancellation: true,
      monitoring: true
    }
    if (Promise.config) {
      Promise.config(params)
    }
  }

  // core wrappers

  /** Wraps `Promise.resolve(..)` */
  resolve(value) {
    this._ensure_no_halt()
    return Promise.resolve(value)
  }

  /** Wraps `Promise.reject(..)` */
  reject(value) {
    this._ensure_no_halt()
    return Promise.reject(value)
  }

  /** Wraps `Promise.all(..)` */
  all(promises) {
    this._ensure_no_halt()
    return Promise.all(promises)
  }

  _ensure_no_halt() {
    if (this._halted) {
      throw new Error('Troth halted')
    }
  }

  /** Wraps `new Promise(..)` */
  new(func) {
    this._ensure_no_halt()
    return new Promise(func)
  }

  /** Syntactic sugar for squential  `.then(..)` */
  then(func) {
    this._ensure_no_halt()
    return Promise.resolve().then(func)
  }


  // helpers

  /** Halts all wrappers until `continue()` */
  halt() {
    if (!this._halted) {
      console.log('halting')
      this._halted = true
    }
  }

  /** Continues all wrappers after `halt()` */
  continue() {
    if (this._halted) {
      console.log('continuing')
      this._halted = false
    }
  }

  /** Wraps promise to keep track of call stack on error */
  track(promise) {
    const stack = this.stack()
    return this.new((resolve, reject) => {
      promise.then(resolve).catch(err => {
        if (err.stack) {
          err.stack += "\nfrom:\n" + stack
        }
        reject(err)
      })
    })
  }

  /** Returns rejection with error message and info */
  error(message, info, name) {
    const err = new Error(message)
    if (info) {
      err.info = info
    }
    if (name) {
      err.name = name
    }
    return this.reject(err)
  }

  /** Returns promises that sleeps */
  sleep(seconds) {
    return this.new(resolve => setTimeout(resolve, (seconds || 0) * 1000))
  }

  /** Returns promise that retries operation on error */
  retry(operation, count, wait) {
    if (count) {
      return this.then(_ => operation()).catch(err => {
        // console.log('retry', count, wait, err.name)
        return this.then(_ => wait && this.sleep(wait))
          .then(_ => this.retry(operation, count - 1, wait && wait * 2))
      })
    } else {
      return this.then(_ => operation())
    }
  }

  /** Returns promise that sequentially runs operator over array */
  each(array, operator) {
    if (array.length > 0) {
      const results = []
      const counter = { count: -1 }
      const run = () => {
        const i = (counter.count += 1)
        if (i < array.length) {
          return this.then(_ => operator(array[i])).then(result => {
            results[i] = result
            return run()
          })
        }
      }
      return run().then(_ => results)
    } else {
      return this.resolve([])
    }
  }

  /** Returns promise that runs promises in parallel */
  parallel(operations, count) {
    if (operations.length > 0) {
      const results = []
      const counter = { count: -1 }
      const run = () => {
        const i = (counter.count += 1)
        if (i < operations.length) {
          const operation = operations[i]
          return this.then(_ => operation()).then(result => {
            results[i] = result
            return run()
          })
        }
      }
      const promises = []
      for (let i = 0; i < count; i++) {
        promises.push(run())
      }
      return this.all(promises).then(_ => results)
    } else {
      return this.resolve([])
    }
  }

  /** Returns promise from object and method with callback */
  promify(object, method, _args) {
    const args = this.args(arguments).slice(2)
    return this.new((resolve, reject) => {
      args.push((err, result) => err ? reject(err) : resolve(result))
      object[method].apply(object, args)
    })
  }

  /** Returns function that wraps promise and logs result */
  log(_args) {
    const args = this.args(arguments)
    return result => {
      args.push(result)
      if (result && result.stack) {
        args.push(result.stack)
      }
      console.log.apply(console, args)
      return this.resolve(result)
    }
  }

  /** Returns promise that logs resolve and reject output */
  report(promise) {
    return this.observe(promise, this.log('resolve:'), this.log('reject:'))
  }

  /** Returns promise that calls callback on completion */
  ensure(promise, callback) {
    return this.observe(promise, result => callback(null, result), error => callback(error))
  }

  /** Returns promise that intercepts completion */
  intercept(promise, then, ctch) {
    let result = promise
    if (then) {
      result = result.then(result => this.then(_ => then(result)))
    }
    if (ctch) {
      result = result.catch(error => this.then(_ => ctch(error)).then(e => this.reject(e)))
    }
    return result
  }

  /** Returns promise that observes completion */
  observe(promise, then, ctch) {
    let result = promise
    if (then) {
      result = result.then(result => this.then(_ => then(result)).then(_ => result))
    }
    if (ctch) {
      result = result.catch(error => this.then(_ => ctch(error)).then(_ => this.reject(error)))
    }
    return result
  }

  /** Returns promise that catches error of type. */
  catch(promise, names, ctch) {
    names = Array.isArray(names) ? names : [names]
    return promise.catch(error => names.indexOf(error.name) >= 0 ? this.then(_ => ctch ? ctch(error) : null) : this.reject(error))
  }

  /** Returns promise that logs timeout of operation */
  timeLog(name, seconds, operation) {
    const events = {}
    const timeout = setTimeout(_ => console.log('! timeout', name, events), seconds * 1000)
    const start = Date.now()
    const promise = this.then(_ => operation(key => events[key] = Date.now() - start))
    return this.ensure(promise, _ => clearTimeout(timeout))
  }

  /** Returns promise that logs start/end of operation */
  ioLog(name, operation) {
    const events = {}
    const key = Math.random().toString(36).substring(7)
    console.log('> io', name, key)
    const start = Date.now()
    const promise = this.then(_ => operation(key => events[key] = Date.now() - start))
    return this.ensure(promise, _ => console.log('< io', name, key, events))
  }

  // utils

  /** Returns `new Error().stack` */
  stack() {
    const split = new Error().stack.split("\n")
    let end = split.length - 1
    for (; end > 3 && (split[end].indexOf('/var/task/') < 0 || split[end].indexOf('node_modules') >= 0); end -= 1) {}
    return split.slice(3, end + 1).join("\n")
  }

  /** Extracts method arguments */
  args(args) {
    const result = []
    for (let i = 0; i < args.length; i++) {
      result.push(args[i])
    }
    return result
  }
}
