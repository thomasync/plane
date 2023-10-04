import React from "react";

import { useRouter } from "next/router";

// components
import { PrioritySelect } from "components/project";
// services
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IIssue, Properties, TIssuePriorities } from "types";

type Props = {
  issue: IIssue;
  projectId: string;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  properties: Properties;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const PriorityColumn: React.FC<Props> = ({
  issue,
  projectId,
  partialUpdateIssue,
  properties,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();

  const { workspaceSlug } = router.query;

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

  return (
    <div className="flex items-center text-sm h-11 w-full bg-custom-background-100">
      <span className="flex items-center px-4 py-2.5 h-full w-full flex-shrink-0 border-r border-b border-custom-border-100">
        {properties.priority && (
          <PrioritySelect
            value={issue.priority}
            onChange={handlePriorityChange}
            buttonClassName="!p-0 !rounded-none !shadow-none !border-0"
            hideDropdownArrow
            disabled={isNotAllowed}
          />
        )}
      </span>
    </div>
  );
};
