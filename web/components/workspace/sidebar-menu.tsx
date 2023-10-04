import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import useTheme from "hooks/use-theme";
// components
import { NotificationPopover } from "components/notifications";
import { Tooltip } from "components/ui";
// icons
import {
  BarChartRounded,
  GridViewOutlined,
  TaskAltOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const WorkspaceSidebarMenu = () => {
  const store: RootStore = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const workspaceLinks = (workspaceSlug: string) => [
    {
      Icon: GridViewOutlined,
      name: store.locale.localized("Dashboard"),
      key: "dashboard",
      href: `/${workspaceSlug}`,
    },
    {
      Icon: BarChartRounded,
      name: store.locale.localized("Analytics"),
      key: "analytics",
      href: `/${workspaceSlug}/analytics`,
    },
    {
      Icon: WorkOutlineOutlined,
      name: store.locale.localized("Projects"),
      key: "projects",
      href: `/${workspaceSlug}/projects`,
    },
    {
      Icon: TaskAltOutlined,
      name: store.locale.localized("All Issues"),
      key: "all-issues",
      href: `/${workspaceSlug}/workspace-views/all-issues`,
    },
  ];

  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <div className="w-full cursor-pointer space-y-1 p-4">
      {workspaceLinks(workspaceSlug as string).map((link, index) => {
        const isActive =
          link.key === "settings" ? router.asPath.includes(link.href) : router.asPath === link.href;

        return (
          <Link key={index} href={link.href}>
            <a className="block w-full">
              <Tooltip
                tooltipContent={link.name}
                position="right"
                className="ml-2"
                disabled={!store?.theme?.sidebarCollapsed}
              >
                <div
                  className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                    isActive
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
                  } ${store?.theme?.sidebarCollapsed ? "justify-center" : ""}`}
                  suppressHydrationWarning
                >
                  {<link.Icon fontSize="small" />}
                  {!store?.theme?.sidebarCollapsed && link.name}
                </div>
              </Tooltip>
            </a>
          </Link>
        );
      })}

      <NotificationPopover />
    </div>
  );
};
