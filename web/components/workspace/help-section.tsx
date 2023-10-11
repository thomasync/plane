import React, { useRef, useState } from "react";
import Link from "next/link";
import { Transition } from "@headlessui/react";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// icons
import { Bolt, HelpOutlineOutlined, WestOutlined } from "@mui/icons-material";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { DocumentIcon, DiscordIcon, GithubIcon } from "components/icons";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface WorkspaceHelpSectionProps {
  setSidebarActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WorkspaceHelpSection: React.FC<WorkspaceHelpSectionProps> = ({ setSidebarActive }) => {
  const store: RootStore = useMobxStore();

  const [isNeedHelpOpen, setIsNeedHelpOpen] = useState(false);

  const helpOptionsRef = useRef<HTMLDivElement | null>(null);

  const helpOptions = [
    {
      name: store.locale.localized("Documentation"),
      href: "https://docs.plane.so/",
      Icon: DocumentIcon,
    },
    {
      name: store.locale.localized("Join our Discord"),
      href: "https://discord.com/invite/A92xrEGCge",
      Icon: DiscordIcon,
    },
    {
      name: store.locale.localized("Report a bug"),
      href: "https://github.com/makeplane/plane/issues/new/choose",
      Icon: GithubIcon,
    },
    {
      name: store.locale.localized("Chat with us"),
      href: null,
      onClick: () => (window as any).$crisp.push(["do", "chat:show"]),
      Icon: ChatBubbleOvalLeftEllipsisIcon,
    },
  ];

  useOutsideClickDetector(helpOptionsRef, () => setIsNeedHelpOpen(false));

  return (
    <>
      <div
        className={`flex w-full items-center justify-between gap-1 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 py-2 px-4 ${
          store?.theme?.sidebarCollapsed ? "flex-col" : ""
        }`}
      >
        {!store?.theme?.sidebarCollapsed && (
          <div className="w-1/2 text-center cursor-default rounded-md px-2.5 py-1.5 font-medium outline-none text-sm bg-green-500/10 text-green-500">
            {store.locale.localized("Free Plan")}
          </div>
        )}
        <div
          className={`flex items-center gap-1 ${
            store?.theme?.sidebarCollapsed ? "flex-col justify-center" : "justify-evenly w-1/2"
          }`}
        >
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "h",
              });
              document.dispatchEvent(e);
            }}
          >
            <Bolt fontSize="small" />
          </button>
          <button
            type="button"
            className={`grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => setIsNeedHelpOpen((prev) => !prev)}
          >
            <HelpOutlineOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className="grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none md:hidden"
            onClick={() => setSidebarActive(false)}
          >
            <WestOutlined fontSize="small" />
          </button>
          <button
            type="button"
            className={`hidden md:grid place-items-center rounded-md p-1.5 text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-90 outline-none ${
              store?.theme?.sidebarCollapsed ? "w-full" : ""
            }`}
            onClick={() => store.theme.setSidebarCollapsed(!store?.theme?.sidebarCollapsed)}
          >
            <WestOutlined
              fontSize="small"
              className={`duration-300 ${store?.theme?.sidebarCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="relative">
          <Transition
            show={isNeedHelpOpen}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div
              className={`absolute bottom-2 min-w-[10rem] ${
                store?.theme?.sidebarCollapsed ? "left-full" : "-left-[75px]"
              } rounded bg-custom-background-100 p-1 shadow-custom-shadow-xs whitespace-nowrap divide-y divide-custom-border-200`}
              ref={helpOptionsRef}
            >
              <div className="space-y-1 pb-2">
                {helpOptions.map(({ name, Icon, href, onClick }) => {
                  if (href)
                    return (
                      <Link href={href} key={name}>
                        <a
                          target="_blank"
                          className="flex items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
                        >
                          <div className="grid place-items-center flex-shrink-0">
                            <Icon className="text-custom-text-200 h-3.5 w-3.5" size={14} />
                          </div>
                          <span className="text-xs">{name}</span>
                        </a>
                      </Link>
                    );
                  else
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={onClick ?? undefined}
                        className="flex w-full items-center gap-x-2 rounded px-2 py-1 text-xs hover:bg-custom-background-80"
                      >
                        <div className="grid place-items-center flex-shrink-0">
                          <Icon className="text-custom-text-200 h-3.5 w-3.5" size={14} />
                        </div>
                        <span className="text-xs">{name}</span>
                      </button>
                    );
                })}
              </div>
              <div className="px-2 pt-2 pb-1 text-[10px]">Version: v{packageJson.version}</div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
};
