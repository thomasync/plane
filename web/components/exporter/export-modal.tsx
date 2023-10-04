import React, { useState } from "react";

import { useRouter } from "next/router";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import CSVIntegrationService from "services/integration/csv.services";
// hooks
import useToast from "hooks/use-toast";
// ui
import { SecondaryButton, PrimaryButton, CustomSearchSelect } from "components/ui";
// types
import { ICurrentUserResponse, IImporterService } from "types";
// fetch-keys
import useProjects from "hooks/use-projects";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: ICurrentUserResponse | undefined;
  provider: string | string[];
  mutateServices: () => void;
};

export const Exporter: React.FC<Props> = ({
  isOpen,
  handleClose,
  user,
  provider,
  mutateServices,
}) => {
  const [exportLoading, setExportLoading] = useState(false);
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { projects } = useProjects();
  const { setToastAlert } = useToast();

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

  const [value, setValue] = React.useState<string[]>([]);
  const [multiple, setMultiple] = React.useState<boolean>(false);
  const onChange = (val: any) => {
    setValue(val);
  };
  const ExportCSVToMail = async () => {
    setExportLoading(true);
    if (workspaceSlug && user && typeof provider === "string") {
      const payload = {
        provider: provider,
        project: value,
        multiple: multiple,
      };
      await CSVIntegrationService.exportCSVService(workspaceSlug as string, payload, user)
        .then(() => {
          mutateServices();
          router.push(`/${workspaceSlug}/settings/exports`);
          setExportLoading(false);
          setToastAlert({
            type: "success",
            title: store.locale.localized("Export Successful"),
            message: `${store.locale.localized("You will be able to download the exported")} ${
              provider === "csv"
                ? "CSV"
                : provider === "xlsx"
                ? "Excel"
                : provider === "json"
                ? "JSON"
                : ""
            } ${store.locale.localized("from the previous export")}.`,
          });
        })
        .catch(() => {
          setExportLoading(false);
          setToastAlert({
            type: "error",
            title: store.locale.localized("Error!"),
            message: store.locale.localized("Export was unsuccessful. Please try again."),
          });
        });
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 gap-y-4 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">
                        {store.locale.localized("Export to")}{" "}
                        {provider === "csv"
                          ? "CSV"
                          : provider === "xlsx"
                          ? "Excel"
                          : provider === "json"
                          ? "JSON"
                          : ""}
                      </h3>
                    </span>
                  </div>
                  <div>
                    <CustomSearchSelect
                      value={value ?? []}
                      onChange={(val: string[]) => onChange(val)}
                      options={options}
                      input={true}
                      label={
                        value && value.length > 0
                          ? projects &&
                            projects
                              .filter((p) => value.includes(p.id))
                              .map((p) => p.identifier)
                              .join(", ")
                          : store.locale.localized("All projects")
                      }
                      optionsClassName="min-w-full"
                      multiple
                    />
                  </div>
                  <div
                    onClick={() => setMultiple(!multiple)}
                    className="flex items-center gap-2 max-w-min cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={multiple}
                      onChange={() => setMultiple(!multiple)}
                    />
                    <div className="text-sm whitespace-nowrap">
                      {store.locale.localized("Export the data into separate files")}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={ExportCSVToMail}
                      disabled={exportLoading}
                      loading={exportLoading}
                    >
                      {exportLoading ? store.locale.localized("Exporting...") : "Export"}
                    </PrimaryButton>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
