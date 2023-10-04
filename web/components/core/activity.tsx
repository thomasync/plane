import { useRouter } from "next/router";

import useSWR from "swr";

// hook
import useEstimateOption from "hooks/use-estimate-option";
// services
import issuesService from "services/issues.service";
// icons
import { Icon, Tooltip } from "components/ui";
import {
  TagIcon,
  CopyPlus,
  Calendar,
  Link2Icon,
  RocketIcon,
  Users2Icon,
  ArchiveIcon,
  PaperclipIcon,
  ContrastIcon,
  TriangleIcon,
  LayoutGridIcon,
  SignalMediumIcon,
  MessageSquareIcon,
} from "lucide-react";
import {
  BlockedIcon,
  BlockerIcon,
  RelatedIcon,
  StackedLayersHorizontalIcon,
} from "components/icons";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
import { capitalizeFirstLetter } from "helpers/string.helper";
// types
import { IIssueActivity } from "types";
// fetch-keys
import { WORKSPACE_LABELS } from "constants/fetch-keys";
import { localized } from "helpers/localization.helper";

const IssueLink = ({ activity }: { activity: IIssueActivity }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Tooltip
      tooltipContent={
        activity.issue_detail
          ? activity.issue_detail.name
          : localized("This issue has been deleted")
      }
    >
      <a
        href={`/${workspaceSlug}/projects/${activity.project}/issues/${activity.issue}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
      >
        {activity.issue_detail
          ? `${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}`
          : localized("Issue")}
        <RocketIcon size={12} color="#6b7280" />
      </a>
    </Tooltip>
  );
};

const UserLink = ({ activity }: { activity: IIssueActivity }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <a
      href={`/${workspaceSlug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-custom-text-100 inline-flex items-center hover:underline"
    >
      {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
    </a>
  );
};

const LabelPill = ({ labelId }: { labelId: string }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: labels } = useSWR(
    workspaceSlug ? WORKSPACE_LABELS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => issuesService.getWorkspaceLabels(workspaceSlug.toString()) : null
  );

  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{
        backgroundColor: labels?.find((l) => l.id === labelId)?.color ?? "#000000",
      }}
      aria-hidden="true"
    />
  );
};
const EstimatePoint = ({ point }: { point: string }) => {
  const { estimateValue, isEstimateActive } = useEstimateOption(Number(point));
  const currentPoint = Number(point) + 1;

  return (
    <span className="font-medium text-custom-text-100">
      {isEstimateActive
        ? estimateValue
        : `${currentPoint} ${currentPoint > 1 ? localized("points") : localized("point")}`}
    </span>
  );
};

const activityDetails: {
  [key: string]: {
    message: (
      activity: IIssueActivity,
      showIssue: boolean,
      workspaceSlug: string
    ) => React.ReactNode;
    icon: React.ReactNode;
  };
} = {
  assignees: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("added a new assignee")} <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                {localized("to")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("removed the assignee")} <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Users2Icon size={12} color="#6b7280" aria-hidden="true" />,
  },
  archived_at: {
    message: (activity) => {
      if (activity.new_value === "restore") return localized("restored the issue.");
      else return localized("archived the issue.");
    },
    icon: <ArchiveIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  attachment: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            {localized("uploaded a new")}{" "}
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {localized("attachment")}
              <RocketIcon size={12} color="#6b7280" />
            </a>
            {showIssue && (
              <>
                {" "}
                {localized("to")} <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            {localized("removed an attachment")}
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <PaperclipIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  blocking: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("marked this issue is blocking issue")}{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            {localized("removed the blocking issue")}{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockerIcon height="12" width="12" color="#6b7280" />,
  },
  blocked_by: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("marked this issue is being blocked by")}{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            {localized("removed this issue being blocked by issue")}{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockedIcon height="12" width="12" color="#6b7280" />,
  },
  duplicate: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("marked this issue as duplicate of")}{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            {localized("removed this issue as a duplicate of")}{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <CopyPlus size={12} color="#6b7280" />,
  },
  relates_to: {
    message: (activity) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("marked that this issue relates to")}{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            {localized("removed the relation from")}{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>.
          </>
        );
    },
    icon: <RelatedIcon height="12" width="12" color="#6b7280" />,
  },
  cycles: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            {localized("added this issue to the cycle")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            {localized("set the cycle to")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
      else
        return (
          <>
            {localized("removed the issue from the cycle")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.old_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
    },
    icon: <ContrastIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  description: {
    message: (activity, showIssue) => (
      <>
        {localized("updated the description")}
        {showIssue && (
          <>
            {" "}
            {localized("of")} <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <MessageSquareIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  estimate_point: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            {localized("removed the estimate point")}
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("set the estimate point to")} <EstimatePoint point={activity.new_value} />
            {showIssue && (
              <>
                {" "}
                {localized("for")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <TriangleIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  issue: {
    message: (activity) => {
      if (activity.verb === "created") return localized("created the issue.");
      else return localized("deleted an issue.");
    },
    icon: <StackedLayersHorizontalIcon width={12} height={12} color="#6b7280" aria-hidden="true" />,
  },
  labels: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            {localized("added a new label")}{" "}
            <span className="inline-flex items-center gap-2 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <LabelPill labelId={activity.new_identifier ?? ""} />
              <span className="font-medium text-custom-text-100">{activity.new_value}</span>
            </span>
            {showIssue && (
              <>
                {" "}
                {localized("to")} <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            {localized("removed the label")}{" "}
            <span className="inline-flex items-center gap-3 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <LabelPill labelId={activity.old_identifier ?? ""} />
              <span className="font-medium text-custom-text-100">{activity.old_value}</span>
            </span>
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <TagIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  link: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            {localized("added this")}{" "}
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {localized("link")}
              <RocketIcon size={12} color="#6b7280" />
            </a>
            {showIssue && (
              <>
                {" "}
                {localized("to")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            {localized("updated the")}{" "}
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {localized("link")}
              <RocketIcon size={12} color="#6b7280" />
            </a>
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("removed this")}{" "}
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {localized("link")}
              <RocketIcon size={12} color="#6b7280" />
            </a>
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Link2Icon size={12} color="#6b7280" aria-hidden="true" />,
  },
  modules: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            {localized("added this issue to the module")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            {localized("set the module to")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.new_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
      else
        return (
          <>
            {localized("removed the issue from the module")}{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-custom-text-100 inline-flex items-center gap-1 hover:underline"
            >
              {activity.old_value}
              <RocketIcon size={12} color="#6b7280" />
            </a>
          </>
        );
    },
    icon: <Icon iconName="dataset" className="!text-xs !text-[#6b7280]" aria-hidden="true" />,
  },
  name: {
    message: (activity, showIssue) => (
      <>
        {localized("set the name to")} {activity.new_value}
        {showIssue && (
          <>
            {" "}
            {localized("of")} <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <MessageSquareIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  parent: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            {localized("removed the parent")}{" "}
            <span className="font-medium text-custom-text-100">{activity.old_value}</span>
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("set the parent to")}{" "}
            <span className="font-medium text-custom-text-100">{activity.new_value}</span>
            {showIssue && (
              <>
                {" "}
                {localized("for")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: (
      <Icon
        iconName="supervised_user_circle"
        className="!text-xs !text-[#6b7280]"
        aria-hidden="true"
      />
    ),
  },
  priority: {
    message: (activity, showIssue) => (
      <>
        {localized("set the priority to")}{" "}
        <span className="font-medium text-custom-text-100">
          {activity.new_value ? capitalizeFirstLetter(activity.new_value) : localized("None")}
        </span>
        {showIssue && (
          <>
            {" "}
            {localized("for")} <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <SignalMediumIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  start_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            {localized("removed the start date")}
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("set the start date to")}{" "}
            <span className="font-medium text-custom-text-100">
              {renderShortDateWithYearFormat(activity.new_value)}
            </span>
            {showIssue && (
              <>
                {" "}
                {localized("for")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Calendar size={12} color="#6b7280" aria-hidden="true" />,
  },
  state: {
    message: (activity, showIssue) => (
      <>
        {localized("set the state to")}{" "}
        <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showIssue && (
          <>
            {" "}
            {localized("for")} <IssueLink activity={activity} />
          </>
        )}
        .
      </>
    ),
    icon: <LayoutGridIcon size={12} color="#6b7280" aria-hidden="true" />,
  },
  target_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            {localized("removed the due date")}
            {showIssue && (
              <>
                {" "}
                {localized("from")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
      else
        return (
          <>
            {localized("set the due date to")}{" "}
            <span className="font-medium text-custom-text-100">
              {renderShortDateWithYearFormat(activity.new_value)}
            </span>
            {showIssue && (
              <>
                {" "}
                {localized("for")} <IssueLink activity={activity} />
              </>
            )}
            .
          </>
        );
    },
    icon: <Calendar size={12} color="#6b7280" aria-hidden="true" />,
  },
};

export const ActivityIcon = ({ activity }: { activity: IIssueActivity }) => (
  <>{activityDetails[activity.field as keyof typeof activityDetails]?.icon}</>
);

export const ActivityMessage = ({
  activity,
  showIssue = false,
}: {
  activity: IIssueActivity;
  showIssue?: boolean;
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <>
      {activityDetails[activity.field as keyof typeof activityDetails]?.message(
        activity,
        showIssue,
        workspaceSlug?.toString() ?? ""
      )}
    </>
  );
};
