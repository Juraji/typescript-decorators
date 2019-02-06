/**
 * Simple predicate debounce method decorator
 * The decorated method will not run until the predicate tests true
 *
 * @param predicate Function which tests if the function may run
 */
export function DebounceUntil(predicate: (t: any) => boolean): MethodDecorator {

    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const originalFn = descriptor.value;

        descriptor.value = function (...args) {
            const shouldRun = predicate.apply(this, [this]);
            if (shouldRun) {
                originalFn.apply(this, args);
            }
        };

        return descriptor;
    };
}
