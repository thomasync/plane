// react
import React, { useCallback, useEffect, useState } from "react";

// next
import { useRouter } from "next/router";

// react hook forms
import { Controller } from "react-hook-form";

// hooks

import { useDebouncedCallback } from "use-debounce";
import useReloadConfirmations from "hooks/use-reload-confirmation";

// ui
import { TextArea } from "components/ui";

// components
import { TipTapEditor } from "components/tiptap";
import { Label } from "components/web-view";

// types
import type { IIssue } from "types";

//mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  isAllowed: boolean;
  issueDetails: IIssue;
  submitChanges: (data: Partial<IIssue>) => Promise<void>;
  register: any;
  control: any;
  watch: any;
  handleSubmit: any;
};

export const IssueWebViewForm: React.FC<Props> = (props) => {
  const { isAllowed, issueDetails, submitChanges, register, control, watch, handleSubmit } = props;

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [characterLimit, setCharacterLimit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const { setShowAlert } = useReloadConfirmations();

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert]);

  const debouncedTitleSave = useDebouncedCallback(async () => {
    setTimeout(async () => {
      handleSubmit(handleDescriptionFormSubmit)().finally(() => setIsSubmitting("submitted"));
    }, 500);
  }, 1000);

  const handleDescriptionFormSubmit = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!formData?.name || formData?.name.length === 0 || formData?.name.length > 255) return;

      await submitChanges({
        name: formData.name ?? "",
        description_html: formData.description_html ?? "<p></p>",
      });
    },
    [submitChanges]
  );

  return (
    <>
      <div className="flex flex-col">
        <Label>{store.locale.localized("Title")}</Label>
        <div className="relative">
          {isAllowed ? (
            <TextArea
              id="name"
              name="name"
              placeholder={store.locale.localized("Enter issue name")}
              register={register}
              onFocus={() => setCharacterLimit(true)}
              onChange={(e) => {
                setCharacterLimit(false);
                setIsSubmitting("submitting");
                debouncedTitleSave();
              }}
              required={true}
              className="min-h-10 block w-full resize-none overflow-hidden rounded border bg-transparent px-3 py-2 text-xl outline-none ring-0 focus:ring-1 focus:ring-custom-primary"
              role="textbox"
              disabled={!isAllowed}
            />
          ) : (
            <h4 className="break-words text-2xl font-semibold">{issueDetails?.name}</h4>
          )}
          {characterLimit && isAllowed && (
            <div className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 text-custom-text-200 p-0.5 text-xs">
              <span
                className={`${
                  watch("name").length === 0 || watch("name").length > 255 ? "text-red-500" : ""
                }`}
              >
                {watch("name").length}
              </span>
              /255
            </div>
          )}
        </div>
      </div>
      <div>
        <Label>{store.locale.localized("Description")}</Label>
        <div className="relative">
          <Controller
            name="description_html"
            control={control}
            render={({ field: { value, onChange } }) => {
              if (!value) return <></>;

              return (
                <TipTapEditor
                  value={
                    !value ||
                    value === "" ||
                    (typeof value === "object" && Object.keys(value).length === 0)
                      ? "<p></p>"
                      : value
                  }
                  workspaceSlug={workspaceSlug!.toString()}
                  debouncedUpdatesEnabled={true}
                  setShouldShowAlert={setShowAlert}
                  setIsSubmitting={setIsSubmitting}
                  customClassName={
                    isAllowed ? "min-h-[150px] shadow-sm" : "!p-0 !pt-2 text-custom-text-200"
                  }
                  noBorder={!isAllowed}
                  onChange={(description: Object, description_html: string) => {
                    setShowAlert(true);
                    setIsSubmitting("submitting");
                    onChange(description_html);
                    handleSubmit(handleDescriptionFormSubmit)().finally(() =>
                      setIsSubmitting("submitted")
                    );
                  }}
                  editable={isAllowed}
                />
              );
            }}
          />
          <div
            className={`absolute right-5 bottom-5 text-xs text-custom-text-200 border border-custom-border-400 rounded-xl w-[6.5rem] py-1 z-10 flex items-center justify-center ${
              isSubmitting === "saved" ? "fadeOut" : "fadeIn"
            }`}
          >
            {isSubmitting === "submitting"
              ? store.locale.localized("Saving...")
              : store.locale.localized("Saved")}
          </div>
        </div>
      </div>
    </>
  );
};
