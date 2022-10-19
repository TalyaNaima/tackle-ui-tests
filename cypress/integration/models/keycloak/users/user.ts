import { UserData } from "../../../types/types";
import { button, SEC, tdTag, trTag } from "../../../types/constants";
import { click, clickByText, deleteFromArray, inputText } from "../../../../utils/utils";
import * as loginView from "../../../views/login.view";
const tackleUiUrl = Cypress.env("tackleUrl");
const keycloakAdminPassword = Cypress.env("keycloakAdminPassword");

export class User {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    userEnabled: boolean;
    roles = [""];

    constructor(userData: UserData) {
        const { username, password, firstName, lastName, email, userEnabled } = userData;
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.userEnabled = userEnabled;
    }

    static keycloakUrl = tackleUiUrl + "/auth/";

    static loginAdmin(): void {
        cy.visit(User.keycloakUrl, { timeout: 120 * SEC });
        cy.contains("h1", "Welcome to Keycloak", { timeout: 120 * SEC }); // Make sure that welcome page opened and loaded
        clickByText("a", "Administration Console");
        cy.get("#kc-page-title", { timeout: 120 * SEC }); // Make sure that login page opened and loaded

        inputText(loginView.userNameInput, "admin");
        inputText(loginView.userPasswordInput, keycloakAdminPassword);
        click(loginView.loginButton);
    }

    static openList(): void {
        clickByText("a", "Users");
        click("#viewAllUsers");
        cy.wait(SEC);
    }

    protected static applyAction(itemName, action: string): void {
        cy.get(tdTag, { timeout: 120 * SEC })
            .contains(itemName, { timeout: 120 * SEC })
            .closest(trTag)
            .within(() => {
                clickByText(tdTag, action);
                cy.wait(500);
            });
        if (action.toLowerCase() === "delete") {
            click(
                "body > div.modal.fade.ng-isolate-scope.in > div > div > div.modal-footer.ng-scope > button.ng-binding.btn.btn-danger"
            );
        }
    }

    protected navigateToSection(section: string) {
        clickByText("a", section);
    }

    protected inputUsername(username: string) {
        inputText(loginView.userNameInput, username);
    }

    protected inputFirstname(firstName: string) {
        inputText("#firstName", firstName);
    }

    protected inputLastname(lastName: string) {
        inputText("#lastName", lastName);
    }

    protected inputEmail(email: string) {
        inputText("#email", email);
    }

    protected inputPassword(password: string) {
        inputText("#newPas", password);
        inputText("#confirmPas", password);
    }

    create(): void {
        User.openList();
        click("#createUser");
        this.inputUsername(this.username);
        this.inputEmail(this.email);
        this.inputFirstname(this.firstName);
        this.inputLastname(this.lastName);
        clickByText(button, "Save");
    }

    delete(): void {
        User.openList();
        User.applyAction(this.username, "Delete");
    }

    definePassword(): void {
        User.openList();
        User.applyAction(this.username, "Edit");
        this.navigateToSection("Credentials");
        this.inputPassword(this.password);
        clickByText(button, "Set Password");
        clickByText(button, "Set password");
    }

    addRole(role: string): void {
        User.openList();
        User.applyAction(this.username, "Edit");
        this.navigateToSection("Role Mappings");
        cy.get("#available").select(role);
        clickByText(button, "Add selected");
        cy.wait(SEC);
        cy.get("#assigned").select(role);
        this.roles.push(role);
    }

    removeRole(role: string): void {
        User.openList();
        User.applyAction(this.username, "Edit");
        this.navigateToSection("Role Mappings");
        cy.get("#assigned").select(role);
        clickByText(button, "Remove selected");
        cy.wait(SEC);
        cy.get("#available").select(role);
        deleteFromArray(this.roles, role);
    }
}
