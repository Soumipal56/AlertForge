import './App.css'
import { routes } from "./app.routes";
import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMeThunk, selectIsFetching } from "@/store/slices/authSlice";

function App() {
  const dispatch = useDispatch();
  const isFetching = useSelector(selectIsFetching);

  useEffect(() => {
    dispatch(getMeThunk());
  }, [dispatch]);


  if (isFetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
        
      </div>
    );
  }

  return (
    <main className="app-content">
      <RouterProvider router={routes} />
    </main>
  );
}

export default App