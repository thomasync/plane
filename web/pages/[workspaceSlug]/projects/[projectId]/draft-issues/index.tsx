import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// helper
import { truncateText } from "helpers/string.helper";
// components
import { IssuesFilterView, IssuesView } from "components/core";
// ui
import { Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { X, PenSquare } from "lucide-react";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const ProjectDraftIssues: NextPage = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <IssueViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={store.locale.localized("Projects")}
              link={`/${workspaceSlug}/projects`}
            />
            <BreadcrumbItem
              title={`${truncateText(
                projectDetails?.name ?? store.locale.localized("Project"),
                32
              )} ${store.locale.localized("Draft Issues")}`}
            />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
            <IssuesFilterView />
          </div>
        }
      >
        <div className="h-full w-full flex flex-col">
          <div className="flex items-center ga-1 px-4 py-2.5 shadow-sm border-b border-custom-border-200">
            <button
              type="button"
              onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
              className="flex items-center gap-1.5 rounded border border-custom-border-200 px-3 py-1.5 text-xs"
            >
              <PenSquare className="h-3 w-3 text-custom-text-300" />
              <span>{store.locale.localized("Draft Issues")}</span>

              <X className="h-3 w-3" />
            </button>
          </div>
          <IssuesView />
        </div>
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default ProjectDraftIssues;
