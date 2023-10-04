// mobx
import { observer } from "mobx-react-lite";
// headless ui
import { Disclosure } from "@headlessui/react";
import { StateGroupIcon } from "components/icons";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import {
  SidebarAssigneeSelect,
  SidebarEstimateSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
  TPeekOverviewModes,
} from "components/issues";
// ui
import { CustomDatePicker, Icon } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue, TIssuePriorities } from "types";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  handleDeleteIssue: () => void;
  handleUpdateIssue: (formData: Partial<IIssue>) => Promise<void>;
  issue: IIssue;
  mode: TPeekOverviewModes;
  readOnly: boolean;
  workspaceSlug: string;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({
  handleDeleteIssue,
  handleUpdateIssue,
  issue,
  mode,
  readOnly,
  workspaceSlug,
}) => {
  const store: RootStore = useMobxStore();
  const { setToastAlert } = useToast();

  const startDate = issue.start_date;
  const targetDate = issue.target_date;

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToastAlert({
        type: "success",
        title: store.locale.localized("Link copied!"),
        message: store.locale.localized("Issue link copied to clipboard"),
      });
    });
  };

  return (
    <div className={mode === "full" ? "divide-y divide-custom-border-200" : ""}>
      {mode === "full" && (
        <div className="flex justify-between gap-2 pb-3">
          <h6 className="flex items-center gap-2 font-medium">
            <StateGroupIcon
              stateGroup={issue.state_detail.group}
              color={issue.state_detail.color}
            />
            {issue.project_detail.identifier}-{issue.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
            </button>
            <button type="button" onClick={handleDeleteIssue}>
              <Icon iconName="delete" />
            </button>
          </div>
        </div>
      )}
      <div className={`space-y-4 ${mode === "full" ? "pt-3" : ""}`}>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="radio_button_checked" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">State</span>
          </div>
          <div className="w-3/4">
            <SidebarStateSelect
              value={issue.state}
              onChange={(val: string) => handleUpdateIssue({ state: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="group" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">{store.locale.localized("Assignees")}</span>
          </div>
          <div className="w-3/4">
            <SidebarAssigneeSelect
              value={issue.assignees}
              onChange={(val: string[]) => handleUpdateIssue({ assignees_list: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="signal_cellular_alt" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">{store.locale.localized("Priority")}</span>
          </div>
          <div className="w-3/4">
            <SidebarPrioritySelect
              value={issue.priority}
              onChange={(val) => handleUpdateIssue({ priority: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">{store.locale.localized("Start date")}</span>
          </div>
          <div>
            <CustomDatePicker
              placeholder={store.locale.localized("Select start date")}
              value={issue.start_date}
              onChange={(val) =>
                handleUpdateIssue({
                  start_date: val,
                })
              }
              className="bg-custom-background-80 border-none"
              maxDate={maxDate ?? undefined}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">{store.locale.localized("Due date")}</span>
          </div>
          <div>
            <CustomDatePicker
              placeholder={store.locale.localized("Select due date")}
              value={issue.target_date}
              onChange={(val) =>
                handleUpdateIssue({
                  target_date: val,
                })
              }
              className="bg-custom-background-80 border-none"
              minDate={minDate ?? undefined}
              disabled={readOnly}
            />
          </div>
        </div>
        {/* <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="change_history" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Estimate</span>
          </div>
          <div className="w-3/4">
            <SidebarEstimateSelect
              value={issue.estimate_point}
              onChange={(val: number | null) =>handleUpdateIssue({ estimate_point: val })}
              disabled={readOnly}
            />
          </div>
        </div> */}
        {/* <Disclosure as="div">
          {({ open }) => (
            <>
              <Disclosure.Button
                as="button"
                type="button"
                className="flex items-center gap-1 text-sm text-custom-text-200"
              >
                Show {open ? "Less" : "More"}
                <Icon iconName={open ? "expand_less" : "expand_more"} className="!text-base" />
              </Disclosure.Button>
              <Disclosure.Panel as="div" className="mt-4 space-y-4">
                Disclosure Panel
              </Disclosure.Panel>
            </>
          )}
        </Disclosure> */}
      </div>
    </div>
  );
};
