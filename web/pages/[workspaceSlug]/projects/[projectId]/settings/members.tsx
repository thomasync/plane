import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

import useSWR, { mutate } from "swr";

// services
import projectService from "services/project.service";
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
import useProjectMembers from "hooks/use-project-members";
import useProjectDetails from "hooks/use-project-details";
import { Controller, useForm } from "react-hook-form";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import ConfirmProjectMemberRemove from "components/project/confirm-project-member-remove";
import SendProjectInvitationModal from "components/project/send-project-invitation-modal";
import { MemberSelect, SettingsSidebar } from "components/project";
// ui
import {
  CustomMenu,
  CustomSearchSelect,
  CustomSelect,
  Icon,
  Loader,
  PrimaryButton,
  SecondaryButton,
} from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
import { IProject, IUserLite, IWorkspace } from "types";
// fetch-keys
import {
  PROJECTS_LIST,
  PROJECT_DETAILS,
  PROJECT_INVITATIONS_WITH_EMAIL,
  PROJECT_MEMBERS,
  PROJECT_MEMBERS_WITH_EMAIL,
  WORKSPACE_DETAILS,
} from "constants/fetch-keys";
// constants
import { ROLE } from "constants/workspace";
// helper
import { truncateText } from "helpers/string.helper";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

const MembersSettings: NextPage = () => {
  const [inviteModal, setInviteModal] = useState(false);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<string | null>(null);
  const [selectedInviteRemoveMember, setSelectedInviteRemoveMember] = useState<string | null>(null);

  const { setToastAlert } = useToast();

  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();
  const { projectDetails } = useProjectDetails();
  const { isOwner } = useProjectMembers(
    workspaceSlug?.toString(),
    projectId?.toString(),
    Boolean(workspaceSlug && projectId)
  );

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<IProject>({ defaultValues });

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectMembers, mutate: mutateMembers } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_MEMBERS_WITH_EMAIL(workspaceSlug.toString(), projectId.toString())
      : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembersWithEmail(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectInvitations, mutate: mutateInvitations } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_INVITATIONS_WITH_EMAIL(workspaceSlug.toString(), projectId.toString())
      : null,
    workspaceSlug && projectId
      ? () =>
          projectService.projectInvitationsWithEmail(workspaceSlug as string, projectId as string)
      : null
  );

  const members = [
    ...(projectMembers?.map((item) => ({
      id: item.id,
      memberId: item.member?.id,
      avatar: item.member?.avatar,
      first_name: item.member?.first_name,
      last_name: item.member?.last_name,
      email: item.member?.email,
      display_name: item.member?.display_name,
      role: item.role,
      status: true,
      member: true,
    })) || []),
    ...(projectInvitations?.map((item: any) => ({
      id: item.id,
      memberId: item.id,
      avatar: item.avatar ?? "",
      first_name: item.first_name ?? item.email,
      last_name: item.last_name ?? "",
      email: item.email,
      display_name: item.email,
      role: item.role,
      status: item.accepted,
      member: false,
    })) || []),
  ];

  const currentUser = projectMembers?.find((item) => item.member.id === user?.id);

  const handleProjectInvitationSuccess = () => {};

  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug || !projectId || !projectDetails) return;

    const payload: Partial<IProject> = {
      default_assignee: formData.default_assignee,
      project_lead: formData.project_lead === "none" ? null : formData.project_lead,
    };

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, payload, user)
      .then((res) => {
        mutate(PROJECT_DETAILS(projectId as string));

        mutate(
          PROJECTS_LIST(workspaceSlug as string, {
            is_favorite: "all",
          })
        );

        setToastAlert({
          title: store.locale.localized("Success"),
          type: "success",
          message: store.locale.localized("Project updated successfully"),
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (projectDetails)
      reset({
        ...projectDetails,
        default_assignee: projectDetails.default_assignee?.id ?? projectDetails.default_assignee,
        project_lead: (projectDetails.project_lead as IUserLite)?.id ?? projectDetails.project_lead,
        workspace: (projectDetails.workspace as IWorkspace).id,
      });
  }, [projectDetails, reset]);

  const submitChanges = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IProject> = {
      default_assignee: formData.default_assignee === "none" ? null : formData.default_assignee,
      project_lead: formData.project_lead === "none" ? null : formData.project_lead,
    };

    await projectService
      .updateProject(workspaceSlug as string, projectId as string, payload, user)
      .then((res) => {
        mutate(PROJECT_DETAILS(projectId as string));

        mutate(
          PROJECTS_LIST(workspaceSlug as string, {
            is_favorite: "all",
          })
        );

        setToastAlert({
          title: store.locale.localized("Success"),
          type: "success",
          message: store.locale.localized("Project updated successfully"),
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title={store.locale.localized("Members Settings")} unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <ConfirmProjectMemberRemove
        isOpen={Boolean(selectedRemoveMember) || Boolean(selectedInviteRemoveMember)}
        onClose={() => {
          setSelectedRemoveMember(null);
          setSelectedInviteRemoveMember(null);
        }}
        data={members.find(
          (item) => item.id === selectedRemoveMember || item.id === selectedInviteRemoveMember
        )}
        handleDelete={async () => {
          if (!activeWorkspace || !projectDetails) return;
          if (selectedRemoveMember) {
            await projectService.deleteProjectMember(
              activeWorkspace.slug,
              projectDetails.id,
              selectedRemoveMember
            );
            mutateMembers(
              (prevData: any) => prevData?.filter((item: any) => item.id !== selectedRemoveMember),
              false
            );
          }
          if (selectedInviteRemoveMember) {
            await projectService.deleteProjectInvitation(
              activeWorkspace.slug,
              projectDetails.id,
              selectedInviteRemoveMember
            );
            mutateInvitations(
              (prevData: any) =>
                prevData?.filter((item: any) => item.id !== selectedInviteRemoveMember),
              false
            );
          }
          setToastAlert({
            type: "success",
            message: store.locale.localized("Member removed successfully"),
            title: store.locale.localized("Success"),
          });
        }}
      />
      <SendProjectInvitationModal
        isOpen={inviteModal}
        setIsOpen={setInviteModal}
        members={members}
        user={user}
        onSuccess={() => mutateMembers()}
      />
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">{store.locale.localized("Defaults")}</h3>
          </div>
          <div className="flex flex-col gap-2 pb-4 w-full">
            <div className="flex items-center py-8 gap-4 w-full">
              <div className="flex flex-col gap-2 w-1/2">
                <h4 className="text-sm">{store.locale.localized("Project Lead")}</h4>
                <div className="">
                  {projectDetails ? (
                    <Controller
                      control={control}
                      name="project_lead"
                      render={({ field: { value } }) => (
                        <MemberSelect
                          value={value}
                          onChange={(val: string) => {
                            submitChanges({ project_lead: val });
                          }}
                        />
                      )}
                    />
                  ) : (
                    <Loader className="h-9 w-full">
                      <Loader.Item width="100%" height="100%" />
                    </Loader>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <h4 className="text-sm">{store.locale.localized("Default Assignee")}</h4>
                <div className="">
                  {projectDetails ? (
                    <Controller
                      control={control}
                      name="default_assignee"
                      render={({ field: { value } }) => (
                        <MemberSelect
                          value={value}
                          onChange={(val: string) => {
                            submitChanges({ default_assignee: val });
                          }}
                        />
                      )}
                    />
                  ) : (
                    <Loader className="h-9 w-full">
                      <Loader.Item width="100%" height="100%" />
                    </Loader>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-200">
            <h4 className="text-xl font-medium">{store.locale.localized("Members")}</h4>
            <PrimaryButton onClick={() => setInviteModal(true)}>
              {store.locale.localized("Add Member")}
            </PrimaryButton>
          </div>
          {!projectMembers || !projectInvitations ? (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : (
            <div className="divide-y divide-custom-border-200">
              {members.length > 0
                ? members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-3.5 py-[18px]"
                    >
                      <div className="flex items-center gap-x-6 gap-y-2">
                        {member.avatar && member.avatar !== "" ? (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg p-4 capitalize text-white">
                            <img
                              src={member.avatar}
                              alt={member.display_name}
                              className="absolute top-0 left-0 h-full w-full object-cover rounded-lg"
                            />
                          </div>
                        ) : member.display_name || member.email ? (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
                            {(member.display_name || member.email)?.charAt(0)}
                          </div>
                        ) : (
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 p-4 capitalize text-white">
                            ?
                          </div>
                        )}
                        <div>
                          {member.member ? (
                            <Link href={`/${workspaceSlug}/profile/${member.memberId}`}>
                              <a className="text-sm">
                                <span>
                                  {member.first_name} {member.last_name}
                                </span>
                                <span className="text-custom-text-300 text-sm ml-2">
                                  ({member.display_name})
                                </span>
                              </a>
                            </Link>
                          ) : (
                            <h4 className="text-sm">{member.display_name || member.email}</h4>
                          )}
                          {isOwner && (
                            <p className="mt-0.5 text-xs text-custom-sidebar-text-300">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {!member.member && (
                          <div className="mr-2 flex items-center justify-center rounded-full bg-yellow-500/20 px-2 py-1 text-center text-xs text-yellow-500">
                            Pending
                          </div>
                        )}
                        <CustomSelect
                          customButton={
                            <button className="flex item-center gap-1">
                              <span
                                className={`flex items-center text-sm font-medium ${
                                  member.memberId !== user?.id ? "" : "text-custom-sidebar-text-400"
                                }`}
                              >
                                {ROLE[member.role as keyof typeof ROLE]}
                              </span>
                              {member.memberId !== user?.id && (
                                <Icon iconName="expand_more" className="text-lg font-medium" />
                              )}
                            </button>
                          }
                          value={member.role}
                          onChange={(value: 5 | 10 | 15 | 20 | undefined) => {
                            if (!activeWorkspace || !projectDetails) return;

                            mutateMembers(
                              (prevData: any) =>
                                prevData.map((m: any) =>
                                  m.id === member.id ? { ...m, role: value } : m
                                ),
                              false
                            );

                            projectService
                              .updateProjectMember(
                                activeWorkspace.slug,
                                projectDetails.id,
                                member.id,
                                {
                                  role: value,
                                }
                              )
                              .catch(() => {
                                setToastAlert({
                                  type: "error",
                                  title: store.locale.localized("Error!"),
                                  message: store.locale.localized(
                                    "An error occurred while updating member role. Please try again."
                                  ),
                                });
                              });
                          }}
                          position="right"
                          disabled={
                            member.memberId === user?.id ||
                            !member.member ||
                            (currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < member.role)
                          }
                        >
                          {Object.keys(ROLE).map((key) => {
                            if (
                              currentUser &&
                              currentUser.role !== 20 &&
                              currentUser.role < parseInt(key)
                            )
                              return null;

                            return (
                              <CustomSelect.Option key={key} value={key}>
                                <>{ROLE[parseInt(key) as keyof typeof ROLE]}</>
                              </CustomSelect.Option>
                            );
                          })}
                        </CustomSelect>
                        <CustomMenu ellipsis>
                          <CustomMenu.MenuItem
                            onClick={() => {
                              if (member.member) setSelectedRemoveMember(member.id);
                              else setSelectedInviteRemoveMember(member.id);
                            }}
                          >
                            <span className="flex items-center justify-start gap-2">
                              <XMarkIcon className="h-4 w-4" />

                              <span>
                                {" "}
                                {member.memberId !== user?.id
                                  ? store.locale.localized("Remove member")
                                  : store.locale.localized("Leave project")}
                              </span>
                            </span>
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          )}
        </section>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default MembersSettings;
