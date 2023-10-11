import React, { useCallback, useState } from "react";

import useSWR from "swr";

import { useRouter } from "next/router";

// context
import { useProjectMyMembership } from "contexts/project-member.context";
// service
import projectIssuesServices from "services/issues.service";
// hooks
import useProjects from "hooks/use-projects";
import useUser from "hooks/use-user";
import { useWorkspaceView } from "hooks/use-workspace-view";
import useWorkspaceMembers from "hooks/use-workspace-members";
import useToast from "hooks/use-toast";
// components
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { EmptyState, PrimaryButton } from "components/ui";
import { SpreadsheetView, WorkspaceFiltersList } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { CreateUpdateWorkspaceViewModal } from "components/workspace/views/modal";
// icon
import { PlusIcon } from "components/icons";
// image
import emptyView from "public/empty-state/view.svg";
// constants
import { WORKSPACE_LABELS } from "constants/fetch-keys";
import { STATE_GROUP } from "constants/state";
// types
import { IIssue, IWorkspaceIssueFilterOptions } from "types";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

export const WorkspaceViewIssues = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { setToastAlert } = useToast();

  const { memberRole } = useProjectMyMembership();
  const { user } = useUser();
  const { isGuest, isViewer } = useWorkspaceMembers(
    workspaceSlug?.toString(),
    Boolean(workspaceSlug)
  );
  const { filters, viewIssues, mutateViewIssues, handleFilters } = useWorkspaceView();

  const [createViewModal, setCreateViewModal] = useState<any>(null);

  // create issue modal
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  // update issue modal
  const [editIssueModal, setEditIssueModal] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);

  // delete issue modal
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  const { data: workspaceLabels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => projectIssuesServices.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const makeIssueCopy = useCallback(
    (issue: IIssue) => {
      setCreateIssueModal(true);

      setPreloadedData({
        ...issue,
        name: `${issue.name} (${store.locale.localized("Copy")})`,
        actionType: "createIssue",
      });
    },
    [setCreateIssueModal, setPreloadedData, store.locale]
  );

  const handleEditIssue = useCallback(
    (issue: IIssue) => {
      setEditIssueModal(true);
      setIssueToEdit({
        ...issue,
        actionType: "edit",
        cycle: issue.issue_cycle ? issue.issue_cycle.cycle : null,
        module: issue.issue_module ? issue.issue_module.module : null,
      });
    },
    [setEditIssueModal, setIssueToEdit]
  );

  const handleDeleteIssue = useCallback(
    (issue: IIssue) => {
      setDeleteIssueModal(true);
      setIssueToDelete(issue);
    },
    [setDeleteIssueModal, setIssueToDelete]
  );

  const handleIssueAction = useCallback(
    (issue: IIssue, action: "copy" | "edit" | "delete" | "updateDraft") => {
      if (action === "copy") makeIssueCopy(issue);
      else if (action === "edit") handleEditIssue(issue);
      else if (action === "delete") handleDeleteIssue(issue);
    },
    [makeIssueCopy, handleEditIssue, handleDeleteIssue]
  );

  const nullFilters =
    filters.filters &&
    Object.keys(filters.filters).filter(
      (key) =>
        filters.filters[key as keyof IWorkspaceIssueFilterOptions] === null ||
        (filters.filters[key as keyof IWorkspaceIssueFilterOptions]?.length ?? 0) <= 0
    );

  const areFiltersApplied =
    filters.filters &&
    Object.keys(filters.filters).length > 0 &&
    nullFilters.length !== Object.keys(filters.filters).length;

  const isNotAllowed = isGuest || isViewer;
  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
        handleClose={() => setCreateIssueModal(false)}
        prePopulateData={{
          ...preloadedData,
        }}
        onSubmit={async () => mutateViewIssues()}
      />
      <CreateUpdateIssueModal
        isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
        handleClose={() => setEditIssueModal(false)}
        data={issueToEdit}
        onSubmit={async () => mutateViewIssues()}
      />
      <DeleteIssueModal
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueToDelete}
        user={user}
        onSubmit={async () => mutateViewIssues()}
      />
      <CreateUpdateWorkspaceViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        preLoadedData={createViewModal}
      />
      <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
        <div className="h-full w-full border-b border-custom-border-300">
          <WorkspaceViewsNavigation handleAddView={() => setCreateViewModal(true)} />
          {false ? (
            <EmptyState
              image={emptyView}
              title={store.locale.localized("View does not exist")}
              description={store.locale.localized(
                "The view you are looking for does not exist or has been deleted."
              )}
              primaryButton={{
                text: store.locale.localized("View other views"),
                onClick: () => router.push(`/${workspaceSlug}/workspace-views`),
              }}
            />
          ) : (
            <div className="h-full w-full flex flex-col">
              {areFiltersApplied && (
                <>
                  <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
                    <WorkspaceFiltersList
                      filters={filters.filters}
                      setFilters={(updatedFilter) => handleFilters("filters", updatedFilter)}
                      labels={workspaceLabels}
                      members={workspaceMembers?.map((m) => m.member)}
                      stateGroup={STATE_GROUP}
                      project={joinedProjects}
                      clearAllFilters={() =>
                        handleFilters("filters", {
                          assignees: null,
                          created_by: null,
                          labels: null,
                          priority: null,
                          state_group: null,
                          start_date: null,
                          target_date: null,
                          subscriber: null,
                          project: null,
                        })
                      }
                    />
                    <PrimaryButton
                      onClick={() => {
                        if (globalViewId) {
                          handleFilters("filters", filters.filters, true);
                          setToastAlert({
                            title: store.locale.localized("View updated"),
                            message: store.locale.localized("Your view has been updated"),
                            type: "success",
                          });
                        } else
                          setCreateViewModal({
                            query: filters.filters,
                          });
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {!globalViewId && <PlusIcon className="h-4 w-4" />}
                      {globalViewId
                        ? store.locale.localized("Update view")
                        : store.locale.localized("Save view")}
                    </PrimaryButton>
                  </div>
                  {<div className="mt-3 border-t border-custom-border-200" />}
                </>
              )}
              <SpreadsheetView
                spreadsheetIssues={viewIssues}
                mutateIssues={mutateViewIssues}
                handleIssueAction={handleIssueAction}
                disableUserActions={isNotAllowed ?? false}
                user={user}
                userAuth={memberRole}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
