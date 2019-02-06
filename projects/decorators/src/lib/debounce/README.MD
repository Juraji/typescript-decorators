# Method decorator: `@Debounce`

Prevent methods from being executed for more than once during a set time out.  
Functionally it will prevent execution until no more calls are made before the time out ends, executing the last invocation.

### Factory parameters
* `delay: number` The amount of milliseconds to debounce.

## Example
```typescript
import { Debounce } from "./debounce"

class Foo {
    
    @Debounce(100)
    public barMethod(baz: string) {
        console.log(baz);
    }
}

const foo = new Foo();

foo.barMethod("Call 1");
setTimeout(() => foo.barMethod("Call 2"), 500);
foo.barMethod("Call 3");
```

Would result in console output:
```a
> "Call 3"
> "Call 2"
```
Because `"Call 3"` is the last call after debounce, Then `Call 2`, since no more calls were made after it.

# Method decorator `@DebounceUntil`

Prevent methods from being executed until a predicate tests true.
Functionally it will prevent execution until the supplied predicate, executing the last invocation.

### Factory parameters
* `predicate: (t: T) => boolean`: A Predicate, accepting the component instance and returning a boolean.

## Example
```typescript
import { DebounceUntil } from "./debounce-until";

class Foo {
    public predicate1 = false;
    public predicate2 = false;
    
    @DebounceUntil(t => t.predicate1 && t.predicate2)
    public barMethod(baz: string) {
        console.log(baz);
    } 
}

const foo = new Foo();
foo.barMethod("Call 1");

foo.predicate1 = true;
foo.barMethod("Call 2");

foo.predicate2 = true;
foo.barMethod("Call 3");

```

Would result in console output:
```a
> "Call 3"
```
Because when `Call 1` and `Call 2` happened the predicate tested to false.
When `Call 3` happened the predicate tested to true and #barMethod got executed 
