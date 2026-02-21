import { useState } from 'react'

const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Explore', href: '#explore' },
    { label: 'Categories', href: '#categories' },
    { label: 'About', href: '#about' },
]

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <a href="#" className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2L2 6v8h4v-4h4v4h4V6L8 2z" fill="white" />
                            </svg>
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-gray-900">Mindkraft</span>
                    </a>

                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <a
                            href="#"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                            Sign In
                        </a>
                        <a
                            href="#"
                            className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            Get Started
                        </a>
                    </div>

                    <button
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            {mobileOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            }
                        </svg>
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2 transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="pt-2 flex gap-3">
                        <a href="#" className="text-sm font-medium text-gray-600 py-2">Sign In</a>
                        <a href="#" className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg">
                            Get Started
                        </a>
                    </div>
                </div>
            )}
        </header>
    )
}
