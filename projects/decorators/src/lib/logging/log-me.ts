/**
 * Decorator for debugging purposes.
 * Wraps the method or property with console.log, logging values, parameters and return values
 *
 * @param logErrors Whether to catch and log errors or not
 *        Caught errors will get rethrown
 */
export function LogMe(logErrors: boolean = false) {

    const logGetter = (target: any, key: string | symbol, value: any) => {
        console.log(`${target.constructor.name}.${key.toString()} GET:`, value);
    };

    const logSetter = (target: any, key: string | symbol, arg: any) => {
        console.log(`${target.constructor.name}.${key.toString()} SET:`, arg);
    };

    const logMethodParameters = (target: any, key: string | symbol, args: any[]) => {
        console.log(`${target.constructor.name}.${key.toString()} args:`, ...args);
    };

    const logMethodReturnValue = (target: any, key: string | symbol, returnValue: any) => {
        console.log(`${target.constructor.name}.${key.toString()} returned:`, typeof returnValue, returnValue);
    };

    const logMethodError = (target: any, key: string | symbol, e: any) => {
        console.log(`${target.constructor.name}.${key.toString()} produced an error:`, e);
    };

    return function (target: any, key: string | symbol, descriptor?: PropertyDescriptor): any {
        if (descriptor) {
            if (descriptor.value) {
                // When on a methods
                const orgFn: Function = descriptor.value;

                descriptor.value = function (...args: any[]) {
                    logMethodParameters(target, key, args);
                    try {
                        const returnValue = orgFn.apply(this, args);
                        logMethodReturnValue(target, key, returnValue);
                        return returnValue;
                    } catch (e) {
                        if (logErrors) {
                            logMethodError(target, key, e);
                        }
                        throw e;
                    }
                };

            } else if (descriptor.get && descriptor.set) {
                // When on a class property
                const orgGetter: Function = descriptor.get;
                const orgSetter: Function = descriptor.set;

                descriptor.get = function () {
                    const value = orgGetter.apply(this);
                    logGetter(target, key, value);
                    return value;
                };

                descriptor.set = function (arg: any) {
                    logSetter(target, key, arg);
                    orgSetter.apply(this, [arg]);
                };
            }
        } else {
            // When on primitive property
            // Proxy property as getter/setter
            let proxyValue: any;
            descriptor = Object.defineProperty(target, key, {
                enumerable: true,
                configurable: true,
                get: () => {
                    logGetter(target, key, proxyValue);
                    return proxyValue;
                },
                set: v => {
                    logSetter(target, key, v);
                    proxyValue = v;
                }
            });
        }

        return descriptor;
    };
}
