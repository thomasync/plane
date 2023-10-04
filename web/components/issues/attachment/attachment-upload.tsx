import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-dropzone
import { useDropzone } from "react-dropzone";
// services
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// types
import { IIssueAttachment } from "types";
// fetch-keys
import { ISSUE_ATTACHMENTS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const maxFileSize = 5 * 1024 * 1024; // 5 MB

type Props = {
  disabled?: boolean;
};

export const IssueAttachmentUpload: React.FC<Props> = ({ disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles[0] || !workspaceSlug) return;

    const formData = new FormData();
    formData.append("asset", acceptedFiles[0]);
    formData.append(
      "attributes",
      JSON.stringify({
        name: acceptedFiles[0].name,
        size: acceptedFiles[0].size,
      })
    );
    setIsLoading(true);

    issuesService
      .uploadIssueAttachment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        formData
      )
      .then((res) => {
        mutate<IIssueAttachment[]>(
          ISSUE_ATTACHMENTS(issueId as string),
          (prevData) => [res, ...(prevData ?? [])],
          false
        );
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        setToastAlert({
          type: "success",
          title: store.locale.localized("Success!"),
          message: store.locale.localized("File added successfully."),
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized(
            "Something went wrong. please check file type & size (max 5 MB)"
          ),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });

  const fileError =
    fileRejections.length > 0
      ? `${store.locale.localized("Invalid file type or size")} (max ${
          maxFileSize / 1024 / 1024
        } MB)`
      : null;

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center h-[60px] border-2 border-dashed text-custom-primary bg-custom-primary/5 text-xs rounded-md px-4 ${
        isDragActive ? "bg-custom-primary/10 border-custom-primary" : "border-custom-border-200"
      } ${isDragReject ? "bg-red-100" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input {...getInputProps()} />
      <span className="flex items-center gap-2">
        {isDragActive ? (
          <p>{store.locale.localized("Drop here ...")}</p>
        ) : fileError ? (
          <p className="text-center text-red-500">{fileError}</p>
        ) : isLoading ? (
          <p className="text-center">{store.locale.localized("Uploading ...")}</p>
        ) : (
          <p className="text-center">{store.locale.localized("Click or drag a file here")}</p>
        )}
      </span>
    </div>
  );
};
