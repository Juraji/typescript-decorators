import { Component } from "@angular/core";
import { InitQueryParameterBindings, QueryParameterBinding } from "decorators";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
@InitQueryParameterBindings
export class AppComponent {

    @QueryParameterBinding("private-property")
    private _privateProperty = "";

    @QueryParameterBinding("title")
    public title = "typescript-decorators";

    public get privateProperty(): string {
        return this._privateProperty;
    }
}
