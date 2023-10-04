import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import projectService from "services/project.service";
import trackEventServices, { MiscellaneousEventType } from "services/track-event.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// components
import { SettingsSidebar } from "components/project";
// ui
import { ToggleSwitch } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ModuleIcon } from "components/icons";
import { FileText, Inbox, Layers } from "lucide-react";
import { ContrastOutlined } from "@mui/icons-material";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECTS_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const getEventType = (feature: string, toggle: boolean): MiscellaneousEventType => {
  switch (feature) {
    case "Cycles":
      return toggle ? "TOGGLE_CYCLE_ON" : "TOGGLE_CYCLE_OFF";
    case "Modules":
      return toggle ? "TOGGLE_MODULE_ON" : "TOGGLE_MODULE_OFF";
    case "Views":
      return toggle ? "TOGGLE_VIEW_ON" : "TOGGLE_VIEW_OFF";
    case "Pages":
      return toggle ? "TOGGLE_PAGES_ON" : "TOGGLE_PAGES_OFF";
    case "Inbox":
      return toggle ? "TOGGLE_INBOX_ON" : "TOGGLE_INBOX_OFF";
    default:
      throw new Error("Invalid feature");
  }
};

const FeaturesSettings: NextPage = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const featuresList = [
    {
      title: store.locale.localized("Cycles"),
      description: store.locale.localized(
        "Cycles are enabled for all the projects in this workspace. Access them from the sidebar."
      ),
      icon: (
        <ContrastOutlined className="!text-base !leading-4 text-purple-500 flex-shrink-0 rotate-180" />
      ),

      property: "cycle_view",
    },
    {
      title: store.locale.localized("Modules"),
      description: store.locale.localized(
        "Modules are enabled for all the projects in this workspace. Access it from the sidebar."
      ),
      icon: <ModuleIcon width={16} height={16} className="flex-shrink-0" />,
      property: "module_view",
    },
    {
      title: store.locale.localized("Views"),
      description: store.locale.localized(
        "Views are enabled for all the projects in this workspace. Access it from the sidebar."
      ),
      icon: <Layers className="h-4 w-4 text-cyan-500 flex-shrink-0" />,
      property: "issue_views_view",
    },
    {
      title: store.locale.localized("Pages"),
      description: store.locale.localized(
        "Pages are enabled for all the projects in this workspace. Access it from the sidebar."
      ),
      icon: <FileText className="h-4 w-4 text-red-400 flex-shrink-0" />,
      property: "page_view",
    },
    {
      title: store.locale.localized("Inbox"),
      description: store.locale.localized(
        "Inbox are enabled for all the projects in this workspace. Access it from the issues views page."
      ),
      icon: <Inbox className="h-4 w-4 text-fuchsia-500 flex-shrink-0" />,
      property: "inbox_view",
    },
  ];

  const handleSubmit = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !projectDetails) return;

    mutate<IProject[]>(
      PROJECTS_LIST(workspaceSlug.toString(), {
        is_favorite: "all",
      }),
      (prevData) => prevData?.map((p) => (p.id === projectId ? { ...p, ...formData } : p)),
      false
    );

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return { ...prevData, ...formData };
      },
      false
    );

    setToastAlert({
      type: "success",
      title: store.locale.localized("Success!"),
      message: store.locale.localized("Project feature updated successfully."),
    });

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, formData, user)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized(
            "Project feature could not be updated. Please try again."
          ),
        })
      );
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? store.locale.localized("Project"), 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title={store.locale.localized("Features Settings")} unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">{store.locale.localized("Features")}</h3>
          </div>
          <div>
            {featuresList.map((feature) => (
              <div
                key={feature.property}
                className="flex items-center justify-between gap-x-8 gap-y-2 border-b border-custom-border-200 bg-custom-background-100 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center p-3 rounded bg-custom-background-90">
                    {feature.icon}
                  </div>
                  <div className="">
                    <h4 className="text-sm font-medium">{feature.title}</h4>
                    <p className="text-sm text-custom-text-200 tracking-tight">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  value={projectDetails?.[feature.property as keyof IProject]}
                  onChange={() => {
                    trackEventServices.trackMiscellaneousEvent(
                      {
                        workspaceId: (projectDetails?.workspace as any)?.id,
                        workspaceSlug,
                        projectId,
                        projectIdentifier: projectDetails?.identifier,
                        projectName: projectDetails?.name,
                      },
                      getEventType(
                        feature.title,
                        !projectDetails?.[feature.property as keyof IProject]
                      ),
                      user
                    );
                    handleSubmit({
                      [feature.property]: !projectDetails?.[feature.property as keyof IProject],
                    });
                  }}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default FeaturesSettings;
