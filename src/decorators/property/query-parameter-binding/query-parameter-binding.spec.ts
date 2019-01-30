import { browserContext, QueryParameterBinding } from "./query-parameter-binding";
import { Input } from "@angular/core";

describe("@QueryParameterBinding decorator (standalone)", () => {
    beforeEach(() => {
        spyOn(browserContext, "path").and.returnValue("/test");
    });

    it("should initially update get/set properties to the corresponding query parameter", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=GetSet+test+value");

        class TestComponent {
            public _getSetProperty: string;

            @Input()
            @QueryParameterBinding("get-set")
            public get getSetProperty() {
                return this._getSetProperty;
            }

            public set getSetProperty(value) {
                this._getSetProperty = value;
            }
        }

        // Init component
        const testComponent = new TestComponent();

        // Expect the properties to have been updated
        expect(testComponent.getSetProperty).toEqual("GetSet test value");
        expect(testComponent._getSetProperty).toEqual("GetSet test value");
    });

    it("should support get-only properties", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=GetSet+test+value");

        class TestComponent {
            @Input()
            @QueryParameterBinding("get-set")
            public get standaloneGetter() {
                return "Hello World";
            }
        }

        // Init component
        const testComponent = new TestComponent();

        // Expect the properties to have been updated
        expect(testComponent.standaloneGetter).toEqual("GetSet test value");
    });

    it("should initially update primitive properties to the corresponding query parameter", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?primitive=Primitive+test+value");

        class TestComponent {
            @QueryParameterBinding("primitive")
            public primitiveProperty: string;
        }

        // Init component
        const testComponent = new TestComponent();

        // Expect the properties to have been updated
        expect(testComponent.primitiveProperty).toEqual("Primitive test value");
    });

    it("should reflect get/set property value changes to the query parameter", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=Old+value&primitive=Other+value");
        const replaceStateSpy = spyOn(browserContext, "replaceState").and.stub();

        class TestComponent {
            public _getSetProperty: string;

            @Input()
            @QueryParameterBinding("get-set")
            public get getSetProperty() {
                return this._getSetProperty;
            }

            public set getSetProperty(value) {
                this._getSetProperty = value;
            }
        }

        // Init component
        const testComponent = new TestComponent();

        testComponent.getSetProperty = "New value";
        // The query parameter should be updated
        expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/test?get-set=New+value&primitive=Other+value");
        // The original setter should also have been called
        expect(testComponent._getSetProperty).toEqual("New value");
    });

    it("should reflect primitive property value changes to the query parameter", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=Other+value&primitive=Old+value");
        const replaceStateSpy = spyOn(browserContext, "replaceState").and.stub();

        class TestComponent {
            @QueryParameterBinding("primitive")
            public primitiveProperty: string;
        }

        // Init component
        const testComponent = new TestComponent();

        testComponent.primitiveProperty = "New value";
        expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/test?get-set=Other+value&primitive=New+value");
    });

    it("should use pushState when \"replaceState\" was set to false in options", () => {
        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=Other+value&primitive=Old+value");
        const replaceStateSpy = spyOn(browserContext, "replaceState").and.stub();
        const pushStateSpy = spyOn(browserContext, "pushState").and.stub();

        class TestComponent {
            @QueryParameterBinding("primitive", {replaceState: false})
            public primitiveProperty: string;
        }

        // Init component
        const testComponent = new TestComponent();

        testComponent.primitiveProperty = "New value";

        expect(replaceStateSpy).toHaveBeenCalledTimes(0);
        expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/test?get-set=Other+value&primitive=New+value");
    });

    it("does not update query parameters when changes are made to underlying values of get/set properties", () => {
        /**
         * This test is to display the behaviour of QueryParameterBinding when underlying properties are updated
         * instead of using the setter when QueryParameterBinding is applied to a get/set property
         */

        // Given query parameters
        spyOn(browserContext, "search").and.returnValue("?get-set=Old+value&primitive=Other+value");
        const replaceStateSpy = spyOn(browserContext, "replaceState").and.stub();

        class TestComponent {
            public _getSetProperty: string;

            @Input()
            @QueryParameterBinding("get-set")
            public get getSetProperty() {
                return this._getSetProperty;
            }

            public set getSetProperty(value) {
                this._getSetProperty = value;
            }
        }

        // Init component
        const testComponent = new TestComponent();

        testComponent._getSetProperty = "New value";
        // The query parameter should be updated
        expect(replaceStateSpy).toHaveBeenCalledTimes(0);
        expect(testComponent.getSetProperty).toEqual("Old value");
    });
});
