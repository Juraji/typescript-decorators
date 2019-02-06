import { Component } from "@angular/core";
import { async, TestBed } from "@angular/core/testing";
import { DebounceUntil } from "./debounce-until";

@Component({selector: "lib-test", template: ""})
class TestComponent {
    public predicate1 = false;
    public predicate2 = false;

    @DebounceUntil(c => c.predicate1 && c.predicate2)
    public debounceMe() {
        this.calledSpy();
    }

    public calledSpy() {
    }
}

describe("@DebounceUntil", () => {

    beforeEach(async(() => {

        TestBed.configureTestingModule({
            declarations: [TestComponent]
        })
            .compileComponents();
    }));

    it("should prevent debounced method to be called before the predicate tests true", () => {
        const fixture = TestBed.createComponent(TestComponent);
        const component = fixture.componentInstance;
        const calledSpy = spyOn(component, "calledSpy").and.stub();

        component.debounceMe();
        expect(calledSpy).toHaveBeenCalledTimes(0);

        component.predicate1 = true;
        component.debounceMe();
        expect(calledSpy).toHaveBeenCalledTimes(0);

        component.predicate2 = true;
        component.debounceMe();
        expect(calledSpy).toHaveBeenCalledTimes(1);
    });
});
