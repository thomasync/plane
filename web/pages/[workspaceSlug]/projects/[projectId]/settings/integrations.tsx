import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import IntegrationService from "services/integration";
import projectService from "services/project.service";
// components
import { SettingsSidebar, SingleIntegration } from "components/project";
// ui
import { EmptyState, IntegrationAndImportExportBanner, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
// images
import emptyIntegration from "public/empty-state/integration.svg";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const ProjectIntegrations: NextPage = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () =>
      workspaceSlug
        ? IntegrationService.getWorkspaceIntegrationsList(workspaceSlug as string)
        : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title={store.locale.localized("Integrations Settings")} unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <div className="pr-9 py-8 gap-10 w-full overflow-y-auto">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">{store.locale.localized("Integrations")}</h3>
          </div>
          {workspaceIntegrations ? (
            workspaceIntegrations.length > 0 ? (
              <div>
                {workspaceIntegrations.map((integration) => (
                  <SingleIntegration
                    key={integration.integration_detail.id}
                    integration={integration}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={store.locale.localized("You haven't configured integrations")}
                description={store.locale.localized(
                  "Configure GitHub and other integrations to sync your project issues."
                )}
                image={emptyIntegration}
                primaryButton={{
                  text: store.locale.localized("Configure now"),
                  onClick: () => router.push(`/${workspaceSlug}/settings/integrations`),
                }}
              />
            )
          ) : (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          )}
        </div>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectIntegrations;
