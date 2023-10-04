import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import pagesService from "services/pages.service";
// components
import { PagesView } from "components/pages";
// ui
import { EmptyState, Loader } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyPage from "public/empty-state/page.svg";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TPagesListProps } from "./types";
import { RecentPagesResponse } from "types";
// fetch-keys
import { RECENT_PAGES_LIST } from "constants/fetch-keys";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

export const RecentPagesList: React.FC<TPagesListProps> = ({ viewType }) => {
  const store: RootStore = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? RECENT_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => pagesService.getRecentPages(workspaceSlug as string, projectId as string)
      : null
  );

  const isEmpty = pages && Object.keys(pages).every((key) => pages[key].length === 0);

  return (
    <>
      {pages ? (
        Object.keys(pages).length > 0 && !isEmpty ? (
          Object.keys(pages).map((key) => {
            if (pages[key].length === 0) return null;

            return (
              <div key={key} className="h-full overflow-hidden">
                <h2 className="text-xl font-semibold capitalize mb-2">
                  {replaceUnderscoreIfSnakeCase(key)}
                </h2>
                <PagesView pages={pages[key as keyof RecentPagesResponse]} viewType={viewType} />
              </div>
            );
          })
        ) : (
          <EmptyState
            title={store.locale.localized("Have your thoughts in place")}
            description={store.locale.localized("You can think of Pages as an AI-powered notepad.")}
            image={emptyPage}
            primaryButton={{
              icon: <PlusIcon className="h-4 w-4" />,
              text: store.locale.localized("New Page"),
              onClick: () => {
                const e = new KeyboardEvent("keydown", {
                  key: "d",
                });
                document.dispatchEvent(e);
              },
            }}
          />
        )
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
};
