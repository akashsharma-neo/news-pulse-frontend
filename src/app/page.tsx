import TabFeedPage from "@/components/TabFeedPage";

/**
 * Home page — today's exam CA feed.
 *
 * The feed page handles its own tab state, data fetching,
 * and infinite scroll internally.
 */
export default function Home() {
  return <TabFeedPage />;
}
