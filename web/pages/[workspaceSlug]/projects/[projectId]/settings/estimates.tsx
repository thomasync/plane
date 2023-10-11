import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import estimatesService from "services/estimates.service";
import projectService from "services/project.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { CreateUpdateEstimateModal, SingleEstimate } from "components/estimates";
import { SettingsSidebar } from "components/project";
//hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { EmptyState, Loader, PrimaryButton, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyEstimate from "public/empty-state/estimate.svg";
// types
import { IEstimate, IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { ESTIMATES_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const EstimatesSettings: NextPage = () => {
  const [estimateFormOpen, setEstimateFormOpen] = useState(false);

  const [estimateToUpdate, setEstimateToUpdate] = useState<IEstimate | undefined>();

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { projectDetails } = useProjectDetails();

  const { data: estimatesList } = useSWR<IEstimate[]>(
    workspaceSlug && projectId ? ESTIMATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => estimatesService.getEstimatesList(workspaceSlug as string, projectId as string)
      : null
  );

  const editEstimate = (estimate: IEstimate) => {
    setEstimateToUpdate(estimate);
    setEstimateFormOpen(true);
  };

  const removeEstimate = (estimateId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IEstimate[]>(
      ESTIMATES_LIST(projectId as string),
      (prevData) => (prevData ?? []).filter((p) => p.id !== estimateId),
      false
    );

    estimatesService
      .deleteEstimate(workspaceSlug as string, projectId as string, estimateId, user)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Estimate could not be deleted. Please try again"),
        });
      });
  };

  const disableEstimates = () => {
    if (!workspaceSlug || !projectId) return;

    mutate<IProject>(
      PROJECT_DETAILS(projectId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return { ...prevData, estimate: null };
      },
      false
    );

    projectService
      .updateProject(workspaceSlug as string, projectId as string, { estimate: null }, user)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: store.locale.localized("Error!"),
          message: store.locale.localized("Estimate could not be disabled. Please try again"),
        })
      );
  };

  return (
    <>
      <CreateUpdateEstimateModal
        isOpen={estimateFormOpen}
        data={estimateToUpdate}
        handleClose={() => {
          setEstimateFormOpen(false);
          setEstimateToUpdate(undefined);
        }}
        user={user}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(
                projectDetails?.name ?? store.locale.localized("Project"),
                32
              )}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
              linkTruncate
            />
            <BreadcrumbItem title={store.locale.localized("Estimates Settings")} unshrinkTitle />
          </Breadcrumbs>
        }
      >
        <div className="flex flex-row gap-2 h-full">
          <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
            <SettingsSidebar />
          </div>
          <div className="pr-9 py-8 flex flex-col w-full overflow-y-auto">
            <section className="flex items-center justify-between pt-2 pb-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">{store.locale.localized("Estimates")}</h3>
              <div className="col-span-12 space-y-5 sm:col-span-7">
                <div className="flex items-center gap-2">
                  <PrimaryButton
                    onClick={() => {
                      setEstimateToUpdate(undefined);
                      setEstimateFormOpen(true);
                    }}
                  >
                    {store.locale.localized("Add Estimate")}
                  </PrimaryButton>
                  {projectDetails?.estimate && (
                    <SecondaryButton onClick={disableEstimates}>
                      {store.locale.localized("Disable Estimates")}
                    </SecondaryButton>
                  )}
                </div>
              </div>
            </section>
            {estimatesList ? (
              estimatesList.length > 0 ? (
                <section className="h-full bg-custom-background-100 overflow-y-auto">
                  {estimatesList.map((estimate) => (
                    <SingleEstimate
                      key={estimate.id}
                      estimate={estimate}
                      editEstimate={(estimate) => editEstimate(estimate)}
                      handleEstimateDelete={(estimateId) => removeEstimate(estimateId)}
                      user={user}
                    />
                  ))}
                </section>
              ) : (
                <div className="h-full w-full overflow-y-auto">
                  <EmptyState
                    title={store.locale.localized("No estimates yet")}
                    description={store.locale.localized(
                      "Estimates help you communicate the complexity of an issue."
                    )}
                    image={emptyEstimate}
                    primaryButton={{
                      icon: <PlusIcon className="h-4 w-4" />,
                      text: store.locale.localized("Add Estimate"),
                      onClick: () => {
                        setEstimateToUpdate(undefined);
                        setEstimateFormOpen(true);
                      },
                    }}
                  />
                </div>
              )
            ) : (
              <Loader className="mt-5 space-y-5">
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
              </Loader>
            )}
          </div>
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default EstimatesSettings;
