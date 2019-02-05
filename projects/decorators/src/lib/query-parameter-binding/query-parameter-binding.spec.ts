import { InitQueryParameterBindings, QueryParameterBinding } from "./query-parameter-binding";
import { BrowserContext } from "../browser-context";
import { async, TestBed } from "@angular/core/testing";
import { Component, OnInit } from "@angular/core";

@Component({selector: "lib-mixed-properties", template: ""})
@InitQueryParameterBindings
class MixedPropertiesComponent implements OnInit {
    public _getSetProperty = "Default value";
    public _getSetPropertyNoDefault: string;
    public originalNgOnInitCalled = false;

    @QueryParameterBinding("property-param")
    public primitiveProperty = "Default value";

    @QueryParameterBinding("property-param-no-default")
    public primitivePropertyNoDefault: string;

    @QueryParameterBinding("get-set-param", {pushHistoryState: true})
    public get getSetProperty(): string {
        return this._getSetProperty;
    }

    public set getSetProperty(value: string) {
        this._getSetProperty = value;
    }

    @QueryParameterBinding("get-set-param-no-default", {pushHistoryState: true})
    public get getSetPropertyNoDefault(): string {
        return this._getSetPropertyNoDefault;
    }

    public set getSetPropertyNoDefault(value: string) {
        this._getSetPropertyNoDefault = value;
    }

    public ngOnInit(): void {
        // To test if this OnInit gets called (being proxied by InitQueryParameterBindings)
        this.originalNgOnInitCalled = true;
    }
}

@Component({selector: "lib-with-jsoncomponent", template: ""})
@InitQueryParameterBindings
class WithJSONComponent {

    @QueryParameterBinding("property-no-default", {useJSON: true})
    public propertyNoDefault: any;

    @QueryParameterBinding("property", {useJSON: true})
    public property: any = {prop: true};
}

@Component({selector: "lib-non-string-type-component", template: ""})
@InitQueryParameterBindings
class NonStringTypeComponent {

    @QueryParameterBinding("property")
    public property = 1;

    @QueryParameterBinding("object")
    public property2 = {};
}

@Component({selector: "lib-component-with-get-logic", template: ""})
@InitQueryParameterBindings
class WithGetLogicComponent {

    @QueryParameterBinding("doc-title")
    public get logicalGetter(): string {
        return document.title;
    }
}


describe("@QueryParameterBinding", () => {

    beforeEach(async(() => {
        spyOn(BrowserContext, "getPath").and.returnValue("#/test");

        TestBed.configureTestingModule({
            declarations: [
                MixedPropertiesComponent,
                WithJSONComponent,
                NonStringTypeComponent,
                WithGetLogicComponent
            ]
        })
            .compileComponents();
    }));

    describe("with @InitQueryParameterBindings on class", () => {
        it("should always call through to the original ngOnInit, if one exists", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.originalNgOnInitCalled).toBeTruthy();
        });
    });

    describe("with primitive properties", () => {

        it("should initialize property with query parameter value on init when query parameter is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?property-param=Test+value&other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.primitiveProperty).toEqual("Test value");

            // Parameter update should not occur
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should initialize query parameter with property value on init when query parameter not is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.primitiveProperty).toEqual("Default value");
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(1);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?other-param=true&property-param=Default+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });


        it("should still initialize without default value on property and no query parameter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.primitivePropertyNoDefault).toBe(null);

            component.primitivePropertyNoDefault = "New value";

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(2);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?other-param=true&property-param=Default+value");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Default+value&property-param-no-default=New+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should write property changes to the query parameter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams(
                "?property-param=Initial+value&other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            // Check initial parameter
            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("property-param")).toEqual("Initial value");

            // Apply new value
            component.primitiveProperty = "New value";

            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("property-param")).toEqual("New value");

            // Remove parameter on null value
            component.primitiveProperty = null;

            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(false);

            // Add parameter on non-null value
            component.primitiveProperty = "Non-null value";

            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("property-param")).toEqual("Non-null value");

            // Expectations on parameter updates calls
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?property-param=New+value&other-param=true&get-set-param=Default+value");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&get-set-param=Default+value");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&get-set-param=Default+value&property-param=Non-null+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });
    });

    describe("with get/set properties and pushState enabled", () => {
        it("should still initialize without default value on property and no query parameter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const pushHistoryStateSpy = spyOn(BrowserContext, "pushHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.getSetPropertyNoDefault).toBe(null);

            component.getSetPropertyNoDefault = "New value";
            expect(component._getSetPropertyNoDefault).toEqual("New value");

            component.getSetPropertyNoDefault = "New value 2";
            expect(component._getSetPropertyNoDefault).toEqual("New value 2");

            // Expectations on parameter updates calls
            expect(pushHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Default+value");
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Default+value&get-set-param-no-default=New+value");
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Default+value&get-set-param-no-default=New+value+2");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should initialize property with query parameter value on init when query parameter is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?get-set-param=Test+value&other-param=true"));
            const pushHistoryStateSpy = spyOn(BrowserContext, "pushHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            // Both the getter and the original value should be in sync
            expect(component.getSetProperty).toEqual("Test value");
            expect(component._getSetProperty).toEqual("Test value");

            // Parameter update should not occur
            expect(pushHistoryStateSpy).toHaveBeenCalledTimes(0);

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should initialize query parameter with property value on init when query parameter not is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const pushHistoryStateSpy = spyOn(BrowserContext, "pushHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.getSetProperty).toEqual("Default value");
            expect(pushHistoryStateSpy).toHaveBeenCalledTimes(1);
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Default+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should write property changes to the query parameter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams(
                "?get-set-param=Initial+value&other-param=true"));
            const pushHistoryStateSpy = spyOn(BrowserContext, "pushHistoryState").and.stub();

            const fixture = TestBed.createComponent(MixedPropertiesComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            // Check initial parameter
            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("get-set-param")).toEqual("Initial value");

            // Apply new value
            component.getSetProperty = "New value";

            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("get-set-param")).toEqual("New value");

            // Remove parameter on null value
            component.getSetProperty = null;

            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(false);

            // Add parameter on non-null value
            component.getSetProperty = "Non-null value";

            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("get-set-param")).toEqual("Non-null value");

            // Expectations on parameter updates calls
            expect(pushHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?get-set-param=New+value&other-param=true&property-param=Default+value");
            expect(pushHistoryStateSpy).toHaveBeenCalledWith("#/test?other-param=true&property-param=Default+value");
            expect(pushHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?other-param=true&property-param=Default+value&get-set-param=Non-null+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });
    });

    describe("with useJSON enabled", () => {
        it("should serialize objects", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(WithJSONComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            component.propertyNoDefault = {prop: "Some string"};
            component.property = null;

            // Expectations on parameter updates calls
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=%7B%22prop%22%3Atrue%7D");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith(
                "#/test?property=%7B%22prop%22%3Atrue%7D&property-no-default=%7B%22prop%22%3A%22Some+string%22%7D");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property-no-default=%7B%22prop%22%3A%22Some+string%22%7D");
        });

        it("should deserialize objects", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams(
                "?property=%7B%22prop%22%3A%22Some+string%22%7D"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(WithJSONComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(component.property).toEqual({prop: "Some string"});

            // Expectations on parameter updates calls
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe("with non-string type property and useJSON disabled", () => {
        it("should log a warning", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();
            const consoleWarnSpy = spyOn(console, "warn").and.callThrough();

            const fixture = TestBed.createComponent(NonStringTypeComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            component.property = 2;

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "@QueryParameterBinding: Enabling useJSON is recommended for " +
                "non-string type properties in NonStringTypeComponent#property (typeof number)");

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "@QueryParameterBinding: Enabling useJSON is recommended for " +
                "non-string type properties in NonStringTypeComponent#property2 (typeof object)");

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=1");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=1&object=%5Bobject+Object%5D");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=2&object=%5Bobject+Object%5D");
        });
    });

    describe("with getter only", () => {
        beforeEach(() => {
            document.title = "My test page";
        });

        it("should update the query parameters using the getter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(WithGetLogicComponent);
            fixture.detectChanges();

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(1);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?doc-title=My+test+page");
        });

        it("should NOT update the query parameters if query parameter was already present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?doc-title=Karma"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const fixture = TestBed.createComponent(WithGetLogicComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);

            // By design this should work as well. The difference is that now it's not using document.title anymore,
            // since the getter is proxied to the query parameter.
            // If one would like "document.title" to be updated as well, one should implement a setter to do so.
            expect(component.logicalGetter).toEqual("Karma");
            expect(document.title).toEqual("My test page");
        });
    });
});
