import { useSelector } from "react-redux";
import { Navigate } from "react-router";
import { selectIsAuthenticated, selectIsFetching } from "@/store/slices/authSlice";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isFetching = useSelector(selectIsFetching);

  // Still checking session — show spinner
  if (isFetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;