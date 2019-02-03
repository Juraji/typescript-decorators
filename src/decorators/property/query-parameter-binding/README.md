# Property decorator: `@QueryParameterBinding`

Bind class properties to URL query parameters.  
When the class is instantiated the class property will get updated with the value.
Then, whenever the property is updated, the query parameter will be updated to reflect the new value.

### Factory parameters:
* `param: string` The name of the query parameter to bind to.
* `opts: BindingOptions` Options for binding.
    * `pushHistoryState?: boolean` Push changes to the history stack.  
    This causes each parameter change to be a new item in the browser's history.  
    _By default the current item in history stack will be replaced._
    * `useJSON?: boolean` Use JSON conversion when writing to-/reading from the query parameter  
    Useful when you want to store non-string type values in the query parameter.

### Important
Getter/Setter property initialization only works when the `@InitQueryParameterBindings` decorator is applied to the parent class.

## Example
```typescript
import{InitQueryParameterBindings, QueryParameterBinding} from "./query-parameter-binding"

// Apply the query parameters like this: 
@InitQueryParameterBindings
class Foo {
    public _bar = "Default bar";
    public _baz: string;

    @QueryParameterBinding("qux")
    public qux = "Default qux";

    @QueryParameterBinding("quux", {useJSON: true})
    public quux: any;

    @QueryParameterBinding("bar", {pushHistoryState: true})
    public get bar(): string {
        return this._bar;
    }

    public set bar(value: string) {
        this._bar = value;
    }

    @QueryParameterBinding("baz", {pushHistoryState: true})
    public get baz(): string {
        return this._baz;
    }

    public set baz(value: string) {
        this._baz = value;
    }
    
    @QueryParameterBinding("corge", {useJSON: true})
    public get corge(): number {
        // Getter only with logic output
        return 1 + 2;
    }
}

// Initializing an instance of Foo will cause the browser url to change to:
// https://example.com/?bar=Default+bar&qux=Default+qux&corge=3
const foo = new Foo();

// Then applying some values:
foo.bar = "New bar";
foo.baz = "New baz";
foo.qux = null;
foo.quux = {hello: "world"};

// Causes the browser url to change to:
// https://example.com/?bar=New+bar&baz=New+baz&corge=3&quux=%7Bhello%3A%22world%22%7D

// Side note: Changes to object properties are ignored:
foo.quux.hello = "user";
// The url will still be:
// https://example.com/?bar=New+bar&baz=New+baz&corge=3&quux=%7Bhello%3A%22world%22%7D
```

## FAQ

* Q: Does every parameter getter get recalculated on change?  
A: No, only updated properties will have their getter called

* Q: What happens if I ommit the `@InitQueryParameterBindings`?  
A: Primitive properties will still get bound, but getter/setter properties will not.

* Q: If I update an object property, will it get reflected to the query parameter?  
A: No, the query parameters are only updated when the properties itself changes.
