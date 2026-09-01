import { RouterProvider } from 'react-router-dom'
import { router } from './routers/app.router'
import { AuthProvider } from './features/auth/context/authContext'
import { ThemeProvider } from './hooks/useTheme'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App