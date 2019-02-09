import { BrowserContext } from "../browser-context";
import { LogMe } from "../logging/log-me";

const PROP_DESCRIPTORS = "__QPBPropertyDescriptors";

interface PropertyDescriptorSet {
    original: TypedPropertyDescriptor<any>;
    wrapped: TypedPropertyDescriptor<any>;
}

interface BindingOptions {
    // Use the history API to replace the current state
    pushHistoryState?: boolean;
    // Use JSON (de)serialisation
    useJSON?: boolean;
}

/**
 * Class decorator for initializing @QueryParameterBinding
 * See the README.md for more info
 *
 * @param target The target class/constructor
 */
export function InitQueryParameterBindings<T extends Function>(target: T) {
    const orgOnInit: T = target.prototype.ngOnInit;
    const descriptors: Map<string, PropertyDescriptorSet> = target.prototype[PROP_DESCRIPTORS];

    target.prototype.ngOnInit = function () {
        if (descriptors) {
            descriptors.forEach((descriptorSet) => {
                if (descriptorSet.original) {
                    // Initialize getter/setter properties
                    descriptorSet.wrapped.set.apply(this, [
                        descriptorSet.original.get.apply(this)
                    ]);
                } else if (descriptorSet.wrapped.get == null) {
                    // Initialize primitive properties without default value (get should still be null)
                    descriptorSet.wrapped.set.apply(this, [null]);
                }
            });
        }

        if (orgOnInit) {
            orgOnInit.apply(this);
        }
    };
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
     * @param key Property name or symbol
     * @param wrappedDescriptor The new descriptor
     * @param originalDescriptor The original descriptor
     */
    const registerPropertyDescriptor = (target: any, key: string | symbol, wrappedDescriptor, originalDescriptor) => {
        target[PROP_DESCRIPTORS] = target[PROP_DESCRIPTORS] || new Map<string, PropertyDescriptorSet>();
        target[PROP_DESCRIPTORS].set(key, {
            original: originalDescriptor,
            wrapped: wrappedDescriptor
        });
    };

    /**
     * Call the descriptor setter using value in context (null safe)
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
        if (descriptor != null && !descriptor.set) {
            throw new Error(`Can not bind readonly value: ${target.constructor.name}.${key}`);
        }

        // Define an initial setter on the property, when called (By class construct using default values or by @InitQueryParameterBindings)
        // initializes The bound query parameter and redefines the getter/setter to reflect further changes to the query parameter
        const wrappedDescriptor = {
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

        registerPropertyDescriptor(target, key, wrappedDescriptor, descriptor);
        return wrappedDescriptor;
    };
}
