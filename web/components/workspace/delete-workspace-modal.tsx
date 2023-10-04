import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { DangerButton, Input, SecondaryButton } from "components/ui";
// types
import type { ICurrentUserResponse, IWorkspace } from "types";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
  user: ICurrentUserResponse | undefined;
};

const defaultValues = {
  workspaceName: "",
  confirmDelete: "",
};

export const DeleteWorkspaceModal: React.FC<Props> = ({ isOpen, data, onClose, user }) => {
  const store: RootStore = useMobxStore();
  const router = useRouter();

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues });

  const canDelete =
    watch("workspaceName") === data?.name &&
    watch("confirmDelete") === store.locale.localized("delete my workspace");

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!data || !canDelete) return;

    await workspaceService
      .deleteWorkspace(data.slug, user)
      .then(() => {
        handleClose();

        router.push("/");

        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.filter((workspace) => workspace.id !== data.id)
        );

        setToastAlert({
          type: "success",
          title: store.locale.localized("Success!"),
          message: store.locale.localized("Workspace deleted successfully."),
        });
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Something went wrong. Please try again later."),
        })
      );
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">
                        {store.locale.localized("Delete Workspace")}
                      </h3>
                    </span>
                  </div>

                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      {store.locale.localized("Are you sure you want to delete workspace")}
                      {" - "}
                      <span className="break-words font-semibold">{data?.name}</span>
                      {"? "}
                      {store.locale.localized(
                        "All of the data related to the workspace will be permanently removed. This action cannot be undone."
                      )}
                    </p>
                  </span>

                  <div className="text-custom-text-200">
                    <p className="break-words text-sm ">
                      {store.locale.localized("Enter the workspace name")}{" "}
                      <span className="font-medium text-custom-text-100">{data?.name}</span>{" "}
                      {store.locale.localized("to continue")}
                      {": "}
                    </p>
                    <Controller
                      control={control}
                      name="workspaceName"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="text"
                          placeholder={store.locale.localized("Workspace name")}
                          className="mt-2"
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>

                  <div className="text-custom-text-200">
                    <p className="text-sm">
                      {store.locale.localized("To confirm, type")}{" "}
                      <span className="font-medium text-custom-text-100">
                        {store.locale.localized("delete my workspace")}
                      </span>{" "}
                      {store.locale.localized("below")}
                      {": "}
                    </p>
                    <Controller
                      control={control}
                      name="confirmDelete"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="text"
                          placeholder={`${store.locale.localized(
                            "Enter"
                          )} '${store.locale.localized("delete my workspace")}'`}
                          className="mt-2"
                          onChange={onChange}
                          value={value}
                        />
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <DangerButton type="submit" disabled={!canDelete} loading={isSubmitting}>
                      {isSubmitting
                        ? store.locale.localized("Deleting...")
                        : store.locale.localized("Delete Workspace")}
                    </DangerButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
