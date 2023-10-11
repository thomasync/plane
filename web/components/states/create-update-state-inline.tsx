import React, { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// services
import stateService from "services/state.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, Input, PrimaryButton, SecondaryButton, Tooltip } from "components/ui";
// types
import type { ICurrentUserResponse, IState, IStateResponse } from "types";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES } from "constants/project";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  data: IState | null;
  onClose: () => void;
  selectedGroup: StateGroup | null;
  user: ICurrentUserResponse | undefined;
  groupLength: number;
};

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled" | null;

const defaultValues: Partial<IState> = {
  name: "",
  color: "rgb(var(--color-text-200))",
  group: "backlog",
};

export const CreateUpdateStateInline: React.FC<Props> = ({
  data,
  onClose,
  selectedGroup,
  user,
  groupLength,
}) => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    control,
  } = useForm<IState>({
    defaultValues,
  });

  useEffect(() => {
    if (!data) return;

    reset(data);
  }, [data, reset]);

  useEffect(() => {
    if (data) return;

    reset({
      ...defaultValues,
      group: selectedGroup ?? "backlog",
    });
  }, [selectedGroup, data, reset]);

  const handleClose = () => {
    onClose();
    reset({ name: "", color: "#000000", group: "backlog" });
  };

  const onSubmit = async (formData: IState) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const payload: IState = {
      ...formData,
    };

    if (!data) {
      await stateService
        .createState(workspaceSlug.toString(), projectId.toString(), { ...payload }, user)
        .then((res) => {
          mutate<IStateResponse>(
            STATES_LIST(projectId.toString()),
            (prevData) => {
              if (!prevData) return prevData;

              return {
                ...prevData,
                [res.group]: [...prevData[res.group], res],
              };
            },
            false
          );
          handleClose();

          setToastAlert({
            type: "success",
            title: store.locale.localized("Success!"),
            message: store.locale.localized("State created successfully."),
          });
        })
        .catch((err) => {
          if (err.status === 400)
            setToastAlert({
              type: "error",
              title: store.locale.localized("Error!"),
              message: store.locale.localized(
                "State with that name already exists. Please try again with another name."
              ),
            });
          else
            setToastAlert({
              type: "error",
              title: store.locale.localized("Error!"),
              message: store.locale.localized("State could not be created. Please try again."),
            });
        });
    } else {
      await stateService
        .updateState(
          workspaceSlug.toString(),
          projectId.toString(),
          data.id,
          {
            ...payload,
          },
          user
        )
        .then(() => {
          mutate(STATES_LIST(projectId.toString()));
          handleClose();

          setToastAlert({
            type: "success",
            title: store.locale.localized("Success!"),
            message: store.locale.localized("State updated successfully."),
          });
        })
        .catch((err) => {
          if (err.status === 400)
            setToastAlert({
              type: "error",
              title: store.locale.localized("Error!"),
              message: store.locale.localized(
                "Another state exists with the same name. Please try again with another name."
              ),
            });
          else
            setToastAlert({
              type: "error",
              title: store.locale.localized("Error!"),
              message: store.locale.localized("State could not be updated. Please try again."),
            });
        });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-x-2 rounded-[10px] bg-custom-background-100 p-5"
    >
      <div className="flex-shrink-0">
        <Popover className="relative flex h-full w-full items-center justify-center">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group inline-flex items-center text-base font-medium focus:outline-none ${
                  open ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: watch("color") ?? "black",
                    }}
                  />
                )}
              </Popover.Button>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute top-full left-0 z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
                  <Controller
                    name="color"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
                    )}
                  />
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
      <Input
        id="name"
        name="name"
        register={register}
        autoFocus
        placeholder={store.locale.localized("Name")}
        validations={{
          required: true,
        }}
        error={errors.name}
        autoComplete="off"
      />
      {data && (
        <Controller
          name="group"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Tooltip
              tooltipContent={
                groupLength === 1
                  ? store.locale.localized("Cannot have an empty group.")
                  : store.locale.localized("Choose State")
              }
            >
              <div>
                <CustomSelect
                  disabled={groupLength === 1}
                  value={value}
                  onChange={onChange}
                  label={
                    Object.keys(GROUP_CHOICES).find((k) => k === value.toString())
                      ? GROUP_CHOICES[value.toString() as keyof typeof GROUP_CHOICES]
                      : store.locale.localized("Select group")
                  }
                  input
                >
                  {Object.keys(GROUP_CHOICES).map((key) => (
                    <CustomSelect.Option key={key} value={key}>
                      {GROUP_CHOICES[key as keyof typeof GROUP_CHOICES]}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              </div>
            </Tooltip>
          )}
        />
      )}
      <Input
        id="description"
        name="description"
        register={register}
        placeholder={store.locale.localized("Description")}
        error={errors.description}
        autoComplete="off"
      />
      <SecondaryButton onClick={handleClose}>{store.locale.localized("Cancel")}</SecondaryButton>
      <PrimaryButton type="submit" loading={isSubmitting}>
        {isSubmitting
          ? data
            ? store.locale.localized("Updating...")
            : store.locale.localized("Creating...")
          : data
          ? store.locale.localized("Update")
          : store.locale.localized("Create")}
      </PrimaryButton>
    </form>
  );
};
