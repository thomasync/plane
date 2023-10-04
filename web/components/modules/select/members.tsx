import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectServices from "services/project.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  value: string[];
  onChange: () => void;
};

export const ModuleMembersSelect: React.FC<Props> = ({ value, onChange }) => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );
  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={false} />
              <span className="text-custom-text-200">
                {value.length} {store.locale.localized("Assignees")}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-custom-text-200" />
              <span className="text-custom-text-200">{store.locale.localized("Assignee")}</span>
            </div>
          )}
        </div>
      }
      options={options}
      onChange={onChange}
      maxHeight="md"
      multiple
      noChevron
    />
  );
};
