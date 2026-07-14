import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { QuizProvider } from "./contexts/QuizContext";
import Home from "./pages/Home";
import ModeSelect from "./pages/ModeSelect";
import PrefectureSelect from "./pages/PrefectureSelect";
import BlockSelect from "./pages/BlockSelect";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Browse from "./pages/Browse";
import ProportionalBrowse from "./pages/ProportionalBrowse";
import ProportionalQuiz from "./pages/ProportionalQuiz";
import SeatChart from "./pages/SeatChart";

// 地図データ(境界SVGパス)が重いので、/map を開いた時だけ読み込む
const SmdMap = lazy(() => import("./pages/SmdMap"));

function Router() {
  return (
    <Suspense fallback={null}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mode" component={ModeSelect} />
      <Route path="/mode/prefecture" component={PrefectureSelect} />
      <Route path="/mode/block" component={BlockSelect} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/result" component={Result} />
      <Route path="/browse" component={Browse} />
      <Route path="/browse/proportional" component={ProportionalBrowse} />
      <Route path="/quiz/proportional" component={ProportionalQuiz} />
      <Route path="/seats" component={SeatChart} />
      <Route path="/map" component={SmdMap} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <QuizProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallBanner />
        </TooltipProvider>
        </QuizProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
