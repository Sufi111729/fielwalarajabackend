import TopNav from "./components/TopNav";
import ToolsGridSection from "./components/ToolsGridSection";
import AppHeroStrip from "./components/AppHeroStrip";
import AppFooter from "./components/AppFooter";
export default function App() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <AppHeroStrip mode="home" />
        <ToolsGridSection />
      </main>
      <AppFooter />
    </>
  );
}
