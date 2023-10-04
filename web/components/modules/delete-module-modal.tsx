import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import modulesService from "services/modules.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { SecondaryButton, DangerButton } from "components/ui";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// types
import type { ICurrentUserResponse, IModule } from "types";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: IModule;
  user: ICurrentUserResponse | undefined;
};

export const DeleteModuleModal: React.FC<Props> = ({ isOpen, setIsOpen, data, user }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);

    if (!workspaceSlug || !projectId || !data) return;

    mutate<IModule[]>(
      MODULE_LIST(projectId as string),
      (prevData) => prevData?.filter((m) => m.id !== data.id),
      false
    );

    await modulesService
      .deleteModule(workspaceSlug as string, projectId as string, data.id, user)
      .then(() => {
        if (moduleId) router.push(`/${workspaceSlug}/projects/${data.project}/modules`);
        handleClose();
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Module could not be deleted. Please try again."),
        });
        setIsDeleteLoading(false);
      });
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-custom-text-100"
                      >
                        {store.locale.localized("Delete Module")}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-custom-text-200">
                          {store.locale.localized("Are you sure you want to delete module")}
                          {" - "}
                          <span className="break-words font-medium text-custom-text-100">
                            {data?.name}
                          </span>
                          {" ? "}
                          {store.locale.localized(
                            "All of the data related to the module will be permanently removed. This action cannot be undone."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <SecondaryButton onClick={handleClose}>
                    {store.locale.localized("Cancel")}
                  </SecondaryButton>
                  <DangerButton onClick={handleDeletion} loading={isDeleteLoading}>
                    {isDeleteLoading
                      ? store.locale.localized("Deleting...")
                      : store.locale.localized("Delete")}
                  </DangerButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
