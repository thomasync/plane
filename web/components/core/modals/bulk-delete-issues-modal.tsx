import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { SubmitHandler, useForm } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import issuesServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
// ui
import { DangerButton, SecondaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// types
import { ICurrentUserResponse, IIssue } from "types";
// fetch keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: ICurrentUserResponse | undefined;
};

export const BulkDeleteIssuesModal: React.FC<Props> = ({ isOpen, setIsOpen, user }) => {
  const [query, setQuery] = useState("");
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { setToastAlert } = useToast();
  const { displayFilters, params } = useIssuesView();
  const { params: calendarParams } = useCalendarIssuesView();
  const { order_by, group_by, ...viewGanttParams } = params;

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    defaultValues: {
      delete_issue_ids: [],
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    reset();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!workspaceSlug || !projectId) return;

    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToastAlert({
        type: "error",
        title: store.locale.localized("Error!"),
        message: store.locale.localized("Please select at least one issue."),
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    const calendarFetchKey = cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), calendarParams)
      : moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), calendarParams)
      : viewId
      ? VIEW_ISSUES(viewId.toString(), calendarParams)
      : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId?.toString() ?? "", calendarParams);

    const ganttFetchKey = cycleId
      ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString())
      : moduleId
      ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString())
      : viewId
      ? VIEW_ISSUES(viewId.toString(), viewGanttParams)
      : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId?.toString() ?? "");

    await issuesServices
      .bulkDeleteIssues(
        workspaceSlug as string,
        projectId as string,
        {
          issue_ids: data.delete_issue_ids,
        },
        user
      )
      .then(() => {
        setToastAlert({
          type: "success",
          title: store.locale.localized("Success!"),
          message: store.locale.localized("Issues deleted successfully!"),
        });

        if (displayFilters.layout === "calendar") mutate(calendarFetchKey);
        else if (displayFilters.layout === "gantt_chart") mutate(ganttFetchKey);
        else {
          if (cycleId) {
            mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params));
            mutate(CYCLE_DETAILS(cycleId.toString()));
          } else if (moduleId) {
            mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
            mutate(MODULE_DETAILS(moduleId as string));
          } else mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params));
        }

        handleClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Something went wrong. Please try again."),
        })
      );
  };

  const filteredIssues: IIssue[] =
    query === ""
      ? issues ?? []
      : issues?.filter(
          (issue) =>
            issue.name.toLowerCase().includes(query.toLowerCase()) ||
            `${issue.project_detail.identifier}-${issue.sequence_id}`
              .toLowerCase()
              .includes(query.toLowerCase())
        ) ?? [];

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-2xl transition-all">
              <form>
                <Combobox
                  onChange={(val: string) => {
                    const selectedIssues = watch("delete_issue_ids");
                    if (selectedIssues.includes(val))
                      setValue(
                        "delete_issue_ids",
                        selectedIssues.filter((i) => i !== val)
                      );
                    else setValue("delete_issue_ids", [...selectedIssues, val]);
                  }}
                >
                  <div className="relative m-1">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none focus:ring-0 sm:text-sm"
                      placeholder="Search..."
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>

                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 divide-y divide-custom-border-200 overflow-y-auto"
                  >
                    {filteredIssues.length > 0 ? (
                      <li className="p-2">
                        {query === "" && (
                          <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-custom-text-100">
                            {store.locale.localized("Select issues to delete")}
                          </h2>
                        )}
                        <ul className="text-sm text-custom-text-200">
                          {filteredIssues.map((issue) => (
                            <Combobox.Option
                              key={issue.id}
                              as="div"
                              value={issue.id}
                              className={({ active, selected }) =>
                                `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 ${
                                  active ? "bg-custom-background-80 text-custom-text-100" : ""
                                }`
                              }
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={watch("delete_issue_ids").includes(issue.id)}
                                  readOnly
                                />
                                <span
                                  className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: issue.state_detail.color,
                                  }}
                                />
                                <span className="flex-shrink-0 text-xs">
                                  {issue.project_detail.identifier}-{issue.sequence_id}
                                </span>
                                <span>{issue.name}</span>
                              </div>
                            </Combobox.Option>
                          ))}
                        </ul>
                      </li>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                        <LayerDiagonalIcon height="56" width="56" />
                        <h3 className="text-custom-text-200">
                          {store.locale.localized("No issues found for")}{" "}
                          <pre className="inline rounded bg-custom-background-80 px-2 py-1">C</pre>.
                        </h3>
                      </div>
                    )}
                  </Combobox.Options>
                </Combobox>

                {filteredIssues.length > 0 && (
                  <div className="flex items-center justify-end gap-2 p-3">
                    <SecondaryButton onClick={handleClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <DangerButton onClick={handleSubmit(handleDelete)} loading={isSubmitting}>
                      {isSubmitting
                        ? store.locale.localized("Deleting...")
                        : "Delete selected issues"}
                    </DangerButton>
                  </div>
                )}
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
