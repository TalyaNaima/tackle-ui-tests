/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import { createMultipleApplications, login } from "../../../../utils/utils";
import { CredentialType, JiraType, SEC } from "../../../types/constants";
import * as data from "../../../../utils/data_utils";
import { MigrationWave } from "../../../models/migration/migration-waves/migration-wave";
import { Assessment } from "../../../models/migration/applicationinventory/assessment";
import { Jira } from "../../../models/administration/jira-connection/jira";
import { JiraIssue } from "../../../models/administration/jira-connection/jira-api.interface";
import { JiraCredentials } from "../../../models/administration/credentials/JiraCredentials";

const now = new Date();
now.setDate(now.getDate() + 1);

const end = new Date(now.getTime());
end.setFullYear(end.getFullYear() + 1);

let applications: Assessment[];
let migrationWave: MigrationWave;
let jiraInstance: Jira;
let jiraCredentials: JiraCredentials;

// Automates Polarion TC 340
describe(["@tier1"], "Export Migration Wave to Issue Manager", function () {
    before("Create test data", function () {
        login();
        applications = createMultipleApplications(2);

        migrationWave = new MigrationWave(
            data.getRandomWord(8),
            now,
            end,
            null,
            null,
            applications
        );
        migrationWave.create();

        jiraCredentials = new JiraCredentials(
            data.getRandomCredentialsData(CredentialType.jiraBasic, null, true)
        );
        jiraCredentials.create();

        jiraInstance = new Jira({
            name: data.getRandomWord(5),
            url: Cypress.env("jira_atlassian_cloud_url"),
            credential: jiraCredentials,
            type: JiraType.cloud,
        });
        jiraInstance.create();
    });

    it("Export issues to Jira", function () {
        let projectName = "";

        jiraInstance
            .getProject()
            .then((project) => {
                expect(!!project).to.eq(true);

                projectName = project.name;

                return jiraInstance.getIssueType("Task");
            })
            .then((task) => {
                expect(!!task).to.eq(true);

                migrationWave.exportToIssueManager(
                    JiraType.cloud,
                    jiraInstance.name,
                    projectName,
                    task.untranslatedName
                );
            })
            .then((_) => {
                cy.wait(35 * SEC); // Enough time to create both tasks and for them to be available in the Jira API
                return jiraInstance.getIssues(projectName);
            })
            .then((issues: JiraIssue[]) => {
                expect(
                    migrationWave.applications.every((app) =>
                        issues.find((issue) => issue.fields.summary.includes(app.name))
                    )
                ).to.eq(true);

                jiraInstance.deleteIssues(issues.map((issue) => issue.id));
            });
    });

    after("Clear test data", function () {
        migrationWave.delete();
        jiraInstance.delete();
        jiraCredentials.delete();
        applications.forEach((app) => app.delete());
    });
});
