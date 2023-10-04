import React, { useEffect } from "react";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
import type { IIssueLink, linkDetails, ModuleLink } from "types";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: linkDetails | null;
  status: boolean;
  createIssueLink: (formData: IIssueLink | ModuleLink) => Promise<void>;
  updateIssueLink: (formData: IIssueLink | ModuleLink, linkId: string) => Promise<void>;
};

const defaultValues: IIssueLink | ModuleLink = {
  title: "",
  url: "",
};

export const LinkModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  createIssueLink,
  updateIssueLink,
  status,
  data,
}) => {
  const store: RootStore = useMobxStore();
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const handleFormSubmit = async (formData: IIssueLink | ModuleLink) => {
    if (!data) await createIssueLink({ title: formData.title, url: formData.url });
    else await updateIssueLink({ title: formData.title, url: formData.url }, data.id);
    onClose();
  };

  const handleCreateUpdatePage = async (formData: IIssueLink | ModuleLink) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 border border-custom-border-200 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <form onSubmit={handleSubmit(handleCreateUpdatePage)}>
                  <div>
                    <div className="space-y-5">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-custom-text-100"
                      >
                        {status
                          ? store.locale.localized("Update Link")
                          : store.locale.localized("Add Link")}
                      </Dialog.Title>
                      <div className="mt-2 space-y-3">
                        <div>
                          <Input
                            id="url"
                            label="URL"
                            name="url"
                            type="url"
                            placeholder="https://..."
                            autoComplete="off"
                            error={errors.url}
                            register={register}
                            validations={{
                              required: store.locale.localized("URL is required"),
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            id="title"
                            label={store.locale.localized("Title (optional)")}
                            name="title"
                            type="text"
                            placeholder={store.locale.localized("Enter title")}
                            autoComplete="off"
                            error={errors.title}
                            register={register}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>
                      {store.locale.localized("Cancel")}
                    </SecondaryButton>
                    <PrimaryButton type="submit" loading={isSubmitting}>
                      {status
                        ? isSubmitting
                          ? store.locale.localized("Updating Link...")
                          : store.locale.localized("Update Link")
                        : isSubmitting
                        ? store.locale.localized("Adding Link...")
                        : store.locale.localized("Add Link")}
                    </PrimaryButton>
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
