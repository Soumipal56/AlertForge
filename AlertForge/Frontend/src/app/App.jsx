import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md">
        <div className="text-2xl font-bold tracking-wider">
          AlertForge
        </div>
        <div className="flex items-center space-x-4">
          <Show when="signed-out">
            <div className="hover:text-pink-200 transition-colors cursor-pointer font-medium">
              <SignInButton mode="modal" />
            </div>
            <div className="bg-white text-purple-600 px-4 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors cursor-pointer shadow-sm">
              <SignUpButton mode="modal" />
            </div>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </header>
    </div>
  )
}

export default App