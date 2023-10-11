import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import projectService from "services/project.service";
import modulesService from "services/modules.service";
// components
import {
  CreateUpdateModuleModal,
  ModulesListGanttChartView,
  SingleModuleCard,
} from "components/modules";
// ui
import { EmptyState, Icon, Loader, PrimaryButton, Tooltip } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyModule from "public/empty-state/module.svg";
// types
import { IModule, SelectModuleType } from "types/modules";
import type { NextPage } from "next";
// fetch-keys
import { MODULE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { replaceUnderscoreIfSnakeCase, truncateText } from "helpers/string.helper";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const moduleViewOptions: { type: "grid" | "gantt_chart"; icon: any }[] = [
  {
    type: "gantt_chart",
    icon: "view_timeline",
  },
  {
    type: "grid",
    icon: "table_rows",
  },
];

const ProjectModules: NextPage = () => {
  const [selectedModule, setSelectedModule] = useState<SelectModuleType>();
  const [createUpdateModule, setCreateUpdateModule] = useState(false);

  const [modulesView, setModulesView] = useState<"grid" | "gantt_chart">("grid");

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: modules, mutate: mutateModules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => modulesService.getModules(workspaceSlug as string, projectId as string)
      : null
  );

  const handleEditModule = (module: IModule) => {
    setSelectedModule({ ...module, actionType: "edit" });
    setCreateUpdateModule(true);
  };

  useEffect(() => {
    if (createUpdateModule) return;

    const timer = setTimeout(() => {
      setSelectedModule(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateModule]);

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={store.locale.localized("Projects")}
            link={`/${workspaceSlug}/projects`}
          />
          <BreadcrumbItem
            title={`${truncateText(
              activeProject?.name ?? store.locale.localized("Project"),
              32
            )} ${store.locale.localized("Modules")}`}
          />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          {moduleViewOptions.map((option) => (
            <Tooltip
              key={option.type}
              tooltipContent={
                <span className="capitalize">
                  {replaceUnderscoreIfSnakeCase(option.type)} Layout
                </span>
              }
              position="bottom"
            >
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80 duration-300 ${
                  modulesView === option.type
                    ? "bg-custom-sidebar-background-80"
                    : "text-custom-sidebar-text-200"
                }`}
                onClick={() => setModulesView(option.type)}
              >
                <Icon
                  iconName={option.icon}
                  className={`!text-base ${option.type === "grid" ? "rotate-90" : ""}`}
                />
              </button>
            </Tooltip>
          ))}
          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "m" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            {store.locale.localized("Add Module")}
          </PrimaryButton>
        </div>
      }
    >
      <CreateUpdateModuleModal
        isOpen={createUpdateModule}
        setIsOpen={setCreateUpdateModule}
        data={selectedModule}
        user={user}
      />
      {modules ? (
        modules.length > 0 ? (
          <>
            {modulesView === "grid" && (
              <div className="h-full overflow-y-auto p-8">
                <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 xl:grid-cols-3">
                  {modules.map((module) => (
                    <SingleModuleCard
                      key={module.id}
                      module={module}
                      handleEditModule={() => handleEditModule(module)}
                      user={user}
                    />
                  ))}
                </div>
              </div>
            )}
            {modulesView === "gantt_chart" && (
              <ModulesListGanttChartView modules={modules} mutateModules={mutateModules} />
            )}
          </>
        ) : (
          <EmptyState
            title="Manage your project with modules"
            description="Modules are smaller, focused projects that help you group and organize issues."
            image={emptyModule}
            primaryButton={{
              icon: <PlusIcon className="h-4 w-4" />,
              text: store.locale.localized("New Module"),
              onClick: () => {
                const e = new KeyboardEvent("keydown", {
                  key: "m",
                });
                document.dispatchEvent(e);
              },
            }}
          />
        )
      ) : (
        <Loader className="grid grid-cols-3 gap-4 p-8">
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
        </Loader>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectModules;
