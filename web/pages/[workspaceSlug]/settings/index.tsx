import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
import fileService from "services/file.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ImageUploadModal } from "components/core";
import { DeleteWorkspaceModal } from "components/workspace";
import { SettingsSidebar } from "components/project";
// ui
import { Disclosure, Transition } from "@headlessui/react";
import { Spinner, Input, CustomSelect, DangerButton, PrimaryButton, Icon } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { Pencil } from "lucide-react";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import type { IWorkspace } from "types";
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS, USER_WORKSPACES, WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";
// constants
import { ORGANIZATION_SIZE } from "constants/workspace";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const defaultValues: Partial<IWorkspace> = {
  name: "",
  url: "",
  organization_size: "2-10",
  logo: null,
};

const WorkspaceSettings: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageRemoving, setIsImageRemoving] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();

  const { data: memberDetails } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  const { setToastAlert } = useToast();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: { ...defaultValues, ...activeWorkspace },
  });

  useEffect(() => {
    if (activeWorkspace) reset({ ...activeWorkspace });
  }, [activeWorkspace, reset]);

  const onSubmit = async (formData: IWorkspace) => {
    if (!activeWorkspace) return;

    const payload: Partial<IWorkspace> = {
      logo: formData.logo,
      name: formData.name,
      organization_size: formData.organization_size,
    };

    await workspaceService
      .updateWorkspace(activeWorkspace.slug, payload, user)
      .then((res) => {
        mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
          prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
        );
        mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            logo: formData.logo,
          };
        });
        setToastAlert({
          title: store.locale.localized("Success"),
          type: "success",
          message: store.locale.localized("Workspace updated successfully"),
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDelete = (url: string | null | undefined) => {
    if (!activeWorkspace || !url) return;

    setIsImageRemoving(true);

    fileService.deleteFile(activeWorkspace.id, url).then(() => {
      workspaceService
        .updateWorkspace(activeWorkspace.slug, { logo: "" }, user)
        .then((res) => {
          setToastAlert({
            type: "success",
            title: store.locale.localized("Success!"),
            message: store.locale.localized("Workspace picture removed successfully."),
          });
          mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) =>
            prevData?.map((workspace) => (workspace.id === res.id ? res : workspace))
          );
          mutate<IWorkspace>(WORKSPACE_DETAILS(workspaceSlug as string), (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              logo: "",
            };
          });
          setIsImageUploadModalOpen(false);
        })
        .catch(() => {
          setToastAlert({
            type: "error",
            title: store.locale.localized("Error!"),
            message: store.locale.localized(
              "There was some error in deleting your profile picture. Please try again."
            ),
          });
        })
        .finally(() => setIsImageRemoving(false));
    });
  };

  const isAdmin = memberDetails?.role === 20;

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(
              activeWorkspace?.name ?? store.locale.localized("Workspace"),
              32
            )} ${store.locale.localized("Settings")}`}
          />
        </Breadcrumbs>
      }
    >
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        isRemoving={isImageRemoving}
        handleDelete={() => handleDelete(activeWorkspace?.logo)}
        onSuccess={(imageUrl) => {
          setIsImageUploading(true);
          setValue("logo", imageUrl);
          setIsImageUploadModalOpen(false);
          handleSubmit(onSubmit)().then(() => setIsImageUploading(false));
        }}
        value={watch("logo")}
      />
      <DeleteWorkspaceModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        data={activeWorkspace ?? null}
        user={user}
      />
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        {activeWorkspace ? (
          <div className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
            <div className="flex gap-5 items-center pb-7 border-b border-custom-border-200">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setIsImageUploadModalOpen(true)}
                  disabled={!isAdmin}
                >
                  {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                    <div className="relative mx-auto flex h-14 w-14">
                      <img
                        src={watch("logo")!}
                        className="absolute top-0 left-0 h-full w-full object-cover rounded-md"
                        alt={store.locale.localized("Workspace Logo")}
                      />
                    </div>
                  ) : (
                    <div className="relative flex h-14 w-14 items-center justify-center rounded bg-gray-700 p-4 uppercase text-white">
                      {activeWorkspace?.name?.charAt(0) ?? "N"}
                    </div>
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold leading-6">{watch("name")}</h3>
                <span className="text-sm tracking-tight">{`${
                  typeof window !== "undefined" &&
                  window.location.origin.replace("http://", "").replace("https://", "")
                }/${activeWorkspace.slug}`}</span>
                <div className="flex item-center gap-2.5">
                  <button
                    className="flex items-center gap-1.5 text-xs text-left text-custom-primary-100 font-medium"
                    onClick={() => setIsImageUploadModalOpen(true)}
                    disabled={!isAdmin}
                  >
                    {watch("logo") && watch("logo") !== null && watch("logo") !== "" ? (
                      <>
                        <Pencil className="h-3 w-3" />
                        {store.locale.localized("Edit logo")}
                      </>
                    ) : (
                      store.locale.localized("Upload logo")
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 my-10">
              <div className="grid grid-col grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 items-center justify-between gap-10 w-full">
                <div className="flex flex-col gap-1 ">
                  <h4 className="text-sm">{store.locale.localized("Workspace Name")}</h4>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Name"
                    autoComplete="off"
                    register={register}
                    error={errors.name}
                    validations={{
                      required: store.locale.localized("Name is required"),
                      maxLength: {
                        value: 80,
                        message: store.locale.localized(
                          "Workspace name should not exceed 80 characters"
                        ),
                      },
                    }}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="flex flex-col gap-1 ">
                  <h4 className="text-sm">{store.locale.localized("Company Size")}</h4>
                  <Controller
                    name="organization_size"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={
                          ORGANIZATION_SIZE.find((c) => c === value) ??
                          store.locale.localized("Select organization size")
                        }
                        width="w-full"
                        input
                        disabled={!isAdmin}
                      >
                        {ORGANIZATION_SIZE?.map((item) => (
                          <CustomSelect.Option key={item} value={item}>
                            {item}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1 ">
                  <h4 className="text-sm">{store.locale.localized("Workspace URL")}</h4>
                  <Input
                    id="url"
                    name="url"
                    autoComplete="off"
                    register={register}
                    error={errors.url}
                    className="w-full"
                    value={`${
                      typeof window !== "undefined" &&
                      window.location.origin.replace("http://", "").replace("https://", "")
                    }/${activeWorkspace.slug}`}
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <PrimaryButton
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  disabled={!isAdmin}
                >
                  {isSubmitting
                    ? store.locale.localized("Updating...")
                    : store.locale.localized("Update Workspace")}
                </PrimaryButton>
              </div>
            </div>
            {isAdmin && (
              <Disclosure as="div" className="border-t border-custom-border-400">
                {({ open }) => (
                  <div className="w-full">
                    <Disclosure.Button
                      as="button"
                      type="button"
                      className="flex items-center justify-between w-full py-4"
                    >
                      <span className="text-xl tracking-tight">
                        {store.locale.localized("Delete Workspace")}
                      </span>
                      <Icon iconName={open ? "expand_less" : "expand_more"} className="!text-2xl" />
                    </Disclosure.Button>

                    <Transition
                      show={open}
                      enter="transition duration-100 ease-out"
                      enterFrom="transform opacity-0"
                      enterTo="transform opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform opacity-100"
                      leaveTo="transform opacity-0"
                    >
                      <Disclosure.Panel>
                        <div className="flex flex-col gap-8">
                          <span className="text-sm tracking-tight">
                            {store.locale.localized(
                              `The danger zone of the workspace delete page is a critical area that
  							requires careful consideration and attention. When deleting a workspace,
  							all of the data and resources within that workspace will be permanently
  							removed and cannot be recovered.`
                            )}
                          </span>
                          <div>
                            <DangerButton
                              onClick={() => setIsOpen(true)}
                              className="!text-sm"
                              outline
                            >
                              {store.locale.localized("Delete my workspace")}
                            </DangerButton>
                          </div>
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full px-4 sm:px-0">
            <Spinner />
          </div>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceSettings;
