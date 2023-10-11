import React from "react";
// next

import { Router, useRouter } from "next/router";
import useSWR from "swr";
import {
  CheckIcon,
  CubeIcon,
  ShareIcon,
  StarIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// swr
// services
import workspaceService from "services/workspace.service";
// hooks
import useUser from "hooks/use-user";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Spinner } from "components/ui";
// icons
import { EmptySpace, EmptySpaceItem } from "components/ui/empty-space";
// types
import type { NextPage } from "next";
// constants
import { WORKSPACE_INVITATION } from "constants/fetch-keys";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

const WorkspaceInvitation: NextPage = () => {
  const store: RootStore = useMobxStore();
  const router = useRouter();

  const { invitation_id, email } = router.query;

  const { user } = useUser();

  const { data: invitationDetail, error } = useSWR(invitation_id && WORKSPACE_INVITATION, () =>
    invitation_id ? workspaceService.getWorkspaceInvitation(invitation_id as string) : null
  );

  const handleAccept = () => {
    if (!invitationDetail) return;
    workspaceService
      .joinWorkspace(
        invitationDetail.workspace.slug,
        invitationDetail.id,
        {
          accepted: true,
          email: invitationDetail.email,
        },
        user
      )
      .then(() => {
        if (email === user?.email) {
          router.push("/invitations");
        } else {
          router.push("/");
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <DefaultLayout>
      <div className="flex h-full w-full flex-col items-center justify-center px-3">
        {invitationDetail ? (
          <>
            {error ? (
              <div className="flex w-full flex-col space-y-4 rounded border border-custom-border-200 bg-custom-background-100 px-4 py-8 text-center shadow-2xl md:w-1/3">
                <h2 className="text-xl uppercase">
                  {store.locale.localized("INVITATION NOT FOUND")}
                </h2>
              </div>
            ) : (
              <>
                {invitationDetail.accepted ? (
                  <>
                    <EmptySpace
                      title={`${store.locale.localized("You are already a member of")} ${
                        invitationDetail.workspace.name
                      }`}
                      description={store.locale.localized(
                        "Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                      )}
                    >
                      <EmptySpaceItem
                        Icon={CubeIcon}
                        title={store.locale.localized("Continue to Dashboard")}
                        action={() => router.push("/")}
                      />
                    </EmptySpace>
                  </>
                ) : (
                  <EmptySpace
                    title={`${store.locale.localized("You have been invited to")} ${
                      invitationDetail.workspace.name
                    }`}
                    description={store.locale.localized(
                      "Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
                    )}
                  >
                    <EmptySpaceItem
                      Icon={CheckIcon}
                      title={store.locale.localized("Accept")}
                      action={handleAccept}
                    />
                    <EmptySpaceItem
                      Icon={XMarkIcon}
                      title={store.locale.localized("Ignore")}
                      action={() => {
                        router.push("/");
                      }}
                    />
                  </EmptySpace>
                )}
              </>
            )}
          </>
        ) : error ? (
          <EmptySpace
            title={store.locale.localized("This invitation link is not active anymore.")}
            description={store.locale.localized(
              "Your workspace is where you'll create projects, collaborate on your issues, and organize different streams of work in your Plane account."
            )}
            link={{ text: store.locale.localized("Or start from an empty project"), href: "/" }}
          >
            {!user ? (
              <EmptySpaceItem
                Icon={UserIcon}
                title={store.locale.localized("Sign in to continue")}
                action={() => {
                  router.push("/");
                }}
              />
            ) : (
              <EmptySpaceItem
                Icon={CubeIcon}
                title={store.locale.localized("Continue to Dashboard")}
                action={() => {
                  router.push("/");
                }}
              />
            )}
            <EmptySpaceItem
              Icon={StarIcon}
              title={store.locale.localized("Star us on GitHub")}
              action={() => {
                router.push("https://github.com/makeplane");
              }}
            />
            <EmptySpaceItem
              Icon={ShareIcon}
              title={store.locale.localized("Join our Discord community")}
              action={() => {
                router.push("https://discord.com/invite/A92xrEGCge");
              }}
            />
          </EmptySpace>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default WorkspaceInvitation;
