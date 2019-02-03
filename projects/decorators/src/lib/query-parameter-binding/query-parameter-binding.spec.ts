import { BrowserContext, InitQueryParameterBindings, QueryParameterBinding } from "./query-parameter-binding";

describe("@QueryParameterBinding", () => {

    @InitQueryParameterBindings
    class TestClassMixed {
        public _getSetProperty = "Default value";
        public _getSetPropertyNoDefault: string;

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
    }

    @InitQueryParameterBindings
    class TestClassWithJSON {

        @QueryParameterBinding("property-no-default", {useJSON: true})
        public propertyNoDefault: any;

        @QueryParameterBinding("property", {useJSON: true})
        public property: any = {prop: true};
    }

    @InitQueryParameterBindings
    class TestClassNonStringType {

        @QueryParameterBinding("property")
        public property = 1;
        @QueryParameterBinding("object")
        public property2 = {};
    }

    @InitQueryParameterBindings
    class TestClassWithGetLogic {

        @QueryParameterBinding("doc-title")
        public get getPropertyWithLogic(): string {
            return document.title;
        }
    }

    beforeEach(() => {
        spyOn(BrowserContext, "getPath").and.returnValue("#/test");
    });

    describe("with primitive properties", () => {

        it("should initialize property with query parameter value on init when query parameter is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?property-param=Test+value&other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const testComponent = new TestClassMixed();

            expect(testComponent.primitiveProperty).toEqual("Test value");

            // Parameter update should not occur
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should initialize query parameter with property value on init when query parameter not is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const testComponent = new TestClassMixed();

            expect(testComponent.primitiveProperty).toEqual("Default value");
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(1);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?other-param=true&property-param=Default+value");

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });


        it("should still initialize without default value on property and no query parameter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            const testComponent = new TestClassMixed();

            expect(testComponent.primitivePropertyNoDefault).toBe(undefined);

            testComponent.primitivePropertyNoDefault = "New value";

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

            const testComponent = new TestClassMixed();

            // Check initial parameter
            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("property-param")).toEqual("Initial value");

            // Apply new value
            testComponent.primitiveProperty = "New value";

            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("property-param")).toEqual("New value");

            // Remove parameter on null value
            testComponent.primitiveProperty = null;

            expect(BrowserContext.getQueryParameters().has("property-param")).toBe(false);

            // Add parameter on non-null value
            testComponent.primitiveProperty = "Non-null value";

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

            const testComponent = new TestClassMixed();

            expect(testComponent.getSetPropertyNoDefault).toBe(null);

            testComponent.getSetPropertyNoDefault = "New value";
            expect(testComponent._getSetPropertyNoDefault).toEqual("New value");

            testComponent.getSetPropertyNoDefault = "New value 2";
            expect(testComponent._getSetPropertyNoDefault).toEqual("New value 2");

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

            const testComponent = new TestClassMixed();

            expect(testComponent.getSetProperty).toEqual("Test value");
            expect(testComponent._getSetProperty).toEqual("Test value");

            // Parameter update should not occur
            expect(pushHistoryStateSpy).toHaveBeenCalledTimes(0);

            // It should not affect other params
            expect(BrowserContext.getQueryParameters().get("other-param")).toEqual("true");
        });

        it("should initialize query parameter with property value on init when query parameter not is present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?other-param=true"));
            const pushHistoryStateSpy = spyOn(BrowserContext, "pushHistoryState").and.stub();

            const testComponent = new TestClassMixed();

            expect(testComponent.getSetProperty).toEqual("Default value");
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

            const testComponent = new TestClassMixed();

            // Check initial parameter
            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("get-set-param")).toEqual("Initial value");

            // Apply new value
            testComponent.getSetProperty = "New value";

            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(true);
            expect(BrowserContext.getQueryParameters().get("get-set-param")).toEqual("New value");

            // Remove parameter on null value
            testComponent.getSetProperty = null;

            expect(BrowserContext.getQueryParameters().has("get-set-param")).toBe(false);

            // Add parameter on non-null value
            testComponent.getSetProperty = "Non-null value";

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

            const testComponentWithJSON = new TestClassWithJSON();

            testComponentWithJSON.propertyNoDefault = {prop: "Some string"};
            testComponentWithJSON.property = null;

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

            const testComponentWithJSON = new TestClassWithJSON();

            expect(testComponentWithJSON.property).toEqual({prop: "Some string"});

            // Expectations on parameter updates calls
            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe("with non-string type property and useJSON disabled", () => {
        it("should log a warning", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();
            const consoleWarnSpy = spyOn(console, "warn").and.callThrough();

            const testComponentNonStringType = new TestClassNonStringType();
            testComponentNonStringType.property = 2;

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "@QueryParameterBinding: Enabling useJSON is recommended for " +
                "non-string type properties in TestClassNonStringType#property (typeof number)");

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "@QueryParameterBinding: Enabling useJSON is recommended for " +
                "non-string type properties in TestClassNonStringType#property2 (typeof object)");

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(3);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=1");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=1&object=%5Bobject+Object%5D");
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?property=2&object=%5Bobject+Object%5D");
        });
    });

    describe("with getter only", () => {
        it("should update the query parameters using the getter", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams());
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            // tslint:disable-next-line
            new TestClassWithGetLogic();

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(1);
            expect(replaceHistoryStateSpy).toHaveBeenCalledWith("#/test?doc-title=");
        });

        it("should NOT update the query parameters if query parameter was already present", () => {
            spyOn(BrowserContext, "getQueryParameters").and.returnValue(new URLSearchParams("?doc-title=Karma"));
            const replaceHistoryStateSpy = spyOn(BrowserContext, "replaceHistoryState").and.stub();

            // tslint:disable-next-line
            new TestClassWithGetLogic();

            expect(replaceHistoryStateSpy).toHaveBeenCalledTimes(0);
        });
    });
});