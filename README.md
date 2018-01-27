<img src="icon.jpg" alt="Troth Icon" width="72"/>


Troth
======

*A simple Promise wrapper for Node.*


## Installation

    npm install @leonardvandriel/Troth


## Usage

    const Troth = require('@leonardvandriel/Troth')

    // Replacement of Promise
    Troth.resolve(true)
    Troth.reject(new Error())
    Troth.all([..])

    // Convenient helpers
    Troth.new((resolve, reject) => ..)
    Troth.then(_ => console.log('works'))

    // Halt all promises and throw error
    Troth.halt()

    // Sleep for second
    ..then(_ => Troth.sleep(1.0)).then(..)

    // Retry operation 3 times
    Troth.retry(_ => request(), 3)
    Troth.retry(_ => request(), 3, 1.0)

    // Run operations in 3 parallel sequences
    Troth.serial([..], 3)

    // Observe output of promise
    Troth.observe(_ => .., _ => console.log('done'), _ => console.log('fail'))

    // Lots more

## Tests

    npm test


## License

Troth is licensed under the terms of the MIT License, see the included LICENSE file.


## Authors

- Leo Vandriel
