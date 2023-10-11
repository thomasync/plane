// ui
import { CustomSearchSelect } from "components/ui";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// types
import { IProject } from "types";

type Props = {
  value: string[] | null | undefined;
  onChange: (val: string[] | null) => void;
  projects: IProject[];
};

export const SelectProject: React.FC<Props> = ({ value, onChange, projects }) => {
  const store: RootStore = useMobxStore();
  const options = projects?.map((project) => ({
    value: project.id,
    query: project.name + project.identifier,
    content: (
      <div className="flex items-center gap-2">
        <span className="text-custom-text-200 text-[0.65rem]">{project.identifier}</span>
        {project.name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value ?? []}
      onChange={(val: string[]) => onChange(val)}
      options={options}
      label={
        value && value.length > 0
          ? projects
              .filter((p) => value.includes(p.id))
              .map((p) => p.identifier)
              .join(", ")
          : store.locale.localized("All projects")
      }
      optionsClassName="min-w-full"
      multiple
    />
  );
};
