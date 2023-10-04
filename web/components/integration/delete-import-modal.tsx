import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import IntegrationService from "services/integration";
// hooks
import useToast from "hooks/use-toast";
// ui
import { DangerButton, Input, SecondaryButton } from "components/ui";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// types
import { ICurrentUserResponse, IImporterService } from "types";
// fetch-keys
import { IMPORTER_SERVICES_LIST } from "constants/fetch-keys";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IImporterService | null;
  user: ICurrentUserResponse | undefined;
};

export const DeleteImportModal: React.FC<Props> = ({ isOpen, handleClose, data, user }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteImport, setConfirmDeleteImport] = useState(false);

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const handleDeletion = () => {
    if (!workspaceSlug || !data) return;

    setDeleteLoading(true);

    mutate<IImporterService[]>(
      IMPORTER_SERVICES_LIST(workspaceSlug as string),
      (prevData) => (prevData ?? []).filter((i) => i.id !== data.id),
      false
    );

    IntegrationService.deleteImporterService(workspaceSlug as string, data.service, data.id, user)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Something went wrong. Please try again."),
        })
      )
      .finally(() => {
        setDeleteLoading(false);
        handleClose();
      });
  };

  if (!data) return <></>;

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
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-500"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">
                        {store.locale.localized("Delete Project")}
                      </h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm leading-7 text-custom-text-200">
                      {store.locale.localized("Are you sure you want to delete import from")}{" "}
                      <span className="break-words font-semibold capitalize text-custom-text-100">
                        {data?.service}
                      </span>
                      {"? "}
                      {store.locale.localized(
                        "All of the data related to the import will be permanently removed. This action cannot be undone."
                      )}
                    </p>
                  </span>
                  <div>
                    <p className="text-sm text-custom-text-200">
                      {store.locale.localized("To confirm, type")}{" "}
                      <span className="font-medium text-custom-text-100">
                        {store.locale.localized("delete import")}
                      </span>{" "}
                      {store.locale.localized("below")}:
                    </p>
                    <Input
                      type="text"
                      name="typeDelete"
                      className="mt-2"
                      onChange={(e) => {
                        if (e.target.value === store.locale.localized("delete import"))
                          setConfirmDeleteImport(true);
                        else setConfirmDeleteImport(false);
                      }}
                      placeholder={
                        store.locale.localized("Enter '") +
                        store.locale.localized("delete import") +
                        "'"
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={handleClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <DangerButton
                      onClick={handleDeletion}
                      disabled={!confirmDeleteImport}
                      loading={deleteLoading}
                    >
                      {deleteLoading ? store.locale.localized("Deleting...") : "Delete Project"}
                    </DangerButton>
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
