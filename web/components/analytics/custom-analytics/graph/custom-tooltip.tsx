// nivo
import { BarTooltipProps } from "@nivo/bar";
import { DATE_KEYS } from "constants/analytics";
import { PRIORITIES_LABEL } from "constants/project";
import { STATE_GROUP_LABEL } from "constants/state";
import { renderMonthAndYear } from "helpers/analytics.helper";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// types
import { IAnalyticsParams, IAnalyticsResponse } from "types";

type Props = {
  datum: BarTooltipProps<any>;
  analytics: IAnalyticsResponse;
  params: IAnalyticsParams;
};

export const CustomTooltip: React.FC<Props> = ({ datum, analytics, params }) => {
  const store: RootStore = useMobxStore();
  let tooltipValue: string | number = "";

  const renderAssigneeName = (assigneeId: string): string => {
    const assignee = analytics.extras.assignee_details.find((a) => a.assignees__id === assigneeId);

    if (!assignee) return store.locale.localized("No assignee");

    return assignee.assignees__display_name || store.locale.localized("No assignee");
  };

  if (params.segment) {
    if (DATE_KEYS.includes(params.segment)) tooltipValue = renderMonthAndYear(datum.id);
    else tooltipValue = STATE_GROUP_LABEL[datum.id] || (PRIORITIES_LABEL[datum.id] ?? datum.id);
  } else {
    if (DATE_KEYS.includes(params.x_axis)) tooltipValue = datum.indexValue;
    else
      tooltipValue =
        datum.id === "count"
          ? store.locale.localized("Issue count")
          : store.locale.localized("Estimate");
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-80 p-2 text-xs">
      <span
        className="h-3 w-3 rounded"
        style={{
          backgroundColor: datum.color,
        }}
      />
      <span
        className={`font-medium text-custom-text-200 ${
          params.segment
            ? params.segment === "priority" || params.segment === "state__group"
              ? "capitalize"
              : ""
            : params.x_axis === "priority" || params.x_axis === "state__group"
            ? "capitalize"
            : ""
        }`}
      >
        {params.segment === "assignees__id"
          ? renderAssigneeName(tooltipValue.toString())
          : tooltipValue}
        :
      </span>
      <span>{datum.value}</span>
    </div>
  );
};
