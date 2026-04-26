import { createContext, useContext, useEffect, useReducer } from "react";
import { api, storage } from "../api";

const AppContext = createContext(null);

const initialState = {
  token: storage.getToken(),
  currentPage: storage.getToken() ? "tasks" : "login",
  tasks: [],
  config: {},
  recentCategories: [],
  filters: {
    priority: "",
    category: ""
  },
  modal: {
    open: false,
    mode: "create",
    task: null
  },
  loading: false,
  error: "",
  info: ""
};

function uniqueCategories(tasks, existing = []) {
  return [...new Set([
    ...existing,
    ...tasks.map((task) => String(task.category || "").trim()).filter(Boolean)
  ])].slice(0, 8);
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: "", info: action.info || state.info };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error, info: "" };
    case "SET_INFO":
      return { ...state, loading: false, error: "", info: action.info };
    case "LOGIN_SUCCESS":
      return { ...state, token: action.token, currentPage: "tasks", error: "", info: "" };
    case "LOGOUT":
      return { ...initialState, token: "", currentPage: "login" };
    case "SET_PAGE":
      return { ...state, currentPage: action.page, error: "", info: "" };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case "LOAD_TASKS":
      return {
        ...state,
        loading: false,
        tasks: action.tasks,
        config: action.config ?? state.config,
        recentCategories: uniqueCategories(action.tasks, state.recentCategories),
        error: ""
      };
    case "LOAD_CONFIG":
      return { ...state, loading: false, config: action.config, error: "" };
    case "OPEN_MODAL":
      return { ...state, modal: { open: true, mode: action.mode, task: action.task || null } };
    case "CLOSE_MODAL":
      return { ...state, modal: { open: false, mode: "create", task: null } };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.token) storage.setToken(state.token);
    else storage.clearToken();
  }, [state.token]);

  async function login(passphrase) {
    dispatch({ type: "LOAD_START" });
    try {
      const data = await api.login(passphrase);
      dispatch({ type: "LOGIN_SUCCESS", token: data.token });
      storage.setToken(data.token);
      await hydrate(data.token);
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
    }
  }

  async function hydrate(tokenOverride = storage.getToken()) {
    if (!tokenOverride) return;

    dispatch({ type: "LOAD_START" });
    try {
      const [tasks, config] = await Promise.all([
        api.getTasks(state.filters),
        api.getConfig()
      ]);
      dispatch({ type: "LOAD_TASKS", tasks, config });
    } catch (error) {
      if (/token/i.test(error.message)) {
        dispatch({ type: "LOGOUT" });
      } else {
        dispatch({ type: "LOAD_ERROR", error: error.message });
      }
    }
  }

  async function applyFilters(filters) {
    dispatch({ type: "SET_FILTERS", filters });
    dispatch({ type: "LOAD_START" });
    try {
      const tasks = await api.getTasks({ ...state.filters, ...filters });
      dispatch({ type: "LOAD_TASKS", tasks });
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
    }
  }

  async function saveTask(task, mode = "create", id = null) {
    dispatch({ type: "LOAD_START" });
    try {
      if (mode === "edit" && id) {
        await api.updateTask(id, task);
      } else {
        await api.createTask(task);
      }
      dispatch({ type: "CLOSE_MODAL" });
      await hydrate();
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
      throw error;
    }
  }

  async function setTaskStatus(task, status) {
    return saveTask({ ...task, status }, "edit", task.id);
  }

  async function updateConfig(values) {
    dispatch({ type: "LOAD_START" });
    try {
      const config = await api.updateConfig(values);
      dispatch({ type: "LOAD_CONFIG", config });
      dispatch({ type: "SET_INFO", info: "Settings saved." });
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
    }
  }

  async function testPush() {
    dispatch({ type: "LOAD_START", info: "Sending test notification..." });
    try {
      const result = await api.testPush();
      dispatch({
        type: "SET_INFO",
        info: `Test push sent to ${result.sent_count} subscription${result.sent_count === 1 ? "" : "s"}.`
      });
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
    }
  }

  function logout() {
    dispatch({ type: "LOGOUT" });
  }

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        actions: {
          login,
          hydrate,
          applyFilters,
          saveTask,
          setTaskStatus,
          updateConfig,
          testPush,
          logout
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppProvider");
  return value;
}
