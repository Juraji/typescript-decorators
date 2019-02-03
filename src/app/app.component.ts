import { Component } from "@angular/core";
import { QueryParameterBinding } from "../decorators/property/query-parameter-binding/query-parameter-binding";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent {
    @QueryParameterBinding("private-property")
    private _privateProperty = "";

    @QueryParameterBinding("title")
    public title = "typescript-decorators";

    public get privateProperty(): string {
        return this._privateProperty;
    }
}
