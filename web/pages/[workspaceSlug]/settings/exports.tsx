import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import ExportGuide from "components/exporter/guide";
import { SettingsSidebar } from "components/project";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
import { useMobxStore } from "lib/mobx/store-provider";

const ImportExport: NextPage = () => {
  const router = useRouter();
  const store: any = useMobxStore();
  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(
              activeWorkspace?.name ?? store.locale.localized("Workspace"),
              32
            )}`}
            link={`/${workspaceSlug}`}
            linkTruncate
          />
          <BreadcrumbItem title={store.locale.localized("Export Settings")} unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <div className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">{store.locale.localized("Exports")}</h3>
          </div>
          <ExportGuide />
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ImportExport;
