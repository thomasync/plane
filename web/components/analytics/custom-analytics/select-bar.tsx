// react-hook-form
import { Control, Controller, UseFormSetValue } from "react-hook-form";
// components
import { SelectProject, SelectSegment, SelectXAxis, SelectYAxis } from "components/analytics";
// types
import { IAnalyticsParams, IProject } from "types";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  projects: IProject[];
  params: IAnalyticsParams;
  fullScreen: boolean;
  isProjectLevel: boolean;
};

export const AnalyticsSelectBar: React.FC<Props> = ({
  control,
  setValue,
  projects,
  params,
  fullScreen,
  isProjectLevel,
}) => {
  const store: RootStore = useMobxStore();
  return (
    <div
      className={`grid items-center gap-4 px-5 py-2.5 ${
        isProjectLevel ? "grid-cols-3" : "grid-cols-2"
      } ${fullScreen ? "lg:grid-cols-4 md:py-5" : ""}`}
    >
      {!isProjectLevel && (
        <div>
          <h6 className="text-xs text-custom-text-200">{store.locale.localized("Project")}</h6>
          <Controller
            name="project"
            control={control}
            render={({ field: { value, onChange } }) => (
              <SelectProject value={value} onChange={onChange} projects={projects} />
            )}
          />
        </div>
      )}
      <div>
        <h6 className="text-xs text-custom-text-200">
          {store.locale.localized("Measure (y-axis)")}
        </h6>
        <Controller
          name="y_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectYAxis value={value} onChange={onChange} />
          )}
        />
      </div>
      <div>
        <h6 className="text-xs text-custom-text-200">
          {store.locale.localized("Dimension (x-axis)")}
        </h6>
        <Controller
          name="x_axis"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectXAxis
              value={value}
              onChange={(val: string) => {
                if (params.segment === val) setValue("segment", null);

                onChange(val);
              }}
            />
          )}
        />
      </div>
      <div>
        <h6 className="text-xs text-custom-text-200">{store.locale.localized("Group")}</h6>
        <Controller
          name="segment"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectSegment value={value} onChange={onChange} params={params} />
          )}
        />
      </div>
    </div>
  );
};
