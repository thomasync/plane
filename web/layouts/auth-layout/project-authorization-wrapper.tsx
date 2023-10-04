import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// contexts
import { useProjectMyMembership, ProjectMemberProvider } from "contexts/project-member.context";
import { WorkspaceViewProvider } from "contexts/workspace-view-context";
// layouts
import AppHeader from "layouts/app-layout/app-header";
import AppSidebar from "layouts/app-layout/app-sidebar";
// components
import { NotAuthorizedView, JoinProject } from "components/auth-screens";
import { CommandPalette } from "components/command-palette";
// ui
import { EmptyState, PrimaryButton, Spinner } from "components/ui";
// icons
import { LayerDiagonalIcon } from "components/icons";
// images
import emptyProject from "public/empty-state/project.svg";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  children: React.ReactNode;
  noHeader?: boolean;
  bg?: "primary" | "secondary";
  breadcrumbs?: JSX.Element;
  left?: JSX.Element;
  right?: JSX.Element;
};

export const ProjectAuthorizationWrapper: React.FC<Props> = (props) => (
  <ProjectMemberProvider>
    <WorkspaceViewProvider>
      <ProjectAuthorizationWrapped {...props} />
    </WorkspaceViewProvider>
  </ProjectMemberProvider>
);

const ProjectAuthorizationWrapped: React.FC<Props> = ({
  children,
  noHeader = false,
  bg = "primary",
  breadcrumbs,
  left,
  right,
}) => {
  const [toggleSidebar, setToggleSidebar] = useState(false);

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { loading, error, memberRole: memberType } = useProjectMyMembership();

  const settingsLayout = router.pathname.includes("/settings");

  return (
    <>
      <CommandPalette />
      <div className="relative flex h-screen w-full overflow-hidden">
        <AppSidebar toggleSidebar={toggleSidebar} setToggleSidebar={setToggleSidebar} />

        {loading ? (
          <div className="grid h-full w-full place-items-center p-4 bg-custom-background-100">
            <div className="flex flex-col items-center gap-3 text-center">
              <h3 className="text-xl" suppressHydrationWarning>
                {store.locale.localized("Loading your project...")}
              </h3>
              <Spinner />
            </div>
          </div>
        ) : error?.status === 401 || error?.status === 403 ? (
          <JoinProject />
        ) : error?.status === 404 ? (
          <div className="container grid h-screen place-items-center bg-custom-background-100">
            <EmptyState
              title={store.locale.localized("No such project exists")}
              description={store.locale.localized("Try creating a new project")}
              image={emptyProject}
              primaryButton={{
                text: store.locale.localized("Create Project"),
                onClick: () => {
                  const e = new KeyboardEvent("keydown", {
                    key: "p",
                  });
                  document.dispatchEvent(e);
                },
              }}
            />
          </div>
        ) : settingsLayout && (memberType?.isGuest || memberType?.isViewer) ? (
          <NotAuthorizedView
            actionButton={
              <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
                <a>
                  <PrimaryButton className="flex items-center gap-1">
                    <LayerDiagonalIcon height={16} width={16} color="white" />{" "}
                    {store.locale.localized("Go to issues")}
                  </PrimaryButton>
                </a>
              </Link>
            }
            type="project"
          />
        ) : (
          <main
            className={`relative flex h-full w-full flex-col overflow-hidden ${
              bg === "primary"
                ? "bg-custom-background-100"
                : bg === "secondary"
                ? "bg-custom-background-90"
                : "bg-custom-background-80"
            }`}
          >
            <AppHeader
              breadcrumbs={breadcrumbs}
              left={left}
              right={right}
              setToggleSidebar={setToggleSidebar}
              noHeader={noHeader}
            />
            <div className="h-full w-full overflow-hidden">
              <div className="h-full w-full overflow-x-hidden overflow-y-scroll">{children}</div>
            </div>
          </main>
        )}
      </div>
    </>
  );
};
