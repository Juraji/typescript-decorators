/**
 * Decorator for debugging purposes.
 * Wraps the method or property with console.log, logging values, parameters and return values
 */
export function LogMe() {

    const logGetter = (target: any, key: string | symbol, value: any) => {
        console.log(`LogMe -> ${target.constructor.name}.${key.toString()} GET value:`, value);
    };

    const logSetter = (target: any, key: string | symbol, arg: any) => {
        console.log(`LogMe -> ${target.constructor.name}.${key.toString()} SET parameter:`, arg);
    };

    const logMethodParameters = (target: any, key: string | symbol, args: any[]) => {
        let argsDescription: string | { [p: string]: any }[];
        if (args && args.length > 0) {
            argsDescription = args.map((value, index) => {
                return {index: index, type: (typeof value), value: value};
            });
        } else {
            argsDescription = "None";
        }

        console.log(`LogMe -> ${target.constructor.name}.${key.toString()} arguments:`, argsDescription);
    };

    const logMethodReturnValue = (target: any, key: string | symbol, returnValue: any) => {
        if (returnValue == null) {
            console.log(`LogMe -> ${target.constructor.name}.${key.toString()} return value:`, "Null");
        } else {
            console.log(`LogMe -> ${target.constructor.name}.${key.toString()} return value:`, typeof returnValue, returnValue);
        }
    };

    const logMethodError = (target: any, key: string | symbol, e: any) => {
        console.log(`LogMe -> ${target.constructor.name}.${key.toString()} produced an error:`, e);
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
                        logMethodError(target, key, e);
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
