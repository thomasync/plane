import { useState, Fragment } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import projectService from "services/project.service";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// icons
import { PlusIcon } from "components/icons";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { RecentPagesList, CreateUpdatePageModal, TPagesListProps } from "components/pages";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import { TPageViewProps } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const AllPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.AllPagesList),
  {
    ssr: false,
  }
);

const FavoritePagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.FavoritePagesList),
  {
    ssr: false,
  }
);

const MyPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.MyPagesList),
  {
    ssr: false,
  }
);

const OtherPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.OtherPagesList),
  {
    ssr: false,
  }
);

const ProjectPages: NextPage = () => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);

  const [viewType, setViewType] = useState<TPageViewProps>("list");

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const tabsList = [
    {
      label: "Recent",
      name: store.locale.localized("Recent"),
    },
    {
      label: "All",
      name: store.locale.localized("All"),
    },
    {
      label: "Favorites",
      name: store.locale.localized("Favorites"),
    },
    {
      label: "Created by me",
      name: store.locale.localized("Created by me"),
    },
    {
      label: "Created by others",
      name: store.locale.localized("Created by others"),
    },
  ];

  const currentTabValue = (tab: string | null) => tabsList.findIndex((t) => t.label === tab);

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        user={user}
      />
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
              )} ${store.locale.localized("Pages")}`}
            />
          </Breadcrumbs>
        }
        right={
          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "d" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            {store.locale.localized("Create Page")}
          </PrimaryButton>
        }
      >
        <div className="space-y-5 p-8 h-full overflow-hidden flex flex-col">
          <div className="flex gap-4 justify-between">
            <h3 className="text-2xl font-semibold text-custom-text-100">Pages</h3>
            <div className="flex gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                  viewType === "list" ? "bg-custom-background-80" : ""
                }`}
                onClick={() => setViewType("list")}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                  viewType === "detailed" ? "bg-custom-background-80" : ""
                }`}
                onClick={() => setViewType("detailed")}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Tab.Group
            as={Fragment}
            defaultIndex={currentTabValue(pageTab)}
            onChange={(i) => {
              const tab = tabsList[i] ?? tabsList[0];
              setPageTab(tab.label);
            }}
          >
            <Tab.List as="div" className="mb-6 flex items-center justify-between">
              <div className="flex gap-4 items-center flex-wrap">
                {tabsList.map((tab, index) => (
                  <Tab
                    key={`${tab.label}-${index}`}
                    className={({ selected }) =>
                      `rounded-full border px-5 py-1.5 text-sm outline-none ${
                        selected
                          ? "border-custom-primary bg-custom-primary text-white"
                          : "border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90"
                      }`
                    }
                  >
                    {tab.name}
                  </Tab>
                ))}
              </div>
            </Tab.List>
            <Tab.Panels as={Fragment}>
              <Tab.Panel as="div" className="h-full overflow-y-auto space-y-5">
                <RecentPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <AllPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <FavoritePagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <MyPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <OtherPagesList viewType={viewType} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default ProjectPages;
