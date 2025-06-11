import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./router/AppRoutes"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>

    </div>
  )
}

export default App
