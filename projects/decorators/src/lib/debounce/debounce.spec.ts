import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Debounce } from "./debounce";

@Component({selector: "lib-test", template: ""})
class TestComponent {

    @Debounce(10)
    public debounceMe(arg: number) {
        this.callCounterSpy(arg);
    }

    public callCounterSpy(arg: number) {
    }
}

describe("@Debounce", () => {

    beforeEach(async () => {
        // Uninstall any installed clock before proceeding
        jasmine.clock().uninstall();
        jasmine.clock().install();

        await TestBed.configureTestingModule({
            declarations: [TestComponent]
        })
            .compileComponents();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it("should prevent debounced method to be called more than once over a delay time", async (done) => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;

        const callCounterSpy = spyOn(component, "callCounterSpy").and.stub();

        // Run 5 separate calls to the method
        const callCount = 5;
        for (let i = 0; i < callCount; i++) {
            component.debounceMe(i);

            // Forward time by a random amount between 0ms and 10ms, to simulate time
            jasmine.clock().tick(Math.random() * 10);
        }

        // Forward clock by 20ms, to make sure the debounce time out has elapsed
        jasmine.clock().tick(20);

        // Expect #debounceMe to have been called only once
        expect(callCounterSpy).toHaveBeenCalledTimes(1);
        // Expect the last call to have been called through
        expect(callCounterSpy).toHaveBeenCalledWith(4);

        // Async test is done
        done();
    });
});
