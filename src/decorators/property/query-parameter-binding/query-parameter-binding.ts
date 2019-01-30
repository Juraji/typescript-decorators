export interface QueryParameterBindingOptions {
    // Use the history API to replace the current state
    replaceState?: boolean;
}

export const browserContext = {
    search: () => window.location.search,
    path: () => window.location.pathname,
    replaceState: (data: any, title: string, path: string) => window.history.replaceState(data, title, path),
    pushState: (data: any, title: string, path: string) => window.history.pushState(data, title, path)
};

/**
 * Bind a property to an url query parameter.
 *
 * Note: When using get/set properties, make sure to always update values using the setter.
 *       The query parameter will not reflect changes made directly to an internal property.
 *
 * Possible compiler warnings:
 * - TS2345: Decorator is being used on a non-string type property
 *   This error is not thrown on primitive properties, beware unexpected behaviour!
 * - TS1238, TS2559 or TS2345: Decorator does not support usage on classes, constructor parameters or methods
 *
 * @param name The name for the query parameter
 * @param opts Binding options
 * @decorator
 * @author Juraji 2019 (https://github.com/Juraji)
 */
export function QueryParameterBinding(name: string, opts?: QueryParameterBindingOptions) {
    const env: QueryParameterBindingOptions = Object.assign({
        replaceState: true
    }, opts);


    const getQMValue = (): string => {
        const urlParams = new URLSearchParams(browserContext.search());

        if (urlParams.has(name)) {
            return urlParams.get(name);
        } else {
            return null;
        }
    };

    const setQMValue = (v: string) => {
        const urlParams = new URLSearchParams(browserContext.search());

        if (v == null) {
            if (urlParams.has(name)) {
                urlParams.delete(name);
            }
        } else {
            urlParams.set(name, v);
        }

        const newPath = browserContext.path() + "?" + urlParams.toString();
        if (env.replaceState) {
            browserContext.replaceState(null, "", newPath);
        } else {
            browserContext.pushState(null, "", newPath);
        }
    };

    return (target: any, key: string, descriptor?: TypedPropertyDescriptor<string>): any => {
        // if query parameter is present update descriptor to reflect value
        if (descriptor && descriptor.set) {
            const qmValue = getQMValue();
            if (qmValue != null) {
                descriptor.set.apply(target, [qmValue]);
            }
        }

        return {
            enumerable: true,
            configurable: true,
            get: function () {
                return getQMValue();
            },
            set: function (v) {
                setQMValue(v);
                if (descriptor && descriptor.set) {
                    // If there was a descriptor set its value as well
                    descriptor.set.apply(this, [v]);
                }
            }
        };
    };
}
