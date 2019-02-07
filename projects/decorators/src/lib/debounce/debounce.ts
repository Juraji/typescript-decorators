/**
 * Simple time-based debounce method decorator
 * Similar to Rxjs's debounceTime operator
 *
 * @param delay The amount of time to debounce
 */
export function Debounce(delay: number): MethodDecorator {

    return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
        let debounceTimeout;
        const originalFn = descriptor.value;

        descriptor.value = function (...args) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => originalFn.apply(this, args), delay);
        };

        return descriptor;
    };
}
