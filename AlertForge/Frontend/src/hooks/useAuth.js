import { useSelector } from "react-redux";
import { 
  selectUser, 
  selectIsAuthenticated, 
  selectIsFetching, 
  selectAuthLoading, 
  selectAuthError,
  selectApiKey
} from "@/store/slices/authSlice";

/**
 * Custom hook to access authentication state.
 */
export function useAuth() {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isFetching = useSelector(selectIsFetching);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const apiKey = useSelector(selectApiKey);

  return {
    user,
    isAuthenticated,
    isFetching,
    isLoading,
    error,
    apiKey,
  };
}
