// types
import { IUserStateDistribution } from "types";
// constants
import { STATE_GROUP_COLORS } from "constants/state";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { GROUP_CHOICES } from "constants/project";

type Props = {
  stateDistribution: IUserStateDistribution[];
};

export const ProfileWorkload: React.FC<Props> = ({ stateDistribution }) => {
  const store: RootStore = useMobxStore();

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{store.locale.localized("Workload")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 justify-stretch">
        {stateDistribution.map((group) => (
          <div key={group.state_group}>
            <a className="flex gap-2 p-4 rounded border border-custom-border-100 whitespace-nowrap">
              <div
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: STATE_GROUP_COLORS[group.state_group],
                }}
              />
              <div className="space-y-1 -mt-1">
                <p className="text-custom-text-400 text-sm capitalize">
                  {GROUP_CHOICES[group.state_group] ?? group.state_group}
                </p>
                <p className="text-xl font-semibold">{group.state_count}</p>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
