import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hook
import useProjects from "hooks/use-projects";
import useWorkspaceMembers from "hooks/use-workspace-members";
// services
import issuesService from "services/issues.service";
// components
import { DateFilterModal } from "components/core";
// ui
import { Avatar, MultiLevelDropdown } from "components/ui";
// icons
import { PriorityIcon, StateGroupIcon } from "components/icons";
// helpers
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { IWorkspaceIssueFilterOptions, TStateGroups } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES, PRIORITIES } from "constants/project";
import { DATE_FILTER_OPTIONS } from "constants/filters";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  filters: Partial<IWorkspaceIssueFilterOptions>;
  onSelect: (option: any) => void;
  direction?: "left" | "right";
  height?: "sm" | "md" | "rg" | "lg";
};

export const GlobalSelectFilters: React.FC<Props> = ({
  filters,
  onSelect,
  direction = "right",
  height = "md",
}) => {
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  const [dateFilterType, setDateFilterType] = useState<{
    title: string;
    type: "start_date" | "target_date";
  }>({
    title: "",
    type: "start_date",
  });

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { workspaceMembers } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  const { data: workspaceLabels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  const { projects: allProjects } = useProjects();
  const joinedProjects = allProjects?.filter((p) => p.is_member);

  const workspaceFilterOption = [
    {
      id: "project",
      label: store.locale.localized("Project"),
      value: joinedProjects,
      hasChildren: true,
      children: joinedProjects?.map((project) => ({
        id: project.id,
        label: <div className="flex items-center gap-2">{project.name}</div>,
        value: {
          key: "project",
          value: project.id,
        },
        selected: filters?.project?.includes(project.id),
      })),
    },
    {
      id: "state_group",
      label: store.locale.localized("State groups"),
      value: GROUP_CHOICES,
      hasChildren: true,
      children: [
        ...Object.keys(GROUP_CHOICES).map((key) => ({
          id: key,
          label: (
            <div className="flex items-center gap-2">
              <StateGroupIcon stateGroup={key as TStateGroups} />
              {GROUP_CHOICES[key as keyof typeof GROUP_CHOICES]}
            </div>
          ),
          value: {
            key: "state_group",
            value: key,
          },
          selected: filters?.state_group?.includes(key),
        })),
      ],
    },
    {
      id: "labels",
      label: store.locale.localized("Labels"),
      value: workspaceLabels,
      hasChildren: true,
      children: workspaceLabels?.map((label) => ({
        id: label.id,
        label: (
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: label.color && label.color !== "" ? label.color : "#000000",
              }}
            />
            {label.name}
          </div>
        ),
        value: {
          key: "labels",
          value: label.id,
        },
        selected: filters?.labels?.includes(label.id),
      })),
    },
    {
      id: "priority",
      label: store.locale.localized("Priority"),
      value: PRIORITIES,
      hasChildren: true,
      children: PRIORITIES.map((priority) => ({
        id: priority === null ? "null" : priority,
        label: (
          <div className="flex items-center gap-2 capitalize">
            <PriorityIcon priority={priority} />
            {priority ?? "None"}
          </div>
        ),
        value: {
          key: "priority",
          value: priority === null ? "null" : priority,
        },
        selected: filters?.priority?.includes(priority === null ? "null" : priority),
      })),
    },
    {
      id: "created_by",
      label: store.locale.localized("Created by"),
      value: workspaceMembers,
      hasChildren: true,
      children: workspaceMembers?.map((member) => ({
        id: member.member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar user={member.member} />
            {member.member.display_name}
          </div>
        ),
        value: {
          key: "created_by",
          value: member.member.id,
        },
        selected: filters?.created_by?.includes(member.member.id),
      })),
    },
    {
      id: "assignees",
      label: store.locale.localized("Assignees"),
      value: workspaceMembers,
      hasChildren: true,
      children: workspaceMembers?.map((member) => ({
        id: member.member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar user={member.member} />
            {member.member.display_name}
          </div>
        ),
        value: {
          key: "assignees",
          value: member.member.id,
        },
        selected: filters?.assignees?.includes(member.member.id),
      })),
    },
    {
      id: "subscriber",
      label: store.locale.localized("Subscriber"),
      value: workspaceMembers,
      hasChildren: true,
      children: workspaceMembers?.map((member) => ({
        id: member.member.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar user={member.member} />
            {member.member.display_name}
          </div>
        ),
        value: {
          key: "subscriber",
          value: member.member.id,
        },
        selected: filters?.subscriber?.includes(member.member.id),
      })),
    },
    {
      id: "start_date",
      label: store.locale.localized("Start date"),
      value: DATE_FILTER_OPTIONS,
      hasChildren: true,
      children: [
        ...DATE_FILTER_OPTIONS.map((option) => ({
          id: option.name,
          label: option.name,
          value: {
            key: "start_date",
            value: option.value,
          },
          selected: checkIfArraysHaveSameElements(filters?.start_date ?? [], option.value),
        })),
        {
          id: "custom",
          label: store.locale.localized("Custom"),
          value: "custom",
          element: (
            <button
              onClick={() => {
                setIsDateFilterModalOpen(true);
                setDateFilterType({
                  title: store.locale.localized("Start date"),
                  type: "start_date",
                });
              }}
              className="w-full rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
            >
              {store.locale.localized("Custom")}
            </button>
          ),
        },
      ],
    },
    {
      id: "target_date",
      label: store.locale.localized("Due date"),
      value: DATE_FILTER_OPTIONS,
      hasChildren: true,
      children: [
        ...DATE_FILTER_OPTIONS.map((option) => ({
          id: option.name,
          label: option.name,
          value: {
            key: "target_date",
            value: option.value,
          },
          selected: checkIfArraysHaveSameElements(filters?.target_date ?? [], option.value),
        })),
        {
          id: "custom",
          label: store.locale.localized("Custom"),
          value: "custom",
          element: (
            <button
              onClick={() => {
                setIsDateFilterModalOpen(true);
                setDateFilterType({
                  title: store.locale.localized("Due date"),
                  type: "target_date",
                });
              }}
              className="w-full rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80"
            >
              {store.locale.localized("Custom")}
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          title={dateFilterType.title}
          field={dateFilterType.type}
          filters={filters as IWorkspaceIssueFilterOptions}
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={onSelect}
        />
      )}
      <MultiLevelDropdown
        label={store.locale.localized("Filters")}
        onSelect={onSelect}
        direction={direction}
        height={height}
        options={workspaceFilterOption}
      />
    </>
  );
};
