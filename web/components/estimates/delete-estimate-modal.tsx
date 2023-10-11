import React, { useEffect, useState } from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// types
import { IEstimate } from "types";

// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { SecondaryButton, DangerButton } from "components/ui";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IEstimate;
  handleDelete: () => void;
};

export const DeleteEstimateModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  data,
  handleDelete,
}) => {
  const store: RootStore = useMobxStore();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    setIsDeleteLoading(false);
  }, [isOpen]);

  const onClose = () => {
    setIsDeleteLoading(false);
    handleClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">
                        {store.locale.localized("Delete Estimate")}
                      </h3>
                    </span>
                  </div>
                  <span>
                    <p className="break-words text-sm leading-7 text-custom-text-200">
                      {store.locale.localized("Are you sure you want to delete estimate")}
                      {"- "}
                      <span className="break-words font-medium text-custom-text-100">
                        {data.name}
                      </span>
                      {"? "}
                      {store.locale.localized(
                        "All of the data related to the estimate will be permanently removed. This action cannot be undone."
                      )}
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <DangerButton
                      onClick={() => {
                        setIsDeleteLoading(true);
                        handleDelete();
                      }}
                      loading={isDeleteLoading}
                    >
                      {isDeleteLoading
                        ? store.locale.localized("Deleting...")
                        : store.locale.localized("Delete Estimate")}
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
