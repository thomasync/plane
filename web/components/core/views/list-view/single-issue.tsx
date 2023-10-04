import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import issuesService from "services/issues.service";
import trackEventServices from "services/track-event.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { ViewDueDateSelect, ViewEstimateSelect, ViewStartDateSelect } from "components/issues";
import { LabelSelect, MembersSelect, PrioritySelect } from "components/project";
import { StateSelect } from "components/states";
// ui
import { Tooltip, CustomMenu, ContextMenu } from "components/ui";
// icons
import {
  ClipboardDocumentCheckIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { handleIssuesMutation } from "constants/issue";
// types
import {
  ICurrentUserResponse,
  IIssue,
  IIssueViewProps,
  IState,
  ISubIssueResponse,
  IUserProfileProjectSegregation,
  TIssuePriorities,
  UserAuth,
} from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  MODULE_DETAILS,
  SUB_ISSUES,
  USER_PROFILE_PROJECT_SEGREGATION,
} from "constants/fetch-keys";

type Props = {
  type?: string;
  issue: IIssue;
  projectId: string;
  groupTitle?: string;
  editIssue: () => void;
  index: number;
  makeIssueCopy: () => void;
  removeIssue?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleDraftIssueSelect?: (issue: IIssue) => void;
  handleDraftIssueDelete?: (issue: IIssue) => void;
  handleMyIssueOpen?: (issue: IIssue) => void;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleListIssue: React.FC<Props> = ({
  type,
  issue,
  projectId,
  editIssue,
  index,
  makeIssueCopy,
  removeIssue,
  groupTitle,
  handleDraftIssueDelete,
  handleDeleteIssue,
  handleMyIssueOpen,
  disableUserActions,
  user,
  userAuth,
  viewProps,
  handleDraftIssueSelect,
}) => {
  // context menu
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<React.MouseEvent | null>(null);

  const router = useRouter();
  const { workspaceSlug, cycleId, moduleId, userId } = router.query;
  const isArchivedIssues = router.pathname.includes("archived-issues");
  const isDraftIssues = router.pathname?.split("/")?.[4] === "draft-issues";

  const { setToastAlert } = useToast();

  const { displayFilters, properties, mutateIssues } = viewProps;

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug || !issue) return;

      if (issue.parent) {
        mutate<ISubIssueResponse>(
          SUB_ISSUES(issue.parent.toString()),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              sub_issues: (prevData.sub_issues ?? []).map((i) => {
                if (i.id === issue.id) {
                  return {
                    ...i,
                    ...formData,
                  };
                }
                return i;
              }),
            };
          },
          false
        );
      } else {
        mutateIssues(
          (prevData: any) =>
            handleIssuesMutation(
              formData,
              groupTitle ?? "",
              displayFilters?.group_by ?? null,
              index,
              displayFilters?.order_by ?? "-created_at",
              prevData
            ),
          false
        );
      }

      issuesService
        .patchIssue(workspaceSlug as string, issue.project, issue.id, formData, user)
        .then(() => {
          mutateIssues();

          if (userId)
            mutate<IUserProfileProjectSegregation>(
              USER_PROFILE_PROJECT_SEGREGATION(workspaceSlug.toString(), userId.toString())
            );

          if (cycleId) mutate(CYCLE_DETAILS(cycleId as string));
          if (moduleId) mutate(MODULE_DETAILS(moduleId as string));
        });
    },
    [
      displayFilters,
      workspaceSlug,
      cycleId,
      moduleId,
      userId,
      groupTitle,
      index,
      mutateIssues,
      user,
    ]
  );

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const handleStateChange = (data: string, states: IState[] | undefined) => {
    const oldState = states?.find((s) => s.id === issue.state);
    const newState = states?.find((s) => s.id === data);

    partialUpdateIssue(
      {
        state: data,
        state_detail: newState,
      },
      issue
    );
    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_STATE",
      user
    );
    if (oldState?.group !== "completed" && newState?.group !== "completed") {
      trackEventServices.trackIssueMarkedAsDoneEvent(
        {
          workspaceSlug: issue.workspace_detail.slug,
          workspaceId: issue.workspace_detail.id,
          projectId: issue.project_detail.id,
          projectIdentifier: issue.project_detail.identifier,
          projectName: issue.project_detail.name,
          issueId: issue.id,
        },
        user
      );
    }
  };

  const handleAssigneeChange = (data: any) => {
    const newData = issue.assignees ?? [];

    if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
    else newData.push(data);

    partialUpdateIssue({ assignees_list: data }, issue);

    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_ASSIGNEE",
      user
    );
  };

  const handleLabelChange = (data: any) => {
    partialUpdateIssue({ labels_list: data }, issue);
  };

  const handlePriorityChange = (data: TIssuePriorities) => {
    partialUpdateIssue({ priority: data }, issue);
    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_PRIORITY",
      user
    );
  };

  const issuePath = isArchivedIssues
    ? `/${workspaceSlug}/projects/${issue.project}/archived-issues/${issue.id}`
    : isDraftIssues
    ? `#`
    : `/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`;

  const openPeekOverview = (issue: IIssue) => {
    const { query } = router;

    if (handleMyIssueOpen) handleMyIssueOpen(issue);
    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssue: issue.id },
    });
  };

  const isNotAllowed =
    userAuth.isGuest || userAuth.isViewer || disableUserActions || isArchivedIssues;

  return (
    <>
      <ContextMenu
        clickEvent={contextMenuPosition}
        title="Quick actions"
        isOpen={contextMenu}
        setIsOpen={setContextMenu}
      >
        {!isNotAllowed && (
          <>
            <ContextMenu.Item
              Icon={PencilIcon}
              onClick={() => {
                if (isDraftIssues && handleDraftIssueSelect) handleDraftIssueSelect(issue);
                else editIssue();
              }}
            >
              Edit issue
            </ContextMenu.Item>
            {!isDraftIssues && (
              <ContextMenu.Item Icon={ClipboardDocumentCheckIcon} onClick={makeIssueCopy}>
                Make a copy...
              </ContextMenu.Item>
            )}
            <ContextMenu.Item
              Icon={TrashIcon}
              onClick={() => {
                if (isDraftIssues && handleDraftIssueDelete) handleDraftIssueDelete(issue);
                else handleDeleteIssue(issue);
              }}
            >
              Delete issue
            </ContextMenu.Item>
          </>
        )}
        {!isDraftIssues && (
          <>
            <ContextMenu.Item Icon={LinkIcon} onClick={handleCopyText}>
              Copy issue link
            </ContextMenu.Item>
            <a href={issuePath} target="_blank" rel="noreferrer noopener">
              <ContextMenu.Item Icon={ArrowTopRightOnSquareIcon}>
                Open issue in new tab
              </ContextMenu.Item>
            </a>
          </>
        )}
      </ContextMenu>

      <div
        className="flex items-center justify-between px-4 py-2.5 gap-10 border-b-[0.5px] border-custom-border-100 bg-custom-background-100 last:border-b-0"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
          setContextMenuPosition(e);
        }}
      >
        <div className="flex-grow cursor-pointer min-w-[200px] whitespace-nowrap overflow-hidden overflow-ellipsis">
          <div className="group relative flex items-center gap-2">
            {properties.key && (
              <Tooltip
                tooltipHeading="Issue ID"
                tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
              >
                <span className="flex-shrink-0 text-xs text-custom-text-200">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              </Tooltip>
            )}
            <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
              <button
                type="button"
                className="truncate text-[0.825rem] text-custom-text-100"
                onClick={() => {
                  if (isArchivedIssues) return router.push(issuePath);
                  if (!isDraftIssues) openPeekOverview(issue);
                  if (isDraftIssues && handleDraftIssueSelect) handleDraftIssueSelect(issue);
                }}
              >
                {issue.name}
              </button>
            </Tooltip>
          </div>
        </div>

        <div
          className={`flex flex-shrink-0 items-center gap-2 text-xs ${
            isArchivedIssues ? "opacity-60" : ""
          }`}
        >
          {properties.priority && (
            <PrioritySelect
              value={issue.priority}
              onChange={handlePriorityChange}
              hideDropdownArrow
              disabled={isNotAllowed}
            />
          )}
          {properties.state && (
            <StateSelect
              value={issue.state_detail}
              projectId={projectId}
              onChange={handleStateChange}
              hideDropdownArrow
              disabled={isNotAllowed}
            />
          )}
          {properties.start_date && issue.start_date && (
            <ViewStartDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.due_date && issue.target_date && (
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.labels && (
            <LabelSelect
              value={issue.labels}
              projectId={projectId}
              onChange={handleLabelChange}
              labelsDetails={issue.label_details}
              hideDropdownArrow
              maxRender={3}
              user={user}
              disabled={isNotAllowed}
            />
          )}
          {properties.assignee && (
            <MembersSelect
              value={issue.assignees}
              projectId={projectId}
              onChange={handleAssigneeChange}
              membersDetails={issue.assignee_details}
              hideDropdownArrow
              disabled={isNotAllowed}
            />
          )}
          {properties.estimate && issue.estimate_point !== null && (
            <ViewEstimateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.sub_issue_count && issue.sub_issues_count > 0 && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <LayerDiagonalIcon className="h-3.5 w-3.5" />
                  {issue.sub_issues_count}
                </div>
              </Tooltip>
            </div>
          )}
          {properties.link && issue.link_count > 0 && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {issue.link_count}
                </div>
              </Tooltip>
            </div>
          )}
          {properties.attachment_count && issue.attachment_count > 0 && (
            <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
                <div className="flex items-center gap-1 text-custom-text-200">
                  <PaperClipIcon className="h-3.5 w-3.5 -rotate-45" />
                  {issue.attachment_count}
                </div>
              </Tooltip>
            </div>
          )}
          {type && !isNotAllowed && (
            <CustomMenu width="auto" ellipsis>
              <CustomMenu.MenuItem
                onClick={() => {
                  if (isDraftIssues && handleDraftIssueSelect) handleDraftIssueSelect(issue);
                  else editIssue();
                }}
              >
                <div className="flex items-center justify-start gap-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit issue</span>
                </div>
              </CustomMenu.MenuItem>
              {type !== "issue" && removeIssue && (
                <CustomMenu.MenuItem onClick={removeIssue}>
                  <div className="flex items-center justify-start gap-2">
                    <XMarkIcon className="h-4 w-4" />
                    <span>Remove from {type}</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
              <CustomMenu.MenuItem
                onClick={() => {
                  if (isDraftIssues && handleDraftIssueDelete) handleDraftIssueDelete(issue);
                  else handleDeleteIssue(issue);
                }}
              >
                <div className="flex items-center justify-start gap-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete issue</span>
                </div>
              </CustomMenu.MenuItem>
              {!isDraftIssues && (
                <CustomMenu.MenuItem onClick={handleCopyText}>
                  <div className="flex items-center justify-start gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Copy issue link</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          )}
        </div>
      </div>
    </>
  );
};
