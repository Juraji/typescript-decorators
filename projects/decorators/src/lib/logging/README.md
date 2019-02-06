# Property/Method decorator: `@LogMe`

Wraps properties and methods with logging to browser console

## Example
```typescript
import { LogMe } from "./log-me";

class Foo {
    
    @LogMe()
    public property: string;
    
    @LogMe()
    public barMethod(arg: string): {[p: string]: string} {
        return {baz: arg};
    }
}

const foo = new Foo();

foo.property = "value";
foo.barMethod("arg");
```

Would result in console output:
```a
> LogMe -> Foo.property SET parameter: value
> LogMe -> Foo.barMethod arguments: [{index:0, type: "string", value: "arg"}]
> LogMe -> Foo.barMethod return value: object {baz: arg}
```
