const PROP_DESCRIPTORS = "__QPBPropertyDescriptors";

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
 * Class decorator for initializing @QueryParameterBinding
 * See the README.md for more info
 *
 * @param target The target class/constructor
 */
export function InitQueryParameterBindings<T extends Function>(target: T): any {
    const orgConstructor: T = target;

    const _QueryParameterBindingsWrapper = function (...args: any[]) {
        const qpbDescriptors: Map<TypedPropertyDescriptor<any>, TypedPropertyDescriptor<any>> = this.__proto__[PROP_DESCRIPTORS];
        const instance = orgConstructor.apply(this, args);

        if (qpbDescriptors) {
            qpbDescriptors.forEach((wrapperDescriptor, orgDescriptor) => {
                wrapperDescriptor.set.apply(this, [orgDescriptor.get.apply(this)]);
            });
        }

        return instance;
    };

    _QueryParameterBindingsWrapper.prototype = orgConstructor.prototype;

    return _QueryParameterBindingsWrapper;
}

/**
 * Property decorator factory
 * Requires @InitQueryParameterBindings to be present on parent class,
 * see README.md for more info
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
    const getQueryParameterValue = (): any => {
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
    const setQueryParameterValue = (value: any) => {
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

    /**
     * Registers the original and new descriptor object to the prototype of target under key PROP_DESCRIPTORS.
     * This is later used by @InitQueryParameterBindings to init get/set properties
     *
     * @param target The target class
     * @param newDescriptor The new descriptor
     * @param orgDescriptor The original descriptor
     */
    const registerPropertyDescriptor = (target: any, newDescriptor, orgDescriptor) => {
        if (target && orgDescriptor && newDescriptor) {
            target[PROP_DESCRIPTORS] = target[PROP_DESCRIPTORS] || new Map<TypedPropertyDescriptor<any>, TypedPropertyDescriptor<any>>();
            target[PROP_DESCRIPTORS].set(orgDescriptor, newDescriptor);
        }
    };

    /**
     * Call (safely) the descriptor setter using value in context
     * @param descriptor The descriptor to call
     * @param value The value to apply as parameter ot set
     * @param context The context to apply the setter in
     */
    const callDescriptorSetter = (descriptor: TypedPropertyDescriptor<any>, value: any, context: ThisType<any>) => {
        if (descriptor && descriptor.set) {
            descriptor.set.apply(context, [value]);
        }
    };

    return function (target: any, key: string, descriptor?: TypedPropertyDescriptor<any>): any {
        const wrapperDescriptor = {
            configurable: true,
            enumerable: true,
            set: function (initialValue: any) {
                // If not in JSON mode, perform type check for string
                // If any other than string log warning
                const type = typeof initialValue;
                if (!opts.useJSON && initialValue != null && type !== "string") {
                    console.warn("@QueryParameterBinding: Enabling useJSON is recommended for non-string type properties in "
                        + `${target.constructor.name}#${key} (typeof ${type})`);
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

        registerPropertyDescriptor(target, wrapperDescriptor, descriptor);
        return wrapperDescriptor;
    };
}
