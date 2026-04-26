import { useEffect } from "react";
import AddTaskModal from "./components/AddTaskModal";
import TopBar from "./components/TopBar";
import { useApp } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import TaskListPage from "./pages/TaskListPage";

function Banner() {
  const { state } = useApp();
  if (!state.error && !state.info) return null;

  return (
    <div className={`rounded-[22px] px-4 py-3 text-sm ${state.error ? "bg-rose/12 text-rose" : "bg-moss/12 text-moss"}`}>
      {state.error || state.info}
    </div>
  );
}

function AppShell() {
  const { state, dispatch, actions } = useApp();

  useEffect(() => {
    actions.hydrate();
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <TopBar
        currentPage={state.currentPage}
        onLogout={actions.logout}
        onOpenModal={() => dispatch({ type: "OPEN_MODAL", mode: "create" })}
        onPageChange={(page) => dispatch({ type: "SET_PAGE", page })}
        onRefresh={() => actions.hydrate()}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6">
        <Banner />
        {state.currentPage === "settings" ? <SettingsPage /> : <TaskListPage />}
      </main>

      <AddTaskModal
        mode={state.modal.mode}
        onClose={() => dispatch({ type: "CLOSE_MODAL" })}
        onSave={(task) => actions.saveTask(task, state.modal.mode, state.modal.task?.id)}
        open={state.modal.open}
        recentCategories={state.recentCategories}
        task={state.modal.task}
      />
    </div>
  );
}

export default function App() {
  const { state } = useApp();
  return state.token ? <AppShell /> : <LoginPage />;
}
