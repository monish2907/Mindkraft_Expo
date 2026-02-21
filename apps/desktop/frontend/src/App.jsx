import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'

export default function App() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <div className="flex-1">
                <HomePage />
            </div>
            <Footer />
        </div>
    )
}
