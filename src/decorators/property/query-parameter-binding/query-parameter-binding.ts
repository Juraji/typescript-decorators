import "reflect-metadata";

export interface BindingOptions {
    // Use the history API to replace the current state
    pushHistoryState?: boolean;
    useJSON?: boolean;
}

export class BrowserContext {
    public static getQueryParameters(): URLSearchParams {
        return new URLSearchParams(window.location.search);
    }

    public static getPath(): string {
        return window.location.pathname;
    }

    public static pushHistoryState(path: string) {
        window.history.pushState(path, "", path);
    }

    public static replaceHistoryState(path: string) {
        window.history.replaceState(path, "", path);
    }
}

/**
 * Decorator factory
 *
 * Use the binding options to bind instance properties to query parameters
 *
 * @param param Query parameter name
 * @param opts Binding options
 */
export function QueryParameterBinding(param: string, opts: BindingOptions = {}) {
    /**
     * Get the current query parameter value for name
     *
     * @return The parameter value or null if absent
     */
    const getQueryParameterValue = function (): any {
        const urlParams = BrowserContext.getQueryParameters();

        if (urlParams.has(param)) {
            if (opts.useJSON) {
                return JSON.parse(urlParams.get(param));
            } else {
                return urlParams.get(param);
            }
        } else {
            return null;
        }
    };

    /**
     * Set a query parameter value, deletes parameter when value is null, or updates, or adds when absent
     *
     * @param value The (new) value
     */
    const setQueryParameterValue = function (value: any) {
        const urlParams = BrowserContext.getQueryParameters();
        const originalParamsString = urlParams.toString();

        if (value == null) {
            if (urlParams.has(param)) {
                urlParams.delete(param);
            }
        } else {
            const va = opts.useJSON ? JSON.stringify(value) : value;
            urlParams.set(param, va);
        }

        const newParams = urlParams.toString();
        if (newParams !== originalParamsString) {
            const newPath = newParams.length > 0
                ? BrowserContext.getPath() + "?" + newParams
                : BrowserContext.getPath();

            if (opts.pushHistoryState) {
                BrowserContext.pushHistoryState(newPath);
            } else {
                BrowserContext.replaceHistoryState(newPath);
            }
        }
    };

    const callDescriptorSetter = (descriptor: TypedPropertyDescriptor<any>, value: any, context: ThisType<any>) => {
        if (descriptor && descriptor.set) {
            descriptor.set.apply(context, [value]);
        }
    };

    return (target: any, key: string, descriptor?: TypedPropertyDescriptor<any>): any => {
        if (descriptor) {
            // Get/set properties need to have their setter called explicitly,
            // Use/wrap Angular's OnInit hook to initialize
            // Todo: Find a method to init setters, without having to rely on Angular to call #ngOnInit
            const orgOnInit = target.constructor.prototype.ngOnInit;
            target.constructor.prototype.ngOnInit = function () {
                if (descriptor.get) {
                    this[key] = descriptor.get.apply(this);
                } else {
                    this[key] = null;
                }
                if (orgOnInit) {
                    orgOnInit.apply(this);
                }
            };
        }

        return {
            configurable: true,
            enumerable: true,
            set: function (initialValue: any) {
                // If not in JSON mode, perform type check for string
                // If any other than string log warning
                const type = typeof initialValue;
                if (!opts.useJSON && initialValue != null && type !== "string") {
                    console.warn("Enabling useJSON is recommended for non-string type properties in "
                        + `${target.constructor.name}#${key} (${type})`);
                }

                // Replace instance property with getter/setter to bind query
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: true,
                    get: getQueryParameterValue,
                    set: (v: string) => {
                        setQueryParameterValue(v);
                        callDescriptorSetter(descriptor, v, this);
                    }
                });

                // Initialize with QM, else initialize QM with value
                const queryParameterValue = getQueryParameterValue();
                if (queryParameterValue) {
                    this[key] = queryParameterValue;
                } else {
                    setQueryParameterValue(initialValue);
                }

                callDescriptorSetter(descriptor, queryParameterValue || initialValue, this);
            }
        };
    };
}
