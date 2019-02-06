import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { LogMe } from "./log-me";

@Component({selector: "lib-test", template: ""})
class TestComponent {
    public _gsProperty = "gsProperty first value";

    @LogMe()
    public property1: string;

    @LogMe()
    public property2 = "property2 value";

    @LogMe()
    public get gsProperty(): string {
        return this._gsProperty;
    }

    public set gsProperty(value: string) {
        this._gsProperty = value;
    }

    @LogMe()
    public methodWithArgsAndReturnValue(arg: string, arg2: number): string {
        return arg + arg2;
    }

    @LogMe()
    public methodNoArgsWithReturnValue(): string {
        return "a value";
    }

    @LogMe()
    public methodNoArgsNoReturnValue(): void {
    }

    @LogMe()
    public methodThrowsError(): void {
        throw new Error("This is an error");
    }
}

describe("@LogMe", () => {
    let logSpy: jasmine.Spy;

    beforeEach(async(() => {
        logSpy = spyOn(console, "log").and.callThrough();

        TestBed.configureTestingModule({
            declarations: [TestComponent]
        })
            .compileComponents();
    }));

    it("should wrap primitive properties with GET and SET logging", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        // Expect object init to have logged for property2, since it has a default value
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.property2 SET parameter:", "property2 value");

        expect(component.property2).toEqual("property2 value");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.property2 GET value:", "property2 value");

        expect(component.property1).toEqual(undefined);
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.property1 GET value:", undefined);

        component.property1 = "new property1 value";
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.property1 SET parameter:", "new property1 value");

        expect(component.property1).toEqual("new property1 value");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.property1 GET value:", "new property1 value");
    });

    it("should wrap getter/setter properties with GET and SET logging", () => {

        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        expect(component.gsProperty).toEqual("gsProperty first value");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.gsProperty GET value:", "gsProperty first value");

        component.gsProperty = "gsProperty new value";
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.gsProperty SET parameter:", "gsProperty new value");

        expect(component.gsProperty).toEqual("gsProperty new value");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.gsProperty GET value:", "gsProperty new value");

        expect(component._gsProperty).toEqual("gsProperty new value");
    });

    it("should wrap methods with parameter and return value logging", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        component.methodWithArgsAndReturnValue("test", 5);
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodWithArgsAndReturnValue arguments:", [
            {index: 0, type: "string", value: "test"},
            {index: 1, type: "number", value: 5}
        ]);
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodWithArgsAndReturnValue return value:", "string", "test5");
    });

    it("should state \"None\" for a method call without parameters", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        component.methodNoArgsWithReturnValue();
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodNoArgsWithReturnValue arguments:", "None");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodNoArgsWithReturnValue return value:", "string", "a value");
    });

    it("should should state \"Null\" when a logged method returns null or undefined", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        component.methodNoArgsNoReturnValue();
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodNoArgsNoReturnValue arguments:", "None");
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodNoArgsNoReturnValue return value:", "Null");
    });

    it("should log method errors (Which might not show due to business logic catching the errors)", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        try {
            component.methodThrowsError();
        } catch (e) {
            // Caught and discarded
        }
        expect(logSpy).toHaveBeenCalledWith("LogMe -> TestComponent.methodThrowsError produced an error:", jasmine.any(Error));
    });
});
