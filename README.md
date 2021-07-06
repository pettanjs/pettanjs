# Pettan
A modern event-based JavaScript frontend framework for people who don't want to
use a traditional framework.

## Philosophy
The philosophy behind Pettan is to build stateful applications by creating many
event channels to update the DOM in-place. This is in contrast to frameworks
that rely on Shadow DOM (like React, Vue or Angular), where you build fresh DOM
every render and the framework diffs it against the existing DOM performing
updates as needed.

## How to use
Pettan is packaged as a UMD module, which means you can use it by directly
including the script on your page.

Alternatively, if your project already utilizes a module loader, like Commonjs
or AMD, Pettan can work with them directly as if it were a native module too.

Pettan has no external dependencies though it assumes that your browser supports
_ES5 promises_. Shim scripts exist to add support for promises in older browsers
that do not support them yet. Please add them as needed depending on whether you
would like to support those older browsers.

## License
Pettan is licensed under the [MIT license](LICENSE.md).
