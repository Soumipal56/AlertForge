import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import { routes } from "./app.routes";
import { RouterProvider } from "react-router";

function App() {
  return (
    <>
      {/* <header className="app-header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">AlertForge</span>
          </div>
          <div className="auth-actions">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-secondary">Log in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary">Sign up</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>
        </div>
      </header> */}
      <main className="app-content">
        <RouterProvider router={routes} />
      </main>
    </>
  )
}

export default App
