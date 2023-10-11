import { useState } from "react";

import { useRouter } from "next/router";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";
// components
import { CreateUpdateDraftIssueModal } from "components/issues";
import { BoardHeader, SingleBoardIssue, BoardInlineCreateIssueForm } from "components/core";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, IState, UserAuth } from "types";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  addIssueToGroup: () => void;
  currentState?: IState | null;
  disableUserActions: boolean;
  disableAddIssueOption?: boolean;
  dragDisabled: boolean;
  groupTitle: string;
  handleIssueAction: (issue: IIssue, action: "copy" | "delete" | "edit") => void;
  handleDraftIssueAction?: (issue: IIssue, action: "edit" | "delete") => void;
  handleTrashBox: (isDragging: boolean) => void;
  openIssuesListModal?: (() => void) | null;
  handleMyIssueOpen?: (issue: IIssue) => void;
  removeIssue: ((bridgeId: string, issueId: string) => void) | null;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleBoard: React.FC<Props> = (props) => {
  const {
    addIssueToGroup,
    currentState,
    groupTitle,
    disableUserActions,
    disableAddIssueOption = false,
    dragDisabled,
    handleIssueAction,
    handleDraftIssueAction,
    handleTrashBox,
    openIssuesListModal,
    handleMyIssueOpen,
    removeIssue,
    user,
    userAuth,
    viewProps,
  } = props;

  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [isInlineCreateIssueFormOpen, setIsInlineCreateIssueFormOpen] = useState(false);
  const [isCreateDraftIssueModalOpen, setIsCreateDraftIssueModalOpen] = useState(false);

  const { displayFilters, groupedIssues } = viewProps;

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  const isMyIssuesPage = router.pathname.split("/")[3] === "my-issues";
  const isProfileIssuesPage = router.pathname.split("/")[2] === "profile";
  const isDraftIssuesPage = router.pathname.split("/")[4] === "draft-issues";

  const type = cycleId ? "cycle" : moduleId ? "module" : "issue";

  // Check if it has at least 4 tickets since it is enough to accommodate the Calendar height
  const issuesLength = groupedIssues?.[groupTitle].length;
  const hasMinimumNumberOfCards = issuesLength ? issuesLength >= 4 : false;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disableUserActions;

  const scrollToBottom = () => {
    const boardListElement = document.getElementById(`board-list-${groupTitle}`);

    // timeout is needed because the animation
    // takes time to complete & we can scroll only after that
    const timeoutId = setTimeout(() => {
      if (boardListElement)
        boardListElement.scrollBy({
          top: boardListElement.scrollHeight,
          left: 0,
          behavior: "smooth",
        });
      clearTimeout(timeoutId);
    }, 10);
  };

  const onCreateClick = () => {
    setIsInlineCreateIssueFormOpen(true);
    scrollToBottom();
  };

  const handleAddIssueToGroup = () => {
    if (isDraftIssuesPage) setIsCreateDraftIssueModalOpen(true);
    else if (isMyIssuesPage || isProfileIssuesPage) addIssueToGroup();
    else onCreateClick();
  };

  return (
    <div className={`flex-shrink-0 ${!isCollapsed ? "" : "flex h-full flex-col w-96"}`}>
      <CreateUpdateDraftIssueModal
        isOpen={isCreateDraftIssueModalOpen}
        handleClose={() => setIsCreateDraftIssueModalOpen(false)}
        prePopulateData={{
          ...(cycleId && { cycle: cycleId.toString() }),
          ...(moduleId && { module: moduleId.toString() }),
          [displayFilters?.group_by! === "labels" ? "labels_list" : displayFilters?.group_by!]:
            displayFilters?.group_by === "labels" ? [groupTitle] : groupTitle,
        }}
      />

      <BoardHeader
        addIssueToGroup={handleAddIssueToGroup}
        currentState={currentState}
        groupTitle={groupTitle}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        disableUserActions={disableUserActions}
        disableAddIssue={disableAddIssueOption}
        viewProps={viewProps}
      />
      {isCollapsed && (
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`relative h-full ${
                displayFilters?.order_by !== "sort_order" && snapshot.isDraggingOver
                  ? "bg-custom-background-100/20"
                  : ""
              } ${!isCollapsed ? "hidden" : "flex flex-col"}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {displayFilters?.order_by !== "sort_order" && (
                <>
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-0 left-0 z-[99] h-full w-full bg-custom-background-90 opacity-50`}
                  />
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-1/2 left-1/2 z-[99] -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-custom-background-100 p-2 text-xs`}
                  >
                    This board is ordered by{" "}
                    {replaceUnderscoreIfSnakeCase(
                      displayFilters?.order_by
                        ? displayFilters?.order_by[0] === "-"
                          ? displayFilters?.order_by.slice(1)
                          : displayFilters?.order_by
                        : "created_at"
                    )}
                  </div>
                </>
              )}
              <div
                id={`board-list-${groupTitle}`}
                className={`pt-3 ${
                  hasMinimumNumberOfCards ? "overflow-hidden overflow-y-scroll" : ""
                } `}
              >
                {groupedIssues?.[groupTitle].map((issue, index) => (
                  <Draggable
                    key={issue.id}
                    draggableId={issue.id}
                    index={index}
                    isDragDisabled={isNotAllowed || dragDisabled}
                  >
                    {(provided, snapshot) => (
                      <SingleBoardIssue
                        key={index}
                        provided={provided}
                        snapshot={snapshot}
                        type={type}
                        index={index}
                        issue={issue}
                        projectId={issue.project_detail.id}
                        groupTitle={groupTitle}
                        editIssue={() => handleIssueAction(issue, "edit")}
                        makeIssueCopy={() => handleIssueAction(issue, "copy")}
                        handleDeleteIssue={() => handleIssueAction(issue, "delete")}
                        handleDraftIssueEdit={
                          handleDraftIssueAction
                            ? () => handleDraftIssueAction(issue, "edit")
                            : undefined
                        }
                        handleDraftIssueDelete={() =>
                          handleDraftIssueAction
                            ? handleDraftIssueAction(issue, "delete")
                            : undefined
                        }
                        handleTrashBox={handleTrashBox}
                        handleMyIssueOpen={handleMyIssueOpen}
                        removeIssue={() => {
                          if (removeIssue && issue.bridge_id)
                            removeIssue(issue.bridge_id, issue.id);
                        }}
                        disableUserActions={disableUserActions}
                        user={user}
                        userAuth={userAuth}
                        viewProps={viewProps}
                      />
                    )}
                  </Draggable>
                ))}
                <span
                  style={{
                    display: displayFilters?.order_by === "sort_order" ? "inline" : "none",
                  }}
                >
                  <>{provided.placeholder}</>
                </span>

                <BoardInlineCreateIssueForm
                  isOpen={isInlineCreateIssueFormOpen}
                  handleClose={() => setIsInlineCreateIssueFormOpen(false)}
                  onSuccess={() => scrollToBottom()}
                  prePopulatedData={{
                    ...(cycleId && { cycle: cycleId.toString() }),
                    ...(moduleId && { module: moduleId.toString() }),
                    [displayFilters?.group_by! === "labels"
                      ? "labels_list"
                      : displayFilters?.group_by!]:
                      displayFilters?.group_by === "labels" ? [groupTitle] : groupTitle,
                  }}
                />
              </div>
              {displayFilters?.group_by !== "created_by" && (
                <div>
                  {type === "issue"
                    ? !disableAddIssueOption &&
                      !isDraftIssuesPage && (
                        <button
                          type="button"
                          className="flex items-center gap-2 font-medium text-custom-primary outline-none p-1"
                          onClick={() => {
                            if (isMyIssuesPage || isProfileIssuesPage) addIssueToGroup();
                            else onCreateClick();
                          }}
                        >
                          <PlusIcon className="h-4 w-4" />
                          {store.locale.localized("Add Issue")}
                        </button>
                      )
                    : !disableUserActions &&
                      !isDraftIssuesPage && (
                        <CustomMenu
                          customButton={
                            <button
                              type="button"
                              className="flex items-center gap-2 font-medium text-custom-primary outline-none whitespace-nowrap"
                            >
                              <PlusIcon className="h-4 w-4" />
                              {store.locale.localized("Add Issue")}
                            </button>
                          }
                          position="left"
                          noBorder
                        >
                          <CustomMenu.MenuItem
                            onClick={() => {
                              if (isDraftIssuesPage) setIsCreateDraftIssueModalOpen(true);
                              else if (isMyIssuesPage || isProfileIssuesPage) addIssueToGroup();
                              else onCreateClick();
                            }}
                          >
                            {store.locale.localized("Create new")}
                          </CustomMenu.MenuItem>
                          {openIssuesListModal && (
                            <CustomMenu.MenuItem onClick={openIssuesListModal}>
                              {store.locale.localized("Add an existing issue")}
                            </CustomMenu.MenuItem>
                          )}
                        </CustomMenu>
                      )}
                </div>
              )}
            </div>
          )}
        </StrictModeDroppable>
      )}
    </div>
  );
};
