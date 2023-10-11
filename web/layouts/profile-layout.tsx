// hooks
import { useWorkspaceMyMembership } from "contexts/workspace-member.context";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ProfileNavbar, ProfileSidebar } from "components/profile";
// ui
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// mobx
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const ProfileAuthWrapper = (props: Props) => {
  const store: RootStore = useMobxStore();
  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={store.locale.localized("User Profile")} />
        </Breadcrumbs>
      }
    >
      <ProfileLayout {...props} />
    </WorkspaceAuthorizationLayout>
  );
};

const ProfileLayout: React.FC<Props> = ({ children, className }) => {
  const { memberRole } = useWorkspaceMyMembership();

  return (
    <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
      <ProfileSidebar />
      <div className="md:h-full w-full flex flex-col md:overflow-hidden">
        <ProfileNavbar memberRole={memberRole} />
        {memberRole.isOwner || memberRole.isMember || memberRole.isViewer ? (
          <div className={`md:h-full w-full overflow-hidden ${className}`}>{children}</div>
        ) : (
          <div className="h-full w-full grid place-items-center text-custom-text-200">
            You do not have the permission to access this page.
          </div>
        )}
      </div>
    </div>
  );
};
